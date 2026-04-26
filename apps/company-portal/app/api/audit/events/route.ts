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

  const result = await getAuditEvents(sessionToken);
  const body = result.body as Record<string, unknown>;
  const events = Array.isArray(body.events)
    ? body.events
    : Array.isArray(body.data)
      ? body.data
      : [];

  if (!result.ok) {
    return NextResponse.json(body, { status: result.status });
  }

  return NextResponse.json({ events }, { status: result.status });
}
