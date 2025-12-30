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

export const backendFetch = (
  path: string,
  options: RequestInit = {}
) =>
  fetch(toBackendURL(path), {
    ...options,
    credentials: "include",
  });
