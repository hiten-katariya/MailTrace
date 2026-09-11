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

@pytest.mark.asyncio
async def test_signup_standard_user(client: AsyncClient):
    signup_payload = {
        "name": "Sarah Connor",
        "email": "sarah.connor@cyberdyne.org",
        "password": "SecurePassword999!",
    }
    response = await client.post("/auth/signup", json=signup_payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "sarah.connor@cyberdyne.org"
    assert data["user"]["role"] == "user"
    assert data["user"]["is_admin"] is False

@pytest.mark.asyncio
async def test_signup_admin_user_role_assignment(client: AsyncClient):
    signup_payload = {
        "name": "Lead Admin",
        "email": "hiten8411jdrravi@gmail.com",
        "password": "AdminSecurePassword2026!",
    }
    response = await client.post("/auth/signup", json=signup_payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "hiten8411jdrravi@gmail.com"
    assert data["user"]["role"] == "admin"
    assert data["user"]["is_admin"] is True

@pytest.mark.asyncio
async def test_login_with_email_and_me(client: AsyncClient):
    # 0. Register user
    await client.post(
        "/auth/signup",
        json={"name": "Sarah Connor", "email": "sarah.connor@cyberdyne.org", "password": "SecurePassword999!"},
    )

    # 1. Login with email
    response = await client.post(
        "/auth/login",
        json={"email": "sarah.connor@cyberdyne.org", "password": "SecurePassword999!"},
    )
    assert response.status_code == 200
    data = response.json()
    token = data["access_token"]

    # 2. Query /auth/me
    me_resp = await client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    me_data = me_resp.json()
    assert me_data["email"] == "sarah.connor@cyberdyne.org"
    assert me_data["role"] == "user"
    assert me_data["is_admin"] is False

@pytest.mark.asyncio
async def test_login_invalid_password(client: AsyncClient):
    # 0. Register user
    await client.post(
        "/auth/signup",
        json={"name": "Sarah Connor", "email": "sarah.connor@cyberdyne.org", "password": "SecurePassword999!"},
    )

    response = await client.post(
        "/auth/login",
        json={"email": "sarah.connor@cyberdyne.org", "password": "WrongPassword!"},
    )
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_google_auth_url(client: AsyncClient):
    response = await client.get("/auth/google/auth-url")
    assert response.status_code == 200
    data = response.json()
    assert "auth_url" in data
    assert "accounts.google.com" in data["auth_url"]
    assert "gmail.readonly" in data["auth_url"]
    assert "state" in data
