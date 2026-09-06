import os
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks, Query, status, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, asc, or_
from sqlalchemy.orm import selectinload
from collections import defaultdict

from backend.app.config import settings
from backend.app.database import get_db
from backend.app.models.case import Case
from backend.app.models.header import Headers, RelayHop
from backend.app.models.content import NLPFinding, URLFinding
from backend.app.models.origin import Geolocation, DomainIntel, IPReputationCache
from backend.app.models.audit import AuditLog
from backend.app.models.attachment import Attachment

from backend.app.schemas.case import (
    CasesResponse,
    CaseSummary,
    CaseDetail,
    IngestResponse,
    CaseStatusResponse,
    ScoreSignal,
    BatchDeleteRequest,
    DeleteCaseResponse,
)
from backend.app.schemas.header import (
    CaseHeaders,
    SPFSchema,
    DKIMSchema,
    DMARCSchema,
    RelayHopSchema,
)
from backend.app.schemas.content import CaseContent, URLFindingSchema, AttachmentFindingSchema
from backend.app.schemas.origin import CaseOrigin, GeolocationSchema, DomainIntelSchema
from backend.app.schemas.stats import (
    CasesStatsResponse,
    ScoreBracketSchema,
    RiskCategoryCountSchema,
    DetectionTrendDaySchema,
)
from backend.app.schemas.report import CaseReportJSONResponse
from backend.app.models.campaign import Campaign
from backend.app.models.threat_intel import ThreatIntelMatch
from backend.app.schemas.correlation import CaseCorrelationResponse, ThreatIntelMatchSchema
from backend.app.core.retention import get_or_create_retention_policy, mask_email_address

from backend.app.core.ingestion import parse_raw_email
from backend.app.core.pipeline import execute_case_pipeline
from backend.app.core.reporting import generate_pdf_report, build_json_report
from sse_starlette.sse import EventSourceResponse
from backend.app.core.sse import sse_manager

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
            status="pending",
            fraud_score=0,
            risk_category="legitimate",
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

        # Trigger background processing pipeline
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
# 3. Dashboard Statistics: GET /cases/stats
# =======================================================
@router.get("/cases/stats", response_model=CasesStatsResponse)
async def get_cases_stats(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Case))
    all_cases = result.scalars().all()

    total = len(all_cases)
    if total == 0:
        return CasesStatsResponse(
            total_cases=0,
            high_risk_cases=0,
            suspicious_cases=0,
            legitimate_cases=0,
            average_score=0.0,
            by_risk_category=[
                RiskCategoryCountSchema(category="phishing", count=0, percentage=0, color="#EF4444"),
                RiskCategoryCountSchema(category="bec", count=0, percentage=0, color="#F43F5E"),
                RiskCategoryCountSchema(category="suspicious", count=0, percentage=0, color="#F59E0B"),
                RiskCategoryCountSchema(category="legitimate", count=0, percentage=0, color="#10B981"),
            ],
            score_brackets=[
                ScoreBracketSchema(range="0–20", count=0, color="#10B981"),
                ScoreBracketSchema(range="21–40", count=0, color="#28C7E8"),
                ScoreBracketSchema(range="41–60", count=0, color="#F59E0B"),
                ScoreBracketSchema(range="61–80", count=0, color="#F97316"),
                ScoreBracketSchema(range="81–100", count=0, color="#EF4444"),
            ],
            detection_trends=[],
        )

    phishing_count = sum(1 for c in all_cases if c.risk_category == "phishing")
    bec_count = sum(1 for c in all_cases if c.risk_category == "bec")
    suspicious_count = sum(1 for c in all_cases if c.risk_category == "suspicious")
    legit_count = sum(1 for c in all_cases if c.risk_category == "legitimate")
    high_risk = phishing_count + bec_count

    avg_score = round(sum((c.fraud_score or 0) for c in all_cases) / total, 1)

    # Score distribution histogram brackets
    b1 = sum(1 for c in all_cases if (c.fraud_score or 0) <= 20)
    b2 = sum(1 for c in all_cases if 20 < (c.fraud_score or 0) <= 40)
    b3 = sum(1 for c in all_cases if 40 < (c.fraud_score or 0) <= 60)
    b4 = sum(1 for c in all_cases if 60 < (c.fraud_score or 0) <= 80)
    b5 = sum(1 for c in all_cases if (c.fraud_score or 0) > 80)

    score_brackets = [
        ScoreBracketSchema(range="0–20", count=b1, color="#10B981"),
        ScoreBracketSchema(range="21–40", count=b2, color="#28C7E8"),
        ScoreBracketSchema(range="41–60", count=b3, color="#F59E0B"),
        ScoreBracketSchema(range="61–80", count=b4, color="#F97316"),
        ScoreBracketSchema(range="81–100", count=b5, color="#EF4444"),
    ]

    by_risk_category = [
        RiskCategoryCountSchema(
            category="phishing",
            count=phishing_count,
            percentage=round((phishing_count / total) * 100),
            color="#EF4444",
        ),
        RiskCategoryCountSchema(
            category="bec",
            count=bec_count,
            percentage=round((bec_count / total) * 100),
            color="#F43F5E",
        ),
        RiskCategoryCountSchema(
            category="suspicious",
            count=suspicious_count,
            percentage=round((suspicious_count / total) * 100),
            color="#F59E0B",
        ),
        RiskCategoryCountSchema(
            category="legitimate",
            count=legit_count,
            percentage=round((legit_count / total) * 100),
            color="#10B981",
        ),
    ]

    # Daily detection trends
    daily_stats = defaultdict(lambda: {"phishing": 0, "bec": 0, "suspicious": 0, "legitimate": 0})
    for c in all_cases:
        if c.received_at:
            day_str = c.received_at.strftime("%Y-%m-%d")
            cat = c.risk_category or "legitimate"
            if cat in daily_stats[day_str]:
                daily_stats[day_str][cat] += 1
            else:
                daily_stats[day_str]["legitimate"] += 1

    sorted_days = sorted(daily_stats.keys())
    trends = [
        DetectionTrendDaySchema(
            date=d,
            phishing=daily_stats[d]["phishing"],
            bec=daily_stats[d]["bec"],
            suspicious=daily_stats[d]["suspicious"],
            legitimate=daily_stats[d]["legitimate"],
        )
        for d in sorted_days
    ]

    return CasesStatsResponse(
        total_cases=total,
        high_risk_cases=high_risk,
        suspicious_cases=suspicious_count,
        legitimate_cases=legit_count,
        average_score=avg_score,
        by_risk_category=by_risk_category,
        score_brackets=score_brackets,
        detection_trends=trends,
    )


