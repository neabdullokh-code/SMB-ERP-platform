import { NextResponse } from "next/server";
import { getAuditEvents } from "@sqb/api-client";

function readCookie(request: Request, name: string) {
  return request.headers.get("cookie")
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

  const { searchParams } = new URL(request.url);
  const result = await getAuditEvents(sessionToken, {
    category: searchParams.get("category") ?? undefined,
    actorRole: searchParams.get("actorRole") ?? undefined,
    tenantId: searchParams.get("tenantId") ?? undefined,
    q: searchParams.get("q") ?? undefined,
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
    page: searchParams.get("page") ? Number(searchParams.get("page")) : undefined,
    pageSize: searchParams.get("pageSize") ? Number(searchParams.get("pageSize")) : undefined,
    limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined
  });

  return NextResponse.json(result.body, { status: result.status });
}
