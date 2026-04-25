import type { PoolClient } from "pg";
import Decimal from "decimal.js";
import type {
  CreateInventoryTransferRequest,
  InventoryTransferHeader,
  InventoryTransferLine
} from "@sqb/domain-types";
import { withTenantTx } from "../../lib/tenant-tx.js";
import { DocumentPostingError } from "../../lib/envelope.js";
import {
  assertStockAvailable,
  assertTransition,
  getWacUnitCosts,
  lockDocumentHeader,
  nextInventoryDocumentNumber,
  writeLedgerRow
} from "./shared.js";

type HeaderRow = {
  id: string;
  tenant_id: string;
  document_number: string;
  document_date: string;
  source_warehouse_id: string;
  destination_warehouse_id: string;
  status: InventoryTransferHeader["status"];
  notes: string | null;
  posted_at: string | null;
  voided_at: string | null;
  created_at: string;
  updated_at: string;
};

type LineRow = {
  id: string;
  header_id: string;
  tenant_id: string;
  position: number;
  item_id: string;
  quantity: string;
  notes: string | null;
};

function mapHeader(row: HeaderRow, lines: InventoryTransferLine[]): InventoryTransferHeader {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    documentNumber: row.document_number,
    documentDate: row.document_date,
    sourceWarehouseId: row.source_warehouse_id,
    destinationWarehouseId: row.destination_warehouse_id,
    status: row.status,
    notes: row.notes ?? undefined,
    postedAt: row.posted_at ?? undefined,
    voidedAt: row.voided_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lines
  };
}

function mapLine(row: LineRow): InventoryTransferLine {
  return {
    id: row.id,
    headerId: row.header_id,
    tenantId: row.tenant_id,
    position: row.position,
    itemId: row.item_id,
    quantity: row.quantity,
    notes: row.notes ?? undefined
  };
}

async function loadHeaderById(
  client: PoolClient,
  tenantId: string,
  id: string
): Promise<InventoryTransferHeader | null> {
  const hr = await client.query<HeaderRow>(
    `select id, tenant_id, document_number, document_date::text,
            source_warehouse_id, destination_warehouse_id,
            status, notes,
            posted_at::text as posted_at, voided_at::text as voided_at,
            created_at::text, updated_at::text
     from doc_inventory_transfer_header
     where tenant_id = $1 and id = $2`,
    [tenantId, id]
  );

  if (!hr.rows[0]) return null;

  const lines = await client.query<LineRow>(
    `select id, header_id, tenant_id, position, item_id, quantity::text, notes
     from doc_inventory_transfer_lines
     where header_id = $1 and tenant_id = $2
     order by position asc`,
    [id, tenantId]
  );

  return mapHeader(hr.rows[0], lines.rows.map(mapLine));
}

export async function createInventoryTransfer(
  tenantId: string,
  actorUserId: string,
  payload: CreateInventoryTransferRequest
): Promise<InventoryTransferHeader> {
  if (!payload.lines || payload.lines.length === 0) {
    throw new DocumentPostingError({
      message: "A transfer must have at least one line.",
      errorCode: "EMPTY_DOCUMENT_LINES",
      httpStatus: 400
    });
  }
  if (payload.sourceWarehouseId === payload.destinationWarehouseId) {
    throw new DocumentPostingError({
      message: "Source and destination warehouses must differ.",
      errorCode: "INVALID_TRANSFER_WAREHOUSES",
      httpStatus: 400
    });
  }

  const result = await withTenantTx(tenantId, async (client) => {
    const documentNumber =
      payload.documentNumber?.trim() ||
      (await nextInventoryDocumentNumber(client, tenantId, "inventory_transfer"));

    const headerRes = await client.query<{ id: string }>(
      `insert into doc_inventory_transfer_header (
         tenant_id, document_number, document_date,
         source_warehouse_id, destination_warehouse_id,
         status, notes, created_by, updated_by
       ) values ($1, $2, $3::date, $4, $5, 'DRAFT', $6, $7, $7)
       returning id`,
      [
        tenantId,
        documentNumber,
        payload.documentDate,
        payload.sourceWarehouseId,
        payload.destinationWarehouseId,
        payload.notes ?? null,
        actorUserId
      ]
    );
    const headerId = headerRes.rows[0]!.id;

    for (const [idx, line] of payload.lines.entries()) {
      const qty = new Decimal(line.quantity);
      if (qty.lte(0)) {
        throw new DocumentPostingError({
          message: `Line ${idx + 1}: quantity must be positive.`,
          errorCode: "INVALID_LINE_QUANTITY",
          httpStatus: 400,
          details: { line: idx }
        });
      }

      await client.query(
        `insert into doc_inventory_transfer_lines (
           header_id, tenant_id, position, item_id, quantity, notes
         ) values ($1, $2, $3, $4, $5::numeric, $6)`,
        [headerId, tenantId, idx, line.itemId, qty.toFixed(4), line.notes ?? null]
      );
    }

    const header = await loadHeaderById(client, tenantId, headerId);
    return header!;
  });

  if (!result) {
    throw new DocumentPostingError({
      message: "Database unavailable.",
      errorCode: "DATABASE_UNAVAILABLE",
      httpStatus: 503
    });
  }
  return result;
}

