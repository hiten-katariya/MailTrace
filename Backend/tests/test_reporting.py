import os
import pytest
from httpx import AsyncClient
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.models.case import Case
from backend.app.models.header import Headers, RelayHop
from backend.app.models.content import NLPFinding, URLFinding
from backend.app.models.origin import Geolocation, DomainIntel

@pytest.mark.asyncio
async def test_pdf_and_json_report_generation(client: AsyncClient, db_session: AsyncSession):
    # 1. Seed a comprehensive case
    case_id = "test-report-case-uuid-001"
    file_hash = "a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0"
    case = Case(
        id=case_id,
        file_hash=file_hash,
        raw_file_path=f"backend/storage/{file_hash}.eml",
        subject="CRITICAL: Suspicious Account Login Attempt",
        sender="security@paypal-security-auth.com",
        sender_domain="paypal-security-auth.com",
        recipient="target@company.org",
        received_at=datetime.now(timezone.utc),
        status="completed",
        fraud_score=85,
        risk_category="phishing",
        confidence="high",
        verdict_summary="Likely PHISHING — failed DMARC alignment, 2-day-old domain, urgency cues.",
        score_breakdown=[
            {
                "signal": "DMARC Policy Failure",
                "weight": 15,
                "contribution": 15,
                "reason": "MTA rejected unaligned sender.",
                "sourceModule": "header",
            },
            {
                "signal": "Newly Registered Domain (< 7 Days)",
                "weight": 15,
                "contribution": 15,
                "reason": "Domain registered 2 days ago.",
                "sourceModule": "domain",
            },
        ],
    )
    db_session.add(case)

    # Add Headers & Hops
    headers = Headers(
        case_id=case_id,
        spf_result="fail",
        dkim_result="fail",
        dmarc_result="fail",
        anomalies=["Unaligned Return-Path domain", "Abnormal relay latency"],
    )
    db_session.add(headers)

    hop = RelayHop(
        case_id=case_id,
        hop_number=1,
        ip="185.220.101.5",
        server="mail.suspicious-relay.net",
        is_earliest_origin=True,
    )
    db_session.add(hop)

    # Add Content & URLs
    nlp = NLPFinding(
        case_id=case_id,
        classification="phishing",
        classification_confidence=0.96,
        sentiment_urgency_score=80,
        flagged_phrases=["urgent action required", "account suspended"],
    )
    db_session.add(nlp)

    url_finding = URLFinding(
        case_id=case_id,
        original_url="http://paypa1-security.com/login",
        resolved_url="http://paypa1-security.com/login",
        domain="paypa1-security.com",
        is_flagged=True,
        reason="Homoglyph substitution detected",
    )
    db_session.add(url_finding)

    # Add Geo & Domain Intel
    geo = Geolocation(
        case_id=case_id,
        originating_ip="185.220.101.5",
        country="Germany",
        region="Hesse",
        city="Frankfurt am Main",
        latitude=50.1109,
        longitude=8.6821,
        precision_confidence="city: medium",
        isp="Tor Exit Node Infrastructure",
    )
    db_session.add(geo)

    domain = DomainIntel(
        case_id=case_id,
        domain="paypal-security-auth.com",
        registrar="NameCheap Inc.",
        domain_age_days=2,
        mx_valid=False,
    )
    db_session.add(domain)
    await db_session.commit()

    # 2. Test JSON Report format
    json_resp = await client.get(f"/cases/{case_id}/report?format=json")
    assert json_resp.status_code == 200
    report_json = json_resp.json()
    assert report_json["case_id"] == case_id
    assert report_json["file_hash"] == file_hash
    assert "report_generated_at" in report_json
    assert "generated_by" in report_json
    assert report_json["case_summary"]["fraud_score"] == 85
    assert report_json["headers_analysis"]["dmarc"] == "fail"
    assert report_json["content_analysis"]["classification"] == "phishing"
    assert "legal_disclaimer" in report_json

    # 3. Test PDF Report format
    pdf_resp = await client.get(f"/cases/{case_id}/report?format=pdf")
    assert pdf_resp.status_code == 200
    assert pdf_resp.headers["content-type"] == "application/pdf"
    assert "inline; filename=" in pdf_resp.headers["content-disposition"]
    pdf_bytes = pdf_resp.content
    assert len(pdf_bytes) > 2000
    # PDF magic byte check
    assert pdf_bytes.startswith(b"%PDF")
