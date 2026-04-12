from datetime import datetime

from modules.users.schemas import UserResponse
from shared.enums import RequestStatus
from shared.schemas import CamelCaseModel


class SendRequestDTO(CamelCaseModel):
    receiver_id: str


class RespondRequestDTO(CamelCaseModel):
    status: RequestStatus


class FriendshipResponse(CamelCaseModel):
    id: str
    sender_id: str
    receiver_id: str
    status: RequestStatus
    created_at: datetime
    sender: UserResponse | None = None
    receiver: UserResponse | None = None
