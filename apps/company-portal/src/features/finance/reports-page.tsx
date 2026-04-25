import { PageHeader, SectionCard, DataTable, KpiCard, StatusBadge } from "@sqb/ui";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

function formatMoney(value: string) {
  const parts = value.split(".");
  return parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "." + (parts[1] ?? "00") + " UZS";
}

export async function ReportsPage() {
  let trialBalance: {
    totalDebit: string; totalCredit: string; isBalanced: boolean;
    rows: Array<{ accountCode: string; accountName: string; category: string; totalDebit: string; totalCredit: string; balance: string }>;
  } | null = null;

  let profitAndLoss: {
    periodStart: string; periodEnd: string; totalRevenue: string; totalExpenses: string; netIncome: string;
    revenueAccounts: Array<{ accountCode: string; accountName: string; amount: string }>;
    expenseAccounts: Array<{ accountCode: string; accountName: string; amount: string }>;
  } | null = null;

  let balanceSheet: {
    asOfDate: string; totalAssets: string; totalLiabilities: string; totalEquity: string;
    assets: Array<{ accountCode: string; accountName: string; balance: string }>;
    liabilities: Array<{ accountCode: string; accountName: string; balance: string }>;
    equity: Array<{ accountCode: string; accountName: string; balance: string }>;
  } | null = null;

  try {
    const [tbRes, plRes, bsRes] = await Promise.all([
      fetch(`${API_BASE}/finance/reports/trial-balance`, { cache: "no-store" }),
      fetch(`${API_BASE}/finance/reports/profit-and-loss`, { cache: "no-store" }),
      fetch(`${API_BASE}/finance/reports/balance-sheet`, { cache: "no-store" })
    ]);

    if (tbRes.ok) { const body = await tbRes.json(); trialBalance = body.data; }
    if (plRes.ok) { const body = await plRes.json(); profitAndLoss = body.data; }
    if (bsRes.ok) { const body = await bsRes.json(); balanceSheet = body.data; }
  } catch { /* empty */ }

  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <PageHeader
        eyebrow="Finance"
        title="Financial reports"
        description="Trial balance, profit & loss, and balance sheet generated from the double-entry ledger."
      />

      {profitAndLoss && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
          <KpiCard label="Total revenue" value={formatMoney(profitAndLoss.totalRevenue)} helper={`${profitAndLoss.periodStart} — ${profitAndLoss.periodEnd}`} />
          <KpiCard label="Total expenses" value={formatMoney(profitAndLoss.totalExpenses)} helper="Operating costs" />
          <KpiCard label="Net income" value={formatMoney(profitAndLoss.netIncome)} helper={Number(profitAndLoss.netIncome) >= 0 ? "Profitable" : "Loss"} />
        </div>
      )}

      {trialBalance && (
        <SectionCard
          title="Trial balance"
          description={trialBalance.isBalanced ? "✓ Debits equal credits — ledger is balanced" : "⚠ Ledger is not balanced"}
        >
          <DataTable
            columns={["Code", "Account", "Category", "Debit", "Credit", "Balance"]}
            rows={trialBalance.rows.map((row) => [
              row.accountCode,
              row.accountName,
              <StatusBadge tone="neutral">{row.category}</StatusBadge>,
              formatMoney(row.totalDebit),
              formatMoney(row.totalCredit),
              <span style={{ fontWeight: 600 }}>{formatMoney(row.balance)}</span>
            ])}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "2rem", marginTop: "1rem", fontWeight: 700, fontSize: "0.95rem" }}>
            <span>Total DR: {formatMoney(trialBalance.totalDebit)}</span>
            <span>Total CR: {formatMoney(trialBalance.totalCredit)}</span>
          </div>
        </SectionCard>
      )}

      {profitAndLoss && (
        <SectionCard title="Profit & Loss" description={`${profitAndLoss.periodStart} — ${profitAndLoss.periodEnd}`}>
          {profitAndLoss.revenueAccounts.length > 0 && (
            <>
              <h3 style={{ margin: "0 0 0.5rem", fontSize: "0.95rem", color: "#19663c" }}>Revenue</h3>
              <DataTable
                columns={["Code", "Account", "Amount"]}
                rows={profitAndLoss.revenueAccounts.map((a) => [a.accountCode, a.accountName, formatMoney(a.amount)])}
              />
            </>
          )}
          {profitAndLoss.expenseAccounts.length > 0 && (
            <>
              <h3 style={{ margin: "1rem 0 0.5rem", fontSize: "0.95rem", color: "#8b2621" }}>Expenses</h3>
              <DataTable
                columns={["Code", "Account", "Amount"]}
                rows={profitAndLoss.expenseAccounts.map((a) => [a.accountCode, a.accountName, formatMoney(a.amount)])}
              />
            </>
          )}
          <div style={{ marginTop: "1rem", padding: "0.75rem 1rem", background: "#f4f7fb", borderRadius: "0.75rem", fontWeight: 700 }}>
            Net income: {formatMoney(profitAndLoss.netIncome)}
          </div>
        </SectionCard>
      )}

      {balanceSheet && (
        <SectionCard title="Balance sheet" description={`As of ${balanceSheet.asOfDate}`}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <h3 style={{ margin: "0 0 0.5rem", fontSize: "0.95rem" }}>Assets ({formatMoney(balanceSheet.totalAssets)})</h3>
              <DataTable
                columns={["Code", "Account", "Balance"]}
                rows={balanceSheet.assets.map((a) => [a.accountCode, a.accountName, formatMoney(a.balance)])}
              />
            </div>
            <div>
              <h3 style={{ margin: "0 0 0.5rem", fontSize: "0.95rem" }}>Liabilities ({formatMoney(balanceSheet.totalLiabilities)})</h3>
              <DataTable
                columns={["Code", "Account", "Balance"]}
                rows={balanceSheet.liabilities.map((a) => [a.accountCode, a.accountName, formatMoney(a.balance)])}
              />
              <h3 style={{ margin: "1rem 0 0.5rem", fontSize: "0.95rem" }}>Equity ({formatMoney(balanceSheet.totalEquity)})</h3>
              <DataTable
                columns={["Code", "Account", "Balance"]}
                rows={balanceSheet.equity.map((a) => [a.accountCode, a.accountName, formatMoney(a.balance)])}
              />
            </div>
          </div>
        </SectionCard>
      )}
    </div>
  );
}
