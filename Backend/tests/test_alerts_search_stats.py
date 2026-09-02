import pytest
from httpx import AsyncClient
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.models.case import Case

@pytest.mark.asyncio
async def test_alerts_threshold_filtering(client: AsyncClient, db_session: AsyncSession):
    now = datetime.now(timezone.utc)
    # Seed 3 cases with different scores: 15 (legitimate), 55 (suspicious), 92 (critical phishing)
    c1 = Case(
        id="case-alert-1",
        file_hash="hash1" * 12 + "1234",
        raw_file_path="p1",
        subject="Clean Newsletter",
        sender="news@trusted.com",
        sender_domain="trusted.com",
        received_at=now,
        status="completed",
        fraud_score=15,
        risk_category="legitimate",
    )
    c2 = Case(
        id="case-alert-2",
        file_hash="hash2" * 12 + "1234",
        raw_file_path="p2",
        subject="Internal Sync Meeting",
        sender="colleague@corp.com",
        sender_domain="corp.com",
        received_at=now,
        status="completed",
        fraud_score=55,
        risk_category="suspicious",
    )
    c3 = Case(
        id="case-alert-3",
        file_hash="hash3" * 12 + "1234",
        raw_file_path="p3",
        subject="WIRE FUNDS NOW - Acquisition",
        sender="exec@spoofed-target.com",
        sender_domain="spoofed-target.com",
        received_at=now,
        status="completed",
        fraud_score=92,
        risk_category="bec",
    )
    db_session.add_all([c1, c2, c3])
    await db_session.commit()

    resp = await client.get("/alerts")
    assert resp.status_code == 200
    alerts = resp.json()["alerts"]

    # Only case-alert-3 (score >= 70) should be present
    assert len(alerts) == 1
    assert alerts[0]["case_id"] == "case-alert-3"
    assert alerts[0]["fraud_score"] == 92


@pytest.mark.asyncio
async def test_case_search_subject_and_sender(client: AsyncClient, db_session: AsyncSession):
    now = datetime.now(timezone.utc)
    c1 = Case(
        id="case-search-1",
        file_hash="hashsearch1" * 6,
        raw_file_path="p1",
        subject="Urgent Wire Transfer Request",
        sender="cfo@megacorp-acquisitions.com",
        sender_domain="megacorp-acquisitions.com",
        received_at=now,
        status="completed",
        fraud_score=88,
        risk_category="bec",
    )
    c2 = Case(
        id="case-search-2",
        file_hash="hashsearch2" * 6,
        raw_file_path="p2",
        subject="Weekly Department All-Hands Agenda",
        sender="hr@legitimate-company.org",
        sender_domain="legitimate-company.org",
        received_at=now,
        status="completed",
        fraud_score=10,
        risk_category="legitimate",
    )
    db_session.add_all([c1, c2])
    await db_session.commit()

    # 1. Search by subject substring
    search_resp1 = await client.get("/cases?search=Wire+Transfer")
    assert search_resp1.status_code == 200
    data1 = search_resp1.json()
    assert data1["total"] == 1
    assert data1["cases"][0]["case_id"] == "case-search-1"

    # 2. Search by sender email domain
    search_resp2 = await client.get("/cases?search=legitimate-company")
    assert search_resp2.status_code == 200
    data2 = search_resp2.json()
    assert data2["total"] == 1
    assert data2["cases"][0]["case_id"] == "case-search-2"


@pytest.mark.asyncio
async def test_cases_stats_aggregations(client: AsyncClient, db_session: AsyncSession):
    now = datetime.now(timezone.utc)
    cases = [
        Case(id="s1", file_hash="h1"*16, raw_file_path="p", subject="S1", sender="a@b.com", sender_domain="b.com", received_at=now, status="completed", fraud_score=12, risk_category="legitimate"),
        Case(id="s2", file_hash="h2"*16, raw_file_path="p", subject="S2", sender="a@b.com", sender_domain="b.com", received_at=now, status="completed", fraud_score=48, risk_category="suspicious"),
        Case(id="s3", file_hash="h3"*16, raw_file_path="p", subject="S3", sender="a@b.com", sender_domain="b.com", received_at=now, status="completed", fraud_score=85, risk_category="phishing"),
        Case(id="s4", file_hash="h4"*16, raw_file_path="p", subject="S4", sender="a@b.com", sender_domain="b.com", received_at=now, status="completed", fraud_score=95, risk_category="bec"),
    ]
    db_session.add_all(cases)
    await db_session.commit()

    stats_resp = await client.get("/cases/stats")
    assert stats_resp.status_code == 200
    stats = stats_resp.json()

    assert stats["total_cases"] == 4
    assert stats["high_risk_cases"] == 2  # phishing + bec
    assert stats["suspicious_cases"] == 1
    assert stats["legitimate_cases"] == 1
    assert stats["average_score"] == 60.0

    # Risk categories
    categories = {c["category"]: c["count"] for c in stats["by_risk_category"]}
    assert categories["phishing"] == 1
    assert categories["bec"] == 1
    assert categories["suspicious"] == 1
    assert categories["legitimate"] == 1

    # Score brackets
    assert len(stats["score_brackets"]) == 5
    assert len(stats["detection_trends"]) >= 1
