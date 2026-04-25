import { randomUUID } from "node:crypto";
import type { BOM, ProductionOrder, ScrapRecord } from "@sqb/domain-types";
import { withDb } from "../../lib/db.js";
import { fixtures } from "../../lib/fixtures.js";

// ── Row types ──────────────────────────────────────────────────────────────

type BOMRow = {
  id: string;
  tenant_id: string;
  code: string;
  output_sku: string;
  version: string;
  materials: Array<{ sku: string; quantity: number; unit: string }>;
};

type ProductionOrderRow = {
  id: string;
  tenant_id: string;
  bom_id: string;
  status: ProductionOrder["status"];
  planned_units: number;
  produced_units: number;
  scheduled_date: string;
};

type ScrapRecordRow = {
  id: string;
  tenant_id: string;
  production_order_id: string;
  reason: string;
  quantity: string;
  created_at: string;
};

// ── Mappers ────────────────────────────────────────────────────────────────

function mapBOM(row: BOMRow): BOM {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    code: row.code,
    outputSku: row.output_sku,
    version: row.version,
    materials: row.materials
  };
}

function mapProductionOrder(row: ProductionOrderRow): ProductionOrder {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    bomId: row.bom_id,
    status: row.status,
    plannedUnits: row.planned_units,
    producedUnits: row.produced_units,
    scheduledDate: row.scheduled_date
  };
}

function mapScrapRecord(row: ScrapRecordRow): ScrapRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    productionOrderId: row.production_order_id,
    reason: row.reason,
    quantity: Number(row.quantity),
    recordedAt: row.created_at
  };
}

// ── BOMs ───────────────────────────────────────────────────────────────────

export async function listBOMs(tenantId: string): Promise<BOM[]> {
  const result = await withDb(async (pool) => {
    const res = await pool.query<BOMRow>(
      `select id, tenant_id, code, output_sku, version, materials
       from production_boms
       where tenant_id = $1
         and deleted_at is null
       order by code asc, version asc`,
      [tenantId]
    );
    return res.rows.map(mapBOM);
  });

  if (result === null) {
    return fixtures.boms.filter((bom) => bom.tenantId === tenantId);
  }

  return result;
}

export async function getBOM(tenantId: string, bomId: string): Promise<BOM | null> {
  const result = await withDb(async (pool) => {
    const res = await pool.query<BOMRow>(
      `select id, tenant_id, code, output_sku, version, materials
       from production_boms
       where tenant_id = $1
         and id = $2
         and deleted_at is null`,
      [tenantId, bomId]
    );
    return res.rows[0] ? mapBOM(res.rows[0]) : null;
  });

  if (result === null) {
    return fixtures.boms.find((bom) => bom.tenantId === tenantId && bom.id === bomId) ?? null;
  }

  return result;
}

export async function createBOM(
  tenantId: string,
  actorId: string,
  data: { code: string; outputSku: string; version: string; materials: Array<{ sku: string; quantity: number; unit: string }> }
): Promise<BOM> {
  const result = await withDb(async (pool) => {
    const id = randomUUID();
    const res = await pool.query<BOMRow>(
      `insert into production_boms (
         id, tenant_id, code, output_sku, version, materials, created_by, updated_by
       ) values (
         $1, $2, $3, $4, $5, $6::jsonb, $7, $7
       )
       returning id, tenant_id, code, output_sku, version, materials`,
      [id, tenantId, data.code, data.outputSku, data.version, JSON.stringify(data.materials), actorId]
    );
    return mapBOM(res.rows[0]);
  });

  if (result === null) {
    const bom: BOM = {
      id: randomUUID(),
      tenantId,
      code: data.code,
      outputSku: data.outputSku,
      version: data.version,
      materials: data.materials
    };
    fixtures.boms.push(bom);
    return bom;
  }

  return result;
}

