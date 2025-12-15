import { backendFetch } from "../../_utils/backendFetch";

export async function GET() {
  const res = await backendFetch("/api/ServerInvites/pending");

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