export async function listInventoryTransfers(tenantId: string): Promise<InventoryTransferHeader[]> {
  const result = await withTenantTx(tenantId, async (client) => {
    const hr = await client.query<HeaderRow>(
      `select id, tenant_id, document_number, document_date::text,
              source_warehouse_id, destination_warehouse_id,
              status, notes,
              posted_at::text as posted_at, voided_at::text as voided_at,
              created_at::text, updated_at::text
       from doc_inventory_transfer_header
       where tenant_id = $1
       order by document_date desc, created_at desc`,
      [tenantId]
    );

    if (hr.rows.length === 0) return [];

    const ids = hr.rows.map((r) => r.id);
    const ln = await client.query<LineRow>(
      `select id, header_id, tenant_id, position, item_id, quantity::text, notes
       from doc_inventory_transfer_lines
       where tenant_id = $1 and header_id = any($2::uuid[])
       order by header_id asc, position asc`,
      [tenantId, ids]
    );

    const byHeader = new Map<string, InventoryTransferLine[]>();
    for (const row of ln.rows) {
      const arr = byHeader.get(row.header_id) ?? [];
      arr.push(mapLine(row));
      byHeader.set(row.header_id, arr);
    }

    return hr.rows.map((row) => mapHeader(row, byHeader.get(row.id) ?? []));
  });

  return result ?? [];
}

export async function getInventoryTransfer(
  tenantId: string,
  id: string
): Promise<InventoryTransferHeader | null> {
  const result = await withTenantTx(tenantId, async (client) => loadHeaderById(client, tenantId, id));
  return result ?? null;
}

/**
 * Post an inventory transfer: stock check on the source, then write two ledger
 * rows per line (OUT from source, IN to destination) preserving WAC cost.
 */
export async function postInventoryTransfer(
  tenantId: string,
  actorUserId: string,
  documentId: string
): Promise<InventoryTransferHeader> {
  const result = await withTenantTx(tenantId, async (client) => {
    const locked = await lockDocumentHeader(client, {
      table: "doc_inventory_transfer_header",
      tenantId,
      id: documentId
    });

    if (!locked) {
      throw new DocumentPostingError({
        message: "Inventory transfer not found.",
        errorCode: "DOCUMENT_NOT_FOUND",
        httpStatus: 404
      });
    }

    assertTransition(locked.status, "POSTED");

    const header = await loadHeaderById(client, tenantId, documentId);
    if (!header) {
      throw new DocumentPostingError({
        message: "Inventory transfer vanished during posting.",
        errorCode: "DOCUMENT_NOT_FOUND",
        httpStatus: 404
      });
    }

    await assertStockAvailable(client, {
      tenantId,
      warehouseId: header.sourceWarehouseId,
      lines: header.lines.map((line) => ({ itemId: line.itemId, quantity: line.quantity }))
    });

    const wacByItem = await getWacUnitCosts(client, {
      tenantId,
      warehouseId: header.sourceWarehouseId,
      itemIds: Array.from(new Set(header.lines.map((line) => line.itemId)))
    });

    for (const line of header.lines) {
      const unitCost = new Decimal(wacByItem.get(line.itemId) ?? "0").toFixed(2);
      // OUT of source
      await writeLedgerRow(client, {
        tenantId,
        documentKind: "inventory_transfer",
        documentId: header.id,
        warehouseId: header.sourceWarehouseId,
        itemId: line.itemId,
        movementType: "OUT",
        quantity: line.quantity,
        unitCostUzs: unitCost,
        periodAt: `${header.documentDate}T00:00:00Z`,
        actorUserId
      });
      // IN to destination (same cost so total tenant valuation is unchanged)
      await writeLedgerRow(client, {
        tenantId,
        documentKind: "inventory_transfer",
        documentId: header.id,
        warehouseId: header.destinationWarehouseId,
        itemId: line.itemId,
        movementType: "IN",
        quantity: line.quantity,
        unitCostUzs: unitCost,
        periodAt: `${header.documentDate}T00:00:00Z`,
        actorUserId
      });
    }

    await client.query(
      `update doc_inventory_transfer_header
       set status = 'POSTED',
           posted_at = now(),
           updated_by = $2,
           updated_at = now()
       where tenant_id = $1 and id = $3`,
      [tenantId, actorUserId, documentId]
    );

    const updated = await loadHeaderById(client, tenantId, documentId);
    return updated!;
  });

  if (!result) {
    throw new DocumentPostingError({
      message: "Database unavailable.",
      errorCode: "DATABASE_UNAVAILABLE",
      httpStatus: 503
    });
  }
  return result;
}
