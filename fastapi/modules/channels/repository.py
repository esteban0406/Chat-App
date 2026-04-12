from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.channel import Channel
from modules.channels.schemas import UpdateChannelDTO
from shared.enums import ChannelType


async def find_all_for_server(db: AsyncSession, server_id: str) -> list[Channel]:
    result = await db.execute(
        select(Channel)
        .where(Channel.server_id == server_id)
        .order_by(Channel.created_at.asc())
    )
    return list(result.scalars().all())


async def find_by_id(db: AsyncSession, channel_id: str) -> Channel | None:
    result = await db.execute(
        select(Channel)
        .options(selectinload(Channel.server))
        .where(Channel.id == channel_id)
    )
    return result.scalar_one_or_none()


async def count_server_channels(db: AsyncSession, server_id: str) -> int:
    result = await db.execute(
        select(func.count()).select_from(Channel).where(Channel.server_id == server_id)
    )
    return result.scalar_one()


async def create(
    db: AsyncSession, server_id: str, name: str, type: ChannelType
) -> Channel:
    channel = Channel(name=name.strip(), server_id=server_id, type=type)
    db.add(channel)
    await db.commit()
    await db.refresh(channel)
    return channel


async def update(db: AsyncSession, channel: Channel, dto: UpdateChannelDTO) -> Channel:
    if dto.name is not None:
        channel.name = dto.name.strip()
    if dto.type is not None:
        channel.type = dto.type
    await db.commit()
    await db.refresh(channel)
    return channel


async def delete(db: AsyncSession, channel: Channel) -> None:
    await db.delete(channel)
    await db.commit()
