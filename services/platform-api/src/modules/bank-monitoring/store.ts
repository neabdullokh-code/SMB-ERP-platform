import type {
  BankPortfolioAnalytics,
  BankScoreFactor,
  BankTenantHealth,
  CreditApplicationDetail,
  CreditQueueDecision,
  CreditDecisionRequest,
  CreditQueueItem,
  CreditRecommendation,
  Role,
  TenantFinanceSnapshot
} from "@sqb/domain-types";
import type { PoolClient } from "pg";
import { fixtures } from "../../lib/fixtures.js";
import { withDb } from "../../lib/db.js";
import { insertAuditEventWithClient } from "../audit/store.js";
import { getTenantFinanceSnapshot } from "../finance/store.js";

const SCORE_VERSION = "risk_v1";

export type BankPortfolioFilters = {
  q?: string;
  region?: string;
  inventoryRisk?: BankTenantHealth["inventoryRisk"];
  trend?: BankTenantHealth["healthTrend"];
  sort?: "score_desc" | "score_asc" | "tenant";
};

export type CreditQueueFilters = {
  status?: CreditQueueItem["status"];
  recommendation?: CreditRecommendation;
  priority?: CreditQueueItem["priority"];
  q?: string;
  sort?: "submitted_desc" | "score_desc" | "tenant";
};

type TenantProjectionRow = {
  tenant_id: string;
  tenant_name: string;
  industry: string;
  region: string;
};

type BankTenantHealthRow = {
  tenant_id: string;
  tenant_name: string;
  industry: string;
  region: string;
  credit_score: number;
  inventory_risk: BankTenantHealth["inventoryRisk"];
  workflow_bottlenecks: number;
  overdue_service_orders: number;
  health_trend: BankTenantHealth["healthTrend"];
  score_version: string;
  score_factors: BankScoreFactor[];
  recommended_action: CreditRecommendation;
  default_risk_percent: string;
  expected_return_percent: string;
  refreshed_at: string;
};

type CreditQueueRow = {
  id: string;
  tenant_id: string;
  tenant_name: string;
  industry: string;
  region: string;
  status: CreditQueueItem["status"];
  submitted_at: string;
  product: string;
  purpose: string;
  requested_amount: string;
  requested_term_months: number;
  priority: CreditQueueItem["priority"];
  ai_recommendation: CreditRecommendation;
  ai_rationale: string;
  score_snapshot: number;
  score_version: string;
  assigned_bank_user_id: string | null;
  assigned_bank_user_name: string | null;
  last_reviewed_at: string | null;
};

type CreditApplicationRow = CreditQueueRow & {
  approved_amount: string | null;
  approved_term_months: number | null;
  approved_rate_percent: string | null;
  default_risk_percent: string | null;
  expected_return_percent: string | null;
  score_factors: BankScoreFactor[] | null;
};

type CreditDecisionRow = {
  id: string;
  application_id: string;
  decision: "approve" | "counter_offer" | "decline";
  notes: string | null;
  approved_amount: string | null;
  approved_term_months: number | null;
  approved_rate_percent: string | null;
  actor_user_id: string;
  actor_name: string | null;
  actor_role: string;
  created_at: string;
};

type CreditDocumentRow = {
  id: string;
  application_id: string;
  name: string;
  status: "available" | "missing";
  source_type: "auto_pulled" | "uploaded";
};

function moneyToNumber(value?: string | null) {
  const parsed = Number.parseFloat(value ?? "0");
  return Number.isFinite(parsed) ? parsed : 0;
}

