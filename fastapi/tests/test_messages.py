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


async def _send_message(
    client: AsyncClient, token: str, channel_id: str, content: str = "Hello"
) -> dict:
    res = await client.post(
        "/api/messages",
        json={"content": content, "channel_id": channel_id},
        headers={"Authorization": f"Bearer {token}"},
    )
    return res.json()


async def test_create_message(client: AsyncClient):
    token = await _register(client, "msg_owner@example.com", "msg_owner")
    server = await _create_server(client, token)
    channel_id = server["channels"][0]["id"]

    res = await client.post(
        "/api/messages",
        json={"content": "Hello world", "channel_id": channel_id},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 201
    data = res.json()
    assert data["content"] == "Hello world"
    assert data["author"] is not None


async def test_non_member_cannot_send_message(client: AsyncClient):
    token_owner = await _register(client, "nmsrv@example.com", "nmsrv")
    token_other = await _register(client, "nmoth@example.com", "nmoth")
    server = await _create_server(client, token_owner)
    channel_id = server["channels"][0]["id"]

    res = await client.post(
        "/api/messages",
        json={"content": "Unauthorized", "channel_id": channel_id},
        headers={"Authorization": f"Bearer {token_other}"},
    )
    assert res.status_code == 403


async def test_paginated_messages(client: AsyncClient):
    token = await _register(client, "page@example.com", "pageuser")
    server = await _create_server(client, token)
    channel_id = server["channels"][0]["id"]

    # Send 52 messages
    for i in range(52):
        await _send_message(client, token, channel_id, f"Message {i}")

    # First page
    res = await client.get(
        f"/api/messages/channel/{channel_id}?limit=50",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert len(data["messages"]) == 50
    assert data["has_more"] is True
    assert data["next_cursor"] is not None

    # Second page using cursor
    cursor = data["next_cursor"]
    res2 = await client.get(
        f"/api/messages/channel/{channel_id}?limit=50&cursor={cursor}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res2.status_code == 200
    data2 = res2.json()
    assert len(data2["messages"]) == 2
    assert data2["has_more"] is False


async def test_update_message(client: AsyncClient):
    token_author = await _register(client, "upd_author@example.com", "upd_author")
    token_other = await _register(client, "upd_other@example.com", "upd_other")
    server = await _create_server(client, token_author)
    channel_id = server["channels"][0]["id"]

    msg = await _send_message(client, token_author, channel_id, "Original")
    message_id = msg["id"]

    # Author can edit
    res = await client.patch(
        f"/api/messages/{message_id}",
        json={"content": "Edited"},
        headers={"Authorization": f"Bearer {token_author}"},
    )
    assert res.status_code == 200
    assert res.json()["content"] == "Edited"

    # Other user cannot edit
    res2 = await client.patch(
        f"/api/messages/{message_id}",
        json={"content": "Hacked"},
        headers={"Authorization": f"Bearer {token_other}"},
    )
    assert res2.status_code == 403


async def test_delete_message(client: AsyncClient):
    token_owner = await _register(client, "del_msrv@example.com", "del_msrv")
    token_author = await _register(client, "del_mauth@example.com", "del_mauth")
    token_other = await _register(client, "del_moth@example.com", "del_moth")
    server = await _create_server(client, token_owner)
    server_id = server["id"]
    channel_id = server["channels"][0]["id"]

    # Author joins and sends a message
    await client.post(
        f"/api/servers/{server_id}/join",
        headers={"Authorization": f"Bearer {token_author}"},
    )
    msg = await _send_message(client, token_author, channel_id, "To delete")
    message_id = msg["id"]

    # Third user cannot delete
    res = await client.delete(
        f"/api/messages/{message_id}",
        headers={"Authorization": f"Bearer {token_other}"},
    )
    assert res.status_code == 403

    # Server owner can delete another user's message
    res2 = await client.delete(
        f"/api/messages/{message_id}",
        headers={"Authorization": f"Bearer {token_owner}"},
    )
    assert res2.status_code == 204
