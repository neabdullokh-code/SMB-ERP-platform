import {
  Button,
  DataTable,
  KpiCard,
  PageHeader,
  SectionCard
} from "@sqb/ui";
import { fetchBoms, fetchFromApi, fetchInventoryItems, fetchWarehouses } from "./api";
import { ProductionOrderForm } from "./production-order-form";
import { DocumentActions } from "./document-actions";
import { DocumentStatusBadge, type DocumentStatus } from "./status";
import { NoDataHint, NotFound, itemLabel } from "./goods-receipts";

interface ProductionOrderSummary {
  id: string;
  documentNumber: string;
  documentDate: string;
  bomId: string;
  warehouseId: string;
  plannedUnits: string;
  producedUnits: string;
  outputItemId: string;
  status: DocumentStatus;
  notes?: string;
  scheduledDate?: string;
}

function formatQty(q: string) {
  const n = Number(q);
  return Number.isFinite(n) ? n.toLocaleString("en-US", { maximumFractionDigits: 4 }) : q;
}

export async function ProductionOrdersListPage() {
  const data = await fetchFromApi<{ documents: ProductionOrderSummary[] }>("/documents/production-orders");
  const documents = data?.documents ?? [];
  const warehouses = await fetchWarehouses();
  const wlabel = (id: string) => warehouses.find((w) => w.id === id)?.code ?? id.slice(0, 8);

  const draft = documents.filter((d) => d.status === "DRAFT").length;
  const posted = documents.filter((d) => d.status === "POSTED").length;
  const voided = documents.filter((d) => d.status === "VOID").length;

  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <PageHeader
        eyebrow="Production"
        title="Production orders"
        description={`${documents.length} orders — ${draft} draft, ${posted} posted, ${voided} void`}
        actions={<Button href="/app/documents/production-orders/new">+ New production order</Button>}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
        <KpiCard label="Drafts" value={String(draft)} helper="Not yet posted" />
        <KpiCard label="Posted" value={String(posted)} helper="Raw consumed, finished produced" />
        <KpiCard label="Void" value={String(voided)} helper="Reversed — kept for audit" />
      </div>

      <SectionCard
        title="All production orders"
        description="Posting reads the BOM, verifies on-hand for every raw material, then writes OUT for inputs and IN for the finished good in one ACID transaction."
      >
        {documents.length === 0 ? (
          <p style={{ color: "#5f7083", fontSize: 13, margin: 0 }}>No production orders yet.</p>
        ) : (
          <DataTable
            columns={["Number", "Date", "Warehouse", "Planned", "Produced", "Status", ""]}
            rows={documents
              .slice()
              .sort((a, b) => (a.documentDate < b.documentDate ? 1 : -1))
              .map((d) => [
                d.documentNumber,
                d.documentDate,
                wlabel(d.warehouseId),
                formatQty(d.plannedUnits),
                formatQty(d.producedUnits),
                <DocumentStatusBadge status={d.status} />,
                <Button variant="secondary" href={`/app/documents/production-orders/${d.id}`}>View</Button>
              ])}
          />
        )}
      </SectionCard>
    </div>
  );
}

export async function NewProductionOrderPage() {
  const [warehouses, items, boms] = await Promise.all([
    fetchWarehouses(),
    fetchInventoryItems(),
    fetchBoms()
  ]);
  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <PageHeader
        eyebrow="New production order"
        title="Plan a production run"
        description="Pick a BOM and the number of units to produce. Posting consumes raw materials and produces the finished good in one ACID transaction."
      />
      <NoDataHint warehouses={warehouses} items={items} boms={boms} />
      <ProductionOrderForm
        warehouses={warehouses}
        items={items}
        boms={boms}
        backHref="/app/documents/production-orders"
      />
    </div>
  );
}

export async function ProductionOrderDetailPage({ documentId }: { documentId: string }) {
  const [data, warehouses, items, boms] = await Promise.all([
    fetchFromApi<{ document: ProductionOrderSummary }>(
      `/documents/production-orders/${documentId}`
    ),
    fetchWarehouses(),
    fetchInventoryItems(),
    fetchBoms()
  ]);
  const document = data?.document ?? null;
  if (!document) return <NotFound label="Production order" backHref="/app/documents/production-orders" />;
  const wh = warehouses.find((w) => w.id === document.warehouseId);
  const bom = boms.find((b) => b.id === document.bomId);

  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <PageHeader
        eyebrow="Production order"
        title={document.documentNumber}
        description={`${document.documentDate} — ${wh ? wh.code + " " + wh.name : document.warehouseId}`}
        actions={<DocumentStatusBadge status={document.status} />}
      />

      <DocumentActions
        kindPlural="production-orders"
        documentId={document.id}
        status={document.status}
        backHref="/app/documents/production-orders"
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
        <KpiCard label="Planned units" value={formatQty(document.plannedUnits)} helper="At document creation" />
        <KpiCard
          label="Produced units"
          value={formatQty(document.producedUnits)}
          helper={document.status === "POSTED" ? "Posted to ledger" : "Not yet posted"}
        />
        <KpiCard label="BOM" value={bom?.code ?? document.bomId.slice(0, 8)} helper={bom ? `v${bom.version}` : ""} />
        <KpiCard label="Output" value={itemLabel(items, document.outputItemId)} helper="Finished good SKU" />
      </div>

      {document.notes ? (
        <SectionCard title="Notes">
          <p style={{ margin: 0, color: "#5f7083" }}>{document.notes}</p>
        </SectionCard>
      ) : null}
    </div>
  );
}
