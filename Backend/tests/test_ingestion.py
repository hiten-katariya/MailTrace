import os
import pytest
from httpx import AsyncClient

FIXTURES_DIR = os.path.join("backend", "tests", "fixtures")

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
