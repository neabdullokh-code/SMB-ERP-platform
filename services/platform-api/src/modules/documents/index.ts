import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { ok, fail } from "../../lib/envelope.js";
import { requireTenantPermission } from "../../lib/permissions.js";
import { parseOrThrow } from "../finance/validation.js";
import {
  createGoodsReceipt,
  getGoodsReceipt,
  listGoodsReceipts,
  postGoodsReceipt,
  voidGoodsReceipt
} from "./goods-receipt.js";
import {
  createGoodsIssue,
  getGoodsIssue,
  listGoodsIssues,
  postGoodsIssue,
  voidGoodsIssue
} from "./goods-issue.js";
import {
  createInventoryTransfer,
  getInventoryTransfer,
  listInventoryTransfers,
  postInventoryTransfer
} from "./inventory-transfer.js";
import {
  createProductionOrder,
  getProductionOrder,
  listProductionOrders,
  postProductionOrder,
  voidProductionOrder
} from "./production-order.js";

// ─── zod shared bits ─────────────────────────────────────────────────────────

const DecimalString = z
  .string()
  .refine((v) => Number.isFinite(Number(v)), { message: "Must be a decimal number string." });

const PositiveDecimalString = DecimalString.refine((v) => Number(v) > 0, {
  message: "Must be a positive decimal number string."
});

const NonNegativeDecimalString = DecimalString.refine((v) => Number(v) >= 0, {
  message: "Must be a non-negative decimal number string."
});

const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be an ISO date (YYYY-MM-DD).");

// ─── Goods Receipt ───────────────────────────────────────────────────────────

const CreateGoodsReceiptSchema = z.object({
  documentNumber: z.string().trim().min(1).optional(),
  documentDate: IsoDate,
  warehouseId: z.string().uuid(),
  counterpartyId: z.string().uuid().optional(),
  notes: z.string().optional(),
  lines: z
    .array(
      z.object({
        itemId: z.string().uuid(),
        quantity: PositiveDecimalString,
        unitCostUzs: NonNegativeDecimalString,
        notes: z.string().optional()
      })
    )
    .min(1, "At least one line is required.")
});

// ─── Goods Issue ─────────────────────────────────────────────────────────────

const CreateGoodsIssueSchema = z.object({
  documentNumber: z.string().trim().min(1).optional(),
  documentDate: IsoDate,
  warehouseId: z.string().uuid(),
  counterpartyId: z.string().uuid().optional(),
  notes: z.string().optional(),
  lines: z
    .array(
      z.object({
        itemId: z.string().uuid(),
        quantity: PositiveDecimalString,
        notes: z.string().optional()
      })
    )
    .min(1, "At least one line is required.")
});

// ─── Transfer ────────────────────────────────────────────────────────────────

const CreateInventoryTransferSchema = z.object({
  documentNumber: z.string().trim().min(1).optional(),
  documentDate: IsoDate,
  sourceWarehouseId: z.string().uuid(),
  destinationWarehouseId: z.string().uuid(),
  notes: z.string().optional(),
  lines: z
    .array(
      z.object({
        itemId: z.string().uuid(),
        quantity: PositiveDecimalString,
        notes: z.string().optional()
      })
    )
    .min(1, "At least one line is required.")
});

// ─── Production Order ────────────────────────────────────────────────────────

const CreateProductionOrderSchema = z.object({
  documentNumber: z.string().trim().min(1).optional(),
  documentDate: IsoDate,
  bomId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  plannedUnits: PositiveDecimalString,
  producedUnits: PositiveDecimalString.optional(),
  outputItemId: z.string().uuid(),
  scheduledDate: IsoDate.optional(),
  notes: z.string().optional()
});

const INVENTORY_PERMISSION = "inventory.manage" as const;
const PRODUCTION_PERMISSION = "production.manage" as const;

// ─── Module ──────────────────────────────────────────────────────────────────

