import { headers } from "next/headers";
import { getSessionCookie } from "better-auth/cookies";

const BACKEND_URL =  process.env.BACKEND_URL;

export async function backendFetch(
  path: string,
  options: RequestInit = {}
) {
  const headerStore = await headers();
  const sessionToken = getSessionCookie(headerStore);

  if (!sessionToken) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401 }
    );
  }

  const existingAuth = (() => {
    const hdrs = options.headers;
    if (!hdrs) return undefined;
    if (hdrs instanceof Headers) {
      return hdrs.get("authorization") ?? hdrs.get("Authorization") ?? undefined;
    }
    if (Array.isArray(hdrs)) {
      const entry = hdrs.find(
        ([key]) => key.toLowerCase() === "authorization"
      );
      return entry?.[1];
    }
    const record = hdrs as Record<string, string>;
    return record.authorization ?? record.Authorization;
  })();

  return fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      authorization: existingAuth ?? `Bearer ${sessionToken}`,
    },
    cache: "no-store",
  });
}
