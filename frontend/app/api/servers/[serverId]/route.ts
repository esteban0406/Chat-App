import { backendFetch } from "../../_utils/backendFetch";

type Params = {
  params: Promise<{ serverId: string }> | { serverId: string };
};

export async function DELETE(_: Request, context: Params) {
  const { serverId } = await context.params;
  const res = await backendFetch(
    `/api/servers/${serverId}`,
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
