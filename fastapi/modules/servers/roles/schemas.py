from pydantic import BaseModel, Field

from shared.enums import ServerPermission


class CreateRoleDTO(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    color: str | None = None
    permissions: list[ServerPermission] = []


class UpdateRoleDTO(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=50)
    color: str | None = None
    permissions: list[ServerPermission] | None = None


class AssignRoleDTO(BaseModel):
    member_id: str
    role_id: str
