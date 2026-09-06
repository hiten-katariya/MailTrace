import os
import pytest
from httpx import AsyncClient

FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures")

@pytest.mark.asyncio
async def test_end_to_end_upload_and_status(client: AsyncClient):
    fixture_path = os.path.join(FIXTURES_DIR, "clean_business_email.eml")
    with open(fixture_path, "rb") as f:
        file_bytes = f.read()

    # 1. Upload .eml
    files = {"file": ("clean_business_email.eml", file_bytes, "message/rfc822")}
    response = await client.post("/cases/upload", files=files)
    assert response.status_code == 202
    data = response.json()
    assert "case_id" in data
    assert data["status"] == "processing"
    case_id = data["case_id"]

    # 2. Check Status
    status_resp = await client.get(f"/cases/{case_id}/status")
    assert status_resp.status_code == 200
    status_data = status_resp.json()
    assert status_data["case_id"] == case_id
    assert "progress" in status_data

    # 3. List Cases
    list_resp = await client.get("/cases")
    assert list_resp.status_code == 200
    list_data = list_resp.json()
    assert list_data["total"] >= 1
    assert any(c["case_id"] == case_id for c in list_data["cases"])


@pytest.mark.asyncio
async def test_full_pipeline_risk_category_strict_consistency(client: AsyncClient, db_session):
    """
    Integration test: verifies that across upload and simulated Gmail ingestion,
    the pipeline strictly enforces risk_category == get_risk_category(fraud_score, bec_indicators, content_classification)
    at the database persistence layer.
    """
    from backend.app.core.ingestion import process_raw_email_bytes
    from backend.app.core.scoring import get_risk_category
    from backend.app.models.content import NLPFinding
    from sqlalchemy import select

    clean_path = os.path.join(FIXTURES_DIR, "clean_business_email.eml")
    with open(clean_path, "rb") as f:
        clean_bytes = f.read()

    # 1. Upload path
    upload_case = await process_raw_email_bytes(clean_bytes, source="upload", db=db_session)
    cres = await db_session.execute(select(NLPFinding).where(NLPFinding.case_id == upload_case.id))
    cont = cres.scalars().first()
    expected_upload_cat = get_risk_category(
        upload_case.fraud_score,
        cont.bec_indicators if cont else [],
        cont.classification if cont else None,
    )
    assert upload_case.risk_category == expected_upload_cat, (
        f"Upload pipeline risk_category {upload_case.risk_category} did not match {expected_upload_cat}"
    )

    # 2. Gmail ingestion path
    gmail_case = await process_raw_email_bytes(
        clean_bytes,
        source="gmail",
        gmail_account="user@gmail.com",
        gmail_message_id="msg_int_test_1",
        db=db_session,
    )
    cres2 = await db_session.execute(select(NLPFinding).where(NLPFinding.case_id == gmail_case.id))
    cont2 = cres2.scalars().first()
    expected_gmail_cat = get_risk_category(
        gmail_case.fraud_score,
        cont2.bec_indicators if cont2 else [],
        cont2.classification if cont2 else None,
    )
    assert gmail_case.risk_category == expected_gmail_cat, (
        f"Gmail pipeline risk_category {gmail_case.risk_category} did not match {expected_gmail_cat}"
    )

