from typing import List, Optional
from pydantic import BaseModel

class SPFSchema(BaseModel):
    result: str  # 'pass', 'fail', 'softfail', 'neutral', 'none'
    record: Optional[str] = None
    sender_ip: Optional[str] = None

class DKIMSchema(BaseModel):
    result: str  # 'pass', 'fail', 'softfail', 'neutral', 'none'
    domain: Optional[str] = None
    selector: Optional[str] = None
    signature_present: bool = False

class DMARCSchema(BaseModel):
    result: str  # 'pass', 'fail', 'softfail', 'neutral', 'none'
    policy: Optional[str] = None  # 'none', 'quarantine', 'reject'
    disposition: Optional[str] = None

class RelayHopSchema(BaseModel):
    hop: int
    ip: str
    server: Optional[str] = None
    by_server: Optional[str] = None
    timestamp: str
    delay_ms: Optional[int] = 0
    spf_status: Optional[str] = None
    country: Optional[str] = None
    is_earliest_origin: Optional[bool] = False

    class Config:
        from_attributes = True

class CaseHeaders(BaseModel):
    spf: SPFSchema
    dkim: DKIMSchema
    dmarc: DMARCSchema
    relay_chain: List[RelayHopSchema]
    anomalies: List[str]

    class Config:
        from_attributes = True
