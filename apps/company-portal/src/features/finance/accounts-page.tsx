import { PageHeader, SectionCard, DataTable, StatusBadge } from "@sqb/ui";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

function formatMoney(value: string) {
  const parts = value.split(".");
  return parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "." + (parts[1] ?? "00") + " UZS";
}

export async function AccountsPage() {
  let accounts: Array<{
    id: string; code: string; name: string; category: string;
    normalSide: string; balance: string; isSystem: boolean;
  }> = [];

  try {
    const res = await fetch(`${API_BASE}/finance/accounts`, { cache: "no-store" });
    if (res.ok) {
      const body = await res.json();
      accounts = body.data ?? [];
    }
  } catch { /* empty */ }

  const categories = ["asset", "liability", "equity", "revenue", "expense"];

  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <PageHeader
        eyebrow="Finance"
        title="Chart of accounts"
        description={`${accounts.length} accounts across ${categories.length} categories. System accounts are seeded automatically per tenant.`}
      />

      {categories.map((category) => {
        const categoryAccounts = accounts.filter((a) => a.category === category);
        if (categoryAccounts.length === 0) return null;
        return (
          <SectionCard key={category} title={category.charAt(0).toUpperCase() + category.slice(1)} description={`${categoryAccounts.length} accounts`}>
            <DataTable
              columns={["Code", "Name", "Normal side", "Balance", "System"]}
              rows={categoryAccounts.map((account) => [
                account.code,
                account.name,
                <StatusBadge tone={account.normalSide === "debit" ? "neutral" : "warn"}>{account.normalSide}</StatusBadge>,
                <span style={{ fontWeight: 600 }}>{formatMoney(account.balance)}</span>,
                account.isSystem ? <StatusBadge tone="good">System</StatusBadge> : <StatusBadge tone="neutral">Custom</StatusBadge>
              ])}
            />
          </SectionCard>
        );
      })}
    </div>
  );
}
