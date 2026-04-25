import type { FastifyInstance, FastifyReply } from "fastify";
import { requireTenantPermission } from "../../lib/permissions.js";
import { ok } from "../../lib/envelope.js";
import {
  listBOMs,
  createBOM,
  updateBOM,
  deleteBOM,
  listProductionOrders,
  createProductionOrder,
  updateProductionOrderStatus,
  listScrapRecords,
  createScrapRecord
} from "./store.js";
import {
  CreateBOMSchema,
  UpdateBOMSchema,
  CreateProductionOrderSchema,
  UpdateProductionOrderStatusSchema,
  CreateScrapRecordSchema,
  parseOrThrow
} from "./validation.js";
import type { ProductionOrder } from "@sqb/domain-types";

const PERMISSION = "production.manage" as const;
const DENY_MSG = "Production access is restricted to assigned production operators.";

function sendError(reply: FastifyReply, error: unknown) {
  const message = error instanceof Error ? error.message : "Production request failed.";
  const statusCode = message.toLowerCase().includes("not found") ? 404 : 400;
  return reply.code(statusCode).send({ data: null, meta: null, error: { message, errorCode: null } });
}

export async function productionModule(app: FastifyInstance) {
  // ── Dashboard overview: orders + boms + scrap summary ──────────────────
  app.get("/production/overview", async (request, reply) => {
    const access = await requireTenantPermission(request, reply, PERMISSION, DENY_MSG);
    if (!access) return;

    try {
      const [orders, boms, scrap] = await Promise.all([
        listProductionOrders(access.tenantId),
        listBOMs(access.tenantId),
        listScrapRecords(access.tenantId)
      ]);
      return ok({ orders, boms, scrap });
    } catch (error) {
      return sendError(reply, error);
    }
  });

  // ── BOMs ───────────────────────────────────────────────────────────────
  app.get("/production/boms", async (request, reply) => {
    const access = await requireTenantPermission(request, reply, PERMISSION, DENY_MSG);
    if (!access) return;

    try {
      return ok(await listBOMs(access.tenantId));
    } catch (error) {
      return sendError(reply, error);
    }
  });

  app.post("/production/boms", async (request, reply) => {
    const access = await requireTenantPermission(request, reply, PERMISSION, DENY_MSG);
    if (!access) return;

    try {
      const data = parseOrThrow(CreateBOMSchema, request.body);
      const bom = await createBOM(access.tenantId, access.actorUserId, data);
      return reply.code(201).send(ok(bom));
    } catch (error) {
      return sendError(reply, error);
    }
  });

  app.patch("/production/boms/:bomId", async (request, reply) => {
    const access = await requireTenantPermission(request, reply, PERMISSION, DENY_MSG);
    if (!access) return;

    try {
      const { bomId } = request.params as { bomId: string };
      const data = parseOrThrow(UpdateBOMSchema, request.body);
      const bom = await updateBOM(access.tenantId, access.actorUserId, bomId, data);
      if (!bom) {
        return reply.code(404).send({ data: null, meta: null, error: { message: "BOM not found.", errorCode: null } });
      }
      return ok(bom);
    } catch (error) {
      return sendError(reply, error);
    }
  });

  app.delete("/production/boms/:bomId", async (request, reply) => {
    const access = await requireTenantPermission(request, reply, PERMISSION, DENY_MSG);
    if (!access) return;

    try {
      const { bomId } = request.params as { bomId: string };
      const deleted = await deleteBOM(access.tenantId, bomId);
      if (!deleted) {
        return reply.code(404).send({ data: null, meta: null, error: { message: "BOM not found.", errorCode: null } });
      }
      return reply.code(204).send();
    } catch (error) {
      return sendError(reply, error);
    }
  });

  // ── Production Orders ──────────────────────────────────────────────────
  app.get("/production/orders", async (request, reply) => {
    const access = await requireTenantPermission(request, reply, PERMISSION, DENY_MSG);
    if (!access) return;

    try {
      const query = request.query as { status?: string };
      const validStatuses: ProductionOrder["status"][] = ["planned", "in_progress", "completed", "blocked"];
      const status =
        query.status && validStatuses.includes(query.status as ProductionOrder["status"])
          ? (query.status as ProductionOrder["status"])
          : undefined;

      return ok(await listProductionOrders(access.tenantId, status ? { status } : undefined));
    } catch (error) {
      return sendError(reply, error);
    }
  });

  app.post("/production/orders", async (request, reply) => {
    const access = await requireTenantPermission(request, reply, PERMISSION, DENY_MSG);
    if (!access) return;

    try {
      const data = parseOrThrow(CreateProductionOrderSchema, request.body);
      const order = await createProductionOrder(access.tenantId, access.actorUserId, data);
      return reply.code(201).send(ok(order));
    } catch (error) {
      return sendError(reply, error);
    }
  });

  app.patch("/production/orders/:orderId/status", async (request, reply) => {
    const access = await requireTenantPermission(request, reply, PERMISSION, DENY_MSG);
    if (!access) return;

    try {
      const { orderId } = request.params as { orderId: string };
      const data = parseOrThrow(UpdateProductionOrderStatusSchema, request.body);
      const order = await updateProductionOrderStatus(
        access.tenantId,
        access.actorUserId,
        orderId,
        data.status,
        data.producedUnits
      );
      if (!order) {
        return reply.code(404).send({ data: null, meta: null, error: { message: "Production order not found.", errorCode: null } });
      }
      return ok(order);
    } catch (error) {
      return sendError(reply, error);
    }
  });

  // ── Scrap Records ──────────────────────────────────────────────────────
  app.get("/production/scrap", async (request, reply) => {
    const access = await requireTenantPermission(request, reply, PERMISSION, DENY_MSG);
    if (!access) return;

    try {
      const query = request.query as { orderId?: string };
      return ok(await listScrapRecords(access.tenantId, query.orderId));
    } catch (error) {
      return sendError(reply, error);
    }
  });

  app.post("/production/scrap", async (request, reply) => {
    const access = await requireTenantPermission(request, reply, PERMISSION, DENY_MSG);
    if (!access) return;

    try {
      const data = parseOrThrow(CreateScrapRecordSchema, request.body);
      const record = await createScrapRecord(access.tenantId, access.actorUserId, data);
      return reply.code(201).send(ok(record));
    } catch (error) {
      return sendError(reply, error);
    }
  });
}
