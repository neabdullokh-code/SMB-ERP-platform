import type { PoolClient } from "pg";
import Decimal from "decimal.js";
import type {
  CreateProductionOrderDocumentRequest,
  ProductionOrderDocument
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
  bom_id: string;
  warehouse_id: string;
  planned_units: string;
  produced_units: string;
  output_item_id: string;
  status: ProductionOrderDocument["status"];
  notes: string | null;
  scheduled_date: string | null;
  posted_at: string | null;
  voided_at: string | null;
  created_at: string;
  updated_at: string;
};

function mapHeader(row: HeaderRow): ProductionOrderDocument {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    documentNumber: row.document_number,
    documentDate: row.document_date,
    bomId: row.bom_id,
    warehouseId: row.warehouse_id,
    plannedUnits: row.planned_units,
    producedUnits: row.produced_units,
    outputItemId: row.output_item_id,
    status: row.status,
    notes: row.notes ?? undefined,
    scheduledDate: row.scheduled_date ?? undefined,
    postedAt: row.posted_at ?? undefined,
    voidedAt: row.voided_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function loadHeaderById(
  client: PoolClient,
  tenantId: string,
  id: string
): Promise<ProductionOrderDocument | null> {
  const res = await client.query<HeaderRow>(
    `select id, tenant_id, document_number, document_date::text,
            bom_id, warehouse_id,
            planned_units::text, produced_units::text,
            output_item_id, status, notes,
            scheduled_date::text as scheduled_date,
            posted_at::text as posted_at, voided_at::text as voided_at,
            created_at::text, updated_at::text
     from doc_production_order_header
     where tenant_id = $1 and id = $2`,
    [tenantId, id]
  );
  return res.rows[0] ? mapHeader(res.rows[0]) : null;
}

export async function createProductionOrder(
  tenantId: string,
  actorUserId: string,
  payload: CreateProductionOrderDocumentRequest
): Promise<ProductionOrderDocument> {
  const result = await withTenantTx(tenantId, async (client) => {
    const documentNumber =
      payload.documentNumber?.trim() ||
      (await nextInventoryDocumentNumber(client, tenantId, "production_order"));

    const headerRes = await client.query<{ id: string }>(
      `insert into doc_production_order_header (
         tenant_id, document_number, document_date,
         bom_id, warehouse_id, planned_units, produced_units,
         output_item_id, status, notes, scheduled_date,
         created_by, updated_by
       ) values (
         $1, $2, $3::date, $4, $5,
         $6::numeric, $7::numeric,
         $8, 'DRAFT', $9, $10::date,
         $11, $11
       )
       returning id`,
      [
        tenantId,
        documentNumber,
        payload.documentDate,
        payload.bomId,
        payload.warehouseId,
        new Decimal(payload.plannedUnits).toFixed(4),
        new Decimal(payload.producedUnits ?? payload.plannedUnits).toFixed(4),
        payload.outputItemId,
        payload.notes ?? null,
        payload.scheduledDate ?? null,
        actorUserId
      ]
    );

    const header = await loadHeaderById(client, tenantId, headerRes.rows[0]!.id);
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

export async function listProductionOrders(
  tenantId: string
): Promise<ProductionOrderDocument[]> {
  const result = await withTenantTx(tenantId, async (client) => {
    const res = await client.query<HeaderRow>(
      `select id, tenant_id, document_number, document_date::text,
              bom_id, warehouse_id,
              planned_units::text, produced_units::text,
              output_item_id, status, notes,
              scheduled_date::text as scheduled_date,
              posted_at::text as posted_at, voided_at::text as voided_at,
              created_at::text, updated_at::text
       from doc_production_order_header
       where tenant_id = $1
       order by document_date desc, created_at desc`,
      [tenantId]
    );
    return res.rows.map(mapHeader);
  });

  return result ?? [];
}

export async function getProductionOrder(
  tenantId: string,
  id: string
): Promise<ProductionOrderDocument | null> {
  const result = await withTenantTx(tenantId, async (client) => loadHeaderById(client, tenantId, id));
  return result ?? null;
}

/**
 * Post a production order (the Part 3 "Production Order" workflow):
 *   1. Read BOM lines for the referenced BOM.
 *   2. Compute required quantity per raw material = BOM qty-per-unit × produced units.
 *   3. Stock-check & lock raw materials in the production warehouse → throw
 *      INSUFFICIENT_STOCK on shortage.
 *   4. Snapshot WAC for each raw material and write one OUT row per material
 *      into the ledger (document_kind = 'production_consumption').
 *   5. Compute finished-good unit cost = sum(consumed cost) / produced_units.
 *   6. Write an IN row for the output item at that cost (document_kind =
 *      'production_output').
 *   7. Flip status to POSTED.
 */
export async function postProductionOrder(
  tenantId: string,
  actorUserId: string,
  documentId: string
): Promise<ProductionOrderDocument> {
  const result = await withTenantTx(tenantId, async (client) => {
    const locked = await lockDocumentHeader(client, {
      table: "doc_production_order_header",
      tenantId,
      id: documentId
    });

    if (!locked) {
      throw new DocumentPostingError({
        message: "Production order not found.",
        errorCode: "DOCUMENT_NOT_FOUND",
        httpStatus: 404
      });
    }

    assertTransition(locked.status, "POSTED");

    const header = await loadHeaderById(client, tenantId, documentId);
    if (!header) {
      throw new DocumentPostingError({
        message: "Production order vanished during posting.",
        errorCode: "DOCUMENT_NOT_FOUND",
        httpStatus: 404
      });
    }

    const producedUnits = new Decimal(header.producedUnits);
    if (producedUnits.lte(0)) {
      throw new DocumentPostingError({
        message: "Produced units must be positive to post a production order.",
        errorCode: "INVALID_PRODUCED_UNITS",
        httpStatus: 400
      });
    }

    // Step 1: read BOM lines. Prefer the normalized `production_bom_lines`;
    // fall back to the legacy `materials` jsonb when no normalized lines exist
    // so orders created before migration 017 still post.
    const bomLinesRes = await client.query<{
      item_id: string;
      quantity_per_unit: string;
    }>(
      `select item_id, quantity_per_unit::text
       from production_bom_lines
       where bom_id = $1 and tenant_id = $2
       order by position asc`,
      [header.bomId, tenantId]
    );

    let bomLines: Array<{ itemId: string; quantityPerUnit: Decimal }>;
    if (bomLinesRes.rows.length > 0) {
      bomLines = bomLinesRes.rows.map((row) => ({
        itemId: row.item_id,
        quantityPerUnit: new Decimal(row.quantity_per_unit)
      }));
    } else {
      const legacy = await client.query<{
        materials: Array<{ sku: string; quantity: number; unit: string }>;
      }>(
        `select materials from production_boms where id = $1 and tenant_id = $2 and deleted_at is null`,
        [header.bomId, tenantId]
      );

      const materials = legacy.rows[0]?.materials ?? [];
      if (materials.length === 0) {
        throw new DocumentPostingError({
          message: "Referenced BOM has no lines.",
          errorCode: "EMPTY_BOM",
          httpStatus: 400
        });
      }

      // Resolve legacy SKU strings to inventory item IDs in the same tenant.
      const skuRes = await client.query<{ id: string; sku: string }>(
        `select id, sku from inventory_items where tenant_id = $1 and sku = any($2::text[])`,
        [tenantId, materials.map((m) => m.sku)]
      );
      const byIdForSku = new Map(skuRes.rows.map((r) => [r.sku, r.id] as const));

      const missing = materials
        .map((m) => m.sku)
        .filter((sku) => !byIdForSku.has(sku));
      if (missing.length > 0) {
        throw new DocumentPostingError({
          message: "BOM references SKUs that do not exist for this tenant.",
          errorCode: "BOM_ITEM_NOT_FOUND",
          httpStatus: 400,
          details: { missingSkus: missing }
        });
      }

      bomLines = materials.map((material) => ({
        itemId: byIdForSku.get(material.sku)!,
        quantityPerUnit: new Decimal(material.quantity)
      }));
    }

    // Step 2+3: compute required qty, stock-check in one shot.
    const requiredLines = bomLines.map((line) => ({
      itemId: line.itemId,
      quantity: line.quantityPerUnit.times(producedUnits).toFixed(4)
    }));

    await assertStockAvailable(client, {
      tenantId,
      warehouseId: header.warehouseId,
      lines: requiredLines
    });

    // Step 4: WAC snapshot + OUT rows for raw materials.
    const itemIds = Array.from(new Set(bomLines.map((line) => line.itemId)));
    const wacByItem = await getWacUnitCosts(client, {
      tenantId,
      warehouseId: header.warehouseId,
      itemIds
    });

    let totalConsumedCost = new Decimal(0);
    for (const line of requiredLines) {
      const unitCost = new Decimal(wacByItem.get(line.itemId) ?? "0");
      totalConsumedCost = totalConsumedCost.plus(unitCost.times(new Decimal(line.quantity)));

      await writeLedgerRow(client, {
        tenantId,
        documentKind: "production_consumption",
        documentId: header.id,
        warehouseId: header.warehouseId,
        itemId: line.itemId,
        movementType: "OUT",
        quantity: line.quantity,
        unitCostUzs: unitCost.toFixed(2),
        periodAt: `${header.documentDate}T00:00:00Z`,
        actorUserId
      });
    }

    // Step 5+6: IN row for finished good at absorbed cost.
    const absorbedUnitCost = totalConsumedCost.div(producedUnits);
    await writeLedgerRow(client, {
      tenantId,
      documentKind: "production_output",
      documentId: header.id,
      warehouseId: header.warehouseId,
      itemId: header.outputItemId,
      movementType: "IN",
      quantity: producedUnits.toFixed(4),
      unitCostUzs: absorbedUnitCost.toFixed(2),
      periodAt: `${header.documentDate}T00:00:00Z`,
      actorUserId
    });

    // Step 7.
    await client.query(
      `update doc_production_order_header
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

export async function voidProductionOrder(
  tenantId: string,
  actorUserId: string,
  documentId: string
): Promise<ProductionOrderDocument> {
  const result = await withTenantTx(tenantId, async (client) => {
    const locked = await lockDocumentHeader(client, {
      table: "doc_production_order_header",
      tenantId,
      id: documentId
    });

    if (!locked) {
      throw new DocumentPostingError({
        message: "Production order not found.",
        errorCode: "DOCUMENT_NOT_FOUND",
        httpStatus: 404
      });
    }

    assertTransition(locked.status, "VOID");

    if (locked.status === "POSTED") {
      // Reverse every consumption + output row exactly.
      const existing = await client.query<{
        movement_type: "IN" | "OUT";
        warehouse_id: string;
        item_id: string;
        quantity: string;
        unit_cost_uzs: string;
        document_kind: "production_consumption" | "production_output";
      }>(
        `select movement_type, warehouse_id, item_id, quantity::text, unit_cost_uzs::text, document_kind
         from ledger_inventory
         where tenant_id = $1
           and document_kind in ('production_consumption', 'production_output')
           and document_id = $2`,
        [tenantId, documentId]
      );

      for (const row of existing.rows) {
        await writeLedgerRow(client, {
          tenantId,
          documentKind: row.document_kind,
          documentId,
          warehouseId: row.warehouse_id,
          itemId: row.item_id,
          movementType: row.movement_type === "IN" ? "OUT" : "IN",
          quantity: row.quantity,
          unitCostUzs: row.unit_cost_uzs,
          actorUserId
        });
      }
    }

    await client.query(
      `update doc_production_order_header
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
