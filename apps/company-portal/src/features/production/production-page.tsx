import { cookies } from "next/headers";
import type { BOM, ProductionOrder, ScrapRecord } from "@sqb/domain-types";
import { DataTable, KpiCard, PageHeader, SectionCard, StatusBadge } from "@sqb/ui";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface ProductionOverview {
  orders: ProductionOrder[];
  boms: BOM[];
  scrap: ScrapRecord[];
}

async function fetchProduction(): Promise<ProductionOverview | null> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("erp_auth_session")?.value;
    if (!sessionToken) return null;
    const res = await fetch(`${API_BASE}/production/overview`, {
      headers: { "x-session-token": sessionToken },
      cache: "no-store"
    });
    if (!res.ok) return null;
    const body = await res.json() as { data: ProductionOverview };
    return body.data ?? null;
  } catch {
    return null;
  }
}

function orderTone(status: ProductionOrder["status"]): "good" | "bad" | "warn" | "neutral" {
  if (status === "completed") return "good";
  if (status === "blocked") return "bad";
  if (status === "in_progress") return "warn";
  return "neutral";
}

export async function ProductionPage() {
  const data = await fetchProduction();

  const orders = data?.orders ?? [];
  const boms = data?.boms ?? [];
  const scrap = data?.scrap ?? [];

  const planned = orders.filter((o) => o.status === "planned").length;
  const inProgress = orders.filter((o) => o.status === "in_progress").length;
  const completed = orders.filter((o) => o.status === "completed").length;
  const blocked = orders.filter((o) => o.status === "blocked").length;

  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <PageHeader
        eyebrow="Production"
        title="Bills of materials and production accounting"
        description="Raw material consumption, finished goods output, and scrap recording without crossing tenant boundaries."
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem" }}>
        <KpiCard label="Planned" value={String(planned)} helper="Orders awaiting start" />
        <KpiCard label="In progress" value={String(inProgress)} helper="Active production runs" />
        <KpiCard label="Completed" value={String(completed)} helper="This period" />
        <KpiCard label="Blocked" value={String(blocked)} helper="Requires attention" />
      </div>

      <SectionCard title="Bills of materials" description="Each BOM is versioned to support controlled production changes.">
        {boms.length === 0 ? (
          <p style={{ color: "var(--muted)", fontSize: 13 }}>No BOMs configured.</p>
        ) : (
          <DataTable
            columns={["BOM code", "Output SKU", "Version", "Materials"]}
            rows={boms.map((bom) => [bom.code, bom.outputSku, bom.version, `${bom.materials.length} lines`])}
          />
        )}
      </SectionCard>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "1rem" }}>
        <SectionCard title="Production orders" description="Events fan out to inventory and audit subsystems.">
          {orders.length === 0 ? (
            <p style={{ color: "var(--muted)", fontSize: 13 }}>No production orders found.</p>
          ) : (
            <DataTable
              columns={["Order", "BOM", "Status", "Planned", "Produced", "Scheduled"]}
              rows={orders.map((order) => {
                const bom = boms.find((b) => b.id === order.bomId);
                return [
                  order.id.slice(0, 8),
                  bom?.code ?? order.bomId.slice(0, 8),
                  <StatusBadge tone={orderTone(order.status)}>{order.status.replace("_", " ")}</StatusBadge>,
                  order.plannedUnits,
                  order.producedUnits,
                  order.scheduledDate
                ];
              })}
            />
          )}
        </SectionCard>

        <SectionCard title="Scrap and defects" description="Defects remain visible for plant operations and credit-readiness analytics.">
          {scrap.length === 0 ? (
            <p style={{ color: "var(--muted)", fontSize: 13 }}>No scrap recorded.</p>
          ) : (
            <DataTable
              columns={["Order", "Reason", "Quantity"]}
              rows={scrap.map((record) => [
                record.productionOrderId.slice(0, 8),
                record.reason,
                record.quantity
              ])}
            />
          )}
        </SectionCard>
      </div>
    </div>
  );
}
