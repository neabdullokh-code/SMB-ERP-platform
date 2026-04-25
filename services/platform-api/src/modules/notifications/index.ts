import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { ok, fail } from "../../lib/envelope.js";
import { requireTenantPermission } from "../../lib/permissions.js";
import { enqueueNotification, type NotificationJobData } from "../../lib/queue-publisher.js";

const NotificationSchema = z.object({
  type: z.enum([
    "service_order_submitted",
    "service_order_approved",
    "service_order_rejected",
    "production_order_blocked",
    "stock_alert",
    "generic"
  ]),
  payload: z.record(z.unknown()).default({})
});

export async function notificationsModule(app: FastifyInstance) {
  app.get("/notifications/health", async () =>
    ok({
      channelStatuses: {
        sms: process.env.SMS_PROVIDER === "twilio" ? "configured" : "dev-log-only",
        email: process.env.EMAIL_PROVIDER === "sendgrid" ? "configured" : "dev-log-only",
        queue: "bullmq"
      }
    })
  );

  app.post("/notifications/send", async (request, reply) => {
    const access = await requireTenantPermission(request, reply, "inventory.manage", "Notification sending requires authenticated access.");
    if (!access) return;

    const result = NotificationSchema.safeParse(request.body);
    if (!result.success) {
      return reply.code(400).send(fail(result.error.issues[0]?.message ?? "Invalid notification payload."));
    }

    const { type, payload } = result.data;
    await enqueueNotification({
      type: type as NotificationJobData["type"],
      tenantId: access.tenantId,
      actorId: access.actorUserId,
      payload
    });

    return reply.code(202).send(ok({ queued: true, type }));
  });
}
