import pytest
from httpx import AsyncClient
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.models.case import Case

@pytest.mark.asyncio
async def test_single_case_deletion(client: AsyncClient, db_session: AsyncSession):
    now = datetime.now(timezone.utc)
    case_to_delete = Case(
        id="case-del-test-1",
        file_hash="hashdel1" * 8,
        raw_file_path="",
        subject="Email to be deleted",
        sender="spammer@bad.com",
        sender_domain="bad.com",
        received_at=now,
        status="completed",
        fraud_score=85,
        risk_category="phishing",
    )
    db_session.add(case_to_delete)
    await db_session.commit()

    # 1. Delete the case
    resp = await client.delete("/cases/case-del-test-1")
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert data["case_id"] == "case-del-test-1"

    # 2. Verify case is no longer found
    status_resp = await client.get("/cases/case-del-test-1/status")
    assert status_resp.status_code == 404

    # 3. Deleting again should return 404
    resp_again = await client.delete("/cases/case-del-test-1")
    assert resp_again.status_code == 404

@pytest.mark.asyncio
async def test_batch_case_deletion(client: AsyncClient, db_session: AsyncSession):
    now = datetime.now(timezone.utc)
    c1 = Case(
        id="case-batch-1",
        file_hash="batchhash1" * 6,
        raw_file_path="",
        subject="Batch Mail 1",
        sender="bot1@bad.com",
        sender_domain="bad.com",
        received_at=now,
        status="completed",
        fraud_score=75,
        risk_category="phishing",
    )
    c2 = Case(
        id="case-batch-2",
        file_hash="batchhash2" * 6,
        raw_file_path="",
        subject="Batch Mail 2",
        sender="bot2@bad.com",
        sender_domain="bad.com",
        received_at=now,
        status="completed",
        fraud_score=80,
        risk_category="phishing",
    )
    db_session.add(c1)
    db_session.add(c2)
    await db_session.commit()

    # 1. Batch delete both cases
    resp = await client.post("/cases/batch-delete", json={"case_ids": ["case-batch-1", "case-batch-2"]})
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert data["deleted_count"] == 2

    # 2. Verify neither exists
    r1 = await client.get("/cases/case-batch-1/status")
    assert r1.status_code == 404
    r2 = await client.get("/cases/case-batch-2/status")
    assert r2.status_code == 404

@pytest.mark.asyncio
async def test_batch_case_deletion_empty(client: AsyncClient):
    resp = await client.post("/cases/batch-delete", json={"case_ids": []})
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert data["deleted_count"] == 0
