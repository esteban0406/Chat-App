from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from core.database import get_db
from core.dependencies import get_current_user
from models.user import User
from modules.messages import service
from modules.messages.schemas import (
    CreateMessageDTO,
    MessageResponse,
    PaginatedMessagesResponse,
    UpdateMessageDTO,
)
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/messages", tags=["messages"])

DbDep = Annotated[AsyncSession, Depends(get_db)]
CurrentUserDep = Annotated[User, Depends(get_current_user)]


@router.post("", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def create_message(dto: CreateMessageDTO, db: DbDep, current_user: CurrentUserDep):
    return await service.create_message(db, current_user.id, dto)


@router.get("/channel/{channel_id}", response_model=PaginatedMessagesResponse)
async def list_messages(
    channel_id: str,
    db: DbDep,
    current_user: CurrentUserDep,
    limit: int = Query(default=50, ge=1, le=100),
    cursor: str | None = Query(default=None),
):
    return await service.list_messages(db, channel_id, current_user.id, limit, cursor)


@router.get("/{message_id}", response_model=MessageResponse)
async def get_message(message_id: str, db: DbDep, current_user: CurrentUserDep):
    return await service.get_message(db, message_id, current_user.id)


@router.patch("/{message_id}", response_model=MessageResponse)
async def update_message(
    message_id: str, dto: UpdateMessageDTO, db: DbDep, current_user: CurrentUserDep
):
    return await service.update_message(db, message_id, current_user.id, dto)


@router.delete("/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_message(message_id: str, db: DbDep, current_user: CurrentUserDep):
    await service.delete_message(db, message_id, current_user.id)
