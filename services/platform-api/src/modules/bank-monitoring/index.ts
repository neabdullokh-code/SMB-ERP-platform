import type { FastifyInstance } from "fastify";
import type { PortfolioAlert } from "@sqb/domain-types";
import type { CreditQueueFilters } from "./store.js";
import { fail, ok } from "../../lib/envelope.js";
import { requireGlobalPermission } from "../../lib/permissions.js";
import {
  assignCreditApplication,
  getBankPortfolioAnalytics,
  getCreditApplicationDetail,
  listBankPortfolio,
  listCreditQueue,
  recordCreditDecision
} from "./store.js";

function generateAlerts(tenants: Array<{
  tenantId: string;
  tenantName: string;
  healthTrend: "up" | "flat" | "down";
  creditScore: number;
  overdueServiceOrders: number;
  workflowBottlenecks: number;
}>): PortfolioAlert[] {
  const alerts: PortfolioAlert[] = [];
  const formatWorkflowBottleneckCount = (count: number) => {
    const abs = Math.abs(count);
    const mod10 = abs % 10;
    const mod100 = abs % 100;
    if (mod10 === 1 && mod100 !== 11) return "узкое место";
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "узких места";
    return "узких мест";
  };

  for (const tenant of tenants) {
    if (tenant.healthTrend === "down" && tenant.creditScore < 55) {
      const exists = alerts.some(
        (a) => a.tenantId === tenant.tenantId && a.type === "credit_score_drop"
      );
      if (!exists) {
        alerts.push({
          id: `alert_gen_${tenant.tenantId}_score`,
          tenantId: tenant.tenantId,
          tenantName: tenant.tenantName,
          severity: tenant.creditScore < 40 ? "critical" : "warn",
          type: "credit_score_drop",
          message: `Credit score at ${tenant.creditScore} — trending down.`,
          triggeredAt: new Date().toISOString()
        });
      }
    }

    if (tenant.overdueServiceOrders > 2) {
      const exists = alerts.some(
        (a) => a.tenantId === tenant.tenantId && a.type === "overdue_payments"
      );
      if (!exists) {
        alerts.push({
          id: `alert_gen_${tenant.tenantId}_overdue`,
          tenantId: tenant.tenantId,
          tenantName: tenant.tenantName,
          severity: "warn",
          type: "overdue_payments",
          message: `${tenant.overdueServiceOrders} overdue service orders detected.`,
          triggeredAt: new Date().toISOString()
        });
      }
    }

    if (tenant.workflowBottlenecks > 2) {
      const exists = alerts.some(
        (a) => a.tenantId === tenant.tenantId && a.type === "workflow_bottleneck"
      );
      if (!exists) {
        alerts.push({
          id: `alert_gen_${tenant.tenantId}_bottleneck`,
          tenantId: tenant.tenantId,
          tenantName: tenant.tenantName,
          severity: "info",
          type: "workflow_bottleneck",
          message: `Обнаружено ${tenant.workflowBottlenecks} ${formatWorkflowBottleneckCount(tenant.workflowBottlenecks)} в процессах, влияющих на операционную устойчивость.`,
          triggeredAt: new Date().toISOString()
        });
      }
    }
  }

  return alerts;
}

