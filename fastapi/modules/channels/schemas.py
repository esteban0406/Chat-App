from pydantic import Field

from shared.enums import ChannelType
from shared.schemas import CamelCaseModel


class CreateChannelDTO(CamelCaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    type: ChannelType = ChannelType.TEXT


class UpdateChannelDTO(CamelCaseModel):
    name: str | None = Field(None, min_length=1, max_length=100)
    type: ChannelType | None = None
