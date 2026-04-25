import { NextResponse } from "next/server";
import { acceptTerms } from "@sqb/api-client";

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
    return NextResponse.json({ message: "Session not found" }, { status: 401 });
  }

  const payload = await request.json();
  const result = await acceptTerms(sessionToken, payload);
  const response = NextResponse.json(result.body, { status: result.status });

  if (result.ok && result.body.session) {
    response.cookies.set("erp_requires_terms", String(result.body.session.requiresTermsAcceptance), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: new URL(request.url).protocol === "https:"
    });
  }

  return response;
}
