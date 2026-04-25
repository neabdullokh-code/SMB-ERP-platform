import { createLogger } from "@sqb/config";
import { demoBankTenantHealth } from "@sqb/domain-types";

const logger = createLogger("credit-alert-job");

interface PortfolioAlerts {
  summary: { critical: number; warn: number; info: number };
}

export async function runCreditAlertJob(): Promise<{
  job: string;
  critical: number;
  warn: number;
  info: number;
}> {
  const apiBase = process.env.PLATFORM_API_URL ?? "http://localhost:3001";
  const sessionToken = process.env.WORKER_SESSION_TOKEN ?? "";

  if (!sessionToken) {
    return { job: "credit-alert-sweep", critical: 0, warn: 0, info: 0 };
  }

  try {
    const res = await fetch(`${apiBase}/bank/portfolio/alerts`, {
      headers: { "x-session-token": sessionToken }
    });
    if (!res.ok) {
      logger.warn("credit-alert-sweep-failed", { status: res.status });
      return { job: "credit-alert-sweep", critical: 0, warn: 0, info: 0 };
    }

    const body = (await res.json()) as { data: PortfolioAlerts };
    const { critical, warn, info } = body.data?.summary ?? { critical: 0, warn: 0, info: 0 };

    if (critical > 0) {
      logger.error("portfolio-critical-alerts", {
        critical,
        tenants: demoBankTenantHealth.map((t) => t.tenantId)
      });
    } else if (warn > 0) {
      logger.warn("portfolio-warn-alerts", { warn });
    }

    return { job: "credit-alert-sweep", critical, warn, info };
  } catch (error) {
    logger.error("credit-alert-sweep-error", {
      error: error instanceof Error ? error.message : "unknown"
    });
    return { job: "credit-alert-sweep", critical: 0, warn: 0, info: 0 };
  }
}
