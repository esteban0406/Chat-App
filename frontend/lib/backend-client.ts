import { getToken } from "./auth";

const getBackendBaseURL = () => {
  const base = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!base) return "";
  return base.replace(/\/$/, "");
};

export const toBackendURL = (path: string) => {
  const base = getBackendBaseURL();
  if (!base) return path;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
};

export const unwrapList = <T>(body: unknown, key: string): T[] => {
  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    const data = record.data as Record<string, unknown> | undefined;
    const nested = data?.[key];
    if (Array.isArray(nested)) return nested as T[];
    const direct = record[key];
    if (Array.isArray(direct)) return direct as T[];
  }
  return Array.isArray(body) ? (body as T[]) : [];
};

export const backendFetch = (path: string, options: RequestInit = {}) => {
  const token = getToken();
  const headers = new Headers(options.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(toBackendURL(path), {
    ...options,
    headers,
  });
};

/**
 * Extract error message from NestJS error response
 * Handles both string and array message formats
 */
export async function extractErrorMessage(
  res: Response,
  fallback: string
): Promise<string> {
  try {
    const body = await res.json();
    if (body.message) {
      return Array.isArray(body.message)
        ? body.message.join(", ")
        : body.message;
    }
    return fallback;
  } catch {
    return fallback;
  }
}
