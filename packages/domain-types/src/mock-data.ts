import type { AuthenticatedUser, AuditEvent, TenantContext } from "./platform";
import type { BankTenantHealth, CreditDecision, LoanApplication, PortfolioAlert, RiskScore } from "./bank";
import type { InventoryItem, InventoryMovement, Stocktake, Warehouse } from "./inventory";
import type { BOM, ProductionOrder, ScrapRecord } from "./production";
import type { ApprovalRequest, ServiceOrder } from "./service-orders";

export const demoTenant: TenantContext = {
  tenantId: "tenant_kamolot",
  tenantSlug: "kamolot-savdo",
  tenantName: "Kamolot Savdo LLC",
  isolationMode: "logical"
};

export const demoUsers: AuthenticatedUser[] = [
  {
    id: "user_company_admin",
    name: "Jasur Azimov",
    email: "jasur@kamolot.uz",
    phone: "+998901111111",
    role: "company_admin",
    workspaceRole: "owner",
    permissionGroups: ["tenant_governance", "finance_operations", "inventory_operations", "production_operations", "service_operations", "audit_compliance"],
    permissions: ["tenant.read", "tenant.manage", "finance.read", "finance.manage", "inventory.manage", "production.manage", "service_order.manage", "audit.read"],
    tenantId: demoTenant.tenantId,
    lastActiveAt: new Date().toISOString()
  },
  {
    id: "user_company_admin_delegate",
    name: "Malika Karimova",
    email: "malika@kamolot.uz",
    phone: "+998907777777",
    role: "company_admin",
    workspaceRole: "company_admin",
    permissionGroups: ["tenant_governance", "finance_operations", "inventory_operations", "production_operations", "service_operations", "audit_compliance"],
    permissions: ["tenant.read", "tenant.manage", "finance.read", "finance.manage", "inventory.manage", "production.manage", "service_order.manage", "audit.read"],
    tenantId: demoTenant.tenantId,
    lastActiveAt: new Date(Date.now() - 2 * 60 * 1000).toISOString()
  },
  {
    id: "user_employee",
    name: "Bekzod Yusupov",
    email: "bekzod@kamolot.uz",
    phone: "+998903333333",
    role: "employee",
    workspaceRole: "operator",
    permissionGroups: ["inventory_operations", "production_operations", "service_operations"],
    permissions: ["inventory.manage", "production.manage", "service_order.manage"],
    tenantId: demoTenant.tenantId,
    lastActiveAt: new Date(Date.now() - 60 * 60 * 1000).toISOString()
  },
  {
    id: "user_manager",
    name: "Dilnoza Rashidova",
    email: "dilnoza@kamolot.uz",
    phone: "+998906666666",
    role: "employee",
    workspaceRole: "manager",
    permissionGroups: ["finance_operations", "inventory_operations", "production_operations", "service_operations"],
    permissions: ["finance.read", "finance.manage", "inventory.manage", "production.manage", "service_order.manage"],
    tenantId: demoTenant.tenantId,
    lastActiveAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "user_operator_two",
    name: "Sardor Toshev",
    email: "sardor@kamolot.uz",
    phone: "+998908888888",
    role: "employee",
    workspaceRole: "operator",
    permissionGroups: ["inventory_operations", "production_operations", "service_operations"],
    permissions: ["inventory.manage", "production.manage", "service_order.manage"],
    tenantId: demoTenant.tenantId,
    lastActiveAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "user_bank_admin",
    name: "Malika Karimova",
    phone: "+998902222222",
    role: "bank_admin",
    permissions: ["bank.monitor", "audit.read", "tenant.read", "credit.review", "credit.manage"]
  }
];

export const demoWarehouses: Warehouse[] = [
  { id: "wh_main", tenantId: demoTenant.tenantId, name: "Main DC", code: "MAIN", location: "Tashkent" },
  { id: "wh_branch", tenantId: demoTenant.tenantId, name: "Branch Storage", code: "BR1", location: "Chilonzor" }
];

