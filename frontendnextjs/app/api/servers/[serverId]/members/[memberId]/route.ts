import { backendFetch } from "../../../../_utils/backendFetch";

type Params = {
  params: {
    serverId: string;
    memberId: string;
  };
};

export async function DELETE(_: Request, { params }: Params) {
  const res = await backendFetch(
    `/api/servers/${params.serverId}/members/${params.memberId}`,
    { method: "DELETE" }
  );

  if (!res.ok) {
    return Response.json(
      { error: "Failed to remove member" },
      { status: res.status }
    );
  }

  return Response.json(await res.json());
}
