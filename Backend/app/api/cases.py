import os
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, asc, or_
from sqlalchemy.orm import selectinload

from backend.app.database import get_db
from backend.app.models.case import Case
from backend.app.models.header import Headers, RelayHop
from backend.app.models.content import NLPFinding, URLFinding
from backend.app.models.origin import Geolocation, DomainIntel
from backend.app.models.audit import AuditLog

from backend.app.schemas.case import (
    CasesResponse,
    CaseSummary,
    CaseDetail,
    IngestResponse,
    CaseStatusResponse,
    ScoreSignal,
)
from backend.app.schemas.header import (
    CaseHeaders,
    SPFSchema,
    DKIMSchema,
    DMARCSchema,
    RelayHopSchema,
)
from backend.app.schemas.content import CaseContent, URLFindingSchema
from backend.app.schemas.origin import CaseOrigin, GeolocationSchema, DomainIntelSchema

from backend.app.core.ingestion import parse_raw_email
from backend.app.core.pipeline import execute_case_pipeline

router = APIRouter(tags=["Cases & Ingestion"])

# =======================================================
# 1. Ingestion: POST /cases/upload
# =======================================================
@router.post("/cases/upload", response_model=IngestResponse, status_code=status.HTTP_202_ACCEPTED)
async def upload_case(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    try:
        content_bytes = await file.read()
        if not content_bytes:
            raise HTTPException(status_code=400, detail="Empty email file uploaded.")

        # Parse raw MIME
        parsed = parse_raw_email(content_bytes)

        # Create Case in DB
        case = Case(
            file_hash=parsed.file_hash,
            raw_file_path=parsed.raw_file_path,
            subject=parsed.subject,
            sender=parsed.sender,
            sender_domain=parsed.sender_domain,
            recipient=parsed.recipient,
            received_at=parsed.received_at,
            status="processing",
            pipeline_progress={
                "header_analysis": "pending",
                "nlp_analysis": "pending",
                "geolocation": "pending",
                "domain_intel": "pending",
                "scoring": "pending",
            },
        )
        db.add(case)
        await db.commit()
        await db.refresh(case)

        # Launch background pipeline orchestrator
        background_tasks.add_task(execute_case_pipeline, case.id, parsed, content_bytes)

        # Audit log
        audit_entry = AuditLog(
            username="analyst",
            action="case_upload",
            case_id=case.id,
            details=f"Submitted .eml evidence '{file.filename}' (SHA-256: {parsed.file_hash[:16]}...)",
        )
        db.add(audit_entry)
        await db.commit()

        return IngestResponse(
            case_id=case.id,
            status="processing",
            submitted_at=case.submitted_at.isoformat(),
            file_hash=case.file_hash,
            filename=file.filename,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse and ingest .eml: {str(e)}")

# =======================================================
# 2. Polling Status: GET /cases/{id}/status
# =======================================================
@router.get("/cases/{case_id}/status", response_model=CaseStatusResponse)
async def get_case_status(case_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Case).where(Case.id == case_id))
    case = result.scalar_one_or_none()
    if not case:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found")

    return CaseStatusResponse(
        case_id=case.id,
        status=case.status,
        progress=case.pipeline_progress or {},
    )

# =======================================================
# 3. Case List Queue: GET /cases
# =======================================================
@router.get("/cases", response_model=CasesResponse)
async def list_cases(
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1, le=100),
    min_score: Optional[int] = Query(None, ge=0, le=100),
    risk_category: Optional[str] = Query(None),
    sort_by: str = Query("date"),  # 'date', 'score', 'sender'
    sort_order: str = Query("desc"),  # 'asc', 'desc'
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    query = select(Case).options(selectinload(Case.headers))

    # Search filter
    if search and search.strip():
        term = f"%{search.strip().lower()}%"
        query = query.where(
            or_(
                func.lower(Case.subject).like(term),
                func.lower(Case.sender).like(term),
                func.lower(Case.id).like(term),
                func.lower(Case.sender_domain).like(term),
            )
        )

    # Risk category filter
    if risk_category and risk_category != "all":
        query = query.where(Case.risk_category == risk_category)

    # Minimum score filter
    if min_score is not None and min_score > 0:
        query = query.where(Case.fraud_score >= min_score)

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total_count = total_result.scalar_one()

    # Sorting
    if sort_by == "score":
        sort_col = Case.fraud_score
    elif sort_by == "sender":
        sort_col = Case.sender
    else:
        sort_col = Case.received_at

    query = query.order_by(desc(sort_col) if sort_order == "desc" else asc(sort_col))

    # Pagination
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)

    results = await db.execute(query)
    cases = results.scalars().all()

    case_summaries = []
    for c in cases:
        spf_val = c.headers.spf_result if c.headers else "none"
        dkim_val = c.headers.dkim_result if c.headers else "none"
        dmarc_val = c.headers.dmarc_result if c.headers else "none"

        case_summaries.append(CaseSummary(
            case_id=c.id,
            subject=c.subject,
            sender=c.sender,
            received_at=c.received_at.isoformat(),
            fraud_score=c.fraud_score or 0,
            risk_category=c.risk_category or "legitimate",
            spf=spf_val,
            dkim=dkim_val,
            dmarc=dmarc_val,
        ))

    return CasesResponse(
        total=total_count,
        page=page,
        limit=limit,
        cases=case_summaries,
    )

