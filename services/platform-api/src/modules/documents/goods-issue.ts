import type { PoolClient } from "pg";
import Decimal from "decimal.js";
import type {
  CreateGoodsIssueRequest,
  GoodsIssueHeader,
  GoodsIssueLine
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
  warehouse_id: string;
  counterparty_id: string | null;
  status: GoodsIssueHeader["status"];
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

function mapHeader(row: HeaderRow, lines: GoodsIssueLine[]): GoodsIssueHeader {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    documentNumber: row.document_number,
    documentDate: row.document_date,
    warehouseId: row.warehouse_id,
    counterpartyId: row.counterparty_id ?? undefined,
    status: row.status,
    notes: row.notes ?? undefined,
    postedAt: row.posted_at ?? undefined,
    voidedAt: row.voided_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lines
  };
}

function mapLine(row: LineRow): GoodsIssueLine {
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
): Promise<GoodsIssueHeader | null> {
  const hr = await client.query<HeaderRow>(
    `select id, tenant_id, document_number, document_date::text, warehouse_id,
            counterparty_id, status, notes,
            posted_at::text as posted_at, voided_at::text as voided_at,
            created_at::text, updated_at::text
     from doc_goods_issue_header
     where tenant_id = $1 and id = $2`,
    [tenantId, id]
  );

  if (!hr.rows[0]) return null;

  const lines = await client.query<LineRow>(
    `select id, header_id, tenant_id, position, item_id, quantity::text, notes
     from doc_goods_issue_lines
     where header_id = $1 and tenant_id = $2
     order by position asc`,
    [id, tenantId]
  );

  return mapHeader(hr.rows[0], lines.rows.map(mapLine));
}