export async function bankMonitoringModule(app: FastifyInstance) {
  // ── Portfolio with health indicators ──────────────────────────────────────
  app.get("/bank/portfolio", async (request, reply) => {
    const auth = await requireGlobalPermission(
      request, reply, "bank.monitor",
      "Bank monitoring access is restricted to bank monitoring permissions."
    );
    if (!auth) return;

    const query = request.query as {
      q?: string;
      region?: string;
      inventoryRisk?: "low" | "moderate" | "high";
      trend?: "up" | "flat" | "down";
      sort?: "score_desc" | "score_asc" | "tenant";
    };

    const tenants = await listBankPortfolio({
      q: query.q,
      region: query.region,
      inventoryRisk: query.inventoryRisk,
      trend: query.trend,
      sort: query.sort
    });

    return ok({ tenants });
  });

  app.get("/bank/portfolio/analytics", async (request, reply) => {
    const auth = await requireGlobalPermission(
      request,
      reply,
      "bank.monitor",
      "Bank monitoring access is restricted to bank monitoring permissions."
    );
    if (!auth) return;

    const analytics = await getBankPortfolioAnalytics();
    return ok({ analytics });
  });

  // ── Active alerts ─────────────────────────────────────────────────────────
  app.get("/bank/portfolio/alerts", async (request, reply) => {
    if (!await requireGlobalPermission(request, reply, "bank.monitor", "Bank monitoring access required.")) return;

    const tenants = await listBankPortfolio();
    const alerts = generateAlerts(tenants);
    const query = request.query as { severity?: string };
    const filtered = query.severity
      ? alerts.filter((a) => a.severity === query.severity)
      : alerts;

    const severityRank: Record<string, number> = { critical: 0, warn: 1, info: 2 };
    return ok({
      alerts: filtered.sort((a, b) => (severityRank[a.severity] ?? 3) - (severityRank[b.severity] ?? 3)),
      summary: {
        critical: filtered.filter((a) => a.severity === "critical").length,
        warn: filtered.filter((a) => a.severity === "warn").length,
        info: filtered.filter((a) => a.severity === "info").length
      }
    });
  });

  // ── Single tenant health detail ───────────────────────────────────────────
  app.get("/bank/portfolio/:tenantId", async (request, reply) => {
    const auth = await requireGlobalPermission(
      request, reply, "bank.monitor",
      "Bank monitoring access required."
    );
    if (!auth) return;

    const { tenantId } = request.params as { tenantId: string };
    const tenant = (await listBankPortfolio()).find((entry) => entry.tenantId === tenantId);
    if (!tenant) return reply.code(404).send({ data: null, meta: null, error: { message: "Tenant not found." } });

    const alerts = generateAlerts([tenant]);

    return ok({ ...tenant, alerts });
  });

  app.get("/bank/credit-queue", async (request, reply) => {
    const auth = await requireGlobalPermission(
      request,
      reply,
      "credit.review",
      "Credit queue access is restricted to credit review permissions."
    );
    if (!auth) return;

    const query = request.query as {
      status?: CreditQueueFilters["status"];
      recommendation?: CreditQueueFilters["recommendation"];
      priority?: CreditQueueFilters["priority"];
      q?: string;
      sort?: CreditQueueFilters["sort"];
    };

    const applications = await listCreditQueue({
      status: query.status,
      recommendation: query.recommendation,
      priority: query.priority,
      q: query.q,
      sort: query.sort
    });

    return ok({ applications });
  });

  app.get("/bank/credit-queue/:id", async (request, reply) => {
    const auth = await requireGlobalPermission(
      request,
      reply,
      "credit.review",
      "Credit queue access is restricted to credit review permissions."
    );
    if (!auth) return;

    const { id } = request.params as { id: string };
    const application = await getCreditApplicationDetail(id);
    if (!application) {
      return reply.code(404).send(fail("Credit application not found."));
    }

    return ok({ application });
  });

  app.post("/bank/credit-queue/:id/assign", async (request, reply) => {
    const auth = await requireGlobalPermission(
      request,
      reply,
      "credit.review",
      "Credit assignment requires credit.review permission."
    );
    if (!auth) return;

    const { id } = request.params as { id: string };
    const body = request.body as { assignedBankUserId?: string };
    if (!body.assignedBankUserId?.trim()) {
      return reply.code(400).send(fail("assignedBankUserId is required."));
    }

    try {
      const application = await assignCreditApplication(id, body.assignedBankUserId, {
        actorUserId: auth.actorUserId,
        actorRole: auth.actorRole
      });
      return ok({ application });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to assign credit application.";
      if (message.toLowerCase().includes("not found")) {
        return reply.code(404).send(fail(message));
      }
      return reply.code(500).send(fail(message));
    }
  });

  app.post("/bank/credit-queue/:id/decision", async (request, reply) => {
    const auth = await requireGlobalPermission(
      request,
      reply,
      "credit.manage",
      "Credit decisions require credit.manage permission."
    );
    if (!auth) return;

    const { id } = request.params as { id: string };
    const body = request.body as {
      decision?: "approve" | "counter_offer" | "decline";
      approvedAmount?: string;
      approvedTermMonths?: number;
      approvedRatePercent?: string;
      notes?: string;
    };

    if (!body.decision) {
      return reply.code(400).send(fail("decision is required."));
    }

    try {
      const application = await recordCreditDecision(
        id,
        {
          decision: body.decision,
          approvedAmount: body.approvedAmount,
          approvedTermMonths: body.approvedTermMonths,
          approvedRatePercent: body.approvedRatePercent,
          notes: body.notes
        },
        {
          actorUserId: auth.actorUserId,
          actorRole: auth.actorRole
        }
      );
      return ok({ application });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to record credit decision.";
      if (message.toLowerCase().includes("not found")) {
        return reply.code(404).send(fail(message));
      }
      return reply.code(500).send(fail(message));
    }
  });
}
