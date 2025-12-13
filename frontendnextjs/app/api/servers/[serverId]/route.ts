import { backendFetch } from "../../_utils/backendFetch";

type Params = {
  params: { serverId: string };
};

export async function DELETE(_: Request, { params }: Params) {
  const res = await backendFetch(
    `/api/servers/${params.serverId}`,
    { method: "DELETE" }
  );

  if (!res.ok) {
    return Response.json(
      { error: "Failed to delete server" },
      { status: res.status }
    );
  }

  return Response.json({ success: true });
}