# =======================================================
# 4. Case List Queue: GET /cases
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
    source: Optional[str] = Query(None),  # 'upload', 'gmail'
    db: AsyncSession = Depends(get_db),
):
    query = select(Case).options(selectinload(Case.headers))

    # Source filter
    if source and source != "all":
        query = query.where(Case.source == source)

    # Search filter (PostgreSQL ILIKE & full-text match across subject, sender, id, sender_domain)
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

    policy = await get_or_create_retention_policy(db)
    mask_pii = policy.mask_pii

    case_summaries = []
    for c in cases:
        spf_val = c.headers.spf_result if c.headers else "none"
        dkim_val = c.headers.dkim_result if c.headers else "none"
        dmarc_val = c.headers.dmarc_result if c.headers else "none"

        sender_val = mask_email_address(c.sender) if mask_pii else c.sender

        case_summaries.append(
            CaseSummary(
                case_id=c.id,
                subject=c.subject,
                sender=sender_val or c.sender,
                received_at=c.received_at.isoformat(),
                fraud_score=c.fraud_score or 0,
                risk_category=c.risk_category or "legitimate",
                status=c.status or "completed",
                spf=spf_val,
                dkim=dkim_val,
                dmarc=dmarc_val,
                source=c.source or "upload",
                gmail_account=c.gmail_account,
            )
        )

    return CasesResponse(
        total=total_count,
        page=page,
        limit=limit,
        cases=case_summaries,
    )


# =======================================================
# 4.5. Live Real-Time Stream: GET /cases/stream
# Must be defined BEFORE /cases/{case_id} so FastAPI does not
# treat 'stream' as a case_id parameter!
# =======================================================
@router.get("/cases/stream")
async def stream_cases():
    """
    Server-Sent Events (SSE) live push endpoint.
    Streams newly analyzed cases and keep-alive pings to the SOC dashboard.
    """
    return EventSourceResponse(sse_manager.subscribe())


