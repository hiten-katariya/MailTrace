from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.database import get_db
from backend.app.models.audit import AuditLog
from backend.app.schemas.retention import RetentionPolicySchema, RetentionPolicyUpdate, PurgeResultSchema
from backend.app.core.retention import get_or_create_retention_policy, execute_retention_purge

router = APIRouter(prefix="/settings", tags=["Settings & Compliance"])

@router.get("/retention", response_model=RetentionPolicySchema)
async def get_retention_settings(db: AsyncSession = Depends(get_db)):
    policy = await get_or_create_retention_policy(db)
    return RetentionPolicySchema(
        retention_days=policy.retention_days,
        auto_purge=policy.auto_purge,
        mask_pii=policy.mask_pii,
        mask_sender_email=policy.mask_sender_email,
        mask_recipient=policy.mask_recipient,
        export_compliance_level=policy.export_compliance_level,
    )


@router.put("/retention", response_model=RetentionPolicySchema)
async def update_retention_settings(
    update_data: RetentionPolicyUpdate,
    db: AsyncSession = Depends(get_db),
):
    policy = await get_or_create_retention_policy(db)

    changes = []
    if update_data.retention_days is not None:
        policy.retention_days = update_data.retention_days
        changes.append(f"retention_days={update_data.retention_days}")
    if update_data.auto_purge is not None:
        policy.auto_purge = update_data.auto_purge
        changes.append(f"auto_purge={update_data.auto_purge}")
    if update_data.mask_pii is not None:
        policy.mask_pii = update_data.mask_pii
        changes.append(f"mask_pii={update_data.mask_pii}")
    if update_data.mask_sender_email is not None:
        policy.mask_sender_email = update_data.mask_sender_email
        changes.append(f"mask_sender_email={update_data.mask_sender_email}")
    if update_data.mask_recipient is not None:
        policy.mask_recipient = update_data.mask_recipient
        changes.append(f"mask_recipient={update_data.mask_recipient}")
    if update_data.export_compliance_level is not None:
        policy.export_compliance_level = update_data.export_compliance_level
        changes.append(f"export_compliance_level={update_data.export_compliance_level}")

    # Audit log entry for settings change
    audit_entry = AuditLog(
        username="Alex Rivera (Analyst-01)",
        action="settings_changed",
        details=f"Updated compliance settings: {', '.join(changes)}",
    )
    db.add(audit_entry)
    await db.commit()
    await db.refresh(policy)

    return RetentionPolicySchema(
        retention_days=policy.retention_days,
        auto_purge=policy.auto_purge,
        mask_pii=policy.mask_pii,
        mask_sender_email=policy.mask_sender_email,
        mask_recipient=policy.mask_recipient,
        export_compliance_level=policy.export_compliance_level,
    )


@router.post("/retention/purge", response_model=PurgeResultSchema)
async def trigger_retention_purge(db: AsyncSession = Depends(get_db)):
    policy = await get_or_create_retention_policy(db)
    purged_count, cutoff = await execute_retention_purge(db, policy.retention_days)

    return PurgeResultSchema(
        purged_cases_count=purged_count,
        retention_days=policy.retention_days,
        cutoff_timestamp=cutoff.isoformat(),
        message=f"Purge complete: {purged_count} derived case records purged past {policy.retention_days} days. Raw file hashes preserved.",
    )
