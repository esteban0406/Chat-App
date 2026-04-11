from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.dependencies import get_current_user
from models.user import User
from modules.auth import service
from modules.auth.schemas import LoginDTO, RegisterDTO, TokenResponse, UserResponse

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(dto: RegisterDTO, db: AsyncSession = Depends(get_db)):
    return await service.register(db, dto)


@router.post("/login", response_model=TokenResponse)
async def login(dto: LoginDTO, db: AsyncSession = Depends(get_db)):
    return await service.login(db, dto)


@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await service.logout(db, current_user)


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user
