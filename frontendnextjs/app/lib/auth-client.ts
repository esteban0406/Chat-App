import { createAuthClient } from "better-auth/client";

const baseURL =
  process.env.NEXT_PUBLIC_BACKEND_URL
    ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth`
    : "/api/auth";

export const authClient = createAuthClient({
  baseURL,
});

