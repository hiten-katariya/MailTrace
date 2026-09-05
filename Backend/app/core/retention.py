import re
import os
from datetime import datetime, timezone, timedelta
from typing import Optional, Tuple
from sqlalchemy import select, delete, and_
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.retention import RetentionPolicy
from backend.app.models.case import Case
from backend.app.models.header import Headers, RelayHop
from backend.app.models.content import NLPFinding, URLFinding
from backend.app.models.origin import Geolocation, DomainIntel
from backend.app.models.audit import AuditLog

async def get_or_create_retention_policy(db: AsyncSession) -> RetentionPolicy:
    res = await db.execute(select(RetentionPolicy).where(RetentionPolicy.id == 1))
    policy = res.scalar_one_or_none()
    if not policy:
        policy = RetentionPolicy(
            id=1,
            retention_days=90,
            auto_purge=True,
            auto_trash_on_purge=False,
            mask_pii=True,
            mask_sender_email=True,
            mask_recipient=True,
            export_compliance_level="standard",
        )
        db.add(policy)
        await db.commit()
        await db.refresh(policy)
    return policy

def mask_email_address(email_str: Optional[str]) -> Optional[str]:
    """
    Masks local part of an email address while preserving domain:
    e.g. 'john.doe@company.com' -> 'j***e@company.com'
    e.g. 'alice@corp.org' -> 'a***e@corp.org'
    e.g. 'a@b.com' -> '***@b.com'
    """
    if not email_str:
        return email_str
    email_clean = email_str.strip()
    # Check if there is display name like: "John Doe" <john@company.com>
    name_match = re.match(r'^(.*?)<([^>]+)>$', email_clean)
    if name_match:
        display_name, raw_email = name_match.group(1).strip(), name_match.group(2).strip()
        masked_raw = mask_email_address(raw_email)
        masked_name = f"{display_name[0]}***" if display_name else ""
        return f'"{masked_name}" <{masked_raw}>' if masked_name else f"<{masked_raw}>"

    if "@" not in email_clean:
        if len(email_clean) <= 2:
            return "***"
        return f"{email_clean[0]}***{email_clean[-1]}"

    local, domain = email_clean.split("@", 1)
    if len(local) <= 2:
        masked_local = "***"
    else:
        masked_local = f"{local[0]}***{local[-1]}"
    return f"{masked_local}@{domain}"

async def execute_retention_purge(db: AsyncSession, retention_days: int) -> Tuple[int, datetime]:
    """
    Purges derived forensic analysis rows for cases older than retention_days,
    removes raw .eml from local disk, optionally moves expired Gmail messages to Trash if auto_trash_on_purge is True,
    while ALWAYS preserving the immutable Case record and raw file hash (FR7.4).
    """
    policy = await get_or_create_retention_policy(db)
    cutoff = datetime.now(timezone.utc) - timedelta(days=retention_days)
    
    # Query cases older than cutoff that have not been purged yet
    query = select(Case).where(
        and_(
            Case.submitted_at < cutoff,
            Case.is_purged == False,
        )
    )
    res = await db.execute(query)
    cases_to_purge = res.scalars().all()
    
    purged_count = len(cases_to_purge)
    for c in cases_to_purge:
        # 1. Wipe derived child tables explicitly
        await db.execute(delete(Headers).where(Headers.case_id == c.id))
        await db.execute(delete(RelayHop).where(RelayHop.case_id == c.id))
        await db.execute(delete(NLPFinding).where(NLPFinding.case_id == c.id))
        await db.execute(delete(URLFinding).where(URLFinding.case_id == c.id))
        await db.execute(delete(Geolocation).where(Geolocation.case_id == c.id))
        await db.execute(delete(DomainIntel).where(DomainIntel.case_id == c.id))

        # 2. Local raw .eml file removal
        if c.raw_file_path and os.path.exists(c.raw_file_path):
            try:
                os.remove(c.raw_file_path)
            except Exception as pe:
                print(f"[-] Could not delete raw file {c.raw_file_path}: {pe}")

        # 3. For source='gmail' cases: optionally move message to Gmail Trash if auto_trash_on_purge is enabled
        if c.source == "gmail" and getattr(policy, "auto_trash_on_purge", False) and c.gmail_message_id and c.gmail_account:
            try:
                from backend.app.core.gmail_poller import trash_gmail_message
                await trash_gmail_message(c.gmail_account, c.gmail_message_id, db)
                audit_trash = AuditLog(
                    username="retention_daemon",
                    action="gmail_message_trashed",
                    case_id=c.id,
                    details=f"Moved Gmail message {c.gmail_message_id} to Gmail Trash for account {c.gmail_account}",
                )
                db.add(audit_trash)
            except Exception as ge:
                print(f"[-] Gmail trash API call failed for case {c.id} (msg {c.gmail_message_id}): {ge}")
                audit_trash_fail = AuditLog(
                    username="retention_daemon",
                    action="gmail_trash_failed",
                    case_id=c.id,
                    details=f"Failed to trash Gmail message {c.gmail_message_id}: {str(ge)}",
                )
                db.add(audit_trash_fail)

        # 4. Sanitize personal metadata in the Case record itself
        c.subject = "[PURGED - COMPLIANCE RETENTION]"
        c.sender = mask_email_address(c.sender) or "[PURGED]"
        if c.recipient:
            c.recipient = mask_email_address(c.recipient) or "[PURGED]"
        c.score_breakdown = []
        c.verdict_summary = f"Derived analysis purged per {retention_days}-day compliance retention policy. Evidence SHA-256 lock retained."
        c.is_purged = True

        # 5. Audit log entry for chain of custody
        audit_entry = AuditLog(
            username="retention_daemon",
            action="case_purged",
            case_id=c.id,
            details=f"Purged derived analysis past {retention_days} days. Preserved raw evidence file hash {c.file_hash}.",
        )
        db.add(audit_entry)

    if purged_count > 0:
        await db.commit()

    return purged_count, cutoff

