import { NextResponse } from "next/server";
import { revokeTenantInvite } from "@sqb/api-client";

function readSessionToken(request: Request) {
  return request.headers.get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("erp_auth_session="))
    ?.split("=")[1];
}

export async function POST(request: Request, context: { params: Promise<{ inviteId: string }> }) {
  const sessionToken = readSessionToken(request);

  if (!sessionToken) {
    return NextResponse.json({ message: "Session not found." }, { status: 401 });
  }

  const { inviteId } = await context.params;
  const result = await revokeTenantInvite(sessionToken, inviteId);
  return NextResponse.json(result.body, { status: result.status });
}
