import { Queue, Worker, type Job } from "bullmq";
import { createLogger } from "@sqb/config";

const logger = createLogger("worker-queue");

function redisConnection() {
  const url = process.env.REDIS_URL ?? "redis://localhost:6379";
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: Number(parsed.port) || 6379,
    password: parsed.password || undefined
  };
}

export const OTP_QUEUE = "otp-dispatch";
export const NOTIFICATION_QUEUE = "notification-fanout";
export const PROJECTION_QUEUE = "projection-refresh";

export function createQueue(name: string) {
  return new Queue(name, { connection: redisConnection() });
}

export type OtpJobData = {
  phone: string;
  code: string;
  channel: "sms" | "totp";
  tenantId?: string;
  userId?: string;
};

export type NotificationJobData = {
  type: "service_order_submitted" | "service_order_approved" | "service_order_rejected" | "production_order_blocked" | "stock_alert" | "generic";
  tenantId: string;
  actorId?: string;
  payload: Record<string, unknown>;
};

export type ProjectionJobData = {
  tenantId?: string;
};

export function createOtpWorker(process: (job: Job<OtpJobData>) => Promise<void>) {
  const worker = new Worker<OtpJobData>(OTP_QUEUE, process, {
    connection: redisConnection(),
    concurrency: 5
  });
  worker.on("completed", (job) => logger.info("otp-job-completed", { jobId: job.id }));
  worker.on("failed", (job, err) => logger.error("otp-job-failed", { jobId: job?.id, error: err.message }));
  return worker;
}

export function createNotificationWorker(process: (job: Job<NotificationJobData>) => Promise<void>) {
  const worker = new Worker<NotificationJobData>(NOTIFICATION_QUEUE, process, {
    connection: redisConnection(),
    concurrency: 10
  });
  worker.on("completed", (job) => logger.info("notification-job-completed", { jobId: job.id }));
  worker.on("failed", (job, err) => logger.error("notification-job-failed", { jobId: job?.id, error: err.message }));
  return worker;
}

export function createProjectionWorker(process: (job: Job<ProjectionJobData>) => Promise<void>) {
  const worker = new Worker<ProjectionJobData>(PROJECTION_QUEUE, process, {
    connection: redisConnection(),
    concurrency: 2
  });
  worker.on("completed", (job) => logger.info("projection-job-completed", { jobId: job.id }));
  worker.on("failed", (job, err) => logger.error("projection-job-failed", { jobId: job?.id, error: err.message }));
  return worker;
}
