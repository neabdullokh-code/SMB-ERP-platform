import {
  demoApprovalRequests,
  demoAuditEvents,
  demoBankTenantHealth,
  demoBoms,
  demoCreditDecisions,
  demoInventoryItems,
  demoInventoryMovements,
  demoLoanApplications,
  demoPortfolioAlerts,
  demoProductionOrders,
  demoRiskScores,
  demoServiceOrders,
  demoStocktakes,
  demoTenant,
  demoUsers,
  demoWarehouses
} from "@sqb/domain-types";

export const fixtures = {
  approvals: demoApprovalRequests,
  auditEvents: demoAuditEvents,
  bankTenantHealth: demoBankTenantHealth,
  boms: demoBoms,
  creditDecisions: demoCreditDecisions,
  inventoryItems: demoInventoryItems,
  inventoryMovements: demoInventoryMovements,
  loanApplications: demoLoanApplications,
  portfolioAlerts: demoPortfolioAlerts,
  productionOrders: demoProductionOrders,
  riskScores: demoRiskScores,
  serviceOrders: demoServiceOrders,
  stocktakes: demoStocktakes,
  tenant: demoTenant,
  users: demoUsers,
  warehouses: demoWarehouses
};

