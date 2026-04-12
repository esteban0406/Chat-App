from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.server import Member, Role, Server
from models.server_invite import ServerInvite
from models.user import User
from shared.enums import RequestStatus


def _invite_full_options() -> list:
    return [
        selectinload(ServerInvite.sender),
        selectinload(ServerInvite.receiver),
        selectinload(ServerInvite.server).selectinload(Server.owner),
        selectinload(ServerInvite.server).selectinload(Server.channels),
        selectinload(ServerInvite.server).selectinload(Server.roles),
        selectinload(ServerInvite.server).selectinload(Server.members).selectinload(Member.user),
        selectinload(ServerInvite.server).selectinload(Server.members).selectinload(Member.role),
    ]


async def find_by_id(db: AsyncSession, invite_id: str) -> ServerInvite | None:
    result = await db.execute(
        select(ServerInvite)
        .options(*_invite_full_options())
        .where(ServerInvite.id == invite_id)
    )
    return result.scalar_one_or_none()


async def find_pending_received(db: AsyncSession, user_id: str) -> list[ServerInvite]:
    result = await db.execute(
        select(ServerInvite)
        .options(*_invite_full_options())
        .where(
            and_(
                ServerInvite.receiver_id == user_id,
                ServerInvite.status == RequestStatus.PENDING,
            )
        )
        .order_by(ServerInvite.created_at.desc())
    )
    return list(result.scalars().all())


async def find_pending_sent(db: AsyncSession, user_id: str) -> list[ServerInvite]:
    result = await db.execute(
        select(ServerInvite)
        .options(*_invite_full_options())
        .where(
            and_(
                ServerInvite.sender_id == user_id,
                ServerInvite.status == RequestStatus.PENDING,
            )
        )
        .order_by(ServerInvite.created_at.desc())
    )
    return list(result.scalars().all())


async def find_existing_pending(
    db: AsyncSession, sender_id: str, receiver_id: str, server_id: str
) -> ServerInvite | None:
    result = await db.execute(
        select(ServerInvite).where(
            and_(
                ServerInvite.sender_id == sender_id,
                ServerInvite.receiver_id == receiver_id,
                ServerInvite.server_id == server_id,
                ServerInvite.status == RequestStatus.PENDING,
            )
        )
    )
    return result.scalar_one_or_none()


async def get_member(db: AsyncSession, server_id: str, user_id: str) -> Member | None:
    result = await db.execute(
        select(Member).where(Member.server_id == server_id, Member.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def get_user_by_id(db: AsyncSession, user_id: str) -> User | None:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def get_default_member_role(db: AsyncSession, server_id: str) -> Role | None:
    result = await db.execute(
        select(Role).where(Role.server_id == server_id, Role.name == "Member")
    )
    return result.scalar_one_or_none()


async def create(
    db: AsyncSession, sender_id: str, receiver_id: str, server_id: str
) -> ServerInvite:
    invite = ServerInvite(sender_id=sender_id, receiver_id=receiver_id, server_id=server_id)
    db.add(invite)
    await db.commit()
    result = await db.execute(
        select(ServerInvite)
        .options(*_invite_full_options())
        .where(ServerInvite.id == invite.id)
    )
    return result.scalar_one()


async def update_status(
    db: AsyncSession, invite: ServerInvite, status: RequestStatus
) -> ServerInvite:
    invite.status = status
    await db.commit()
    await db.refresh(invite)
    return invite


async def delete(db: AsyncSession, invite: ServerInvite) -> None:
    await db.delete(invite)
    await db.commit()


async def add_member_to_server(
    db: AsyncSession, server_id: str, user_id: str
) -> None:
    member_role = await get_default_member_role(db, server_id)
    member = Member(
        user_id=user_id,
        server_id=server_id,
        role_id=member_role.id if member_role else None,
    )
    db.add(member)
    await db.flush()