export const demoInventoryItems: InventoryItem[] = [
  { id: "sku_oil", tenantId: demoTenant.tenantId, sku: "KS-0102", name: "Cooking oil, sunflower 5L", category: "Grocery", onHand: 1240, reorderPoint: 300, valuationUzs: 76880000, warehouseId: "wh_main" },
  { id: "sku_sugar", tenantId: demoTenant.tenantId, sku: "KS-0104", name: "Sugar, refined 50kg bag", category: "Grocery", onHand: 86, reorderPoint: 120, valuationUzs: 36120000, warehouseId: "wh_main" },
  { id: "sku_detergent", tenantId: demoTenant.tenantId, sku: "KS-0401", name: "Laundry detergent 6kg", category: "Household", onHand: 12, reorderPoint: 40, valuationUzs: 2220000, warehouseId: "wh_branch" }
];

export const demoInventoryMovements: InventoryMovement[] = [
  { id: "mov_1", tenantId: demoTenant.tenantId, itemId: "sku_oil", movementType: "inbound", quantity: 100, occurredAt: "2026-04-21T08:20:00Z", reference: "GRN-2048" },
  { id: "mov_2", tenantId: demoTenant.tenantId, itemId: "sku_sugar", movementType: "outbound", quantity: 34, occurredAt: "2026-04-21T09:05:00Z", reference: "SO-1482" },
  { id: "mov_3", tenantId: demoTenant.tenantId, itemId: "sku_detergent", movementType: "transfer", quantity: 8, occurredAt: "2026-04-21T09:55:00Z", reference: "TR-0091" }
];

export const demoStocktakes: Stocktake[] = [
  { id: "count_1", tenantId: demoTenant.tenantId, warehouseId: "wh_main", startedAt: "2026-04-18T06:00:00Z", completedAt: "2026-04-18T08:30:00Z", varianceCount: 2 }
];

export const demoBoms: BOM[] = [
  {
    id: "bom_tea_box",
    tenantId: demoTenant.tenantId,
    code: "BOM-1001",
    outputSku: "FG-TEA-BOX",
    version: "v3",
    materials: [
      { sku: "RM-TEA", quantity: 1, unit: "kg" },
      { sku: "RM-BOX", quantity: 20, unit: "pcs" }
    ]
  }
];

export const demoProductionOrders: ProductionOrder[] = [
  { id: "po_451", tenantId: demoTenant.tenantId, bomId: "bom_tea_box", status: "in_progress", plannedUnits: 400, producedUnits: 250, scheduledDate: "2026-04-21" }
];

export const demoScrapRecords: ScrapRecord[] = [
  { id: "scrap_1", tenantId: demoTenant.tenantId, productionOrderId: "po_451", reason: "Packaging defect", quantity: 12, recordedAt: "2026-04-21T10:10:00Z" }
];

export const demoServiceOrders: ServiceOrder[] = [
  { id: "so_1041", tenantId: demoTenant.tenantId, title: "Inventory audit for branch warehouse", customer: "Kamolot Branch #2", status: "approved", requestedBy: "Jasur Azimov", dueDate: "2026-04-24" },
  { id: "so_1042", tenantId: demoTenant.tenantId, title: "Equipment maintenance", customer: "Nur Auto Parts", status: "submitted", requestedBy: "Bekzod Yusupov", dueDate: "2026-04-26" }
];

export const demoApprovalRequests: ApprovalRequest[] = [
  { id: "apr_1", tenantId: demoTenant.tenantId, entityType: "service_order", entityId: "so_1042", submittedBy: "Bekzod Yusupov", approverRole: "company_admin", status: "pending" }
];

