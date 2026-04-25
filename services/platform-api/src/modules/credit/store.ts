import type {
  CreditDecision,
  LoanApplication,
  LoanApplicationStep1,
  LoanApplicationStep2,
  LoanApplicationStep3,
  LoanApplicationStatus,
  LoanDocument,
  RiskBand,
  RiskScore
} from "@sqb/domain-types";
import {
  demoLoanApplications,
  demoCreditDecisions,
  demoRiskScores
} from "@sqb/domain-types";
import { getPrisma } from "../../lib/prisma.js";

// ── in-memory stores (fallback) ───────────────────────────────────────────────

const memApplications: LoanApplication[] = [...demoLoanApplications];
const memDecisions: CreditDecision[] = [...demoCreditDecisions];
const memDocuments: LoanDocument[] = [];
const memRiskScores: RiskScore[] = [...demoRiskScores];

function newId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ── helper: map Prisma row → domain type ─────────────────────────────────────

function mapApplication(row: Record<string, unknown>): LoanApplication {
  return {
    id: row.id as string,
    tenantId: row.tenantId as string,
    step: row.step as number,
    status: row.status as LoanApplicationStatus,
    step1: row.step1Json as LoanApplicationStep1 | undefined,
    step2: row.step2Json as LoanApplicationStep2 | undefined,
    step3: row.step3Json as LoanApplicationStep3 | undefined,
    riskScore: row.riskScore as number | undefined,
    riskBand: row.riskBand as RiskBand | undefined,
    submittedAt: row.submittedAt ? (row.submittedAt as Date).toISOString() : undefined,
    createdAt: (row.createdAt as Date).toISOString(),
    updatedAt: (row.updatedAt as Date).toISOString()
  };
}

function mapDecision(row: Record<string, unknown>): CreditDecision {
  return {
    id: row.id as string,
    applicationId: row.applicationId as string,
    decision: row.decision as CreditDecision["decision"],
    decidedBy: row.decidedBy as string,
    reason: row.reason as string,
    decidedAt: (row.decidedAt as Date).toISOString()
  };
}

// ── Applications ─────────────────────────────────────────────────────────────

export async function listApplications(filter?: { tenantId?: string; status?: string }): Promise<LoanApplication[]> {
  try {
    const rows = await getPrisma().loanApplication.findMany({
      where: {
        ...(filter?.tenantId ? { tenantId: filter.tenantId } : {}),
        ...(filter?.status ? { status: filter.status } : {})
      },
      orderBy: { createdAt: "desc" }
    });
    return rows.map((r: unknown) => mapApplication(r as Record<string, unknown>));
  } catch {
    let apps = [...memApplications];
    if (filter?.tenantId) apps = apps.filter((a) => a.tenantId === filter.tenantId);
    if (filter?.status) apps = apps.filter((a) => a.status === filter.status);
    return apps;
  }
}

export async function getApplication(id: string): Promise<LoanApplication | null> {
  try {
    const row = await getPrisma().loanApplication.findUnique({ where: { id } });
    return row ? mapApplication(row as unknown as Record<string, unknown>) : null;
  } catch {
    return memApplications.find((a) => a.id === id) ?? null;
  }
}