# =======================================================
# 5. Full Case Detail: GET /cases/{id}
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

    # Record audit log for case view
    audit_entry = AuditLog(
        username="analyst",
        action="view_case",
        case_id=case.id,
        details=f"Viewed case dossier {case_id}",
    )
    db.add(audit_entry)
    await db.commit()

    breakdown = []
    if case.score_breakdown:
        for s in case.score_breakdown:
            breakdown.append(
                ScoreSignal(
                    signal=s.get("signal", "Unknown Signal"),
                    weight=s.get("weight", 0),
                    contribution=s.get("contribution", 0),
                    reason=s.get("reason"),
                    sourceModule=s.get("sourceModule", "fusion"),
                )
            )

    spf_val = case.headers.spf_result if case.headers else "none"
    dkim_val = case.headers.dkim_result if case.headers else "none"
    dmarc_val = case.headers.dmarc_result if case.headers else "none"

    policy = await get_or_create_retention_policy(db)
    sender_val = mask_email_address(case.sender) if policy.mask_pii else case.sender

    return CaseDetail(
        case_id=case.id,
        subject=case.subject,
        sender=sender_val or case.sender,
        received_at=case.received_at.isoformat(),
        file_hash=case.file_hash,
        fraud_score=case.fraud_score or 0,
        risk_category=case.risk_category or "legitimate",
        confidence=case.confidence or "medium",
        verdict_summary=case.verdict_summary or "Analysis in progress.",
        score_breakdown=breakdown,
        status=case.status or "completed",
        spf=spf_val,
        dkim=dkim_val,
        dmarc=dmarc_val,
        source=case.source or "upload",
        gmail_account=case.gmail_account,
    )


