import socketio

from core.config import settings

sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins=settings.CORS_ORIGIN.split(","),
    logger=False,
    engineio_logger=False,
)

# In-memory presence tracking
socket_user: dict[str, str] = {}        # sid -> user_id
user_sockets: dict[str, set[str]] = {}  # user_id -> set of sids


async def emit_to_user(user_id: str, event: str, data: object) -> None:
    await sio.emit(event, data, room=f"user:{user_id}")


async def emit_to_channel(channel_id: str, event: str, data: object) -> None:
    await sio.emit(event, data, room=channel_id)


async def broadcast(event: str, data: object) -> None:
    await sio.emit(event, data)
