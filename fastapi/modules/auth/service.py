from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.security import create_access_token, hash_password, verify_password
from models.user import User
from modules.auth.schemas import LoginDTO, RegisterDTO, TokenResponse
from shared import exceptions
from shared.enums import UserStatus


async def register(db: AsyncSession, dto: RegisterDTO) -> TokenResponse:
    result = await db.execute(select(User).where(User.email == dto.email))
    if result.scalar_one_or_none():
        raise exceptions.conflict("El correo ya está en uso")

    result = await db.execute(select(User).where(User.username == dto.username))
    if result.scalar_one_or_none():
        raise exceptions.conflict("El nombre de usuario ya está en uso")

    user = User(
        email=dto.email,
        username=dto.username,
        password_hash=hash_password(dto.password),
        status=UserStatus.ONLINE,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_access_token({"sub": user.id, "email": user.email, "username": user.username})
    return TokenResponse(access_token=token)


async def login(db: AsyncSession, dto: LoginDTO) -> TokenResponse:
    result = await db.execute(select(User).where(User.email == dto.email))
    user = result.scalar_one_or_none()

    if not user or not user.password_hash or not verify_password(dto.password, user.password_hash):
        raise exceptions.bad_request("Credenciales inválidas")

    user.status = UserStatus.ONLINE
    await db.commit()

    token = create_access_token({"sub": user.id, "email": user.email, "username": user.username})
    return TokenResponse(access_token=token)


async def logout(db: AsyncSession, user: User) -> dict:
    user.status = UserStatus.OFFLINE
    await db.commit()
    return {"message": "Sesión cerrada exitosamente"}
