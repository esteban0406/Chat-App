import { backendFetch } from "../../_utils/backendFetch";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username");

  if (!username) {
    return Response.json(
      { error: "username is required" },
      { status: 400 }
    );
  }

  const res = await backendFetch(
    `/api/users/search?username=${encodeURIComponent(username)}`
  );

  if (!res.ok) {
    return Response.json(
      { error: "Failed to search users" },
      { status: res.status }
    );
  }

  return Response.json(await res.json());
}
