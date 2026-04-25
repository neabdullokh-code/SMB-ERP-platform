import { cookies } from "next/headers";
import { getAuthSession } from "@sqb/api-client";
import type { AuthSession, Role } from "@sqb/domain-types";
import { mapCompanyRedirectPath } from "@/lib/portal-routes";

const COMPANY_ALLOWED_ROLES = new Set<Role>(["company_admin", "employee", "bank_admin", "super_admin"]);

export type CompanySessionState =
  | { status: "anonymous" }
  | { status: "unavailable" }
  | { status: "authenticated"; session: AuthSession };

export async function readCompanySession(): Promise<CompanySessionState> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("erp_auth_session")?.value;

  if (!sessionToken) {
    return { status: "anonymous" };
  }

  try {
    const result = await getAuthSession(sessionToken);
    const session = result.body.session;
    if (!result.ok || !session || !COMPANY_ALLOWED_ROLES.has(session.role)) {
      return { status: "anonymous" };
    }

    return { status: "authenticated", session };
  } catch {
    return { status: "unavailable" };
  }
}

export function companyDestinationForSession(session: AuthSession) {
  return session.requiresTermsAcceptance ? "/terms" : mapCompanyRedirectPath(session.redirectPath);
}
