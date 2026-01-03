import { NextResponse, NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const backendUrl =
    process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!backendUrl) {
    return NextResponse.next();
  }

  try {
    const res = await fetch(
      `${backendUrl.replace(/\/$/, "")}/api/auth/get-session`,
      {
        headers: { cookie: request.headers.get("cookie") ?? "" },
        cache: "no-store",
      }
    );
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if (!res.ok || !data?.session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/servers/:path*", "/friends/:path*"],
};
