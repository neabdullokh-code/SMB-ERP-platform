import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COMPANY_PROTECTED_PORTAL_PATHS, COMPANY_PUBLIC_PORTAL_PATHS, mapCompanyRedirectPath } from "@sqb/config/portal";

const AUTH_COOKIES = ["erp_auth_session", "erp_auth_refresh", "erp_role", "erp_tenant", "erp_redirect_path", "erp_requires_terms", "erp_is_privileged"];

function clearAuthCookies(response: NextResponse) {
  for (const name of AUTH_COOKIES) {
    response.cookies.set(name, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
  }
}

type SessionValidation =
  | { status: "anonymous" | "unavailable" | "invalid" }
  | { status: "authenticated"; session: { role: string; requiresTermsAcceptance: boolean }; newSessionToken?: string; newRefreshToken?: string };

async function tryFetchSession(url: URL, cookieHeader: string): Promise<{ role: string; requiresTermsAcceptance: boolean } | null> {
  const response = await fetch(url, {
    headers: { cookie: cookieHeader },
    cache: "no-store"
  });

  if (!response.ok) return null;

  const body = await response.json() as { authenticated?: boolean; session?: { role: string; requiresTermsAcceptance: boolean } };
  if (!body.authenticated || !body.session) return null;
  if (!["company_admin", "employee", "bank_admin", "super_admin"].includes(body.session.role)) return null;

  return body.session;
}

async function validateSession(request: NextRequest): Promise<SessionValidation> {
  const sessionToken = request.cookies.get("erp_auth_session")?.value;
  const refreshToken = request.cookies.get("erp_auth_refresh")?.value;

  if (!sessionToken && !refreshToken) {
    return { status: "anonymous" };
  }

  const sessionUrl = new URL("/api/auth/session", request.url);

  if (sessionToken) {
    try {
      const sessionResponse = await fetch(sessionUrl, {
        headers: { cookie: request.headers.get("cookie") ?? "" },
        cache: "no-store"
      });

      if (sessionResponse.status >= 500) return { status: "unavailable" };

      const body = await sessionResponse.json() as { authenticated?: boolean; session?: { role: string; requiresTermsAcceptance: boolean } };

      if (
        sessionResponse.ok &&
        body.authenticated &&
        body.session &&
        ["company_admin", "employee", "bank_admin", "super_admin"].includes(body.session.role)
      ) {
        return { status: "authenticated", session: body.session };
      }
    } catch {
      return { status: "unavailable" };
    }
  }

  // Access token invalid/missing — attempt silent refresh with refresh token
  if (!refreshToken) {
    return { status: "invalid" };
  }

  try {
    const refreshResponse = await fetch(new URL("/api/auth/token/refresh", request.url), {
      method: "POST",
      headers: { cookie: request.headers.get("cookie") ?? "" },
      cache: "no-store"
    });

    if (!refreshResponse.ok) return { status: "invalid" };

    const refreshBody = await refreshResponse.json() as { sessionToken?: string; refreshToken?: string };
    if (!refreshBody.sessionToken) return { status: "invalid" };

    // Re-validate with new token
    const newCookieHeader = `erp_auth_session=${refreshBody.sessionToken}; ${request.headers.get("cookie") ?? ""}`;
    const session = await tryFetchSession(sessionUrl, newCookieHeader);
    if (!session) return { status: "invalid" };

    return {
      status: "authenticated",
      session,
      newSessionToken: refreshBody.sessionToken,
      newRefreshToken: refreshBody.refreshToken
    };
  } catch {
    return { status: "invalid" };
  }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname.replace(/\/+$/, "") || "/";
  const isBankSurface = pathname.startsWith("/bank");

  if (pathname === "/") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname.startsWith("/smb/")) {
    return NextResponse.redirect(new URL(mapCompanyRedirectPath(pathname), request.url));
  }

  if (COMPANY_PUBLIC_PORTAL_PATHS.has(pathname)) {
    return NextResponse.rewrite(new URL("/portal-ui/index.html", request.url));
  }

  if (!COMPANY_PROTECTED_PORTAL_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  const validation = await validateSession(request);

  if (validation.status === "unavailable") {
    return new NextResponse("Authentication service unavailable.", {
      status: 503,
      headers: { "content-type": "text/plain; charset=utf-8" }
    });
  }

  if (validation.status !== "authenticated") {
    const response = NextResponse.redirect(new URL("/login", request.url));
    clearAuthCookies(response);
    return response;
  }

  const allowedRoles = isBankSurface ? ["bank_admin", "super_admin"] : ["company_admin", "employee"];
  if (!allowedRoles.includes(validation.session.role)) {
    return NextResponse.redirect(new URL(
      validation.session.role === "bank_admin" || validation.session.role === "super_admin" ? "/bank/home" : "/app/dashboard",
      request.url
    ));
  }

  if (validation.session.requiresTermsAcceptance) {
    return NextResponse.redirect(new URL("/terms", request.url));
  }

  const nextResponse = NextResponse.rewrite(new URL("/portal-ui/index.html", request.url));

  // Apply new cookies from silent refresh
  if (validation.newSessionToken) {
    const opts = { httpOnly: true, sameSite: "lax" as const, path: "/", secure: request.url.startsWith("https:") };
    nextResponse.cookies.set("erp_auth_session", validation.newSessionToken, opts);
    if (validation.newRefreshToken) {
      nextResponse.cookies.set("erp_auth_refresh", validation.newRefreshToken, opts);
    }
  }

  return nextResponse;
}

export const config = {
  matcher: ["/", "/login", "/otp", "/forgot", "/terms", "/onboarding", "/search", "/app/:path*", "/smb/:path*", "/bank/:path*"]
};
