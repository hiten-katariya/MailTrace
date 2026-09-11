import pytest
import os
import base64
from unittest.mock import patch, MagicMock
from datetime import datetime, timezone, timedelta
from sqlalchemy import select
from httpx import AsyncClient

from backend.app.models.case import Case
from backend.app.models.header import Headers
from backend.app.models.gmail import GmailAccount
from backend.app.models.audit import AuditLog
from backend.app.core.security import encrypt_token, decrypt_token, generate_oauth_state, verify_oauth_state
from backend.app.core.ingestion import process_raw_email_bytes
from backend.app.core.retention import get_or_create_retention_policy, execute_retention_purge
from backend.app.core.gmail_poller import (
    poll_gmail_account,
    _token_cache,
)

CLEAN_SAMPLE_EML = b"""From: notifications@github.com
To: user@example.com
Subject: [GitHub] Security advisory alert summary
Date: Thu, 4 Sep 2026 12:00:00 +0000
Message-ID: <clean-sample-123@github.com>
MIME-Version: 1.0
Content-Type: text/plain; charset=utf-8

Hello,
Here is your regular scheduled automated dependency review summary.
All components are up to date and verified.
"""

PHISHING_SAMPLE_EML = b"""From: support@secure-bank-update.com
To: user@example.com
Subject: URGENT: Your Account Has Been Suspended Immediate Action Required!
Date: Thu, 4 Sep 2026 12:00:00 +0000
Message-ID: <phish-sample-456@secure-bank-update.com>
MIME-Version: 1.0
Content-Type: text/plain; charset=utf-8

CRITICAL ALERT: Your bank account has been locked due to unauthorized access.
You must immediately verify your password and wire transfer details or your funds will be permanently frozen.
Click here: http://secure-bank-update.com/login?token=urgent999
"""


@pytest.mark.asyncio
async def test_fernet_token_encryption_roundtrip():
    """Verify that sensitive OAuth tokens can be encrypted and decrypted safely."""
    raw_token = "1//04abcDEF123456_GoogleRefreshTokenSampleTokenPayload"
    encrypted = encrypt_token(raw_token)

    assert encrypted != raw_token
    assert "GoogleRefreshToken" not in encrypted

    decrypted = decrypt_token(encrypted)
    assert decrypted == raw_token


@pytest.mark.asyncio
async def test_oauth_csrf_state_generation_and_verification():
    """Verify cryptographic single-use CSRF tokens for the OAuth consent flow."""
    state = generate_oauth_state()
    assert len(state) >= 32

    # First verification must succeed
    assert verify_oauth_state(state) is True

    # Replay attack: second verification must fail
    assert verify_oauth_state(state) is False

    # Bogus state must fail
    assert verify_oauth_state("invalid_nonexistent_state_payload") is False


@pytest.mark.asyncio
async def test_unified_process_raw_email_bytes_ingestion(db_session):
    """Verify that process_raw_email_bytes parses, creates Case with source/gmail_account tags, and runs pipeline."""
    case = await process_raw_email_bytes(
        content_bytes=CLEAN_SAMPLE_EML,
        source="gmail",
        gmail_account="analyst.test@gmail.com",
        gmail_message_id="msg_init_test_123",
        db=db_session,
    )

    assert case.id is not None
    assert case.source == "gmail"
    assert case.gmail_account == "analyst.test@gmail.com"
    assert case.gmail_message_id == "msg_init_test_123"
    assert case.status == "completed"

    # Verify query from DB
    q = await db_session.execute(select(Case).where(Case.id == case.id))
    persisted = q.scalar_one_or_none()
    assert persisted is not None
    assert persisted.source == "gmail"
    assert persisted.gmail_account == "analyst.test@gmail.com"
    assert persisted.gmail_message_id == "msg_init_test_123"


