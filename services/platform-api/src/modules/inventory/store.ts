import type { InventoryItem, InventoryMovement, Stocktake, Warehouse } from "@sqb/domain-types";
import { withDb } from "../../lib/db.js";
import { fixtures } from "../../lib/fixtures.js";

// ---------------------------------------------------------------------------
// Row types
// ---------------------------------------------------------------------------

type WarehouseRow = {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  location: string;
};

type InventoryItemRow = {
  id: string;
  tenant_id: string;
  warehouse_id: string;
  sku: string;
  name: string;
  category: string;
  reorder_point: number;
  unit_cost_uzs: string;
  on_hand: string;
};

type MovementRow = {
  id: string;
  tenant_id: string;
  item_id: string;
  movement_type: "inbound" | "outbound" | "transfer" | "adjustment";
  quantity: string;
  reference: string;
  created_at: string;
};

type StocktakeRow = {
  id: string;
  tenant_id: string;
  warehouse_id: string;
  started_at: string;
  completed_at: string | null;
  variance_count: number;
};

// ---------------------------------------------------------------------------
// Row mappers
// ---------------------------------------------------------------------------

function mapWarehouse(row: WarehouseRow): Warehouse {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    code: row.code,
    name: row.name,
    location: row.location
  };
}

function mapInventoryItem(row: InventoryItemRow): InventoryItem {
  const onHand = Number.parseFloat(row.on_hand ?? "0");
  const unitCost = Number.parseFloat(row.unit_cost_uzs ?? "0");
  return {
    id: row.id,
    tenantId: row.tenant_id,
    warehouseId: row.warehouse_id,
    sku: row.sku,
    name: row.name,
    category: row.category,
    reorderPoint: row.reorder_point,
    onHand,
    valuationUzs: onHand * unitCost
  };
}

function mapMovement(row: MovementRow): InventoryMovement {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    itemId: row.item_id,
    movementType: row.movement_type,
    quantity: Number.parseFloat(row.quantity),
    occurredAt: row.created_at,
    reference: row.reference
  };
}

function mapStocktake(row: StocktakeRow): Stocktake {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    warehouseId: row.warehouse_id,
    startedAt: row.started_at,
    completedAt: row.completed_at ?? undefined,
    varianceCount: row.variance_count
  };
}

// ---------------------------------------------------------------------------
// Warehouses
// ---------------------------------------------------------------------------

export async function listWarehouses(tenantId: string): Promise<Warehouse[]> {
  const result = await withDb(async (pool) => {
    const rows = await pool.query<WarehouseRow>(
      `select id, tenant_id, code, name, location
       from warehouses
       where tenant_id = $1 and deleted_at is null
       order by name asc`,
      [tenantId]
    );
    return rows.rows.map(mapWarehouse);
  });

  if (result === null) {
    return fixtures.warehouses.filter((w) => w.tenantId === tenantId);
  }

  return result;
}

export async function createWarehouse(
  tenantId: string,
  actorId: string,
  data: { code: string; name: string; location: string }
): Promise<Warehouse> {
  const result = await withDb(async (pool) => {
    const row = await pool.query<WarehouseRow>(
      `insert into warehouses (tenant_id, code, name, location, created_by, updated_by)
       values ($1, $2, $3, $4, $5, $5)
       returning id, tenant_id, code, name, location`,
      [tenantId, data.code, data.name, data.location, actorId]
    );
    return mapWarehouse(row.rows[0]!);
  });

  if (result === null) {
    // Fixture fallback: return a synthetic warehouse
    return {
      id: `wh_${Date.now()}`,
      tenantId,
      code: data.code,
      name: data.name,
      location: data.location
    };
  }

  return result;
}

// ---------------------------------------------------------------------------
// Inventory items
// ---------------------------------------------------------------------------

export type InventoryItemFilters = {
  q?: string;
  warehouseId?: string;
  category?: string;
};

