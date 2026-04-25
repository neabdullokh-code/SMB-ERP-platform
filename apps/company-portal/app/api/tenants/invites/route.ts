import { NextResponse } from "next/server";
import { createTenantInvite } from "@sqb/api-client";

function readSessionToken(request: Request) {
  return request.headers.get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("erp_auth_session="))
    ?.split("=")[1];
}

export async function POST(request: Request) {
  const sessionToken = readSessionToken(request);

  if (!sessionToken) {
    return NextResponse.json({ message: "Session not found." }, { status: 401 });
  }

  const payload = await request.json();
  const result = await createTenantInvite(sessionToken, payload);
  return NextResponse.json(result.body, { status: result.status });
}
