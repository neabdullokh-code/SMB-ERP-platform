import type { FastifyInstance, FastifyReply } from "fastify";
import { requireTenantPermission } from "../../lib/permissions.js";
import { ok } from "../../lib/envelope.js";
import {
  listServiceOrders,
  getServiceOrder,
  createServiceOrder,
  updateServiceOrderStatus,
  listApprovals,
  processApproval
} from "./store.js";
import {
  CreateServiceOrderSchema,
  UpdateServiceOrderStatusSchema,
  ProcessApprovalSchema,
  parseOrThrow
} from "./validation.js";
import type { ApprovalRequest, ServiceOrder } from "@sqb/domain-types";

const SO_PERMISSION = "service_order.manage" as const;
const SO_DENY_MSG = "Service operations access is restricted to assigned operators.";

function sendError(reply: FastifyReply, error: unknown) {
  const message = error instanceof Error ? error.message : "Service order request failed.";
  const statusCode = message.toLowerCase().includes("not found") ? 404 : 400;
  return reply.code(statusCode).send({ data: null, meta: null, error: { message, errorCode: null } });
}

export async function serviceOrdersModule(app: FastifyInstance) {
  // ── Service Orders ─────────────────────────────────────────────────────

  app.get("/service-orders", async (request, reply) => {
    const access = await requireTenantPermission(request, reply, SO_PERMISSION, SO_DENY_MSG);
    if (!access) return;

    try {
      const query = request.query as { status?: string; q?: string };
      const validStatuses: ServiceOrder["status"][] = ["submitted", "approved", "in_progress", "completed", "rejected"];
      const status =
        query.status && validStatuses.includes(query.status as ServiceOrder["status"])
          ? (query.status as ServiceOrder["status"])
          : undefined;

      return ok(await listServiceOrders(access.tenantId, { status, q: query.q }));
    } catch (error) {
      return sendError(reply, error);
    }
  });

  app.post("/service-orders", async (request, reply) => {
    const access = await requireTenantPermission(request, reply, SO_PERMISSION, SO_DENY_MSG);
    if (!access) return;

    try {
      const data = parseOrThrow(CreateServiceOrderSchema, request.body);
      const order = await createServiceOrder(access.tenantId, access.actorUserId, data);
      return reply.code(201).send(ok(order));
    } catch (error) {
      return sendError(reply, error);
    }
  });

  app.get("/service-orders/:orderId", async (request, reply) => {
    const access = await requireTenantPermission(request, reply, SO_PERMISSION, SO_DENY_MSG);
    if (!access) return;

    try {
      const { orderId } = request.params as { orderId: string };
      const order = await getServiceOrder(access.tenantId, orderId);
      if (!order) {
        return reply.code(404).send({ data: null, meta: null, error: { message: "Service order not found.", errorCode: null } });
      }
      return ok(order);
    } catch (error) {
      return sendError(reply, error);
    }
  });

  app.patch("/service-orders/:orderId/status", async (request, reply) => {
    const access = await requireTenantPermission(request, reply, SO_PERMISSION, SO_DENY_MSG);
    if (!access) return;

    try {
      const { orderId } = request.params as { orderId: string };
      const data = parseOrThrow(UpdateServiceOrderStatusSchema, request.body);
      const order = await updateServiceOrderStatus(access.tenantId, access.actorUserId, orderId, data.status);
      if (!order) {
        return reply.code(404).send({ data: null, meta: null, error: { message: "Service order not found.", errorCode: null } });
      }
      return ok(order);
    } catch (error) {
      return sendError(reply, error);
    }
  });

  // ── Workflows / Approvals ──────────────────────────────────────────────

  app.get("/workflows/pending", async (request, reply) => {
    const access = await requireTenantPermission(request, reply, SO_PERMISSION, SO_DENY_MSG);
    if (!access) return;

    try {
      return ok(await listApprovals(access.tenantId, { status: "pending" }));
    } catch (error) {
      return sendError(reply, error);
    }
  });

  app.get("/workflows/approvals", async (request, reply) => {
    const access = await requireTenantPermission(request, reply, SO_PERMISSION, SO_DENY_MSG);
    if (!access) return;

    try {
      const query = request.query as { status?: string; entityType?: string };
      const validStatuses: ApprovalRequest["status"][] = ["pending", "approved", "rejected"];
      const validEntityTypes: ApprovalRequest["entityType"][] = ["service_order", "transfer", "stock_adjustment"];

      const status =
        query.status && validStatuses.includes(query.status as ApprovalRequest["status"])
          ? (query.status as ApprovalRequest["status"])
          : undefined;
      const entityType =
        query.entityType && validEntityTypes.includes(query.entityType as ApprovalRequest["entityType"])
          ? (query.entityType as ApprovalRequest["entityType"])
          : undefined;

      return ok(await listApprovals(access.tenantId, { status, entityType }));
    } catch (error) {
      return sendError(reply, error);
    }
  });

  app.post("/workflows/approvals/:approvalId/process", async (request, reply) => {
    const access = await requireTenantPermission(request, reply, SO_PERMISSION, SO_DENY_MSG);
    if (!access) return;

    try {
      const { approvalId } = request.params as { approvalId: string };
      const data = parseOrThrow(ProcessApprovalSchema, request.body);
      const approval = await processApproval(access.tenantId, access.actorUserId, approvalId, data.status);
      if (!approval) {
        return reply.code(404).send({ data: null, meta: null, error: { message: "Approval not found.", errorCode: null } });
      }
      return ok(approval);
    } catch (error) {
      return sendError(reply, error);
    }
  });
}