export async function listInventoryItems(
  tenantId: string,
  filters: InventoryItemFilters = {}
): Promise<InventoryItem[]> {
  const result = await withDb(async (pool) => {
    const conditions: string[] = ["i.tenant_id = $1", "i.deleted_at is null"];
    const params: unknown[] = [tenantId];
    let idx = 2;

    if (filters.warehouseId) {
      conditions.push(`i.warehouse_id = $${idx++}`);
      params.push(filters.warehouseId);
    }

    if (filters.category) {
      conditions.push(`lower(i.category) = lower($${idx++})`);
      params.push(filters.category);
    }

    if (filters.q) {
      conditions.push(`(lower(i.name) like lower($${idx}) or lower(i.sku) like lower($${idx}))`);
      params.push(`%${filters.q}%`);
      idx++;
    }

    const where = conditions.join(" and ");

    const rows = await pool.query<InventoryItemRow>(
      `select
         i.id,
         i.tenant_id,
         i.warehouse_id,
         i.sku,
         i.name,
         i.category,
         i.reorder_point,
         i.unit_cost_uzs::text,
         coalesce(
           sum(
             case m.movement_type
               when 'inbound'    then  m.quantity
               when 'outbound'   then -m.quantity
               when 'transfer'   then  0
               when 'adjustment' then  m.quantity
               else 0
             end
           ) filter (where m.id is not null),
           0
         )::text as on_hand
       from inventory_items i
       left join stock_movements m on m.item_id = i.id and m.tenant_id = i.tenant_id
       where ${where}
       group by i.id
       order by i.name asc`,
      params
    );

    return rows.rows.map(mapInventoryItem);
  });

  if (result === null) {
    let items = fixtures.inventoryItems.filter((item) => item.tenantId === tenantId);
    if (filters.warehouseId) {
      items = items.filter((item) => item.warehouseId === filters.warehouseId);
    }
    if (filters.category) {
      items = items.filter((item) => item.category.toLowerCase() === filters.category!.toLowerCase());
    }
    if (filters.q) {
      const q = filters.q.toLowerCase();
      items = items.filter((item) => item.name.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q));
    }
    return items;
  }

  return result;
}

export async function getInventoryItem(tenantId: string, itemId: string): Promise<InventoryItem | null> {
  const result = await withDb(async (pool) => {
    const rows = await pool.query<InventoryItemRow>(
      `select
         i.id,
         i.tenant_id,
         i.warehouse_id,
         i.sku,
         i.name,
         i.category,
         i.reorder_point,
         i.unit_cost_uzs::text,
         coalesce(
           sum(
             case m.movement_type
               when 'inbound'    then  m.quantity
               when 'outbound'   then -m.quantity
               when 'transfer'   then  0
               when 'adjustment' then  m.quantity
               else 0
             end
           ) filter (where m.id is not null),
           0
         )::text as on_hand
       from inventory_items i
       left join stock_movements m on m.item_id = i.id and m.tenant_id = i.tenant_id
       where i.id = $1 and i.tenant_id = $2 and i.deleted_at is null
       group by i.id`,
      [itemId, tenantId]
    );

    const row = rows.rows[0];
    return row ? mapInventoryItem(row) : null;
  });

  if (result === null) {
    return fixtures.inventoryItems.find((item) => item.id === itemId && item.tenantId === tenantId) ?? null;
  }

  return result;
}

export type CreateInventoryItemData = {
  warehouseId: string;
  sku: string;
  name: string;
  category: string;
  reorderPoint?: number;
  unitCostUzs?: string;
};

