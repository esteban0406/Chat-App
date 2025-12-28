import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL;

const buildTargetURL = (request: NextRequest) => {
  if (!BACKEND_URL) return null;

  const base = BACKEND_URL.replace(/\/$/, "");
  const url = new URL(request.url);
  const pathname = url.pathname.replace(/^\/api\/auth/, "");

  return `${base}/api/auth${pathname}${url.search}`;
};

const forwardHeaders = (request: NextRequest) => {
  const headers = new Headers(request.headers);
  headers.delete("host");
  return headers;
};

async function proxyAuth(request: NextRequest) {
  const target = buildTargetURL(request);
  if (!target) {
    return NextResponse.json(
      { error: "BACKEND_URL is not configured" },
      { status: 500 }
    );
  }

  const body =
    request.method === "GET" || request.method === "HEAD"
      ? undefined
      : await request.arrayBuffer();

  const res = await fetch(target, {
    method: request.method,
    headers: forwardHeaders(request),
    body,
    redirect: "manual",
  });

  const responseHeaders = new Headers(res.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");

  const setCookie = (res.headers as unknown as { getSetCookie?: () => string[] })
    .getSetCookie?.();
  if (Array.isArray(setCookie)) {
    setCookie.forEach((cookie) => responseHeaders.append("set-cookie", cookie));
  } else {
    const single = res.headers.get("set-cookie");
    if (single) {
      responseHeaders.append("set-cookie", single);
    }
  }

  const data = await res.arrayBuffer();
  return new NextResponse(data, {
    status: res.status,
    headers: responseHeaders,
  });
}

export const GET = proxyAuth;
export const POST = proxyAuth;
export const PUT = proxyAuth;
export const PATCH = proxyAuth;
export const DELETE = proxyAuth;
