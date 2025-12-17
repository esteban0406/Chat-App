import { backendFetch } from "../_utils/backendFetch";

export async function GET() {
  const res = await backendFetch("/api/servers");

  if (!res.ok) {
    return Response.json(
      { error: "Failed to fetch servers" },
      { status: res.status }
    );
  }

  const body = await res.json();
  const servers = body?.data?.servers ?? body?.servers ?? body;

  return Response.json(Array.isArray(servers) ? servers : []);
}

export async function POST(req: Request) {
  const payload = await req.json();

  const res = await backendFetch("/api/servers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    return Response.json(
      { error: "Failed to create server" },
      { status: res.status }
    );
  }

  return Response.json(await res.json());
}
