import { cookies } from "next/headers";

export async function GET() {
  const token = cookies().get("accessToken")?.value;
  if (!token) return Response.json([], { status: 401 });

  const res = await fetch(`${process.env.BACKEND_URL}/friends`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return Response.json(await res.json());
}
