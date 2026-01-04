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

export const backendFetch = (path: string, options: RequestInit = {}) =>
  fetch(toBackendURL(path), {
    ...options,
    credentials: "include",
  });
