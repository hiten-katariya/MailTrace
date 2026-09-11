import asyncio
import base64
import time
from datetime import datetime, timezone
from typing import Dict, Any, Optional
import httpx
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.config import settings
from backend.app.database import AsyncSessionLocal
from backend.app.models.gmail import GmailAccount
from backend.app.core.security import decrypt_token
from backend.app.core.ingestion import process_raw_email_bytes

# Global scheduler instance
scheduler = AsyncIOScheduler()

# In-memory access token cache: account_id -> {"access_token": str, "expires_at": float}
_token_cache: Dict[str, Dict[str, Any]] = {}

# In-memory per-account locks to prevent overlapping polling executions
_polling_locks: Dict[str, asyncio.Lock] = {}


def _get_account_lock(account_id: str) -> asyncio.Lock:
    if account_id not in _polling_locks:
        _polling_locks[account_id] = asyncio.Lock()
    return _polling_locks[account_id]


async def get_valid_access_token(account: GmailAccount, db) -> Optional[str]:
    """
    Returns a valid access token for the given GmailAccount.
    Reuses cached access token if still valid (tokens last 3600s, refreshed if < 120s remain).
    Refreshes via Google OAuth2 token endpoint using the decrypted refresh token.
    Zero token values are logged.
    """
    now = time.time()
    cached = _token_cache.get(account.id)
    if cached and cached.get("expires_at", 0) > now + 120:
        return cached["access_token"]

    # Decrypt stored refresh token
    try:
        refresh_token = decrypt_token(account.encrypted_refresh_token)
    except Exception as e:
        print(f"[-] Failed to decrypt refresh token for account {account.gmail_address}: {e}")
        account.status = "needs_reauth"
        account.error_message = f"Decryption error: {str(e)}"
        await db.commit()
        return None

    token_url = "https://oauth2.googleapis.com/token"
    payload = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "refresh_token": refresh_token,
        "grant_type": "refresh_token",
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            resp = await client.post(token_url, data=payload)
            if resp.status_code == 400:
                data = resp.json()
                err = data.get("error", "")
                if "invalid_grant" in err or "expired" in str(data):
                    print(f"[-] Refresh token revoked/expired for {account.gmail_address}")
                    account.status = "needs_reauth"
                    account.error_message = "Refresh token expired or revoked by Google. Please reconnect."
                    await db.commit()
                    return None

            resp.raise_for_status()
            token_data = resp.json()
            new_access_token = token_data["access_token"]
            expires_in = token_data.get("expires_in", 3600)

            _token_cache[account.id] = {
                "access_token": new_access_token,
                "expires_at": now + expires_in,
            }
            return new_access_token

        except Exception as e:
            print(f"[-] Token refresh error for {account.gmail_address}: {e}")
            return None


