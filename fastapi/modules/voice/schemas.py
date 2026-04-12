from pydantic import BaseModel


class JoinRoomDTO(BaseModel):
    identity: str
    room: str


class JoinRoomResponse(BaseModel):
    token: str
    url: str
