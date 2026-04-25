import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { hasPermission } from "@sqb/domain-types";
import { demoBankTenantHealth } from "@sqb/domain-types";
import { resolveRequestAuth } from "../../lib/permissions.js";
import { ok, paginated, fail } from "../../lib/envelope.js";
import { uploadDocument, getDocumentUrl, isStorageAvailable } from "../../lib/storage.js";
import { computeRiskScore } from "./risk.js";
import {
  appendAuditLog,
  advanceApplicationStep,
  createApplication,
  createDecision,
  createDocument,
  getApplication,
  getLatestRiskScore,
  listApplications,
  listDecisions,
  listDocuments,
  saveRiskScore,
  submitApplication,
  updateApplicationStatus
} from "./store.js";

async function requireCreditApply(request: FastifyRequest, reply: FastifyReply) {
  const auth = await resolveRequestAuth(request);
  if (!auth.isAuthenticated || !auth.session) {
    reply.code(401).send(fail("Authenticated session required."));
    return null;
  }
  if (!auth.tenantId) {
    reply.code(400).send(fail("Tenant-scoped session required for credit applications."));
    return null;
  }
  if (!hasPermission(auth.permissions, "credit.apply")) {
    reply.code(403).send(fail("Credit application access requires credit.apply permission."));
    return null;
  }
  return { tenantId: auth.tenantId, actorUserId: auth.actorUserId, actorRole: auth.actorRole };
}

async function requireCreditReview(request: FastifyRequest, reply: FastifyReply) {
  const auth = await resolveRequestAuth(request);
  if (!auth.isAuthenticated || !auth.session) {
    reply.code(401).send(fail("Authenticated session required."));
    return null;
  }
  if (!hasPermission(auth.permissions, "credit.review")) {
    reply.code(403).send(fail("Credit review access requires credit.review permission."));
    return null;
  }
  return { actorUserId: auth.actorUserId, actorRole: auth.actorRole };
}

async function requireCreditManage(request: FastifyRequest, reply: FastifyReply) {
  const auth = await resolveRequestAuth(request);
  if (!auth.isAuthenticated || !auth.session) {
    reply.code(401).send(fail("Authenticated session required."));
    return null;
  }
  if (!hasPermission(auth.permissions, "credit.manage")) {
    reply.code(403).send(fail("Credit decision requires credit.manage permission."));
    return null;
  }
  return { actorUserId: auth.actorUserId, actorRole: auth.actorRole };
}

