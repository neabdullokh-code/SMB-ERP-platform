import { NextResponse } from "next/server";

const DEFAULT_PLATFORM_API_URL = "http://localhost:4000";

function platformApiUrl() {
  return process.env.PLATFORM_API_URL ?? DEFAULT_PLATFORM_API_URL;
}

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

  const formData = await request.formData();
  const { id } = await context.params;
  const response = await fetch(`${platformApiUrl()}/credit/applications/${id}/documents`, {
    method: "POST",
    headers: {
      "x-session-token": sessionToken
    },
    body: formData,
    cache: "no-store"
  });

  const body = await response.json();
  return NextResponse.json(body, { status: response.status });
}
