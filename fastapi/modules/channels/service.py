from sqlalchemy.ext.asyncio import AsyncSession

from core.dependencies import check_server_permission, require_membership
from models.channel import Channel
from modules.channels import repository
from modules.channels.schemas import CreateChannelDTO, UpdateChannelDTO
from shared import exceptions
from shared.enums import ServerPermission


async def create_channel(
    db: AsyncSession, server_id: str, user_id: str, dto: CreateChannelDTO
) -> Channel:
    await check_server_permission(db, server_id, user_id, ServerPermission.CREATE_CHANNEL)
    return await repository.create(db, server_id, dto.name, dto.type)


async def list_channels(db: AsyncSession, server_id: str, user_id: str) -> list[Channel]:
    await require_membership(db, server_id, user_id)
    return await repository.find_all_for_server(db, server_id)


async def get_channel(db: AsyncSession, server_id: str, channel_id: str, user_id: str) -> Channel:
    await require_membership(db, server_id, user_id)
    channel = await repository.find_by_id(db, channel_id)
    if not channel or channel.server_id != server_id:
        raise exceptions.not_found("Canal no encontrado")
    return channel


async def update_channel(
    db: AsyncSession, server_id: str, channel_id: str, user_id: str, dto: UpdateChannelDTO
) -> Channel:
    await require_membership(db, server_id, user_id)
    channel = await repository.find_by_id(db, channel_id)
    if not channel or channel.server_id != server_id:
        raise exceptions.not_found("Canal no encontrado")
    return await repository.update(db, channel, dto)


async def delete_channel(
    db: AsyncSession, server_id: str, channel_id: str, user_id: str
) -> None:
    await check_server_permission(db, server_id, user_id, ServerPermission.DELETE_CHANNEL)
    channel = await repository.find_by_id(db, channel_id)
    if not channel or channel.server_id != server_id:
        raise exceptions.not_found("Canal no encontrado")

    count = await repository.count_server_channels(db, server_id)
    if count <= 1:
        raise exceptions.bad_request("No puedes eliminar el último canal del servidor")

    await repository.delete(db, channel)
