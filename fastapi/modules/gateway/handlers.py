from urllib.parse import parse_qs

import jwt
from sqlalchemy import and_, or_, select

from core.config import settings
from core.database import AsyncSessionLocal
from models.friendship import Friendship
from models.user import User
from modules.gateway.socket import emit_to_user, sio, socket_user, user_sockets
from modules.messages import repository as messages_repo
from shared.enums import RequestStatus, UserStatus

ALGORITHM = "HS256"


def _extract_token(environ: dict) -> str | None:
    qs = parse_qs(environ.get("QUERY_STRING", ""))
    tokens = qs.get("token", [])
    return tokens[0] if tokens else None


async def _get_user_id(token: str) -> str | None:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[ALGORITHM])
        return payload.get("sub")
    except Exception:
        return None


async def _set_user_status(user_id: str, status: UserStatus) -> None:
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if user:
            user.status = status
            await db.commit()


async def _notify_friends_status(user_id: str, status: UserStatus) -> None:
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Friendship).where(
                and_(
                    or_(Friendship.sender_id == user_id, Friendship.receiver_id == user_id),
                    Friendship.status == RequestStatus.ACCEPTED,
                )
            )
        )
        friendships = list(result.scalars().all())

    for f in friendships:
        friend_id = f.receiver_id if f.sender_id == user_id else f.sender_id
        await emit_to_user(
            friend_id, "user:statusChanged", {"userId": user_id, "status": status.value}
        )


@sio.event
async def connect(sid: str, environ: dict, auth: dict | None = None):
    token = _extract_token(environ)
    if not token:
        return False

    user_id = await _get_user_id(token)
    if not user_id:
        return False

    socket_user[sid] = user_id
    if user_id not in user_sockets:
        user_sockets[user_id] = set()

    is_first = len(user_sockets[user_id]) == 0
    user_sockets[user_id].add(sid)

    await sio.enter_room(sid, f"user:{user_id}")

    if is_first:
        await _set_user_status(user_id, UserStatus.ONLINE)
        await _notify_friends_status(user_id, UserStatus.ONLINE)


@sio.event
async def disconnect(sid: str):
    user_id = socket_user.pop(sid, None)
    if not user_id:
        return

    user_sockets.get(user_id, set()).discard(sid)
    if not user_sockets.get(user_id):
        user_sockets.pop(user_id, None)
        await _set_user_status(user_id, UserStatus.OFFLINE)
        await _notify_friends_status(user_id, UserStatus.OFFLINE)


@sio.event
async def joinChannel(sid: str, channel_id: str):
    await sio.enter_room(sid, channel_id)
    await sio.save_session(sid, {"channel_id": channel_id})
    return True


@sio.event
async def leaveChannel(sid: str, channel_id: str | None = None):
    session = await sio.get_session(sid)
    target = channel_id or session.get("channel_id")
    if target:
        await sio.leave_room(sid, target)
        if session.get("channel_id") == target:
            await sio.save_session(sid, {"channel_id": None})
    return True


@sio.event
async def message(sid: str, data: dict):
    channel_id = data.get("channelId")
    sender_id = data.get("senderId")
    text = data.get("text", "")
    if not channel_id or not sender_id:
        return

    async with AsyncSessionLocal() as db:
        msg = await messages_repo.create(db, sender_id, channel_id, text)

    await sio.emit(
        "message",
        {
            "id": msg.id,
            "content": msg.content,
            "channelId": msg.channel_id,
            "authorId": msg.author_id,
            "createdAt": msg.created_at.isoformat(),
            "updatedAt": msg.updated_at.isoformat(),
        },
        room=channel_id,
    )
