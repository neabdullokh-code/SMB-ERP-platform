import { KpiCard, PageHeader, SectionCard, DataTable, StatusBadge } from "@sqb/ui";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function fetchFinance<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
    if (!res.ok) return null;
    const body = await res.json();
    return body.data ?? body;
  } catch {
    return null;
  }
}

function formatMoney(value: string) {
  const parts = value.split(".");
  return parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "." + (parts[1] ?? "00") + " UZS";
}

export async function FinanceDashboardPage() {
  const [accounts, invoices, bills, cashFlow] = await Promise.all([
    fetchFinance<Array<{ id: string; code: string; name: string; category: string; balance: string }>>("/finance/accounts"),
    fetchFinance<Array<{ id: string; number: string; counterpartyName: string; status: string; total: string; outstandingTotal: string; dueDate: string }>>("/finance/invoices"),
    fetchFinance<Array<{ id: string; number: string; counterpartyName: string; status: string; total: string; outstandingTotal: string; dueDate: string }>>("/finance/bills"),
    fetchFinance<Array<{ periodLabel: string; inflow: string; outflow: string; net: string }>>("/finance/cash-flow")
  ]);

  const cashAccount = accounts?.find((a) => a.code === "1001");
  const arAccount = accounts?.find((a) => a.code === "1100");
  const apAccount = accounts?.find((a) => a.code === "2001");
  const openInvoices = invoices?.filter((i) => i.status !== "draft" && i.status !== "voided" && i.status !== "paid") ?? [];
  const openBills = bills?.filter((b) => b.status !== "draft" && b.status !== "voided" && b.status !== "paid") ?? [];

  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <PageHeader
        eyebrow="Finance"
        title="Financial overview"
        description="Real-time summary of accounts, receivables, payables, and cash flow."
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
        <KpiCard label="Cash balance" value={cashAccount ? formatMoney(cashAccount.balance) : "—"} helper="Account 1001" />
        <KpiCard label="Accounts receivable" value={arAccount ? formatMoney(arAccount.balance) : "—"} helper={`${openInvoices.length} open invoices`} />
        <KpiCard label="Accounts payable" value={apAccount ? formatMoney(apAccount.balance) : "—"} helper={`${openBills.length} open bills`} />
        <KpiCard label="Invoices total" value={String(invoices?.length ?? 0)} helper="All statuses" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <SectionCard title="Recent invoices" description="Latest 5 invoices">
          <DataTable
            columns={["Number", "Customer", "Total", "Status"]}
            rows={(invoices?.slice(0, 5) ?? []).map((inv) => [
              inv.number,
              inv.counterpartyName,
              formatMoney(inv.total),
              <StatusBadge tone={inv.status === "paid" ? "good" : inv.status === "overdue" ? "bad" : "neutral"}>{inv.status}</StatusBadge>
            ])}
          />
        </SectionCard>

        <SectionCard title="Recent bills" description="Latest 5 bills">
          <DataTable
            columns={["Number", "Supplier", "Total", "Status"]}
            rows={(bills?.slice(0, 5) ?? []).map((bill) => [
              bill.number,
              bill.counterpartyName,
              formatMoney(bill.total),
              <StatusBadge tone={bill.status === "paid" ? "good" : bill.status === "overdue" ? "bad" : "neutral"}>{bill.status}</StatusBadge>
            ])}
          />
        </SectionCard>
      </div>

      {cashFlow && cashFlow.length > 0 && (
        <SectionCard title="Cash flow" description="Monthly cash movement through the cash account">
          <DataTable
            columns={["Period", "Inflow", "Outflow", "Net"]}
            rows={cashFlow.map((bucket) => [
              bucket.periodLabel,
              formatMoney(bucket.inflow),
              formatMoney(bucket.outflow),
              <span style={{ color: Number(bucket.net) >= 0 ? "#19663c" : "#8b2621", fontWeight: 600 }}>{formatMoney(bucket.net)}</span>
            ])}
          />
        </SectionCard>
      )}
    </div>
  );
}
