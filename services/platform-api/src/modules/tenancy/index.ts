import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { CompanyWorkspaceRole, CreateWorkspaceRequest, PermissionGroupKey } from "@sqb/domain-types";
import { companyWorkspaceAccessPolicies, permissionGroupDefinitions } from "@sqb/domain-types";
import { getSession, hasAccountEmail, provisionWorkspaceSession, rollbackProvisionedWorkspaceSession } from "../auth/store.js";
import {
  acceptInvite,
  createWorkspaceInvite,
  findWorkspaceConflict,
  getInviteByToken,
  getWorkspaceByTenantId,
  hasPersistedUserEmail,
  persistWorkspace,
  registerWorkspace,
  revokeWorkspaceInvite,
  unregisterWorkspace,
  updateWorkspaceMemberAccess
} from "./store.js";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32) || "workspace";
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizeWorkspaceRole(value: string): CompanyWorkspaceRole {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, "_");

  if (normalized === "warehouse_clerk" || normalized === "warehouse_manager" || normalized === "кладовщик") return "warehouse_clerk";
  if (normalized === "production_operator" || normalized === "shop_chief" || normalized === "оператор_производства") return "production_operator";
  if (normalized === "service_staff" || normalized === "service_operator" || normalized === "сотрудник_сервиса") return "service_staff";
  if (normalized === "accountant_economist" || normalized === "accountant" || normalized === "economist" || normalized === "бухгалтер" || normalized === "экономист") return "accountant_economist";
  if (normalized === "executive" || normalized === "rahbar" || normalized === "руководитель") return "executive";
  if (normalized === "auditor" || normalized === "controller" || normalized === "auditor_controller" || normalized === "аудитор" || normalized === "контролер") return "auditor";
  if (normalized === "owner") return "owner";
  if (normalized === "company_admin" || normalized === "company") return "company_admin";
  if (normalized === "manager" || normalized === "accountant") return "manager";
  if (normalized === "operator" || normalized === "employee" || normalized === "warehouse_manager") return "operator";

  return "warehouse_clerk";
}

