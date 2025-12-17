import { backendFetch } from "../../_utils/backendFetch";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const serverId = searchParams.get("serverId");

  const path = serverId
    ? `/api/ServerInvites/pending?serverId=${encodeURIComponent(serverId)}`
    : "/api/ServerInvites/pending";

  const res = await backendFetch(path);

  if (!res.ok) {
    return Response.json(
      { error: "Failed to fetch server invites" },
      { status: res.status }
    );
  }

  const body = await res.json();
  const invites =
    body?.data?.invites ?? body?.invites ?? body;

  return Response.json(Array.isArray(invites) ? invites : []);
}
