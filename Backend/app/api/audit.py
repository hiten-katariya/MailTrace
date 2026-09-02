from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from backend.app.database import get_db
from backend.app.models.audit import AuditLog
from backend.app.schemas.audit import AuditLogResponse, AuditLogEntrySchema

router = APIRouter(tags=["Audit Trail"])

@router.get("/audit-log", response_model=AuditLogResponse)
async def get_audit_log(
    case_id: Optional[str] = Query(None, description="Filter audit logs by case ID"),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    query = select(AuditLog)
    if case_id:
        query = query.where(AuditLog.case_id == case_id)
    
    query = query.order_by(desc(AuditLog.timestamp)).limit(limit)
    result = await db.execute(query)
    logs = result.scalars().all()

    entries = [
        AuditLogEntrySchema(
            id=log.id,
            timestamp=log.timestamp,
            user_id=log.user_id,
            username=log.username,
            action=log.action,
            case_id=log.case_id,
            details=log.details,
            ip_address=log.ip_address,
        )
        for log in logs
    ]

    return AuditLogResponse(
        total=len(entries),
        logs=entries,
    )
