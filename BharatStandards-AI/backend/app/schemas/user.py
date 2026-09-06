from datetime import datetime
from typing import Optional, Literal, Dict, Any
from pydantic import BaseModel, EmailStr, Field, model_validator, ConfigDict


class UserPreferencesSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    email_notifications: bool = True
    in_app_notifications: bool = True
    compliance_notifications: bool = True
    document_notifications: bool = True
    product_notifications: bool = True
    report_notifications: bool = True
    theme: Literal["light", "dark", "system"] = "system"
    language: str = "en"


class ProfileDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: Optional[int] = None
    user_id: Optional[int] = None
    phone: Optional[str] = None
    organization: Optional[str] = None
    industry: Optional[str] = None
    designation: Optional[str] = None
    location: Optional[str] = None
    avatar_url: Optional[str] = None
    interests: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class UserDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: EmailStr
    role: Literal["industry", "consumer"]
    is_active: bool
    created_at: datetime
    updated_at: datetime
    profile: Optional[ProfileDetailResponse] = None


class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    phone: Optional[str] = Field(None, max_length=50)
    organization: Optional[str] = Field(None, max_length=255)
    industry: Optional[str] = Field(None, max_length=255)
    designation: Optional[str] = Field(None, max_length=255)
    location: Optional[str] = Field(None, max_length=255)
    avatar_url: Optional[str] = Field(None, max_length=500)
    interests: Optional[str] = Field(None, max_length=500)


class PasswordChangeRequest(BaseModel):
    current_password: str = Field(..., min_length=1, description="Current password")
    new_password: str = Field(..., min_length=8, max_length=128, description="New password (min 8 characters)")
    confirm_new_password: str = Field(..., min_length=8, max_length=128, description="Confirm new password")

    @model_validator(mode="after")
    def validate_password_change(self):
        if self.new_password != self.confirm_new_password:
            raise ValueError("New password and confirmation do not match.")
        if self.new_password == self.current_password:
            raise ValueError("New password must be different from current password.")
        return self


class UserPreferencesUpdateRequest(BaseModel):
    email_notifications: Optional[bool] = None
    in_app_notifications: Optional[bool] = None
    compliance_notifications: Optional[bool] = None
    document_notifications: Optional[bool] = None
    product_notifications: Optional[bool] = None
    report_notifications: Optional[bool] = None
    theme: Optional[Literal["light", "dark", "system"]] = None
    language: Optional[str] = None


class AccountDeleteRequest(BaseModel):
    confirmation: str = Field(..., description="Must type DELETE to confirm")

    @model_validator(mode="after")
    def validate_confirmation(self):
        if self.confirmation.strip().upper() != "DELETE":
            raise ValueError("Confirmation text must be 'DELETE'")
        return self