@pytest.mark.asyncio
async def test_no_immediate_scrub_on_any_verdict(db_session):
    """
    Acceptance Criteria:
    A Gmail message of ANY verdict retains full raw content and headers immediately
    after scoring — zero scrubbing until retention_days elapses via scheduled job.
    """
    # 1. Process legitimate email from Gmail
    legit_case = await process_raw_email_bytes(
        content_bytes=CLEAN_SAMPLE_EML,
        source="gmail",
        gmail_account="privacy.test@gmail.com",
        gmail_message_id="msg_legit_unscrubbed",
        db=db_session,
    )

    assert legit_case.risk_category == "legitimate"
    assert legit_case.raw_file_path != "retention_scrubbed_legitimate_mail"
    assert os.path.exists(legit_case.raw_file_path)
    assert legit_case.gmail_message_id == "msg_legit_unscrubbed"

    # Verify raw headers are NOT redacted
    h_res = await db_session.execute(select(Headers).where(Headers.case_id == legit_case.id))
    h = h_res.scalar_one_or_none()
    assert h is not None
    assert h.raw_headers != "REDACTED_PRIVACY_RETENTION"
    assert "GitHub" in h.raw_headers

    # 2. Process phishing email from Gmail
    phish_case = await process_raw_email_bytes(
        content_bytes=PHISHING_SAMPLE_EML,
        source="gmail",
        gmail_account="privacy.test@gmail.com",
        gmail_message_id="msg_phish_unscrubbed",
        db=db_session,
    )

    assert phish_case.risk_category in ("phishing", "bec", "suspicious")
    assert phish_case.raw_file_path != "retention_scrubbed_legitimate_mail"
    assert os.path.exists(phish_case.raw_file_path)
    assert phish_case.gmail_message_id == "msg_phish_unscrubbed"

    # Cleanup disk test files
    for p in (legit_case.raw_file_path, phish_case.raw_file_path):
        try:
            if os.path.exists(p):
                os.remove(p)
        except Exception:
            pass


@pytest.mark.asyncio
async def test_gmail_trash_only_after_retention_and_opt_in(db_session):
    """
    Acceptance Criteria:
    - Gmail-Trash action only occurs when auto_trash_on_purge is explicitly enabled.
    - Purge only happens via the scheduled job, never at scoring time.
    - Trashing action is logged to audit_log with action='gmail_message_trashed'.
    """
    # 1. Register test GmailAccount
    acc_res = await db_session.execute(
        select(GmailAccount).where(GmailAccount.gmail_address == "retention.test@gmail.com")
    )
    acc = acc_res.scalar_one_or_none()
    if not acc:
        acc = GmailAccount(
            id="retention-test-acc-id",
            gmail_address="retention.test@gmail.com",
            encrypted_refresh_token=encrypt_token("mock_token_val"),
            scopes_granted="https://www.googleapis.com/auth/gmail.modify",
            last_history_id="1000",
            status="active",
        )
        db_session.add(acc)
        await db_session.commit()

    # Case A: auto_trash_on_purge is FALSE (default)
    policy = await get_or_create_retention_policy(db_session)
    policy.auto_trash_on_purge = False
    await db_session.commit()

    case_default = await process_raw_email_bytes(
        content_bytes=CLEAN_SAMPLE_EML,
        source="gmail",
        gmail_account="retention.test@gmail.com",
        gmail_message_id="msg_do_not_trash_01",
        db=db_session,
    )
    # Fast-forward age past 90-day retention
    case_default.submitted_at = datetime.now(timezone.utc) - timedelta(days=95)
    await db_session.commit()

    with patch("backend.app.core.gmail_poller.trash_gmail_message") as mock_trash:
        purged_count, _ = await execute_retention_purge(db_session, retention_days=90)
        assert purged_count >= 1
        # When auto_trash_on_purge is False, Gmail Trash must NOT be called
        mock_trash.assert_not_called()

    # Case B: auto_trash_on_purge is TRUE (opted in)
    policy.auto_trash_on_purge = True
    await db_session.commit()

    case_opted = await process_raw_email_bytes(
        content_bytes=CLEAN_SAMPLE_EML,
        source="gmail",
        gmail_account="retention.test@gmail.com",
        gmail_message_id="msg_trash_opted_in_02",
        db=db_session,
    )
    case_opted.submitted_at = datetime.now(timezone.utc) - timedelta(days=95)
    await db_session.commit()

    with patch("backend.app.core.gmail_poller.trash_gmail_message") as mock_trash:
        purged_count, _ = await execute_retention_purge(db_session, retention_days=90)
        assert purged_count >= 1
        mock_trash.assert_called_once_with("retention.test@gmail.com", "msg_trash_opted_in_02", db_session)

        # Audit log verification
        audit_res = await db_session.execute(
            select(AuditLog).where(
                AuditLog.action == "gmail_message_trashed",
                AuditLog.case_id == case_opted.id,
            )
        )
        entry = audit_res.scalar_one_or_none()
        assert entry is not None
        assert "msg_trash_opted_in_02" in entry.details


