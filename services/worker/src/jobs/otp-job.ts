import type { Job } from "bullmq";
import { createLogger } from "@sqb/config";
import type { OtpJobData } from "../lib/queue.js";

const logger = createLogger("otp-job");

export async function processOtpJob(job: Job<OtpJobData>): Promise<void> {
  const { phone, code, channel, tenantId, userId } = job.data;
  logger.info("otp-dispatch-start", { jobId: job.id, channel, tenantId, userId });

  if (channel === "sms") {
    const smsProvider = process.env.SMS_PROVIDER;
    if (smsProvider === "twilio") {
      // Twilio integration — env vars: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const from = process.env.TWILIO_FROM;

      if (accountSid && authToken && from) {
        const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
        const body = new URLSearchParams({
          To: phone,
          From: from,
          Body: `Your SQB Business OS verification code is: ${code}. Valid for 10 minutes.`
        });
        const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
          method: "POST",
          headers: {
            Authorization: `Basic ${credentials}`,
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: body.toString()
        });
        if (!res.ok) {
          const err = await res.text();
          throw new Error(`Twilio dispatch failed: ${err}`);
        }
        logger.info("otp-sms-sent", { phone, jobId: job.id });
        return;
      }
    }
    // Fallback: log OTP for dev mode
    logger.info("otp-dev-log", { phone, code, note: "SMS_PROVIDER not configured — code logged for development" });
  } else {
    // TOTP — no dispatch needed, user reads from authenticator app
    logger.info("otp-totp-skip", { userId, note: "TOTP OTP — no dispatch required" });
  }
}

export async function runOtpJob() {
  return {
    job: "otp-dispatch",
    status: "bullmq-worker",
    note: "OTP dispatch runs as a BullMQ worker. Use createOtpWorker() to start processing."
  };
}
