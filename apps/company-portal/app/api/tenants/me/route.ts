import { NextResponse } from "next/server";
import { getWorkspaceContext } from "@sqb/api-client";

function readSessionToken(request: Request) {
  return request.headers.get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("erp_auth_session="))
    ?.split("=")[1];
}

export async function GET(request: Request) {
  const sessionToken = readSessionToken(request);

  if (!sessionToken) {
    return NextResponse.json({ message: "Session not found." }, { status: 401 });
  }

  const result = await getWorkspaceContext(sessionToken);
  return NextResponse.json(result.body, { status: result.status });
}
