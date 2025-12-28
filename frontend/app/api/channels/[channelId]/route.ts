import { backendFetch } from "../../_utils/backendFetch";

type Params = {
  params: Promise<{ channelId: string }> | { channelId: string };
};

export async function DELETE(
  _: Request,
  context: Params
) {
  const params = await context.params;
  const res = await backendFetch(
    `/api/channels/${params.channelId}`,
    { method: "DELETE" }
  );

  if (!res.ok) {
    return Response.json(
      { error: "Failed to delete channel" },
      { status: res.status }
    );
  }

  return Response.json({ success: true });
}

export async function PATCH(
  req: Request,
  context: Params
) {
  const payload = await req.json();
  const params = await context.params;

  const res = await backendFetch(
    `/api/channels/${params.channelId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    return Response.json(
      { error: "Failed to update channel" },
      { status: res.status }
    );
  }

  return Response.json(await res.json());
}
