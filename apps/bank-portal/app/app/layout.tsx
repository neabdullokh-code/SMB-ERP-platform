import { AppShell } from "@sqb/ui";
import type { ReactNode } from "react";
import { bankNavItems } from "@/lib/navigation";

export default function BankAppLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell title="Bank Monitoring Console" subtitle="Cross-tenant oversight portal" navItems={bankNavItems}>
      {children}
    </AppShell>
  );
}
