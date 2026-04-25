import type { FastifyReply, FastifyRequest } from "fastify";
import type { Permission } from "@sqb/domain-types";
import { hasPermission } from "@sqb/domain-types";
import { getSession } from "../modules/auth/store.js";

export async function resolveRequestAuth(request: FastifyRequest) {
  const sessionToken = request.headers["x-session-token"] as string | undefined;
  const session = sessionToken ? await getSession(sessionToken) : null;

  if (session) {
    return {
      isAuthenticated: true,
      session,
      permissions: session.actor.permissions,
      tenantId: session.tenantId,
      actorUserId: session.actor.id,
      actorRole: session.actor.role
    };
  }

  return {
    isAuthenticated: false,
    session: null,
    permissions: [] as Permission[],
    tenantId: undefined,
    actorUserId: "anonymous",
    actorRole: "employee" as const
  };
}

export async function requireTenantPermission(
  request: FastifyRequest,
  reply: FastifyReply,
  permission: Permission,
  message: string
) {
  const auth = await resolveRequestAuth(request);

  if (!auth.isAuthenticated || !auth.session) {
    reply.code(401).send({ message: "Authenticated session required." });
    return null;
  }

  if (!auth.tenantId) {
    reply.code(400).send({ message: "Tenant-scoped session required." });
    return null;
  }

  if (!hasPermission(auth.permissions, permission)) {
    reply.code(403).send({ message });
    return null;
  }

  return {
    tenantId: auth.tenantId,
    actorUserId: auth.actorUserId
  };
}

export async function requireGlobalPermission(
  request: FastifyRequest,
  reply: FastifyReply,
  permission: Permission,
  message: string
) {
  const auth = await resolveRequestAuth(request);

  if (!auth.isAuthenticated || !auth.session) {
    reply.code(401).send({ message: "Authenticated session required." });
    return null;
  }

  if (!hasPermission(auth.permissions, permission)) {
    reply.code(403).send({ message });
    return null;
  }

  return {
    actorUserId: auth.actorUserId,
    actorRole: auth.actorRole
  };
}
