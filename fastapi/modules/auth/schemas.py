from pydantic import BaseModel, EmailStr, field_validator

from shared.enums import UserStatus


class RegisterDTO(BaseModel):
    email: EmailStr
    username: str
    password: str

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        if len(v) < 3 or len(v) > 32:
            raise ValueError("El nombre de usuario debe tener entre 3 y 32 caracteres")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 6 or len(v) > 128:
            raise ValueError("La contraseña debe tener entre 6 y 128 caracteres")
        return v


class LoginDTO(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: str
    email: str
    username: str
    avatar_url: str | None = None
    status: UserStatus

    model_config = {"from_attributes": True}
