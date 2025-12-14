import { backendFetch } from "../_utils/backendFetch";

export async function POST(req: Request) {
  const payload = await req.json();

  const res = await backendFetch("/api/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    return Response.json(
      { error: "Failed to send message" },
      { status: res.status }
    );
  }

  return Response.json(await res.json());
}
