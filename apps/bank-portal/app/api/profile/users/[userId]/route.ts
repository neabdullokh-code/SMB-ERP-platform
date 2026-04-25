import { NextResponse } from "next/server";
import { updateProfileByAdmin } from "@sqb/api-client";

function readCookie(request: Request, name: string) {
  return request.headers.get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

export async function PATCH(request: Request, context: { params: Promise<{ userId: string }> }) {
  const sessionToken = readCookie(request, "erp_auth_session");
  if (!sessionToken) {
    return NextResponse.json({ message: "Session not found", errorCode: "SESSION_INVALID" }, { status: 401 });
  }

  const payload = await request.json();
  const { userId } = await context.params;
  const result = await updateProfileByAdmin(sessionToken, userId, payload);
  return NextResponse.json(result.body, { status: result.status });
}
