/*
 * Live smoke test for the 1C Document/Ledger pattern.
 *
 * Seeds a tenant + warehouse + item into a running Postgres, then exercises:
 *   1. createGoodsReceipt → postGoodsReceipt  (Ledger gets an IN row)
 *   2. getCurrentStock from v_inventory_on_hand matches the receipt quantity
 *   3. createGoodsIssue with qty > on-hand  → postGoodsIssue must throw
 *      DocumentPostingError("INSUFFICIENT_STOCK") with per-line details.
 *   4. createGoodsIssue with qty <= on-hand → posts successfully, ledger has
 *      an OUT row and balances update.
 *   5. postProductionOrder consumes BOM raw materials and outputs finished
 *      goods.
 *
 * Run with:
 *   DATABASE_URL=postgres://postgres:password@localhost:55432/smb_erp \
 *     npx tsx scripts/smoke-documents.ts
 */

import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import {
  createGoodsReceipt,
  postGoodsReceipt
} from "../services/platform-api/src/modules/documents/goods-receipt.js";
import {
  createGoodsIssue,
  postGoodsIssue
} from "../services/platform-api/src/modules/documents/goods-issue.js";
import {
  createProductionOrder,
  postProductionOrder
} from "../services/platform-api/src/modules/documents/production-order.js";
import { isDocumentPostingError } from "../services/platform-api/src/lib/envelope.js";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

process.env.DATABASE_URL = url;
process.env.ALLOW_DEMO_AUTH = "false";
process.env.API_PORT = "0";

const admin = new Pool({ connectionString: url });

async function setup() {
  const tenantId = randomUUID();
  const userId = randomUUID();
  const warehouseId = randomUUID();
  const rawItemId = randomUUID();
  const finishedItemId = randomUUID();
  const bomId = randomUUID();

  await admin.query(
    `insert into tenants (id, slug, name, status)
     values ($1::uuid, $2, 'smoke tenant', 'active')
     on conflict (id) do nothing`,
    [tenantId, `smoke-${tenantId.slice(0, 8)}`]
  );
  await admin.query(
    `insert into users (id, full_name, phone, status)
     values ($1::uuid, 'smoke user', $2, 'active')
     on conflict (id) do nothing`,
    [userId, `+998901${userId.replace(/\D/g, "").slice(0, 6)}`]
  );
  await admin.query(
    `insert into warehouses (id, tenant_id, code, name, location)
     values ($1, $2, 'WH-1', 'Main', 'Tashkent')
     on conflict (id) do nothing`,
    [warehouseId, tenantId]
  );
  await admin.query(
    `insert into inventory_items (id, tenant_id, warehouse_id, sku, name, category, reorder_point, unit_cost_uzs)
     values ($1, $2, $3, 'RAW-01', 'Steel rod', 'raw', 0, 0)
     on conflict (id) do nothing`,
    [rawItemId, tenantId, warehouseId]
  );
  await admin.query(
    `insert into inventory_items (id, tenant_id, warehouse_id, sku, name, category, reorder_point, unit_cost_uzs)
     values ($1, $2, $3, 'FIN-01', 'Steel frame', 'finished', 0, 0)
     on conflict (id) do nothing`,
    [finishedItemId, tenantId, warehouseId]
  );
  await admin.query(
    `insert into production_boms (id, tenant_id, code, output_sku, version, materials)
     values ($1, $2, 'BOM-1', 'FIN-01', 'v1', $3::jsonb)
     on conflict (id) do nothing`,
    [bomId, tenantId, JSON.stringify([{ sku: "RAW-01", quantity: 2, unit: "pc" }])]
  );
  await admin.query(
    `insert into production_bom_lines (bom_id, tenant_id, position, item_id, quantity_per_unit, unit)
     values ($1, $2, 0, $3, 2, 'pc')`,
    [bomId, tenantId, rawItemId]
  );

  return { tenantId, userId, warehouseId, rawItemId, finishedItemId, bomId };
}

async function assertStock(tenantId: string, warehouseId: string, itemId: string, expected: string, label: string) {
  const res = await admin.query<{ on_hand: string }>(
    `select coalesce(on_hand::text, '0') as on_hand from v_inventory_on_hand
     where tenant_id = $1 and warehouse_id = $2 and item_id = $3`,
    [tenantId, warehouseId, itemId]
  );
  const actual = res.rows[0]?.on_hand ?? "0";
  if (Number(actual) !== Number(expected)) {
    throw new Error(`stock mismatch for ${label}: expected ${expected}, got ${actual}`);
  }
  console.log(`  ✓ stock ${label}: ${actual}`);
}

