import { NextResponse } from "next/server";
import { logoutSession } from "@sqb/api-client";

function readCookie(request: Request, name: string) {
  return request.headers.get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

export async function POST(request: Request) {
  const sessionToken = readCookie(request, "erp_auth_session");
  if (sessionToken) {
    await logoutSession(sessionToken);
  }

  const response = NextResponse.json({ status: "logged_out" });
  for (const name of ["erp_auth_session", "erp_role", "erp_tenant", "erp_redirect_path", "erp_requires_terms", "erp_is_privileged"]) {
    response.cookies.set(name, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
  }

  return response;
}

