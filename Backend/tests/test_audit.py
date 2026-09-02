import pytest
from httpx import AsyncClient
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.models.case import Case

@pytest.mark.asyncio
async def test_audit_log_capture_and_query(client: AsyncClient, db_session: AsyncSession):
    # 1. Login should write an audit record
    login_resp = await client.post("/auth/login", json={"username": "analyst1", "password": "analyst123"})
    assert login_resp.status_code == 200

    # 2. Seed a case and view it
    case_id = "test-audit-case-001"
    case = Case(
        id=case_id,
        file_hash="hashaudit01"*6,
        raw_file_path="p",
        subject="Audit Test Subject",
        sender="sender@audit.org",
        received_at=datetime.now(timezone.utc),
        status="completed",
        fraud_score=30,
        risk_category="legitimate",
    )
    db_session.add(case)
    await db_session.commit()

    # View case
    view_resp = await client.get(f"/cases/{case_id}")
    assert view_resp.status_code == 200

    # Export report (JSON)
    report_resp = await client.get(f"/cases/{case_id}/report?format=json")
    assert report_resp.status_code == 200

    # 3. Query audit log
    audit_resp = await client.get("/audit-log")
    assert audit_resp.status_code == 200
    logs = audit_resp.json()["logs"]

    actions = [l["action"] for l in logs]
    assert "analyst_login" in actions
    assert "view_case" in actions
    assert "export_report" in actions

    # Filter audit logs by specific case_id
    case_audit_resp = await client.get(f"/audit-log?case_id={case_id}")
    assert case_audit_resp.status_code == 200
    case_logs = case_audit_resp.json()["logs"]
    assert len(case_logs) >= 2
    assert all(l["case_id"] == case_id for l in case_logs)
