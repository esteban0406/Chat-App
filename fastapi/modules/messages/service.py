from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.message import Message
from modules.gateway.socket import emit_to_channel
from modules.messages import repository
from modules.messages.schemas import CreateMessageDTO, PaginatedMessagesResponse, UpdateMessageDTO
from shared import exceptions


async def _get_channel_server_id(db: AsyncSession, channel_id: str) -> str | None:
    from models.channel import Channel
    result = await db.execute(select(Channel.server_id).where(Channel.id == channel_id))
    return result.scalar_one_or_none()


async def _is_member(db: AsyncSession, server_id: str, user_id: str) -> bool:
    from models.server import Member
    result = await db.execute(
        select(Member).where(Member.server_id == server_id, Member.user_id == user_id)
    )
    return result.scalar_one_or_none() is not None


async def _get_server_owner_id(db: AsyncSession, server_id: str) -> str | None:
    from models.server import Server
    result = await db.execute(select(Server.owner_id).where(Server.id == server_id))
    return result.scalar_one_or_none()


async def create_message(
    db: AsyncSession, user_id: str, dto: CreateMessageDTO
) -> Message:
    server_id = await _get_channel_server_id(db, dto.channel_id)
    if not server_id:
        raise exceptions.not_found("Canal no encontrado")
    if not await _is_member(db, server_id, user_id):
        raise exceptions.forbidden("No eres miembro de este servidor")

    message = await repository.create(db, user_id, dto.channel_id, dto.content)
    await emit_to_channel(message.channel_id, "message", {
        "id": message.id,
        "content": message.content,
        "channelId": message.channel_id,
        "authorId": message.author_id,
        "createdAt": message.created_at.isoformat(),
        "updatedAt": message.updated_at.isoformat(),
    })
    return message


async def list_messages(
    db: AsyncSession,
    channel_id: str,
    user_id: str,
    limit: int = 50,
    cursor: str | None = None,
) -> PaginatedMessagesResponse:
    server_id = await _get_channel_server_id(db, channel_id)
    if not server_id:
        raise exceptions.not_found("Canal no encontrado")
    if not await _is_member(db, server_id, user_id):
        raise exceptions.forbidden("No eres miembro de este servidor")

    messages, has_more = await repository.find_paginated(db, channel_id, limit, cursor)
    next_cursor = messages[0].id if has_more and messages else None
    return PaginatedMessagesResponse(messages=messages, next_cursor=next_cursor, has_more=has_more)


async def get_message(db: AsyncSession, message_id: str, user_id: str) -> Message:
    message = await repository.find_by_id(db, message_id)
    if not message:
        raise exceptions.not_found("Mensaje no encontrado")
    server_id = await _get_channel_server_id(db, message.channel_id)
    if not server_id or not await _is_member(db, server_id, user_id):
        raise exceptions.forbidden("No eres miembro de este servidor")
    return message


async def update_message(
    db: AsyncSession, message_id: str, user_id: str, dto: UpdateMessageDTO
) -> Message:
    message = await repository.find_by_id(db, message_id)
    if not message:
        raise exceptions.not_found("Mensaje no encontrado")
    if message.author_id != user_id:
        raise exceptions.forbidden("Solo el autor puede editar este mensaje")
    return await repository.update(db, message, dto.content)


async def delete_message(db: AsyncSession, message_id: str, user_id: str) -> None:
    message = await repository.find_by_id(db, message_id)
    if not message:
        raise exceptions.not_found("Mensaje no encontrado")

    server_id = await _get_channel_server_id(db, message.channel_id)
    owner_id = await _get_server_owner_id(db, server_id) if server_id else None

    if message.author_id != user_id and owner_id != user_id:
        raise exceptions.forbidden("No tienes permiso para eliminar este mensaje")

    await repository.delete(db, message)
