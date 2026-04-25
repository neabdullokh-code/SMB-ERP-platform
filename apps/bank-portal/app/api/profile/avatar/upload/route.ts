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

export async function POST(request: Request) {
  const sessionToken = readCookie(request, "erp_auth_session");
  if (!sessionToken) {
    return NextResponse.json({ message: "Session not found", errorCode: "SESSION_INVALID" }, { status: 401 });
  }

  const incoming = await request.formData();
  const file = incoming.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ message: "Avatar file is required." }, { status: 400 });
  }

  const formData = new FormData();
  formData.append("file", file, file.name);

  const response = await fetch(`${platformApiUrl()}/profile/avatar/upload`, {
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
