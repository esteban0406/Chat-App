from datetime import datetime

from pydantic import BaseModel, EmailStr

from shared.enums import UserStatus


class UserResponse(BaseModel):
    id: str
    email: str
    username: str
    avatar_url: str | None = None
    status: UserStatus
    created_at: datetime

    model_config = {"from_attributes": True}


class UpdateUserDTO(BaseModel):
    username: str | None = None
    email: EmailStr | None = None


class UpdateStatusDTO(BaseModel):
    status: UserStatus
