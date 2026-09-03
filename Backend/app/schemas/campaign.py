from typing import List, Optional
from pydantic import BaseModel, ConfigDict

class CampaignSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    campaign_id: str
    name: str
    case_count: int
    shared_indicator: str
    indicator_type: str
    first_seen: str
    last_seen: str
    primary_risk_category: str
    average_fraud_score: float

class CampaignNode(BaseModel):
    type: str  # 'domain', 'ip', 'mailserver', 'payload_url'
    value: str
    first_observed: str

class CampaignTimelineEvent(BaseModel):
    timestamp: str
    case_id: str
    subject: str
    target_recipient: str

class CampaignDetail(CampaignSummary):
    description: str
    linked_case_ids: List[str]
    infrastructure_nodes: List[CampaignNode]
    timeline_events: List[CampaignTimelineEvent]

class CampaignListResponse(BaseModel):
    campaigns: List[CampaignSummary]
