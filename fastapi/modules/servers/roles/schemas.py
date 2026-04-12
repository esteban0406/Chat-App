from pydantic import Field

from shared.enums import ServerPermission
from shared.schemas import CamelCaseModel


class CreateRoleDTO(CamelCaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    color: str | None = None
    permissions: list[ServerPermission] = []


class UpdateRoleDTO(CamelCaseModel):
    name: str | None = Field(None, min_length=1, max_length=50)
    color: str | None = None
    permissions: list[ServerPermission] | None = None


class AssignRoleDTO(CamelCaseModel):
    member_id: str
    role_id: str
