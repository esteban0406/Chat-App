import { createAuthClient } from "better-auth/react";
import { usernameClient } from "better-auth/client/plugins";

const resolveBaseURL = () => {
  const host =
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.BACKEND_URL ||
    "http://localhost:4000";
  return `${host.replace(/\/$/, "")}/api/auth`;
};

export const authClient = createAuthClient({
  baseURL: resolveBaseURL(),
  plugins: [usernameClient()],
});

export type Session = typeof authClient.$Infer.Session
