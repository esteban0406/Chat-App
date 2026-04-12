from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.server import Member, Role
from modules.servers.roles.schemas import CreateRoleDTO, UpdateRoleDTO


async def find_all_for_server(db: AsyncSession, server_id: str) -> list[Role]:
    result = await db.execute(
        select(Role)
        .options(selectinload(Role.members))
        .where(Role.server_id == server_id)
        .order_by(Role.created_at)
    )
    return list(result.scalars().all())


async def find_by_id(db: AsyncSession, role_id: str) -> Role | None:
    result = await db.execute(
        select(Role)
        .options(selectinload(Role.members))
        .where(Role.id == role_id)
    )
    return result.scalar_one_or_none()


async def create_role(db: AsyncSession, server_id: str, dto: CreateRoleDTO) -> Role:
    role = Role(
        name=dto.name.strip(),
        color=dto.color,
        server_id=server_id,
        permissions=[p.value for p in dto.permissions],
    )
    db.add(role)
    await db.commit()
    await db.refresh(role)
    return role


async def update_role(db: AsyncSession, role: Role, dto: UpdateRoleDTO) -> Role:
    if dto.name is not None:
        role.name = dto.name.strip()
    if dto.color is not None:
        role.color = dto.color
    if dto.permissions is not None:
        role.permissions = [p.value for p in dto.permissions]
    await db.commit()
    await db.refresh(role)
    return role


async def delete_role(db: AsyncSession, role: Role) -> None:
    await db.delete(role)
    await db.commit()


async def get_member_by_id(db: AsyncSession, member_id: str) -> Member | None:
    result = await db.execute(
        select(Member).options(selectinload(Member.role)).where(Member.id == member_id)
    )
    return result.scalar_one_or_none()


async def assign_role(db: AsyncSession, member: Member, role_id: str) -> Member:
    member.role_id = role_id
    await db.commit()
    await db.refresh(member)
    return member
