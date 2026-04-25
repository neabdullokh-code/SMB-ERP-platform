import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { hasPermission } from "@sqb/domain-types";
import { getProfileAvatarUrl, isStorageAvailable, uploadProfileAvatar } from "../../lib/storage.js";
import { resolveRequestAuth } from "../../lib/permissions.js";
import { getAuthSecuritySettings, verifyUserOtpForReauth, verifyUserPasswordForReauth } from "../auth/store.js";
import {
  canEditTargetProfile,
  confirmEmailChange,
  getMyProfile,
  getProfileByUserId,
  listProfilesForAdmin,
  requestEmailChange,
  updateProfileNamePhoto
} from "./store.js";

const UpdateProfileSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  avatarStorageKey: z.string().trim().min(1).max(500).nullable().optional(),
  avatarUrl: z.string().trim().url().nullable().optional()
});

const RequestEmailChangeSchema = z.object({
  newEmail: z.string().trim().email(),
  password: z.string().min(8),
  otpCode: z.string().trim().optional(),
  targetUserId: z.string().uuid().optional()
});

const ConfirmEmailChangeSchema = z.object({
  token: z.string().trim().min(1)
});

function sanitizeFilename(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 120) || "avatar";
}

function isImageMime(mimeType: string) {
  return /^image\/(png|jpe?g|webp|gif)$/i.test(mimeType);
}

export async function profileModule(app: FastifyInstance) {
  app.get("/profile/me", async (request, reply) => {
    const auth = await resolveRequestAuth(request);
    if (!auth.isAuthenticated || !auth.session) {
      return reply.code(401).send({ message: "Authenticated session required.", errorCode: "SESSION_INVALID" });
    }

    const profile = await getMyProfile(auth.session);
    return { profile };
  });

  app.patch("/profile/me", async (request, reply) => {
    const auth = await resolveRequestAuth(request);
    if (!auth.isAuthenticated || !auth.session) {
      return reply.code(401).send({ message: "Authenticated session required.", errorCode: "SESSION_INVALID" });
    }

    const parsed = UpdateProfileSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ message: parsed.error.issues[0]?.message ?? "Invalid profile payload." });
    }

    const profile = await updateProfileNamePhoto(auth.session, auth.session.actor.id, parsed.data);
    if (!profile) {
      return reply.code(400).send({ message: "No profile fields were updated." });
    }
    return { profile };
  });

  app.get("/profile/users", async (request, reply) => {
    const auth = await resolveRequestAuth(request);
    if (!auth.isAuthenticated || !auth.session) {
      return reply.code(401).send({ message: "Authenticated session required.", errorCode: "SESSION_INVALID" });
    }

    const allowed = hasPermission(auth.permissions, "tenant.manage") || auth.session.actor.role === "super_admin" || auth.session.actor.role === "bank_admin";
    if (!allowed) {
      return reply.code(403).send({ message: "Admin access required." });
    }

    const users = await listProfilesForAdmin(auth.session);
    return { users };
  });

  app.patch("/profile/users/:userId", async (request, reply) => {
    const auth = await resolveRequestAuth(request);
    if (!auth.isAuthenticated || !auth.session) {
      return reply.code(401).send({ message: "Authenticated session required.", errorCode: "SESSION_INVALID" });
    }

    const { userId } = request.params as { userId: string };
    const parsed = UpdateProfileSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ message: parsed.error.issues[0]?.message ?? "Invalid profile payload." });
    }

    const target = await getProfileByUserId(userId);
    if (!target) {
      return reply.code(404).send({ message: "Target profile not found." });
    }
    if (!canEditTargetProfile(auth.session, target)) {
      return reply.code(403).send({ message: "You are not allowed to update this profile." });
    }

    const profile = await updateProfileNamePhoto(auth.session, userId, parsed.data);
    if (!profile) {
      return reply.code(400).send({ message: "No profile fields were updated." });
    }

    return { profile };
  });

  app.post("/profile/me/email-change/request", async (request, reply) => {
    const auth = await resolveRequestAuth(request);
    if (!auth.isAuthenticated || !auth.session) {
      return reply.code(401).send({ message: "Authenticated session required.", errorCode: "SESSION_INVALID" });
    }

    const parsed = RequestEmailChangeSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ message: parsed.error.issues[0]?.message ?? "Invalid email-change request payload." });
    }

    const targetUserId = parsed.data.targetUserId ?? auth.session.actor.id;
    const passwordValid = await verifyUserPasswordForReauth(auth.session.actor.id, parsed.data.password);
    if (!passwordValid) {
      return reply.code(401).send({ message: "Invalid password for re-authentication." });
    }

    const securitySettings = await getAuthSecuritySettings(request.headers["x-session-token"] as string | undefined);
    if (securitySettings?.totpRequired) {
      if (!parsed.data.otpCode) {
        return reply.code(400).send({ message: "OTP code is required for this account." });
      }
      const otpValid = await verifyUserOtpForReauth(auth.session.actor.id, parsed.data.otpCode);
      if (!otpValid) {
        return reply.code(401).send({ message: "Invalid OTP code." });
      }
    }

    const result = await requestEmailChange(auth.session, targetUserId, parsed.data.newEmail);
    if (result.status === "error") {
      return reply.code(result.code).send({ message: result.message });
    }
    return result.response;
  });

  app.post("/profile/me/email-change/confirm", async (request, reply) => {
    const parsed = ConfirmEmailChangeSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ status: "invalid", message: parsed.error.issues[0]?.message ?? "Verification token is required." });
    }

    const result = await confirmEmailChange(parsed.data.token);
    if (result.status !== "confirmed") {
      return reply.code(400).send(result);
    }
    return result;
  });

  app.post("/profile/avatar/upload", async (request, reply) => {
    const auth = await resolveRequestAuth(request);
    if (!auth.isAuthenticated || !auth.session) {
      return reply.code(401).send({ message: "Authenticated session required.", errorCode: "SESSION_INVALID" });
    }
    if (!isStorageAvailable()) {
      return reply.code(503).send({ message: "Object storage is not configured." });
    }

    const fileData = await request.file();
    if (!fileData) {
      return reply.code(400).send({ message: "Avatar file is required." });
    }

    if (!isImageMime(fileData.mimetype)) {
      return reply.code(400).send({ message: "Only PNG, JPG, WEBP, and GIF images are allowed." });
    }

    const chunks: Buffer[] = [];
    for await (const chunk of fileData.file) {
      chunks.push(Buffer.from(chunk));
    }
    const buffer = Buffer.concat(chunks);
    if (buffer.length === 0) {
      return reply.code(400).send({ message: "Avatar file is empty." });
    }
    if (buffer.length > 5 * 1024 * 1024) {
      return reply.code(400).send({ message: "Avatar file exceeds 5 MB limit." });
    }

    const tenantScope = auth.session.tenantId ?? "platform";
    const filename = sanitizeFilename(fileData.filename || "avatar");
    const storageKey = `${tenantScope}/${auth.session.actor.id}/${Date.now()}-${randomUUID()}-${filename}`;

    await uploadProfileAvatar(storageKey, buffer, fileData.mimetype);
    const avatarUrl = await getProfileAvatarUrl(storageKey);

    return {
      avatarStorageKey: storageKey,
      avatarUrl
    };
  });
}
