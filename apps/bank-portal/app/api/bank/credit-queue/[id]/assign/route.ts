import { NextResponse } from "next/server";
import { assignCreditApplication } from "@sqb/api-client";

function readCookie(request: Request, name: string) {
  return request.headers.get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const sessionToken = readCookie(request, "erp_auth_session");
  if (!sessionToken) {
    return NextResponse.json({ message: "Session not found", errorCode: "SESSION_INVALID" }, { status: 401 });
  }

  const body = await request.json();
  const { id } = await context.params;
  const result = await assignCreditApplication(sessionToken, id, body);
  return NextResponse.json(result.body, { status: result.status });
}
