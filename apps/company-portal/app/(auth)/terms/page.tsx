import { redirect } from "next/navigation";
import { CompanyAuthFlow } from "@/features/auth/auth-flow";
import { companyDestinationForSession, readCompanySession } from "@/lib/auth-session";

export default async function CompanyTermsPage() {
  const sessionState = await readCompanySession();

  if (sessionState.status !== "authenticated") {
    redirect("/login");
  }

  if (!sessionState.session.requiresTermsAcceptance) {
    redirect(companyDestinationForSession(sessionState.session));
  }

  return <CompanyAuthFlow mode="terms" actorName={sessionState.session.actor.name} />;
}
