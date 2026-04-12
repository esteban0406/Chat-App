
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.channel import Channel
from models.server import Member, Role, Server
from shared.enums import ChannelType, ServerPermission


def _server_full_options() -> list:
    return [
        selectinload(Server.owner),
        selectinload(Server.channels),
        selectinload(Server.roles),
        selectinload(Server.members).selectinload(Member.user),
        selectinload(Server.members).selectinload(Member.role),
    ]


async def find_by_id(db: AsyncSession, server_id: str) -> Server | None:
    result = await db.execute(select(Server).where(Server.id == server_id))
    return result.scalar_one_or_none()


async def find_by_id_full(db: AsyncSession, server_id: str) -> Server | None:
    result = await db.execute(
        select(Server).options(*_server_full_options()
                               ).where(Server.id == server_id)
    )
    return result.scalar_one_or_none()


async def find_all_for_user(db: AsyncSession, user_id: str) -> list[Server]:
    result = await db.execute(
        select(Server)
        .join(Member, Member.server_id == Server.id)
        .where(Member.user_id == user_id)
        .options(*_server_full_options())
    )
    return list(result.scalars().unique().all())


async def create(
    db: AsyncSession,
    name: str,
    icon_url: str | None,
    owner_id: str,
) -> Server:
    all_permissions = [p.value for p in ServerPermission]

    server = Server(name=name.strip(), icon_url=icon_url, owner_id=owner_id)
    db.add(server)
    await db.flush()

    admin_role = Role(
        name="Admin",
        server_id=server.id,
        permissions=all_permissions,
    )
    member_role = Role(
        name="Member",
        server_id=server.id,
        permissions=[],
    )
    db.add(admin_role)
    db.add(member_role)
    await db.flush()

    general_channel = Channel(
        name="general",
        server_id=server.id,
        type=ChannelType.TEXT,
    )
    db.add(general_channel)

    owner_member = Member(
        user_id=owner_id,
        server_id=server.id,
        role_id=admin_role.id,
    )
    db.add(owner_member)
    await db.commit()

    return await find_by_id_full(db, server.id)


async def update(db: AsyncSession, server: Server, name: str | None, icon_url: str | None) -> Server:
    if name is not None:
        server.name = name.strip()
    if icon_url is not None:
        server.icon_url = icon_url
    await db.commit()
    return await find_by_id_full(db, server.id)


async def delete(db: AsyncSession, server: Server) -> None:
    await db.delete(server)
    await db.commit()


async def get_member_by_id(db: AsyncSession, member_id: str) -> Member | None:
    result = await db.execute(
        select(Member)
        .options(selectinload(Member.role))
        .where(Member.id == member_id)
    )
    return result.scalar_one_or_none()


async def get_member(db: AsyncSession, server_id: str, user_id: str) -> Member | None:
    result = await db.execute(
        select(Member).where(Member.server_id ==
                             server_id, Member.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def get_default_member_role(db: AsyncSession, server_id: str) -> Role | None:
    result = await db.execute(
        select(Role).where(Role.server_id == server_id, Role.name == "Member")
    )
    return result.scalar_one_or_none()


async def add_member(db: AsyncSession, server_id: str, user_id: str) -> Member:
    member_role = await get_default_member_role(db, server_id)
    member = Member(
        user_id=user_id,
        server_id=server_id,
        role_id=member_role.id if member_role else None,
    )
    db.add(member)
    await db.commit()
    return member


async def delete_member(db: AsyncSession, member: Member) -> None:
    await db.delete(member)
    await db.commit()


async def get_member_ids(db: AsyncSession, server_id: str) -> list[str]:
    result = await db.execute(
        select(Member.user_id).where(Member.server_id == server_id)
    )
    return list(result.scalars().all())
