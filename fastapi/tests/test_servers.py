from httpx import AsyncClient


async def _register(client: AsyncClient, email: str, username: str) -> str:
    res = await client.post(
        "/api/auth/register",
        json={"email": email, "username": username, "password": "password123"},
    )
    return res.json()["access_token"]


async def _create_server(client: AsyncClient, token: str, name: str = "Test Server") -> dict:
    res = await client.post(
        "/api/servers",
        json={"name": name},
        headers={"Authorization": f"Bearer {token}"},
    )
    return res.json()


async def test_create_server(client: AsyncClient):
    token = await _register(client, "owner@example.com", "owner")
    res = await client.post(
        "/api/servers",
        json={"name": "My Server"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 201
    data = res.json()
    assert data["name"] == "My Server"
    assert len(data["channels"]) == 1
    assert data["channels"][0]["name"] == "general"
    role_names = {r["name"] for r in data["roles"]}
    assert role_names == {"Admin", "Member"}
    assert len(data["members"]) == 1
    assert data["members"][0]["role"]["name"] == "Admin"


async def test_list_servers(client: AsyncClient):
    token1 = await _register(client, "u1@example.com", "user1")
    token2 = await _register(client, "u2@example.com", "user2")
    await _create_server(client, token1, "Server A")
    await _create_server(client, token1, "Server B")

    res = await client.get("/api/servers", headers={"Authorization": f"Bearer {token1}"})
    assert res.status_code == 200
    assert len(res.json()) == 2

    res2 = await client.get("/api/servers", headers={"Authorization": f"Bearer {token2}"})
    assert res2.status_code == 200
    assert len(res2.json()) == 0


async def test_get_server_member_only(client: AsyncClient):
    token_owner = await _register(client, "owner2@example.com", "owner2")
    token_other = await _register(client, "other@example.com", "other")
    server = await _create_server(client, token_owner)
    server_id = server["id"]

    res = await client.get(
        f"/api/servers/{server_id}",
        headers={"Authorization": f"Bearer {token_owner}"},
    )
    assert res.status_code == 200

    res2 = await client.get(
        f"/api/servers/{server_id}",
        headers={"Authorization": f"Bearer {token_other}"},
    )
    assert res2.status_code == 403


async def test_update_server(client: AsyncClient):
    token_owner = await _register(client, "upd@example.com", "updowner")
    token_other = await _register(client, "upd2@example.com", "updother")
    server = await _create_server(client, token_owner)
    server_id = server["id"]

    res = await client.patch(
        f"/api/servers/{server_id}",
        json={"name": "Renamed"},
        headers={"Authorization": f"Bearer {token_owner}"},
    )
    assert res.status_code == 200
    assert res.json()["name"] == "Renamed"

    res2 = await client.patch(
        f"/api/servers/{server_id}",
        json={"name": "Hack"},
        headers={"Authorization": f"Bearer {token_other}"},
    )
    assert res2.status_code in (403, 404)


async def test_join_and_leave_server(client: AsyncClient):
    token_owner = await _register(client, "jl_owner@example.com", "jl_owner")
    token_user = await _register(client, "jl_user@example.com", "jl_user")
    server = await _create_server(client, token_owner)
    server_id = server["id"]

    res = await client.post(
        f"/api/servers/{server_id}/join",
        headers={"Authorization": f"Bearer {token_user}"},
    )
    assert res.status_code == 200
    member_ids = [m["user_id"] for m in res.json()["members"]]
    assert any(m for m in member_ids)

    # Joining twice returns 400
    res2 = await client.post(
        f"/api/servers/{server_id}/join",
        headers={"Authorization": f"Bearer {token_user}"},
    )
    assert res2.status_code == 400

    # User can leave
    res3 = await client.post(
        f"/api/servers/{server_id}/leave",
        headers={"Authorization": f"Bearer {token_user}"},
    )
    assert res3.status_code == 204

    # Owner cannot leave
    res4 = await client.post(
        f"/api/servers/{server_id}/leave",
        headers={"Authorization": f"Bearer {token_owner}"},
    )
    assert res4.status_code == 400


async def test_remove_member(client: AsyncClient):
    token_owner = await _register(client, "rm_owner@example.com", "rm_owner")
    token_user = await _register(client, "rm_user@example.com", "rm_user")
    server = await _create_server(client, token_owner)
    server_id = server["id"]

    await client.post(
        f"/api/servers/{server_id}/join",
        headers={"Authorization": f"Bearer {token_user}"},
    )

    server_data = await client.get(
        f"/api/servers/{server_id}",
        headers={"Authorization": f"Bearer {token_owner}"},
    )
    members = server_data.json()["members"]
    # Find the non-owner member
    non_owner = next(m for m in members if m["role"]["name"] != "Admin")
    member_id = non_owner["id"]

    res = await client.delete(
        f"/api/servers/{server_id}/members/{member_id}",
        headers={"Authorization": f"Bearer {token_owner}"},
    )
    assert res.status_code == 204


async def test_delete_server(client: AsyncClient):
    token_owner = await _register(client, "del_owner@example.com", "del_owner")
    server = await _create_server(client, token_owner)
    server_id = server["id"]

    res = await client.delete(
        f"/api/servers/{server_id}",
        headers={"Authorization": f"Bearer {token_owner}"},
    )
    assert res.status_code == 204

    res2 = await client.get("/api/servers", headers={"Authorization": f"Bearer {token_owner}"})
    assert res2.json() == []
