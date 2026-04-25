"use client";

import { useRouter } from "next/navigation";
import { mapBankRedirectPath, resolvePortalUrl } from "@sqb/config/portal";
import { AuthExperience, type AuthExperienceMode } from "@sqb/ui";

export function BankAuthFlow({ mode, actorName }: { mode: AuthExperienceMode; actorName?: string }) {
  const router = useRouter();

  function replaceAcrossPortals(target: "company" | "bank", path: string) {
    if (typeof window === "undefined") {
      router.replace(path);
      return;
    }

    const url = resolvePortalUrl(path, target, {
      currentHref: window.location.href,
      companyPortalUrl: process.env.NEXT_PUBLIC_COMPANY_PORTAL_URL,
      bankPortalUrl: process.env.NEXT_PUBLIC_BANK_PORTAL_URL
    });
    window.location.replace(url);
  }

  return (
    <AuthExperience
      mode={mode}
      portalLabel="Bank Portal"
      portalName="SQB Business OS"
      heroTitle="Watch tenant risk with verified staff access."
      heroDescription="Bank operators review portfolio movement, exposure, and tenant posture from one control plane, and every route stays behind verified session checks."
      heroPoints={[
        "Dedicated staff login intent prevents customer credentials from crossing into the bank portal",
        "Session validation happens before the monitoring shell is served",
        "Terms acceptance remains mandatory before portfolio and audit data become visible"
      ]}
      stats={[
        { label: "Portal boundary", value: "Staff-only", detail: "Only bank-admin and super-admin sessions can proceed through this surface." },
        { label: "Session gate", value: "Validated", detail: "Protected routes now verify the active session before rewriting to the portal shell." },
        { label: "Access state", value: "Fail-closed", detail: "Missing or invalid sessions return users to the real login flow instead of stale static screens." }
      ]}
      loginIntent="bank_staff"
      challengeStorageKey="bank-portal-auth-challenge"
      termsVersion="2026-04"
      accentStart="#81d4f8"
      accentEnd="#65d5a0"
      accentGlow="#8abfef"
      actorName={actorName}
      onCreateWorkspace={() => replaceAcrossPortals("company", "/onboarding")}
      onSelectLoginIntent={(intent) => {
        if (intent === "smb_customer") {
          replaceAcrossPortals("company", "/login");
        }
      }}
      navigate={(path) => router.push(path)}
      replace={(path) => router.replace(path)}
      mapRedirectPath={mapBankRedirectPath}
    />
  );
}