export async function createApplication(tenantId: string, step1: LoanApplicationStep1): Promise<LoanApplication> {
  try {
    const row = await getPrisma().loanApplication.create({
      data: { tenantId, step: 1, status: "draft", step1Json: step1 as object }
    });
    return mapApplication(row as unknown as Record<string, unknown>);
  } catch {
    const app: LoanApplication = {
      id: newId("loan_app"),
      tenantId,
      step: 1,
      status: "draft",
      step1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    memApplications.push(app);
    return app;
  }
}

export async function advanceApplicationStep(
  id: string,
  step: number,
  data: LoanApplicationStep1 | LoanApplicationStep2 | LoanApplicationStep3
): Promise<LoanApplication> {
  const fieldMap: Record<number, string> = { 1: "step1Json", 2: "step2Json", 3: "step3Json" };
  const field = fieldMap[step];

  try {
    const row = await getPrisma().loanApplication.update({
      where: { id },
      data: {
        step: step + 1,
        ...(field ? { [field]: data as object } : {})
      }
    });
    return mapApplication(row as unknown as Record<string, unknown>);
  } catch {
    const idx = memApplications.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error("Application not found.");
    const app = { ...memApplications[idx], step: step + 1, updatedAt: new Date().toISOString() };
    if (step === 1) app.step1 = data as LoanApplicationStep1;
    if (step === 2) app.step2 = data as LoanApplicationStep2;
    if (step === 3) app.step3 = data as LoanApplicationStep3;
    memApplications[idx] = app;
    return app;
  }
}

export async function submitApplication(
  id: string,
  riskScore: number,
  riskBand: RiskBand
): Promise<LoanApplication> {
  try {
    const row = await getPrisma().loanApplication.update({
      where: { id },
      data: { status: "submitted", step: 5, riskScore, riskBand, submittedAt: new Date() }
    });
    return mapApplication(row as unknown as Record<string, unknown>);
  } catch {
    const idx = memApplications.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error("Application not found.");
    const app = {
      ...memApplications[idx],
      status: "submitted" as LoanApplicationStatus,
      step: 5,
      riskScore,
      riskBand,
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    memApplications[idx] = app;
    return app;
  }
}

export async function updateApplicationStatus(
  id: string,
  status: LoanApplicationStatus
): Promise<LoanApplication> {
  try {
    const row = await getPrisma().loanApplication.update({
      where: { id },
      data: { status }
    });
    return mapApplication(row as unknown as Record<string, unknown>);
  } catch {
    const idx = memApplications.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error("Application not found.");
    const app = { ...memApplications[idx], status, updatedAt: new Date().toISOString() };
    memApplications[idx] = app;
    return app;
  }
}

// ── Documents ────────────────────────────────────────────────────────────────

export async function createDocument(doc: Omit<LoanDocument, "id" | "uploadedAt">): Promise<LoanDocument> {
  try {
    const row = await getPrisma().loanDocument.create({ data: { ...doc } });
    return {
      id: row.id,
      applicationId: row.applicationId,
      filename: row.filename,
      mimeType: row.mimeType,
      storageKey: row.storageKey,
      sizeBytes: row.sizeBytes,
      uploadedBy: row.uploadedBy,
      uploadedAt: row.uploadedAt.toISOString()
    };
  } catch {
    const document: LoanDocument = { ...doc, id: newId("doc"), uploadedAt: new Date().toISOString() };
    memDocuments.push(document);
    return document;
  }
}

export async function listDocuments(applicationId: string): Promise<LoanDocument[]> {
  try {
    const rows = await getPrisma().loanDocument.findMany({ where: { applicationId } });
    return rows.map((r: {
      id: string;
      applicationId: string;
      filename: string;
      mimeType: string;
      storageKey: string;
      sizeBytes: number;
      uploadedBy: string;
      uploadedAt: Date;
    }) => ({
      id: r.id,
      applicationId: r.applicationId,
      filename: r.filename,
      mimeType: r.mimeType,
      storageKey: r.storageKey,
      sizeBytes: r.sizeBytes,
      uploadedBy: r.uploadedBy,
      uploadedAt: r.uploadedAt.toISOString()
    }));
  } catch {
    return memDocuments.filter((d) => d.applicationId === applicationId);
  }
}

// ── Decisions ────────────────────────────────────────────────────────────────

export async function createDecision(decision: Omit<CreditDecision, "id" | "decidedAt">): Promise<CreditDecision> {
  try {
    const row = await getPrisma().creditDecision.create({ data: { ...decision } });
    return mapDecision(row as unknown as Record<string, unknown>);
  } catch {
    const d: CreditDecision = { ...decision, id: newId("decision"), decidedAt: new Date().toISOString() };
    memDecisions.push(d);
    return d;
  }
}

export async function listDecisions(applicationId: string): Promise<CreditDecision[]> {
  try {
    const rows = await getPrisma().creditDecision.findMany({ where: { applicationId }, orderBy: { decidedAt: "desc" } });
    return rows.map((r: unknown) => mapDecision(r as Record<string, unknown>));
  } catch {
    return memDecisions.filter((d) => d.applicationId === applicationId);
  }
}

// ── Risk Scores ──────────────────────────────────────────────────────────────

export async function saveRiskScore(score: Omit<RiskScore, "id">): Promise<RiskScore> {
  try {
    const row = await getPrisma().riskScore.create({
      data: {
        tenantId: score.tenantId,
        score: score.score,
        band: score.band,
        factorsJson: score.factors as object,
        computedAt: new Date(score.computedAt)
      }
    });
    return {
      id: row.id,
      tenantId: row.tenantId,
      score: row.score,
      band: row.band as RiskBand,
      factors: row.factorsJson as RiskScore["factors"],
      computedAt: row.computedAt.toISOString()
    };
  } catch {
    const saved: RiskScore = { ...score, id: newId("risk") };
    const idx = memRiskScores.findIndex((r: RiskScore) => r.tenantId === score.tenantId);
    if (idx >= 0) memRiskScores[idx] = saved;
    else memRiskScores.push(saved);
    return saved;
  }
}

export async function getLatestRiskScore(tenantId: string): Promise<RiskScore | null> {
  try {
    const row = await getPrisma().riskScore.findFirst({
      where: { tenantId },
      orderBy: { computedAt: "desc" }
    });
    if (!row) return null;
    return {
      id: row.id,
      tenantId: row.tenantId,
      score: row.score,
      band: row.band as RiskBand,
      factors: row.factorsJson as RiskScore["factors"],
      computedAt: row.computedAt.toISOString()
    };
  } catch {
    return memRiskScores.find((r) => r.tenantId === tenantId) ?? null;
  }
}

// ── Audit Logs ───────────────────────────────────────────────────────────────

export interface AuditLogEntry {
  actorUserId: string;
  actorRole: string;
  tenantId?: string;
  category: string;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata?: Record<string, unknown>;
}

export async function appendAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    await getPrisma().auditLog.create({
      data: {
        actorUserId: entry.actorUserId,
        actorRole: entry.actorRole,
        tenantId: entry.tenantId,
        category: entry.category,
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId,
        metadata: (entry.metadata ?? {}) as object
      }
    });
  } catch {
    // silently drop in demo mode — audit events are still emitted in-memory via auth store
  }
}

