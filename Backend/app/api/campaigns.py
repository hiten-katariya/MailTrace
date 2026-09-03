from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.database import get_db
from backend.app.models.campaign import Campaign
from backend.app.models.case import Case
from backend.app.models.origin import Geolocation
from backend.app.models.content import URLFinding
from backend.app.schemas.campaign import CampaignSummary, CampaignDetail, CampaignListResponse, CampaignNode, CampaignTimelineEvent
from backend.app.core.retention import get_or_create_retention_policy, mask_email_address

router = APIRouter(tags=["Campaigns"])

@router.get("/campaigns", response_model=CampaignListResponse)
async def list_campaigns(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Campaign).order_by(desc(Campaign.last_seen)))
    campaigns = result.scalars().all()

    summaries = [
        CampaignSummary(
            campaign_id=c.id,
            name=c.name,
            case_count=c.case_count,
            shared_indicator=c.shared_indicator,
            indicator_type=c.shared_indicator_type,
            first_seen=c.first_seen.isoformat(),
            last_seen=c.last_seen.isoformat(),
            primary_risk_category=c.primary_risk_category,
            average_fraud_score=c.average_fraud_score,
        )
        for c in campaigns
    ]
    return CampaignListResponse(campaigns=summaries)


@router.get("/campaigns/{campaign_id}", response_model=CampaignDetail)
async def get_campaign_detail(campaign_id: str, db: AsyncSession = Depends(get_db)):
    camp_res = await db.execute(select(Campaign).where(Campaign.id == campaign_id))
    camp = camp_res.scalar_one_or_none()
    if not camp:
        raise HTTPException(status_code=404, detail=f"Campaign {campaign_id} not found")

    policy = await get_or_create_retention_policy(db)
    mask_pii = policy.mask_pii

    # Fetch linked cases
    cases_res = await db.execute(
        select(Case).where(Case.campaign_id == campaign_id).order_by(desc(Case.received_at))
    )
    linked_cases = cases_res.scalars().all()
    linked_ids = [c.id for c in linked_cases]

    # Build infrastructure nodes
    nodes: List[CampaignNode] = []
    seen_nodes = set()

    # Add shared indicator node
    shared_type_map = {
        "ip": "ip",
        "domain_family": "domain",
        "body_hash": "mailserver",
        "brand_target": "domain",
    }
    nodes.append(
        CampaignNode(
            type=shared_type_map.get(camp.shared_indicator_type, "domain"),
            value=camp.shared_indicator,
            first_observed=camp.first_seen.isoformat(),
        )
    )
    seen_nodes.add(camp.shared_indicator)

    for c in linked_cases:
        if c.sender_domain and c.sender_domain not in seen_nodes:
            nodes.append(
                CampaignNode(
                    type="domain",
                    value=c.sender_domain,
                    first_observed=c.received_at.isoformat(),
                )
            )
            seen_nodes.add(c.sender_domain)

    # Build timeline events
    timeline: List[CampaignTimelineEvent] = []
    for c in linked_cases:
        recipient = mask_email_address(c.recipient) if mask_pii else (c.recipient or "N/A")
        timeline.append(
            CampaignTimelineEvent(
                timestamp=c.received_at.isoformat(),
                case_id=c.id,
                subject=c.subject,
                target_recipient=recipient or "N/A",
            )
        )

    return CampaignDetail(
        campaign_id=camp.id,
        name=camp.name,
        case_count=camp.case_count,
        shared_indicator=camp.shared_indicator,
        indicator_type=camp.shared_indicator_type,
        first_seen=camp.first_seen.isoformat(),
        last_seen=camp.last_seen.isoformat(),
        primary_risk_category=camp.primary_risk_category,
        average_fraud_score=camp.average_fraud_score,
        description=camp.description or f"Cluster linked by {camp.shared_indicator_type} ({camp.shared_indicator})",
        linked_case_ids=linked_ids,
        infrastructure_nodes=nodes,
        timeline_events=timeline,
    )
