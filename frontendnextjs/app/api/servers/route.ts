import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = cookies();
  const token = cookieStore.get("accessToken")?.value;

  if (!token) {
    return new Response("Unauthorized", { status: 401 });
  }

  const res = await fetch(`${process.env.BACKEND_URL}/servers`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  return Response.json(data);
}