export async function documentsModule(app: FastifyInstance) {
  // ---------------------------------------------------------------------------
  // Goods Receipt
  // ---------------------------------------------------------------------------

  app.get("/documents/goods-receipts", async (request, reply) => {
    const access = await requireTenantPermission(
      request,
      reply,
      INVENTORY_PERMISSION,
      "Inventory access is restricted."
    );
    if (!access) return;

    const documents = await listGoodsReceipts(access.tenantId);
    return ok({ documents });
  });

  app.get("/documents/goods-receipts/:id", async (request, reply) => {
    const access = await requireTenantPermission(request, reply, INVENTORY_PERMISSION);
    if (!access) return;
    const { id } = request.params as { id: string };
    const document = await getGoodsReceipt(access.tenantId, id);
    if (!document) return reply.code(404).send(fail("Goods receipt not found.", "NOT_FOUND"));
    return ok({ document });
  });

  app.post("/documents/goods-receipts", async (request, reply) => {
    const access = await requireTenantPermission(request, reply, INVENTORY_PERMISSION);
    if (!access) return;
    const body = parseOrThrow(CreateGoodsReceiptSchema, request.body);
    const document = await createGoodsReceipt(access.tenantId, access.actorUserId, body);
    return reply.code(201).send(ok({ document }));
  });

  app.post("/documents/goods-receipts/:id/post", async (request, reply) => {
    const access = await requireTenantPermission(request, reply, INVENTORY_PERMISSION);
    if (!access) return;
    const { id } = request.params as { id: string };
    const document = await postGoodsReceipt(access.tenantId, access.actorUserId, id);
    return ok({ document });
  });

  app.post("/documents/goods-receipts/:id/void", async (request, reply) => {
    const access = await requireTenantPermission(request, reply, INVENTORY_PERMISSION);
    if (!access) return;
    const { id } = request.params as { id: string };
    const document = await voidGoodsReceipt(access.tenantId, access.actorUserId, id);
    return ok({ document });
  });

  // ---------------------------------------------------------------------------
  // Goods Issue
  // ---------------------------------------------------------------------------

  app.get("/documents/goods-issues", async (request, reply) => {
    const access = await requireTenantPermission(request, reply, INVENTORY_PERMISSION);
    if (!access) return;
    const documents = await listGoodsIssues(access.tenantId);
    return ok({ documents });
  });

  app.get("/documents/goods-issues/:id", async (request, reply) => {
    const access = await requireTenantPermission(request, reply, INVENTORY_PERMISSION);
    if (!access) return;
    const { id } = request.params as { id: string };
    const document = await getGoodsIssue(access.tenantId, id);
    if (!document) return reply.code(404).send(fail("Goods issue not found.", "NOT_FOUND"));
    return ok({ document });
  });

  app.post("/documents/goods-issues", async (request, reply) => {
    const access = await requireTenantPermission(request, reply, INVENTORY_PERMISSION);
    if (!access) return;
    const body = parseOrThrow(CreateGoodsIssueSchema, request.body);
    const document = await createGoodsIssue(access.tenantId, access.actorUserId, body);
    return reply.code(201).send(ok({ document }));
  });

  app.post("/documents/goods-issues/:id/post", async (request, reply) => {
    const access = await requireTenantPermission(request, reply, INVENTORY_PERMISSION);
    if (!access) return;
    const { id } = request.params as { id: string };
    // DocumentPostingError is caught by the global error handler which emits
    // fail() with errorCode + details (e.g. INSUFFICIENT_STOCK + per-line
    // available/requested breakdown).
    const document = await postGoodsIssue(access.tenantId, access.actorUserId, id);
    return ok({ document });
  });

  app.post("/documents/goods-issues/:id/void", async (request, reply) => {
    const access = await requireTenantPermission(request, reply, INVENTORY_PERMISSION);
    if (!access) return;
    const { id } = request.params as { id: string };
    const document = await voidGoodsIssue(access.tenantId, access.actorUserId, id);
    return ok({ document });
  });

  // ---------------------------------------------------------------------------
  // Inventory Transfer
  // ---------------------------------------------------------------------------

  app.get("/documents/inventory-transfers", async (request, reply) => {
    const access = await requireTenantPermission(request, reply, INVENTORY_PERMISSION);
    if (!access) return;
    const documents = await listInventoryTransfers(access.tenantId);
    return ok({ documents });
  });

  app.get("/documents/inventory-transfers/:id", async (request, reply) => {
    const access = await requireTenantPermission(request, reply, INVENTORY_PERMISSION);
    if (!access) return;
    const { id } = request.params as { id: string };
    const document = await getInventoryTransfer(access.tenantId, id);
    if (!document) return reply.code(404).send(fail("Transfer not found.", "NOT_FOUND"));
    return ok({ document });
  });

  app.post("/documents/inventory-transfers", async (request, reply) => {
    const access = await requireTenantPermission(request, reply, INVENTORY_PERMISSION);
    if (!access) return;
    const body = parseOrThrow(CreateInventoryTransferSchema, request.body);
    const document = await createInventoryTransfer(access.tenantId, access.actorUserId, body);
    return reply.code(201).send(ok({ document }));
  });

  app.post("/documents/inventory-transfers/:id/post", async (request, reply) => {
    const access = await requireTenantPermission(request, reply, INVENTORY_PERMISSION);
    if (!access) return;
    const { id } = request.params as { id: string };
    const document = await postInventoryTransfer(access.tenantId, access.actorUserId, id);
    return ok({ document });
  });

  // ---------------------------------------------------------------------------
  // Production Order (document)
  // ---------------------------------------------------------------------------

  app.get("/documents/production-orders", async (request, reply) => {
    const access = await requireTenantPermission(request, reply, PRODUCTION_PERMISSION);
    if (!access) return;
    const documents = await listProductionOrders(access.tenantId);
    return ok({ documents });
  });

  app.get("/documents/production-orders/:id", async (request, reply) => {
    const access = await requireTenantPermission(request, reply, PRODUCTION_PERMISSION);
    if (!access) return;
    const { id } = request.params as { id: string };
    const document = await getProductionOrder(access.tenantId, id);
    if (!document) return reply.code(404).send(fail("Production order not found.", "NOT_FOUND"));
    return ok({ document });
  });

  app.post("/documents/production-orders", async (request, reply) => {
    const access = await requireTenantPermission(request, reply, PRODUCTION_PERMISSION);
    if (!access) return;
    const body = parseOrThrow(CreateProductionOrderSchema, request.body);
    const document = await createProductionOrder(access.tenantId, access.actorUserId, body);
    return reply.code(201).send(ok({ document }));
  });

  app.post("/documents/production-orders/:id/post", async (request, reply) => {
    const access = await requireTenantPermission(request, reply, PRODUCTION_PERMISSION);
    if (!access) return;
    const { id } = request.params as { id: string };
    const document = await postProductionOrder(access.tenantId, access.actorUserId, id);
    return ok({ document });
  });

  app.post("/documents/production-orders/:id/void", async (request, reply) => {
    const access = await requireTenantPermission(request, reply, PRODUCTION_PERMISSION);
    if (!access) return;
    const { id } = request.params as { id: string };
    const document = await voidProductionOrder(access.tenantId, access.actorUserId, id);
    return ok({ document });
  });
}
