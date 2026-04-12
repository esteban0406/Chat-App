from typing import Annotated, TYPE_CHECKING

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt.exceptions import InvalidTokenError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from core.database import get_db
from core.security import decode_token
from shared.enums import ServerPermission

if TYPE_CHECKING:
    from models.server import Member

bearer_scheme = HTTPBearer()


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(bearer_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    token = credentials.credentials
    try:
        payload = decode_token(token)
        user_id: str | None = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")
    except InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")

    # Import here to avoid circular import at module load time
    from models.user import User

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario no encontrado")

    return user


async def require_membership(
    db: AsyncSession,
    server_id: str,
    user_id: str,
) -> "Member":
    """Assert user is a member of the server. Returns the Member record."""
    from models.server import Server, Member
    from shared import exceptions

    server_result = await db.execute(select(Server).where(Server.id == server_id))
    if not server_result.scalar_one_or_none():
        raise exceptions.not_found("Servidor no encontrado")

    member_result = await db.execute(
        select(Member)
        .options(selectinload(Member.role))
        .where(Member.user_id == user_id, Member.server_id == server_id)
    )
    member = member_result.scalar_one_or_none()
    if not member:
        raise exceptions.forbidden("No eres miembro de este servidor")
    return member


async def check_server_permission(
    db: AsyncSession,
    server_id: str,
    user_id: str,
    required_permission: ServerPermission,
) -> "Member":
    """Assert user has a specific permission in the server. Server owner bypasses all checks."""
    from models.server import Server, Member
    from shared import exceptions

    server_result = await db.execute(select(Server).where(Server.id == server_id))
    server = server_result.scalar_one_or_none()
    if not server:
        raise exceptions.not_found("Servidor no encontrado")

    member_result = await db.execute(
        select(Member)
        .options(selectinload(Member.role))
        .where(Member.user_id == user_id, Member.server_id == server_id)
    )
    member = member_result.scalar_one_or_none()
    if not member:
        raise exceptions.forbidden("No eres miembro de este servidor")

    # Server owner bypasses all permission checks
    if server.owner_id == user_id:
        return member

    if not member.role or required_permission.value not in (member.role.permissions or []):
        raise exceptions.forbidden("No tienes permiso para realizar esta acción")

    return member
