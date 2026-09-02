from pydantic import BaseModel, Field
from typing import Optional

class LoginRequest(BaseModel):
    username: str = Field(..., example="analyst1")
    password: str = Field(..., example="yourpassword")

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int = 28800  # 8 hours

class UserResponse(BaseModel):
    id: int
    username: str
    full_name: Optional[str] = None
    role: str = "analyst"

    class Config:
        from_attributes = True