function moneyText(value: number) {
  return value.toFixed(2);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function formatPercent(value: number) {
  return clamp(value, 0, 100).toFixed(2);
}

function formatSignedMoney(value: number) {
  return `${value < 0 ? "-" : ""}${Math.abs(value).toFixed(2)}`;
}

function recommendationForScore(score: number): CreditRecommendation {
  if (score >= 80) return "approve";
  if (score >= 60) return "review";
  return "decline";
}

function defaultRiskPercentForScore(score: number) {
  if (score >= 80) return "2.10";
  if (score >= 60) return "6.80";
  return "14.20";
}

function expectedReturnPercentForScore(score: number) {
  if (score >= 80) return "16.20";
  if (score >= 60) return "13.40";
  return "8.40";
}

function deriveInventoryRisk(snapshot: TenantFinanceSnapshot | null, fallback?: BankTenantHealth) {
  if (!snapshot) {
    return fallback?.inventoryRisk ?? "moderate";
  }

  const outstanding = moneyToNumber(snapshot.arOutstanding);
  const overdue = moneyToNumber(snapshot.arOverdue);
  const collectionRate = moneyToNumber(snapshot.invoiceCollectionRate);
  const overdueRatio = outstanding > 0 ? overdue / outstanding : 0;

  if (overdueRatio >= 0.35 || collectionRate < 60) return "high" as const;
  if (overdueRatio >= 0.15 || collectionRate < 82) return "moderate" as const;
  return "low" as const;
}

function deriveHealthTrend(snapshot: TenantFinanceSnapshot | null, fallback?: BankTenantHealth) {
  if (!snapshot) {
    return fallback?.healthTrend ?? "flat";
  }

  const revenues = snapshot.lastThreeMonthRevenue.map((point) => moneyToNumber(point.revenue));
  const netCash = moneyToNumber(snapshot.monthlyNetCashFlow);

  if (revenues.length >= 2) {
    const first = revenues[0] ?? 0;
    const last = revenues[revenues.length - 1] ?? 0;
    if (last > first && netCash >= 0) return "up" as const;
    if (last < first || netCash < 0) return "down" as const;
  }

  return "flat" as const;
}

function deriveWorkflowBottlenecks(score: number, fallback?: BankTenantHealth) {
  if (score < 55) return 3;
  if (score < 70) return 2;
  if (score < 85) return 1;
  return fallback?.workflowBottlenecks ?? 0;
}

function deriveOverdueServiceOrders(score: number, fallback?: BankTenantHealth) {
  if (score < 55) return 2;
  if (score < 70) return 1;
  return fallback?.overdueServiceOrders ?? 0;
}

function deriveScore(snapshot: TenantFinanceSnapshot | null, fallback?: BankTenantHealth) {
  if (!snapshot) {
    return fallback?.creditScore ?? 72;
  }

  let score = 82;
  const factors: BankScoreFactor[] = [];

  const outstanding = moneyToNumber(snapshot.arOutstanding);
  const overdue = moneyToNumber(snapshot.arOverdue);
  const overdueRatio = outstanding > 0 ? (overdue / outstanding) * 100 : 0;
  if (overdueRatio >= 35) {
    score -= 20;
    factors.push({ key: "ar_overdue_ratio", label: "AR overdue ratio", impact: -20, value: `${overdueRatio.toFixed(2)}%`, tone: "bad" });
  } else if (overdueRatio >= 15) {
    score -= 10;
    factors.push({ key: "ar_overdue_ratio", label: "AR overdue ratio", impact: -10, value: `${overdueRatio.toFixed(2)}%`, tone: "warn" });
  } else {
    factors.push({ key: "ar_overdue_ratio", label: "AR overdue ratio", impact: 0, value: `${overdueRatio.toFixed(2)}%`, tone: "good" });
  }

  const collectionRate = moneyToNumber(snapshot.invoiceCollectionRate);
  if (collectionRate < 60) {
    score -= 16;
    factors.push({ key: "invoice_collection", label: "Invoice collection", impact: -16, value: `${collectionRate.toFixed(2)}%`, tone: "bad" });
  } else if (collectionRate < 80) {
    score -= 8;
    factors.push({ key: "invoice_collection", label: "Invoice collection", impact: -8, value: `${collectionRate.toFixed(2)}%`, tone: "warn" });
  } else {
    factors.push({ key: "invoice_collection", label: "Invoice collection", impact: 0, value: `${collectionRate.toFixed(2)}%`, tone: "good" });
  }

  const punctuality = moneyToNumber(snapshot.billPaymentPunctuality);
  if (punctuality < 60) {
    score -= 12;
    factors.push({ key: "bill_punctuality", label: "Bill punctuality", impact: -12, value: `${punctuality.toFixed(2)}%`, tone: "bad" });
  } else if (punctuality < 85) {
    score -= 6;
    factors.push({ key: "bill_punctuality", label: "Bill punctuality", impact: -6, value: `${punctuality.toFixed(2)}%`, tone: "warn" });
  } else {
    factors.push({ key: "bill_punctuality", label: "Bill punctuality", impact: 0, value: `${punctuality.toFixed(2)}%`, tone: "good" });
  }

  const netCash = moneyToNumber(snapshot.monthlyNetCashFlow);
  if (netCash < 0) {
    score -= 12;
    factors.push({ key: "net_cash_flow", label: "Monthly net cash flow", impact: -12, value: formatSignedMoney(netCash), tone: "bad" });
  } else {
    factors.push({ key: "net_cash_flow", label: "Monthly net cash flow", impact: 0, value: formatSignedMoney(netCash), tone: "good" });
  }

  const revenues = snapshot.lastThreeMonthRevenue.map((point) => moneyToNumber(point.revenue));
  if (revenues.length >= 2) {
    const first = revenues[0] ?? 0;
    const last = revenues[revenues.length - 1] ?? 0;
    if (last < first) {
      score -= 10;
      factors.push({ key: "revenue_trend", label: "Revenue trend", impact: -10, value: "down", tone: "bad" });
    } else if (last === first) {
      score -= 4;
      factors.push({ key: "revenue_trend", label: "Revenue trend", impact: -4, value: "flat", tone: "warn" });
    } else {
      factors.push({ key: "revenue_trend", label: "Revenue trend", impact: 0, value: "up", tone: "good" });
    }
  }

  return {
    score: clamp(Math.round(score), 35, 98),
    factors
  };
}

async function loadProjectionTenants() {
  return withDb(async (pool) => {
    const result = await pool.query<TenantProjectionRow>(
      `select
         t.id as tenant_id,
         t.name as tenant_name,
         coalesce(p.business_type, 'General business') as industry,
         coalesce(p.region, 'Unknown') as region
       from tenants t
       left join tenant_profiles p on p.tenant_id = t.id
       where t.status = 'active'
       order by t.name asc`
    );

    return result.rows;
  });
}

async function buildProjection(tenant: TenantProjectionRow) {
  const fallback = fixtures.bankTenantHealth.find((entry) => entry.tenantId === tenant.tenant_id)
    ?? fixtures.bankTenantHealth.find((entry) => entry.tenantName.toLowerCase() === tenant.tenant_name.toLowerCase());

  let snapshot: TenantFinanceSnapshot | null = null;
  try {
    snapshot = await getTenantFinanceSnapshot(tenant.tenant_id);
  } catch {
    snapshot = null;
  }

  const derived = deriveScore(snapshot, fallback);
  const score = typeof derived === "number" ? derived : derived.score;
  const factors = typeof derived === "number" ? fallback?.scoreFactors ?? [] : derived.factors;

  return {
    tenantId: tenant.tenant_id,
    tenantName: tenant.tenant_name,
    industry: tenant.industry,
    region: tenant.region,
    creditScore: score,
    inventoryRisk: deriveInventoryRisk(snapshot, fallback),
    workflowBottlenecks: deriveWorkflowBottlenecks(score, fallback),
    overdueServiceOrders: deriveOverdueServiceOrders(score, fallback),
    healthTrend: deriveHealthTrend(snapshot, fallback),
    scoreVersion: SCORE_VERSION,
    scoreFactors: factors,
    recommendedAction: recommendationForScore(score),
    defaultRiskPercent: defaultRiskPercentForScore(score),
    expectedReturnPercent: expectedReturnPercentForScore(score),
    refreshedAt: snapshot?.refreshedAt ?? new Date().toISOString()
  } satisfies BankTenantHealth;
}

function mapBankTenantHealthRow(row: BankTenantHealthRow): BankTenantHealth {
  return {
    tenantId: row.tenant_id,
    tenantName: row.tenant_name,
    industry: row.industry,
    region: row.region,
    creditScore: row.credit_score,
    inventoryRisk: row.inventory_risk,
    workflowBottlenecks: row.workflow_bottlenecks,
    overdueServiceOrders: row.overdue_service_orders,
    healthTrend: row.health_trend,
    scoreVersion: row.score_version,
    scoreFactors: row.score_factors ?? [],
    recommendedAction: row.recommended_action,
    defaultRiskPercent: row.default_risk_percent,
    expectedReturnPercent: row.expected_return_percent,
    refreshedAt: row.refreshed_at
  };
}

function mapCreditQueueRow(row: CreditQueueRow): CreditQueueItem {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    tenantName: row.tenant_name,
    status: row.status,
    submittedAt: row.submitted_at,
    product: row.product,
    purpose: row.purpose,
    requestedAmount: row.requested_amount,
    requestedTermMonths: row.requested_term_months,
    priority: row.priority,
    aiRecommendation: row.ai_recommendation,
    aiRationale: row.ai_rationale,
    scoreSnapshot: row.score_snapshot,
    scoreVersion: row.score_version,
    assignedBankUserId: row.assigned_bank_user_id ?? undefined,
    assignedBankUserName: row.assigned_bank_user_name ?? undefined,
    lastReviewedAt: row.last_reviewed_at ?? undefined,
    industry: row.industry,
    region: row.region
  };
}

