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

export async function BillsListPage() {
  let bills: Array<{
    id: string; number: string; counterpartyName: string; status: string;
    total: string; outstandingTotal: string; dueDate: string; issueDate?: string;
  }> = [];

  try {
    const res = await fetch(`${API_BASE}/finance/bills`, { cache: "no-store" });
    if (res.ok) {
      const body = await res.json();
      bills = body.data ?? [];
    }
  } catch { /* empty */ }

  const draftCount = bills.filter((b) => b.status === "draft").length;
  const postedCount = bills.filter((b) => b.status === "posted" || b.status === "partially_paid").length;
  const overdueCount = bills.filter((b) => b.status === "overdue").length;
  const paidCount = bills.filter((b) => b.status === "paid").length;

  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <PageHeader
        eyebrow="Finance"
        title="Bills"
        description={`${bills.length} bills — ${draftCount} draft, ${postedCount} open, ${overdueCount} overdue, ${paidCount} paid`}
        actions={<Button href="/app/finance/bills/new">New bill</Button>}
      />

      <SectionCard title="All bills">
        <DataTable
          columns={["Number", "Supplier", "Due date", "Total", "Outstanding", "Status", "Actions"]}
          rows={bills.map((bill) => [
            bill.number,
            bill.counterpartyName,
            bill.dueDate,
            formatMoney(bill.total),
            formatMoney(bill.outstandingTotal),
            <StatusBadge tone={statusTone(bill.status)}>{bill.status}</StatusBadge>,
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <Button variant="secondary" href={`/app/finance/bills/${bill.id}`}>View</Button>
              {bill.status !== "voided" && bill.status !== "paid" && (
                <Button variant="secondary" href={`${API_BASE}/finance/bills/${bill.id}/pdf`}>PDF</Button>
              )}
            </div>
          ])}
        />
      </SectionCard>
    </div>
  );
}
