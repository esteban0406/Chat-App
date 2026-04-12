from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.message import Message


async def find_by_id(db: AsyncSession, message_id: str) -> Message | None:
    result = await db.execute(
        select(Message)
        .options(selectinload(Message.author), selectinload(Message.channel))
        .where(Message.id == message_id)
    )
    return result.scalar_one_or_none()


async def find_paginated(
    db: AsyncSession,
    channel_id: str,
    limit: int,
    cursor: str | None = None,
) -> tuple[list[Message], bool]:
    """
    Returns (messages_in_chronological_order, has_more).

    Fetches newest-first using (created_at DESC, id DESC).
    If a cursor message ID is provided, only returns messages older than
    (or equal in time to) that message, excluding the cursor message itself.
    Fetches limit+1 rows to determine whether there are more pages.
    """
    query = select(Message).options(selectinload(Message.author)).where(
        Message.channel_id == channel_id
    )

    if cursor:
        cursor_msg_result = await db.execute(
            select(Message.created_at, Message.id).where(Message.id == cursor)
        )
        cursor_row = cursor_msg_result.first()
        if cursor_row:
            cursor_created_at, cursor_id = cursor_row
            query = query.where(
                and_(
                    Message.created_at <= cursor_created_at,
                    Message.id != cursor_id,
                )
            )

    query = query.order_by(Message.created_at.desc(), Message.id.desc()).limit(limit + 1)
    result = await db.execute(query)
    rows = list(result.scalars().all())

    has_more = len(rows) > limit
    if has_more:
        rows = rows[:limit]

    # Return in chronological order (oldest first)
    rows.reverse()
    return rows, has_more


async def create(
    db: AsyncSession, author_id: str, channel_id: str, content: str
) -> Message:
    message = Message(content=content.strip(), author_id=author_id, channel_id=channel_id)
    db.add(message)
    await db.commit()
    result = await db.execute(
        select(Message)
        .options(selectinload(Message.author))
        .where(Message.id == message.id)
    )
    return result.scalar_one()


async def update(db: AsyncSession, message: Message, content: str) -> Message:
    message.content = content.strip()
    await db.commit()
    await db.refresh(message)
    return message


async def delete(db: AsyncSession, message: Message) -> None:
    await db.delete(message)
    await db.commit()
