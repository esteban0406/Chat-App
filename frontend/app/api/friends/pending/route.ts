import { backendFetch } from "../../_utils/backendFetch";

export async function GET() {
  const res = await backendFetch("/api/friends/pending");

  if (!res.ok) {
    return Response.json(
      { error: "Failed to fetch friend requests" },
      { status: res.status }
    );
  }

  const body = await res.json();
  const requests =
    body?.data?.requests ?? body?.requests ?? body;

  return Response.json(Array.isArray(requests) ? requests : []);
}
