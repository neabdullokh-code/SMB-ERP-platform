import { PageHeader, SectionCard, DataTable, StatusBadge } from "@sqb/ui";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

function formatMoney(value: string) {
  const parts = value.split(".");
  return parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "." + (parts[1] ?? "00") + " UZS";
}

export async function PaymentsPage() {
  let payments: Array<{
    id: string; direction: string; counterpartyName: string;
    paymentDate: string; amount: string; reference?: string;
    allocations: Array<{ invoiceId?: string; billId?: string; amount: string }>;
  }> = [];

  try {
    const res = await fetch(`${API_BASE}/finance/payments`, { cache: "no-store" });
    if (res.ok) {
      const body = await res.json();
      payments = body.data ?? [];
    }
  } catch { /* empty */ }

  const incoming = payments.filter((p) => p.direction === "incoming");
  const outgoing = payments.filter((p) => p.direction === "outgoing");
  const totalIncoming = incoming.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalOutgoing = outgoing.reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <PageHeader
        eyebrow="Finance"
        title="Payments"
        description={`${payments.length} payments — ${incoming.length} incoming (${formatMoney(totalIncoming.toFixed(2))}), ${outgoing.length} outgoing (${formatMoney(totalOutgoing.toFixed(2))})`}
      />

      <SectionCard title="All payments">
        <DataTable
          columns={["Date", "Direction", "Counterparty", "Amount", "Reference", "Allocated to"]}
          rows={payments.map((payment) => [
            payment.paymentDate,
            <StatusBadge tone={payment.direction === "incoming" ? "good" : "warn"}>{payment.direction}</StatusBadge>,
            payment.counterpartyName,
            <span style={{ fontWeight: 600 }}>{formatMoney(payment.amount)}</span>,
            payment.reference ?? "—",
            payment.allocations.map((a) => a.invoiceId ? "Invoice" : "Bill").join(", ") || "—"
          ])}
        />
      </SectionCard>
    </div>
  );
}