# =======================================================
# 6. Forensic Report Export: GET /cases/{id}/report
# =======================================================
@router.get("/cases/{case_id}/report")
async def get_case_report(
    case_id: str,
    format: str = Query("json", pattern="^(pdf|json)$"),
    db: AsyncSession = Depends(get_db),
):
    # Single synchronized now_utc timestamp
    now_utc = datetime.now(timezone.utc)
    analyst_username = "Alex Rivera (Analyst-01)"

    # Fetch Case
    case_res = await db.execute(
        select(Case).options(selectinload(Case.headers)).where(Case.id == case_id)
    )
    case = case_res.scalar_one_or_none()
    if not case:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found")

    # Fetch Headers & Hops
    headers_db = case.headers
    hops_res = await db.execute(
        select(RelayHop).where(RelayHop.case_id == case_id).order_by(RelayHop.hop_number)
    )
    hops_db = hops_res.scalars().all()

    # Fetch Content & URLs
    nlp_res = await db.execute(select(NLPFinding).where(NLPFinding.case_id == case_id))
    nlp_db = nlp_res.scalar_one_or_none()
    urls_res = await db.execute(select(URLFinding).where(URLFinding.case_id == case_id))
    urls_db = urls_res.scalars().all()

    # Fetch Geo & Domain
    geo_res = await db.execute(select(Geolocation).where(Geolocation.case_id == case_id))
    geo_db = geo_res.scalar_one_or_none()
    domain_res = await db.execute(select(DomainIntel).where(DomainIntel.case_id == case_id))
    domain_db = domain_res.scalar_one_or_none()

    # Fetch IP Rep Cache
    ip_cache = None
    if geo_db and geo_db.originating_ip:
        ip_cache_res = await db.execute(
            select(IPReputationCache).where(IPReputationCache.ip == geo_db.originating_ip)
        )
        ip_cache = ip_cache_res.scalar_one_or_none()

    vpn_flag = ip_cache.is_vpn_tor if ip_cache else False

    policy = await get_or_create_retention_policy(db)
    mask_pii = policy.mask_pii
    sender_val = mask_email_address(case.sender) if mask_pii else case.sender
    recipient_val = mask_email_address(case.recipient) if mask_pii else case.recipient

    # Structure dicts
    case_dict = {
        "case_id": case.id,
        "subject": case.subject,
        "sender": sender_val or case.sender,
        "recipient": recipient_val or (case.recipient or ""),
        "received_at": case.received_at.isoformat() if case.received_at else "",
        "fraud_score": case.fraud_score or 0,
        "risk_category": case.risk_category or "legitimate",
        "confidence": case.confidence or "medium",
        "verdict_summary": case.verdict_summary or "Analysis complete.",
        "score_breakdown": case.score_breakdown or [],
        "attribution_type": case.attribution_type or "unattributed",
        "attribution_confidence": case.attribution_confidence or "low",
    }

    headers_dict = {
        "spf": headers_db.spf_result if headers_db else "none",
        "dkim": headers_db.dkim_result if headers_db else "none",
        "dmarc": headers_db.dmarc_result if headers_db else "none",
        "anomalies": headers_db.anomalies if headers_db else [],
        "relay_hops": [
            {
                "hop_number": h.hop_number,
                "from_server": h.server,
                "by_server": h.by_server,
                "from_ip": h.ip,
                "timestamp": h.timestamp.isoformat() if h.timestamp else "",
                "delay_ms": h.delay_ms,
                "is_origin": h.is_earliest_origin,
            }
            for h in hops_db
        ],
    }

    content_dict = {
        "classification": nlp_db.classification if nlp_db else "legitimate",
        "classification_confidence": nlp_db.classification_confidence if nlp_db else 0.5,
        "sentiment_urgency_score": nlp_db.sentiment_urgency_score if nlp_db else 0,
        "impersonation_target": nlp_db.impersonation_target if nlp_db else None,
        "flagged_phrases": nlp_db.flagged_phrases if nlp_db else [],
        "bec_indicators": nlp_db.bec_indicators if nlp_db else [],
        "urls": [
            {
                "url": u.original_url,
                "resolved_url": u.resolved_url,
                "domain": u.domain,
                "is_homoglyph": u.is_flagged and "homoglyph" in (u.reason or "").lower(),
                "is_suspicious": u.is_flagged,
            }
            for u in urls_db
        ],
    }

    origin_dict = {
        "originating_ip": geo_db.originating_ip if geo_db else "N/A",
        "isp": geo_db.isp if geo_db else "Unknown ISP",
        "vpn_tor_flag": vpn_flag,
        "geolocation": {
            "city": geo_db.city if geo_db else "Unknown",
            "region": geo_db.region if geo_db else "Unknown",
            "country": geo_db.country if geo_db else "Unknown",
            "precision_confidence": geo_db.precision_confidence if geo_db else "low",
        },
        "domain_intel": {
            "domain": domain_db.domain if domain_db else "N/A",
            "registrar": domain_db.registrar if domain_db else "Unknown",
            "registered_on": domain_db.registered_on if domain_db else None,
            "domain_age_days": domain_db.domain_age_days if domain_db else 0,
            "mx_valid": domain_db.mx_valid if domain_db else False,
        },
    }

    # Record audit log entry with identical synchronized timestamp
    audit_entry = AuditLog(
        timestamp=now_utc,
        username=analyst_username,
        action="export_report",
        case_id=case.id,
        details=f"Exported forensic dossier in {format.upper()} format",
    )
    db.add(audit_entry)
    await db.commit()

    if format == "pdf":
        pdf_bytes = generate_pdf_report(
            case_data=case_dict,
            headers_data=headers_dict,
            content_data=content_dict,
            origin_data=origin_dict,
            file_hash=case.file_hash,
            analyst_username=analyst_username,
            now_utc=now_utc,
        )
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'inline; filename="MailTrace_Report_{case.id}.pdf"',
                "X-Report-Generated-At": now_utc.isoformat(),
            },
        )
    else:
        return build_json_report(
            case_data=case_dict,
            headers_data=headers_dict,
            content_data=content_dict,
            origin_data=origin_dict,
            file_hash=case.file_hash,
            analyst_username=analyst_username,
            now_utc=now_utc,
        )


