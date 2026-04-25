import {
  Button,
  DataTable,
  KpiCard,
  PageHeader,
  SectionCard
} from "@sqb/ui";
import { fetchFromApi, fetchInventoryItems, fetchWarehouses } from "./api";
import { DocumentForm } from "./document-form";
import { DocumentActions } from "./document-actions";
import { DocumentStatusBadge, type DocumentStatus } from "./status";
import { NoDataHint, NotFound, itemLabel } from "./goods-receipts";

interface GoodsIssueSummary {
  id: string;
  documentNumber: string;
  documentDate: string;
  warehouseId: string;
  counterpartyId?: string;
  status: DocumentStatus;
  notes?: string;
  lines: Array<{ itemId: string; quantity: string; notes?: string }>;
}

function formatQty(q: string) {
  const n = Number(q);
  return Number.isFinite(n) ? n.toLocaleString("en-US", { maximumFractionDigits: 4 }) : q;
}

export async function GoodsIssuesListPage() {
  const data = await fetchFromApi<{ documents: GoodsIssueSummary[] }>("/documents/goods-issues");
  const documents = data?.documents ?? [];
  const warehouses = await fetchWarehouses();
  const wlabel = (id: string) => warehouses.find((w) => w.id === id)?.code ?? id.slice(0, 8);

  const draft = documents.filter((d) => d.status === "DRAFT").length;
  const posted = documents.filter((d) => d.status === "POSTED").length;
  const voided = documents.filter((d) => d.status === "VOID").length;

  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <PageHeader
        eyebrow="Warehouse"
        title="Goods issues"
        description={`${documents.length} documents — ${draft} draft, ${posted} posted, ${voided} void`}
        actions={<Button href="/app/documents/goods-issues/new">+ New goods issue</Button>}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
        <KpiCard label="Drafts" value={String(draft)} helper="Not yet posted" />
        <KpiCard label="Posted" value={String(posted)} helper="Stock consumed from ledger" />
        <KpiCard label="Void" value={String(voided)} helper="Reversed — kept for audit" />
      </div>

      <SectionCard
        title="All goods issues"
        description="Outbound movements. Posting validates on-hand and fails with INSUFFICIENT_STOCK details if anything is short."
      >
        {documents.length === 0 ? (
          <p style={{ color: "#5f7083", fontSize: 13, margin: 0 }}>
            No goods issues yet. Click “+ New goods issue” to record an outbound movement.
          </p>
        ) : (
          <DataTable
            columns={["Number", "Date", "Warehouse", "Lines", "Status", ""]}
            rows={documents
              .slice()
              .sort((a, b) => (a.documentDate < b.documentDate ? 1 : -1))
              .map((d) => [
                d.documentNumber,
                d.documentDate,
                wlabel(d.warehouseId),
                d.lines.length,
                <DocumentStatusBadge status={d.status} />,
                <Button variant="secondary" href={`/app/documents/goods-issues/${d.id}`}>View</Button>
              ])}
          />
        )}
      </SectionCard>
    </div>
  );
}

export async function NewGoodsIssuePage() {
  const [warehouses, items] = await Promise.all([fetchWarehouses(), fetchInventoryItems()]);
  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <PageHeader
        eyebrow="New goods issue"
        title="Record an outbound movement"
        description="Items leaving a warehouse. Posting validates on-hand against the inventory ledger; any shortage fails with per-line details."
      />
      <NoDataHint warehouses={warehouses} items={items} />
      <DocumentForm
        kind="goods-issue"
        warehouses={warehouses}
        items={items}
        requireUnitCost={false}
        primaryWarehouseLabel="Source warehouse"
        backHref="/app/documents/goods-issues"
      />
    </div>
  );
}

export async function GoodsIssueDetailPage({ documentId }: { documentId: string }) {
  const [data, warehouses, items] = await Promise.all([
    fetchFromApi<{ document: GoodsIssueSummary }>(`/documents/goods-issues/${documentId}`),
    fetchWarehouses(),
    fetchInventoryItems()
  ]);
  const document = data?.document ?? null;
  if (!document) return <NotFound label="Goods issue" backHref="/app/documents/goods-issues" />;
  const wh = warehouses.find((w) => w.id === document.warehouseId);

  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <PageHeader
        eyebrow="Goods issue"
        title={document.documentNumber}
        description={`${document.documentDate} — ${wh ? wh.code + " " + wh.name : document.warehouseId}`}
        actions={<DocumentStatusBadge status={document.status} />}
      />

      <DocumentActions
        kindPlural="goods-issues"
        documentId={document.id}
        status={document.status}
        backHref="/app/documents/goods-issues"
      />

      <SectionCard title="Line items">
        <DataTable
          columns={["#", "Item", "Quantity", "Notes"]}
          rows={document.lines.map((l, idx) => [
            idx + 1,
            itemLabel(items, l.itemId),
            formatQty(l.quantity),
            l.notes ?? ""
          ])}
        />
      </SectionCard>

      {document.notes ? (
        <SectionCard title="Notes">
          <p style={{ margin: 0, color: "#5f7083" }}>{document.notes}</p>
        </SectionCard>
      ) : null}
    </div>
  );
}
