from datetime import datetime

from pydantic import BaseModel, Field

from modules.users.schemas import UserResponse


class CreateMessageDTO(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)
    channel_id: str


class UpdateMessageDTO(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)


class MessageResponse(BaseModel):
    id: str
    content: str
    author_id: str
    channel_id: str
    created_at: datetime
    updated_at: datetime
    author: UserResponse | None = None
    model_config = {"from_attributes": True}


class PaginatedMessagesResponse(BaseModel):
    messages: list[MessageResponse]
    next_cursor: str | None
    has_more: bool
