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

  const [ordersResponse, approvalsResponse] = await Promise.all([
    fetch(`${platformApiUrl()}/service-orders`, {
      headers: { "x-session-token": sessionToken },
      cache: "no-store"
    }),
    fetch(`${platformApiUrl()}/workflows/approvals?status=pending`, {
      headers: { "x-session-token": sessionToken },
      cache: "no-store"
    })
  ]);

  const [ordersBody, approvalsBody] = await Promise.all([ordersResponse.json(), approvalsResponse.json()]);
  const status = ordersResponse.ok && approvalsResponse.ok ? 200 : (ordersResponse.ok ? approvalsResponse.status : ordersResponse.status);

  return NextResponse.json(
    {
      data: {
        orders: ordersBody.data ?? [],
        approvals: approvalsBody.data ?? []
      },
      meta: null,
      error: null
    },
    { status }
  );
}
