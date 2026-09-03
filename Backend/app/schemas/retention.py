from typing import Optional
from pydantic import BaseModel, ConfigDict

class RetentionPolicySchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    retention_days: int
    auto_purge: bool
    mask_pii: bool
    mask_sender_email: bool
    mask_recipient: bool
    export_compliance_level: str

class RetentionPolicyUpdate(BaseModel):
    retention_days: Optional[int] = None
    auto_purge: Optional[bool] = None
    mask_pii: Optional[bool] = None
    mask_sender_email: Optional[bool] = None
    mask_recipient: Optional[bool] = None
    export_compliance_level: Optional[str] = None

class PurgeResultSchema(BaseModel):
    purged_cases_count: int
    retention_days: int
    cutoff_timestamp: str
    message: str
