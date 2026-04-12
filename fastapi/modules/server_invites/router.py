from typing import Annotated

from fastapi import APIRouter, Depends, status

from core.database import get_db
from core.dependencies import get_current_user
from models.user import User
from modules.server_invites import service
from modules.server_invites.schemas import SendServerInviteDTO, ServerInviteResponse
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/server-invites", tags=["server-invites"])

DbDep = Annotated[AsyncSession, Depends(get_db)]
CurrentUserDep = Annotated[User, Depends(get_current_user)]


@router.get("/pending", response_model=list[ServerInviteResponse])
async def get_pending_invites(db: DbDep, current_user: CurrentUserDep):
    return await service.get_pending_invites(db, current_user.id)


@router.get("/sent", response_model=list[ServerInviteResponse])
async def get_sent_invites(db: DbDep, current_user: CurrentUserDep):
    return await service.get_sent_invites(db, current_user.id)


@router.post(
    "/server/{server_id}",
    response_model=ServerInviteResponse,
    status_code=status.HTTP_201_CREATED,
)
async def send_invite(
    server_id: str, dto: SendServerInviteDTO, db: DbDep, current_user: CurrentUserDep
):
    return await service.send_invite(db, current_user.id, server_id, dto)


@router.post("/{invite_id}/accept", response_model=ServerInviteResponse)
async def accept_invite(invite_id: str, db: DbDep, current_user: CurrentUserDep):
    return await service.accept_invite(db, invite_id, current_user.id)


@router.post("/{invite_id}/reject", response_model=ServerInviteResponse)
async def reject_invite(invite_id: str, db: DbDep, current_user: CurrentUserDep):
    return await service.reject_invite(db, invite_id, current_user.id)


@router.delete("/{invite_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_invite(invite_id: str, db: DbDep, current_user: CurrentUserDep):
    await service.cancel_invite(db, invite_id, current_user.id)
