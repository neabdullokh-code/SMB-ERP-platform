import { PageHeader, SectionCard, DataTable, KpiCard } from "@sqb/ui";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

function formatMoney(value: string) {
  const parts = value.split(".");
  return parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "." + (parts[1] ?? "00") + " UZS";
}

export async function CashFlowPage() {
  let buckets: Array<{
    periodStart: string; periodLabel: string;
    inflow: string; outflow: string; net: string;
  }> = [];

  try {
    const res = await fetch(`${API_BASE}/finance/cash-flow`, { cache: "no-store" });
    if (res.ok) {
      const body = await res.json();
      buckets = body.data ?? [];
    }
  } catch { /* empty */ }

  const totalInflow = buckets.reduce((sum, b) => sum + Number(b.inflow), 0);
  const totalOutflow = buckets.reduce((sum, b) => sum + Number(b.outflow), 0);
  const totalNet = totalInflow - totalOutflow;

  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <PageHeader
        eyebrow="Finance"
        title="Cash flow"
        description="Monthly cash movement through the cash account (1001). Inflows are debits, outflows are credits."
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
        <KpiCard label="Total inflow" value={formatMoney(totalInflow.toFixed(2))} helper={`Across ${buckets.length} months`} />
        <KpiCard label="Total outflow" value={formatMoney(totalOutflow.toFixed(2))} helper="Payments and expenses" />
        <KpiCard label="Net cash flow" value={formatMoney(totalNet.toFixed(2))} helper={totalNet >= 0 ? "Positive trend" : "Negative trend"} />
      </div>

      <SectionCard title="Monthly breakdown">
        <DataTable
          columns={["Period", "Inflow", "Outflow", "Net"]}
          rows={buckets.map((bucket) => [
            bucket.periodLabel,
            <span style={{ color: "#19663c" }}>{formatMoney(bucket.inflow)}</span>,
            <span style={{ color: "#8b2621" }}>{formatMoney(bucket.outflow)}</span>,
            <span style={{ fontWeight: 700, color: Number(bucket.net) >= 0 ? "#19663c" : "#8b2621" }}>
              {formatMoney(bucket.net)}
            </span>
          ])}
        />
      </SectionCard>
    </div>
  );
}
