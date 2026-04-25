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

  const [inventory, invoices] = await Promise.all([
    fetchJson(sessionToken, "/inventory/summary"),
    fetchJson(sessionToken, "/finance/invoices")
  ]);

  const firstError = !inventory.response.ok ? inventory : !invoices.response.ok ? invoices : null;
  if (firstError) {
    return NextResponse.json(firstError.body, { status: firstError.response.status });
  }

  return NextResponse.json({
    data: {
      inventoryCount: Array.isArray(inventory.body?.data?.items) ? inventory.body.data.items.length : 0,
      invoiceCount: Array.isArray(invoices.body?.data) ? invoices.body.data.length : 0
    },
    meta: null,
    error: null
  }, { status: 200 });
}