# =======================================================
# 4. Full Case Detail: GET /cases/{id}
# =======================================================
@router.get("/cases/{case_id}", response_model=CaseDetail)
async def get_case_detail(case_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Case)
        .options(selectinload(Case.headers))
        .where(Case.id == case_id)
    )
    case = result.scalar_one_or_none()
    if not case:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found")

    breakdown = []
    if case.score_breakdown:
        for s in case.score_breakdown:
            breakdown.append(ScoreSignal(
                signal=s.get("signal", "Unknown Signal"),
                weight=s.get("weight", 0),
                contribution=s.get("contribution", 0),
                reason=s.get("reason"),
                sourceModule=s.get("sourceModule", "fusion"),
            ))

    spf_val = case.headers.spf_result if case.headers else "none"
    dkim_val = case.headers.dkim_result if case.headers else "none"
    dmarc_val = case.headers.dmarc_result if case.headers else "none"

    return CaseDetail(
        case_id=case.id,
        subject=case.subject,
        sender=case.sender,
        received_at=case.received_at.isoformat(),
        file_hash=case.file_hash,
        fraud_score=case.fraud_score or 0,
        risk_category=case.risk_category or "legitimate",
        confidence=case.confidence or "medium",
        verdict_summary=case.verdict_summary or "Analysis in progress.",
        score_breakdown=breakdown,
        spf=spf_val,
        dkim=dkim_val,
        dmarc=dmarc_val,
    )

# =======================================================
# 5. Case Headers & Relay Trace: GET /cases/{id}/headers
# =======================================================
@router.get("/cases/{case_id}/headers", response_model=CaseHeaders)
async def get_case_headers(case_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Headers).where(Headers.case_id == case_id))
    headers_db = result.scalar_one_or_none()
    if not headers_db:
        raise HTTPException(status_code=404, detail=f"Headers for case {case_id} not found")

    # Fetch relay hops
    hops_result = await db.execute(
        select(RelayHop).where(RelayHop.case_id == case_id).order_by(RelayHop.hop_number)
    )
    hops_db = hops_result.scalars().all()

    hops_schema = [
        RelayHopSchema(
            hop=h.hop_number,
            ip=h.ip,
            server=h.server,
            by_server=h.by_server,
            timestamp=h.timestamp.isoformat() if h.timestamp else datetime.now(timezone.utc).isoformat(),
            delay_ms=h.delay_ms or 0,
            spf_status=h.spf_status,
            country=h.country or "Unknown",
            is_earliest_origin=h.is_earliest_origin,
        )
        for h in hops_db
    ]

    return CaseHeaders(
        spf=SPFSchema(
            result=headers_db.spf_result,
            record=headers_db.spf_record,
            sender_ip=headers_db.spf_sender_ip,
        ),
        dkim=DKIMSchema(
            result=headers_db.dkim_result,
            domain=headers_db.dkim_domain,
            selector=headers_db.dkim_selector,
            signature_present=headers_db.dkim_signature_present,
        ),
        dmarc=DMARCSchema(
            result=headers_db.dmarc_result,
            policy=headers_db.dmarc_policy,
            disposition=headers_db.dmarc_disposition,
        ),
        relay_chain=hops_schema,
        anomalies=headers_db.anomalies or [],
    )

