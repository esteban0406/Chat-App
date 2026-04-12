from pydantic import BaseModel, Field

from shared.enums import ChannelType


class CreateChannelDTO(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    type: ChannelType = ChannelType.TEXT


class UpdateChannelDTO(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=100)
    type: ChannelType | None = None
