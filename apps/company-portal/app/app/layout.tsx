import { AppShell } from "@sqb/ui";
import type { ReactNode } from "react";
import { companyNavGroups } from "@/lib/navigation";

export default function CompanyAppLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell title="Company ERP Workspace" subtitle="Tenant-scoped operations portal" navGroups={companyNavGroups}>
      {children}
    </AppShell>
  );
}
