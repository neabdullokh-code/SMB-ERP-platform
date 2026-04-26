import { randomUUID } from "node:crypto";
import type {
  AuthSession,
  AuthenticatedUser,
  CompanyWorkspaceRole,
  CreateWorkspaceRequest,
  PermissionGroupKey,
  TenantContext,
  UpdateWorkspaceMemberAccessRequest,
  WorkspaceInvitation
} from "@sqb/domain-types";
import {
  demoTenant,
  demoUsers,
  isCompanyWorkspaceRole,
  permissionsForWorkspaceRole,
  resolvePermissionGroupsForWorkspaceRole
} from "@sqb/domain-types";
import { withDb } from "../../lib/db.js";
import { getLatestUserActivity } from "../auth/store.js";
import { seedDefaultFinanceAccountsForTenant } from "../finance/store.js";

type WorkspaceRecord = {
  tenant: TenantContext;
  businessType: string;
  region: string;
  address: string;
  tin: string;
  users: AuthenticatedUser[];
  invites: WorkspaceInvitation[];
  plan: CreateWorkspaceRequest["plan"];
  createdAt: string;
};

const workspaces = new Map<string, WorkspaceRecord>();
const LEGACY_DEMO_TENANT_ID = "00000000-0000-0000-0000-000000000101";
const LEGACY_DEMO_USERS: Array<{
  id: string;
  name: string;
  email: string;
  phone: string;
  workspaceRole: CompanyWorkspaceRole;
  permissionGroups: PermissionGroupKey[];
  lastActiveAt?: string;
}> = [
  {
    id: "00000000-0000-0000-0000-000000000201",
    name: "Jasur Azimov",
    email: "jasur@kamolot.uz",
    phone: "+998901111111",
    workspaceRole: "company_admin",
    permissionGroups: ["tenant_governance", "finance_operations", "inventory_operations", "production_operations", "service_operations", "audit_compliance"],
    lastActiveAt: new Date().toISOString()
  },
  {
    id: "00000000-0000-0000-0000-000000000207",
    name: "Malika Karimova",
    email: "malika@kamolot.uz",
    phone: "+998907777777",
    workspaceRole: "company_admin",
    permissionGroups: ["tenant_governance", "finance_operations", "inventory_operations", "production_operations", "service_operations", "audit_compliance"],
    lastActiveAt: new Date(Date.now() - 2 * 60 * 1000).toISOString()
  },
  {
    id: "00000000-0000-0000-0000-000000000202",
    name: "Bekzod Yusupov",
    email: "bekzod@kamolot.uz",
    phone: "+998903333333",
    workspaceRole: "warehouse_clerk",
    permissionGroups: ["inventory_operations"],
    lastActiveAt: new Date(Date.now() - 60 * 60 * 1000).toISOString()
  },
  {
    id: "00000000-0000-0000-0000-000000000208",
    name: "Dilnoza Rashidova",
    email: "dilnoza@kamolot.uz",
    phone: "+998906666666",
    workspaceRole: "accountant_economist",
    permissionGroups: ["finance_operations"],
    lastActiveAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "00000000-0000-0000-0000-000000000209",
    name: "Sardor Toshev",
    email: "sardor@kamolot.uz",
    phone: "+998908888888",
    workspaceRole: "production_operator",
    permissionGroups: ["production_operations"],
    lastActiveAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  }
];

