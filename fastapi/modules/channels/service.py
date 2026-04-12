from sqlalchemy.ext.asyncio import AsyncSession

from core.dependencies import check_server_permission, require_membership
from models.channel import Channel
from modules.channels import repository
from modules.channels.schemas import CreateChannelDTO, UpdateChannelDTO
from modules.gateway.socket import emit_to_user
from modules.servers import repository as servers_repository
from shared import exceptions
from shared.enums import ServerPermission


async def create_channel(
    db: AsyncSession, server_id: str, user_id: str, dto: CreateChannelDTO
) -> Channel:
    await check_server_permission(db, server_id, user_id, ServerPermission.CREATE_CHANNEL)
    channel = await repository.create(db, server_id, dto.name, dto.type)
    member_ids = await servers_repository.get_member_ids(db, server_id)
    for uid in member_ids:
        await emit_to_user(uid, "channel:created", {
            "id": channel.id,
            "name": channel.name,
            "type": channel.type.value,
            "serverId": channel.server_id,
        })
    return channel


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
    channel = await repository.update(db, channel, dto)
    member_ids = await servers_repository.get_member_ids(db, server_id)
    for uid in member_ids:
        await emit_to_user(uid, "channel:updated", {
            "id": channel.id,
            "name": channel.name,
            "type": channel.type.value,
            "serverId": channel.server_id,
        })
    return channel


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

    member_ids = await servers_repository.get_member_ids(db, server_id)
    await repository.delete(db, channel)
    for uid in member_ids:
        await emit_to_user(uid, "channel:deleted", {"channelId": channel_id, "serverId": server_id})
