import { redirect } from "next/navigation";
import { CompanyAuthFlow } from "@/features/auth/auth-flow";
import { companyDestinationForSession, readCompanySession } from "@/lib/auth-session";

export default async function CompanyOnboardingPage() {
  const sessionState = await readCompanySession();

  if (sessionState.status === "authenticated") {
    redirect(companyDestinationForSession(sessionState.session));
  }

  return <CompanyAuthFlow mode="onboarding" />;
}
