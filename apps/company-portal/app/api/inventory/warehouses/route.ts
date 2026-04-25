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

export async function GET(request: Request) {
  const sessionToken = readCookie(request, "erp_auth_session");
  if (!sessionToken) {
    return NextResponse.json({ message: "Session not found", errorCode: "SESSION_INVALID" }, { status: 401 });
  }

  const response = await fetch(`${platformApiUrl()}/inventory/warehouses`, {
    headers: { "x-session-token": sessionToken },
    cache: "no-store"
  });

  const body = await response.json();
  return NextResponse.json(body, { status: response.status });
}

export async function POST(request: Request) {
  const sessionToken = readCookie(request, "erp_auth_session");
  if (!sessionToken) {
    return NextResponse.json({ message: "Session not found", errorCode: "SESSION_INVALID" }, { status: 401 });
  }

  const payload = await request.json();
  const response = await fetch(`${platformApiUrl()}/inventory/warehouses`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-session-token": sessionToken
    },
    body: JSON.stringify(payload),
    cache: "no-store"
  });

  const body = await response.json();
  return NextResponse.json(body, { status: response.status });
}