export async function creditModule(app: FastifyInstance) {
  // ── List applications (bank view — all; company view — own tenant) ─────────
  app.get("/credit/applications", async (request, reply) => {
    const auth = await resolveRequestAuth(request);
    if (!auth.isAuthenticated) {
      return reply.code(401).send(fail("Authenticated session required."));
    }

    const query = request.query as { status?: string; page?: string; pageSize?: string };
    const page = Number(query.page ?? 1);
    const pageSize = Number(query.pageSize ?? 20);

    let filter: { tenantId?: string; status?: string } = {};

    if (hasPermission(auth.permissions, "credit.review")) {
      if (query.status) filter.status = query.status;
    } else if (hasPermission(auth.permissions, "credit.apply") && auth.tenantId) {
      filter.tenantId = auth.tenantId;
      if (query.status) filter.status = query.status;
    } else {
      return reply.code(403).send(fail("Credit list access denied."));
    }

    const all = await listApplications(filter);
    const total = all.length;
    const data = all.slice((page - 1) * pageSize, page * pageSize);
    return paginated(data, page, pageSize, total);
  });

  // ── Get single application ────────────────────────────────────────────────
  app.get("/credit/applications/:id", async (request, reply) => {
    const auth = await resolveRequestAuth(request);
    if (!auth.isAuthenticated) return reply.code(401).send(fail("Authenticated session required."));

    const id = (request.params as { id: string }).id;
    const app_ = await getApplication(id);
    if (!app_) return reply.code(404).send(fail("Application not found."));

    const canReview = hasPermission(auth.permissions, "credit.review");
    const canApply = hasPermission(auth.permissions, "credit.apply") && auth.tenantId === app_.tenantId;
    if (!canReview && !canApply) return reply.code(403).send(fail("Access denied."));

    return ok(app_);
  });

  // ── Start new application (step 1) ───────────────────────────────────────
  app.post("/credit/applications", async (request, reply) => {
    const access = await requireCreditApply(request, reply);
    if (!access) return;

    const body = request.body as {
      businessName?: string;
      industry?: string;
      region?: string;
      tin?: string;
    };

    if (!body.businessName || !body.industry || !body.region || !body.tin) {
      return reply.code(400).send(fail("businessName, industry, region, and tin are required."));
    }

    const app_ = await createApplication(access.tenantId, {
      businessName: body.businessName,
      industry: body.industry,
      region: body.region,
      tin: body.tin
    });

    await appendAuditLog({
      actorUserId: access.actorUserId,
      actorRole: access.actorRole,
      tenantId: access.tenantId,
      category: "credit.application",
      action: "create",
      resourceType: "loan_application",
      resourceId: app_.id,
      metadata: { step: 1 }
    });

    return reply.code(201).send(ok(app_));
  });

  // ── Advance step (2 or 3) ─────────────────────────────────────────────────
  app.patch("/credit/applications/:id/step", async (request, reply) => {
    const access = await requireCreditApply(request, reply);
    if (!access) return;

    const id = (request.params as { id: string }).id;
    const current = await getApplication(id);
    if (!current) return reply.code(404).send(fail("Application not found."));
    if (current.tenantId !== access.tenantId) return reply.code(403).send(fail("Access denied."));
    if (current.status !== "draft") return reply.code(400).send(fail("Only draft applications can be edited."));

    const body = request.body as Record<string, unknown>;
    const updated = await advanceApplicationStep(id, current.step, body as never);
    return ok(updated);
  });

  // ── Submit application ────────────────────────────────────────────────────
  app.post("/credit/applications/:id/submit", async (request, reply) => {
    const access = await requireCreditApply(request, reply);
    if (!access) return;

    const id = (request.params as { id: string }).id;
    const app_ = await getApplication(id);
    if (!app_) return reply.code(404).send(fail("Application not found."));
    if (app_.tenantId !== access.tenantId) return reply.code(403).send(fail("Access denied."));
    if (app_.status !== "draft") return reply.code(400).send(fail("Application is not in draft state."));
    if (!app_.step3) return reply.code(400).send(fail("Financial data (step 3) must be completed before submitting."));

    const health = demoBankTenantHealth.find((h) => h.tenantId === app_.tenantId);
    const computed = computeRiskScore(app_.tenantId, app_.step3, health);
    await saveRiskScore(computed);

    const submitted = await submitApplication(id, computed.score, computed.band);

    await appendAuditLog({
      actorUserId: access.actorUserId,
      actorRole: access.actorRole,
      tenantId: access.tenantId,
      category: "credit.application",
      action: "submit",
      resourceType: "loan_application",
      resourceId: id,
      metadata: { riskScore: computed.score, riskBand: computed.band }
    });

    return ok(submitted);
  });

  // ── Upload document ───────────────────────────────────────────────────────
  app.post("/credit/applications/:id/documents", async (request, reply) => {
    const access = await requireCreditApply(request, reply);
    if (!access) return;

    const id = (request.params as { id: string }).id;
    const app_ = await getApplication(id);
    if (!app_) return reply.code(404).send(fail("Application not found."));
    if (app_.tenantId !== access.tenantId) return reply.code(403).send(fail("Access denied."));

    const data = await request.file?.();
    if (!data) return reply.code(400).send(fail("No file uploaded. Send multipart/form-data with a 'file' field."));

    const chunks: Buffer[] = [];
    for await (const chunk of data.file) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);

    const storageKey = `${app_.tenantId}/${id}/${Date.now()}-${data.filename}`;

    if (isStorageAvailable()) {
      await uploadDocument(storageKey, buffer, data.mimetype);
    }

    const doc = await createDocument({
      applicationId: id,
      filename: data.filename,
      mimeType: data.mimetype,
      storageKey,
      sizeBytes: buffer.length,
      uploadedBy: access.actorUserId
    });

    await appendAuditLog({
      actorUserId: access.actorUserId,
      actorRole: access.actorRole,
      tenantId: access.tenantId,
      category: "credit.document",
      action: "upload",
      resourceType: "loan_document",
      resourceId: doc.id,
      metadata: { filename: doc.filename, applicationId: id }
    });

    return reply.code(201).send(ok(doc));
  });

  // ── List documents ────────────────────────────────────────────────────────
  app.get("/credit/applications/:id/documents", async (request, reply) => {
    const auth = await resolveRequestAuth(request);
    if (!auth.isAuthenticated) return reply.code(401).send(fail("Authenticated session required."));

    const id = (request.params as { id: string }).id;
    const app_ = await getApplication(id);
    if (!app_) return reply.code(404).send(fail("Application not found."));

    const canReview = hasPermission(auth.permissions, "credit.review");
    const canApply = hasPermission(auth.permissions, "credit.apply") && auth.tenantId === app_.tenantId;
    if (!canReview && !canApply) return reply.code(403).send(fail("Access denied."));

    const docs = await listDocuments(id);
    return ok(docs);
  });

  // ── Get document download URL ─────────────────────────────────────────────
  app.get("/credit/applications/:id/documents/:docId/url", async (request, reply) => {
    const access = await requireCreditReview(request, reply);
    if (!access) return;

    const { id, docId } = request.params as { id: string; docId: string };
    const docs = await listDocuments(id);
    const doc = docs.find((d) => d.id === docId);
    if (!doc) return reply.code(404).send(fail("Document not found."));

    if (!isStorageAvailable()) {
      return ok({ url: null, note: "Storage not configured — running in demo mode." });
    }

    const url = await getDocumentUrl(doc.storageKey);
    return ok({ url });
  });

  // ── Record decision (approve/reject/escalate) ─────────────────────────────
  app.post("/credit/applications/:id/decision", async (request, reply) => {
    const access = await requireCreditManage(request, reply);
    if (!access) return;

    const id = (request.params as { id: string }).id;
    const app_ = await getApplication(id);
    if (!app_) return reply.code(404).send(fail("Application not found."));

    const validStatuses: string[] = ["submitted", "under_review", "escalated"];
    if (!validStatuses.includes(app_.status)) {
      return reply.code(400).send(fail(`Cannot decide on application in '${app_.status}' status.`));
    }

    const body = request.body as { decision?: string; reason?: string };
    const validDecisions = ["approved", "rejected", "escalated"];
    if (!body.decision || !validDecisions.includes(body.decision)) {
      return reply.code(400).send(fail("decision must be one of: approved, rejected, escalated."));
    }
    if (!body.reason?.trim()) {
      return reply.code(400).send(fail("reason is required."));
    }

    const decision = await createDecision({
      applicationId: id,
      decision: body.decision as CreditDecision["decision"],
      decidedBy: access.actorUserId,
      reason: body.reason
    });

    const statusMap: Record<string, string> = {
      approved: "approved",
      rejected: "rejected",
      escalated: "escalated"
    };
    await updateApplicationStatus(id, statusMap[body.decision] as never);

    await appendAuditLog({
      actorUserId: access.actorUserId,
      actorRole: access.actorRole,
      category: "credit.decision",
      action: body.decision,
      resourceType: "loan_application",
      resourceId: id,
      metadata: { reason: body.reason }
    });

    return reply.code(201).send(ok(decision));
  });

  // ── Get decisions for application ─────────────────────────────────────────
  app.get("/credit/applications/:id/decisions", async (request, reply) => {
    const access = await requireCreditReview(request, reply);
    if (!access) return;

    const id = (request.params as { id: string }).id;
    const decisions = await listDecisions(id);
    return ok(decisions);
  });

  // ── Get risk score for a tenant ───────────────────────────────────────────
  app.get("/credit/risk/:tenantId", async (request, reply) => {
    const access = await requireCreditReview(request, reply);
    if (!access) return;

    const { tenantId } = request.params as { tenantId: string };
    const score = await getLatestRiskScore(tenantId);

    await appendAuditLog({
      actorUserId: access.actorUserId,
      actorRole: access.actorRole,
      category: "credit.risk",
      action: "view",
      resourceType: "risk_score",
      resourceId: tenantId,
      metadata: {}
    });

    return ok(score);
  });

  // ── Force-compute risk score from financial data ──────────────────────────
  app.post("/credit/risk/:tenantId/compute", async (request, reply) => {
    const access = await requireCreditManage(request, reply);
    if (!access) return;

    const { tenantId } = request.params as { tenantId: string };
    const body = request.body as {
      annualRevenue?: number;
      annualExpenses?: number;
      totalAssets?: number;
      totalLiabilities?: number;
    };

    if (!body.annualRevenue || !body.annualExpenses || !body.totalAssets || !body.totalLiabilities) {
      return reply.code(400).send(fail("annualRevenue, annualExpenses, totalAssets, and totalLiabilities are required."));
    }

    const health = demoBankTenantHealth.find((h) => h.tenantId === tenantId);
    const computed = computeRiskScore(tenantId, {
      annualRevenue: body.annualRevenue,
      annualExpenses: body.annualExpenses,
      totalAssets: body.totalAssets,
      totalLiabilities: body.totalLiabilities
    }, health);

    const saved = await saveRiskScore(computed);

    await appendAuditLog({
      actorUserId: access.actorUserId,
      actorRole: access.actorRole,
      category: "credit.risk",
      action: "compute",
      resourceType: "risk_score",
      resourceId: tenantId,
      metadata: { score: computed.score, band: computed.band }
    });

    return ok(saved);
  });
}

// type-only import needed for cast in decision handler
type CreditDecision = import("@sqb/domain-types").CreditDecision;
