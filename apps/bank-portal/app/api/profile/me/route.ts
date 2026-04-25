import { NextResponse } from "next/server";
import { getMyProfile, updateMyProfile } from "@sqb/api-client";

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

  const result = await getMyProfile(sessionToken);
  return NextResponse.json(result.body, { status: result.status });
}

export async function PATCH(request: Request) {
  const sessionToken = readCookie(request, "erp_auth_session");
  if (!sessionToken) {
    return NextResponse.json({ message: "Session not found", errorCode: "SESSION_INVALID" }, { status: 401 });
  }

  const payload = await request.json();
  const result = await updateMyProfile(sessionToken, payload);
  return NextResponse.json(result.body, { status: result.status });
}
