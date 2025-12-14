import { backendFetch } from "../_utils/backendFetch";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const serverId = searchParams.get("serverId");

  if (!serverId) {
    return Response.json(
      { error: "serverId is required" },
      { status: 400 }
    );
  }

  const res = await backendFetch(`/api/channels/${serverId}`);

  if (!res.ok) {
    return Response.json(
      { error: "Failed to fetch channels" },
      { status: res.status }
    );
  }

  const body = await res.json();
  const channels =   body?.data?.channels ?? body?.channels ?? body;

  return Response.json(Array.isArray(channels) ? channels : []);
}

export async function POST(req: Request) {
  const payload = await req.json();

  const res = await backendFetch("/api/channels", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    return Response.json(
      { error: "Failed to create channel" },
      { status: res.status }
    );
  }

  return Response.json(await res.json());
}
