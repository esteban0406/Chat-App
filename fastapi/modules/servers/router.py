from typing import Annotated

from fastapi import APIRouter, Depends, status

from core.database import get_db
from core.dependencies import get_current_user
from models.user import User
from modules.servers import service
from modules.servers.schemas import CreateServerDTO, ServerResponse, UpdateServerDTO
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/servers", tags=["servers"])

DbDep = Annotated[AsyncSession, Depends(get_db)]
CurrentUserDep = Annotated[User, Depends(get_current_user)]


@router.post("", response_model=ServerResponse, status_code=status.HTTP_201_CREATED)
async def create_server(dto: CreateServerDTO, db: DbDep, current_user: CurrentUserDep):
    return await service.create_server(db, current_user.id, dto)


@router.get("", response_model=list[ServerResponse])
async def list_servers(db: DbDep, current_user: CurrentUserDep):
    return await service.find_all_for_user(db, current_user.id)


@router.get("/{server_id}", response_model=ServerResponse)
async def get_server(server_id: str, db: DbDep, current_user: CurrentUserDep):
    return await service.find_one(db, server_id, current_user.id)


@router.patch("/{server_id}", response_model=ServerResponse)
async def update_server(
    server_id: str, dto: UpdateServerDTO, db: DbDep, current_user: CurrentUserDep
):
    return await service.update_server(db, server_id, current_user.id, dto)


@router.delete("/{server_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_server(server_id: str, db: DbDep, current_user: CurrentUserDep):
    await service.delete_server(db, server_id, current_user.id)


@router.post("/{server_id}/join", response_model=ServerResponse)
async def join_server(server_id: str, db: DbDep, current_user: CurrentUserDep):
    return await service.join_server(db, server_id, current_user.id)


@router.post("/{server_id}/leave", status_code=status.HTTP_204_NO_CONTENT)
async def leave_server(server_id: str, db: DbDep, current_user: CurrentUserDep):
    await service.leave_server(db, server_id, current_user.id)


@router.delete("/{server_id}/members/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(
    server_id: str, member_id: str, db: DbDep, current_user: CurrentUserDep
):
    await service.remove_member(db, server_id, member_id, current_user.id)
