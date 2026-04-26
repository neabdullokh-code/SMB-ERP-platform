import { NextResponse } from "next/server";

const DEFAULT_PLATFORM_API_URL = "http://localhost:4000";

function platformApiUrl() {
  return process.env.PLATFORM_API_URL ?? DEFAULT_PLATFORM_API_URL;
}

function readCookie(request: Request, name: string) {
  return request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

type RouteParams = Promise<{ orderId: string }>;

export async function PATCH(request: Request, { params }: { params: RouteParams }) {
  const sessionToken = readCookie(request, "erp_auth_session");
  if (!sessionToken) {
    return NextResponse.json({ message: "Session not found", errorCode: "SESSION_INVALID" }, { status: 401 });
  }

  const { orderId } = await params;
  const payload = await request.text();
  const response = await fetch(`${platformApiUrl()}/service-orders/${orderId}/status`, {
    method: "PATCH",
    headers: {
      "x-session-token": sessionToken,
      "content-type": "application/json"
    },
    body: payload,
    cache: "no-store"
  });

  const responseBody = await response.text();
  return new Response(responseBody, {
    status: response.status,
    headers: {
      "content-type": response.headers.get("content-type") ?? "application/json"
    }
  });
}
