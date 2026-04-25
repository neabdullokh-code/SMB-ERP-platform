import { NextResponse } from "next/server";
import { verifyOtp } from "@sqb/api-client";

function applySessionCookies(
  request: Request,
  response: NextResponse,
  session: NonNullable<Awaited<ReturnType<typeof verifyOtp>>["body"]["session"]>
) {
  const options = { httpOnly: true, sameSite: "lax" as const, path: "/", secure: new URL(request.url).protocol === "https:" };
  response.cookies.set("erp_auth_session", session.sessionToken, options);
  response.cookies.set("erp_role", session.role, options);
  response.cookies.set("erp_tenant", session.tenantId ?? "", options);
  response.cookies.set("erp_redirect_path", session.redirectPath, options);
  response.cookies.set("erp_requires_terms", String(session.requiresTermsAcceptance), options);
  response.cookies.set("erp_is_privileged", String(session.isPrivileged), options);
  if (session.refreshToken) {
    response.cookies.set("erp_auth_refresh", session.refreshToken, options);
  }
}

export async function POST(request: Request) {
  const payload = await request.json();
  const result = await verifyOtp(payload);
  const response = NextResponse.json(result.body, { status: result.status });

  if (result.body.session) {
    applySessionCookies(request, response, result.body.session);
  }

  return response;
}