export async function createInventoryItem(
  tenantId: string,
  actorId: string,
  data: CreateInventoryItemData
): Promise<InventoryItem> {
  const result = await withDb(async (pool) => {
    const row = await pool.query<InventoryItemRow>(
      `insert into inventory_items (tenant_id, warehouse_id, sku, name, category, reorder_point, unit_cost_uzs, created_by, updated_by)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $8)
       returning
         id,
         tenant_id,
         warehouse_id,
         sku,
         name,
         category,
         reorder_point,
         unit_cost_uzs::text,
         '0'::text as on_hand`,
      [
        tenantId,
        data.warehouseId,
        data.sku,
        data.name,
        data.category,
        data.reorderPoint ?? 0,
        data.unitCostUzs ?? "0",
        actorId
      ]
    );
    return mapInventoryItem(row.rows[0]!);
  });

  if (result === null) {
    return {
      id: `item_${Date.now()}`,
      tenantId,
      warehouseId: data.warehouseId,
      sku: data.sku,
      name: data.name,
      category: data.category,
      reorderPoint: data.reorderPoint ?? 0,
      onHand: 0,
      valuationUzs: 0
    };
  }

  return result;
}

export type UpdateInventoryItemData = {
  warehouseId?: string;
  sku?: string;
  name?: string;
  category?: string;
  reorderPoint?: number;
  unitCostUzs?: string;
};

export async function updateInventoryItem(
  tenantId: string,
  actorId: string,
  itemId: string,
  data: UpdateInventoryItemData
): Promise<InventoryItem | null> {
  const result = await withDb(async (pool) => {
    const setClauses: string[] = ["updated_by = $3", "updated_at = now()"];
    const params: unknown[] = [itemId, tenantId, actorId];
    let idx = 4;

    if (data.warehouseId !== undefined) {
      setClauses.push(`warehouse_id = $${idx++}`);
      params.push(data.warehouseId);
    }
    if (data.sku !== undefined) {
      setClauses.push(`sku = $${idx++}`);
      params.push(data.sku);
    }
    if (data.name !== undefined) {
      setClauses.push(`name = $${idx++}`);
      params.push(data.name);
    }
    if (data.category !== undefined) {
      setClauses.push(`category = $${idx++}`);
      params.push(data.category);
    }
    if (data.reorderPoint !== undefined) {
      setClauses.push(`reorder_point = $${idx++}`);
      params.push(data.reorderPoint);
    }
    if (data.unitCostUzs !== undefined) {
      setClauses.push(`unit_cost_uzs = $${idx++}`);
      params.push(data.unitCostUzs);
    }

    const updated = await pool.query<{ id: string }>(
      `update inventory_items
       set ${setClauses.join(", ")}
       where id = $1 and tenant_id = $2 and deleted_at is null
       returning id`,
      params
    );

    if (!updated.rows[0]) return null;

    return getInventoryItem(tenantId, itemId);
  });

  if (result === null) {
    return fixtures.inventoryItems.find((item) => item.id === itemId && item.tenantId === tenantId) ?? null;
  }

  return result;
}

export async function deleteInventoryItem(tenantId: string, itemId: string): Promise<boolean> {
  const result = await withDb(async (pool) => {
    const rows = await pool.query<{ id: string }>(
      `update inventory_items
       set deleted_at = now()
       where id = $1 and tenant_id = $2 and deleted_at is null
       returning id`,
      [itemId, tenantId]
    );
    return rows.rows.length > 0;
  });

  if (result === null) {
    return fixtures.inventoryItems.some((item) => item.id === itemId && item.tenantId === tenantId);
  }

  return result;
}

// ---------------------------------------------------------------------------
// Stock movements
// ---------------------------------------------------------------------------

export type RecordMovementData = {
  itemId: string;
  movementType: "inbound" | "outbound" | "transfer" | "adjustment";
  quantity: string;
  reference: string;
};

export async function recordMovement(
  tenantId: string,
  actorId: string,
  data: RecordMovementData
): Promise<InventoryMovement> {
  const result = await withDb(async (pool) => {
    const row = await pool.query<MovementRow>(
      `insert into stock_movements (tenant_id, item_id, movement_type, quantity, reference, created_by)
       values ($1, $2, $3, $4, $5, $6)
       returning id, tenant_id, item_id, movement_type, quantity::text, reference, created_at::text`,
      [tenantId, data.itemId, data.movementType, data.quantity, data.reference, actorId]
    );
    return mapMovement(row.rows[0]!);
  });

  if (result === null) {
    return {
      id: `mov_${Date.now()}`,
      tenantId,
      itemId: data.itemId,
      movementType: data.movementType,
      quantity: Number.parseFloat(data.quantity),
      occurredAt: new Date().toISOString(),
      reference: data.reference
    };
  }

  return result;
}

