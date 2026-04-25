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

/**
 * Forward a request from the Next.js portal to the platform API, rewriting the
 * path prefix (e.g. /api/documents/* → /documents/*). The session token is
 * moved from the httpOnly cookie into the `x-session-token` header the API
 * expects.
 */
export async function proxyToPlatformApi(
  request: Request,
  pathSegments: string[],
  mountAs: string
): Promise<NextResponse> {
  const sessionToken = readSessionToken(request);
  if (!sessionToken) {
    return NextResponse.json(
      { error: { message: "Session not found", errorCode: "SESSION_INVALID" } },
      { status: 401 }
    );
  }

  const search = new URL(request.url).search;
  const mount = mountAs.replace(/^\/+/, "").replace(/\/+$/, "");
  const target = `${platformApiUrl()}/${mount}/${pathSegments.join("/")}${search}`;

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
