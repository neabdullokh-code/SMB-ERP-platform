import { PageHeader, SectionCard, DataTable, StatusBadge } from "@sqb/ui";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

function formatMoney(value: string) {
  const parts = value.split(".");
  return parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "." + (parts[1] ?? "00") + " UZS";
}

export async function LedgerPage() {
  let entries: Array<{
    id: string; accountCode: string; accountName: string;
    entrySide: string; amount: string; memo?: string;
    sourceType: string; postedAt: string; runningBalance: string;
  }> = [];
  let page = 1;
  let total = 0;

  try {
    const res = await fetch(`${API_BASE}/finance/ledger?page=1`, { cache: "no-store" });
    if (res.ok) {
      const body = await res.json();
      entries = body.data ?? [];
      page = body.meta?.page ?? 1;
      total = body.meta?.total ?? 0;
    }
  } catch { /* empty */ }

  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <PageHeader
        eyebrow="Finance"
        title="General ledger"
        description={`${total} journal entries across all accounts. Showing page ${page}.`}
      />

      <SectionCard title="Journal entries">
        <DataTable
          columns={["Date", "Account", "Type", "Side", "Amount", "Running balance", "Memo"]}
          rows={entries.map((entry) => [
            entry.postedAt.slice(0, 10),
            `${entry.accountCode} — ${entry.accountName}`,
            <StatusBadge tone="neutral">{entry.sourceType.replace(/_/g, " ")}</StatusBadge>,
            <StatusBadge tone={entry.entrySide === "debit" ? "neutral" : "warn"}>{entry.entrySide}</StatusBadge>,
            formatMoney(entry.amount),
            <span style={{ fontWeight: 600 }}>{formatMoney(entry.runningBalance)}</span>,
            entry.memo ?? "—"
          ])}
        />
        {total > entries.length && (
          <p style={{ color: "#5f7083", fontSize: "0.85rem", marginTop: "1rem" }}>
            Showing {entries.length} of {total} entries. Use query parameters to filter by date range or account.
          </p>
        )}
      </SectionCard>
    </div>
  );
}
