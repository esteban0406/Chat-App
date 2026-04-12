from typing import Annotated

from fastapi import APIRouter, Depends, status

from core.database import get_db
from core.dependencies import get_current_user
from models.user import User
from modules.channels import service
from modules.channels.schemas import CreateChannelDTO, UpdateChannelDTO
from modules.servers.schemas import ChannelResponse
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/servers/{server_id}/channels", tags=["channels"])

DbDep = Annotated[AsyncSession, Depends(get_db)]
CurrentUserDep = Annotated[User, Depends(get_current_user)]


@router.post("", response_model=ChannelResponse, status_code=status.HTTP_201_CREATED)
async def create_channel(
    server_id: str, dto: CreateChannelDTO, db: DbDep, current_user: CurrentUserDep
):
    return await service.create_channel(db, server_id, current_user.id, dto)


@router.get("", response_model=list[ChannelResponse])
async def list_channels(server_id: str, db: DbDep, current_user: CurrentUserDep):
    return await service.list_channels(db, server_id, current_user.id)


@router.get("/{channel_id}", response_model=ChannelResponse)
async def get_channel(server_id: str, channel_id: str, db: DbDep, current_user: CurrentUserDep):
    return await service.get_channel(db, server_id, channel_id, current_user.id)


@router.patch("/{channel_id}", response_model=ChannelResponse)
async def update_channel(
    server_id: str,
    channel_id: str,
    dto: UpdateChannelDTO,
    db: DbDep,
    current_user: CurrentUserDep,
):
    return await service.update_channel(db, server_id, channel_id, current_user.id, dto)


@router.delete("/{channel_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_channel(
    server_id: str, channel_id: str, db: DbDep, current_user: CurrentUserDep
):
    await service.delete_channel(db, server_id, channel_id, current_user.id)
