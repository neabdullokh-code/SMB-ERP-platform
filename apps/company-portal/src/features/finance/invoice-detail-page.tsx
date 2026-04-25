import { PageHeader, SectionCard, DataTable, StatusBadge, Button, KpiCard } from "@sqb/ui";

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

export async function InvoiceDetailPage({ invoiceId }: { invoiceId: string }) {
  let invoice: {
    id: string; number: string; counterpartyName: string; status: string;
    total: string; subtotal: string; taxTotal: string; outstandingTotal: string;
    collectedTotal: string; dueDate: string; issueDate?: string; notes?: string;
    lines: Array<{ description: string; quantity: string; unitPrice: string; taxRate: string; lineTotal: string }>;
  } | null = null;

  try {
    const res = await fetch(`${API_BASE}/finance/invoices`, { cache: "no-store" });
    if (res.ok) {
      const body = await res.json();
      const all = body.data ?? [];
      invoice = all.find((i: { id: string }) => i.id === invoiceId) ?? null;
    }
  } catch { /* empty */ }

  if (!invoice) {
    return (
      <div style={{ display: "grid", gap: "1.5rem" }}>
        <PageHeader eyebrow="Finance" title="Invoice not found" description="The requested invoice could not be loaded." />
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <PageHeader
        eyebrow="Invoice"
        title={`${invoice.number}`}
        description={`${invoice.counterpartyName} — due ${invoice.dueDate}`}
        actions={
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Button variant="secondary" href={`${API_BASE}/finance/invoices/${invoice.id}/pdf`}>Download PDF</Button>
            <Button variant="secondary" href="/app/finance/invoices">Back to list</Button>
          </div>
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
        <KpiCard label="Status" value={invoice.status} helper={invoice.issueDate ? `Issued ${invoice.issueDate}` : "Not yet issued"} />
        <KpiCard label="Total" value={formatMoney(invoice.total)} helper={`Subtotal: ${formatMoney(invoice.subtotal)}`} />
        <KpiCard label="Collected" value={formatMoney(invoice.collectedTotal)} helper={`Outstanding: ${formatMoney(invoice.outstandingTotal)}`} />
        <KpiCard label="Tax" value={formatMoney(invoice.taxTotal)} helper="VAT included" />
      </div>

      <SectionCard title="Line items">
        <DataTable
          columns={["Description", "Qty", "Unit price", "Tax %", "Total"]}
          rows={invoice.lines.map((line) => [
            line.description,
            line.quantity,
            formatMoney(line.unitPrice),
            `${line.taxRate}%`,
            <span style={{ fontWeight: 600 }}>{formatMoney(line.lineTotal)}</span>
          ])}
        />
      </SectionCard>

      {invoice.notes && (
        <SectionCard title="Notes">
          <p style={{ margin: 0, color: "#5f7083" }}>{invoice.notes}</p>
        </SectionCard>
      )}
    </div>
  );
}
