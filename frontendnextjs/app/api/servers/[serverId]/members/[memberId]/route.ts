import { backendFetch } from "../../../../_utils/backendFetch";

type Params = {
  params:
    | { serverId: string; memberId: string }
    | Promise<{ serverId: string; memberId: string }>;
};

export async function DELETE(
  _req: Request,
  context: Params
) {
  const { serverId, memberId } = await context.params;

  const res = await backendFetch(
    `/api/servers/${serverId}/members/${memberId}`,
    { method: "DELETE" }
  );

  if (!res.ok) {
    return Response.json(
      { error: "Failed to remove server member" },
      { status: res.status }
    );
  }

  return Response.json(await res.json());
}
