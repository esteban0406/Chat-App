from datetime import datetime

from pydantic import BaseModel

from modules.servers.schemas import ServerResponse
from modules.users.schemas import UserResponse
from shared.enums import RequestStatus


class SendServerInviteDTO(BaseModel):
    receiver_id: str


class ServerInviteResponse(BaseModel):
    id: str
    sender_id: str
    receiver_id: str
    server_id: str
    status: RequestStatus
    created_at: datetime
    sender: UserResponse | None = None
    receiver: UserResponse | None = None
    server: ServerResponse | None = None
    model_config = {"from_attributes": True}
