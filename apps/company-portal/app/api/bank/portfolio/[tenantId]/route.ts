import { NextResponse } from "next/server";
import { platformRequest } from "@sqb/api-client";

function readCookie(request: Request, name: string) {
  return request.headers.get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

export async function GET(request: Request, context: { params: Promise<{ tenantId: string }> }) {
  const sessionToken = readCookie(request, "erp_auth_session");
  if (!sessionToken) {
    return NextResponse.json({ message: "Session not found", errorCode: "SESSION_INVALID" }, { status: 401 });
  }

  const { tenantId } = await context.params;
  const result = await platformRequest(`/bank/portfolio/${tenantId}`, { method: "GET" }, sessionToken);
  return NextResponse.json(result.body, { status: result.status });
}