async function main() {
  const ctx = await setup();
  console.log("setup tenant:", ctx.tenantId);

  // 1. Goods receipt: 100 units @ 1000 UZS
  const gr = await createGoodsReceipt(ctx.tenantId, ctx.userId, {
    documentDate: new Date().toISOString().slice(0, 10),
    warehouseId: ctx.warehouseId,
    lines: [{ itemId: ctx.rawItemId, quantity: "100", unitCostUzs: "1000" }]
  });
  await postGoodsReceipt(ctx.tenantId, ctx.userId, gr.id);
  console.log("[1] Goods receipt posted:", gr.documentNumber);
  await assertStock(ctx.tenantId, ctx.warehouseId, ctx.rawItemId, "100", "after receipt");

  // 2. Goods issue qty > on-hand → INSUFFICIENT_STOCK
  const gi1 = await createGoodsIssue(ctx.tenantId, ctx.userId, {
    documentDate: new Date().toISOString().slice(0, 10),
    warehouseId: ctx.warehouseId,
    lines: [{ itemId: ctx.rawItemId, quantity: "500" }]
  });

  try {
    await postGoodsIssue(ctx.tenantId, ctx.userId, gi1.id);
    throw new Error("expected INSUFFICIENT_STOCK, got success");
  } catch (err) {
    if (!isDocumentPostingError(err) || err.errorCode !== "INSUFFICIENT_STOCK") {
      throw err;
    }
    const details = err.details as Array<Record<string, string>>;
    console.log("[2] Goods issue 500 (out of 100) rejected:", err.errorCode);
    console.log("    details:", JSON.stringify(details));
    if (details[0].available !== "100.0000" || details[0].requested !== "500.0000") {
      throw new Error("details did not carry available/requested");
    }
  }

  // Tenant stock unchanged after failed post.
  await assertStock(ctx.tenantId, ctx.warehouseId, ctx.rawItemId, "100", "after failed issue");

  // 3. Goods issue qty <= on-hand → posts
  const gi2 = await createGoodsIssue(ctx.tenantId, ctx.userId, {
    documentDate: new Date().toISOString().slice(0, 10),
    warehouseId: ctx.warehouseId,
    lines: [{ itemId: ctx.rawItemId, quantity: "20" }]
  });
  await postGoodsIssue(ctx.tenantId, ctx.userId, gi2.id);
  console.log("[3] Goods issue 20 posted:", gi2.documentNumber);
  await assertStock(ctx.tenantId, ctx.warehouseId, ctx.rawItemId, "80", "after issue");

  // 4. Production order: BOM uses 2 raw per 1 finished, make 10 finished.
  const po = await createProductionOrder(ctx.tenantId, ctx.userId, {
    documentDate: new Date().toISOString().slice(0, 10),
    bomId: ctx.bomId,
    warehouseId: ctx.warehouseId,
    plannedUnits: "10",
    producedUnits: "10",
    outputItemId: ctx.finishedItemId
  });
  await postProductionOrder(ctx.tenantId, ctx.userId, po.id);
  console.log("[4] Production order posted:", po.documentNumber);
  // Raw materials: 80 - (10 * 2) = 60
  await assertStock(ctx.tenantId, ctx.warehouseId, ctx.rawItemId, "60", "raw after production");
  // Finished goods: 10
  await assertStock(ctx.tenantId, ctx.warehouseId, ctx.finishedItemId, "10", "finished after production");

  // 5. Production order short on raw materials: ask for 100 more finished (needs 200 raw, only 60 on hand)
  const po2 = await createProductionOrder(ctx.tenantId, ctx.userId, {
    documentDate: new Date().toISOString().slice(0, 10),
    bomId: ctx.bomId,
    warehouseId: ctx.warehouseId,
    plannedUnits: "100",
    producedUnits: "100",
    outputItemId: ctx.finishedItemId
  });

  try {
    await postProductionOrder(ctx.tenantId, ctx.userId, po2.id);
    throw new Error("expected INSUFFICIENT_STOCK, got success");
  } catch (err) {
    if (!isDocumentPostingError(err) || err.errorCode !== "INSUFFICIENT_STOCK") {
      throw err;
    }
    console.log("[5] Production order over-consuming raw rejected:", err.errorCode);
  }

  // Intentionally skip DB cleanup: `ledger_inventory` has immutability
  // triggers (by design — a real audit log cannot be deleted). Each run uses
  // fresh UUIDs so test runs don't collide.
  await admin.end();

  console.log("\nALL SMOKE TESTS PASSED");
}

main().catch(async (err) => {
  console.error("\nSMOKE FAILED:", err);
  try { await admin.end(); } catch {}
  process.exit(1);
});
