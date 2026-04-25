import type { FastifyInstance } from "fastify";
import { hasPermission } from "@sqb/domain-types";
import { demoAuditEvents } from "@sqb/domain-types";
import { ok, paginated } from "../../lib/envelope.js";
import { resolveRequestAuth } from "../../lib/permissions.js";
import { listAuthAuditEvents } from "../auth/store.js";
import { appendAuditLog, queryAuditLogs } from "../credit/store.js";

export async function auditModule(app: FastifyInstance) {
  // ── Query audit events (in-memory fixtures + persistent DB) ──────────────
  app.get("/audit/events", async (request, reply) => {
    const auth = await resolveRequestAuth(request);
    if (!hasPermission(auth.permissions, "audit.read")) {
      return reply.code(403).send({ message: "Audit access is restricted to audit permissions." });
    }

    const query = request.query as {
      category?: string;
      from?: string;
      to?: string;
      page?: string;
      pageSize?: string;
    };

    const page = Number(query.page ?? 1);
    const pageSize = Number(query.pageSize ?? 50);

    // Try persistent log first
    const dbResult = await queryAuditLogs({
      tenantId: auth.tenantId,
      category: query.category,
      from: query.from,
      to: query.to,
      page,
      pageSize
    });

    if (dbResult.total > 0) {
      return paginated(dbResult.entries, dbResult.page, dbResult.pageSize, dbResult.total);
    }

    // Fall back to in-memory demo events
    let allEvents = [
      ...demoAuditEvents,
      ...listAuthAuditEvents()
    ];

    if (auth.tenantId) {
      allEvents = allEvents.filter((e) => e.tenantId === auth.tenantId);
    }
    if (query.category) {
      allEvents = allEvents.filter((e) => e.category === query.category);
    }
    if (query.from) {
      allEvents = allEvents.filter((e) => e.occurredAt >= query.from!);
    }
    if (query.to) {
      allEvents = allEvents.filter((e) => e.occurredAt <= query.to!);
    }

    const total = allEvents.length;
    const data = allEvents
      .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
      .slice((page - 1) * pageSize, page * pageSize);

    return paginated(data, page, pageSize, total);
  });

  // ── Append an audit event (internal — bank_admin or super_admin only) ─────
  app.post("/audit/events", async (request, reply) => {
    const auth = await resolveRequestAuth(request);
    if (!auth.isAuthenticated || !auth.session) {
      return reply.code(401).send({ message: "Authenticated session required." });
    }
    if (auth.actorRole !== "super_admin" && auth.actorRole !== "bank_admin") {
      return reply.code(403).send({ message: "Only bank staff may append audit events directly." });
    }

    const body = request.body as {
      category?: string;
      action?: string;
      resourceType?: string;
      resourceId?: string;
      tenantId?: string;
      metadata?: Record<string, unknown>;
    };

    if (!body.category || !body.action || !body.resourceType || !body.resourceId) {
      return reply.code(400).send({ message: "category, action, resourceType, and resourceId are required." });
    }

    await appendAuditLog({
      actorUserId: auth.actorUserId,
      actorRole: auth.actorRole,
      tenantId: body.tenantId,
      category: body.category,
      action: body.action,
      resourceType: body.resourceType,
      resourceId: body.resourceId,
      metadata: body.metadata
    });

    return reply.code(201).send(ok({ appended: true }));
  });

  // ── Break-glass events ────────────────────────────────────────────────────
  app.get("/audit/break-glass", async (request, reply) => {
    const auth = await resolveRequestAuth(request);
    if (auth.actorRole !== "super_admin" || !hasPermission(auth.permissions, "audit.read")) {
      return reply.code(403).send({ message: "Forbidden", errorCode: "FORBIDDEN" });
    }

    const breakGlassEvents = listAuthAuditEvents().filter(
      (event) => event.category === "auth.break_glass"
    );

    return { events: breakGlassEvents };
  });
}