function applyPortfolioFilters(tenants: BankTenantHealth[], filters: BankPortfolioFilters) {
  const q = filters.q?.trim().toLowerCase();
  const filtered = tenants.filter((tenant) => {
    if (filters.region && tenant.region.toLowerCase() !== filters.region.trim().toLowerCase()) return false;
    if (filters.inventoryRisk && tenant.inventoryRisk !== filters.inventoryRisk) return false;
    if (filters.trend && tenant.healthTrend !== filters.trend) return false;

    if (q) {
      const haystack = [
        tenant.tenantName,
        tenant.industry,
        tenant.region,
        tenant.inventoryRisk,
        tenant.healthTrend,
        tenant.recommendedAction
      ].join(" ").toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    return true;
  });

  if (filters.sort === "score_asc") return filtered.sort((a, b) => a.creditScore - b.creditScore);
  if (filters.sort === "tenant") return filtered.sort((a, b) => a.tenantName.localeCompare(b.tenantName));
  return filtered.sort((a, b) => b.creditScore - a.creditScore);
}

function applyCreditQueueFilters(items: CreditQueueItem[], filters: CreditQueueFilters) {
  const q = filters.q?.trim().toLowerCase();

  const filtered = items.filter((item) => {
    if (filters.status && item.status !== filters.status) return false;
    if (filters.recommendation && item.aiRecommendation !== filters.recommendation) return false;
    if (filters.priority && item.priority !== filters.priority) return false;

    if (q) {
      const haystack = [
        item.tenantName,
        item.product,
        item.purpose,
        item.industry,
        item.region,
        item.aiRecommendation
      ].join(" ").toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    return true;
  });

  if (filters.sort === "tenant") return filtered.sort((a, b) => a.tenantName.localeCompare(b.tenantName));
  if (filters.sort === "score_desc") return filtered.sort((a, b) => b.scoreSnapshot - a.scoreSnapshot);

  return filtered.sort((a, b) => {
    if (a.priority !== b.priority) {
      return a.priority === "high" ? -1 : 1;
    }
    return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
  });
}

async function upsertProjection(client: PoolClient, projection: BankTenantHealth) {
  await client.query(
    `insert into bank_tenant_health (
       tenant_id,
       credit_score,
       inventory_risk,
       workflow_bottlenecks,
       overdue_service_orders,
       health_trend,
       industry,
       region,
       score_version,
       score_factors,
       recommended_action,
       default_risk_percent,
       expected_return_percent,
       refreshed_at
     ) values (
       $1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11, $12, $13, $14
     )
     on conflict (tenant_id) do update
     set
       credit_score = excluded.credit_score,
       inventory_risk = excluded.inventory_risk,
       workflow_bottlenecks = excluded.workflow_bottlenecks,
       overdue_service_orders = excluded.overdue_service_orders,
       health_trend = excluded.health_trend,
       industry = excluded.industry,
       region = excluded.region,
       score_version = excluded.score_version,
       score_factors = excluded.score_factors,
       recommended_action = excluded.recommended_action,
       default_risk_percent = excluded.default_risk_percent,
       expected_return_percent = excluded.expected_return_percent,
       refreshed_at = excluded.refreshed_at`,
    [
      projection.tenantId,
      projection.creditScore,
      projection.inventoryRisk,
      projection.workflowBottlenecks,
      projection.overdueServiceOrders,
      projection.healthTrend,
      projection.industry,
      projection.region,
      projection.scoreVersion,
      JSON.stringify(projection.scoreFactors),
      projection.recommendedAction,
      projection.defaultRiskPercent,
      projection.expectedReturnPercent,
      projection.refreshedAt
    ]
  );
}

async function readBankPortfolioRows() {
  return withDb(async (pool) => {
    const result = await pool.query<BankTenantHealthRow>(
      `select
         bth.tenant_id,
         t.name as tenant_name,
         bth.industry,
         bth.region,
         bth.credit_score,
         bth.inventory_risk,
         bth.workflow_bottlenecks,
         bth.overdue_service_orders,
         bth.health_trend,
         bth.score_version,
         bth.score_factors,
         bth.recommended_action,
         bth.default_risk_percent::text,
         bth.expected_return_percent::text,
         bth.refreshed_at::text
       from bank_tenant_health bth
       join tenants t on t.id = bth.tenant_id
       where t.status = 'active'
       order by bth.credit_score desc, t.name asc`
    );

    return result.rows.map(mapBankTenantHealthRow);
  });
}

export async function refreshBankTenantHealthProjections() {
  const tenants = await loadProjectionTenants();
  if (!tenants || tenants.length === 0) {
    return [] as BankTenantHealth[];
  }

  const projections = await Promise.all(tenants.map(buildProjection));

  await withDb(async (pool) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      for (const projection of projections) {
        await upsertProjection(client, projection);
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
    return true;
  });

  return projections;
}

export async function listBankPortfolio(filters: BankPortfolioFilters = {}) {
  let portfolio = await readBankPortfolioRows();

  if (portfolio && portfolio.length === 0) {
    await refreshBankTenantHealthProjections();
    portfolio = await readBankPortfolioRows();
  }

  if (portfolio === null) {
    return applyPortfolioFilters([...fixtures.bankTenantHealth], filters);
  }

  return applyPortfolioFilters(portfolio, filters);
}

export async function getBankPortfolioAnalytics() {
  const [portfolio, queue] = await Promise.all([
    listBankPortfolio(),
    listCreditQueue()
  ]);

  if (portfolio.length === 0) {
    return {
      totalTenants: 0,
      highRiskCount: 0,
      averageCreditScore: 0,
      recommendationCounts: { approve: 0, review: 0, decline: 0 },
      riskBuckets: { low: 0, moderate: 0, high: 0 },
      slaHealthPercent: 100,
      lastRefreshedAt: null
    } satisfies BankPortfolioAnalytics;
  }

  const recommendationCounts: Record<CreditRecommendation, number> = { approve: 0, review: 0, decline: 0 };
  const riskBuckets: Record<BankTenantHealth["inventoryRisk"], number> = { low: 0, moderate: 0, high: 0 };

  for (const tenant of portfolio) {
    recommendationCounts[tenant.recommendedAction] += 1;
    riskBuckets[tenant.inventoryRisk] += 1;
  }

  const pending = queue.filter((item) => item.status === "submitted" || item.status === "in_review");
  const withinSla = pending.filter((item) => Date.now() - new Date(item.submittedAt).getTime() <= 24 * 60 * 60 * 1000);

  return {
    totalTenants: portfolio.length,
    highRiskCount: portfolio.filter((tenant) => tenant.inventoryRisk === "high").length,
    averageCreditScore: Number((portfolio.reduce((sum, tenant) => sum + tenant.creditScore, 0) / portfolio.length).toFixed(1)),
    recommendationCounts,
    riskBuckets,
    slaHealthPercent: pending.length === 0 ? 100 : Number(((withinSla.length / pending.length) * 100).toFixed(1)),
    lastRefreshedAt: portfolio
      .map((tenant) => tenant.refreshedAt)
      .sort((left, right) => new Date(right).getTime() - new Date(left).getTime())[0] ?? null
  } satisfies BankPortfolioAnalytics;
}

export async function listCreditQueue(filters: CreditQueueFilters = {}) {
  const result = await withDb(async (pool) => {
    const response = await pool.query<CreditQueueRow>(
      `select
         ca.id,
         ca.tenant_id,
         t.name as tenant_name,
         coalesce(tp.business_type, 'General business') as industry,
         coalesce(tp.region, 'Unknown') as region,
         ca.status,
         ca.submitted_at::text,
         ca.product,
         ca.purpose,
         ca.requested_amount::text,
         ca.requested_term_months,
         ca.priority,
         ca.ai_recommendation,
         ca.ai_rationale,
         ca.score_snapshot,
         ca.score_version,
         ca.assigned_bank_user_id,
         bank_user.full_name as assigned_bank_user_name,
         ca.last_reviewed_at::text
       from credit_applications ca
       join tenants t on t.id = ca.tenant_id
       left join tenant_profiles tp on tp.tenant_id = ca.tenant_id
       left join users bank_user on bank_user.id = ca.assigned_bank_user_id`
    );

    return response.rows.map(mapCreditQueueRow);
  });

  if (result === null) {
    return [] as CreditQueueItem[];
  }

  return applyCreditQueueFilters(result, filters);
}

export async function getCreditApplicationDetail(applicationId: string) {
  const result = await withDb(async (pool) => {
    const application = await pool.query<CreditApplicationRow>(
      `select
         ca.id,
         ca.tenant_id,
         t.name as tenant_name,
         coalesce(tp.business_type, 'General business') as industry,
         coalesce(tp.region, 'Unknown') as region,
         ca.status,
         ca.submitted_at::text,
         ca.product,
         ca.purpose,
         ca.requested_amount::text,
         ca.requested_term_months,
         ca.approved_amount::text,
         ca.approved_term_months,
         ca.approved_rate_percent::text,
         ca.priority,
         ca.ai_recommendation,
         ca.ai_rationale,
         ca.score_snapshot,
         ca.score_version,
         ca.assigned_bank_user_id,
         bank_user.full_name as assigned_bank_user_name,
         ca.last_reviewed_at::text,
         bth.default_risk_percent::text,
         bth.expected_return_percent::text,
         bth.score_factors
       from credit_applications ca
       join tenants t on t.id = ca.tenant_id
       left join tenant_profiles tp on tp.tenant_id = ca.tenant_id
       left join users bank_user on bank_user.id = ca.assigned_bank_user_id
       left join bank_tenant_health bth on bth.tenant_id = ca.tenant_id
       where ca.id = $1`,
      [applicationId]
    );

    const row = application.rows[0];
    if (!row) return null;

    const [documentsResult, decisionsResult] = await Promise.all([
      pool.query<CreditDocumentRow>(
        `select id, application_id, name, status, source_type
         from credit_application_documents
         where application_id = $1
         order by created_at asc`,
        [applicationId]
      ),
      pool.query<CreditDecisionRow>(
        `select
           cd.id,
           cd.application_id,
           cd.decision,
           cd.notes,
           cd.approved_amount::text,
           cd.approved_term_months,
           cd.approved_rate_percent::text,
           cd.actor_user_id,
           u.full_name as actor_name,
           cd.actor_role,
           cd.created_at::text
         from credit_decisions cd
         join users u on u.id = cd.actor_user_id
         where cd.application_id = $1
         order by cd.created_at desc`,
        [applicationId]
      )
    ]);

    let financialSummary: CreditApplicationDetail["financialSummary"] = null;
    try {
      const snapshot = await getTenantFinanceSnapshot(row.tenant_id);
      financialSummary = {
        cashBalance: snapshot.cashBalance,
        arOutstanding: snapshot.arOutstanding,
        arOverdue: snapshot.arOverdue,
        apOutstanding: snapshot.apOutstanding,
        monthlyNetCashFlow: snapshot.monthlyNetCashFlow,
        invoiceCollectionRate: snapshot.invoiceCollectionRate,
        billPaymentPunctuality: snapshot.billPaymentPunctuality,
        revenuePoints: snapshot.lastThreeMonthRevenue
      };
    } catch {
      financialSummary = null;
    }

    return {
      ...mapCreditQueueRow(row),
      approvedAmount: row.approved_amount ?? undefined,
      approvedTermMonths: row.approved_term_months ?? undefined,
      approvedRatePercent: row.approved_rate_percent ?? undefined,
      defaultRiskPercent: row.default_risk_percent ?? "0.00",
      expectedReturnPercent: row.expected_return_percent ?? "0.00",
      scoreFactors: row.score_factors ?? [],
      documents: documentsResult.rows.map((document) => ({
        id: document.id,
        name: document.name,
        status: document.status,
        sourceType: document.source_type
      })),
      decisions: decisionsResult.rows.map((decision): CreditQueueDecision => ({
        id: decision.id,
        applicationId: decision.application_id,
        decision: decision.decision,
        notes: decision.notes ?? undefined,
        approvedAmount: decision.approved_amount ?? undefined,
        approvedTermMonths: decision.approved_term_months ?? undefined,
        approvedRatePercent: decision.approved_rate_percent ?? undefined,
        actorUserId: decision.actor_user_id,
        actorName: decision.actor_name ?? "Unknown",
        actorRole: decision.actor_role,
        createdAt: decision.created_at
      })),
      financialSummary
    } satisfies CreditApplicationDetail;
  });

  return result;
}

export async function assignCreditApplication(
  applicationId: string,
  assignedBankUserId: string,
  actor: { actorUserId: string; actorRole: Role }
) {
  return withDb(async (pool) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const existing = await client.query<{ id: string; tenant_id: string }>(
        `select id, tenant_id from credit_applications where id = $1`,
        [applicationId]
      );
      const application = existing.rows[0];
      if (!application) {
        throw new Error("Credit application not found.");
      }

      await client.query(
        `update credit_applications
         set assigned_bank_user_id = $2,
             status = case when status = 'submitted' then 'in_review' else status end,
             last_reviewed_at = now(),
             updated_at = now()
         where id = $1`,
        [applicationId, assignedBankUserId]
      );

      await insertAuditEventWithClient(client, {
        actorUserId: actor.actorUserId,
        actorRole: actor.actorRole,
        tenantId: application.tenant_id,
        category: "bank_monitoring",
        action: "credit_application_assigned",
        resourceType: "credit_application",
        resourceId: applicationId,
        metadata: {
          assignedBankUserId
        }
      });

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    return getCreditApplicationDetail(applicationId);
  });
}

export async function recordCreditDecision(
  applicationId: string,
  payload: CreditDecisionRequest,
  actor: { actorUserId: string; actorRole: Role }
) {
  return withDb(async (pool) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const existing = await client.query<{ id: string; tenant_id: string }>(
        `select id, tenant_id from credit_applications where id = $1`,
        [applicationId]
      );
      const application = existing.rows[0];
      if (!application) {
        throw new Error("Credit application not found.");
      }

      const statusMap: Record<CreditDecisionRequest["decision"], CreditQueueItem["status"]> = {
        approve: "approved",
        counter_offer: "counter_offered",
        decline: "declined"
      };

      await client.query(
        `update credit_applications
         set status = $2,
             approved_amount = $3,
             approved_term_months = $4,
             approved_rate_percent = $5,
             last_reviewed_at = now(),
             updated_at = now()
         where id = $1`,
        [
          applicationId,
          statusMap[payload.decision],
          payload.approvedAmount ?? null,
          payload.approvedTermMonths ?? null,
          payload.approvedRatePercent ?? null
        ]
      );

      await client.query(
        `insert into credit_decisions (
           application_id,
           actor_user_id,
           actor_role,
           decision,
           notes,
           approved_amount,
           approved_term_months,
           approved_rate_percent
         ) values ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          applicationId,
          actor.actorUserId,
          actor.actorRole,
          payload.decision,
          payload.notes ?? null,
          payload.approvedAmount ?? null,
          payload.approvedTermMonths ?? null,
          payload.approvedRatePercent ?? null
        ]
      );

      await insertAuditEventWithClient(client, {
        actorUserId: actor.actorUserId,
        actorRole: actor.actorRole,
        tenantId: application.tenant_id,
        category: "bank_monitoring",
        action: `credit_application_${payload.decision}`,
        resourceType: "credit_application",
        resourceId: applicationId,
        metadata: {
          approvedAmount: payload.approvedAmount ?? null,
          approvedTermMonths: payload.approvedTermMonths ?? null,
          approvedRatePercent: payload.approvedRatePercent ?? null
        }
      });

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    return getCreditApplicationDetail(applicationId);
  });
}
