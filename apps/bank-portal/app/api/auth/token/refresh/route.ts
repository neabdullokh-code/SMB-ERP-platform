import { NextResponse } from "next/server";
import { refreshAccessToken } from "@sqb/api-client";

function applyRefreshedCookies(request: Request, response: NextResponse, sessionToken: string) {
  const options = { httpOnly: true, sameSite: "lax" as const, path: "/", secure: new URL(request.url).protocol === "https:" };
  response.cookies.set("erp_auth_session", sessionToken, options);
}

export async function POST(request: Request) {
  const refreshToken = request.headers.get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("erp_auth_refresh="))
    ?.split("=")[1];

  if (!refreshToken) {
    return NextResponse.json({ errorCode: "SESSION_INVALID" }, { status: 401 });
  }

  const result = await refreshAccessToken(refreshToken);
  const response = NextResponse.json(result.body, { status: result.status });

  if (result.ok && "sessionToken" in result.body) {
    applyRefreshedCookies(request, response, result.body.sessionToken);
  }

  return response;
}
