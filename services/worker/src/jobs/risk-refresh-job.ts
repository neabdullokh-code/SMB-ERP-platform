import { createLogger } from "@sqb/config";
import { demoBankTenantHealth } from "@sqb/domain-types";

const logger = createLogger("risk-refresh-job");

interface RiskScoreResult {
  tenantId: string;
  score: number;
  band: string;
}

async function fetchRiskScore(
  tenantId: string,
  apiBase: string,
  sessionToken: string
): Promise<RiskScoreResult | null> {
  try {
    const res = await fetch(`${apiBase}/credit/risk/${tenantId}`, {
      headers: { "x-session-token": sessionToken }
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { data: RiskScoreResult | null };
    return body.data;
  } catch {
    return null;
  }
}

export async function runRiskRefreshJob(): Promise<{
  job: string;
  refreshed: number;
  errors: number;
  tenants: string[];
}> {
  const apiBase = process.env.PLATFORM_API_URL ?? "http://localhost:3001";
  const sessionToken = process.env.WORKER_SESSION_TOKEN ?? "";

  if (!sessionToken) {
    logger.warn("risk-refresh-skipped", { reason: "WORKER_SESSION_TOKEN not set" });
    return { job: "risk-score-refresh", refreshed: 0, errors: 0, tenants: [] };
  }

  const tenants = demoBankTenantHealth;
  let refreshed = 0;
  let errors = 0;
  const refreshedTenants: string[] = [];

  for (const tenant of tenants) {
    const result = await fetchRiskScore(tenant.tenantId, apiBase, sessionToken);
    if (result) {
      refreshed++;
      refreshedTenants.push(tenant.tenantId);
      logger.info("risk-score-refreshed", {
        tenantId: tenant.tenantId,
        score: result.score,
        band: result.band
      });
    } else {
      errors++;
      logger.warn("risk-score-refresh-failed", { tenantId: tenant.tenantId });
    }
  }

  return { job: "risk-score-refresh", refreshed, errors, tenants: refreshedTenants };
}
