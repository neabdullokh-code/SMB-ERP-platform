import type { PoolClient } from "pg";

type ProductionBOMSeed = {
  id: string;
  code: string;
  outputSku: string;
  version: string;
  materials: Array<{ sku: string; quantity: number; unit: string }>;
};

type ProductionOrderSeed = {
  id: string;
  bomId: string;
  status: "planned" | "in_progress" | "completed" | "blocked";
  plannedUnits: number;
  producedUnits: number;
  scheduledDate: string;
};

const LEGACY_PRODUCTION_BOMS: ProductionBOMSeed[] = [
  {
    id: "00000000-0000-0000-0000-000000001101",
    code: "BOM-1101",
    outputSku: "SKU-COMP-001",
    version: "v1",
    materials: [
      { sku: "RM-BASE-001", quantity: 1, unit: "set" }
    ]
  }
];

const LEGACY_PRODUCTION_ORDERS: ProductionOrderSeed[] = [
  {
    id: "00000000-0000-0000-0000-000000001201",
    bomId: "00000000-0000-0000-0000-000000001101",
    status: "planned",
    plannedUnits: 50,
    producedUnits: 0,
    scheduledDate: "2026-04-24"
  },
  {
    id: "00000000-0000-0000-0000-000000001202",
    bomId: "00000000-0000-0000-0000-000000001101",
    status: "in_progress",
    plannedUnits: 100,
    producedUnits: 20,
    scheduledDate: "2026-04-24"
  }
];

export async function seedDefaultProductionDataForTenant(client: PoolClient, tenantId: string, actorUserId?: string) {
  for (const bom of LEGACY_PRODUCTION_BOMS) {
    await client.query(
      `insert into production_boms (
         id, tenant_id, code, output_sku, version, materials, created_by, updated_by
       ) values (
         $1, $2, $3, $4, $5, $6::jsonb, $7, $7
       )
       on conflict (id) do update
       set tenant_id = excluded.tenant_id,
           code = excluded.code,
           output_sku = excluded.output_sku,
           version = excluded.version,
           materials = excluded.materials,
           updated_by = excluded.updated_by`,
      [bom.id, tenantId, bom.code, bom.outputSku, bom.version, JSON.stringify(bom.materials), actorUserId ?? null]
    );
  }

  for (const order of LEGACY_PRODUCTION_ORDERS) {
    await client.query(
      `insert into production_orders (
         id, tenant_id, bom_id, status, planned_units, produced_units, scheduled_date, created_by, updated_by
       ) values (
         $1, $2, $3, $4, $5, $6, $7::date, $8, $8
       )
       on conflict (id) do update
       set tenant_id = excluded.tenant_id,
           bom_id = excluded.bom_id,
           status = excluded.status,
           planned_units = excluded.planned_units,
           produced_units = excluded.produced_units,
           scheduled_date = excluded.scheduled_date,
           updated_by = excluded.updated_by`,
      [order.id, tenantId, order.bomId, order.status, order.plannedUnits, order.producedUnits, order.scheduledDate, actorUserId ?? null]
    );
  }
}
