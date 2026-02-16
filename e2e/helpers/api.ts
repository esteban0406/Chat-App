const API_URL = 'http://localhost:4000';

function authHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export async function createServer(
  token: string,
  name: string,
  description?: string,
) {
  const res = await fetch(`${API_URL}/api/servers`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ name, description }),
  });
  if (!res.ok) throw new Error(`createServer failed: ${res.status}`);
  return (await res.json()) as { id: string; name: string; channels?: { id: string; name: string; type: string }[] };
}

export async function createChannel(
  token: string,
  serverId: string,
  name: string,
  type: 'TEXT' | 'VOICE' = 'TEXT',
) {
  const res = await fetch(`${API_URL}/api/servers/${serverId}/channels`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ name, type }),
  });
  if (!res.ok) throw new Error(`createChannel failed: ${res.status}`);
  return (await res.json()) as { id: string; name: string; type: string };
}

export async function getServerChannels(token: string, serverId: string) {
  const res = await fetch(`${API_URL}/api/servers/${serverId}/channels`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(`getServerChannels failed: ${res.status}`);
  const data = await res.json();
  return (Array.isArray(data) ? data : data.data ?? []) as {
    id: string;
    name: string;
    type: string;
  }[];
}

export async function sendFriendRequest(token: string, receiverId: string) {
  const res = await fetch(`${API_URL}/api/friendships`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ receiverId }),
  });
  if (!res.ok) throw new Error(`sendFriendRequest failed: ${res.status}`);
  return (await res.json()) as { id: string; status: string };
}

export async function acceptFriendRequest(token: string, friendshipId: string) {
  const res = await fetch(`${API_URL}/api/friendships/${friendshipId}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ status: 'ACCEPTED' }),
  });
  if (!res.ok) throw new Error(`acceptFriendRequest failed: ${res.status}`);
  return (await res.json()) as { id: string; status: string };
}

export async function sendServerInvite(
  token: string,
  serverId: string,
  receiverId: string,
) {
  const res = await fetch(
    `${API_URL}/api/server-invites/server/${serverId}`,
    {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ receiverId }),
    },
  );
  if (!res.ok) throw new Error(`sendServerInvite failed: ${res.status}`);
  return (await res.json()) as { id: string };
}

export async function acceptServerInvite(token: string, inviteId: string) {
  const res = await fetch(
    `${API_URL}/api/server-invites/${inviteId}/accept`,
    {
      method: 'POST',
      headers: authHeaders(token),
    },
  );
  if (!res.ok) throw new Error(`acceptServerInvite failed: ${res.status}`);
  return res.json();
}

export async function getServers(token: string) {
  const res = await fetch(`${API_URL}/api/servers`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(`getServers failed: ${res.status}`);
  const data = await res.json();
  return (Array.isArray(data) ? data : data.data ?? []) as {
    id: string;
    name: string;
  }[];
}

export async function createRole(
  token: string,
  serverId: string,
  name: string,
  color = '#6366f1',
  permissions: string[] = [],
) {
  const res = await fetch(`${API_URL}/api/servers/${serverId}/roles`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ name, color, permissions }),
  });
  if (!res.ok) throw new Error(`createRole failed: ${res.status}`);
  return (await res.json()) as { id: string; name: string };
}

export async function getRoles(token: string, serverId: string) {
  const res = await fetch(`${API_URL}/api/servers/${serverId}/roles`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(`getRoles failed: ${res.status}`);
  const data = await res.json();
  return (Array.isArray(data) ? data : data.data ?? []) as {
    id: string;
    name: string;
    isDefault: boolean;
  }[];
}
