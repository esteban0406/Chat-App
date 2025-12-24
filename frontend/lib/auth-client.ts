import { createAuthClient } from "better-auth/react";

const resolveBaseURL = () => {
  const host = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

  if (!host) return undefined;
  return `${host.replace(/\/$/, "")}/api/auth`;
};

export const authClient = createAuthClient({
  baseURL: resolveBaseURL(),
});

export type Session = typeof authClient.$Infer.Session

