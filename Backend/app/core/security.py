from datetime import datetime, timedelta, timezone
from typing import Optional
from passlib.context import CryptContext
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.config import settings
from backend.app.database import get_db
from backend.app.models.audit import User

import bcrypt

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

async def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    if not token:
        return None
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None
    except JWTError:
        return None
    
    result = await db.execute(select(User).where(User.username == username))
    user = result.scalar_one_or_none()
    return user

# ======================================================================
# GMAIL OAUTH TOKEN ENCRYPTION & CSRF PROTECTION (FERNET)
# ======================================================================
import secrets
import base64
import hashlib
from cryptography.fernet import Fernet

_oauth_states: dict[str, datetime] = {}

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

def generate_oauth_state() -> str:
    """
    Generates a cryptographically secure random CSRF state token valid for 10 minutes.
    """
    state = secrets.token_urlsafe(32)
    now = datetime.now(timezone.utc)
    # Prune expired states older than 10 minutes
    expired_keys = [k for k, exp in _oauth_states.items() if (now - exp).total_seconds() > 600]
    for k in expired_keys:
        _oauth_states.pop(k, None)
    _oauth_states[state] = now
    return state

def verify_oauth_state(state: Optional[str]) -> bool:
    """
    Verifies and consumes a single-use CSRF state token.
    """
    if not state:
        return False
    now = datetime.now(timezone.utc)
    creation_time = _oauth_states.pop(state, None)
    if not creation_time:
        return False
    return (now - creation_time).total_seconds() <= 600
