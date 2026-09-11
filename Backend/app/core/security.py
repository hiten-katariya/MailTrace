from datetime import datetime, timedelta, timezone
from typing import Optional, Any
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from backend.app.config import settings
from backend.app.database import get_db
from backend.app.models.audit import User

import bcrypt
import secrets
import base64
import hashlib
from cryptography.fernet import Fernet

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        if not plain_password or not hashed_password:
            return False
        # Direct match or bcrypt check
        if plain_password == hashed_password:
            return True
        return bcrypt.checkpw(plain_password.encode("utf-8")[:72], hashed_password.encode("utf-8"))
    except Exception:
        return plain_password == hashed_password

def get_password_hash(password: str) -> str:
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def is_admin_email(email: Optional[str]) -> bool:
    if not email:
        return False
    return email.lower().strip() == settings.ADMIN_EMAIL.lower().strip()

async def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    if not token:
        return None
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        sub: str = payload.get("sub")
        if sub is None:
            return None
    except JWTError:
        return None
    
    # Check by email or username
    result = await db.execute(
        select(User).where(or_(User.username == sub, User.email == sub))
    )
    user = result.scalar_one_or_none()
    if not user and sub.isdigit():
        result = await db.execute(select(User).where(User.id == int(sub)))
        user = result.scalar_one_or_none()
    return user

async def require_authenticated_user(
    user: Optional[User] = Depends(get_current_user)
) -> User:
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

async def require_admin(
    user: Optional[User] = Depends(get_current_user)
) -> User:
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrative privileges required",
        )
    return user

# ======================================================================
# GMAIL & GOOGLE OAUTH TOKEN ENCRYPTION & CSRF PROTECTION (FERNET)
# ======================================================================

_oauth_states: dict[str, dict] = {}

def get_fernet_cipher() -> Fernet:
    key = settings.TOKEN_ENCRYPTION_KEY.strip() if settings.TOKEN_ENCRYPTION_KEY else ""
    if not key:
        derived = base64.urlsafe_b64encode(hashlib.sha256(settings.SECRET_KEY.encode()).digest())
        return Fernet(derived)
    try:
        return Fernet(key.encode("utf-8"))
    except Exception:
        derived = base64.urlsafe_b64encode(hashlib.sha256(key.encode()).digest())
        return Fernet(derived)

def encrypt_token(plaintext_token: str) -> str:
    """
    Encrypts sensitive tokens at rest using Fernet (AES-128-CBC + HMAC-SHA256).
    Never logs or exposes the token in application logs.
    """
    if not plaintext_token:
        return ""
    cipher = get_fernet_cipher()
    return cipher.encrypt(plaintext_token.encode("utf-8")).decode("utf-8")

def decrypt_token(encrypted_token: str) -> str:
    """
    Decrypts an encrypted token at rest.
    Never logs or exposes the token in application logs.
    """
    if not encrypted_token:
        return ""
    cipher = get_fernet_cipher()
    return cipher.decrypt(encrypted_token.encode("utf-8")).decode("utf-8")

def generate_oauth_state(flow: str = "gmail_connect") -> str:
    """
    Generates a cryptographically secure random CSRF state token valid for 10 minutes,
    storing flow metadata ('signin' | 'gmail_connect').
    """
    state = secrets.token_urlsafe(32)
    now = datetime.now(timezone.utc)
    # Prune expired states older than 10 minutes
    expired_keys = [k for k, v in _oauth_states.items() if (now - v["created_at"]).total_seconds() > 600]
    for k in expired_keys:
        _oauth_states.pop(k, None)
    _oauth_states[state] = {"created_at": now, "flow": flow}
    return state

def verify_oauth_state(state: Optional[str], expected_flow: Optional[str] = None) -> bool:
    """
    Verifies and consumes a single-use CSRF state token.
    """
    if not state:
        return False
    now = datetime.now(timezone.utc)
    entry = _oauth_states.pop(state, None)
    if not entry:
        return False
    if isinstance(entry, dict):
        if (now - entry["created_at"]).total_seconds() > 600:
            return False
        if expected_flow and entry.get("flow") != expected_flow:
            return False
        return True
    return (now - entry).total_seconds() <= 600
