import cron from "node-cron";
import { createLogger } from "@sqb/config";
import { runNotificationJob } from "./jobs/notification-job.js";
import { runOtpJob } from "./jobs/otp-job.js";
import { runProjectionRefreshJob } from "./jobs/projection-job.js";
import { runRiskRefreshJob } from "./jobs/risk-refresh-job.js";
import { runCreditAlertJob } from "./jobs/credit-alert-job.js";

const logger = createLogger("worker");

async function runSafe(name: string, fn: () => Promise<unknown>) {
  try {
    const result = await fn();
    logger.info(name, result as Record<string, unknown>);
  } catch (error) {
    logger.error(`${name}-error`, { error: error instanceof Error ? error.message : "unknown" });
  }
}

async function runBootstrapJobs() {
  logger.info("worker-start", { jobs: ["otp", "notifications", "projections", "risk-refresh", "credit-alerts"] });
  await runSafe("otp-job", runOtpJob);
  await runSafe("notification-job", runNotificationJob);
  await runSafe("projection-job", runProjectionRefreshJob);
  await runSafe("risk-refresh-job", runRiskRefreshJob);
  await runSafe("credit-alert-job", runCreditAlertJob);
}

// ── Scheduled jobs ────────────────────────────────────────────────────────────

// Refresh risk scores for all tenants — hourly
cron.schedule("0 * * * *", () => {
  runSafe("risk-refresh-job", runRiskRefreshJob).catch(() => {});
});

// Sweep portfolio alerts — every 15 minutes
cron.schedule("*/15 * * * *", () => {
  runSafe("credit-alert-job", runCreditAlertJob).catch(() => {});
});

// Refresh tenant health projections — every 6 hours
cron.schedule("0 */6 * * *", () => {
  runSafe("projection-job", runProjectionRefreshJob).catch(() => {});
});

// Clean up expired OTP challenges — every 5 minutes
cron.schedule("*/5 * * * *", () => {
  runSafe("otp-job", runOtpJob).catch(() => {});
});

// ── Run immediately on start ──────────────────────────────────────────────────

runBootstrapJobs().catch((error) => {
  logger.error("worker-crashed", { error: error instanceof Error ? error.message : "unknown" });
  process.exit(1);
});
