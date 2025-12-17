import { cookies } from "next/headers";

const BACKEND_URL =
  process.env.BACKEND_URL || "http://localhost:4000";

function buildCookieHeader(
  cookieStore: Awaited<ReturnType<typeof cookies>>
) {
  return cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");
}

export async function backendFetch(
  path: string,
  options: RequestInit = {}
) {
  const cookieStore = await cookies();
  const cookieHeader = buildCookieHeader(cookieStore);

  if (!cookieHeader) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401 }
    );
  }

  return fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      cookie: cookieHeader,
    },
    cache: "no-store",
  });
}
