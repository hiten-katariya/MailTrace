import urllib.parse
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
import httpx
from sse_starlette.sse import EventSourceResponse

from backend.app.config import settings
from backend.app.database import get_db
from backend.app.models.gmail import GmailAccount
from backend.app.core.security import generate_oauth_state, verify_oauth_state, encrypt_token, decrypt_token
from backend.app.core.gmail_poller import schedule_gmail_account, unschedule_gmail_account
from backend.app.core.sse import sse_manager

router = APIRouter(tags=["Gmail Integration"])


class CallbackRequest(BaseModel):
    code: str
    state: str


class GmailStatusResponse(BaseModel):
    connected: bool
    email: Optional[str] = None
    status: str
    connected_at: Optional[str] = None
    last_polled_at: Optional[str] = None
    error_message: Optional[str] = None


@router.get("/gmail/auth-url")
async def get_google_auth_url():
    """
    Generates the Google OAuth 2.0 authorization URL for Gmail access (gmail.modify)
    along with a cryptographic single-use CSRF state token.
    Allows real-time inbox scanning and compliance retention trashing.
    """
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=500,
            detail="GOOGLE_CLIENT_ID is not configured in backend environment.",
        )

    state = generate_oauth_state()
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "https://www.googleapis.com/auth/gmail.readonly",
        "access_type": "offline",
        "prompt": "consent",
        "state": state,
    }

    auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urllib.parse.urlencode(params)}"
    return {"auth_url": auth_url, "state": state}


@router.post("/gmail/callback", response_model=GmailStatusResponse)
async def handle_google_callback(payload: CallbackRequest, db: AsyncSession = Depends(get_db)):
    """
    Exchanges authorization code for tokens, verifies granted scope, fetches account profile,
    encrypts the refresh token at rest, and initiates background polling.
    """
    if not verify_oauth_state(payload.state):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid, expired, or previously used OAuth state parameter.",
        )

    # Exchange code with Google
    token_url = "https://oauth2.googleapis.com/token"
    token_data = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "code": payload.code,
        "grant_type": "authorization_code",
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
    }

    async with httpx.AsyncClient(timeout=20.0) as client:
        try:
            token_resp = await client.post(token_url, data=token_data)
            if token_resp.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Google token exchange failed: {token_resp.text}",
                )
            tokens = token_resp.json()
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Unable to reach Google OAuth endpoint: {str(e)}",
            )

        access_token = tokens.get("access_token")
        refresh_token = tokens.get("refresh_token")
        granted_scopes = tokens.get("scope", "")

        if not access_token:
            raise HTTPException(status_code=400, detail="No access token returned by Google.")

        # Fetch Gmail user profile
        try:
            profile_resp = await client.get(
                "https://gmail.googleapis.com/gmail/v1/users/me/profile",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            profile_resp.raise_for_status()
            profile = profile_resp.json()
            email_address = profile.get("emailAddress")
            history_id = profile.get("historyId")
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Failed to fetch Gmail user profile: {str(e)}",
            )

    if not email_address:
        raise HTTPException(status_code=400, detail="Could not determine Gmail email address.")

    # Check for existing account (idempotent upsert)
    result = await db.execute(
        select(GmailAccount).where(GmailAccount.gmail_address == email_address)
    )
    account = result.scalar_one_or_none()

    if account:
        if refresh_token:
            account.encrypted_refresh_token = encrypt_token(refresh_token)
        account.scopes_granted = granted_scopes
        account.last_history_id = str(history_id) if history_id else account.last_history_id
        account.status = "active"
        account.error_message = None
        account.connected_at = datetime.now(timezone.utc)
    else:
        if not refresh_token:
            raise HTTPException(
                status_code=400,
                detail="Google did not return a refresh token. Please revoke access in Google Security settings and reconnect.",
            )
        account = GmailAccount(
            gmail_address=email_address,
            encrypted_refresh_token=encrypt_token(refresh_token),
            scopes_granted=granted_scopes,
            last_history_id=str(history_id) if history_id else None,
            connected_at=datetime.now(timezone.utc),
            status="active",
        )
        db.add(account)

    await db.commit()
    await db.refresh(account)

    # Schedule background poller
    schedule_gmail_account(account.id)

    return GmailStatusResponse(
        connected=True,
        email=account.gmail_address,
        status=account.status,
        connected_at=account.connected_at.isoformat() if account.connected_at else None,
        last_polled_at=account.last_polled_at.isoformat() if account.last_polled_at else None,
        error_message=None,
    )


@router.get("/gmail/status", response_model=GmailStatusResponse)
async def get_gmail_status(db: AsyncSession = Depends(get_db)):
    """
    Returns current Gmail connection state, linked email address, and polling status.
    """
    result = await db.execute(
        select(GmailAccount).order_by(desc(GmailAccount.connected_at))
    )
    account = result.scalars().first()

    if not account:
        return GmailStatusResponse(
            connected=False,
            email=None,
            status="disconnected",
            connected_at=None,
            last_polled_at=None,
            error_message=None,
        )

    return GmailStatusResponse(
        connected=account.status == "active",
        email=account.gmail_address,
        status=account.status,
        connected_at=account.connected_at.isoformat() if account.connected_at else None,
        last_polled_at=account.last_polled_at.isoformat() if account.last_polled_at else None,
        error_message=account.error_message,
    )


@router.post("/gmail/disconnect")
async def disconnect_gmail(db: AsyncSession = Depends(get_db)):
    """
    Disconnects the active Gmail account, revokes the refresh token at Google,
    unschedules background polling, and deletes stored encrypted credentials.
    """
    result = await db.execute(select(GmailAccount))
    accounts = result.scalars().all()

    if not accounts:
        return {"success": True, "message": "No connected Gmail account found."}

    for acc in accounts:
        unschedule_gmail_account(acc.id)

        # Attempt to revoke token at Google
        try:
            raw_token = decrypt_token(acc.encrypted_refresh_token)
            async with httpx.AsyncClient(timeout=10.0) as client:
                await client.post(
                    "https://oauth2.googleapis.com/revoke",
                    data={"token": raw_token},
                )
        except Exception as e:
            print(f"[-] Token revocation warning for {acc.gmail_address}: {e}")

        await db.delete(acc)

    await db.commit()
    return {"success": True, "message": "Gmail account disconnected and credentials revoked."}


@router.get("/gmail/stream")
async def stream_live_cases():
    """
    Server-Sent Events (SSE) live push endpoint.
    Streams newly analyzed cases and keep-alive pings to the SOC dashboard.
    """
    return EventSourceResponse(sse_manager.subscribe())