# =======================================================
# 7. Case Headers & Relay Trace: GET /cases/{id}/headers
# =======================================================
@router.get("/cases/{case_id}/headers", response_model=CaseHeaders)
async def get_case_headers(case_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Headers).where(Headers.case_id == case_id))
    headers_db = result.scalar_one_or_none()
    if not headers_db:
        raise HTTPException(status_code=404, detail=f"Headers for case {case_id} not found")

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
# 8. Case Content Analysis: GET /cases/{id}/content
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

    attachments_result = await db.execute(select(Attachment).where(Attachment.case_id == case_id))
    attachments_db = attachments_result.scalars().all()

    attachments_schema = [
        AttachmentFindingSchema(
            filename=a.filename,
            declared_content_type=a.declared_content_type,
            detected_file_type=a.detected_file_type,
            file_size=a.file_size or 0,
            file_hash=a.file_hash,
            is_flagged=a.is_flagged,
            flag_reason=a.flag_reason,
            has_qr_code=getattr(a, "has_qr_code", False),
            qr_decoded_url=getattr(a, "qr_decoded_url", None),
            ocr_extracted_text=getattr(a, "ocr_extracted_text", None),
            image_only_lure_flag=getattr(a, "image_only_lure_flag", False),
        )
        for a in attachments_db
    ]

    has_image_only_lure = any(getattr(a, "image_only_lure_flag", False) for a in attachments_db)
    has_quishing = any(
        (getattr(a, "has_qr_code", False) and getattr(a, "is_flagged", False))
        or "quishing" in (getattr(a, "flag_reason", "") or "").lower()
        for a in attachments_db
    )

    return CaseContent(
        classification=nlp_db.classification,
        classification_confidence=nlp_db.classification_confidence,
        sentiment_urgency_score=nlp_db.sentiment_urgency_score or 0,
        impersonation_target=nlp_db.impersonation_target,
        flagged_phrases=nlp_db.flagged_phrases or [],
        bec_indicators=nlp_db.bec_indicators or [],
        urls=urls_schema,
        attachments=attachments_schema,
        image_only_lure=has_image_only_lure,
        quishing_detected=has_quishing,
    )


# =======================================================
# 9. Case Origin & Geo: GET /cases/{id}/origin
# =======================================================
@router.get("/cases/{case_id}/origin", response_model=CaseOrigin)
async def get_case_origin(case_id: str, db: AsyncSession = Depends(get_db)):
    geo_result = await db.execute(select(Geolocation).where(Geolocation.case_id == case_id))
    geo_db = geo_result.scalar_one_or_none()

    domain_result = await db.execute(select(DomainIntel).where(DomainIntel.case_id == case_id))
    domain_db = domain_result.scalar_one_or_none()

    if not geo_db or not domain_db:
        raise HTTPException(status_code=404, detail=f"Origin intelligence for case {case_id} not found")

    # Check IP reputation cache or live lookup
    ip_cache = None
    if geo_db and geo_db.originating_ip:
        ip_cache_result = await db.execute(
            select(IPReputationCache).where(IPReputationCache.ip == geo_db.originating_ip)
        )
        ip_cache = ip_cache_result.scalar_one_or_none()

    vpn_flag = ip_cache.is_vpn_tor if ip_cache else False
    flag_source = (
        ip_cache.flag_source
        if ip_cache
        else ("AbuseIPDB Live API" if (geo_db and geo_db.originating_ip != "127.0.0.1") else "Local Loopback")
    )

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
        vpn_tor_flag=vpn_flag,
        flag_source=flag_source,
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
# 10. High Risk Threat Alerts: GET /alerts
# =======================================================
@router.get("/alerts")
async def get_alerts(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Case)
        .where(
            or_(
                Case.fraud_score >= settings.ALERT_THRESHOLD,
                Case.risk_category == "bec",
            )
        )
        .order_by(desc(Case.received_at))
        .limit(20)
    )
    cases = result.scalars().all()
    policy = await get_or_create_retention_policy(db)
    mask_pii = policy.mask_pii

    alerts_list = [
        {
            "alert_id": f"alert-{c.id[:8]}",
            "case_id": c.id,
            "subject": c.subject,
            "sender": mask_email_address(c.sender) if mask_pii else c.sender,
            "fraud_score": c.fraud_score or 0,
            "risk_category": c.risk_category or "phishing",
            "triggered_at": c.received_at.isoformat() if c.received_at else datetime.now(timezone.utc).isoformat(),
        }
        for c in cases
    ]
    return {"alerts": alerts_list}