# =======================================================
# 6. Case Content Analysis: GET /cases/{id}/content
# =======================================================
@router.get("/cases/{case_id}/content", response_model=CaseContent)
async def get_case_content(case_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(NLPFinding).where(NLPFinding.case_id == case_id))
    nlp_db = result.scalar_one_or_none()
    if not nlp_db:
        raise HTTPException(status_code=404, detail=f"Content analysis for case {case_id} not found")

    urls_result = await db.execute(select(URLFinding).where(URLFinding.case_id == case_id))
    urls_db = urls_result.scalars().all()

    urls_schema = [
        URLFindingSchema(
            original=u.original_url,
            resolved=u.resolved_url,
            domain=u.domain,
            flagged=u.is_flagged,
            reason=u.reason,
        )
        for u in urls_db
    ]

    return CaseContent(
        classification=nlp_db.classification,
        classification_confidence=nlp_db.classification_confidence,
        sentiment_urgency_score=nlp_db.sentiment_urgency_score or 0,
        impersonation_target=nlp_db.impersonation_target,
        flagged_phrases=nlp_db.flagged_phrases or [],
        bec_indicators=nlp_db.bec_indicators or [],
        urls=urls_schema,
    )

# =======================================================
# 7. Case Origin & Geo: GET /cases/{id}/origin
# =======================================================
@router.get("/cases/{case_id}/origin", response_model=CaseOrigin)
async def get_case_origin(case_id: str, db: AsyncSession = Depends(get_db)):
    geo_result = await db.execute(select(Geolocation).where(Geolocation.case_id == case_id))
    geo_db = geo_result.scalar_one_or_none()

    domain_result = await db.execute(select(DomainIntel).where(DomainIntel.case_id == case_id))
    domain_db = domain_result.scalar_one_or_none()

    if not geo_db or not domain_db:
        raise HTTPException(status_code=404, detail=f"Origin intelligence for case {case_id} not found")

    return CaseOrigin(
        originating_ip=geo_db.originating_ip,
        geolocation=GeolocationSchema(
            country=geo_db.country,
            region=geo_db.region,
            city=geo_db.city,
            latitude=geo_db.latitude,
            longitude=geo_db.longitude,
            precision_confidence=geo_db.precision_confidence,
        ),
        isp=geo_db.isp,
        vpn_tor_flag=False,
        flag_source="AbuseIPDB",
        domain_intel=DomainIntelSchema(
            domain=domain_db.domain,
            registrar=domain_db.registrar,
            registered_on=domain_db.registered_on,
            domain_age_days=domain_db.domain_age_days,
            registrant_country=domain_db.registrant_country,
            mx_valid=domain_db.mx_valid,
        ),
    )

# =======================================================
# 8. High Risk Threat Alerts: GET /alerts
# =======================================================
@router.get("/alerts")
async def get_alerts(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Case)
        .where(Case.fraud_score >= 70)
        .order_by(desc(Case.received_at))
        .limit(10)
    )
    cases = result.scalars().all()
    
    alerts_list = [
        {
            "alert_id": f"alert-{c.id[:8]}",
            "case_id": c.id,
            "subject": c.subject,
            "sender": c.sender,
            "fraud_score": c.fraud_score or 0,
            "risk_category": c.risk_category or "phishing",
            "triggered_at": c.received_at.isoformat(),
        }
        for c in cases
    ]
    return {"alerts": alerts_list}

# =======================================================
# 9. Phase 4 Stubs: Correlation, Campaigns, Settings, Audit
# =======================================================
@router.get("/cases/{case_id}/correlation")
async def get_case_correlation(case_id: str):
    # TODO (Phase 4): Full campaign adjacency graph clustering
    return {
        "threat_intel_matches": [
            {"indicator": "185.220.101.5", "source": "AbuseIPDB", "abuse_score": 88}
        ],
        "campaign_id": "camp-3391",
        "linked_cases": [case_id],
        "shared_indicator": "Shared Bulletproof Relay Subnet (AS9009)",
    }

@router.get("/campaigns")
async def get_campaigns():
    # TODO (Phase 4): Campaign cluster list
    return {
        "campaigns": [
            {
                "campaign_id": "camp-3391",
                "name": "PhantomRelay Phishing Cluster",
                "case_count": 14,
                "shared_indicator": "185.220.101.0/24 (Tor Exit Node)",
                "indicator_type": "ip_subnet",
                "first_seen": "2026-08-15T08:00:00Z",
                "last_seen": "2026-09-02T10:00:00Z",
                "primary_risk_category": "phishing",
                "average_fraud_score": 89,
            }
        ]
    }
