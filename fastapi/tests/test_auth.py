from httpx import AsyncClient


async def test_register(client: AsyncClient):
    response = await client.post(
        "/api/auth/register",
        json={"email": "test@example.com", "username": "testuser", "password": "password123"},
    )
    assert response.status_code == 201
    data = response.json()
    assert "accessToken" in data
    assert data["tokenType"] == "bearer"


async def test_register_duplicate_email(client: AsyncClient):
    payload = {"email": "dup@example.com", "username": "user1", "password": "password123"}
    await client.post("/api/auth/register", json=payload)
    payload["username"] = "user2"
    response = await client.post("/api/auth/register", json=payload)
    assert response.status_code == 409


async def test_login(client: AsyncClient):
    await client.post(
        "/api/auth/register",
        json={"email": "login@example.com", "username": "loginuser", "password": "password123"},
    )
    response = await client.post(
        "/api/auth/login",
        json={"email": "login@example.com", "password": "password123"},
    )
    assert response.status_code == 200
    assert "accessToken" in response.json()


async def test_login_wrong_password(client: AsyncClient):
    await client.post(
        "/api/auth/register",
        json={"email": "wp@example.com", "username": "wpuser", "password": "password123"},
    )
    response = await client.post(
        "/api/auth/login",
        json={"email": "wp@example.com", "password": "wrongpassword"},
    )
    assert response.status_code == 400


async def test_get_me(client: AsyncClient):
    reg = await client.post(
        "/api/auth/register",
        json={"email": "me@example.com", "username": "meuser", "password": "password123"},
    )
    token = reg.json()["accessToken"]
    response = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["email"] == "me@example.com"
