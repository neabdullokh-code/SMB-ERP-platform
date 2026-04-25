import { redirect } from "next/navigation";
import { BankAuthFlow } from "@/features/auth/auth-flow";
import { bankDestinationForSession, readBankSession } from "@/lib/auth-session";

export default async function BankOnboardingPage() {
  const sessionState = await readBankSession();

  if (sessionState.status === "authenticated") {
    redirect(bankDestinationForSession(sessionState.session));
  }

  return <BankAuthFlow mode="onboarding" />;
}