# =======================================================
# 11. Identity Correlation & Threat Intel: GET /cases/{id}/correlation
# =======================================================
@router.get("/cases/{case_id}/correlation", response_model=CaseCorrelationResponse)
async def get_case_correlation(case_id: str, db: AsyncSession = Depends(get_db)):
    case_res = await db.execute(
        select(Case)
        .options(selectinload(Case.campaign), selectinload(Case.threat_intel_matches), selectinload(Case.geolocation))
        .where(Case.id == case_id)
    )
    case = case_res.scalar_one_or_none()
    if not case:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found")

    # Fetch linked cases in same campaign cluster
    linked_case_ids = []
    if case.campaign_id:
        linked_res = await db.execute(
            select(Case.id).where(Case.campaign_id == case.campaign_id)
        )
        linked_case_ids = [cid for cid in linked_res.scalars().all()]
    else:
        linked_case_ids = [case.id]

    # Threat Intel matches
    matches_schemas: List[ThreatIntelMatchSchema] = []
    for tm in case.threat_intel_matches:
        matches_schemas.append(
            ThreatIntelMatchSchema(
                indicator=tm.indicator,
                source=tm.source,
                abuse_score=tm.abuse_score,
                last_reported=tm.matched_at.isoformat() if tm.matched_at else None,
            )
        )

    # If no recorded matches in DB yet, check origin IP reputation cache
    if not matches_schemas and case.geolocation:
        origin_ip = case.geolocation.originating_ip
        if origin_ip:
            cache_res = await db.execute(
                select(IPReputationCache).where(IPReputationCache.ip == origin_ip)
            )
            cache_row = cache_res.scalar_one_or_none()
            if cache_row and (cache_row.abuse_score or cache_row.is_vpn_tor):
                matches_schemas.append(
                    ThreatIntelMatchSchema(
                        indicator=origin_ip,
                        source="AbuseIPDB",
                        abuse_score=cache_row.abuse_score or (80 if cache_row.is_vpn_tor else 0),
                        last_reported=cache_row.cached_at.isoformat() if cache_row.cached_at else None,
                    )
                )

    shared_indicator = (
        case.campaign.shared_indicator
        if case.campaign
        else "Isolated Investigation (No Cluster Match)"
    )

    return CaseCorrelationResponse(
        threat_intel_matches=matches_schemas,
        campaign_id=case.campaign_id,
        linked_cases=linked_case_ids,
        shared_indicator=shared_indicator,
        attribution_type=case.attribution_type or "unattributed",
        attribution_confidence=case.attribution_confidence or "low",
        attribution_reason=case.verdict_summary,
    )


# =======================================================
# 12. Delete Single Case: DELETE /cases/{id}
# =======================================================
@router.delete("/cases/{case_id}", response_model=DeleteCaseResponse)
async def delete_case(case_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Case).where(Case.id == case_id))
    case = result.scalar_one_or_none()
    if not case:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found")

    # Clean up raw .eml file on disk if exists
    if case.raw_file_path and os.path.exists(case.raw_file_path):
        try:
            os.remove(case.raw_file_path)
        except Exception as e:
            print(f"Warning: could not delete raw file {case.raw_file_path}: {e}")

    # Record audit log
    audit_entry = AuditLog(
        username="analyst",
        action="delete_case",
        case_id=case.id,
        details=f"Deleted case {case.id} (Subject: '{case.subject[:50]}')",
    )
    db.add(audit_entry)

    # Cascade delete in database
    await db.delete(case)
    await db.commit()

    return DeleteCaseResponse(
        success=True,
        message=f"Case {case_id} successfully deleted",
        case_id=case_id,
        deleted_count=1,
    )


# =======================================================
# 13. Batch Delete Cases: POST /cases/batch-delete
# =======================================================
@router.post("/cases/batch-delete", response_model=DeleteCaseResponse)
async def batch_delete_cases(
    payload: BatchDeleteRequest,
    db: AsyncSession = Depends(get_db),
):
    if not payload.case_ids:
        return DeleteCaseResponse(
            success=True,
            message="No case IDs provided",
            deleted_count=0,
        )

    result = await db.execute(select(Case).where(Case.id.in_(payload.case_ids)))
    cases_to_delete = result.scalars().all()
    deleted_ids = []

    for c in cases_to_delete:
        if c.raw_file_path and os.path.exists(c.raw_file_path):
            try:
                os.remove(c.raw_file_path)
            except Exception:
                pass
        deleted_ids.append(c.id)
        await db.delete(c)

    if deleted_ids:
        audit_entry = AuditLog(
            username="analyst",
            action="batch_delete_cases",
            case_id=deleted_ids[0],
            details=f"Batch deleted {len(deleted_ids)} cases: {', '.join(deleted_ids[:5])}",
        )
        db.add(audit_entry)
        await db.commit()

    return DeleteCaseResponse(
        success=True,
        message=f"Successfully deleted {len(deleted_ids)} cases",
        case_id=deleted_ids[0] if deleted_ids else None,
        deleted_count=len(deleted_ids),
    )

