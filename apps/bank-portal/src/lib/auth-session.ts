import { cookies } from "next/headers";
import { getAuthSession } from "@sqb/api-client";
import type { AuthSession, Role } from "@sqb/domain-types";
import { mapBankRedirectPath } from "@/lib/portal-routes";

const BANK_ALLOWED_ROLES = new Set<Role>(["bank_admin", "super_admin"]);

export type BankSessionState =
  | { status: "anonymous" }
  | { status: "unavailable" }
  | { status: "authenticated"; session: AuthSession };

export async function readBankSession(): Promise<BankSessionState> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("erp_auth_session")?.value;

  if (!sessionToken) {
    return { status: "anonymous" };
  }

  try {
    const result = await getAuthSession(sessionToken);
    const session = result.body.session;
    if (!result.ok || !session || !BANK_ALLOWED_ROLES.has(session.role)) {
      return { status: "anonymous" };
    }

    return { status: "authenticated", session };
  } catch {
    return { status: "unavailable" };
  }
}

export function bankDestinationForSession(session: AuthSession) {
  return session.requiresTermsAcceptance ? "/terms" : mapBankRedirectPath(session.redirectPath);
}