async def poll_gmail_account(account_id: str, db_override: Optional[Any] = None):
    """
    Polls a single Gmail account for newly added incoming messages using users.history.list.
    Feeds new message raw MIME bytes directly into the MailTrace analysis pipeline.
    """
    lock = _get_account_lock(account_id)
    if lock.locked():
        # Previous poll cycle is still executing, skip without error
        return

    async with lock:
        async def _run_poll(db):
            result = await db.execute(select(GmailAccount).where(GmailAccount.id == account_id))
            account = result.scalar_one_or_none()
            if not account or account.status != "active":
                return

            access_token = await get_valid_access_token(account, db)
            if not access_token:
                return

            headers = {
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/json",
            }

            async with httpx.AsyncClient(timeout=30.0) as client:
                try:
                    # If we don't have a last_history_id, bootstrap from profile
                    if not account.last_history_id:
                        prof_resp = await client.get(
                            "https://gmail.googleapis.com/gmail/v1/users/me/profile",
                            headers=headers,
                        )
                        prof_resp.raise_for_status()
                        account.last_history_id = str(prof_resp.json().get("historyId"))
                        account.last_polled_at = datetime.now(timezone.utc)
                        await db.commit()
                        return

                    # Query differential history since last_history_id
                    history_url = (
                        f"https://gmail.googleapis.com/gmail/v1/users/me/history"
                        f"?startHistoryId={account.last_history_id}&historyTypes=messageAdded"
                    )
                    hist_resp = await client.get(history_url, headers=headers)

                    # If 404 (history ID is expired/outdated according to Gmail), re-bootstrap historyId
                    if hist_resp.status_code == 404:
                        print(f"[*] History ID {account.last_history_id} expired for {account.gmail_address}. Re-bootstrapping...")
                        prof_resp = await client.get(
                            "https://gmail.googleapis.com/gmail/v1/users/me/profile",
                            headers=headers,
                        )
                        prof_resp.raise_for_status()
                        account.last_history_id = str(prof_resp.json().get("historyId"))
                        account.last_polled_at = datetime.now(timezone.utc)
                        await db.commit()
                        return

                    hist_resp.raise_for_status()
                    hist_data = hist_resp.json()

                    new_message_ids = set()
                    for item in hist_data.get("history", []):
                        for added in item.get("messagesAdded", []):
                            msg = added.get("message", {})
                            msg_id = msg.get("id")
                            if msg_id:
                                new_message_ids.add(msg_id)

                    # Update history ID tracker
                    if "historyId" in hist_data:
                        account.last_history_id = str(hist_data["historyId"])
                    account.last_polled_at = datetime.now(timezone.utc)
                    await db.commit()

                    if not new_message_ids:
                        return

                    print(f"[+] Found {len(new_message_ids)} new messages for {account.gmail_address}")

                    # Fetch raw MIME for each new message and analyze
                    for msg_id in new_message_ids:
                        try:
                            msg_url = f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{msg_id}?format=raw"
                            msg_resp = await client.get(msg_url, headers=headers)
                            msg_resp.raise_for_status()
                            msg_json = msg_resp.json()
                            raw_b64 = msg_json.get("raw")

                            if raw_b64:
                                # URL-safe base64 decoding with padding fix if needed
                                pad = len(raw_b64) % 4
                                if pad:
                                    raw_b64 += "=" * (4 - pad)
                                raw_bytes = base64.urlsafe_b64decode(raw_b64)

                                # Pass to unified raw email bytes pipeline
                                await process_raw_email_bytes(
                                    content_bytes=raw_bytes,
                                    source="gmail",
                                    gmail_account=account.gmail_address,
                                    gmail_message_id=msg_id,
                                    db=db,
                                )
                        except Exception as me:
                            print(f"[-] Error fetching/processing Gmail message {msg_id}: {me}")

                except Exception as e:
                    print(f"[-] Error polling Gmail for {account.gmail_address}: {e}")

        if db_override is not None:
            await _run_poll(db_override)
        else:
            async with AsyncSessionLocal() as db:
                await _run_poll(db)


def schedule_gmail_account(account_id: str, poll_interval_seconds: Optional[int] = None):
    """Registers an APScheduler interval job for an active Gmail account."""
    interval = poll_interval_seconds or settings.GMAIL_POLL_INTERVAL_SECONDS
    job_id = f"gmail_poll_{account_id}"
    if not scheduler.get_job(job_id):
        scheduler.add_job(
            poll_gmail_account,
            "interval",
            seconds=interval,
            id=job_id,
            args=[account_id],
            max_instances=1,
            replace_existing=True,
        )
        print(f"[+] Scheduled Gmail polling for account {account_id} every {interval}s")


def unschedule_gmail_account(account_id: str):
    """Removes the APScheduler job for an account."""
    job_id = f"gmail_poll_{account_id}"
    if scheduler.get_job(job_id):
        scheduler.remove_job(job_id)
        print(f"[+] Unscheduled Gmail polling job {job_id}")
    _token_cache.pop(account_id, None)
    _polling_locks.pop(account_id, None)


async def start_gmail_scheduler():
    """Starts the AsyncIOScheduler and loads active Gmail accounts from the database."""
    if not scheduler.running:
        scheduler.start()
        print("[+] Gmail AsyncIOScheduler started.")

    async with AsyncSessionLocal() as db:
        try:
            result = await db.execute(select(GmailAccount).where(GmailAccount.status == "active"))
            accounts = result.scalars().all()
            for acc in accounts:
                schedule_gmail_account(acc.id)
            print(f"[+] Loaded {len(accounts)} active Gmail account(s) into scheduler.")
        except Exception as e:
            print(f"[-] Error initializing Gmail polling accounts: {e}")


async def stop_gmail_scheduler():
    """Gracefully halts the APScheduler."""
    if scheduler.running:
        scheduler.shutdown(wait=False)


async def trash_gmail_message(gmail_address: str, message_id: str, db: AsyncSession) -> bool:
    """
    Moves a message to the user's Gmail Trash (recoverable within ~30 days).
    Requires gmail.modify scope.
    """
    result = await db.execute(select(GmailAccount).where(GmailAccount.gmail_address == gmail_address))
    account = result.scalar_one_or_none()
    if not account:
        raise ValueError(f"No connected GmailAccount found for {gmail_address}")

    access_token = await get_account_access_token(account, db)
    if not access_token:
        raise RuntimeError(f"Could not obtain access token for {gmail_address} (account status: {account.status})")

    trash_url = f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{message_id}/trash"
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.post(trash_url, headers={"Authorization": f"Bearer {access_token}"})
        if resp.status_code == 404:
            # Already deleted or moved to trash
            return True
        resp.raise_for_status()
        return True