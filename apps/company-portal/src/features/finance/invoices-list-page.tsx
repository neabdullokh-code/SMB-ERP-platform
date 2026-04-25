import { PageHeader, SectionCard, DataTable, StatusBadge, Button } from "@sqb/ui";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

function formatMoney(value: string) {
  const parts = value.split(".");
  return parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "." + (parts[1] ?? "00") + " UZS";
}

function statusTone(status: string) {
  if (status === "paid") return "good" as const;
  if (status === "overdue") return "bad" as const;
  if (status === "voided") return "bad" as const;
  if (status === "partially_paid") return "warn" as const;
  return "neutral" as const;
}

export async function InvoicesListPage() {
  let invoices: Array<{
    id: string; number: string; counterpartyName: string; status: string;
    total: string; outstandingTotal: string; dueDate: string; issueDate?: string; createdAt: string;
  }> = [];

  try {
    const res = await fetch(`${API_BASE}/finance/invoices`, { cache: "no-store" });
    if (res.ok) {
      const body = await res.json();
      invoices = body.data ?? [];
    }
  } catch { /* empty */ }

  const draftCount = invoices.filter((i) => i.status === "draft").length;
  const issuedCount = invoices.filter((i) => i.status === "issued" || i.status === "partially_paid").length;
  const overdueCount = invoices.filter((i) => i.status === "overdue").length;
  const paidCount = invoices.filter((i) => i.status === "paid").length;

  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <PageHeader
        eyebrow="Finance"
        title="Invoices"
        description={`${invoices.length} invoices — ${draftCount} draft, ${issuedCount} open, ${overdueCount} overdue, ${paidCount} paid`}
        actions={<Button href="/app/finance/invoices/new">New invoice</Button>}
      />

      <SectionCard title="All invoices">
        <DataTable
          columns={["Number", "Customer", "Due date", "Total", "Outstanding", "Status", "Actions"]}
          rows={invoices.map((inv) => [
            inv.number,
            inv.counterpartyName,
            inv.dueDate,
            formatMoney(inv.total),
            formatMoney(inv.outstandingTotal),
            <StatusBadge tone={statusTone(inv.status)}>{inv.status}</StatusBadge>,
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <Button variant="secondary" href={`/app/finance/invoices/${inv.id}`}>View</Button>
              {inv.status !== "voided" && inv.status !== "paid" && (
                <Button variant="secondary" href={`${API_BASE}/finance/invoices/${inv.id}/pdf`}>PDF</Button>
              )}
            </div>
          ])}
        />
      </SectionCard>
    </div>
  );
}
