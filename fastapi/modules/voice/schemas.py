from shared.schemas import CamelCaseModel


class JoinRoomDTO(CamelCaseModel):
    identity: str
    room: str


class JoinRoomResponse(CamelCaseModel):
    token: str
    url: str