const LEGACY_DEMO_INVITES: WorkspaceInvitation[] = [
  {
    id: "00000000-0000-0000-0000-000000000401",
    tenantId: LEGACY_DEMO_TENANT_ID,
    name: "Farhod Juraev",
    role: "accountant_economist",
    permissionGroups: ["finance_operations"],
    email: "farhod@kamolot.uz",
    status: "pending",
    invitedAt: new Date().toISOString()
  }
];

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function ensureDemoWorkspace(tenantId: string) {
  const isCurrentDemoTenant = tenantId === demoTenant.tenantId;
  const isLegacyDemoTenant = tenantId === LEGACY_DEMO_TENANT_ID;

  if (!isCurrentDemoTenant && !isLegacyDemoTenant) {
    return null;
  }

  const existing = workspaces.get(tenantId);
  if (existing) {
    return existing;
  }

  const tenant: TenantContext = isLegacyDemoTenant
    ? {
        tenantId,
        tenantSlug: demoTenant.tenantSlug,
        tenantName: demoTenant.tenantName,
        isolationMode: demoTenant.isolationMode
      }
    : demoTenant;
  const sourceUsers = isLegacyDemoTenant ? LEGACY_DEMO_USERS : demoUsers.filter((user) => user.tenantId === tenantId);
  const invites = isLegacyDemoTenant
    ? LEGACY_DEMO_INVITES.map((invite) => ({ ...invite, tenantId }))
    : [];

  const workspace: WorkspaceRecord = {
    tenant,
    businessType: "Wholesale",
    region: "Tashkent",
    address: "Mirobod district, Tashkent 100170",
    tin: "301 452 776",
    users: sourceUsers
      .map((user) =>
        createWorkspaceUserRecord({
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          tenantId,
          workspaceRole: user.workspaceRole ?? "warehouse_clerk",
          permissionGroups: user.permissionGroups,
          lastActiveAt: user.lastActiveAt
        })
      ),
    invites,
    plan: "business_os_free",
    createdAt: new Date().toISOString()
  };

  workspaces.set(tenantId, workspace);
  return workspace;
}

