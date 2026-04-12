from sqlalchemy.ext.asyncio import AsyncSession

from core.dependencies import check_server_permission, require_membership
from models.server import Role
from modules.servers.roles import repository
from modules.servers.roles.schemas import AssignRoleDTO, CreateRoleDTO, UpdateRoleDTO
from shared import exceptions
from shared.enums import ServerPermission

_DEFAULT_ROLES = {"Admin", "Member"}


async def list_roles(db: AsyncSession, server_id: str, user_id: str) -> list[Role]:
    await require_membership(db, server_id, user_id)
    return await repository.find_all_for_server(db, server_id)


async def create_role(
    db: AsyncSession, server_id: str, user_id: str, dto: CreateRoleDTO
) -> Role:
    await check_server_permission(db, server_id, user_id, ServerPermission.MANAGE_ROLES)
    return await repository.create_role(db, server_id, dto)


async def update_role(
    db: AsyncSession, server_id: str, role_id: str, user_id: str, dto: UpdateRoleDTO
) -> Role:
    await check_server_permission(db, server_id, user_id, ServerPermission.MANAGE_ROLES)
    role = await repository.find_by_id(db, role_id)
    if not role or role.server_id != server_id:
        raise exceptions.not_found("Rol no encontrado")
    if role.name in _DEFAULT_ROLES:
        raise exceptions.bad_request("No se pueden editar los roles predeterminados")
    return await repository.update_role(db, role, dto)


async def delete_role(db: AsyncSession, server_id: str, role_id: str, user_id: str) -> None:
    await check_server_permission(db, server_id, user_id, ServerPermission.MANAGE_ROLES)
    role = await repository.find_by_id(db, role_id)
    if not role or role.server_id != server_id:
        raise exceptions.not_found("Rol no encontrado")
    if role.name in _DEFAULT_ROLES:
        raise exceptions.bad_request("No se pueden eliminar los roles predeterminados")
    if role.members:
        raise exceptions.bad_request("No se puede eliminar un rol con miembros asignados")
    await repository.delete_role(db, role)


async def assign_role(
    db: AsyncSession, server_id: str, user_id: str, dto: AssignRoleDTO
) -> None:
    await check_server_permission(db, server_id, user_id, ServerPermission.MANAGE_ROLES)

    role = await repository.find_by_id(db, dto.role_id)
    if not role or role.server_id != server_id:
        raise exceptions.not_found("Rol no encontrado")

    member = await repository.get_member_by_id(db, dto.member_id)
    if not member or member.server_id != server_id:
        raise exceptions.not_found("Miembro no encontrado")

    await repository.assign_role(db, member, dto.role_id)
