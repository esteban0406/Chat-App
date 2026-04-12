from httpx import AsyncClient


async def _register(client: AsyncClient, email: str, username: str) -> str:
    res = await client.post(
        "/api/auth/register",
        json={"email": email, "username": username, "password": "password123"},
    )
    return res.json()["accessToken"]


async def _create_server(client: AsyncClient, token: str, name: str = "Test Server") -> dict:
    res = await client.post(
        "/api/servers",
        json={"name": name},
        headers={"Authorization": f"Bearer {token}"},
    )
    return res.json()


async def test_create_channel(client: AsyncClient):
    token = await _register(client, "ch_owner@example.com", "ch_owner")
    server = await _create_server(client, token)
    server_id = server["id"]

    res = await client.post(
        f"/api/servers/{server_id}/channels",
        json={"name": "announcements", "type": "TEXT"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 201
    assert res.json()["name"] == "announcements"
    assert res.json()["type"] == "TEXT"


async def test_list_channels(client: AsyncClient):
    token_owner = await _register(client, "chlist_owner@example.com", "chlist_owner")
    token_other = await _register(client, "chlist_other@example.com", "chlist_other")
    server = await _create_server(client, token_owner)
    server_id = server["id"]

    res = await client.get(
        f"/api/servers/{server_id}/channels",
        headers={"Authorization": f"Bearer {token_owner}"},
    )
    assert res.status_code == 200
    assert len(res.json()) == 1  # only 'general'

    # Non-member gets 403
    res2 = await client.get(
        f"/api/servers/{server_id}/channels",
        headers={"Authorization": f"Bearer {token_other}"},
    )
    assert res2.status_code == 403


async def test_update_channel(client: AsyncClient):
    token = await _register(client, "chupd@example.com", "chupd")
    server = await _create_server(client, token)
    server_id = server["id"]
    channel_id = server["channels"][0]["id"]

    res = await client.patch(
        f"/api/servers/{server_id}/channels/{channel_id}",
        json={"name": "renamed-channel"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    assert res.json()["name"] == "renamed-channel"


async def test_delete_last_channel_blocked(client: AsyncClient):
    token = await _register(client, "chdel@example.com", "chdel")
    server = await _create_server(client, token)
    server_id = server["id"]
    channel_id = server["channels"][0]["id"]

    # Cannot delete last channel
    res = await client.delete(
        f"/api/servers/{server_id}/channels/{channel_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 400


async def test_delete_channel(client: AsyncClient):
    token = await _register(client, "chdelete@example.com", "chdelete")
    server = await _create_server(client, token)
    server_id = server["id"]

    # Create a second channel first
    new_ch = await client.post(
        f"/api/servers/{server_id}/channels",
        json={"name": "extra"},
        headers={"Authorization": f"Bearer {token}"},
    )
    channel_id = new_ch.json()["id"]

    res = await client.delete(
        f"/api/servers/{server_id}/channels/{channel_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 204
