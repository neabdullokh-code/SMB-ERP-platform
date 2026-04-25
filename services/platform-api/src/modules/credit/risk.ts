import type { LoanApplicationStep3, RiskBand, RiskScore, RiskScoreFactors } from "@sqb/domain-types";
import type { BankTenantHealth } from "@sqb/domain-types";

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

function scoreToBand(score: number): RiskBand {
  if (score >= 80) return "excellent";
  if (score >= 65) return "good";
  if (score >= 50) return "fair";
  if (score >= 35) return "poor";
  return "critical";
}

function scoreRevenueStability(step3: LoanApplicationStep3): number {
  const margin = (step3.annualRevenue - step3.annualExpenses) / step3.annualRevenue;
  // margin of 20%+ = 100, 0% = 40, negative = 0
  if (margin <= 0) return clamp(40 + margin * 200);
  return clamp(40 + margin * 300);
}

function scoreDebtRatio(step3: LoanApplicationStep3): number {
  if (step3.totalAssets === 0) return 0;
  const ratio = step3.totalLiabilities / step3.totalAssets;
  // ratio 0 = 100, 0.5 = 50, 0.8+ = 0
  return clamp(100 - ratio * 125);
}

function scoreCashFlow(step3: LoanApplicationStep3): number {
  const cashFlow = step3.annualRevenue - step3.annualExpenses;
  if (cashFlow <= 0) return clamp(20 + (cashFlow / step3.annualRevenue) * 100);
  const returnRate = cashFlow / step3.annualRevenue;
  return clamp(40 + returnRate * 300);
}

function scoreInventoryHealth(health?: BankTenantHealth): number {
  if (!health) return 60;
  const map: Record<string, number> = { low: 90, moderate: 60, high: 25 };
  return map[health.inventoryRisk] ?? 60;
}

function scoreOperationalEfficiency(health?: BankTenantHealth): number {
  if (!health) return 70;
  const bottleneckPenalty = health.workflowBottlenecks * 10;
  const overduePenalty = health.overdueServiceOrders * 12;
  return clamp(100 - bottleneckPenalty - overduePenalty);
}

const WEIGHTS: Record<keyof RiskScoreFactors, number> = {
  revenueStability: 0.30,
  debtRatio: 0.25,
  cashFlow: 0.25,
  inventoryHealth: 0.10,
  operationalEfficiency: 0.10
};

export function computeRiskScore(
  tenantId: string,
  step3: LoanApplicationStep3,
  health?: BankTenantHealth
): Omit<RiskScore, "id"> {
  const factors: RiskScoreFactors = {
    revenueStability: Math.round(scoreRevenueStability(step3)),
    debtRatio: Math.round(scoreDebtRatio(step3)),
    cashFlow: Math.round(scoreCashFlow(step3)),
    inventoryHealth: Math.round(scoreInventoryHealth(health)),
    operationalEfficiency: Math.round(scoreOperationalEfficiency(health))
  };

  const score = Math.round(
    Object.entries(factors).reduce(
      (sum, [key, val]) => sum + val * WEIGHTS[key as keyof RiskScoreFactors],
      0
    )
  );

  return {
    tenantId,
    score,
    band: scoreToBand(score),
    factors,
    computedAt: new Date().toISOString()
  };
}
