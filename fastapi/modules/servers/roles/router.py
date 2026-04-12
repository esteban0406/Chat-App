from typing import Annotated

from fastapi import APIRouter, Depends, status

from core.database import get_db
from core.dependencies import get_current_user
from models.user import User
from modules.servers.roles import service
from modules.servers.roles.schemas import AssignRoleDTO, CreateRoleDTO, UpdateRoleDTO
from modules.servers.schemas import RoleResponse
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/servers/{server_id}/roles", tags=["roles"])

DbDep = Annotated[AsyncSession, Depends(get_db)]
CurrentUserDep = Annotated[User, Depends(get_current_user)]


@router.get("", response_model=list[RoleResponse])
async def list_roles(server_id: str, db: DbDep, current_user: CurrentUserDep):
    return await service.list_roles(db, server_id, current_user.id)


@router.post("", response_model=RoleResponse, status_code=status.HTTP_201_CREATED)
async def create_role(
    server_id: str, dto: CreateRoleDTO, db: DbDep, current_user: CurrentUserDep
):
    return await service.create_role(db, server_id, current_user.id, dto)


@router.patch("/{role_id}", response_model=RoleResponse)
async def update_role(
    server_id: str, role_id: str, dto: UpdateRoleDTO, db: DbDep, current_user: CurrentUserDep
):
    return await service.update_role(db, server_id, role_id, current_user.id, dto)


@router.delete("/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_role(server_id: str, role_id: str, db: DbDep, current_user: CurrentUserDep):
    await service.delete_role(db, server_id, role_id, current_user.id)


@router.post("/assign", status_code=status.HTTP_204_NO_CONTENT)
async def assign_role(
    server_id: str, dto: AssignRoleDTO, db: DbDep, current_user: CurrentUserDep
):
    await service.assign_role(db, server_id, current_user.id, dto)
