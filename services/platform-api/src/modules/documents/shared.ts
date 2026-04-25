import type { PoolClient } from "pg";
import type {
  DocumentStatus,
  InsufficientStockDetail,
  InventoryDocumentKind,
  InventoryMovementType
} from "@sqb/domain-types";
import Decimal from "decimal.js";
import { DocumentPostingError } from "../../lib/envelope.js";

// -----------------------------------------------------------------------------
// Sequence helpers
// -----------------------------------------------------------------------------

const DOCUMENT_PREFIXES: Record<string, string> = {
  goods_receipt: "GR",
  goods_issue: "GI",
  inventory_transfer: "IT",
  production_order: "PO"
};

/**
 * Allocate the next document number for a tenant+document-kind pair. We derive
 * the next sequence value from the current max in the header table rather than
 * maintain a separate `sequences` table — the header has a `unique(tenant_id,
 * document_number)` constraint so collisions are impossible but the caller
 * should do this INSIDE the posting transaction to avoid racing two drafts.
 */
export async function nextInventoryDocumentNumber(
  client: PoolClient,
  tenantId: string,
  kind: "goods_receipt" | "goods_issue" | "inventory_transfer" | "production_order"
): Promise<string> {
  const prefix = DOCUMENT_PREFIXES[kind];
  if (!prefix) {
    throw new Error(`Unknown document kind: ${kind}`);
  }

  const table =
    kind === "goods_receipt"
      ? "doc_goods_receipt_header"
      : kind === "goods_issue"
      ? "doc_goods_issue_header"
      : kind === "inventory_transfer"
      ? "doc_inventory_transfer_header"
      : "doc_production_order_header";

  const year = new Date().getUTCFullYear();
  const like = `${prefix}-${year}-%`;

  const res = await client.query<{ next_seq: number }>(
    `select coalesce(max(substring(document_number from '\\d+$')::int), 0) + 1 as next_seq
     from ${table}
     where tenant_id = $1 and document_number like $2`,
    [tenantId, like]
  );

  const seq = res.rows[0]?.next_seq ?? 1;
  return `${prefix}-${year}-${String(seq).padStart(6, "0")}`;
}

// -----------------------------------------------------------------------------
// Status transition guards
// -----------------------------------------------------------------------------

export function assertTransition(from: DocumentStatus, to: DocumentStatus): void {
  const legal: Record<DocumentStatus, DocumentStatus[]> = {
    DRAFT: ["POSTED", "VOID"],
    POSTED: ["VOID"],
    VOID: []
  };

  if (!legal[from].includes(to)) {
    throw new DocumentPostingError({
      message: `Cannot transition document from ${from} to ${to}.`,
      errorCode: "INVALID_DOCUMENT_TRANSITION",
      httpStatus: 409,
      details: { from, to }
    });
  }
}

// -----------------------------------------------------------------------------
// Ledger writers
// -----------------------------------------------------------------------------

export interface LedgerWriteInput {
  tenantId: string;
  documentKind: InventoryDocumentKind;
  documentId: string;
  warehouseId: string;
  itemId: string;
  movementType: InventoryMovementType;
  quantity: string;
  unitCostUzs: string;
  periodAt?: string;
  actorUserId?: string;
}

export async function writeLedgerRow(
  client: PoolClient,
  input: LedgerWriteInput
): Promise<void> {
  const qty = new Decimal(input.quantity);
  const unitCost = new Decimal(input.unitCostUzs);
  const cost = qty.times(unitCost).toFixed(2);

  await client.query(
    `insert into ledger_inventory (
       tenant_id,
       period_at,
       document_kind,
       document_id,
       warehouse_id,
       item_id,
       movement_type,
       quantity,
       unit_cost_uzs,
       cost_uzs,
       created_by
     ) values ($1, coalesce($2::timestamptz, now()), $3, $4, $5, $6, $7, $8::numeric, $9::numeric, $10::numeric, $11)`,
    [
      input.tenantId,
      input.periodAt ?? null,
      input.documentKind,
      input.documentId,
      input.warehouseId,
      input.itemId,
      input.movementType,
      qty.toFixed(4),
      unitCost.toFixed(2),
      cost,
      input.actorUserId ?? null
    ]
  );
}

// -----------------------------------------------------------------------------
// Stock availability check (with row locking)
// -----------------------------------------------------------------------------

export interface StockCheckLine {
  itemId: string;
  quantity: string;
}

/**
 * Lock every item row the issue touches (so a concurrent Goods Issue cannot
 * undercut us between the check and the ledger write), then compute on-hand
 * per (item, warehouse) from the ledger and compare to requested quantities.
 * On insufficient stock throw a DocumentPostingError with per-line details.
 */
