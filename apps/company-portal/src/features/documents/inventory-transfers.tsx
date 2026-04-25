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

interface TransferSummary {
  id: string;
  documentNumber: string;
  documentDate: string;
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  status: DocumentStatus;
  notes?: string;
  lines: Array<{ itemId: string; quantity: string; notes?: string }>;
}

function formatQty(q: string) {
  const n = Number(q);
  return Number.isFinite(n) ? n.toLocaleString("en-US", { maximumFractionDigits: 4 }) : q;
}

export async function InventoryTransfersListPage() {
  const data = await fetchFromApi<{ documents: TransferSummary[] }>("/documents/inventory-transfers");
  const documents = data?.documents ?? [];
  const warehouses = await fetchWarehouses();
  const wlabel = (id: string) => warehouses.find((w) => w.id === id)?.code ?? id.slice(0, 8);

  const draft = documents.filter((d) => d.status === "DRAFT").length;
  const posted = documents.filter((d) => d.status === "POSTED").length;

  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <PageHeader
        eyebrow="Warehouse"
        title="Inventory transfers"
        description={`${documents.length} documents — ${draft} draft, ${posted} posted`}
        actions={<Button href="/app/documents/inventory-transfers/new">+ New transfer</Button>}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
        <KpiCard label="Drafts" value={String(draft)} helper="Not yet posted" />
        <KpiCard label="Posted" value={String(posted)} helper="Stock moved between warehouses" />
      </div>

      <SectionCard
        title="All inventory transfers"
        description="Each posting writes OUT at the source and IN at the destination in a single ACID transaction."
      >
        {documents.length === 0 ? (
          <p style={{ color: "#5f7083", fontSize: 13, margin: 0 }}>
            No transfers yet. Click “+ New transfer” to move stock between warehouses.
          </p>
        ) : (
          <DataTable
            columns={["Number", "Date", "Source", "Destination", "Lines", "Status", ""]}
            rows={documents
              .slice()
              .sort((a, b) => (a.documentDate < b.documentDate ? 1 : -1))
              .map((d) => [
                d.documentNumber,
                d.documentDate,
                wlabel(d.sourceWarehouseId),
                wlabel(d.destinationWarehouseId),
                d.lines.length,
                <DocumentStatusBadge status={d.status} />,
                <Button variant="secondary" href={`/app/documents/inventory-transfers/${d.id}`}>View</Button>
              ])}
          />
        )}
      </SectionCard>
    </div>
  );
}

export async function NewInventoryTransferPage() {
  const [warehouses, items] = await Promise.all([fetchWarehouses(), fetchInventoryItems()]);
  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <PageHeader
        eyebrow="New transfer"
        title="Move stock between warehouses"
        description="Posting validates on-hand at the source warehouse and writes reversing OUT/IN rows atomically."
      />
      <NoDataHint warehouses={warehouses} items={items} />
      <DocumentForm
        kind="inventory-transfer"
        warehouses={warehouses}
        items={items}
        requireUnitCost={false}
        primaryWarehouseLabel="Source warehouse"
        secondaryWarehouseLabel="Destination warehouse"
        showSecondaryWarehouse
        backHref="/app/documents/inventory-transfers"
      />
    </div>
  );
}

export async function InventoryTransferDetailPage({ documentId }: { documentId: string }) {
  const [data, warehouses, items] = await Promise.all([
    fetchFromApi<{ document: TransferSummary }>(`/documents/inventory-transfers/${documentId}`),
    fetchWarehouses(),
    fetchInventoryItems()
  ]);
  const document = data?.document ?? null;
  if (!document) return <NotFound label="Inventory transfer" backHref="/app/documents/inventory-transfers" />;

  const src = warehouses.find((w) => w.id === document.sourceWarehouseId);
  const dst = warehouses.find((w) => w.id === document.destinationWarehouseId);

  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <PageHeader
        eyebrow="Inventory transfer"
        title={document.documentNumber}
        description={`${document.documentDate} — ${src ? src.code : document.sourceWarehouseId.slice(0, 8)} → ${dst ? dst.code : document.destinationWarehouseId.slice(0, 8)}`}
        actions={<DocumentStatusBadge status={document.status} />}
      />

      <DocumentActions
        kindPlural="inventory-transfers"
        documentId={document.id}
        status={document.status}
        backHref="/app/documents/inventory-transfers"
        allowVoid={false}
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
