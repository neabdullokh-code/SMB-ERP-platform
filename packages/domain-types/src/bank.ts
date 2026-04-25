export type CreditRecommendation = "approve" | "review" | "decline";

export type CreditApplicationStatus =
  | "submitted"
  | "in_review"
  | "approved"
  | "counter_offered"
  | "declined";

export type CreditApplicationPriority = "high" | "normal";

export interface BankScoreFactor {
  key: string;
  label: string;
  impact: number;
  value: string;
  tone: "neutral" | "good" | "warn" | "bad";
}

export interface BankTenantHealth {
  tenantId: string;
  tenantName: string;
  industry: string;
  region: string;
  creditScore: number;
  inventoryRisk: "low" | "moderate" | "high";
  workflowBottlenecks: number;
  overdueServiceOrders: number;
  healthTrend: "up" | "flat" | "down";
  scoreVersion: string;
  scoreFactors: BankScoreFactor[];
  recommendedAction: CreditRecommendation;
  defaultRiskPercent: string;
  expectedReturnPercent: string;
  refreshedAt: string;
}

export interface BankPortfolioAnalytics {
  totalTenants: number;
  highRiskCount: number;
  averageCreditScore: number;
  recommendationCounts: Record<CreditRecommendation, number>;
  riskBuckets: Record<BankTenantHealth["inventoryRisk"], number>;
  slaHealthPercent: number;
  lastRefreshedAt: string | null;
}

export interface CreditQueueItem {
  id: string;
  tenantId: string;
  tenantName: string;
  status: CreditApplicationStatus;
  submittedAt: string;
  product: string;
  purpose: string;
  requestedAmount: string;
  requestedTermMonths: number;
  priority: CreditApplicationPriority;
  aiRecommendation: CreditRecommendation;
  aiRationale: string;
  scoreSnapshot: number;
  scoreVersion: string;
  assignedBankUserId?: string;
  assignedBankUserName?: string;
  lastReviewedAt?: string;
  industry: string;
  region: string;
}

export interface CreditApplicationDocument {
  id: string;
  name: string;
  status: "available" | "missing";
  sourceType: "auto_pulled" | "uploaded";
}

export interface CreditQueueDecision {
  id: string;
  applicationId: string;
  decision: "approve" | "counter_offer" | "decline";
  notes?: string;
  approvedAmount?: string;
  approvedTermMonths?: number;
  approvedRatePercent?: string;
  actorUserId: string;
  actorName: string;
  actorRole: string;
  createdAt: string;
}

export interface CreditApplicationDetail extends CreditQueueItem {
  approvedAmount?: string;
  approvedTermMonths?: number;
  approvedRatePercent?: string;
  defaultRiskPercent: string;
  expectedReturnPercent: string;
  scoreFactors: BankScoreFactor[];
  documents: CreditApplicationDocument[];
  decisions: CreditQueueDecision[];
  financialSummary: {
    cashBalance: string;
    arOutstanding: string;
    arOverdue: string;
    apOutstanding: string;
    monthlyNetCashFlow: string;
    invoiceCollectionRate: string;
    billPaymentPunctuality: string;
    revenuePoints: Array<{ month: string; revenue: string }>;
  } | null;
}

export interface CreditDecisionRequest {
  decision: "approve" | "counter_offer" | "decline";
  approvedAmount?: string;
  approvedTermMonths?: number;
  approvedRatePercent?: string;
  notes?: string;
}

export interface CreditAssignRequest {
  assignedBankUserId: string;
}

export type LoanApplicationStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "escalated";

export interface LoanApplicationStep1 {
  businessName: string;
  industry: string;
  region: string;
  tin: string;
}

export interface LoanApplicationStep2 {
  loanAmount: number;
  currency: "UZS" | "USD";
  purpose: string;
  termMonths: number;
}

export interface LoanApplicationStep3 {
  annualRevenue: number;
  annualExpenses: number;
  totalAssets: number;
  totalLiabilities: number;
}

export interface LoanApplication {
  id: string;
  tenantId: string;
  step: number;
  status: LoanApplicationStatus;
  step1?: LoanApplicationStep1;
  step2?: LoanApplicationStep2;
  step3?: LoanApplicationStep3;
  riskScore?: number;
  riskBand?: RiskBand;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoanDocument {
  id: string;
  applicationId: string;
  filename: string;
  mimeType: string;
  storageKey: string;
  sizeBytes: number;
  uploadedBy: string;
  uploadedAt: string;
}

export interface CreditDecision {
  id: string;
  applicationId: string;
  decision: "approved" | "rejected" | "escalated";
  decidedBy: string;
  reason: string;
  decidedAt: string;
}

export type RiskBand = "excellent" | "good" | "fair" | "poor" | "critical";

export interface RiskScoreFactors {
  revenueStability: number;
  debtRatio: number;
  cashFlow: number;
  inventoryHealth: number;
  operationalEfficiency: number;
}

export interface RiskScore {
  id: string;
  tenantId: string;
  score: number;
  band: RiskBand;
  factors: RiskScoreFactors;
  computedAt: string;
}

export type AlertSeverity = "info" | "warn" | "critical";
export type AlertType =
  | "credit_score_drop"
  | "high_debt_ratio"
  | "overdue_payments"
  | "inventory_risk"
  | "workflow_bottleneck";

export interface PortfolioAlert {
  id: string;
  tenantId: string;
  tenantName: string;
  severity: AlertSeverity;
  type: AlertType;
  message: string;
  triggeredAt: string;
}

