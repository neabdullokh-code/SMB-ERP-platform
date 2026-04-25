import { cookies } from "next/headers";
import type { InventoryItem, InventoryMovement, Stocktake, Warehouse } from "@sqb/domain-types";
import { DataTable, KpiCard, PageHeader, SectionCard, StatusBadge } from "@sqb/ui";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface InventorySummary {
  warehouses: Warehouse[];
  items: InventoryItem[];
  movements: InventoryMovement[];
  stocktakes: Stocktake[];
}

async function fetchInventory(): Promise<InventorySummary | null> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("erp_auth_session")?.value;
    if (!sessionToken) return null;
    const res = await fetch(`${API_BASE}/inventory/summary`, {
      headers: { "x-session-token": sessionToken },
      cache: "no-store"
    });
    if (!res.ok) return null;
    const body = await res.json() as { data: InventorySummary };
    return body.data ?? null;
  } catch {
    return null;
  }
}

function formatQty(n: number) {
  return n.toLocaleString("en-US");
}

function movementTone(type: InventoryMovement["movementType"]): "good" | "bad" | "warn" | "neutral" {
  if (type === "inbound") return "good";
  if (type === "outbound") return "bad";
  if (type === "adjustment") return "warn";
  return "neutral";
}

export async function InventoryPage() {
  const data = await fetchInventory();

  const warehouses = data?.warehouses ?? [];
  const items = data?.items ?? [];
  const movements = data?.movements ?? [];
  const stocktakes = data?.stocktakes ?? [];

  const totalSkus = items.length;
  const lowStock = items.filter((i) => i.onHand <= i.reorderPoint && i.onHand > 0).length;
  const outOfStock = items.filter((i) => i.onHand <= 0).length;
  const totalValue = items.reduce((sum, i) => sum + i.valuationUzs, 0);

  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <PageHeader
        eyebrow="Inventory"
        title="Warehouse and stock controls"
        description="Inbound, outbound, transfers, and stocktakes grouped as one bounded context."
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
        <KpiCard label="Total SKUs" value={String(totalSkus)} helper={`${warehouses.length} warehouse(s)`} />
        <KpiCard label="Low stock" value={String(lowStock)} helper="At or below reorder point" />
        <KpiCard label="Out of stock" value={String(outOfStock)} helper="Zero on-hand" />
        <KpiCard
          label="Total valuation"
          value={`${Math.round(totalValue / 1_000_000).toLocaleString("en-US")} M UZS`}
          helper="At cost"
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: "1rem" }}>
        <SectionCard title="Warehouses" description="Logical stock locations within the tenant boundary.">
          {warehouses.length === 0 ? (
            <p style={{ color: "var(--muted)", fontSize: 13 }}>No warehouses configured.</p>
          ) : (
            <DataTable
              columns={["Code", "Name", "Location"]}
              rows={warehouses.map((w) => [w.code, w.name, w.location])}
            />
          )}
        </SectionCard>
        <SectionCard title="Latest stocktake" description="Counts, variances, and reconciliation events.">
          {stocktakes.length === 0 ? (
            <p style={{ color: "var(--muted)", fontSize: 13 }}>No stocktakes recorded.</p>
          ) : (
            <DataTable
              columns={["Warehouse", "Started", "Completed", "Variance"]}
              rows={stocktakes.map((s) => [
                warehouses.find((w) => w.id === s.warehouseId)?.code ?? s.warehouseId.slice(0, 8),
                s.startedAt.slice(0, 10),
                s.completedAt?.slice(0, 10) ?? "Open",
                s.varianceCount
              ])}
            />
          )}
        </SectionCard>
      </div>

      <SectionCard title="Inventory items" description="On-hand quantities computed from stock movement ledger.">
        {items.length === 0 ? (
          <p style={{ color: "var(--muted)", fontSize: 13 }}>No inventory items found.</p>
        ) : (
          <DataTable
            columns={["SKU", "Name", "Category", "On hand", "Reorder point", "Valuation (UZS)", "Status"]}
            rows={items.map((item) => {
              const tone = item.onHand <= 0 ? "bad" : item.onHand <= item.reorderPoint ? "warn" : "good";
              const label = item.onHand <= 0 ? "Out of stock" : item.onHand <= item.reorderPoint ? "Low stock" : "In stock";
              return [
                item.sku,
                item.name,
                item.category,
                formatQty(item.onHand),
                formatQty(item.reorderPoint),
                Math.round(item.valuationUzs).toLocaleString("en-US"),
                <StatusBadge tone={tone}>{label}</StatusBadge>
              ];
            })}
          />
        )}
      </SectionCard>

      <SectionCard title="Recent movements" description="Latest stock movement entries (inbound, outbound, transfer, adjustment).">
        {movements.length === 0 ? (
          <p style={{ color: "var(--muted)", fontSize: 13 }}>No movements recorded.</p>
        ) : (
          <DataTable
            columns={["Reference", "Type", "Item", "Quantity", "Date"]}
            rows={movements.map((m) => {
              const item = items.find((i) => i.id === m.itemId);
              return [
                m.reference,
                <StatusBadge tone={movementTone(m.movementType)}>{m.movementType}</StatusBadge>,
                item?.sku ?? m.itemId.slice(0, 8),
                m.quantity,
                m.occurredAt?.slice(0, 10) ?? "—"
              ];
            })}
          />
        )}
      </SectionCard>
    </div>
  );
}