export const demoBankTenantHealth: BankTenantHealth[] = [
  {
    tenantId: "tenant_kamolot",
    tenantName: "Kamolot Savdo LLC",
    industry: "Wholesale",
    region: "Tashkent",
    creditScore: 81,
    inventoryRisk: "moderate",
    workflowBottlenecks: 1,
    overdueServiceOrders: 0,
    healthTrend: "up",
    scoreVersion: "risk_v1",
    scoreFactors: [
      { key: "invoice_collection", label: "Invoice collection", impact: -8, value: "78.00%", tone: "warn" },
      { key: "revenue_trend", label: "Revenue trend", impact: 0, value: "up", tone: "good" }
    ],
    recommendedAction: "approve",
    defaultRiskPercent: "2.10",
    expectedReturnPercent: "16.20",
    refreshedAt: "2026-04-24T08:15:00.000Z"
  },
  {
    tenantId: "tenant_silk",
    tenantName: "Silk Road Textiles",
    industry: "Textiles",
    region: "Namangan",
    creditScore: 58,
    inventoryRisk: "high",
    workflowBottlenecks: 3,
    overdueServiceOrders: 4,
    healthTrend: "down",
    scoreVersion: "risk_v1",
    scoreFactors: [
      { key: "ar_overdue_ratio", label: "AR overdue ratio", impact: -20, value: "36.00%", tone: "bad" },
      { key: "net_cash_flow", label: "Monthly net cash flow", impact: -12, value: "-12000000.00", tone: "bad" }
    ],
    recommendedAction: "decline",
    defaultRiskPercent: "14.20",
    expectedReturnPercent: "8.40",
    refreshedAt: "2026-04-24T08:15:00.000Z"
  }
];

export const demoLoanApplications: LoanApplication[] = [
  {
    id: "loan_app_001",
    tenantId: "tenant_kamolot",
    step: 5,
    status: "submitted",
    step1: { businessName: "Kamolot Savdo LLC", industry: "Wholesale", region: "Tashkent", tin: "302561478" },
    step2: { loanAmount: 500000000, currency: "UZS", purpose: "Inventory expansion for Q3 season", termMonths: 24 },
    step3: { annualRevenue: 3200000000, annualExpenses: 2600000000, totalAssets: 1800000000, totalLiabilities: 420000000 },
    riskScore: 81,
    riskBand: "good",
    submittedAt: "2026-04-20T09:15:00Z",
    createdAt: "2026-04-19T14:00:00Z",
    updatedAt: "2026-04-20T09:15:00Z"
  },
  {
    id: "loan_app_002",
    tenantId: "tenant_silk",
    step: 5,
    status: "under_review",
    step1: { businessName: "Silk Road Textiles", industry: "Textiles", region: "Namangan", tin: "401938271" },
    step2: { loanAmount: 1200000000, currency: "UZS", purpose: "Equipment upgrade and working capital", termMonths: 36 },
    step3: { annualRevenue: 1800000000, annualExpenses: 1950000000, totalAssets: 2400000000, totalLiabilities: 1560000000 },
    riskScore: 42,
    riskBand: "poor",
    submittedAt: "2026-04-18T11:30:00Z",
    createdAt: "2026-04-17T10:00:00Z",
    updatedAt: "2026-04-21T08:00:00Z"
  },
  {
    id: "loan_app_003",
    tenantId: "tenant_kamolot",
    step: 3,
    status: "draft",
    step1: { businessName: "Kamolot Savdo LLC", industry: "Wholesale", region: "Tashkent", tin: "302561478" },
    step2: { loanAmount: 200000000, currency: "UZS", purpose: "New branch fit-out", termMonths: 12 },
    createdAt: "2026-04-22T16:00:00Z",
    updatedAt: "2026-04-22T16:45:00Z"
  }
];

export const demoCreditDecisions: CreditDecision[] = [
  {
    id: "decision_001",
    applicationId: "loan_app_002",
    decision: "escalated",
    decidedBy: "user_bank_admin",
    reason: "Debt-to-equity ratio exceeds threshold. Requires credit committee review.",
    decidedAt: "2026-04-21T08:00:00Z"
  }
];

