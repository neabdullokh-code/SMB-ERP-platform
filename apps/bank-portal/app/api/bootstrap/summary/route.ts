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

async function fetchJson(sessionToken: string, path: string) {
  const response = await fetch(`${platformApiUrl()}${path}`, {
    headers: { "x-session-token": sessionToken },
    cache: "no-store"
  });
  const body = await response.json();
  return { response, body };
}

export async function GET(request: Request) {
  const sessionToken = readCookie(request, "erp_auth_session");
  if (!sessionToken) {
    return NextResponse.json({ message: "Session not found", errorCode: "SESSION_INVALID" }, { status: 401 });
  }

  const [alerts, analytics, queue] = await Promise.all([
    fetchJson(sessionToken, "/bank/portfolio/alerts"),
    fetchJson(sessionToken, "/bank/portfolio/analytics"),
    fetchJson(sessionToken, "/bank/credit-queue")
  ]);

  const firstError = !alerts.response.ok ? alerts : !analytics.response.ok ? analytics : !queue.response.ok ? queue : null;
  if (firstError) {
    return NextResponse.json(firstError.body, { status: firstError.response.status });
  }

  return NextResponse.json({
    data: {
      alertCount: Array.isArray(alerts.body?.data?.alerts) ? alerts.body.data.alerts.length : 0,
      tenantCount: Number(analytics.body?.data?.analytics?.totalTenants ?? 0),
      creditQueueCount: Array.isArray(queue.body?.data?.applications) ? queue.body.data.applications.length : 0
    },
    meta: null,
    error: null
  }, { status: 200 });
}
