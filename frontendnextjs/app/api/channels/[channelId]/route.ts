import { backendFetch } from "../../_utils/backendFetch";

type Params = {
  params: { channelId: string };
};

export async function DELETE(
  _: Request,
  { params }: Params
) {
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
  { params }: Params
) {
  const payload = await req.json();

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