export async function updateBOM(
  tenantId: string,
  actorId: string,
  bomId: string,
  data: Partial<{ code: string; outputSku: string; version: string; materials: Array<{ sku: string; quantity: number; unit: string }> }>
): Promise<BOM | null> {
  const result = await withDb(async (pool) => {
    const res = await pool.query<BOMRow>(
      `update production_boms
       set
         code = coalesce($3, code),
         output_sku = coalesce($4, output_sku),
         version = coalesce($5, version),
         materials = coalesce($6::jsonb, materials),
         updated_by = $7,
         updated_at = now()
       where tenant_id = $1
         and id = $2
         and deleted_at is null
       returning id, tenant_id, code, output_sku, version, materials`,
      [
        tenantId,
        bomId,
        data.code ?? null,
        data.outputSku ?? null,
        data.version ?? null,
        data.materials ? JSON.stringify(data.materials) : null,
        actorId
      ]
    );
    return res.rows[0] ? mapBOM(res.rows[0]) : null;
  });

  if (result === null) {
    const idx = fixtures.boms.findIndex((b) => b.tenantId === tenantId && b.id === bomId);
    if (idx === -1) return null;
    const updated: BOM = {
      ...fixtures.boms[idx],
      ...(data.code !== undefined ? { code: data.code } : {}),
      ...(data.outputSku !== undefined ? { outputSku: data.outputSku } : {}),
      ...(data.version !== undefined ? { version: data.version } : {}),
      ...(data.materials !== undefined ? { materials: data.materials } : {})
    };
    fixtures.boms[idx] = updated;
    return updated;
  }

  return result;
}

export async function deleteBOM(tenantId: string, bomId: string): Promise<boolean> {
  const result = await withDb(async (pool) => {
    const res = await pool.query(
      `update production_boms
       set deleted_at = now()
       where tenant_id = $1
         and id = $2
         and deleted_at is null`,
      [tenantId, bomId]
    );
    return (res.rowCount ?? 0) > 0;
  });

  if (result === null) {
    const idx = fixtures.boms.findIndex((b) => b.tenantId === tenantId && b.id === bomId);
    if (idx === -1) return false;
    fixtures.boms.splice(idx, 1);
    return true;
  }

  return result;
}

// ── Production Orders ──────────────────────────────────────────────────────

export async function listProductionOrders(
  tenantId: string,
  filters?: { status?: ProductionOrder["status"] }
): Promise<ProductionOrder[]> {
  const result = await withDb(async (pool) => {
    const params: unknown[] = [tenantId];
    let whereExtra = "";
    if (filters?.status) {
      params.push(filters.status);
      whereExtra = ` and status = $${params.length}`;
    }

    const res = await pool.query<ProductionOrderRow>(
      `select id, tenant_id, bom_id, status, planned_units, produced_units, scheduled_date::text as scheduled_date
       from production_orders
       where tenant_id = $1
         and deleted_at is null${whereExtra}
       order by scheduled_date desc, created_at desc`,
      params
    );
    return res.rows.map(mapProductionOrder);
  });

  if (result === null) {
    let orders = fixtures.productionOrders.filter((o) => o.tenantId === tenantId);
    if (filters?.status) {
      orders = orders.filter((o) => o.status === filters.status);
    }
    return orders;
  }

  return result;
}

export async function getProductionOrder(tenantId: string, orderId: string): Promise<ProductionOrder | null> {
  const result = await withDb(async (pool) => {
    const res = await pool.query<ProductionOrderRow>(
      `select id, tenant_id, bom_id, status, planned_units, produced_units, scheduled_date::text as scheduled_date
       from production_orders
       where tenant_id = $1
         and id = $2
         and deleted_at is null`,
      [tenantId, orderId]
    );
    return res.rows[0] ? mapProductionOrder(res.rows[0]) : null;
  });

  if (result === null) {
    return fixtures.productionOrders.find((o) => o.tenantId === tenantId && o.id === orderId) ?? null;
  }

  return result;
}

export async function createProductionOrder(
  tenantId: string,
  actorId: string,
  data: { bomId: string; plannedUnits: number; scheduledDate: string }
): Promise<ProductionOrder> {
  const result = await withDb(async (pool) => {
    const id = randomUUID();
    const res = await pool.query<ProductionOrderRow>(
      `insert into production_orders (
         id, tenant_id, bom_id, status, planned_units, produced_units, scheduled_date, created_by, updated_by
       ) values (
         $1, $2, $3, 'planned', $4, 0, $5::date, $6, $6
       )
       returning id, tenant_id, bom_id, status, planned_units, produced_units, scheduled_date::text as scheduled_date`,
      [id, tenantId, data.bomId, data.plannedUnits, data.scheduledDate, actorId]
    );
    return mapProductionOrder(res.rows[0]);
  });

  if (result === null) {
    const order: ProductionOrder = {
      id: randomUUID(),
      tenantId,
      bomId: data.bomId,
      status: "planned",
      plannedUnits: data.plannedUnits,
      producedUnits: 0,
      scheduledDate: data.scheduledDate
    };
    fixtures.productionOrders.push(order);
    return order;
  }

  return result;
}

