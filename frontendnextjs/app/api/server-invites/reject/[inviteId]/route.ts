import { backendFetch } from "../../../_utils/backendFetch";

type Params = {
  params: Promise<{ inviteId: string }> | { inviteId: string };
};

export async function POST(
  _req: Request,
  context: Params
) {
  const { inviteId } = await context.params;

  const res = await backendFetch(
    `/api/ServerInvites/reject/${inviteId}`,
    { method: "POST" }
  );

  if (!res.ok) {
    return Response.json(
      { error: "Failed to reject server invite" },
      { status: res.status }
    );
  }

  return Response.json(await res.json());
}
