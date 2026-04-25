import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Role } from "@sqb/domain-types";
import { getSession } from "../modules/auth/store.js";
import type { RequestContext } from "../types/context.js";

declare module "fastify" {
  interface FastifyRequest {
    authContext: RequestContext;
  }
}

declare module "fastify" {
  interface FastifyInstance {
    requireRole: (request: FastifyRequest, reply: FastifyReply, allowedRoles: Role[]) => void;
  }
}

function resolveRole(rawRole?: string): Role {
  if (rawRole === "super_admin" || rawRole === "bank_admin" || rawRole === "company_admin" || rawRole === "employee") {
    return rawRole;
  }

  return "employee";
}

export async function requestContextPlugin(fastify: FastifyInstance) {
  fastify.decorateRequest("authContext", "" as unknown as RequestContext);

  fastify.addHook("onRequest", async (request: FastifyRequest) => {
    const sessionToken = request.headers["x-session-token"] as string | undefined;
    const session = sessionToken ? await getSession(sessionToken) : null;

    if (session) {
      request.authContext = {
        requestId: request.id,
        actorRole: session.actor.role,
        workspaceRole: session.actor.workspaceRole,
        actorUserId: session.actor.id,
        permissionGroups: session.actor.permissionGroups,
        permissions: session.actor.permissions,
        tenantId: session.tenantId,
        isAuthenticated: true,
        sessionToken,
        session
      };
      return;
    }

    request.authContext = {
      requestId: request.id,
      actorRole: resolveRole(request.headers["x-role"] as string | undefined),
      actorUserId: (request.headers["x-user-id"] as string | undefined) ?? "anonymous",
      permissions: [],
      tenantId: request.headers["x-tenant-id"] as string | undefined,
      isAuthenticated: false,
      sessionToken
    };
  });

  fastify.decorate("requireRole", (request: FastifyRequest, reply: FastifyReply, allowedRoles: Role[]) => {
    if (!allowedRoles.includes(request.authContext.actorRole)) {
      reply.code(403).send({
        message: "Forbidden",
        requestId: request.id
      });
    }
  });
}
