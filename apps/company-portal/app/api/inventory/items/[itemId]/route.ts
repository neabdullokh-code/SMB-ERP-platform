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

export async function PATCH(request: Request, context: { params: Promise<{ itemId: string }> }) {
  const sessionToken = readCookie(request, "erp_auth_session");
  if (!sessionToken) {
    return NextResponse.json({ message: "Session not found", errorCode: "SESSION_INVALID" }, { status: 401 });
  }

  const { itemId } = await context.params;
  const payload = await request.json();
  const response = await fetch(`${platformApiUrl()}/inventory/items/${itemId}`, {
    method: "PATCH",
    headers: {
      "x-session-token": sessionToken,
      "content-type": "application/json"
    },
    body: JSON.stringify(payload),
    cache: "no-store"
  });

  const body = await response.json();
  return NextResponse.json(body, { status: response.status });
}

export async function DELETE(request: Request, context: { params: Promise<{ itemId: string }> }) {
  const sessionToken = readCookie(request, "erp_auth_session");
  if (!sessionToken) {
    return NextResponse.json({ message: "Session not found", errorCode: "SESSION_INVALID" }, { status: 401 });
  }

  const { itemId } = await context.params;
  const response = await fetch(`${platformApiUrl()}/inventory/items/${itemId}`, {
    method: "DELETE",
    headers: { "x-session-token": sessionToken },
    cache: "no-store"
  });

  if (response.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  const body = await response.json();
  return NextResponse.json(body, { status: response.status });
}
