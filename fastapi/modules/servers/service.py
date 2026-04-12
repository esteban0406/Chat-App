from sqlalchemy.ext.asyncio import AsyncSession

from core.dependencies import check_server_permission, require_membership
from models.server import Server
from modules.servers import repository
from modules.servers.schemas import CreateServerDTO, UpdateServerDTO
from shared import exceptions
from shared.enums import ServerPermission


async def create_server(db: AsyncSession, user_id: str, dto: CreateServerDTO) -> Server:
    return await repository.create(db, dto.name, dto.icon_url, user_id)


async def find_all_for_user(db: AsyncSession, user_id: str) -> list[Server]:
    return await repository.find_all_for_user(db, user_id)


async def find_one(db: AsyncSession, server_id: str, user_id: str) -> Server:
    await require_membership(db, server_id, user_id)
    server = await repository.find_by_id_full(db, server_id)
    if not server:
        raise exceptions.not_found("Servidor no encontrado")
    return server


async def update_server(
    db: AsyncSession, server_id: str, user_id: str, dto: UpdateServerDTO
) -> Server:
    await check_server_permission(db, server_id, user_id, ServerPermission.RENAME_SERVER)
    server = await repository.find_by_id(db, server_id)
    if not server:
        raise exceptions.not_found("Servidor no encontrado")
    return await repository.update(db, server, dto.name, dto.icon_url)


async def delete_server(db: AsyncSession, server_id: str, user_id: str) -> None:
    await check_server_permission(db, server_id, user_id, ServerPermission.DELETE_SERVER)
    server = await repository.find_by_id(db, server_id)
    if not server:
        raise exceptions.not_found("Servidor no encontrado")
    await repository.delete(db, server)


async def join_server(db: AsyncSession, server_id: str, user_id: str) -> Server:
    server = await repository.find_by_id(db, server_id)
    if not server:
        raise exceptions.not_found("Servidor no encontrado")

    existing = await repository.get_member(db, server_id, user_id)
    if existing:
        raise exceptions.bad_request("Ya eres miembro de este servidor")

    await repository.add_member(db, server_id, user_id)
    return await repository.find_by_id_full(db, server_id)


async def leave_server(db: AsyncSession, server_id: str, user_id: str) -> None:
    server = await repository.find_by_id(db, server_id)
    if not server:
        raise exceptions.not_found("Servidor no encontrado")
    if server.owner_id == user_id:
        raise exceptions.bad_request("El propietario no puede abandonar el servidor")

    member = await repository.get_member(db, server_id, user_id)
    if not member:
        raise exceptions.forbidden("No eres miembro de este servidor")

    await repository.delete_member(db, member)


async def remove_member(
    db: AsyncSession, server_id: str, member_id: str, requester_id: str
) -> None:
    await check_server_permission(db, server_id, requester_id, ServerPermission.REMOVE_MEMBER)

    target = await repository.get_member_by_id(db, member_id)
    if not target or target.server_id != server_id:
        raise exceptions.not_found("Miembro no encontrado")
    if target.user_id == requester_id:
        raise exceptions.bad_request("No puedes expulsarte a ti mismo")

    await repository.delete_member(db, target)
