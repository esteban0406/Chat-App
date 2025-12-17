import { cookies } from "next/headers";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:4000";

function buildCookieHeader(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");
}

export async function GET() {
  const cookieStore = await cookies();
  const cookieHeader = buildCookieHeader(cookieStore);

  if (!cookieHeader) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const res = await fetch(`${BACKEND_URL}/api/friends/list`, {
    headers: {
      cookie: cookieHeader,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    return Response.json(
      { error: "Failed to fetch friends" },
      { status: res.status }
    );
  }

  const body = await res.json();
  const friends = body?.data?.friends ?? body?.friends ?? body;

  return Response.json(Array.isArray(friends) ? friends : []);
}
