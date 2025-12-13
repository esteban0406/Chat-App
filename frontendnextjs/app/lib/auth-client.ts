import { createAuthClient } from "better-auth/react";

const resolveBaseURL = () => {
  const envBackend = process.env.NEXT_PUBLIC_BACKEND_URL;
  const host = envBackend || "http://localhost:4000";

  if (!host) return undefined;
  return `${host.replace(/\/$/, "")}/api/auth`;
};

export const authClient = createAuthClient({
  baseURL: resolveBaseURL(),
});

