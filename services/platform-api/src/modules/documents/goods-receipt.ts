import type { PoolClient } from "pg";
import Decimal from "decimal.js";
import type {
  CreateGoodsReceiptRequest,
  GoodsReceiptHeader,
  GoodsReceiptLine
} from "@sqb/domain-types";
import { withTenantTx } from "../../lib/tenant-tx.js";
import { DocumentPostingError } from "../../lib/envelope.js";
import {
  assertTransition,
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
  status: GoodsReceiptHeader["status"];
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
  unit_cost_uzs: string;
  line_total_uzs: string;
  notes: string | null;
};

function mapHeader(row: HeaderRow, lines: GoodsReceiptLine[]): GoodsReceiptHeader {
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

function mapLine(row: LineRow): GoodsReceiptLine {
  return {
    id: row.id,
    headerId: row.header_id,
    tenantId: row.tenant_id,
    position: row.position,
    itemId: row.item_id,
    quantity: row.quantity,
    unitCostUzs: row.unit_cost_uzs,
    lineTotalUzs: row.line_total_uzs,
    notes: row.notes ?? undefined
  };
}

async function loadHeaderById(
  client: PoolClient,
  tenantId: string,
  id: string
): Promise<GoodsReceiptHeader | null> {
  const hr = await client.query<HeaderRow>(
    `select id, tenant_id, document_number, document_date::text, warehouse_id,
            counterparty_id, status, notes,
            posted_at::text as posted_at, voided_at::text as voided_at,
            created_at::text, updated_at::text
     from doc_goods_receipt_header
     where tenant_id = $1 and id = $2`,
    [tenantId, id]
  );

  if (!hr.rows[0]) return null;

  const lines = await client.query<LineRow>(
    `select id, header_id, tenant_id, position, item_id,
            quantity::text, unit_cost_uzs::text, line_total_uzs::text, notes
     from doc_goods_receipt_lines
     where header_id = $1 and tenant_id = $2
     order by position asc`,
    [id, tenantId]
  );

  return mapHeader(hr.rows[0], lines.rows.map(mapLine));
}

export async function createGoodsReceipt(
  tenantId: string,
  actorUserId: string,
  payload: CreateGoodsReceiptRequest
): Promise<GoodsReceiptHeader> {
  if (!payload.lines || payload.lines.length === 0) {
    throw new DocumentPostingError({
      message: "A goods receipt must have at least one line.",
      errorCode: "EMPTY_DOCUMENT_LINES",
      httpStatus: 400
    });
  }

  const result = await withTenantTx(tenantId, async (client) => {
    const documentNumber =
      payload.documentNumber?.trim() ||
      (await nextInventoryDocumentNumber(client, tenantId, "goods_receipt"));

    const headerRes = await client.query<{ id: string }>(
      `insert into doc_goods_receipt_header (
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
      const cost = new Decimal(line.unitCostUzs);
      if (qty.lte(0)) {
        throw new DocumentPostingError({
          message: `Line ${idx + 1}: quantity must be positive.`,
          errorCode: "INVALID_LINE_QUANTITY",
          httpStatus: 400,
          details: { line: idx }
        });
      }
      if (cost.lt(0)) {
        throw new DocumentPostingError({
          message: `Line ${idx + 1}: unit cost must be non-negative.`,
          errorCode: "INVALID_LINE_COST",
          httpStatus: 400,
          details: { line: idx }
        });
      }

      const lineTotal = qty.times(cost);

      await client.query(
        `insert into doc_goods_receipt_lines (
           header_id, tenant_id, position, item_id,
           quantity, unit_cost_uzs, line_total_uzs, notes
         ) values ($1, $2, $3, $4, $5::numeric, $6::numeric, $7::numeric, $8)`,
        [
          headerId,
          tenantId,
          idx,
          line.itemId,
          qty.toFixed(4),
          cost.toFixed(2),
          lineTotal.toFixed(2),
          line.notes ?? null
        ]
      );
    }

    const header = await loadHeaderById(client, tenantId, headerId);
    if (!header) {
      throw new Error("Goods receipt vanished after insert.");
    }
    return header;
  });

  if (!result) {
    throw new DocumentPostingError({
      message: "Database unavailable; goods receipt cannot be recorded.",
      errorCode: "DATABASE_UNAVAILABLE",
      httpStatus: 503
    });
  }
  return result;
}

export async function listGoodsReceipts(tenantId: string): Promise<GoodsReceiptHeader[]> {
  const result = await withTenantTx(tenantId, async (client) => {
    const hr = await client.query<HeaderRow>(
      `select id, tenant_id, document_number, document_date::text, warehouse_id,
              counterparty_id, status, notes,
              posted_at::text as posted_at, voided_at::text as voided_at,
              created_at::text, updated_at::text
       from doc_goods_receipt_header
       where tenant_id = $1
       order by document_date desc, created_at desc`,
      [tenantId]
    );

    if (hr.rows.length === 0) return [];

    const ids = hr.rows.map((r) => r.id);
    const ln = await client.query<LineRow>(
      `select id, header_id, tenant_id, position, item_id,
              quantity::text, unit_cost_uzs::text, line_total_uzs::text, notes
       from doc_goods_receipt_lines
       where tenant_id = $1 and header_id = any($2::uuid[])
       order by header_id asc, position asc`,
      [tenantId, ids]
    );

    const byHeader = new Map<string, GoodsReceiptLine[]>();
    for (const row of ln.rows) {
      const arr = byHeader.get(row.header_id) ?? [];
      arr.push(mapLine(row));
      byHeader.set(row.header_id, arr);
    }

    return hr.rows.map((row) => mapHeader(row, byHeader.get(row.id) ?? []));
  });

  return result ?? [];
}

export async function getGoodsReceipt(
  tenantId: string,
  id: string
): Promise<GoodsReceiptHeader | null> {
  const result = await withTenantTx(tenantId, async (client) => loadHeaderById(client, tenantId, id));
  return result ?? null;
}

/**
 * Post a goods receipt: lock the header, verify DRAFT, write one IN row per
 * document line into the ledger, flip status to POSTED. Everything runs in a
 * single transaction under the tenant RLS context.
 */
export async function postGoodsReceipt(
  tenantId: string,
  actorUserId: string,
  documentId: string
): Promise<GoodsReceiptHeader> {
  const result = await withTenantTx(tenantId, async (client) => {
    const locked = await lockDocumentHeader(client, {
      table: "doc_goods_receipt_header",
      tenantId,
      id: documentId
    });

    if (!locked) {
      throw new DocumentPostingError({
        message: "Goods receipt not found.",
        errorCode: "DOCUMENT_NOT_FOUND",
        httpStatus: 404
      });
    }

    assertTransition(locked.status, "POSTED");

    const header = await loadHeaderById(client, tenantId, documentId);
    if (!header) {
      throw new DocumentPostingError({
        message: "Goods receipt vanished during posting.",
        errorCode: "DOCUMENT_NOT_FOUND",
        httpStatus: 404
      });
    }

    for (const line of header.lines) {
      await writeLedgerRow(client, {
        tenantId,
        documentKind: "goods_receipt",
        documentId: header.id,
        warehouseId: header.warehouseId,
        itemId: line.itemId,
        movementType: "IN",
        quantity: line.quantity,
        unitCostUzs: line.unitCostUzs,
        periodAt: `${header.documentDate}T00:00:00Z`,
        actorUserId
      });
    }

    await client.query(
      `update doc_goods_receipt_header
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

/**
 * Void a posted goods receipt by writing reversing OUT rows in the ledger and
 * flipping status to VOID. Never deletes ledger rows.
 */
export async function voidGoodsReceipt(
  tenantId: string,
  actorUserId: string,
  documentId: string
): Promise<GoodsReceiptHeader> {
  const result = await withTenantTx(tenantId, async (client) => {
    const locked = await lockDocumentHeader(client, {
      table: "doc_goods_receipt_header",
      tenantId,
      id: documentId
    });

    if (!locked) {
      throw new DocumentPostingError({
        message: "Goods receipt not found.",
        errorCode: "DOCUMENT_NOT_FOUND",
        httpStatus: 404
      });
    }

    assertTransition(locked.status, "VOID");

    if (locked.status === "POSTED") {
      const header = await loadHeaderById(client, tenantId, documentId);
      if (!header) {
        throw new DocumentPostingError({
          message: "Goods receipt vanished during voiding.",
          errorCode: "DOCUMENT_NOT_FOUND",
          httpStatus: 404
        });
      }

      for (const line of header.lines) {
        await writeLedgerRow(client, {
          tenantId,
          documentKind: "goods_receipt",
          documentId: header.id,
          warehouseId: header.warehouseId,
          itemId: line.itemId,
          movementType: "OUT",
          quantity: line.quantity,
          unitCostUzs: line.unitCostUzs,
          actorUserId
        });
      }
    }

    await client.query(
      `update doc_goods_receipt_header
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
