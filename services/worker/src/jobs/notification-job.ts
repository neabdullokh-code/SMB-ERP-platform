import type { Job } from "bullmq";
import { createLogger } from "@sqb/config";
import type { NotificationJobData } from "../lib/queue.js";

const logger = createLogger("notification-job");

const NOTIFICATION_TEMPLATES: Record<NotificationJobData["type"], (payload: Record<string, unknown>) => string> = {
  service_order_submitted: (p) => `New service order submitted: ${p.title} by ${p.requestedBy}`,
  service_order_approved: (p) => `Service order approved: ${p.title}`,
  service_order_rejected: (p) => `Service order rejected: ${p.title}`,
  production_order_blocked: (p) => `Production order blocked: ${p.orderId} — ${p.reason}`,
  stock_alert: (p) => `Stock alert: ${p.sku} is ${p.status} (on-hand: ${p.onHand}, reorder: ${p.reorderPoint})`,
  generic: (p) => String(p.message ?? "Platform notification")
};

export async function processNotificationJob(job: Job<NotificationJobData>): Promise<void> {
  const { type, tenantId, payload } = job.data;
  const message = NOTIFICATION_TEMPLATES[type]?.(payload) ?? "Platform notification";

  logger.info("notification-fanout-start", { jobId: job.id, type, tenantId, message });

  const emailProvider = process.env.EMAIL_PROVIDER;
  if (emailProvider === "sendgrid") {
    const apiKey = process.env.SENDGRID_API_KEY;
    const recipients = Array.isArray(payload.emails) ? payload.emails : [];
    if (apiKey && recipients.length > 0) {
      for (const email of recipients) {
        const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email }] }],
            from: { email: process.env.EMAIL_FROM ?? "noreply@sqb.uz" },
            subject: `SQB Business OS — ${type.replace(/_/g, " ")}`,
            content: [{ type: "text/plain", value: message }]
          })
        });
        if (!res.ok) {
          logger.error("notification-email-failed", { email, status: String(res.status) });
        } else {
          logger.info("notification-email-sent", { email, type });
        }
      }
      return;
    }
  }

  // Fallback: structured log (picked up by log aggregation in production)
  logger.info("notification-dev-log", { type, tenantId, message, payload });
}

export async function runNotificationJob() {
  return {
    job: "notification-fanout",
    status: "bullmq-worker",
    note: "Notification fanout runs as a BullMQ worker. Use createNotificationWorker() to start processing."
  };
}
