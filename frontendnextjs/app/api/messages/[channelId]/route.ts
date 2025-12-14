import { backendFetch } from "../../_utils/backendFetch";

type Params = {
  params: Promise<{ channelId: string }> | { channelId: string };
};

export async function GET(
  _req: Request,
  context: Params
) {
  const params = await context.params;

  const res = await backendFetch(
    `/api/messages/${params.channelId}`
  );

  if (!res.ok) {
    return Response.json(
      { error: "Failed to fetch messages" },
      { status: res.status }
    );
  }

  const body = await res.json();
  const messages =
    body?.data?.messages ?? body?.messages ?? body;

  return Response.json(Array.isArray(messages) ? messages : []);
}
