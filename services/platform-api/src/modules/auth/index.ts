import type { FastifyInstance } from "fastify";
import {
  acceptTerms,
  cleanExpiredSessions,
  consumePasswordReset,
  getAuthSecuritySettings,
  getSession,
  handlePasswordLogin,
  listPlatformStaffDirectory,
  logout,
  requestPasswordReset,
  resendChallenge,
  rotateRefreshToken,
  updateAuthSecuritySettings,
  verifyChallenge
} from "./store.js";

const RATE_LIMIT_AUTH = { max: 20, timeWindow: "1 minute" };
const RATE_LIMIT_SENSITIVE = { max: 10, timeWindow: "1 minute" };

export async function authModule(app: FastifyInstance) {
  app.post("/auth/login/password", {
    config: { rateLimit: RATE_LIMIT_SENSITIVE }
  }, async (request, reply) => {
    const payload = request.body as { loginIntent: "smb_customer" | "bank_staff"; identifier: string; password: string };
    const result = await handlePasswordLogin({
      loginIntent: payload.loginIntent,
      identifier: payload.identifier,
      password: payload.password,
      ipAddress: request.ip,
      userAgent: request.headers["user-agent"] ?? "unknown"
    });

    if (result.errorCode === "INVALID_CREDENTIALS" || result.errorCode === "LOGIN_INTENT_MISMATCH") {
      return reply.code(401).send(result);
    }
    if (result.errorCode === "ACCOUNT_LOCKED") {
      return reply.code(423).send(result);
    }

    return result;
  });

  app.post("/auth/otp/request", {
    config: { rateLimit: RATE_LIMIT_AUTH }
  }, async (request, reply) => {
    const payload = request.body as { challengeId: string };
    const result = await resendChallenge(payload.challengeId);

    if (result.errorCode === "OTP_RESEND_COOLDOWN") return reply.code(429).send(result);
    if (result.errorCode === "OTP_EXPIRED") return reply.code(410).send(result);

    return result;
  });

  app.post("/auth/otp/verify", {
    config: { rateLimit: RATE_LIMIT_AUTH }
  }, async (request, reply) => {
    const payload = request.body as { challengeId: string; code: string };
    const result = await verifyChallenge(payload.challengeId, payload.code);

    if (result.errorCode === "OTP_INVALID") return reply.code(401).send(result);
    if (result.errorCode === "OTP_EXPIRED") return reply.code(410).send(result);
    if (result.errorCode === "ACCOUNT_LOCKED") return reply.code(423).send(result);

    return result;
  });

  app.get("/auth/session", async (request, reply) => {
    const session = await getSession(request.headers["x-session-token"] as string | undefined);
    if (!session) {
      return reply.code(401).send({ message: "Session not found", errorCode: "SESSION_INVALID" });
    }
    return { session };
  });

  app.get("/auth/staff", async (request, reply) => {
    const session = request.authContext?.session
      ?? await getSession(request.headers["x-session-token"] as string | undefined);

    if (!session) {
      return reply.code(401).send({ message: "Session not found", errorCode: "SESSION_INVALID" });
    }

    if (session.role !== "super_admin" || !session.actor.permissions.includes("tenant.manage")) {
      return reply.code(403).send({ message: "Super admin access required.", errorCode: "FORBIDDEN" });
    }

    return { users: await listPlatformStaffDirectory() };
  });

  app.get("/auth/security", async (request, reply) => {
    const settings = await getAuthSecuritySettings(request.headers["x-session-token"] as string | undefined);
    if (!settings) {
      return reply.code(401).send({ message: "Session not found", errorCode: "SESSION_INVALID" });
    }
    return { settings };
  });

  app.patch("/auth/security", async (request, reply) => {
    const payload = request.body as { totpRequired: boolean };
    const result = await updateAuthSecuritySettings(
      request.headers["x-session-token"] as string,
      Boolean(payload.totpRequired)
    );

    if (result.status === "session_invalid") return reply.code(401).send({ message: result.message, errorCode: "SESSION_INVALID" });
    if (result.status === "forbidden") return reply.code(403).send({ message: result.message, errorCode: "FORBIDDEN" });

    return { settings: result.settings };
  });

  app.post("/auth/logout", async (request) => {
    await logout(request.headers["x-session-token"] as string | undefined);
    return { status: "logged_out" as const };
  });

  app.post("/auth/terms/accept", async (request, reply) => {
    const payload = request.body as { documentType: "terms_of_service" | "privacy_notice"; acceptedVersion: string };
    const result = await acceptTerms(
      request.headers["x-session-token"] as string,
      payload.documentType,
      payload.acceptedVersion,
      request.ip,
      request.headers["user-agent"] ?? "unknown"
    );

    if (!result) {
      return reply.code(401).send({ message: "Session not found", errorCode: "SESSION_INVALID" });
    }

    return result;
  });

  app.post("/auth/password/reset/request", {
    config: { rateLimit: RATE_LIMIT_SENSITIVE }
  }, async (request) => {
    const payload = request.body as { identifier: string };
    return requestPasswordReset(payload.identifier);
  });

  app.post("/auth/password/reset/consume", {
    config: { rateLimit: RATE_LIMIT_SENSITIVE }
  }, async (request, reply) => {
    const payload = request.body as { token: string; newPassword: string };
    const result = await consumePasswordReset(payload.token, payload.newPassword);

    if (result.status === "invalid") {
      return reply.code(400).send(result);
    }

    return result;
  });

  app.post("/auth/token/refresh", {
    config: { rateLimit: RATE_LIMIT_AUTH }
  }, async (request, reply) => {
    const payload = request.body as { refreshToken: string };
    if (!payload.refreshToken) {
      return reply.code(400).send({ message: "refreshToken is required", errorCode: "SESSION_INVALID" });
    }

    const result = await rotateRefreshToken(
      payload.refreshToken,
      request.ip,
      request.headers["user-agent"] ?? "unknown"
    );

    if (!result) {
      return reply.code(401).send({ message: "Refresh token invalid or expired", errorCode: "SESSION_INVALID" });
    }

    return result;
  });

  // Internal maintenance — not exposed externally in production
  app.post("/auth/internal/cleanup", async () => {
    await cleanExpiredSessions();
    return { status: "ok" as const };
  });
}
