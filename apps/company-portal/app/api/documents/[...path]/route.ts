import { NextResponse } from "next/server";

const DEFAULT_PLATFORM_API_URL = "http://localhost:4000";

function platformApiUrl() {
  return process.env.PLATFORM_API_URL ?? DEFAULT_PLATFORM_API_URL;
}

function readSessionToken(request: Request): string | null {
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("erp_auth_session="));
  return match ? match.slice("erp_auth_session=".length) : null;
}

async function proxy(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const sessionToken = readSessionToken(request);
  if (!sessionToken) {
    return NextResponse.json(
      { error: { message: "Session not found", errorCode: "SESSION_INVALID" } },
      { status: 401 }
    );
  }

  const { path } = await context.params;
  const search = new URL(request.url).search;
  const target = `${platformApiUrl()}/documents/${path.join("/")}${search}`;

  const headers: Record<string, string> = { "x-session-token": sessionToken };
  const init: RequestInit = { method: request.method, headers, cache: "no-store" };

  if (request.method !== "GET" && request.method !== "HEAD") {
    const body = await request.text();
    if (body) {
      init.body = body;
      headers["content-type"] = "application/json";
    }
  }

  const response = await fetch(target, init);
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const payload = await response.json();
    return NextResponse.json(payload, { status: response.status });
  }

  const text = await response.text();
  return new NextResponse(text, {
    status: response.status,
    headers: { "content-type": contentType }
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