export const demoRiskScores: RiskScore[] = [
  {
    id: "risk_001",
    tenantId: "tenant_kamolot",
    score: 81,
    band: "good",
    factors: { revenueStability: 85, debtRatio: 77, cashFlow: 79, inventoryHealth: 70, operationalEfficiency: 88 },
    computedAt: "2026-04-23T06:00:00Z"
  },
  {
    id: "risk_002",
    tenantId: "tenant_silk",
    score: 42,
    band: "poor",
    factors: { revenueStability: 32, debtRatio: 35, cashFlow: 28, inventoryHealth: 40, operationalEfficiency: 55 },
    computedAt: "2026-04-23T06:00:00Z"
  }
];

export const demoPortfolioAlerts: PortfolioAlert[] = [
  {
    id: "alert_001",
    tenantId: "tenant_silk",
    tenantName: "Silk Road Textiles",
    severity: "critical",
    type: "high_debt_ratio",
    message: "Debt-to-equity ratio at 65% — exceeds 50% policy threshold.",
    triggeredAt: "2026-04-23T06:00:00Z"
  },
  {
    id: "alert_002",
    tenantId: "tenant_silk",
    tenantName: "Silk Road Textiles",
    severity: "warn",
    type: "inventory_risk",
    message: "Inventory risk level is HIGH with 4 overdue service orders.",
    triggeredAt: "2026-04-23T06:00:00Z"
  },
  {
    id: "alert_003",
    tenantId: "tenant_silk",
    tenantName: "Silk Road Textiles",
    severity: "warn",
    type: "credit_score_drop",
    message: "Credit score dropped 12 points since last assessment.",
    triggeredAt: "2026-04-22T18:00:00Z"
  }
];

export const demoAuditEvents: AuditEvent[] = [
  {
    id: "audit_1",
    actorUserId: "user_company_admin",
    actorRole: "company_admin",
    tenantId: demoTenant.tenantId,
    category: "terms",
    action: "accept",
    resourceType: "terms_of_service",
    resourceId: "tos-2026-04",
    occurredAt: "2026-04-21T06:55:00Z",
    metadata: { version: "2026-04", ip: "127.0.0.1" }
  },
  {
    id: "audit_2",
    actorUserId: "user_bank_admin",
    actorRole: "bank_admin",
    category: "bank_monitoring",
    action: "view",
    resourceType: "tenant_health",
    resourceId: "tenant_kamolot",
    occurredAt: "2026-04-21T07:15:00Z",
    metadata: { scope: "portfolio" }
  },
  {
    id: "audit_3",
    actorUserId: "user_company_admin",
    actorRole: "company_admin",
    tenantId: demoTenant.tenantId,
    category: "credit.application",
    action: "submit",
    resourceType: "loan_application",
    resourceId: "loan_app_001",
    occurredAt: "2026-04-20T09:15:00Z",
    metadata: { loanAmount: 500000000, currency: "UZS" }
  },
  {
    id: "audit_4",
    actorUserId: "user_bank_admin",
    actorRole: "bank_admin",
    category: "credit.decision",
    action: "escalate",
    resourceType: "loan_application",
    resourceId: "loan_app_002",
    occurredAt: "2026-04-21T08:00:00Z",
    metadata: { reason: "Debt-to-equity ratio exceeds threshold" }
  },
  {
    id: "audit_5",
    actorUserId: "user_company_admin",
    actorRole: "company_admin",
    tenantId: demoTenant.tenantId,
    category: "credit.document",
    action: "upload",
    resourceType: "loan_document",
    resourceId: "doc_001",
    occurredAt: "2026-04-19T14:30:00Z",
    metadata: { filename: "financial-statements-2025.pdf", applicationId: "loan_app_001" }
  }
];
