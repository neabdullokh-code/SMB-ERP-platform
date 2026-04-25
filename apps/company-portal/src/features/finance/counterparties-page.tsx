import { PageHeader, SectionCard, DataTable, StatusBadge } from "@sqb/ui";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function CounterpartiesPage() {
  let counterparties: Array<{
    id: string; name: string; type: string; taxId?: string;
    phone?: string; email?: string; invoiceCount: number; billCount: number;
  }> = [];

  try {
    const res = await fetch(`${API_BASE}/finance/counterparties`, { cache: "no-store" });
    if (res.ok) {
      const body = await res.json();
      counterparties = body.data ?? [];
    }
  } catch { /* empty */ }

  const customers = counterparties.filter((c) => c.type === "customer");
  const suppliers = counterparties.filter((c) => c.type === "supplier");
  const both = counterparties.filter((c) => c.type === "both");

  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <PageHeader
        eyebrow="Finance"
        title="Counterparties"
        description={`${counterparties.length} counterparties — ${customers.length} customers, ${suppliers.length} suppliers, ${both.length} both`}
      />

      <SectionCard title="All counterparties">
        <DataTable
          columns={["Name", "Type", "Tax ID", "Phone", "Email", "Invoices", "Bills"]}
          rows={counterparties.map((cp) => [
            cp.name,
            <StatusBadge tone={cp.type === "customer" ? "good" : cp.type === "supplier" ? "warn" : "neutral"}>{cp.type}</StatusBadge>,
            cp.taxId ?? "—",
            cp.phone ?? "—",
            cp.email ?? "—",
            String(cp.invoiceCount),
            String(cp.billCount)
          ])}
        />
      </SectionCard>
    </div>
  );
}
