import { createAuthClient } from "better-auth/client";

const resolveBaseURL = () => {
  const envBackend = process.env.NEXT_PUBLIC_BACKEND_URL;
  const envSite = process.env.NEXT_PUBLIC_SITE_URL;
  const host = envBackend || envSite || "http://localhost:4000";

  if (!host) return undefined;
  return `${host.replace(/\/$/, "")}/api/auth`;
};

export const authClient = createAuthClient({
  // Better Auth requires an absolute URL
  baseURL: resolveBaseURL(),
});
