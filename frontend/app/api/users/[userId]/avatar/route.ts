import { backendFetch } from "../../../_utils/backendFetch";

type RouteParams = {
  params: Promise<{ userId: string }> | { userId: string };
};

export async function GET(_req: Request, context: RouteParams) {
  const { userId } = await context.params;
  const res = await backendFetch(`/api/users/${userId}/avatar`);

  const headers = new Headers();
  const contentType = res.headers.get("content-type");
  if (contentType) {
    headers.set("Content-Type", contentType);
  }
  const cacheControl = res.headers.get("cache-control");
  if (cacheControl) {
    headers.set("Cache-Control", cacheControl);
  }

  return new Response(res.body, {
    status: res.status,
    headers,
  });
}
