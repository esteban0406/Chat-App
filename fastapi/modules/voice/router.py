from typing import Annotated

from fastapi import APIRouter, Depends

from core.dependencies import get_current_user
from models.user import User
from modules.voice import service
from modules.voice.schemas import JoinRoomDTO, JoinRoomResponse

router = APIRouter(prefix="/voice", tags=["voice"])

CurrentUserDep = Annotated[User, Depends(get_current_user)]


@router.post("/join", response_model=JoinRoomResponse)
async def join_room(dto: JoinRoomDTO, _current_user: CurrentUserDep) -> JoinRoomResponse:
    return service.generate_token(dto.identity, dto.room)
