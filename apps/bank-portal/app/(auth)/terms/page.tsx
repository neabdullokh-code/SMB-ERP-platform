import { redirect } from "next/navigation";
import { BankAuthFlow } from "@/features/auth/auth-flow";
import { bankDestinationForSession, readBankSession } from "@/lib/auth-session";

export default async function BankTermsPage() {
  const sessionState = await readBankSession();

  if (sessionState.status !== "authenticated") {
    redirect("/login");
  }

  if (!sessionState.session.requiresTermsAcceptance) {
    redirect(bankDestinationForSession(sessionState.session));
  }

  return <BankAuthFlow mode="terms" actorName={sessionState.session.actor.name} />;
}
