import {
  Button,
  DataTable,
  KpiCard,
  PageHeader,
  SectionCard
} from "@sqb/ui";
import {
  fetchBoms,
  fetchFromApi,
  fetchInventoryItems,
  fetchWarehouses,
  type InventoryItemOption,
  type WarehouseOption
} from "./api";
import { DocumentForm } from "./document-form";
import { ProductionOrderForm } from "./production-order-form";
import { DocumentActions } from "./document-actions";
import { DocumentStatusBadge, type DocumentStatus } from "./status";

// -----------------------------------------------------------------------------
// Goods Receipts
// -----------------------------------------------------------------------------

export interface GoodsReceiptSummary {
  id: string;
  documentNumber: string;
  documentDate: string;
  warehouseId: string;
  counterpartyId?: string;
  status: DocumentStatus;
  postedAt?: string;
  voidedAt?: string;
  lines: Array<{ itemId: string; quantity: string; unitCostUzs: string; lineTotalUzs: string }>;
}

function formatQty(q: string) {
  const n = Number(q);
  return Number.isFinite(n) ? n.toLocaleString("en-US", { maximumFractionDigits: 4 }) : q;
}

function formatMoney(q: string) {
  const n = Number(q);
  if (!Number.isFinite(n)) return q;
  return Math.round(n).toLocaleString("en-US") + " UZS";
}

function sumTotal(lines: GoodsReceiptSummary["lines"]) {
  return lines.reduce((s, l) => s + Number(l.lineTotalUzs || 0), 0);
}

export async function GoodsReceiptsListPage() {
  const data = await fetchFromApi<{ documents: GoodsReceiptSummary[] }>("/documents/goods-receipts");
  const documents = data?.documents ?? [];
  const warehouses = await fetchWarehouses();
  const warehouseLabel = (id: string) =>
    warehouses.find((w) => w.id === id)?.code ?? id.slice(0, 8);

  const draft = documents.filter((d) => d.status === "DRAFT").length;
  const posted = documents.filter((d) => d.status === "POSTED").length;
  const voided = documents.filter((d) => d.status === "VOID").length;

  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <PageHeader
        eyebrow="Warehouse"
        title="Goods receipts"
        description={`${documents.length} documents — ${draft} draft, ${posted} posted, ${voided} void`}
        actions={<Button href="/app/documents/goods-receipts/new">+ New goods receipt</Button>}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
        <KpiCard label="Drafts" value={String(draft)} helper="Not yet posted" />
        <KpiCard label="Posted" value={String(posted)} helper="Affecting stock ledger" />
        <KpiCard label="Void" value={String(voided)} helper="Reversed — kept for audit" />
      </div>

      <SectionCard title="All goods receipts">
        {documents.length === 0 ? (
          <p style={{ color: "#5f7083", fontSize: 13, margin: 0 }}>
            No goods receipts yet. Click “+ New goods receipt” to record an inbound delivery.
          </p>
        ) : (
          <DataTable
            columns={["Number", "Date", "Warehouse", "Lines", "Total", "Status", ""]}
            rows={documents
              .slice()
              .sort((a, b) => (a.documentDate < b.documentDate ? 1 : -1))
              .map((d) => [
                d.documentNumber,
                d.documentDate,
                warehouseLabel(d.warehouseId),
                d.lines.length,
                formatMoney(String(sumTotal(d.lines))),
                <DocumentStatusBadge status={d.status} />,
                <Button variant="secondary" href={`/app/documents/goods-receipts/${d.id}`}>View</Button>
              ])}
          />
        )}
      </SectionCard>
    </div>
  );
}

export async function NewGoodsReceiptPage() {
  const [warehouses, items] = await Promise.all([fetchWarehouses(), fetchInventoryItems()]);
  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <PageHeader
        eyebrow="New goods receipt"
        title="Record an inbound delivery"
        description="Items arriving into a warehouse. Posting will append IN rows to the inventory ledger at the unit cost you enter."
      />
      <NoDataHint warehouses={warehouses} items={items} />
      <DocumentForm
        kind="goods-receipt"
        warehouses={warehouses}
        items={items}
        requireUnitCost
        primaryWarehouseLabel="Receiving warehouse"
        backHref="/app/documents/goods-receipts"
      />
    </div>
  );
}

export async function GoodsReceiptDetailPage({ documentId }: { documentId: string }) {
  const [data, warehouses, items] = await Promise.all([
    fetchFromApi<{ document: GoodsReceiptSummary & { notes?: string } }>(
      `/documents/goods-receipts/${documentId}`
    ),
    fetchWarehouses(),
    fetchInventoryItems()
  ]);
  const document = data?.document ?? null;
  if (!document) return <NotFound label="Goods receipt" backHref="/app/documents/goods-receipts" />;

  const wh = warehouses.find((w) => w.id === document.warehouseId);

  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <PageHeader
        eyebrow="Goods receipt"
        title={document.documentNumber}
        description={`${document.documentDate} — ${wh ? wh.code + " " + wh.name : document.warehouseId}`}
        actions={<DocumentStatusBadge status={document.status} />}
      />

      <DocumentActions
        kindPlural="goods-receipts"
        documentId={document.id}
        status={document.status}
        backHref="/app/documents/goods-receipts"
      />

      <SectionCard title="Line items">
        <DataTable
          columns={["#", "Item", "Quantity", "Unit cost", "Line total"]}
          rows={document.lines.map((l, idx) => [
            idx + 1,
            itemLabel(items, l.itemId),
            formatQty(l.quantity),
            formatMoney(l.unitCostUzs),
            formatMoney(l.lineTotalUzs)
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

// -----------------------------------------------------------------------------
// Shared helpers
// -----------------------------------------------------------------------------

export function itemLabel(items: InventoryItemOption[], id: string) {
  const match = items.find((i) => i.id === id);
  return match ? `${match.sku} — ${match.name}` : id.slice(0, 8);
}

export function NotFound({ label, backHref }: { label: string; backHref: string }) {
  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <PageHeader eyebrow={label} title="Not found" description="The document could not be loaded or does not exist." />
      <Button variant="secondary" href={backHref}>
        ← Back to list
      </Button>
    </div>
  );
}

export function NoDataHint({
  warehouses,
  items,
  boms
}: {
  warehouses: WarehouseOption[];
  items: InventoryItemOption[];
  boms?: unknown[];
}) {
  const missing: string[] = [];
  if (warehouses.length === 0) missing.push("a warehouse (Inventory → New warehouse)");
  if (items.length === 0) missing.push("at least one inventory item");
  if (boms !== undefined && boms.length === 0) missing.push("a BOM (Production → New BOM)");
  if (missing.length === 0) return null;
  return (
    <SectionCard title="Setup required">
      <p style={{ margin: 0, color: "#7f5c00" }}>
        You need {missing.join(" and ")} before you can post this document.
      </p>
    </SectionCard>
  );
}

export { DocumentForm, ProductionOrderForm, fetchBoms };