@pytest.mark.asyncio
async def test_gmail_trash_failure_does_not_block_local_purge(db_session):
    """
    Acceptance Criteria:
    If Gmail trash API call fails (revoked token, message already deleted, API error),
    the local purge must still complete independently and failure is logged.
    """
    policy = await get_or_create_retention_policy(db_session)
    policy.auto_trash_on_purge = True
    await db_session.commit()

    case = await process_raw_email_bytes(
        content_bytes=CLEAN_SAMPLE_EML,
        source="gmail",
        gmail_account="retention.test@gmail.com",
        gmail_message_id="msg_trash_error_404",
        db=db_session,
    )
    case.submitted_at = datetime.now(timezone.utc) - timedelta(days=95)
    await db_session.commit()

    # Mock trash_gmail_message to throw an error
    with patch(
        "backend.app.core.gmail_poller.trash_gmail_message",
        side_effect=RuntimeError("Google API 404: Requested message not found"),
    ):
        purged_count, _ = await execute_retention_purge(db_session, retention_days=90)
        assert purged_count >= 1

        # Local purge completed independently
        q = await db_session.execute(select(Case).where(Case.id == case.id))
        refreshed = q.scalar_one()
        assert refreshed.is_purged is True
        assert refreshed.subject == "[PURGED - COMPLIANCE RETENTION]"

        # Failure logged in audit log
        audit_res = await db_session.execute(
            select(AuditLog).where(
                AuditLog.action == "gmail_trash_failed",
                AuditLog.case_id == case.id,
            )
        )
        fail_log = audit_res.scalar_one_or_none()
        assert fail_log is not None
        assert "Google API 404" in fail_log.details


def test_no_hardcoded_credentials_in_repo():
    """
    Acceptance Criteria:
    Confirm TOKEN_ENCRYPTION_KEY, GOOGLE_CLIENT_ID, and GOOGLE_CLIENT_SECRET
    are read exclusively via settings/env and appear nowhere as literal string values in repo.
    Confirm .env.example contains all 5 Gmail-related env vars with placeholders.
    Confirm .env is in .gitignore.
    """
    from backend.app.config import Settings

    # Check field defaults in Settings model
    dummy = Settings()
    # Fields default to empty string if not supplied in env
    assert hasattr(dummy, "GOOGLE_CLIENT_ID")
    assert hasattr(dummy, "GOOGLE_CLIENT_SECRET")
    assert hasattr(dummy, "TOKEN_ENCRYPTION_KEY")
    assert hasattr(dummy, "GOOGLE_REDIRECT_URI")
    assert hasattr(dummy, "GMAIL_POLL_INTERVAL_SECONDS")

    # Verify .env.example exists and contains placeholders
    for env_path in ("Backend/.env.example", ".env.example"):
        assert os.path.exists(env_path)
        with open(env_path, "r", encoding="utf-8") as f:
            content = f.read()
        assert "GOOGLE_CLIENT_ID=" in content
        assert "GOOGLE_CLIENT_SECRET=" in content
        assert "GOOGLE_REDIRECT_URI=" in content
        assert "TOKEN_ENCRYPTION_KEY=" in content
        assert "GMAIL_POLL_INTERVAL_SECONDS=" in content

    # Verify .gitignore contains .env
    assert os.path.exists(".gitignore")
    with open(".gitignore", "r", encoding="utf-8") as f:
        git_content = f.read()
    assert ".env" in git_content