export type MovementFilters = {
  itemId?: string;
  movementType?: "inbound" | "outbound" | "transfer" | "adjustment";
};

export async function listMovements(
  tenantId: string,
  filters: MovementFilters = {}
): Promise<InventoryMovement[]> {
  const result = await withDb(async (pool) => {
    const conditions: string[] = ["m.tenant_id = $1"];
    const params: unknown[] = [tenantId];
    let idx = 2;

    if (filters.itemId) {
      conditions.push(`m.item_id = $${idx++}`);
      params.push(filters.itemId);
    }

    if (filters.movementType) {
      conditions.push(`m.movement_type = $${idx++}`);
      params.push(filters.movementType);
    }

    const where = conditions.join(" and ");

    const rows = await pool.query<MovementRow>(
      `select id, tenant_id, item_id, movement_type, quantity::text, reference, created_at::text
       from stock_movements m
       where ${where}
       order by created_at desc`,
      params
    );

    return rows.rows.map(mapMovement);
  });

  if (result === null) {
    let movements = fixtures.inventoryMovements.filter((m) => m.tenantId === tenantId);
    if (filters.itemId) {
      movements = movements.filter((m) => m.itemId === filters.itemId);
    }
    if (filters.movementType) {
      movements = movements.filter((m) => m.movementType === filters.movementType);
    }
    return movements;
  }

  return result;
}

// ---------------------------------------------------------------------------
// Stocktakes
// ---------------------------------------------------------------------------

export async function listStocktakes(tenantId: string): Promise<Stocktake[]> {
  const result = await withDb(async (pool) => {
    const rows = await pool.query<StocktakeRow>(
      `select id, tenant_id, warehouse_id, started_at::text, completed_at::text, variance_count
       from stocktakes
       where tenant_id = $1
       order by started_at desc`,
      [tenantId]
    );
    return rows.rows.map(mapStocktake);
  });

  if (result === null) {
    return fixtures.stocktakes.filter((s) => s.tenantId === tenantId);
  }

  return result;
}

export async function createStocktake(
  tenantId: string,
  actorId: string,
  warehouseId: string
): Promise<Stocktake> {
  const result = await withDb(async (pool) => {
    const row = await pool.query<StocktakeRow>(
      `insert into stocktakes (tenant_id, warehouse_id, started_at, created_by)
       values ($1, $2, now(), $3)
       returning id, tenant_id, warehouse_id, started_at::text, completed_at::text, variance_count`,
      [tenantId, warehouseId, actorId]
    );
    return mapStocktake(row.rows[0]!);
  });

  if (result === null) {
    return {
      id: `count_${Date.now()}`,
      tenantId,
      warehouseId,
      startedAt: new Date().toISOString(),
      completedAt: undefined,
      varianceCount: 0
    };
  }

  return result;
}

export async function completeStocktake(
  tenantId: string,
  _actorId: string,
  stocktakeId: string,
  varianceCount: number
): Promise<Stocktake | null> {
  const result = await withDb(async (pool) => {
    const rows = await pool.query<StocktakeRow>(
      `update stocktakes
       set completed_at = now(), variance_count = $3
       where id = $1 and tenant_id = $2 and completed_at is null
       returning id, tenant_id, warehouse_id, started_at::text, completed_at::text, variance_count`,
      [stocktakeId, tenantId, varianceCount]
    );

    const row = rows.rows[0];
    return row ? mapStocktake(row) : null;
  });

  if (result === null) {
    const fixture = fixtures.stocktakes.find((s) => s.id === stocktakeId && s.tenantId === tenantId);
    if (!fixture) return null;
    return {
      ...fixture,
      completedAt: fixture.completedAt ?? new Date().toISOString(),
      varianceCount
    };
  }

  return result;
}
