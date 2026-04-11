from sqlalchemy.ext.asyncio import AsyncSession

from models.user import User
from modules.users import repository
from modules.users.schemas import UpdateStatusDTO, UpdateUserDTO
from shared import exceptions


async def find_all(db: AsyncSession) -> list[User]:
    return await repository.find_all(db)


async def search_by_username(db: AsyncSession, username: str) -> list[User]:
    return await repository.search_by_username(db, username)


async def find_one(db: AsyncSession, user_id: str) -> User:
    user = await repository.find_by_id(db, user_id)
    if not user:
        raise exceptions.not_found("Usuario no encontrado")
    return user


async def update(db: AsyncSession, current_user: User, dto: UpdateUserDTO) -> User:
    updates: dict = {}

    if dto.username is not None:
        existing = await repository.find_by_username(db, dto.username)
        if existing and existing.id != current_user.id:
            raise exceptions.conflict("El nombre de usuario ya está en uso")
        updates["username"] = dto.username

    if dto.email is not None:
        existing = await repository.find_by_email(db, str(dto.email))
        if existing and existing.id != current_user.id:
            raise exceptions.conflict("El correo ya está en uso")
        updates["email"] = str(dto.email)

    if not updates:
        return current_user

    return await repository.update(db, current_user, **updates)


async def update_status(db: AsyncSession, current_user: User, dto: UpdateStatusDTO) -> User:
    return await repository.update(db, current_user, status=dto.status)