export async function queryAuditLogs(filter: {
  tenantId?: string;
  category?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ entries: AuditLogEntry[]; total: number; page: number; pageSize: number }> {
  const page = filter.page ?? 1;
  const pageSize = filter.pageSize ?? 50;

  try {
    const where = {
      ...(filter.tenantId ? { tenantId: filter.tenantId } : {}),
      ...(filter.category ? { category: filter.category } : {}),
      ...(filter.from || filter.to
        ? {
            occurredAt: {
              ...(filter.from ? { gte: new Date(filter.from) } : {}),
              ...(filter.to ? { lte: new Date(filter.to) } : {})
            }
          }
        : {})
    };

    const [rows, total] = await Promise.all([
      getPrisma().auditLog.findMany({
        where,
        orderBy: { occurredAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      getPrisma().auditLog.count({ where })
    ]);

    return {
      entries: rows.map((r: {
        actorUserId: string;
        actorRole: string;
        tenantId: string | null;
        category: string;
        action: string;
        resourceType: string;
        resourceId: string;
        metadata: unknown;
      }) => ({
        actorUserId: r.actorUserId,
        actorRole: r.actorRole,
        tenantId: r.tenantId ?? undefined,
        category: r.category,
        action: r.action,
        resourceType: r.resourceType,
        resourceId: r.resourceId,
        metadata: r.metadata as Record<string, unknown>
      })),
      total,
      page,
      pageSize
    };
  } catch {
    return { entries: [], total: 0, page, pageSize };
  }
}