export async function assertStockAvailable(
  client: PoolClient,
  params: {
    tenantId: string;
    warehouseId: string;
    lines: StockCheckLine[];
  }
): Promise<Map<string, Decimal>> {
  const { tenantId, warehouseId, lines } = params;

  if (lines.length === 0) {
    return new Map();
  }

  const itemIds = Array.from(new Set(lines.map((line) => line.itemId)));

  // Row-level lock against concurrent posting of the same items.
  // Postgres does not support row-locks on aggregate queries, so we lock the
  // corresponding inventory_items rows — posting paths always resolve item
  // availability against these rows and the lock forces strict serialization.
  await client.query(
    `select id from inventory_items
     where tenant_id = $1 and id = any($2::uuid[])
     for update`,
    [tenantId, itemIds]
  );

  const balanceRes = await client.query<{ item_id: string; on_hand: string }>(
    `select item_id,
            coalesce(sum(case when movement_type = 'IN' then quantity else -quantity end), 0)::text as on_hand
     from ledger_inventory
     where tenant_id = $1
       and warehouse_id = $2
       and item_id = any($3::uuid[])
     group by item_id`,
    [tenantId, warehouseId, itemIds]
  );

  const onHandByItem = new Map<string, Decimal>();
  for (const row of balanceRes.rows) {
    onHandByItem.set(row.item_id, new Decimal(row.on_hand));
  }
  for (const itemId of itemIds) {
    if (!onHandByItem.has(itemId)) {
      onHandByItem.set(itemId, new Decimal(0));
    }
  }

  // Aggregate requested quantity per item (a single document can list the
  // same item on multiple lines).
  const requestedByItem = new Map<string, Decimal>();
  for (const line of lines) {
    const prev = requestedByItem.get(line.itemId) ?? new Decimal(0);
    requestedByItem.set(line.itemId, prev.plus(new Decimal(line.quantity)));
  }

  const insufficient: InsufficientStockDetail[] = [];
  for (const [itemId, requested] of requestedByItem) {
    const available = onHandByItem.get(itemId) ?? new Decimal(0);
    if (requested.gt(available)) {
      insufficient.push({
        itemId,
        warehouseId,
        available: available.toFixed(4),
        requested: requested.toFixed(4)
      });
    }
  }

  if (insufficient.length > 0) {
    // Enrich with item name/sku so the UI can render a readable error.
    const enrichRes = await client.query<{ id: string; name: string; sku: string }>(
      `select id, name, sku from inventory_items where tenant_id = $1 and id = any($2::uuid[])`,
      [tenantId, insufficient.map((d) => d.itemId)]
    );
    const byId = new Map(enrichRes.rows.map((r) => [r.id, r] as const));
    const enriched = insufficient.map((detail) => {
      const row = byId.get(detail.itemId);
      return row
        ? { ...detail, itemName: row.name, itemSku: row.sku }
        : detail;
    });

    throw new DocumentPostingError({
      message: "Insufficient stock to post this document.",
      errorCode: "INSUFFICIENT_STOCK",
      httpStatus: 400,
      details: enriched
    });
  }

  return onHandByItem;
}

/**
 * Compute current weighted-average unit cost per (item, warehouse) from the
 * ledger. Used by posting flows that need to snapshot cost onto an OUT row
 * (e.g. goods issue produces COGS; production consumption needs cost for the
 * finished good IN row).
 */
export async function getWacUnitCosts(
  client: PoolClient,
  params: {
    tenantId: string;
    warehouseId: string;
    itemIds: string[];
  }
): Promise<Map<string, string>> {
  if (params.itemIds.length === 0) {
    return new Map();
  }

  const res = await client.query<{ item_id: string; wac: string }>(
    `select item_id,
            case
              when sum(case when movement_type = 'IN' then quantity else 0 end) > 0 then
                (sum(case when movement_type = 'IN' then quantity * unit_cost_uzs else 0 end)
                 / nullif(sum(case when movement_type = 'IN' then quantity else 0 end), 0))::text
              else '0'
            end as wac
     from ledger_inventory
     where tenant_id = $1 and warehouse_id = $2 and item_id = any($3::uuid[])
     group by item_id`,
    [params.tenantId, params.warehouseId, params.itemIds]
  );

  return new Map(res.rows.map((r) => [r.item_id, r.wac] as const));
}

// -----------------------------------------------------------------------------
// Header helpers (SELECT FOR UPDATE)
// -----------------------------------------------------------------------------

export async function lockDocumentHeader(
  client: PoolClient,
  params: { table: string; tenantId: string; id: string }
): Promise<{ status: DocumentStatus } | null> {
  const res = await client.query<{ status: DocumentStatus }>(
    `select status from ${params.table}
     where tenant_id = $1 and id = $2
     for update`,
    [params.tenantId, params.id]
  );

  return res.rows[0] ?? null;
}
