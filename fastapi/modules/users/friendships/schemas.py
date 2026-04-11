from datetime import datetime

from pydantic import BaseModel

from modules.users.schemas import UserResponse
from shared.enums import RequestStatus


class SendRequestDTO(BaseModel):
    receiver_id: str


class RespondRequestDTO(BaseModel):
    status: RequestStatus


class FriendshipResponse(BaseModel):
    id: str
    sender_id: str
    receiver_id: str
    status: RequestStatus
    created_at: datetime
    sender: UserResponse | None = None
    receiver: UserResponse | None = None

    model_config = {"from_attributes": True}
