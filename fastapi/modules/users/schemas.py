from datetime import datetime

from pydantic import EmailStr

from shared.enums import UserStatus
from shared.schemas import CamelCaseModel


class UserResponse(CamelCaseModel):
    id: str
    email: str
    username: str
    avatar_url: str | None = None
    status: UserStatus
    created_at: datetime


class UpdateUserDTO(CamelCaseModel):
    username: str | None = None
    email: EmailStr | None = None


class UpdateStatusDTO(CamelCaseModel):
    status: UserStatus
