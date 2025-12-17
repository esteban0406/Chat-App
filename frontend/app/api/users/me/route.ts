import { backendFetch } from "../../_utils/backendFetch";

export async function PATCH(req: Request) {
  const payload = await req.json();

  const res = await backendFetch("/api/users/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const body = await res.json().catch(() => ({}));

  return Response.json(body, { status: res.status });
}
