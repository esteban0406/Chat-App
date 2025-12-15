import { backendFetch } from "../../../_utils/backendFetch";

type Params = {
  params: Promise<{ requestId: string }> | { requestId: string };
};

export async function POST(req: Request, context: Params) {
  const payload = await req.json();
  const { requestId } = await context.params;

  const res = await backendFetch(`/api/friends/respond/${requestId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    return Response.json(
      { error: "Failed to update friend request" },
      { status: res.status }
    );
  }

  return Response.json(await res.json());
}
