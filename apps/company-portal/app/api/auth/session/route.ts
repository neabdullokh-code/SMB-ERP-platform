import { NextResponse } from "next/server";
import { getAuthSession } from "@sqb/api-client";

function clearCookies(response: NextResponse) {
  for (const name of ["erp_auth_session", "erp_role", "erp_tenant", "erp_redirect_path", "erp_requires_terms", "erp_is_privileged"]) {
    response.cookies.set(name, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
  }
}

export async function GET(request: Request) {
  const sessionToken = request.headers.get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("erp_auth_session="))
    ?.split("=")[1];

  if (!sessionToken) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const result = await getAuthSession(sessionToken);
  const response = NextResponse.json({ authenticated: result.ok, ...result.body }, { status: result.status });

  if (!result.ok) {
    clearCookies(response);
  }

  return response;
}

