import { Queue } from "bullmq";

const OTP_QUEUE = "otp-dispatch";
const NOTIFICATION_QUEUE = "notification-fanout";

function redisConnection() {
  const url = process.env.REDIS_URL ?? "redis://localhost:6379";
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: Number(parsed.port) || 6379,
    password: parsed.password || undefined
  };
}

let otpQueue: Queue | null = null;
let notifQueue: Queue | null = null;

function getOtpQueue() {
  if (!otpQueue) otpQueue = new Queue(OTP_QUEUE, { connection: redisConnection() });
  return otpQueue;
}

function getNotifQueue() {
  if (!notifQueue) notifQueue = new Queue(NOTIFICATION_QUEUE, { connection: redisConnection() });
  return notifQueue;
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

export async function enqueueOtp(data: OtpJobData): Promise<void> {
  try {
    await getOtpQueue().add("send", data, {
      attempts: 3,
      backoff: { type: "exponential", delay: 2000 },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 50 }
    });
  } catch {
    // Redis unavailable — OTP dispatch will fall back to synchronous path in auth module
  }
}

export async function enqueueNotification(data: NotificationJobData): Promise<void> {
  try {
    await getNotifQueue().add("fanout", data, {
      attempts: 3,
      backoff: { type: "exponential", delay: 1000 },
      removeOnComplete: { count: 200 },
      removeOnFail: { count: 100 }
    });
  } catch {
    // Redis unavailable — notifications are dropped gracefully
  }
}
