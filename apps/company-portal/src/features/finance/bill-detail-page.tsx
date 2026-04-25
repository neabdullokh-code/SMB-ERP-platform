import { PageHeader, SectionCard, DataTable, KpiCard, Button } from "@sqb/ui";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

function formatMoney(value: string) {
  const parts = value.split(".");
  return parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "." + (parts[1] ?? "00") + " UZS";
}

export async function BillDetailPage({ billId }: { billId: string }) {
  let bill: {
    id: string; number: string; counterpartyName: string; status: string;
    total: string; subtotal: string; taxTotal: string; outstandingTotal: string;
    paidTotal: string; dueDate: string; issueDate?: string; notes?: string;
    lines: Array<{ description: string; quantity: string; unitPrice: string; taxRate: string; lineTotal: string }>;
  } | null = null;

  try {
    const res = await fetch(`${API_BASE}/finance/bills`, { cache: "no-store" });
    if (res.ok) {
      const body = await res.json();
      const all = body.data ?? [];
      bill = all.find((b: { id: string }) => b.id === billId) ?? null;
    }
  } catch { /* empty */ }

  if (!bill) {
    return (
      <div style={{ display: "grid", gap: "1.5rem" }}>
        <PageHeader eyebrow="Finance" title="Bill not found" description="The requested bill could not be loaded." />
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <PageHeader
        eyebrow="Bill"
        title={`${bill.number}`}
        description={`${bill.counterpartyName} — due ${bill.dueDate}`}
        actions={
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Button variant="secondary" href={`${API_BASE}/finance/bills/${bill.id}/pdf`}>Download PDF</Button>
            <Button variant="secondary" href="/app/finance/bills">Back to list</Button>
          </div>
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
        <KpiCard label="Status" value={bill.status} helper={bill.issueDate ? `Posted ${bill.issueDate}` : "Not yet posted"} />
        <KpiCard label="Total" value={formatMoney(bill.total)} helper={`Subtotal: ${formatMoney(bill.subtotal)}`} />
        <KpiCard label="Paid" value={formatMoney(bill.paidTotal)} helper={`Outstanding: ${formatMoney(bill.outstandingTotal)}`} />
        <KpiCard label="Tax" value={formatMoney(bill.taxTotal)} helper="VAT included" />
      </div>

      <SectionCard title="Line items">
        <DataTable
          columns={["Description", "Qty", "Unit price", "Tax %", "Total"]}
          rows={bill.lines.map((line) => [
            line.description,
            line.quantity,
            formatMoney(line.unitPrice),
            `${line.taxRate}%`,
            <span style={{ fontWeight: 600 }}>{formatMoney(line.lineTotal)}</span>
          ])}
        />
      </SectionCard>

      {bill.notes && (
        <SectionCard title="Notes">
          <p style={{ margin: 0, color: "#5f7083" }}>{bill.notes}</p>
        </SectionCard>
      )}
    </div>
  );
}
