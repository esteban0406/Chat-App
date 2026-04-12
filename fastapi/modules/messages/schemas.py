from datetime import datetime

from pydantic import Field

from modules.users.schemas import UserResponse
from shared.schemas import CamelCaseModel


class CreateMessageDTO(CamelCaseModel):
    content: str = Field(..., min_length=1, max_length=2000)
    channel_id: str


class UpdateMessageDTO(CamelCaseModel):
    content: str = Field(..., min_length=1, max_length=2000)


class MessageResponse(CamelCaseModel):
    id: str
    content: str
    author_id: str
    channel_id: str
    created_at: datetime
    updated_at: datetime
    author: UserResponse | None = None


class PaginatedMessagesResponse(CamelCaseModel):
    messages: list[MessageResponse]
    next_cursor: str | None
    has_more: bool