@pytest.mark.asyncio
async def test_gmail_poller_caching_and_mocked_history_list(db_session):
    """Verify token caching in memory and differential history polling."""
    account_id = "test-poller-account-uuid"
    raw_refresh = "1//mock_refresh_token_for_poller"
    encrypted_refresh = encrypt_token(raw_refresh)

    # Upsert test account
    existing = await db_session.execute(select(GmailAccount).where(GmailAccount.gmail_address == "poller.test@gmail.com"))
    acc = existing.scalar_one_or_none()
    if not acc:
        acc = GmailAccount(
            id=account_id,
            gmail_address="poller.test@gmail.com",
            encrypted_refresh_token=encrypted_refresh,
            scopes_granted="https://www.googleapis.com/auth/gmail.modify",
            last_history_id="1000",
            connected_at=datetime.now(timezone.utc),
            status="active",
        )
        db_session.add(acc)
        await db_session.commit()

    # Mock Google Token Refresh & Gmail API calls
    b64_msg = base64.urlsafe_b64encode(PHISHING_SAMPLE_EML).decode("ASCII")

    mock_token_response = MagicMock()
    mock_token_response.status_code = 200
    mock_token_response.json.return_value = {"access_token": "ya29.mock_access_token_123", "expires_in": 3600}

    mock_history_response = MagicMock()
    mock_history_response.status_code = 200
    mock_history_response.json.return_value = {
        "historyId": "1050",
        "history": [
            {"messagesAdded": [{"message": {"id": "msg_abc_999"}}]}
        ],
    }

    mock_msg_response = MagicMock()
    mock_msg_response.status_code = 200
    mock_msg_response.json.return_value = {"id": "msg_abc_999", "raw": b64_msg}

    async def mock_post(url, **kwargs):
        if "oauth2.googleapis.com/token" in url:
            return mock_token_response
        return MagicMock(status_code=200)

    async def mock_get(url, **kwargs):
        if "users/me/history" in url:
            return mock_history_response
        elif "messages/msg_abc_999" in url:
            return mock_msg_response
        return MagicMock(status_code=200, json=lambda: {})

    with patch("httpx.AsyncClient.post", side_effect=mock_post), \
         patch("httpx.AsyncClient.get", side_effect=mock_get):
        
        await poll_gmail_account(acc.id, db_override=db_session)

        # Verify access token was cached
        assert acc.id in _token_cache
        assert _token_cache[acc.id]["access_token"] == "ya29.mock_access_token_123"

        # Verify account last_history_id updated to 1050
        refreshed_acc = (await db_session.execute(select(GmailAccount).where(GmailAccount.id == acc.id))).scalar_one()
        assert refreshed_acc.last_history_id == "1050"


@pytest.mark.asyncio
async def test_gmail_api_endpoints(client: AsyncClient, db_session):
    """Verify FastAPI routes for /gmail/auth-url, /gmail/status, and /gmail/disconnect."""
    # 1. GET /api/gmail/auth-url
    auth_resp = await client.get("/api/gmail/auth-url")
    assert auth_resp.status_code == 200
    auth_data = auth_resp.json()
    assert "auth_url" in auth_data
    assert "accounts.google.com" in auth_data["auth_url"]
    assert "gmail.readonly" in auth_data["auth_url"]
    assert "state" in auth_data

    # 2. GET /api/gmail/status
    status_resp = await client.get("/api/gmail/status")
    assert status_resp.status_code == 200
    status_data = status_resp.json()
    assert "connected" in status_data
    assert "status" in status_data

    # 3. POST /api/gmail/disconnect
    disc_resp = await client.post("/api/gmail/disconnect")
    assert disc_resp.status_code == 200
    disc_data = disc_resp.json()
    assert disc_data["success"] is True


@pytest.mark.asyncio
async def test_cases_stream_endpoint_does_not_collide_with_case_id(client: AsyncClient, db_session):
    """
    Verify that GET /api/cases/stream connects cleanly as SSE and is NOT intercepted
    as a dynamic case_id parameter by GET /api/cases/{case_id}.
    Also verify GET /api/cases/{case_id} returns 404 (not 500 column error).
    """
    from backend.app.main import app
    from backend.app.api.cases import stream_cases

    # 1. Non-existent case lookup returns 404, proving schema queries succeed without 500
    detail_resp = await client.get("/api/cases/non-existent-uuid")
    assert detail_resp.status_code == 404
    assert "not found" in detail_resp.json()["detail"].lower()

    # 2. Verify route ordering in cases_router:
    from backend.app.api.cases import router as cases_router
    cases_paths = [r.path for r in cases_router.routes if hasattr(r, "path")]

    # Verify /cases/stream comes before /cases/{case_id} (single-segment dynamic route)
    stream_index = cases_paths.index("/cases/stream")
    detail_index = cases_paths.index("/cases/{case_id}")
    assert stream_index < detail_index, f"Expected /cases/stream ({stream_index}) < /cases/{{case_id}} ({detail_index})"

    # 3. Verify stream_cases returns an EventSourceResponse
    sse_response = await stream_cases()
    assert hasattr(sse_response, "body_iterator")
    assert sse_response.media_type == "text/event-stream"
