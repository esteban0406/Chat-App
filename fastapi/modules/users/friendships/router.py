from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.dependencies import get_current_user
from models.user import User
from modules.users.friendships import service
from modules.users.friendships.schemas import (
    FriendshipResponse,
    RespondRequestDTO,
    SendRequestDTO,
)

router = APIRouter(prefix="/friendships", tags=["Friendships"])

DbDep = Annotated[AsyncSession, Depends(get_db)]
CurrentUserDep = Annotated[User, Depends(get_current_user)]


@router.get("", response_model=list[FriendshipResponse])
async def get_friends(current_user: CurrentUserDep, db: DbDep):
    return await service.get_friends(db, current_user)


@router.get("/pending", response_model=list[FriendshipResponse])
async def get_pending(current_user: CurrentUserDep, db: DbDep):
    return await service.get_pending(db, current_user)


@router.get("/sent", response_model=list[FriendshipResponse])
async def get_sent(current_user: CurrentUserDep, db: DbDep):
    return await service.get_sent(db, current_user)


@router.post("", response_model=FriendshipResponse, status_code=201)
async def send_request(dto: SendRequestDTO, current_user: CurrentUserDep, db: DbDep):
    return await service.send_request(db, current_user, dto)


@router.patch("/{friendship_id}", response_model=FriendshipResponse)
async def respond_to_request(
    friendship_id: str,
    dto: RespondRequestDTO,
    current_user: CurrentUserDep,
    db: DbDep,
):
    return await service.respond_to_request(db, current_user, friendship_id, dto)


# /cancel must be registered BEFORE /{friendship_id} DELETE to avoid path collision
@router.delete("/{friendship_id}/cancel")
async def cancel_request(friendship_id: str, current_user: CurrentUserDep, db: DbDep):
    return await service.cancel_request(db, current_user, friendship_id)


@router.delete("/{friendship_id}")
async def remove_friend(friendship_id: str, current_user: CurrentUserDep, db: DbDep):
    return await service.remove_friend(db, current_user, friendship_id)
