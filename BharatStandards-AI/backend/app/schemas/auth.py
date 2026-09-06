from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, EmailStr, Field, model_validator, ConfigDict


class ProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    phone: Optional[str] = None
    organization: Optional[str] = None
    industry: Optional[str] = None
    designation: Optional[str] = None
    location: Optional[str] = None
    avatar_url: Optional[str] = None


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: EmailStr
    role: str
    status: Optional[str] = "ACTIVE"
    is_active: bool
    created_at: datetime
    updated_at: datetime
    profile: Optional[ProfileResponse] = None


class UserRegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Full Name")
    email: EmailStr = Field(..., description="Valid Email Address")
    password: str = Field(..., min_length=8, max_length=128, description="Strong Password (min 8 characters)")
    confirm_password: str = Field(..., min_length=8, max_length=128, description="Confirm Password")
    role: Optional[str] = Field(default="industry", description="Account Type (industry or consumer)")

    @model_validator(mode="after")
    def validate_registration(self):
        if self.password != self.confirm_password:
            raise ValueError("Passwords do not match.")
        if self.role and self.role.upper() == "ADMIN":
            raise ValueError("Administrative role cannot be requested through public registration.")
        return self



class UserLoginRequest(BaseModel):
    email: EmailStr = Field(..., description="Email Address")
    password: str = Field(..., min_length=1, description="Password")
    remember_me: bool = Field(default=False, description="Remember this session")


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class MessageResponse(BaseModel):
    message: str
