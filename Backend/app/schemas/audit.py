from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime

class AuditLogEntrySchema(BaseModel):
    id: int
    timestamp: datetime
    user_id: Optional[int] = None
    username: str
    action: str
    case_id: Optional[str] = None
    details: Optional[str] = None
    ip_address: Optional[str] = None

    class Config:
        from_attributes = True

class AuditLogResponse(BaseModel):
    total: int
    logs: List[AuditLogEntrySchema]

    class Config:
        from_attributes = True
