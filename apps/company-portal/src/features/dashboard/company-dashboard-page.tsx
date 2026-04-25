import { cookies } from "next/headers";
import type {
  ApprovalRequest,
  InventoryItem,
  ProductionOrder,
  Stocktake,
  Warehouse
} from "@sqb/domain-types";
import { DataTable, KpiCard, PageHeader, SectionCard, StatusBadge } from "@sqb/ui";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type Envelope<T> = {
  data: T;
  meta: Record<string, unknown> | null;
  error: { message: string; errorCode: string | null } | null;
};

async function readApi<T>(path: string, sessionToken: string): Promise<T | null> {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: {
        "x-session-token": sessionToken
      },
      cache: "no-store"
    });
    if (!response.ok) return null;

    const payload = (await response.json()) as Envelope<T>;
    return payload.data ?? null;
  } catch {
    return null;
  }
}

export async function CompanyDashboardPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("erp_auth_session")?.value;

  const [inventory, production, approvals] = sessionToken
    ? await Promise.all([
        readApi<{
          warehouses: Warehouse[];
          items: InventoryItem[];
          stocktakes: Stocktake[];
        }>("/inventory/summary", sessionToken),
        readApi<{
          orders: ProductionOrder[];
        }>("/production/overview", sessionToken),
        readApi<ApprovalRequest[]>("/workflows/pending", sessionToken)
      ])
    : [null, null, null];

  const items = inventory?.items ?? [];
  const warehouses = inventory?.warehouses ?? [];
  const productionOrders = production?.orders ?? [];
  const pendingApprovals = approvals ?? [];
  const totalInventoryValue = items.reduce((sum, item) => sum + item.valuationUzs, 0);
  const activeProduction = productionOrders.filter((order) => order.status === "in_progress").length;

  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <PageHeader
        eyebrow="Company dashboard"
        title="Operational control center"
        description="Tenant-scoped overview sourced from live inventory, production, and workflow modules."
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
        <KpiCard
          label="Inventory value"
          value={`${Math.round(totalInventoryValue / 1_000_000).toLocaleString("en-US")}M UZS`}
          helper={`${items.length} monitored SKU(s) across ${warehouses.length} warehouse(s)`}
        />
        <KpiCard
          label="Production status"
          value={`${activeProduction} active PO`}
          helper={`${productionOrders.length} total production order(s)`}
        />
        <KpiCard
          label="Pending approvals"
          value={String(pendingApprovals.length)}
          helper="Workflow queue requiring approver action"
        />
      </div>

      <SectionCard title="Low-stock watchlist" description="Example tenant-scoped inventory table.">
        <DataTable
          columns={["SKU", "Item", "On hand", "Reorder point", "Status"]}
          rows={items.map((item) => [
            item.sku,
            item.name,
            item.onHand,
            item.reorderPoint,
            item.onHand <= item.reorderPoint ? <StatusBadge tone="warn">Needs replenishment</StatusBadge> : <StatusBadge tone="good">Healthy</StatusBadge>
          ])}
        />
      </SectionCard>

      <SectionCard title="Production pulse" description="Production orders are isolated by tenant and designed to emit audit events.">
        <DataTable
          columns={["Order", "BOM", "Status", "Planned units", "Produced units"]}
          rows={productionOrders.map((order) => [
            order.id,
            order.bomId,
            <StatusBadge tone={order.status === "completed" ? "good" : "neutral"}>{order.status}</StatusBadge>,
            order.plannedUnits,
            order.producedUnits
          ])}
        />
      </SectionCard>
    </div>
  );
}

