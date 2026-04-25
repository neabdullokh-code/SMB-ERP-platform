"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthExperience, type AuthExperienceMode } from "@sqb/ui";
import { mapCompanyRedirectPath } from "@/lib/portal-routes";

export function CompanyAuthFlow({ mode, actorName }: { mode: AuthExperienceMode; actorName?: string }) {
  const router = useRouter();
  const [loginIntent, setLoginIntent] = useState<"smb_customer" | "bank_staff">("smb_customer");

  useEffect(() => {
    const storedIntent = window.sessionStorage.getItem("company-portal-login-intent");
    if (storedIntent === "bank_staff" || storedIntent === "smb_customer") {
      setLoginIntent(storedIntent);
    }
  }, []);

  const isBankIntent = loginIntent === "bank_staff";

  function updateLoginIntent(intent: "smb_customer" | "bank_staff") {
    setLoginIntent(intent);
    window.sessionStorage.setItem("company-portal-login-intent", intent);
  }

  return (
    <AuthExperience
      mode={mode}
      portalLabel={isBankIntent ? "Bank Portal" : "Company Portal"}
      portalName="SQB Business OS"
      heroTitle={isBankIntent ? "Watch tenant risk with verified staff access." : "Run your business. Unlock financing."}
      heroAccentText={isBankIntent ? undefined : "One platform."}
      heroDescription={
        isBankIntent
          ? "Bank operators review portfolio movement, exposure, and tenant posture from one control plane, and every route stays behind verified session checks."
          : "The free ERP platform from SQB Bank for small and medium businesses in Uzbekistan. Inventory, finance, and 24-hour loan decisions all in one place."
      }
      heroPoints={
        isBankIntent
          ? [
              "Dedicated staff login intent prevents customer credentials from crossing into bank screens",
              "Protected bank routes stay behind verified staff session checks",
              "Terms acceptance remains mandatory before portfolio and audit data become visible"
            ]
          : [
              "Password plus OTP verification on every sign-in",
              "Tenant-aware access boundaries for inventory, production, and service operations",
              "Terms acceptance is enforced before the application shell becomes available"
            ]
      }
      stats={
        isBankIntent
          ? [
              { label: "Portal boundary", value: "Staff-only", detail: "Only bank-admin and super-admin sessions can proceed through this surface." },
              { label: "Session gate", value: "Validated", detail: "Protected routes verify the active session before the shell is served." },
              { label: "Access state", value: "Fail-closed", detail: "Missing or invalid sessions return users to the real login flow." }
            ]
          : [
              { label: "SMBs on platform", value: "12 400+", detail: "Prototype-matched marketing stat for the hero section." },
              { label: "Avg. credit decision", value: "24h", detail: "Prototype-matched turnaround message for financing decisions." },
              { label: "Financed in 2025", value: "UZS 1.8T", detail: "Prototype-matched financing volume for the hero section." }
            ]
      }
      loginIntent={loginIntent}
      challengeStorageKey="company-portal-auth-challenge"
      termsVersion="2026-04"
      accentStart="#7ee0b4"
      accentEnd="#f7cf67"
      accentGlow="#8dd9be"
      actorName={actorName}
      onCreateWorkspace={() => router.push("/onboarding")}
      onSelectLoginIntent={updateLoginIntent}
      navigate={(path) => router.push(path)}
      replace={(path) => router.replace(path)}
      mapRedirectPath={mapCompanyRedirectPath}
    />
  );
}
