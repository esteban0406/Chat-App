from datetime import datetime

from pydantic import Field

from modules.users.schemas import UserResponse
from shared.enums import ChannelType, ServerPermission
from shared.schemas import CamelCaseModel


class CreateServerDTO(CamelCaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    icon_url: str | None = None


class UpdateServerDTO(CamelCaseModel):
    name: str | None = Field(None, min_length=1, max_length=100)
    icon_url: str | None = None


class RoleResponse(CamelCaseModel):
    id: str
    name: str
    color: str | None = None
    permissions: list[ServerPermission]
    created_at: datetime


class MemberResponse(CamelCaseModel):
    id: str
    user_id: str
    server_id: str
    role_id: str | None = None
    joined_at: datetime
    user: UserResponse | None = None
    role: RoleResponse | None = None


class ChannelResponse(CamelCaseModel):
    id: str
    name: str
    type: ChannelType
    server_id: str
    created_at: datetime


class ServerResponse(CamelCaseModel):
    id: str
    name: str
    icon_url: str | None = None
    owner_id: str
    created_at: datetime
    updated_at: datetime
    owner: UserResponse | None = None
    members: list[MemberResponse] = []
    channels: list[ChannelResponse] = []
    roles: list[RoleResponse] = []