export async function updateProductionOrderStatus(
  tenantId: string,
  actorId: string,
  orderId: string,
  status: ProductionOrder["status"],
  producedUnits?: number
): Promise<ProductionOrder | null> {
  const result = await withDb(async (pool) => {
    const res = await pool.query<ProductionOrderRow>(
      `update production_orders
       set
         status = $3,
         produced_units = coalesce($4, produced_units),
         updated_by = $5,
         updated_at = now()
       where tenant_id = $1
         and id = $2
         and deleted_at is null
       returning id, tenant_id, bom_id, status, planned_units, produced_units, scheduled_date::text as scheduled_date`,
      [tenantId, orderId, status, producedUnits ?? null, actorId]
    );
    return res.rows[0] ? mapProductionOrder(res.rows[0]) : null;
  });

  if (result === null) {
    const idx = fixtures.productionOrders.findIndex((o) => o.tenantId === tenantId && o.id === orderId);
    if (idx === -1) return null;
    const updated: ProductionOrder = {
      ...fixtures.productionOrders[idx],
      status,
      ...(producedUnits !== undefined ? { producedUnits } : {})
    };
    fixtures.productionOrders[idx] = updated;
    return updated;
  }

  return result;
}

// ── Scrap Records ──────────────────────────────────────────────────────────

export async function listScrapRecords(tenantId: string, orderId?: string): Promise<ScrapRecord[]> {
  const result = await withDb(async (pool) => {
    const params: unknown[] = [tenantId];
    let whereExtra = "";
    if (orderId) {
      params.push(orderId);
      whereExtra = ` and production_order_id = $${params.length}`;
    }

    const res = await pool.query<ScrapRecordRow>(
      `select id, tenant_id, production_order_id, reason, quantity::text, created_at::text
       from scrap_records
       where tenant_id = $1${whereExtra}
       order by created_at desc`,
      params
    );
    return res.rows.map(mapScrapRecord);
  });

  if (result === null) {
    let records = fixtures.productionOrders
      .filter((o) => o.tenantId === tenantId)
      .flatMap((o) =>
        (fixtures as unknown as { scrapRecords?: ScrapRecord[] }).scrapRecords?.filter(
          (s) => s.productionOrderId === o.id
        ) ?? []
      );

    if (!records.length) {
      const allScrap: ScrapRecord[] = (fixtures as unknown as { scrapRecords?: ScrapRecord[] }).scrapRecords ?? [];
      records = allScrap.filter((s) => s.tenantId === tenantId);
    }

    if (orderId) {
      records = records.filter((s) => s.productionOrderId === orderId);
    }

    return records;
  }

  return result;
}

export async function createScrapRecord(
  tenantId: string,
  actorId: string,
  data: { productionOrderId: string; reason: string; quantity: number }
): Promise<ScrapRecord> {
  const result = await withDb(async (pool) => {
    const id = randomUUID();
    const res = await pool.query<ScrapRecordRow>(
      `insert into scrap_records (
         id, tenant_id, production_order_id, reason, quantity, created_by
       ) values (
         $1, $2, $3, $4, $5::numeric, $6
       )
       returning id, tenant_id, production_order_id, reason, quantity::text, created_at::text`,
      [id, tenantId, data.productionOrderId, data.reason, data.quantity, actorId]
    );
    return mapScrapRecord(res.rows[0]);
  });

  if (result === null) {
    const record: ScrapRecord = {
      id: randomUUID(),
      tenantId,
      productionOrderId: data.productionOrderId,
      reason: data.reason,
      quantity: data.quantity,
      recordedAt: new Date().toISOString()
    };
    return record;
  }

  return result;
}
