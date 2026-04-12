from datetime import datetime

from modules.servers.schemas import ServerResponse
from modules.users.schemas import UserResponse
from shared.enums import RequestStatus
from shared.schemas import CamelCaseModel


class SendServerInviteDTO(CamelCaseModel):
    receiver_id: str


class ServerInviteResponse(CamelCaseModel):
    id: str
    sender_id: str
    receiver_id: str
    server_id: str
    status: RequestStatus
    created_at: datetime
    sender: UserResponse | None = None
    receiver: UserResponse | None = None
    server: ServerResponse | None = None
