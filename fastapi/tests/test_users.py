from httpx import AsyncClient


async def _register(client: AsyncClient, email: str, username: str) -> str:
    """Helper: register a user and return the JWT."""
    res = await client.post(
        "/api/auth/register",
        json={"email": email, "username": username, "password": "password123"},
    )
    return res.json()["accessToken"]


async def test_get_users(client: AsyncClient):
    response = await client.get("/api/users")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


async def test_search_users(client: AsyncClient):
    await _register(client, "search@example.com", "searchme")
    response = await client.get("/api/users/search?username=search")
    assert response.status_code == 200
    usernames = [u["username"] for u in response.json()]
    assert "searchme" in usernames


async def test_update_me(client: AsyncClient):
    token = await _register(client, "update@example.com", "updateuser")
    response = await client.patch(
        "/api/users/me",
        json={"username": "updatedname"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["username"] == "updatedname"


async def test_friend_request_flow(client: AsyncClient):
    token_a = await _register(client, "usera@example.com", "usera")
    token_b = await _register(client, "userb@example.com", "userb")

    # Get user B's id
    me_b = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {token_b}"})
    user_b_id = me_b.json()["id"]

    # A sends request to B
    res = await client.post(
        "/api/friendships",
        json={"receiver_id": user_b_id},
        headers={"Authorization": f"Bearer {token_a}"},
    )
    assert res.status_code == 201
    friendship_id = res.json()["id"]

    # B checks pending
    pending = await client.get(
        "/api/friendships/pending",
        headers={"Authorization": f"Bearer {token_b}"},
    )
    assert any(f["id"] == friendship_id for f in pending.json())

    # B accepts
    accepted = await client.patch(
        f"/api/friendships/{friendship_id}",
        json={"status": "ACCEPTED"},
        headers={"Authorization": f"Bearer {token_b}"},
    )
    assert accepted.status_code == 200
    assert accepted.json()["status"] == "ACCEPTED"
