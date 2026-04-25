import { AppShell } from "@sqb/ui";
import type { ReactNode } from "react";
import { companyNavItems } from "@/lib/navigation";

export default function CompanyAppLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell title="Company ERP Workspace" subtitle="Tenant-scoped operations portal" navItems={companyNavItems}>
      {children}
    </AppShell>
  );
}
