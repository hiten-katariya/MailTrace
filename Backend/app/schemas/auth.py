from pydantic import BaseModel, Field
from typing import Optional

class LoginRequest(BaseModel):
    # Supports both email (new) and username (legacy test compat)
    email: Optional[str] = Field(None, example="user@example.com")
    username: Optional[str] = Field(None, example="analyst1")
    password: str = Field(..., example="yourpassword")

class SignupRequest(BaseModel):
    name: str = Field(..., example="Jane Doe")
    email: str = Field(..., example="jane@example.com")
    password: str = Field(..., min_length=6, example="SecurePass123!")

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int = 28800  # 8 hours

class UserResponse(BaseModel):
    id: int
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    role: str = "user"
    is_admin: bool = False
    gmail_connected: bool = False
    auth_provider: str = "local"

    class Config:
        from_attributes = True

class AuthSuccessResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int = 28800
    user: UserResponse

class GoogleAuthUrlResponse(BaseModel):
    auth_url: str
    state: str

class GoogleCallbackRequest(BaseModel):
    code: str
    state: str