function normalizeWorkspaceRole(role: string): CompanyWorkspaceRole {
  const normalized = role.trim().toLowerCase().replace(/\s+/g, "_");

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

function normalizePermissionGroups(role: CompanyWorkspaceRole, permissionGroups?: readonly PermissionGroupKey[]) {
  return resolvePermissionGroupsForWorkspaceRole(role, permissionGroups);
}

function createWorkspaceUserRecord(input: {
  id: string;
  name: string;
  email?: string;
  phone: string;
  tenantId: string;
  workspaceRole: CompanyWorkspaceRole;
  permissionGroups?: readonly PermissionGroupKey[];
  lastActiveAt?: string;
}): AuthenticatedUser {
  const permissionGroups = normalizePermissionGroups(input.workspaceRole, input.permissionGroups);

  return {
    id: input.id,
    name: input.name,
    email: input.email,
    phone: input.phone,
    role: input.workspaceRole === "owner" || input.workspaceRole === "company_admin" ? "company_admin" : "employee",
    workspaceRole: input.workspaceRole,
    permissionGroups,
    permissions: permissionsForWorkspaceRole(input.workspaceRole, permissionGroups),
    tenantId: input.tenantId,
    lastActiveAt: input.lastActiveAt
  };
}

function createWorkspaceInvitationRecord(input: {
  id?: string;
  tenantId: string;
  name: string;
  role: string;
  email: string;
  status?: WorkspaceInvitation["status"];
  invitedAt?: string;
  permissionGroups?: readonly PermissionGroupKey[];
}): WorkspaceInvitation {
  const workspaceRole = normalizeWorkspaceRole(input.role);
  const permissionGroups = normalizePermissionGroups(workspaceRole, input.permissionGroups);

  return {
    id: input.id ?? randomUUID(),
    tenantId: input.tenantId,
    name: input.name.trim(),
    role: workspaceRole,
    permissionGroups,
    email: input.email.trim().toLowerCase(),
    status: input.status ?? "pending",
    invitedAt: input.invitedAt ?? new Date().toISOString()
  };
}

export function registerWorkspace(input: {
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  payload: CreateWorkspaceRequest;
  adminUser: AuthenticatedUser;
}) {
  const tenant: TenantContext = {
    tenantId: input.tenantId,
    tenantSlug: input.tenantSlug,
    tenantName: input.tenantName,
    isolationMode: "logical"
  };

  const invites = input.payload.invites.map((invite) =>
    createWorkspaceInvitationRecord({
      tenantId: input.tenantId,
      name: invite.name,
      role: invite.role,
      email: invite.email,
      permissionGroups: invite.permissionGroups
    })
  );

  workspaces.set(input.tenantId, {
    tenant,
    businessType: input.payload.businessType,
    region: input.payload.region,
    address: input.payload.address,
    tin: input.payload.tin,
    users: [
      createWorkspaceUserRecord({
        id: input.adminUser.id,
        name: input.adminUser.name,
        email: input.adminUser.email,
        phone: input.adminUser.phone,
        tenantId: input.tenantId,
        workspaceRole: input.adminUser.workspaceRole ?? "company_admin",
        permissionGroups: input.adminUser.permissionGroups,
        lastActiveAt: new Date().toISOString()
      })
    ],
    invites,
    plan: input.payload.plan,
    createdAt: new Date().toISOString()
  });

  return tenant;
}

export function unregisterWorkspace(tenantId: string) {
  workspaces.delete(tenantId);
}

export async function persistWorkspace(input: {
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  payload: CreateWorkspaceRequest;
  adminUser: AuthenticatedUser;
  session: AuthSession;
}) {
  return withDb(async (pool) => {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      await client.query(
        `insert into tenants (id, slug, name, status)
         values ($1, $2, $3, 'active')
         on conflict (id) do update
         set slug = excluded.slug,
             name = excluded.name,
             status = 'active'`,
        [input.tenantId, input.tenantSlug, input.tenantName]
      );

      await client.query(
        `insert into tenant_profiles (
          tenant_id,
          tin,
          business_type,
          region,
          address,
          plan
        ) values ($1, $2, $3, $4, $5, $6)
        on conflict (tenant_id) do update
        set tin = excluded.tin,
            business_type = excluded.business_type,
            region = excluded.region,
            address = excluded.address,
            plan = excluded.plan,
            updated_at = now()`,
        [
          input.tenantId,
          input.payload.tin,
          input.payload.businessType,
          input.payload.region,
          input.payload.address,
          input.payload.plan
        ]
      );

      await client.query(
        `insert into users (id, full_name, email, phone, status)
         values ($1, $2, $3, $4, 'active')
         on conflict (id) do update
         set full_name = excluded.full_name,
             email = excluded.email,
             phone = excluded.phone,
             status = 'active'`,
        [input.adminUser.id, input.adminUser.name, input.adminUser.email ?? null, input.adminUser.phone]
      );

      await client.query(
        `insert into memberships (tenant_id, user_id, role, permission_groups)
         values ($1, $2, $3, $4::jsonb)`,
        [
          input.tenantId,
          input.adminUser.id,
          input.adminUser.workspaceRole ?? "company_admin",
          JSON.stringify(normalizePermissionGroups(input.adminUser.workspaceRole ?? "company_admin", input.adminUser.permissionGroups))
        ]
      );

      await seedDefaultFinanceAccountsForTenant(client, input.tenantId, input.adminUser.id);

      await client.query(
        `insert into sessions (
          id,
          user_id,
          tenant_id,
          role,
          session_token,
          is_privileged,
          requires_terms_acceptance,
          redirect_path,
          expires_at
        ) values (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9::timestamptz
        )`,
        [
          randomUUID(),
          input.adminUser.id,
          input.tenantId,
          input.session.role,
          input.session.sessionId,
          input.session.isPrivileged,
          input.session.requiresTermsAcceptance,
          input.session.redirectPath,
          input.session.expiresAt
        ]
      );

      for (const invite of input.payload.invites) {
        const workspaceRole = normalizeWorkspaceRole(invite.role);
        const permissionGroups = normalizePermissionGroups(workspaceRole, invite.permissionGroups);
        await client.query(
          `insert into workspace_invitations (
            tenant_id,
            full_name,
            email,
            role,
            permission_groups,
            accept_token,
            status
          ) values ($1, $2, $3, $4, $5::jsonb, gen_random_uuid()::text, 'pending')
          on conflict (tenant_id, email) do update
          set full_name = excluded.full_name,
              role = excluded.role,
              permission_groups = excluded.permission_groups,
              accept_token = coalesce(workspace_invitations.accept_token, gen_random_uuid()::text),
              status = 'pending'`,
          [
            input.tenantId,
            invite.name.trim(),
            invite.email.trim().toLowerCase(),
            workspaceRole,
            JSON.stringify(permissionGroups)
          ]
        );
      }

      await client.query("COMMIT");
      return true;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  });
}

export async function getWorkspaceByTenantId(tenantId?: string) {
  if (!tenantId) {
    return null;
  }

  const demoWorkspace = ensureDemoWorkspace(tenantId);
  if (demoWorkspace) {
    demoWorkspace.users = await Promise.all(demoWorkspace.users.map(async (user) => ({
      ...user,
      lastActiveAt: await getLatestUserActivity(user.id, tenantId)
    })));
    return demoWorkspace;
  }

  const memoryWorkspace = workspaces.get(tenantId);
  if (memoryWorkspace) {
    memoryWorkspace.users = await Promise.all(memoryWorkspace.users.map(async (user) => ({
      ...user,
      lastActiveAt: await getLatestUserActivity(user.id, tenantId)
    })));
    return memoryWorkspace;
  }

  if (!isUuid(tenantId)) {
    return null;
  }

  const persistedWorkspace = await withDb(async (pool) => {
    const client = await pool.connect();

    try {
      const tenantResult = await client.query<{
        tenant_id: string;
        tenant_slug: string;
        tenant_name: string;
        tin: string;
        business_type: string;
        region: string;
        address: string;
        plan: CreateWorkspaceRequest["plan"];
      }>(
        `select
           t.id as tenant_id,
           t.slug as tenant_slug,
           t.name as tenant_name,
           p.tin,
           p.business_type,
           p.region,
           p.address,
           p.plan
         from tenants t
         join tenant_profiles p on p.tenant_id = t.id
         where t.id = $1`,
        [tenantId]
      );

      if (tenantResult.rowCount === 0) {
        return null;
      }

      const usersResult = await client.query<{
        user_id: string;
        full_name: string;
        email: string | null;
        phone: string;
        role: string;
        permission_groups: PermissionGroupKey[] | null;
      }>(
        `select
           u.id as user_id,
           u.full_name,
           u.email,
           u.phone,
           m.role,
           coalesce(
             case
               when jsonb_typeof(m.permission_groups) = 'array' then array(select jsonb_array_elements_text(m.permission_groups))
               else '{}'::text[]
             end,
             '{}'::text[]
           ) as permission_groups
         from users u
         join memberships m on m.user_id = u.id
         where m.tenant_id = $1
         order by case
           when m.role = 'owner' then 1
           when m.role = 'company_admin' then 2
           when m.role = 'executive' then 3
           when m.role = 'accountant_economist' then 4
           when m.role = 'warehouse_clerk' then 5
           when m.role = 'production_operator' then 6
           when m.role = 'service_staff' then 7
           when m.role = 'auditor' then 8
           when m.role = 'manager' then 9
           when m.role = 'operator' then 10
           else 11
         end, u.full_name asc`,
        [tenantId]
      );

      const invitesResult = await client.query<{
        invitation_id: string;
        full_name: string;
        email: string;
        role: string;
        permission_groups: PermissionGroupKey[] | null;
        status: WorkspaceInvitation["status"];
        invited_at: string;
      }>(
        `select
           id as invitation_id,
           full_name,
           email,
           role,
           coalesce(
             case
               when jsonb_typeof(permission_groups) = 'array' then array(select jsonb_array_elements_text(permission_groups))
               else '{}'::text[]
             end,
             '{}'::text[]
           ) as permission_groups,
           status,
           invited_at
         from workspace_invitations
         where tenant_id = $1
         order by invited_at asc`,
        [tenantId]
      );

      return {
        tenant: {
          tenantId: tenantResult.rows[0].tenant_id,
          tenantSlug: tenantResult.rows[0].tenant_slug,
          tenantName: tenantResult.rows[0].tenant_name,
          isolationMode: "logical" as const
        },
        businessType: tenantResult.rows[0].business_type,
        region: tenantResult.rows[0].region,
        address: tenantResult.rows[0].address,
        tin: tenantResult.rows[0].tin,
        users: usersResult.rows
          .filter((row) => isCompanyWorkspaceRole(row.role))
          .map(async (row) =>
            createWorkspaceUserRecord({
              id: row.user_id,
              name: row.full_name,
              email: row.email ?? undefined,
              phone: row.phone,
              tenantId,
              workspaceRole: row.role as CompanyWorkspaceRole,
              permissionGroups: row.permission_groups ?? undefined,
              lastActiveAt: await getLatestUserActivity(row.user_id, tenantId)
            })
          ),
        invites: invitesResult.rows.map((row) =>
          createWorkspaceInvitationRecord({
            id: row.invitation_id,
            tenantId,
            name: row.full_name,
            role: row.role,
            email: row.email,
            status: row.status,
            invitedAt: row.invited_at,
            permissionGroups: row.permission_groups ?? undefined
          })
        ),
        plan: tenantResult.rows[0].plan,
        createdAt: new Date().toISOString()
      } satisfies Omit<WorkspaceRecord, "users"> & { users: Promise<AuthenticatedUser>[] };
    } finally {
      client.release();
    }
  });

  if (!persistedWorkspace) {
    return null;
  }

  return {
    ...persistedWorkspace,
    users: await Promise.all(persistedWorkspace.users)
  } satisfies WorkspaceRecord;
}

export async function findWorkspaceConflict(input: { tenantSlug: string; tin: string; companyName: string }) {
  const slug = input.tenantSlug.trim().toLowerCase();
  const tin = input.tin.trim();
  const companyName = input.companyName.trim().toLowerCase();

  for (const workspace of workspaces.values()) {
    if (workspace.tenant.tenantSlug.toLowerCase() === slug) {
      return { field: "companyName", message: "A workspace with a similar company slug already exists." };
    }

    if (workspace.tin === tin) {
      return { field: "tin", message: "A workspace already exists for this TIN / Tax ID." };
    }

    if (workspace.tenant.tenantName.trim().toLowerCase() === companyName) {
      return { field: "companyName", message: "A workspace with this company name already exists." };
    }
  }

  const persistedConflict = await withDb(async (pool) => {
    const conflictResult = await pool.query<{
      slug: string;
      name: string;
      tin: string | null;
    }>(
      `select t.slug, t.name, p.tin
       from tenants t
       join tenant_profiles p on p.tenant_id = t.id
       where lower(t.slug) = $1 or lower(t.name) = $2 or p.tin = $3`,
      [slug, companyName, tin]
    );

    if (conflictResult.rows.find((row) => row.slug.toLowerCase() === slug)) {
      return { field: "companyName", message: "A workspace with a similar company slug already exists." };
    }

    if (conflictResult.rows.find((row) => row.name.trim().toLowerCase() === companyName)) {
      return { field: "companyName", message: "A workspace with this company name already exists." };
    }

    if (conflictResult.rows.find((row) => row.tin === tin)) {
      return { field: "tin", message: "A workspace already exists for this TIN / Tax ID." };
    }

    return null;
  });

  return persistedConflict ?? null;
}

export async function hasPersistedUserEmail(email: string) {
  const lookup = email.trim().toLowerCase();

  const match = await withDb(async (pool) => {
    const result = await pool.query<{ exists: boolean }>(
      `select exists(select 1 from users where lower(email) = $1) as exists`,
      [lookup]
    );

    return result.rows[0]?.exists ?? false;
  });

  return match ?? false;
}

export async function getInviteByToken(token: string) {
  return withDb(async (pool) => {
    const result = await pool.query<{
      id: string;
      tenant_id: string;
      full_name: string;
      email: string;
      role: string;
      permission_groups: PermissionGroupKey[] | null;
      status: string;
    }>(
      `select
         id,
         tenant_id,
         full_name,
         email,
         role,
         coalesce(
           case
             when jsonb_typeof(permission_groups) = 'array' then array(select jsonb_array_elements_text(permission_groups))
             else '{}'::text[]
           end,
           '{}'::text[]
         ) as permission_groups,
         status
       from workspace_invitations
       where accept_token = $1
         and status = 'pending'
       limit 1`,
      [token]
    );

    return result.rows[0] ?? null;
  });
}

export async function acceptInvite(input: {
  token: string;
  name: string;
  phone: string;
  password: string;
}): Promise<{ status: "ok"; userId: string } | { status: "invalid"; message: string }> {
  const result = await withDb(async (pool) => {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const inviteResult = await client.query<{
        id: string;
        tenant_id: string;
        email: string;
        role: string;
        permission_groups: PermissionGroupKey[] | null;
      }>(
        `select
           id,
           tenant_id,
           email,
           role,
           coalesce(
             case
               when jsonb_typeof(permission_groups) = 'array' then array(select jsonb_array_elements_text(permission_groups))
               else '{}'::text[]
             end,
             '{}'::text[]
           ) as permission_groups
         from workspace_invitations
         where accept_token = $1 and status = 'pending'
         limit 1
         for update`,
        [input.token]
      );

      if ((inviteResult.rowCount ?? 0) === 0) {
        await client.query("ROLLBACK");
        return { status: "invalid" as const, message: "This invitation link is invalid, already used, or has been revoked." };
      }

      const invite = inviteResult.rows[0];
      const userId = randomUUID();

      await client.query(
        `insert into users (id, full_name, email, phone, status)
         values ($1, $2, $3, $4, 'active')`,
        [userId, input.name.trim(), invite.email, input.phone.trim()]
      );

      await client.query(
        `insert into credentials (user_id, password_hash)
         values ($1, crypt($2, gen_salt('bf')))`,
        [userId, input.password]
      );

      await client.query(
        `insert into memberships (tenant_id, user_id, role, permission_groups)
         values ($1, $2, $3, $4::jsonb)`,
        [
          invite.tenant_id,
          userId,
          normalizeWorkspaceRole(invite.role),
          JSON.stringify(normalizePermissionGroups(normalizeWorkspaceRole(invite.role), invite.permission_groups ?? undefined))
        ]
      );

      await client.query(
        `insert into otp_methods (user_id, method_type, provider_name, destination, is_primary, is_enabled)
         values ($1, 'sms', 'platform_sms', $2, true, true)`,
        [userId, input.phone.trim()]
      );

      await client.query(
        `update workspace_invitations
         set status = 'accepted', accepted_at = now()
         where id = $1`,
        [invite.id]
      );

      await client.query("COMMIT");
      return { status: "ok" as const, userId };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  });

  return result ?? { status: "invalid", message: "Unable to process invitation right now." };
}

export function upsertWorkspaceInviteRecord(input: {
  tenantId: string;
  name: string;
  email: string;
  role: CompanyWorkspaceRole;
  permissionGroups?: readonly PermissionGroupKey[];
}) {
  const workspace = workspaces.get(input.tenantId) ?? ensureDemoWorkspace(input.tenantId);
  if (!workspace) {
    return null;
  }

  const invite = createWorkspaceInvitationRecord({
    tenantId: input.tenantId,
    name: input.name,
    role: input.role,
    email: input.email,
    permissionGroups: input.permissionGroups
  });

  const existingIndex = workspace.invites.findIndex((entry) => entry.email.toLowerCase() === invite.email.toLowerCase());
  if (existingIndex >= 0) {
    workspace.invites[existingIndex] = { ...workspace.invites[existingIndex], ...invite };
    return workspace.invites[existingIndex];
  }

  workspace.invites.push(invite);
  return invite;
}

export async function createWorkspaceInvite(input: {
  tenantId: string;
  name: string;
  email: string;
  role: CompanyWorkspaceRole;
  permissionGroups?: readonly PermissionGroupKey[];
}) {
  const invite = createWorkspaceInvitationRecord({
    tenantId: input.tenantId,
    name: input.name,
    role: input.role,
    email: input.email,
    permissionGroups: input.permissionGroups
  });

  upsertWorkspaceInviteRecord(input);

  if (!isUuid(input.tenantId)) {
    return getWorkspaceByTenantId(input.tenantId);
  }

  const persisted = await withDb(async (pool) => {
    await pool.query(
      `insert into workspace_invitations (
        tenant_id,
        full_name,
        email,
        role,
        permission_groups,
        accept_token,
        status
      ) values ($1, $2, $3, $4, $5::jsonb, gen_random_uuid()::text, 'pending')
      on conflict (tenant_id, email) do update
      set full_name = excluded.full_name,
          role = excluded.role,
          permission_groups = excluded.permission_groups,
          accept_token = coalesce(workspace_invitations.accept_token, gen_random_uuid()::text),
          status = 'pending'`,
      [
        input.tenantId,
        invite.name,
        invite.email,
        invite.role,
        JSON.stringify(invite.permissionGroups ?? [])
      ]
    );
    return true;
  });

  if (!persisted) {
    return null;
  }

  return getWorkspaceByTenantId(input.tenantId);
}

export async function updateWorkspaceMemberAccess(input: {
  tenantId: string;
  userId: string;
  payload: UpdateWorkspaceMemberAccessRequest;
}) {
  const workspaceRole = normalizeWorkspaceRole(input.payload.role);
  const permissionGroups = normalizePermissionGroups(workspaceRole, input.payload.permissionGroups);

  const workspace = workspaces.get(input.tenantId);
  const resolvedWorkspace = workspace ?? ensureDemoWorkspace(input.tenantId);
  if (resolvedWorkspace) {
    const userIndex = resolvedWorkspace.users.findIndex((user) => user.id === input.userId);
    if (userIndex >= 0) {
      const existing = resolvedWorkspace.users[userIndex];
      resolvedWorkspace.users[userIndex] = createWorkspaceUserRecord({
        id: existing.id,
        name: existing.name,
        email: existing.email,
        phone: existing.phone,
        tenantId: input.tenantId,
        workspaceRole,
        permissionGroups,
        lastActiveAt: existing.lastActiveAt
      });
    }
  }

  if (!isUuid(input.tenantId)) {
    return getWorkspaceByTenantId(input.tenantId);
  }

  const persisted = await withDb(async (pool) => {
    const result = await pool.query(
      `update memberships
       set role = $3,
           permission_groups = $4::jsonb
       where tenant_id = $1
         and user_id = $2`,
      [input.tenantId, input.userId, workspaceRole, JSON.stringify(permissionGroups)]
    );

    return (result.rowCount ?? 0) > 0;
  });

  if (!persisted) {
    return null;
  }

  return getWorkspaceByTenantId(input.tenantId);
}

export async function revokeWorkspaceInvite(input: { tenantId: string; inviteId: string }) {
  const workspace = workspaces.get(input.tenantId) ?? ensureDemoWorkspace(input.tenantId);
  if (workspace) {
    const invite = workspace.invites.find((entry) => entry.id === input.inviteId);
    if (invite) {
      invite.status = "revoked";
    }
  }

  if (!isUuid(input.tenantId)) {
    return getWorkspaceByTenantId(input.tenantId);
  }

  const persisted = await withDb(async (pool) => {
    const result = await pool.query(
      `update workspace_invitations
       set status = 'revoked'
       where tenant_id = $1
         and id = $2`,
      [input.tenantId, input.inviteId]
    );

    return (result.rowCount ?? 0) > 0;
  });

  if (!persisted) {
    return null;
  }

  return getWorkspaceByTenantId(input.tenantId);
}
