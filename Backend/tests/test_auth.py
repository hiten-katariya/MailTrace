import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_analyst_login(client: AsyncClient):
    response = await client.post(
        "/auth/login",
        json={"username": "analyst1", "password": "analystpassword"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["expires_in"] == 28800

@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
