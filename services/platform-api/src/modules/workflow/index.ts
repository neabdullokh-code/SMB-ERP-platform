import type { FastifyInstance } from "fastify";
import { fixtures } from "../../lib/fixtures.js";
import { resolveRequestAuth } from "../../lib/permissions.js";

export async function workflowModule(app: FastifyInstance) {
  app.get("/workflows/pending", async (request, reply) => {
    const auth = await resolveRequestAuth(request);

    if (!auth.tenantId) {
      return reply.code(400).send({ message: "x-tenant-id header is required for workflow routes" });
    }

    return {
      approvals: fixtures.approvals.filter((approval) => approval.tenantId === auth.tenantId)
    };
  });
}

