from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.friendship import Friendship
from shared.enums import RequestStatus


async def find_by_id(db: AsyncSession, friendship_id: str) -> Friendship | None:
    result = await db.execute(
        select(Friendship)
        .options(selectinload(Friendship.sender), selectinload(Friendship.receiver))
        .where(Friendship.id == friendship_id)
    )
    return result.scalar_one_or_none()


async def find_existing(db: AsyncSession, user_id: str, other_id: str) -> Friendship | None:
    result = await db.execute(
        select(Friendship).where(
            or_(
                and_(Friendship.sender_id == user_id, Friendship.receiver_id == other_id),
                and_(Friendship.sender_id == other_id, Friendship.receiver_id == user_id),
            )
        )
    )
    return result.scalar_one_or_none()


async def get_friends(db: AsyncSession, user_id: str) -> list[Friendship]:
    result = await db.execute(
        select(Friendship)
        .options(selectinload(Friendship.sender), selectinload(Friendship.receiver))
        .where(
            and_(
                or_(Friendship.sender_id == user_id, Friendship.receiver_id == user_id),
                Friendship.status == RequestStatus.ACCEPTED,
            )
        )
    )
    return list(result.scalars().all())


async def get_pending(db: AsyncSession, user_id: str) -> list[Friendship]:
    result = await db.execute(
        select(Friendship)
        .options(selectinload(Friendship.sender), selectinload(Friendship.receiver))
        .where(
            and_(
                Friendship.receiver_id == user_id,
                Friendship.status == RequestStatus.PENDING,
            )
        )
    )
    return list(result.scalars().all())


async def get_sent(db: AsyncSession, user_id: str) -> list[Friendship]:
    result = await db.execute(
        select(Friendship)
        .options(selectinload(Friendship.sender), selectinload(Friendship.receiver))
        .where(
            and_(
                Friendship.sender_id == user_id,
                Friendship.status == RequestStatus.PENDING,
            )
        )
    )
    return list(result.scalars().all())


async def create(db: AsyncSession, sender_id: str, receiver_id: str) -> Friendship:
    friendship = Friendship(sender_id=sender_id, receiver_id=receiver_id)
    db.add(friendship)
    await db.commit()
    # Reload with relationships
    result = await db.execute(
        select(Friendship)
        .options(selectinload(Friendship.sender), selectinload(Friendship.receiver))
        .where(Friendship.id == friendship.id)
    )
    return result.scalar_one()


async def update_status(
    db: AsyncSession, friendship: Friendship, status: RequestStatus
) -> Friendship:
    friendship.status = status
    await db.commit()
    await db.refresh(friendship)
    return friendship


async def delete(db: AsyncSession, friendship: Friendship) -> None:
    await db.delete(friendship)
    await db.commit()
