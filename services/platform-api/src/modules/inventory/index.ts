import type { FastifyInstance } from "fastify";
import { ok, fail } from "../../lib/envelope.js";
import { requireTenantPermission } from "../../lib/permissions.js";
import {
  completeStocktake,
  createInventoryItem,
  createStocktake,
  createWarehouse,
  deleteInventoryItem,
  getInventoryItem,
  listInventoryItems,
  listMovements,
  listStocktakes,
  listWarehouses,
  recordMovement,
  updateInventoryItem
} from "./store.js";
import { z } from "zod";
import {
  CompleteStocktakeSchema,
  CreateInventoryItemSchema,
  CreateWarehouseSchema,
  RecordMovementSchema,
  UpdateInventoryItemSchema,
  parseOrThrow
} from "./validation.js";

const CreateStocktakeSchema = z.object({
  warehouseId: z.string().uuid("Warehouse ID must be a valid UUID.")
});

const PERMISSION = "inventory.manage" as const;
const PERMISSION_MSG = "Inventory access is restricted to inventory operators.";

export async function inventoryModule(app: FastifyInstance) {
  // -------------------------------------------------------------------------
  // GET /inventory/summary
  // -------------------------------------------------------------------------
  app.get("/inventory/summary", async (request, reply) => {
    const access = await requireTenantPermission(request, reply, PERMISSION, PERMISSION_MSG);
    if (!access) return;

    const [warehouses, items, movements, stocktakes] = await Promise.all([
      listWarehouses(access.tenantId),
      listInventoryItems(access.tenantId),
      listMovements(access.tenantId),
      listStocktakes(access.tenantId)
    ]);

    return ok({ warehouses, items, movements: movements.slice(0, 20), stocktakes });
  });

  // -------------------------------------------------------------------------
  // GET /inventory/warehouses
  // -------------------------------------------------------------------------
  app.get("/inventory/warehouses", async (request, reply) => {
    const access = await requireTenantPermission(request, reply, PERMISSION, PERMISSION_MSG);
    if (!access) return;

    const warehouses = await listWarehouses(access.tenantId);
    return ok({ warehouses });
  });

  // -------------------------------------------------------------------------
  // POST /inventory/warehouses
  // -------------------------------------------------------------------------
  app.post("/inventory/warehouses", async (request, reply) => {
    const access = await requireTenantPermission(request, reply, PERMISSION, PERMISSION_MSG);
    if (!access) return;

    const body = parseOrThrow(CreateWarehouseSchema, request.body);
    const warehouse = await createWarehouse(access.tenantId, access.actorUserId, body);
    return reply.code(201).send(ok({ warehouse }));
  });

  // -------------------------------------------------------------------------
  // GET /inventory/items
  // -------------------------------------------------------------------------
  app.get("/inventory/items", async (request, reply) => {
    const access = await requireTenantPermission(request, reply, PERMISSION, PERMISSION_MSG);
    if (!access) return;

    const query = request.query as { q?: string; warehouseId?: string; category?: string };
    const items = await listInventoryItems(access.tenantId, {
      q: query.q,
      warehouseId: query.warehouseId,
      category: query.category
    });

    return ok({ items });
  });

  // -------------------------------------------------------------------------
  // POST /inventory/items
  // -------------------------------------------------------------------------
  app.post("/inventory/items", async (request, reply) => {
    const access = await requireTenantPermission(request, reply, PERMISSION, PERMISSION_MSG);
    if (!access) return;

    const body = parseOrThrow(CreateInventoryItemSchema, request.body);
    const item = await createInventoryItem(access.tenantId, access.actorUserId, body);
    return reply.code(201).send(ok({ item }));
  });

  // -------------------------------------------------------------------------
  // PATCH /inventory/items/:itemId
  // -------------------------------------------------------------------------
  app.patch("/inventory/items/:itemId", async (request, reply) => {
    const access = await requireTenantPermission(request, reply, PERMISSION, PERMISSION_MSG);
    if (!access) return;

    const { itemId } = request.params as { itemId: string };
    const body = parseOrThrow(UpdateInventoryItemSchema, request.body);
    const item = await updateInventoryItem(access.tenantId, access.actorUserId, itemId, body);

    if (!item) {
      return reply.code(404).send(fail("Inventory item not found."));
    }

    return ok({ item });
  });

  // -------------------------------------------------------------------------
  // DELETE /inventory/items/:itemId
  // -------------------------------------------------------------------------
  app.delete("/inventory/items/:itemId", async (request, reply) => {
    const access = await requireTenantPermission(request, reply, PERMISSION, PERMISSION_MSG);
    if (!access) return;

    const { itemId } = request.params as { itemId: string };
    const deleted = await deleteInventoryItem(access.tenantId, itemId);

    if (!deleted) {
      return reply.code(404).send(fail("Inventory item not found."));
    }

    return ok({ deleted: true });
  });

  // -------------------------------------------------------------------------
  // GET /inventory/movements
  // -------------------------------------------------------------------------
  app.get("/inventory/movements", async (request, reply) => {
    const access = await requireTenantPermission(request, reply, PERMISSION, PERMISSION_MSG);
    if (!access) return;

    const query = request.query as {
      itemId?: string;
      movementType?: "inbound" | "outbound" | "transfer" | "adjustment";
    };

    const movements = await listMovements(access.tenantId, {
      itemId: query.itemId,
      movementType: query.movementType
    });

    return ok({ movements });
  });

  // -------------------------------------------------------------------------
  // POST /inventory/movements
  // -------------------------------------------------------------------------
  app.post("/inventory/movements", async (request, reply) => {
    const access = await requireTenantPermission(request, reply, PERMISSION, PERMISSION_MSG);
    if (!access) return;

    const body = parseOrThrow(RecordMovementSchema, request.body);

    // Verify item exists and belongs to this tenant
    const item = await getInventoryItem(access.tenantId, body.itemId);
    if (!item) {
      return reply.code(404).send(fail("Inventory item not found."));
    }

    const movement = await recordMovement(access.tenantId, access.actorUserId, body);
    return reply.code(201).send(ok({ movement }));
  });

  // -------------------------------------------------------------------------
  // GET /inventory/stocktakes
  // -------------------------------------------------------------------------
  app.get("/inventory/stocktakes", async (request, reply) => {
    const access = await requireTenantPermission(request, reply, PERMISSION, PERMISSION_MSG);
    if (!access) return;

    const stocktakes = await listStocktakes(access.tenantId);
    return ok({ stocktakes });
  });

  // -------------------------------------------------------------------------
  // POST /inventory/stocktakes
  // -------------------------------------------------------------------------
  app.post("/inventory/stocktakes", async (request, reply) => {
    const access = await requireTenantPermission(request, reply, PERMISSION, PERMISSION_MSG);
    if (!access) return;

    const body = parseOrThrow(CreateStocktakeSchema, request.body);

    const stocktake = await createStocktake(access.tenantId, access.actorUserId, body.warehouseId);
    return reply.code(201).send(ok({ stocktake }));
  });

  // -------------------------------------------------------------------------
  // POST /inventory/stocktakes/:stocktakeId/complete
  // -------------------------------------------------------------------------
  app.post("/inventory/stocktakes/:stocktakeId/complete", async (request, reply) => {
    const access = await requireTenantPermission(request, reply, PERMISSION, PERMISSION_MSG);
    if (!access) return;

    const { stocktakeId } = request.params as { stocktakeId: string };
    const body = parseOrThrow(CompleteStocktakeSchema, request.body);

    const stocktake = await completeStocktake(access.tenantId, access.actorUserId, stocktakeId, body.varianceCount);

    if (!stocktake) {
      return reply.code(404).send(fail("Stocktake not found or already completed."));
    }

    return ok({ stocktake });
  });
}