export async function tenancyModule(app: FastifyInstance) {
  async function ensureAuthenticatedTenantAccess(request: FastifyRequest, reply: FastifyReply) {
    const session = request.authContext?.session
      ?? await getSession(request.headers["x-session-token"] as string | undefined);

    if (!session?.tenantId) {
      reply.code(401).send({ message: "Authenticated tenant session required." });
      return null;
    }

    return session;
  }

  async function ensureTenantManagementAccess(request: FastifyRequest, reply: FastifyReply) {
    const session = await ensureAuthenticatedTenantAccess(request, reply);
    if (!session) {
      return null;
    }

    if (!session.actor.permissions.includes("tenant.manage")) {
      reply.code(403).send({ message: "Tenant management permission required." });
      return null;
    }

    return session;
  }

  app.get("/tenants/me", async (request, reply) => {
    const session = await ensureTenantManagementAccess(request, reply);
    if (!session) {
      return;
    }

    const workspace = await getWorkspaceByTenantId(session.tenantId);
    const accessCatalog = {
      workspaceRoles: Object.values(companyWorkspaceAccessPolicies),
      permissionGroups: Object.values(permissionGroupDefinitions)
    };

    if (!workspace) {
      return reply.code(404).send({ message: "Workspace not found." });
    }

    return {
      tenant: workspace.tenant,
      actor: session.actor,
      users: workspace.users,
      invites: workspace.invites,
      accessCatalog
    };
  });

  app.post("/tenants/onboarding", async (request, reply) => {
    const payload = request.body as {
      companyName?: string;
      tin?: string;
      region?: string;
      address?: string;
      businessType?: string;
      invites?: Array<{ name: string; role: string; email: string }>;
      plan?: "business_os_free";
    };

    if (!payload.companyName?.trim() || !payload.tin?.trim() || !payload.region?.trim() || !payload.address?.trim() || !payload.businessType?.trim()) {
      return reply.code(400).send({
        message: "Company name, tax ID, region, address, and business type are required."
      });
    }

    const normalizedInvites = Array.isArray(payload.invites)
      ? payload.invites
          .map((invite) => ({
            name: invite.name?.trim() ?? "",
            role: normalizeWorkspaceRole(invite.role?.trim() ?? "warehouse_clerk"),
            email: invite.email?.trim().toLowerCase() ?? "",
            permissionGroups: undefined as PermissionGroupKey[] | undefined
          }))
          .filter((invite) => invite.name || invite.email)
      : [];

    const incompleteInvite = normalizedInvites.find((invite) => !invite.name || !invite.email || !invite.role);
    if (incompleteInvite) {
      return reply.code(400).send({
        message: "Every team member row must include name, role, and email."
      });
    }

    const invalidInvite = normalizedInvites.find((invite) => !isValidEmail(invite.email));
    if (invalidInvite) {
      return reply.code(400).send({
        message: `Invite email is invalid: ${invalidInvite.email}`
      });
    }

    const duplicateInviteEmail = normalizedInvites.find((invite, index) =>
      normalizedInvites.findIndex((candidate) => candidate.email === invite.email) !== index
    );
    if (duplicateInviteEmail) {
      return reply.code(409).send({
        message: `Duplicate invite email detected: ${duplicateInviteEmail.email}`
      });
    }

    const adminInvite = normalizedInvites.find((invite) => invite.role === "company_admin");
    if (adminInvite && (hasAccountEmail(adminInvite.email) || await hasPersistedUserEmail(adminInvite.email))) {
      return reply.code(409).send({
        message: "The company admin email is already used by another account."
      });
    }

    const conflict = await findWorkspaceConflict({
      tenantSlug: slugify(payload.companyName),
      tin: payload.tin,
      companyName: payload.companyName
    });
    if (conflict) {
      return reply.code(409).send({
        message: conflict.message,
        field: conflict.field
      });
    }

    const normalizedPayload: CreateWorkspaceRequest = {
      companyName: payload.companyName.trim(),
      tin: payload.tin.trim(),
      region: payload.region.trim(),
      address: payload.address.trim(),
      businessType: payload.businessType.trim(),
      invites: normalizedInvites,
      plan: payload.plan ?? "business_os_free"
    };

    const provisioned = await provisionWorkspaceSession(normalizedPayload);
    registerWorkspace({
      tenantId: provisioned.tenantId,
      tenantSlug: provisioned.tenantSlug,
      tenantName: provisioned.tenantName,
      payload: normalizedPayload,
      adminUser: provisioned.adminUser
    });
    const persisted = await persistWorkspace({
      tenantId: provisioned.tenantId,
      tenantSlug: provisioned.tenantSlug,
      tenantName: provisioned.tenantName,
      payload: normalizedPayload,
      adminUser: provisioned.adminUser,
      session: provisioned.session
    });

    if (!persisted) {
      unregisterWorkspace(provisioned.tenantId);
      rollbackProvisionedWorkspaceSession(provisioned.adminUser.id, provisioned.session.sessionId);

      return reply.code(503).send({
        message: "Workspace persistence unavailable. Database write did not complete."
      });
    }

    return {
      status: "workspace_created" as const,
      tenantId: provisioned.tenantId,
      tenantName: provisioned.tenantName,
      session: provisioned.session
    };
  });

  app.get("/auth/invites/:token", async (request, reply) => {
    const { token } = request.params as { token: string };
    const invite = await getInviteByToken(token);
    if (!invite) {
      return reply.code(404).send({ message: "Invitation not found or already used." });
    }
    return {
      tenantId: invite.tenant_id,
      email: invite.email,
      name: invite.full_name,
      role: invite.role,
      permissionGroups: invite.permission_groups ?? []
    };
  });

  app.post("/auth/invites/:token/accept", async (request, reply) => {
    const { token } = request.params as { token: string };
    const payload = request.body as { name: string; phone: string; password: string };

    if (!payload.name?.trim() || !payload.phone?.trim() || !payload.password || payload.password.length < 8) {
      return reply.code(400).send({ message: "Name, phone, and a password of at least 8 characters are required." });
    }

    const result = await acceptInvite({ token, name: payload.name, phone: payload.phone, password: payload.password });

    if (result.status === "invalid") {
      return reply.code(400).send(result);
    }

    return result;
  });

  app.post("/tenants/invites", async (request, reply) => {
    const session = await ensureTenantManagementAccess(request, reply);
    if (!session) {
      return;
    }

    const tenantId = session.tenantId!;
    const payload = request.body as {
      name?: string;
      email?: string;
      role?: string;
      permissionGroups?: string[];
    };

    if (!payload.name?.trim() || !payload.email?.trim() || !payload.role?.trim()) {
      return reply.code(400).send({ message: "Name, email, and role are required." });
    }

    if (!isValidEmail(payload.email)) {
      return reply.code(400).send({ message: "Invite email is invalid." });
    }

    const workspace = await createWorkspaceInvite({
      tenantId,
      name: payload.name.trim(),
      email: payload.email.trim().toLowerCase(),
      role: normalizeWorkspaceRole(payload.role),
      permissionGroups: Array.isArray(payload.permissionGroups) ? payload.permissionGroups as PermissionGroupKey[] : undefined
    });

    if (!workspace) {
      return reply.code(503).send({ message: "Unable to create invite right now." });
    }

    return reply.code(201).send({
      tenant: workspace.tenant,
      users: workspace.users,
      invites: workspace.invites
    });
  });

  app.patch("/tenants/members/:userId", async (request, reply) => {
    const session = await ensureTenantManagementAccess(request, reply);
    if (!session) {
      return;
    }

    const tenantId = session.tenantId!;
    const { userId } = request.params as { userId: string };
    const payload = request.body as { role?: string; permissionGroups?: string[] };

    if (!payload.role?.trim() || !Array.isArray(payload.permissionGroups)) {
      return reply.code(400).send({ message: "Role and permission groups are required." });
    }

    const workspace = await updateWorkspaceMemberAccess({
      tenantId,
      userId,
      payload: {
        role: normalizeWorkspaceRole(payload.role),
        permissionGroups: payload.permissionGroups as PermissionGroupKey[]
      }
    });

    if (!workspace) {
      return reply.code(404).send({ message: "Team member not found." });
    }

    return {
      tenant: workspace.tenant,
      users: workspace.users,
      invites: workspace.invites
    };
  });

  app.post("/tenants/invites/:inviteId/revoke", async (request, reply) => {
    const session = await ensureTenantManagementAccess(request, reply);
    if (!session) {
      return;
    }

    const tenantId = session.tenantId!;
    const { inviteId } = request.params as { inviteId: string };
    const workspace = await revokeWorkspaceInvite({ tenantId, inviteId });

    if (!workspace) {
      return reply.code(404).send({ message: "Invitation not found." });
    }

    return {
      tenant: workspace.tenant,
      users: workspace.users,
      invites: workspace.invites
    };
  });
}