export async function createGoodsIssue(
  tenantId: string,
  actorUserId: string,
  payload: CreateGoodsIssueRequest
): Promise<GoodsIssueHeader> {
  if (!payload.lines || payload.lines.length === 0) {
    throw new DocumentPostingError({
      message: "A goods issue must have at least one line.",
      errorCode: "EMPTY_DOCUMENT_LINES",
      httpStatus: 400
    });
  }

  const result = await withTenantTx(tenantId, async (client) => {
    const documentNumber =
      payload.documentNumber?.trim() ||
      (await nextInventoryDocumentNumber(client, tenantId, "goods_issue"));

    const headerRes = await client.query<{ id: string }>(
      `insert into doc_goods_issue_header (
         tenant_id, document_number, document_date, warehouse_id,
         counterparty_id, status, notes, created_by, updated_by
       ) values ($1, $2, $3::date, $4, $5, 'DRAFT', $6, $7, $7)
       returning id`,
      [
        tenantId,
        documentNumber,
        payload.documentDate,
        payload.warehouseId,
        payload.counterpartyId ?? null,
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
        `insert into doc_goods_issue_lines (
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
      message: "Database unavailable; goods issue cannot be recorded.",
      errorCode: "DATABASE_UNAVAILABLE",
      httpStatus: 503
    });
  }
  return result;
}

export async function listGoodsIssues(tenantId: string): Promise<GoodsIssueHeader[]> {
  const result = await withTenantTx(tenantId, async (client) => {
    const hr = await client.query<HeaderRow>(
      `select id, tenant_id, document_number, document_date::text, warehouse_id,
              counterparty_id, status, notes,
              posted_at::text as posted_at, voided_at::text as voided_at,
              created_at::text, updated_at::text
       from doc_goods_issue_header
       where tenant_id = $1
       order by document_date desc, created_at desc`,
      [tenantId]
    );

    if (hr.rows.length === 0) return [];

    const ids = hr.rows.map((r) => r.id);
    const ln = await client.query<LineRow>(
      `select id, header_id, tenant_id, position, item_id, quantity::text, notes
       from doc_goods_issue_lines
       where tenant_id = $1 and header_id = any($2::uuid[])
       order by header_id asc, position asc`,
      [tenantId, ids]
    );

    const byHeader = new Map<string, GoodsIssueLine[]>();
    for (const row of ln.rows) {
      const arr = byHeader.get(row.header_id) ?? [];
      arr.push(mapLine(row));
      byHeader.set(row.header_id, arr);
    }

    return hr.rows.map((row) => mapHeader(row, byHeader.get(row.id) ?? []));
  });

  return result ?? [];
}

export async function getGoodsIssue(
  tenantId: string,
  id: string
): Promise<GoodsIssueHeader | null> {
  const result = await withTenantTx(tenantId, async (client) => loadHeaderById(client, tenantId, id));
  return result ?? null;
}

/**
 * Post a goods issue — the canonical example of the 1C posting pattern:
 *   1. Lock the header row (state-machine guard).
 *   2. Assert DRAFT → POSTED transition.
 *   3. Lock the underlying item rows.
 *   4. Compute on-hand per (item, warehouse) from the ledger.
 *   5. If any line is short, throw DocumentPostingError("INSUFFICIENT_STOCK")
 *      with per-line details — caller surfaces as HTTP 400.
 *   6. Snapshot weighted-average cost for each line, write one OUT row per
 *      line to the ledger.
 *   7. Flip status to POSTED.
 *   8. Commit.
 */
export async function postGoodsIssue(
  tenantId: string,
  actorUserId: string,
  documentId: string
): Promise<GoodsIssueHeader> {
  const result = await withTenantTx(tenantId, async (client) => {
    const locked = await lockDocumentHeader(client, {
      table: "doc_goods_issue_header",
      tenantId,
      id: documentId
    });

    if (!locked) {
      throw new DocumentPostingError({
        message: "Goods issue not found.",
        errorCode: "DOCUMENT_NOT_FOUND",
        httpStatus: 404
      });
    }

    assertTransition(locked.status, "POSTED");

    const header = await loadHeaderById(client, tenantId, documentId);
    if (!header) {
      throw new DocumentPostingError({
        message: "Goods issue vanished during posting.",
        errorCode: "DOCUMENT_NOT_FOUND",
        httpStatus: 404
      });
    }

    // Step 3+4+5: lock items, check availability, throw INSUFFICIENT_STOCK on failure.
    await assertStockAvailable(client, {
      tenantId,
      warehouseId: header.warehouseId,
      lines: header.lines.map((line) => ({ itemId: line.itemId, quantity: line.quantity }))
    });

    // Step 6: snapshot WAC cost for each OUT row so COGS reports are stable
    // even if future receipts change the WAC going forward.
    const wacByItem = await getWacUnitCosts(client, {
      tenantId,
      warehouseId: header.warehouseId,
      itemIds: Array.from(new Set(header.lines.map((line) => line.itemId)))
    });

    for (const line of header.lines) {
      const unitCost = wacByItem.get(line.itemId) ?? "0";
      await writeLedgerRow(client, {
        tenantId,
        documentKind: "goods_issue",
        documentId: header.id,
        warehouseId: header.warehouseId,
        itemId: line.itemId,
        movementType: "OUT",
        quantity: line.quantity,
        unitCostUzs: new Decimal(unitCost).toFixed(2),
        periodAt: `${header.documentDate}T00:00:00Z`,
        actorUserId
      });
    }

    await client.query(
      `update doc_goods_issue_header
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

export async function voidGoodsIssue(
  tenantId: string,
  actorUserId: string,
  documentId: string
): Promise<GoodsIssueHeader> {
  const result = await withTenantTx(tenantId, async (client) => {
    const locked = await lockDocumentHeader(client, {
      table: "doc_goods_issue_header",
      tenantId,
      id: documentId
    });

    if (!locked) {
      throw new DocumentPostingError({
        message: "Goods issue not found.",
        errorCode: "DOCUMENT_NOT_FOUND",
        httpStatus: 404
      });
    }

    assertTransition(locked.status, "VOID");

    if (locked.status === "POSTED") {
      const header = await loadHeaderById(client, tenantId, documentId);
      if (!header) {
        throw new DocumentPostingError({
          message: "Goods issue vanished during voiding.",
          errorCode: "DOCUMENT_NOT_FOUND",
          httpStatus: 404
        });
      }

      // Reverse every OUT row at the cost it was posted at. We re-read the
      // original ledger rows rather than recomputing WAC so the reversal is
      // exactly symmetric.
      const original = await client.query<{ item_id: string; quantity: string; unit_cost_uzs: string }>(
        `select item_id, quantity::text, unit_cost_uzs::text
         from ledger_inventory
         where tenant_id = $1 and document_kind = 'goods_issue' and document_id = $2
           and movement_type = 'OUT'`,
        [tenantId, documentId]
      );

      for (const row of original.rows) {
        await writeLedgerRow(client, {
          tenantId,
          documentKind: "goods_issue",
          documentId: header.id,
          warehouseId: header.warehouseId,
          itemId: row.item_id,
          movementType: "IN",
          quantity: row.quantity,
          unitCostUzs: row.unit_cost_uzs,
          actorUserId
        });
      }
    }

    await client.query(
      `update doc_goods_issue_header
       set status = 'VOID',
           voided_at = now(),
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
