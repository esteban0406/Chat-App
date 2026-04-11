from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.dependencies import get_current_user
from models.user import User
from modules.users import service
from modules.users.schemas import UpdateStatusDTO, UpdateUserDTO, UserResponse

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("", response_model=list[UserResponse])
async def get_users(db: AsyncSession = Depends(get_db)):
    return await service.find_all(db)


# /me and /search must be registered BEFORE /{user_id} to avoid path collision
@router.get("/search", response_model=list[UserResponse])
async def search_users(username: str = Query(...), db: AsyncSession = Depends(get_db)):
    return await service.search_by_username(db, username)


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserResponse)
async def update_me(
    dto: UpdateUserDTO,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await service.update(db, current_user, dto)


@router.patch("/me/status", response_model=UserResponse)
async def update_status(
    dto: UpdateStatusDTO,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await service.update_status(db, current_user, dto)


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: str, db: AsyncSession = Depends(get_db)):
    return await service.find_one(db, user_id)
