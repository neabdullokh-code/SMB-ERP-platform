import { createHash, randomInt, randomUUID } from "node:crypto";
import { loadEnv } from "@sqb/config";
import type {
  AuditEvent,
  AuthChallenge,
  AuthSecuritySettings,
  AuthSession,
  AuthenticatedUser,
  CompanyWorkspaceRole,
  CreateWorkspaceRequest,
  LoginIntent,
  OtpDeliveryMethod,
  OtpVerifyResponse,
  PasswordLoginResponse,
  Permission,
  PermissionGroupKey,
  PrivilegedAccessFlags,
  Role,
  SessionActor,
  TermsAcceptance
} from "@sqb/domain-types";
import {
  companyWorkspaceAuthRole,
  defaultPermissionGroupsForWorkspaceRole,
  isCompanyWorkspaceRole,
  permissionsForRole as resolveRolePermissions,
  permissionsForWorkspaceRole,
  resolvePermissionGroupsForWorkspaceRole,
  roleAccessPolicies
} from "@sqb/domain-types";
import { withDb } from "../../lib/db.js";
import { signAccessToken, verifyAccessToken } from "../../lib/jwt.js";
import { recordAuditEvent } from "../audit/store.js";
import { getSmsProviderStatus, sendOtpCodeViaSms } from "./sms-provider.js";
import { verifyTotp } from "./totp.js";

const env = loadEnv();
const OTP_TTL_MS = env.OTP_TTL_SECONDS * 1000;
const OTP_RESEND_COOLDOWN_MS = 45 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const LOGIN_LOCK_MS = 10 * 60 * 1000;
const PASSWORD_FAILURE_LIMIT = 5;
const TERMS_VERSION = "2026-04";
const DEMO_OTP_CODE = "111111";
const DEMO_AUTH_ENABLED = env.ALLOW_DEMO_AUTH;
const SESSION_ACTIVITY_WRITE_THROTTLE_MS = 60 * 1000;

type OtpMethodRecord = {
  id?: string;
  methodType: OtpDeliveryMethod;
  providerName: string;
  destination: string;
  secret?: string;
  isPrimary: boolean;
  isEnabled: boolean;
};

type AccountRecord = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  workspaceRole?: CompanyWorkspaceRole;
  permissionGroups?: PermissionGroupKey[];
  tenantId?: string;
  permissions: Permission[];
  lastActiveAt?: string;
  password: string;
  redirectPath: string;
  privilegedAccess: PrivilegedAccessFlags;
  acceptedTermsVersion?: string;
  loginIntent: LoginIntent;
  totpRequired: boolean;
  otpMethod?: OtpMethodRecord;
};

type ChallengeRecord = {
  id: string;
  accountId: string;
  loginIntent: LoginIntent;
  maskedPhone: string;
  expiresAt: number;
  resendAvailableAt: number;
  attemptsRemaining: number;
  code: string;
  ipAddress: string;
  userAgent: string;
  deliveryMethod: OtpDeliveryMethod;
  deliveryLabel: string;
  resendSupported: boolean;
  providerName: string;
};

// Keyed by JTI (UUID), not by JWT string
type SessionRecord = {
  jti: string;
  actor: SessionActor;
  tenantId?: string;
  createdAt: number;
  lastSeenAt: number;
  expiresAt: number;
};

// Demo-mode refresh token record (keyed by token hash)
type RefreshTokenRecord = {
  userId: string;
  jti: string;
  expiresAt: number;
};

type PersistedAccountRow = {
  user_id: string;
  full_name: string;
  email: string | null;
  phone: string;
  role: Role;
  workspace_role: string | null;
  permission_groups: PermissionGroupKey[] | null;
  tenant_id: string | null;
  password_valid: boolean;
  is_privileged: boolean;
  requires_dedicated_account: boolean;
  is_break_glass: boolean;
  totp_required: boolean;
  accepted_documents: number;
  otp_method_id: string | null;
  otp_method_type: OtpDeliveryMethod | null;
  otp_provider_name: string | null;
  otp_destination: string | null;
  otp_secret: string | null;
};

type ResolvedWorkspaceAccess = {
  role: Role;
  workspaceRole?: CompanyWorkspaceRole;
  permissionGroups: PermissionGroupKey[];
  permissions: Permission[];
};

type PersistedChallengeRow = {
  challenge_id: string;
  user_id: string;
  login_intent: LoginIntent;
  masked_phone: string;
  code_hash: string;
  expires_at: string;
  resend_available_at: string;
  attempts_remaining: number;
  delivery_method: OtpDeliveryMethod;
  delivery_target: string | null;
  provider_name: string;
  otp_destination: string | null;
  otp_secret: string | null;
};

type AuthSecurityUpdateResult =
  | { status: "updated"; settings: AuthSecuritySettings }
  | { status: "session_invalid"; message: string }
  | { status: "forbidden"; message: string };

const accounts: AccountRecord[] = [
  {
    id: "user_company_admin",
    name: "Jasur Azimov",
    email: "jasur@kamolot.uz",
    phone: "+998901111111",
    role: "company_admin",
    workspaceRole: "owner",
    permissionGroups: ["tenant_governance", "finance_operations", "inventory_operations", "production_operations", "service_operations", "audit_compliance"],
    tenantId: "tenant_kamolot",
    permissions: ["tenant.read", "tenant.manage", "finance.read", "finance.manage", "inventory.manage", "production.manage", "service_order.manage", "audit.read"],
    lastActiveAt: new Date().toISOString(),
    password: "Sqb2026!",
    redirectPath: "/smb/home",
    privilegedAccess: { isPrivileged: false, requiresDedicatedAccount: false, isBreakGlass: false, sessionTtlMinutes: 480 },
    acceptedTermsVersion: TERMS_VERSION,
    loginIntent: "smb_customer",
    totpRequired: false,
    otpMethod: { methodType: "sms", providerName: "demo_sms", destination: "+998901111111", isPrimary: true, isEnabled: true }
  },
  {
    id: "user_employee",
    name: "Bekzod Yusupov",
    email: "bekzod@kamolot.uz",
    phone: "+998903333333",
    role: "employee",
    workspaceRole: "operator",
    permissionGroups: ["inventory_operations", "production_operations", "service_operations"],
    tenantId: "tenant_kamolot",
    permissions: ["inventory.manage", "production.manage", "service_order.manage"],
    lastActiveAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    password: "Sqb2026!",
    redirectPath: "/smb/home",
    privilegedAccess: { isPrivileged: false, requiresDedicatedAccount: false, isBreakGlass: false, sessionTtlMinutes: 480 },
    acceptedTermsVersion: TERMS_VERSION,
    loginIntent: "smb_customer",
    totpRequired: false,
    otpMethod: { methodType: "sms", providerName: "demo_sms", destination: "+998903333333", isPrimary: true, isEnabled: true }
  },
  {
    id: "user_company_admin_delegate",
    name: "Malika Karimova",
    email: "malika@kamolot.uz",
    phone: "+998907777777",
    role: "company_admin",
    workspaceRole: "company_admin",
    permissionGroups: ["tenant_governance", "finance_operations", "inventory_operations", "production_operations", "service_operations", "audit_compliance"],
    tenantId: "tenant_kamolot",
    permissions: ["tenant.read", "tenant.manage", "finance.read", "finance.manage", "inventory.manage", "production.manage", "service_order.manage", "audit.read"],
    lastActiveAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    password: "Sqb2026!",
    redirectPath: "/smb/home",
    privilegedAccess: { isPrivileged: false, requiresDedicatedAccount: false, isBreakGlass: false, sessionTtlMinutes: 480 },
    acceptedTermsVersion: TERMS_VERSION,
    loginIntent: "smb_customer",
    totpRequired: false,
    otpMethod: { methodType: "sms", providerName: "demo_sms", destination: "+998907777777", isPrimary: true, isEnabled: true }
  },
  {
    id: "user_manager",
    name: "Dilnoza Rashidova",
    email: "dilnoza@kamolot.uz",
    phone: "+998906666666",
    role: "employee",
    workspaceRole: "manager",
    permissionGroups: ["finance_operations", "inventory_operations", "production_operations", "service_operations"],
    tenantId: "tenant_kamolot",
    permissions: ["finance.read", "finance.manage", "inventory.manage", "production.manage", "service_order.manage"],
    lastActiveAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    password: "Sqb2026!",
    redirectPath: "/smb/home",
    privilegedAccess: { isPrivileged: false, requiresDedicatedAccount: false, isBreakGlass: false, sessionTtlMinutes: 480 },
    acceptedTermsVersion: TERMS_VERSION,
    loginIntent: "smb_customer",
    totpRequired: false,
    otpMethod: { methodType: "sms", providerName: "demo_sms", destination: "+998906666666", isPrimary: true, isEnabled: true }
  },
  {
    id: "user_operator_two",
    name: "Sardor Toshev",
    email: "sardor@kamolot.uz",
    phone: "+998908888888",
    role: "employee",
    workspaceRole: "operator",
    permissionGroups: ["inventory_operations", "production_operations", "service_operations"],
    tenantId: "tenant_kamolot",
    permissions: ["inventory.manage", "production.manage", "service_order.manage"],
    lastActiveAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    password: "Sqb2026!",
    redirectPath: "/smb/home",
    privilegedAccess: { isPrivileged: false, requiresDedicatedAccount: false, isBreakGlass: false, sessionTtlMinutes: 480 },
    acceptedTermsVersion: TERMS_VERSION,
    loginIntent: "smb_customer",
    totpRequired: false,
    otpMethod: { methodType: "sms", providerName: "demo_sms", destination: "+998908888888", isPrimary: true, isEnabled: true }
  },
  {
    id: "user_bank_admin",
    name: "Malika Karimova",
    email: "malika.karimova@sqb.uz",
    phone: "+998902222222",
    role: "bank_admin",
    permissions: ["tenant.read", "bank.monitor", "audit.read"],
    lastActiveAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    password: "SqbBank2026!",
    redirectPath: "/bank/home",
    privilegedAccess: { isPrivileged: true, requiresDedicatedAccount: true, isBreakGlass: false, sessionTtlMinutes: 120 },
    acceptedTermsVersion: TERMS_VERSION,
    loginIntent: "bank_staff",
    totpRequired: false,
    otpMethod: { methodType: "sms", providerName: "demo_sms", destination: "+998902222222", isPrimary: true, isEnabled: true }
  },
  {
    id: "user_super_admin",
    name: "Aziza Platform Admin",
    email: "admin.platform@sqb.uz",
    phone: "+998904444444",
    role: "super_admin",
    permissions: ["tenant.read", "tenant.manage", "bank.monitor", "audit.read"],
    lastActiveAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    password: "SqbSuper2026!",
    redirectPath: "/bank/settings",
    privilegedAccess: { isPrivileged: true, requiresDedicatedAccount: true, isBreakGlass: false, sessionTtlMinutes: 60 },
    acceptedTermsVersion: TERMS_VERSION,
    loginIntent: "bank_staff",
    totpRequired: false,
    otpMethod: { methodType: "totp_app", providerName: "google_authenticator", destination: "Google Authenticator", secret: "KRSXG5DSNFXGOIDB", isPrimary: true, isEnabled: true }
  },
  {
    id: "user_break_glass_one",
    name: "Emergency Admin One",
    email: "breakglass.one@sqb.uz",
    phone: "+998905555551",
    role: "super_admin",
    permissions: ["tenant.read", "tenant.manage", "bank.monitor", "audit.read"],
    lastActiveAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    password: "BreakGlass2026!",
    redirectPath: "/bank/settings",
    privilegedAccess: { isPrivileged: true, requiresDedicatedAccount: true, isBreakGlass: true, sessionTtlMinutes: 30 },
    acceptedTermsVersion: TERMS_VERSION,
    loginIntent: "bank_staff",
    totpRequired: true,
    otpMethod: { methodType: "totp_app", providerName: "google_authenticator", destination: "Google Authenticator", secret: "MFRGGZDFMZTWQ2LK", isPrimary: true, isEnabled: true }
  },
  {
    id: "user_break_glass_two",
    name: "Emergency Admin Two",
    email: "breakglass.two@sqb.uz",
    phone: "+998905555552",
    role: "super_admin",
    permissions: ["tenant.read", "tenant.manage", "bank.monitor", "audit.read"],
    lastActiveAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    password: "BreakGlass2026!",
    redirectPath: "/bank/settings",
    privilegedAccess: { isPrivileged: true, requiresDedicatedAccount: true, isBreakGlass: true, sessionTtlMinutes: 30 },
    acceptedTermsVersion: TERMS_VERSION,
    loginIntent: "bank_staff",
    totpRequired: true,
    otpMethod: { methodType: "totp_app", providerName: "google_authenticator", destination: "Google Authenticator", secret: "ONSWG4TFOQ", isPrimary: true, isEnabled: true }
  }
];

// In-memory stores (demo / fallback mode)
// Sessions keyed by JTI (UUID), not by JWT
const sessions = new Map<string, SessionRecord>();
const challenges = new Map<string, ChallengeRecord>();
const lockouts = new Map<string, { failures: number; lockedUntil?: number }>();
const authAuditEvents: AuditEvent[] = [];
const termsAcceptances: TermsAcceptance[] = [];
// Demo refresh tokens keyed by token hash
const demoRefreshTokens = new Map<string, RefreshTokenRecord>();
const persistedSessionTouchCache = new Map<string, number>();
let persistedSessionLastSeenColumnSupported: boolean | null = null;
let membershipsPermissionGroupsColumnSupported: boolean | null = null;
let refreshTokensTableSupported: boolean | null = null;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function maxIso(values: Array<string | undefined | null>) {
  const timestamps = values
    .map((value) => value ? new Date(value).getTime() : Number.NaN)
    .filter((value) => Number.isFinite(value));

  if (timestamps.length === 0) {
    return undefined;
  }

  return new Date(Math.max(...timestamps)).toISOString();
}

function memoryLastActiveAtForAccount(accountId: string, tenantId?: string | null) {
  const sessionMatches = Array.from(sessions.values())
    .filter((record) => record.actor.id === accountId && (tenantId === undefined || record.tenantId === (tenantId ?? undefined)))
    .map((record) => new Date(record.lastSeenAt).toISOString());

  const seededActivity = findMemoryAccountById(accountId)?.lastActiveAt;
  return maxIso([...sessionMatches, seededActivity]);
}

async function supportsPersistedSessionLastSeenColumn() {
  if (persistedSessionLastSeenColumnSupported !== null) {
    return persistedSessionLastSeenColumnSupported;
  }

  const supported = await withDb(async (pool) => {
    const result = await pool.query<{ exists: boolean }>(
      `select exists(
         select 1
         from information_schema.columns
         where table_schema = 'public'
           and table_name = 'sessions'
           and column_name = 'last_seen_at'
       ) as exists`
    );

    return result.rows[0]?.exists ?? false;
  });

  persistedSessionLastSeenColumnSupported = supported ?? false;
  return persistedSessionLastSeenColumnSupported;
}

async function supportsMembershipsPermissionGroupsColumn() {
  if (membershipsPermissionGroupsColumnSupported !== null) {
    return membershipsPermissionGroupsColumnSupported;
  }

  const supported = await withDb(async (pool) => {
    const result = await pool.query<{ exists: boolean }>(
      `select exists(
         select 1
         from information_schema.columns
         where table_schema = 'public'
           and table_name = 'memberships'
           and column_name = 'permission_groups'
       ) as exists`
    );

    return result.rows[0]?.exists ?? false;
  });

  membershipsPermissionGroupsColumnSupported = supported ?? false;
  return membershipsPermissionGroupsColumnSupported;
}

async function supportsRefreshTokensTable() {
  if (refreshTokensTableSupported !== null) {
    return refreshTokensTableSupported;
  }

  const supported = await withDb(async (pool) => {
    const result = await pool.query<{ exists: boolean }>(
      `select exists(
         select 1
         from information_schema.tables
         where table_schema = 'public'
           and table_name = 'refresh_tokens'
       ) as exists`
    );

    return result.rows[0]?.exists ?? false;
  });

  refreshTokensTableSupported = supported ?? false;
  return refreshTokensTableSupported;
}

function roleAccessPolicy(role: Role) {
  return roleAccessPolicies[role];
}

function permissionsForRole(role: Role): Permission[] {
  return resolveRolePermissions(role);
}

function resolveWorkspaceAccess(input: {
  role: Role;
  tenantId?: string | null;
  workspaceRole?: string | null;
  permissionGroups?: readonly PermissionGroupKey[] | null;
}): ResolvedWorkspaceAccess {
  if (input.tenantId && input.workspaceRole && isCompanyWorkspaceRole(input.workspaceRole)) {
    const permissionGroups = resolvePermissionGroupsForWorkspaceRole(input.workspaceRole, input.permissionGroups ?? undefined);
    return {
      role: companyWorkspaceAuthRole(input.workspaceRole),
      workspaceRole: input.workspaceRole,
      permissionGroups,
      permissions: permissionsForWorkspaceRole(input.workspaceRole, permissionGroups)
    };
  }

  return {
    role: input.role,
    permissionGroups: [],
    permissions: permissionsForRole(input.role)
  };
}

function redirectPathForRole(role: Role) {
  return roleAccessPolicy(role).defaultRedirectPath;
}

function loginIntentForRole(role: Role): LoginIntent {
  return roleAccessPolicy(role).loginIntent;
}

function sessionTtlForRole(role: Role) {
  return roleAccessPolicy(role).sessionTtlMinutes;
}

function requiresStrongOtp(account: AccountRecord) {
  return account.role === "super_admin" && (account.privilegedAccess.isBreakGlass || account.totpRequired);
}

function shouldBypassOtp(account: AccountRecord) {
  return account.role === "super_admin" && !requiresStrongOtp(account);
}

function hasRequiredOtpMethod(account: AccountRecord) {
  if (!account.otpMethod?.isEnabled) {
    return false;
  }

  if (!requiresStrongOtp(account)) {
    return true;
  }

  return account.otpMethod.methodType === "totp_app";
}

function hasOperationalSmsProvider() {
  return getSmsProviderStatus().ready;
}

function maskPhone(phone: string) {
  return `${phone.slice(0, 7)} *** ${phone.slice(-2)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function challengeLabel(method?: OtpMethodRecord) {
  if (!method) {
    return "Authenticator";
  }
  return method.methodType === "totp_app"
    ? method.destination || method.providerName.replace(/_/g, " ")
    : maskPhone(method.destination);
}

function buildChallengeResponse(challenge: {
  id: string;
  loginIntent: LoginIntent;
  maskedPhone: string;
  expiresAt: number | string;
  resendAvailableAt: number | string;
  deliveryMethod: OtpDeliveryMethod;
  deliveryLabel: string;
  resendSupported: boolean;
}): AuthChallenge {
  return {
    challengeId: challenge.id,
    loginIntent: challenge.loginIntent,
    maskedPhone: challenge.maskedPhone,
    deliveryMethod: challenge.deliveryMethod,
    deliveryLabel: challenge.deliveryLabel,
    resendSupported: challenge.resendSupported,
    expiresAt: typeof challenge.expiresAt === "number" ? new Date(challenge.expiresAt).toISOString() : challenge.expiresAt,
    resendAvailableAt: typeof challenge.resendAvailableAt === "number" ? new Date(challenge.resendAvailableAt).toISOString() : challenge.resendAvailableAt,
    state: "otp_pending"
  };
}

function toUser(account: AccountRecord, lastActiveAt = account.lastActiveAt): AuthenticatedUser {
  return {
    id: account.id,
    name: account.name,
    email: account.email,
    phone: account.phone,
    role: account.role,
    workspaceRole: account.workspaceRole,
    permissionGroups: account.permissionGroups,
    permissions: account.permissions,
    tenantId: account.tenantId,
    lastActiveAt
  };
}

function toActor(account: AccountRecord, lastActiveAt = account.lastActiveAt): SessionActor {
  const user: AuthenticatedUser = {
    ...toUser(account, lastActiveAt)
  };

  return {
    ...user,
    redirectPath: account.redirectPath,
    requiresTermsAcceptance: account.acceptedTermsVersion !== TERMS_VERSION,
    privilegedAccess: account.privilegedAccess
  };
}

function buildAuthSecuritySettings(account: AccountRecord): AuthSecuritySettings {
  return {
    role: account.role,
    totpRequired: requiresStrongOtp(account),
    canManageTotp: account.role === "super_admin" && !account.privilegedAccess.isBreakGlass,
    isBreakGlass: account.privilegedAccess.isBreakGlass,
    otpMethodType: account.otpMethod?.methodType,
    otpMethodLabel: account.otpMethod?.destination
  };
}

function nextGeneratedPhone() {
  return `+99890${String(randomInt(1_000_000, 9_999_999))}`;
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 32) || "workspace";
}

function audit(account: AccountRecord, category: AuditEvent["category"], action: string, metadata: Record<string, string | number | boolean | null>) {
  const event = {
    id: randomUUID(),
    actorUserId: account.id,
    actorRole: account.role,
    tenantId: account.tenantId,
    category,
    action,
    resourceType: "auth",
    resourceId: account.id,
    occurredAt: nowIso(),
    metadata
  } satisfies AuditEvent;

  authAuditEvents.push(event);
  void recordAuditEvent(event);
}

function findMemoryAccount(identifier: string) {
  const lookup = identifier.trim().toLowerCase();
  return accounts.find((account) => account.email.toLowerCase() === lookup || account.phone === identifier.trim());
}

function findMemoryAccountById(accountId: string) {
  return accounts.find((account) => account.id === accountId);
}

function mapPersistedAccount(row: PersistedAccountRow): AccountRecord {
  const workspaceAccess = resolveWorkspaceAccess({
    role: row.role,
    tenantId: row.tenant_id,
    workspaceRole: row.workspace_role,
    permissionGroups: row.permission_groups
  });

  return {
    id: row.user_id,
    name: row.full_name,
    email: row.email ?? "",
    phone: row.phone,
    role: workspaceAccess.role,
    workspaceRole: workspaceAccess.workspaceRole,
    permissionGroups: workspaceAccess.permissionGroups,
    tenantId: row.tenant_id ?? undefined,
    permissions: workspaceAccess.permissions,
    password: row.password_valid ? "__verified_by_db__" : "",
    redirectPath: redirectPathForRole(workspaceAccess.role),
    privilegedAccess: {
      isPrivileged: row.is_privileged ?? roleAccessPolicy(workspaceAccess.role).privilegedAccess.isPrivileged,
      requiresDedicatedAccount: row.requires_dedicated_account ?? roleAccessPolicy(workspaceAccess.role).privilegedAccess.requiresDedicatedAccount,
      isBreakGlass: row.is_break_glass ?? roleAccessPolicy(workspaceAccess.role).privilegedAccess.isBreakGlass,
      sessionTtlMinutes: sessionTtlForRole(workspaceAccess.role)
    },
    acceptedTermsVersion: row.accepted_documents >= 2 ? TERMS_VERSION : undefined,
    loginIntent: loginIntentForRole(workspaceAccess.role),
    totpRequired: row.totp_required,
    otpMethod: row.otp_method_id ? {
      id: row.otp_method_id,
      methodType: row.otp_method_type ?? "sms",
      providerName: row.otp_provider_name ?? "platform_sms",
      destination: row.otp_destination ?? row.phone,
      secret: row.otp_secret ?? undefined,
      isPrimary: true,
      isEnabled: true
    } : undefined
  };
}

async function loadPersistedAccountByIdentifier(identifier: string, password: string) {
  const lookup = identifier.trim().toLowerCase();
  const phone = identifier.trim();
  const hasPermissionGroups = await supportsMembershipsPermissionGroupsColumn();
  const permissionGroupsExpression = hasPermissionGroups
    ? `coalesce(
         case
           when jsonb_typeof(m.permission_groups) = 'array' then array(select jsonb_array_elements_text(m.permission_groups))
           else '{}'::text[]
         end,
         '{}'::text[]
       )`
    : `'{}'::text[]`;

  const row = await withDb(async (pool) => {
    const result = await pool.query<PersistedAccountRow>(
      `select
         u.id as user_id,
         u.full_name,
         u.email,
         u.phone,
         case
           when m.role = 'super_admin' then 'super_admin'
           when m.role = 'bank_admin' then 'bank_admin'
           when m.role in ('owner', 'company_admin') then 'company_admin'
           else 'employee'
         end as role,
         case
           when m.tenant_id is not null then m.role
           else null
         end as workspace_role,
         ${permissionGroupsExpression} as permission_groups,
         m.tenant_id,
         c.password_hash = crypt($3, c.password_hash) as password_valid,
         c.is_privileged,
         c.requires_dedicated_account,
         c.is_break_glass,
         c.totp_required,
         (
           select count(distinct td.document_type)::int
           from terms_acceptances ta
           join terms_documents td on td.id = ta.document_id
           where ta.user_id = u.id
             and ta.accepted_version = $4
             and td.document_type in ('terms_of_service', 'privacy_notice')
         ) as accepted_documents,
         om.id as otp_method_id,
         om.method_type as otp_method_type,
         om.provider_name as otp_provider_name,
         om.destination as otp_destination,
         om.secret as otp_secret
       from users u
       join credentials c on c.user_id = u.id
       join memberships m on m.user_id = u.id
       left join lateral (
         select id, method_type, provider_name, destination, secret
         from otp_methods
         where user_id = u.id
           and is_enabled = true
         order by is_primary desc, created_at asc
         limit 1
       ) om on true
       where lower(coalesce(u.email, '')) = $1 or u.phone = $2
       order by case
         when m.role = 'super_admin' then 1
         when m.role = 'bank_admin' then 2
         when m.role = 'owner' then 3
         when m.role = 'company_admin' then 4
         when m.role = 'manager' then 5
         when m.role = 'operator' then 6
         else 7
       end
       limit 1`,
      [lookup, phone, password, TERMS_VERSION]
    );

    return result.rows[0] ?? null;
  });

  return row ? mapPersistedAccount(row) : null;
}

async function loadPersistedAccountById(userId: string) {
  const hasPermissionGroups = await supportsMembershipsPermissionGroupsColumn();
  const permissionGroupsExpression = hasPermissionGroups
    ? `coalesce(
         case
           when jsonb_typeof(m.permission_groups) = 'array' then array(select jsonb_array_elements_text(m.permission_groups))
           else '{}'::text[]
         end,
         '{}'::text[]
       )`
    : `'{}'::text[]`;

  const row = await withDb(async (pool) => {
    const result = await pool.query<PersistedAccountRow>(
      `select
         u.id as user_id,
         u.full_name,
         u.email,
         u.phone,
         case
           when m.role = 'super_admin' then 'super_admin'
           when m.role = 'bank_admin' then 'bank_admin'
           when m.role in ('owner', 'company_admin') then 'company_admin'
           else 'employee'
         end as role,
         case
           when m.tenant_id is not null then m.role
           else null
         end as workspace_role,
         ${permissionGroupsExpression} as permission_groups,
         m.tenant_id,
         true as password_valid,
         c.is_privileged,
         c.requires_dedicated_account,
         c.is_break_glass,
         c.totp_required,
         (
           select count(distinct td.document_type)::int
           from terms_acceptances ta
           join terms_documents td on td.id = ta.document_id
           where ta.user_id = u.id
             and ta.accepted_version = $2
             and td.document_type in ('terms_of_service', 'privacy_notice')
         ) as accepted_documents,
         om.id as otp_method_id,
         om.method_type as otp_method_type,
         om.provider_name as otp_provider_name,
         om.destination as otp_destination,
         om.secret as otp_secret
       from users u
       join credentials c on c.user_id = u.id
       join memberships m on m.user_id = u.id
       left join lateral (
         select id, method_type, provider_name, destination, secret
         from otp_methods
         where user_id = u.id
           and is_enabled = true
         order by is_primary desc, created_at asc
         limit 1
       ) om on true
       where u.id = $1
       order by case
         when m.role = 'super_admin' then 1
         when m.role = 'bank_admin' then 2
         when m.role = 'owner' then 3
         when m.role = 'company_admin' then 4
         when m.role = 'manager' then 5
         when m.role = 'operator' then 6
         else 7
       end
       limit 1`,
      [userId, TERMS_VERSION]
    );

    return result.rows[0] ?? null;
  });

  return row ? mapPersistedAccount(row) : null;
}

async function loadPersistedLastActiveAt(userId: string, tenantId?: string | null) {
  if (!isUuid(userId)) {
    return undefined;
  }

  const hasLastSeen = await supportsPersistedSessionLastSeenColumn();
  const lastActiveExpression = hasLastSeen ? "coalesce(last_seen_at, created_at)" : "created_at";

  return withDb(async (pool) => {
    const result = await pool.query<{ last_active_at: string | null }>(
      `select max(${lastActiveExpression})::text as last_active_at
       from sessions
       where user_id = $1
         and tenant_id is not distinct from $2::uuid`,
      [userId, tenantId ?? null]
    );

    return result.rows[0]?.last_active_at ?? undefined;
  });
}

async function maybeTouchPersistedSessionActivity(jti: string, lastActiveAt?: string | null) {
  const now = Date.now();
  const lastTouch = persistedSessionTouchCache.get(jti);
  if (lastTouch && now - lastTouch < SESSION_ACTIVITY_WRITE_THROTTLE_MS) {
    return lastActiveAt ?? undefined;
  }

  const lastActiveTime = lastActiveAt ? new Date(lastActiveAt).getTime() : Number.NaN;
  if (Number.isFinite(lastActiveTime) && now - lastActiveTime < SESSION_ACTIVITY_WRITE_THROTTLE_MS) {
    persistedSessionTouchCache.set(jti, now);
    return lastActiveAt ?? undefined;
  }

  const hasLastSeen = await supportsPersistedSessionLastSeenColumn();
  if (!hasLastSeen) {
    persistedSessionTouchCache.set(jti, now);
    return lastActiveAt ?? undefined;
  }

  const touchedAt = await withDb(async (pool) => {
    const result = await pool.query<{ last_seen_at: string }>(
      `update sessions
       set last_seen_at = now()
       where session_token = $1
         and revoked_at is null
         and expires_at > now()
         and coalesce(last_seen_at, created_at) < now() - interval '60 seconds'
       returning last_seen_at::text`,
      [jti]
    );

    return result.rows[0]?.last_seen_at ?? undefined;
  });

  persistedSessionTouchCache.set(jti, now);
  return touchedAt ?? lastActiveAt ?? undefined;
}

export async function getLatestUserActivity(userId: string, tenantId?: string | null) {
  const memoryActivity = memoryLastActiveAtForAccount(userId, tenantId);
  const persistedActivity = await loadPersistedLastActiveAt(userId, tenantId);
  return maxIso([memoryActivity, persistedActivity]);
}

export async function listPlatformStaffDirectory() {
  const memoryUsers = accounts
    .filter((account) => account.loginIntent === "bank_staff")
    .map((account) => toUser(account, memoryLastActiveAtForAccount(account.id)));

  const persistedUsers = await withDb(async (pool) => {
    const result = await pool.query<{
      user_id: string;
      full_name: string;
      email: string | null;
      phone: string;
      role: Role;
    }>(
      `select
         u.id as user_id,
         u.full_name,
         u.email,
         u.phone,
         case
           when m.role = 'super_admin' then 'super_admin'
           else 'bank_admin'
         end as role
       from users u
       join memberships m on m.user_id = u.id
       where m.tenant_id is null
         and m.role in ('super_admin', 'bank_admin')
       order by case
         when m.role = 'super_admin' then 1
         when m.role = 'bank_admin' then 2
         else 3
       end, u.full_name asc`
    );

    const users = await Promise.all(result.rows.map(async (row) => ({
      id: row.user_id,
      name: row.full_name,
      email: row.email ?? undefined,
      phone: row.phone,
      role: row.role,
      permissions: permissionsForRole(row.role),
      lastActiveAt: await getLatestUserActivity(row.user_id, null)
    } satisfies AuthenticatedUser)));

    return users;
  }) ?? [];

  const usersById = new Map<string, AuthenticatedUser>();
  for (const user of [...persistedUsers, ...memoryUsers]) {
    const key = (user.email ?? user.id).toLowerCase();
    const existing = usersById.get(key);
    usersById.set(key, existing ? { ...existing, ...user, lastActiveAt: maxIso([existing.lastActiveAt, user.lastActiveAt]) } : user);
  }

  return Array.from(usersById.values()).sort((left, right) => {
    const leftRank = left.role === "super_admin" ? 1 : 2;
    const rightRank = right.role === "super_admin" ? 1 : 2;
    return leftRank - rightRank || left.name.localeCompare(right.name);
  });
}

function hasVerifiedPassword(account: AccountRecord, password: string) {
  return account.password === "__verified_by_db__" || account.password === password;
}

export function hasAccountEmail(email: string) {
  const lookup = email.trim().toLowerCase();
  return accounts.some((account) => account.email.toLowerCase() === lookup);
}

function checkLock(identifier: string) {
  const state = lockouts.get(identifier);
  if (!state?.lockedUntil) {
    return false;
  }
  if (Date.now() > state.lockedUntil) {
    lockouts.delete(identifier);
    return false;
  }
  return true;
}

function registerFailure(identifier: string, account?: AccountRecord) {
  const state = lockouts.get(identifier) ?? { failures: 0 };
  state.failures += 1;
  if (state.failures >= PASSWORD_FAILURE_LIMIT) {
    state.lockedUntil = Date.now() + LOGIN_LOCK_MS;
  }
  lockouts.set(identifier, state);

  if (account) {
    audit(account, state.lockedUntil ? "auth.lockout" : "auth.password", state.lockedUntil ? "locked" : "failed", {
      failures: state.failures,
      lockedUntil: state.lockedUntil ? new Date(state.lockedUntil).toISOString() : null
    });
  }
}

// ─── Session creation ─────────────────────────────────────────────────────────

async function createSessionForAccount(account: AccountRecord): Promise<AuthSession> {
  const lastActiveAt = nowIso();
  account.lastActiveAt = lastActiveAt;
  const actor = toActor(account, lastActiveAt);
  const jti = randomUUID();
  const ttlSeconds = actor.privilegedAccess.sessionTtlMinutes * 60;
  const expiresAt = Date.now() + ttlSeconds * 1000;

  const sessionToken = await signAccessToken(
    { sub: account.id, jti, role: account.role, tenantId: account.tenantId, permissions: account.permissions },
    ttlSeconds
  );

  sessions.set(jti, {
    jti,
    actor,
    tenantId: actor.tenantId,
    createdAt: Date.now(),
    lastSeenAt: Date.now(),
    expiresAt
  });

  const auditCategory: AuditEvent["category"] = actor.privilegedAccess.isBreakGlass
    ? "auth.break_glass"
    : actor.privilegedAccess.isPrivileged
      ? "auth.privileged_access"
      : "auth.session";

  audit(account, auditCategory, "created", {
    sessionId: jti,
    redirectPath: actor.redirectPath,
    isBreakGlass: actor.privilegedAccess.isBreakGlass
  });

  return {
    sessionToken,
    sessionId: jti,
    role: actor.role,
    tenantId: actor.tenantId,
    isPrivileged: actor.privilegedAccess.isPrivileged,
    requiresTermsAcceptance: actor.requiresTermsAcceptance,
    redirectPath: actor.redirectPath,
    actor,
    expiresAt: new Date(expiresAt).toISOString()
  };
}

async function createPersistedSessionForAccount(
  account: AccountRecord,
  ipAddress = "",
  userAgent = ""
): Promise<AuthSession | null> {
  const session = await createSessionForAccount(account);
  const hasRefreshTokensTable = await supportsRefreshTokensTable();
  const refreshToken = hasRefreshTokensTable ? randomUUID() : null;
  const refreshHash = refreshToken ? hashToken(refreshToken) : null;
  const refreshTtlMs = env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;
  const refreshExpiresAt = new Date(Date.now() + refreshTtlMs).toISOString();

  const persisted = await withDb(async (pool) => {
    await pool.query(
      `insert into sessions (
        id, user_id, tenant_id, role, session_token,
        is_privileged, requires_terms_acceptance, redirect_path, expires_at
      ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9::timestamptz)`,
      [
        randomUUID(), account.id, account.tenantId ?? null, account.role,
        session.sessionId,
        account.privilegedAccess.isPrivileged,
        session.requiresTermsAcceptance,
        account.redirectPath,
        session.expiresAt
      ]
    );

    if (hasRefreshTokensTable && refreshHash) {
      await pool.query(
        `insert into refresh_tokens (user_id, token_hash, session_id, expires_at, ip_address, user_agent)
         values ($1, $2, $3, $4::timestamptz, $5::inet, $6)`,
        [account.id, refreshHash, session.sessionId, refreshExpiresAt, ipAddress || null, userAgent || null]
      );
    }

    return true;
  });

  if (!persisted) {
    if (DEMO_AUTH_ENABLED) {
      return session;
    }

    sessions.delete(session.sessionId);
    return null;
  }

  return refreshToken ? { ...session, refreshToken } : session;
}

// ─── OTP challenges ───────────────────────────────────────────────────────────

async function createPersistedChallenge(account: AccountRecord, input: { loginIntent: LoginIntent; ipAddress: string; userAgent: string }) {
  if (!account.otpMethod?.isEnabled) {
    return null;
  }

  const challengeId = randomUUID();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();
  const resendAvailableAt = new Date(Date.now() + OTP_RESEND_COOLDOWN_MS).toISOString();
  const method = account.otpMethod;
  const deliveryLabel = challengeLabel(method);
  const maskedPhone = method.methodType === "sms" ? maskPhone(method.destination) : deliveryLabel;
  const resendSupported = method.methodType === "sms";
  const smsProvider = method.methodType === "sms" ? getSmsProviderStatus() : null;
  if (method.methodType === "sms" && (!smsProvider || !smsProvider.ready)) {
    return null;
  }

  const verificationCode = method.methodType === "sms" ? "111111" : "";
  const providerName = method.methodType === "sms" && smsProvider?.ready
    ? smsProvider.providerName
    : method.providerName;

  const persisted = await withDb(async (pool) => {
    await pool.query(
      `insert into otp_challenges (
        id, user_id, otp_method_id, login_intent, masked_phone, code_hash,
        expires_at, resend_available_at, attempts_remaining, ip_address, user_agent,
        delivery_method, delivery_target, provider_name
      ) values (
        $1, $2, $3, $4, $5,
        case when $11 = 'sms' then crypt($6, gen_salt('bf')) else '<totp>' end,
        $7::timestamptz, $8::timestamptz, $9, $10::inet, $12, $11, $13, $14
      )`,
      [challengeId, account.id, method.id ?? null, input.loginIntent, maskedPhone, verificationCode, expiresAt, resendAvailableAt, OTP_MAX_ATTEMPTS, input.ipAddress, method.methodType, input.userAgent, deliveryLabel, providerName]
    );
    return true;
  });

  if (!persisted) {
    return null;
  }

  if (method.methodType === "sms") {
    try {
      await sendOtpCodeViaSms(method.destination, verificationCode);
    } catch {
      await withDb(async (pool) => {
        await pool.query(`delete from otp_challenges where id = $1`, [challengeId]);
        return true;
      });
      return null;
    }
  }

  audit(account, "auth.password", "verified", { loginIntent: input.loginIntent });
  audit(account, "auth.otp", "issued", { challengeId, providerName, deliveryMethod: method.methodType, demoCode: null });

  return buildChallengeResponse({
    id: challengeId,
    loginIntent: input.loginIntent,
    maskedPhone,
    expiresAt,
    resendAvailableAt,
    deliveryMethod: method.methodType,
    deliveryLabel,
    resendSupported
  });
}

// ─── Password login ───────────────────────────────────────────────────────────

export async function handlePasswordLogin(input: {
  loginIntent: LoginIntent;
  identifier: string;
  password: string;
  ipAddress: string;
  userAgent: string;
}): Promise<PasswordLoginResponse> {
  const normalizedIdentifier = input.identifier.trim().toLowerCase();

  if (checkLock(normalizedIdentifier)) {
    return { status: "locked", errorCode: "ACCOUNT_LOCKED", message: "Too many failed attempts. Try again later." };
  }

  const persistedAccount = await loadPersistedAccountByIdentifier(input.identifier, input.password);
  const account = persistedAccount ?? (DEMO_AUTH_ENABLED ? findMemoryAccount(input.identifier) : undefined);

  if (!account || !hasVerifiedPassword(account, input.password)) {
    registerFailure(normalizedIdentifier, account ?? undefined);
    return {
      status: "locked",
      errorCode: lockouts.get(normalizedIdentifier)?.lockedUntil ? "ACCOUNT_LOCKED" : "INVALID_CREDENTIALS",
      message: lockouts.get(normalizedIdentifier)?.lockedUntil
        ? "Too many failed attempts. Try again later."
        : "Incorrect email, phone, or password."
    };
  }

  if (account.loginIntent !== input.loginIntent) {
    registerFailure(normalizedIdentifier, account);
    return {
      status: "locked",
      errorCode: "LOGIN_INTENT_MISMATCH",
      message: input.loginIntent === "bank_staff"
        ? "This account is not allowed through Bank Staff sign in."
        : "This account is not allowed through SMB Customer sign in."
    };
  }

  if (shouldBypassOtp(account)) {
    lockouts.delete(normalizedIdentifier);
    audit(account, "auth.password", "verified", { loginIntent: input.loginIntent, otpBypassed: true, reason: "totp_optional_disabled" });

    const session = persistedAccount
      ? await createPersistedSessionForAccount(account, input.ipAddress, input.userAgent)
      : await createSessionForAccount(account);

    if (!session) {
      return { status: "locked", errorCode: "SESSION_INVALID", message: "Unable to create a session right now." };
    }

    return { status: "authenticated", session };
  }

  if (!account.otpMethod?.isEnabled) {
    return { status: "locked", errorCode: "OTP_REQUIRED", message: "No OTP method is configured for this account." };
  }

  if (!hasRequiredOtpMethod(account)) {
    audit(account, "auth.privileged_access", "blocked", { reason: "strong_mfa_required", configuredMethod: account.otpMethod.methodType });
    return { status: "locked", errorCode: "OTP_REQUIRED", message: "Super Admin accounts require authenticator app MFA before sign in." };
  }

  if (persistedAccount && account.otpMethod?.methodType === "sms" && !hasOperationalSmsProvider()) {
    const status = getSmsProviderStatus();
    return { status: "locked", errorCode: "OTP_REQUIRED", message: status.ready ? "SMS OTP is not available for this account right now." : status.reason };
  }

  lockouts.delete(normalizedIdentifier);

  if (persistedAccount) {
    const challenge = await createPersistedChallenge(account, input);
    if (!challenge) {
      return { status: "locked", errorCode: "OTP_REQUIRED", message: "Unable to start OTP verification right now." };
    }
    return { status: "otp_pending", challenge };
  }

  const method = account.otpMethod;
  const challengeId = randomUUID();
  const createdChallenge: ChallengeRecord = {
    id: challengeId,
    accountId: account.id,
    loginIntent: input.loginIntent,
    maskedPhone: method.methodType === "sms" ? maskPhone(method.destination) : method.destination,
    expiresAt: Date.now() + OTP_TTL_MS,
    resendAvailableAt: Date.now() + OTP_RESEND_COOLDOWN_MS,
    attemptsRemaining: OTP_MAX_ATTEMPTS,
    code: method.methodType === "sms" ? DEMO_OTP_CODE : "",
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
    deliveryMethod: method.methodType,
    deliveryLabel: challengeLabel(method),
    resendSupported: method.methodType === "sms",
    providerName: method.providerName
  };

  challenges.set(challengeId, createdChallenge);
  audit(account, "auth.password", "verified", { loginIntent: input.loginIntent });
  audit(account, "auth.otp", "issued", { challengeId, providerName: method.providerName, deliveryMethod: method.methodType, demoCode: method.methodType === "sms" ? DEMO_OTP_CODE : null });

  return { status: "otp_pending", challenge: buildChallengeResponse(createdChallenge) };
}

// ─── OTP resend ───────────────────────────────────────────────────────────────

async function loadPersistedChallenge(challengeId: string) {
  const row = await withDb(async (pool) => {
    const result = await pool.query<PersistedChallengeRow>(
      `select
         c.id as challenge_id,
         c.user_id,
         c.login_intent,
         c.masked_phone,
         c.code_hash,
         c.expires_at,
         c.resend_available_at,
         c.attempts_remaining,
         c.delivery_method,
         c.delivery_target,
         c.provider_name,
         om.destination as otp_destination,
         om.secret as otp_secret
       from otp_challenges c
       left join otp_methods om on om.id = c.otp_method_id
       where c.id = $1
         and c.consumed_at is null`,
      [challengeId]
    );

    return result.rows[0] ?? null;
  });

  return row ?? null;
}

async function refreshPersistedSmsChallenge(challengeId: string) {
  const smsProvider = getSmsProviderStatus();
  if (!smsProvider.ready) {
    return null;
  }

  const nextCode = `${randomInt(0, 1_000_000)}`.padStart(6, "0");

  const refreshed = await withDb(async (pool) => {
    const result = await pool.query<{
      expires_at: string;
      resend_available_at: string;
      masked_phone: string;
      login_intent: LoginIntent;
      delivery_method: OtpDeliveryMethod;
      delivery_target: string | null;
    }>(
      `update otp_challenges
       set code_hash = crypt($2, gen_salt('bf')),
           expires_at = $3::timestamptz,
           resend_available_at = $4::timestamptz,
           provider_name = $5
       where id = $1
         and consumed_at is null
       returning expires_at, resend_available_at, masked_phone, login_intent, delivery_method, delivery_target`,
      [challengeId, nextCode, new Date(Date.now() + OTP_TTL_MS).toISOString(), new Date(Date.now() + OTP_RESEND_COOLDOWN_MS).toISOString(), smsProvider.providerName]
    );

    return result.rows[0] ?? null;
  });

  if (!refreshed) {
    return null;
  }

  const challenge = await loadPersistedChallenge(challengeId);
  if (!challenge?.otp_destination) {
    return null;
  }

  try {
    await sendOtpCodeViaSms(challenge.otp_destination, nextCode);
  } catch {
    await consumePersistedChallenge(challengeId);
    return null;
  }

  return {
    challenge: buildChallengeResponse({
      id: challengeId,
      loginIntent: refreshed.login_intent,
      maskedPhone: refreshed.masked_phone,
      expiresAt: refreshed.expires_at,
      resendAvailableAt: refreshed.resend_available_at,
      deliveryMethod: refreshed.delivery_method,
      deliveryLabel: refreshed.delivery_target ?? refreshed.masked_phone,
      resendSupported: true
    }),
    demoCode: null
  };
}

export async function resendChallenge(challengeId: string) {
  const memoryChallenge = challenges.get(challengeId);
  if (memoryChallenge) {
    if (Date.now() < memoryChallenge.resendAvailableAt) {
      return {
        status: "otp_pending" as const,
        errorCode: "OTP_RESEND_COOLDOWN" as const,
        message: "Please wait before requesting another code.",
        challenge: buildChallengeResponse(memoryChallenge)
      };
    }

    if (!memoryChallenge.resendSupported) {
      return {
        status: "otp_pending" as const,
        challenge: buildChallengeResponse(memoryChallenge),
        message: "Use the current code from your authenticator app."
      };
    }

    memoryChallenge.expiresAt = Date.now() + OTP_TTL_MS;
    memoryChallenge.resendAvailableAt = Date.now() + OTP_RESEND_COOLDOWN_MS;
    memoryChallenge.code = DEMO_OTP_CODE;

    const account = findMemoryAccountById(memoryChallenge.accountId);
    if (account) {
      audit(account, "auth.otp", "reissued", {
        challengeId: memoryChallenge.id,
        providerName: memoryChallenge.providerName,
        demoCode: memoryChallenge.providerName === "demo_sms" ? DEMO_OTP_CODE : null
      });
    }

    return { status: "otp_pending" as const, challenge: buildChallengeResponse(memoryChallenge) };
  }

  const persistedChallenge = await loadPersistedChallenge(challengeId);
  if (!persistedChallenge) {
    return { status: "locked" as const, errorCode: "OTP_EXPIRED" as const, message: "Your verification code expired. Sign in again." };
  }

  if (Date.now() > new Date(persistedChallenge.expires_at).getTime()) {
    await withDb(async (pool) => {
      await pool.query(`update otp_challenges set consumed_at = now() where id = $1`, [challengeId]);
      return true;
    });
    return { status: "locked" as const, errorCode: "OTP_EXPIRED" as const, message: "Your verification code expired. Sign in again." };
  }

  if (persistedChallenge.delivery_method === "totp_app") {
    return {
      status: "otp_pending" as const,
      challenge: buildChallengeResponse({
        id: persistedChallenge.challenge_id,
        loginIntent: persistedChallenge.login_intent,
        maskedPhone: persistedChallenge.masked_phone,
        expiresAt: persistedChallenge.expires_at,
        resendAvailableAt: persistedChallenge.resend_available_at,
        deliveryMethod: persistedChallenge.delivery_method,
        deliveryLabel: persistedChallenge.delivery_target ?? persistedChallenge.masked_phone,
        resendSupported: false
      }),
      message: "Use the current code from your authenticator app."
    };
  }

  if (Date.now() < new Date(persistedChallenge.resend_available_at).getTime()) {
    return {
      status: "otp_pending" as const,
      errorCode: "OTP_RESEND_COOLDOWN" as const,
      message: "Please wait before requesting another code.",
      challenge: buildChallengeResponse({
        id: persistedChallenge.challenge_id,
        loginIntent: persistedChallenge.login_intent,
        maskedPhone: persistedChallenge.masked_phone,
        expiresAt: persistedChallenge.expires_at,
        resendAvailableAt: persistedChallenge.resend_available_at,
        deliveryMethod: persistedChallenge.delivery_method,
        deliveryLabel: persistedChallenge.delivery_target ?? persistedChallenge.masked_phone,
        resendSupported: true
      })
    };
  }

  const refreshed = await refreshPersistedSmsChallenge(challengeId);
  if (!refreshed) {
    return { status: "locked" as const, errorCode: "OTP_EXPIRED" as const, message: "Your verification code expired. Sign in again." };
  }

  const account = await loadPersistedAccountById(persistedChallenge.user_id);
  if (account) {
    audit(account, "auth.otp", "reissued", { challengeId, providerName: persistedChallenge.provider_name, demoCode: refreshed.demoCode });
  }

  return { status: "otp_pending" as const, challenge: refreshed.challenge };
}

// ─── OTP verify ───────────────────────────────────────────────────────────────

async function validatePersistedChallengeCode(challenge: PersistedChallengeRow, code: string) {
  if (challenge.delivery_method === "totp_app") {
    if (!challenge.otp_secret) {
      return false;
    }
    return verifyTotp(challenge.otp_secret, code, Date.now(), env.OTP_TOTP_WINDOW);
  }

  const match = await withDb(async (pool) => {
    const result = await pool.query<{ is_valid: boolean }>(
      `select $1 = crypt($2, $1) as is_valid`,
      [challenge.code_hash, code.trim()]
    );
    return result.rows[0]?.is_valid ?? false;
  });

  return match ?? false;
}

async function consumePersistedChallenge(challengeId: string) {
  await withDb(async (pool) => {
    await pool.query(`update otp_challenges set consumed_at = now() where id = $1`, [challengeId]);
    return true;
  });
}

async function decrementPersistedAttempts(challengeId: string) {
  return withDb(async (pool) => {
    const result = await pool.query<{ attempts_remaining: number }>(
      `update otp_challenges
       set attempts_remaining = attempts_remaining - 1,
           consumed_at = case when attempts_remaining - 1 <= 0 then now() else consumed_at end
       where id = $1
         and consumed_at is null
       returning attempts_remaining`,
      [challengeId]
    );
    return result.rows[0]?.attempts_remaining ?? 0;
  });
}

export async function verifyChallenge(challengeId: string, code: string): Promise<OtpVerifyResponse> {
  const memoryChallenge = challenges.get(challengeId);
  if (memoryChallenge && DEMO_AUTH_ENABLED) {
    const account = findMemoryAccountById(memoryChallenge.accountId);
    if (!account) {
      challenges.delete(challengeId);
      return { status: "otp_invalid", errorCode: "SESSION_INVALID", message: "Account not found for challenge." };
    }

    if (Date.now() > memoryChallenge.expiresAt) {
      challenges.delete(challengeId);
      audit(account, "auth.otp", "expired", { challengeId });
      return { status: "otp_invalid", errorCode: "OTP_EXPIRED", message: "Your verification code expired. Sign in again." };
    }

    const isValid = memoryChallenge.deliveryMethod === "totp_app"
      ? Boolean(account.otpMethod?.secret && verifyTotp(account.otpMethod.secret, code, Date.now(), env.OTP_TOTP_WINDOW))
      : memoryChallenge.code === code.trim();

    if (!isValid) {
      memoryChallenge.attemptsRemaining -= 1;
      audit(account, "auth.otp", "failed", { challengeId, attemptsRemaining: memoryChallenge.attemptsRemaining });

      if (memoryChallenge.attemptsRemaining <= 0) {
        challenges.delete(challengeId);
        audit(account, "auth.lockout", "locked", { reason: "otp_attempts_exhausted" });
        return { status: "locked", errorCode: "ACCOUNT_LOCKED", message: "Too many invalid codes. Sign in again." };
      }

      return { status: "otp_invalid", errorCode: "OTP_INVALID", message: "Incorrect verification code." };
    }

    const session = await createSessionForAccount(account);
    challenges.delete(challengeId);
    return { status: "authenticated", session };
  }

  const persistedChallenge = await loadPersistedChallenge(challengeId);
  if (!persistedChallenge) {
    return { status: "otp_invalid", errorCode: "OTP_EXPIRED", message: "Your verification code expired. Sign in again." };
  }

  const account = await loadPersistedAccountById(persistedChallenge.user_id);
  if (!account) {
    await consumePersistedChallenge(challengeId);
    return { status: "otp_invalid", errorCode: "SESSION_INVALID", message: "Account not found for challenge." };
  }

  if (Date.now() > new Date(persistedChallenge.expires_at).getTime()) {
    await consumePersistedChallenge(challengeId);
    audit(account, "auth.otp", "expired", { challengeId });
    return { status: "otp_invalid", errorCode: "OTP_EXPIRED", message: "Your verification code expired. Sign in again." };
  }

  const isValid = await validatePersistedChallengeCode(persistedChallenge, code);
  if (!isValid) {
    const attemptsRemaining = await decrementPersistedAttempts(challengeId);
    audit(account, "auth.otp", "failed", { challengeId, attemptsRemaining });

    if (!attemptsRemaining) {
      audit(account, "auth.lockout", "locked", { reason: "otp_attempts_exhausted" });
      return { status: "locked", errorCode: "ACCOUNT_LOCKED", message: "Too many invalid codes. Sign in again." };
    }

    return { status: "otp_invalid", errorCode: "OTP_INVALID", message: "Incorrect verification code." };
  }

  // Pass empty ip/ua — challenge ip/ua is not fetched for now (non-blocking improvement)
  const session = await createPersistedSessionForAccount(account, "", "");
  if (!session) {
    return { status: "locked", errorCode: "SESSION_INVALID", message: "Unable to create a session right now." };
  }

  await consumePersistedChallenge(challengeId);
  return { status: "authenticated", session };
}

// ─── Session retrieval ────────────────────────────────────────────────────────

async function getPersistedSession(jti: string, rawToken?: string): Promise<AuthSession | null> {
  const hasLastSeen = await supportsPersistedSessionLastSeenColumn();
  const hasPermissionGroups = await supportsMembershipsPermissionGroupsColumn();
  const lastActiveExpression = hasLastSeen ? "coalesce(s.last_seen_at, s.created_at)" : "s.created_at";
  const permissionGroupsExpression = hasPermissionGroups
    ? `coalesce(
         case
           when jsonb_typeof(m.permission_groups) = 'array' then array(select jsonb_array_elements_text(m.permission_groups))
           else '{}'::text[]
         end,
         '{}'::text[]
       )`
    : `'{}'::text[]`;

  return withDb(async (pool) => {
    const result = await pool.query<{
      session_token: string;
      role: Role;
      workspace_role: string | null;
      permission_groups: PermissionGroupKey[] | null;
      tenant_id: string | null;
      is_privileged: boolean;
      requires_terms_acceptance: boolean;
      redirect_path: string;
      expires_at: string;
      user_id: string;
      full_name: string;
      email: string | null;
      phone: string;
      is_break_glass: boolean;
      requires_dedicated_account: boolean;
      last_active_at: string;
    }>(
      `select
         s.session_token,
         s.role,
         case
           when m.tenant_id is not null then m.role
           else null
         end as workspace_role,
         ${permissionGroupsExpression} as permission_groups,
         s.tenant_id,
         s.is_privileged,
         s.requires_terms_acceptance,
         s.redirect_path,
         s.expires_at,
         u.id as user_id,
         u.full_name,
         u.email,
         u.phone,
         c.is_break_glass,
         c.requires_dedicated_account,
         ${lastActiveExpression}::text as last_active_at
       from sessions s
       join users u on u.id = s.user_id
       left join memberships m on m.user_id = s.user_id and m.tenant_id is not distinct from s.tenant_id
       left join credentials c on c.user_id = u.id
       where s.session_token = $1
         and s.revoked_at is null
         and s.expires_at > now()`,
      [jti]
    );

    if (result.rowCount === 0) {
      return null;
    }

    const row = result.rows[0];
    const touchedLastActiveAt = rawToken ? await maybeTouchPersistedSessionActivity(jti, row.last_active_at) : row.last_active_at;
    const workspaceAccess = resolveWorkspaceAccess({
      role: row.role,
      tenantId: row.tenant_id,
      workspaceRole: row.workspace_role,
      permissionGroups: row.permission_groups
    });
    const actor: SessionActor = {
      id: row.user_id,
      name: row.full_name,
      email: row.email ?? undefined,
      phone: row.phone,
      role: workspaceAccess.role,
      workspaceRole: workspaceAccess.workspaceRole,
      permissionGroups: workspaceAccess.permissionGroups,
      permissions: workspaceAccess.permissions,
      tenantId: row.tenant_id ?? undefined,
      lastActiveAt: touchedLastActiveAt,
      redirectPath: row.redirect_path,
      requiresTermsAcceptance: row.requires_terms_acceptance,
      privilegedAccess: {
        isPrivileged: row.is_privileged,
        requiresDedicatedAccount: row.requires_dedicated_account,
        isBreakGlass: row.is_break_glass,
        sessionTtlMinutes: sessionTtlForRole(workspaceAccess.role)
      }
    };

    const remainingMs = new Date(row.expires_at).getTime() - Date.now();
    if (remainingMs <= 0) return null;

    // Return the caller's raw token directly when available; only re-sign when called without one
    const sessionToken = rawToken ?? await signAccessToken(
      { sub: row.user_id, jti, role: workspaceAccess.role, tenantId: row.tenant_id ?? undefined, permissions: workspaceAccess.permissions },
      Math.floor(remainingMs / 1000)
    );

    return {
      sessionToken,
      sessionId: jti,
      role: workspaceAccess.role,
      tenantId: row.tenant_id ?? undefined,
      isPrivileged: row.is_privileged,
      requiresTermsAcceptance: row.requires_terms_acceptance,
      redirectPath: row.redirect_path,
      actor,
      expiresAt: row.expires_at
    } satisfies AuthSession;
  });
}

export async function getSession(rawToken?: string): Promise<AuthSession | null> {
  if (!rawToken) {
    return null;
  }

  const claims = await verifyAccessToken(rawToken);
  if (!claims) {
    return null;
  }

  const { jti } = claims;

  if (DEMO_AUTH_ENABLED) {
    const record = sessions.get(jti);
    if (record) {
      if (Date.now() > record.expiresAt) {
        sessions.delete(jti);
      } else {
        const now = Date.now();
        if (now - record.lastSeenAt >= SESSION_ACTIVITY_WRITE_THROTTLE_MS) {
          record.lastSeenAt = now;
          const account = findMemoryAccountById(record.actor.id);
          if (account) {
            account.lastActiveAt = new Date(now).toISOString();
          }
        }

        return {
          sessionToken: rawToken,
          sessionId: jti,
          role: record.actor.role,
          tenantId: record.tenantId,
          isPrivileged: record.actor.privilegedAccess.isPrivileged,
          requiresTermsAcceptance: record.actor.requiresTermsAcceptance,
          redirectPath: record.actor.redirectPath,
          actor: { ...record.actor, lastActiveAt: new Date(record.lastSeenAt).toISOString() },
          expiresAt: new Date(record.expiresAt).toISOString()
        } satisfies AuthSession;
      }
    }
  }

  return getPersistedSession(jti, rawToken);
}

// ─── Auth security settings ───────────────────────────────────────────────────

export async function getAuthSecuritySettings(rawToken?: string) {
  if (!rawToken) return null;

  const claims = await verifyAccessToken(rawToken);
  if (!claims) return null;

  if (DEMO_AUTH_ENABLED) {
    const record = sessions.get(claims.jti);
    if (record) {
      const account = findMemoryAccountById(record.actor.id);
      return account ? buildAuthSecuritySettings(account) : null;
    }
  }

  const session = await getPersistedSession(claims.jti);
  if (!session) return null;

  const account = await loadPersistedAccountById(session.actor.id);
  return account ? buildAuthSecuritySettings(account) : null;
}

export async function updateAuthSecuritySettings(rawToken: string, totpRequired: boolean): Promise<AuthSecurityUpdateResult> {
  const claims = await verifyAccessToken(rawToken);
  if (!claims) {
    return { status: "session_invalid", message: "Session not found." };
  }

  if (DEMO_AUTH_ENABLED) {
    const record = sessions.get(claims.jti);
    if (record) {
      const account = findMemoryAccountById(record.actor.id);
      if (!account) return { status: "session_invalid", message: "Session not found." };
      if (!buildAuthSecuritySettings(account).canManageTotp) return { status: "forbidden", message: "This account cannot change authenticator requirements." };

      account.totpRequired = totpRequired;
      audit(account, "settings", "totp_requirement_updated", { totpRequired });
      return { status: "updated", settings: buildAuthSecuritySettings(account) };
    }
  }

  const session = await getPersistedSession(claims.jti);
  if (!session) return { status: "session_invalid", message: "Session not found." };

  const account = await loadPersistedAccountById(session.actor.id);
  if (!account) return { status: "session_invalid", message: "Account not found." };
  if (!buildAuthSecuritySettings(account).canManageTotp) return { status: "forbidden", message: "This account cannot change authenticator requirements." };

  const persisted = await withDb(async (pool) => {
    await pool.query(
      `update credentials set totp_required = $2, updated_at = now() where user_id = $1`,
      [account.id, totpRequired]
    );
    return true;
  });

  if (!persisted) return { status: "session_invalid", message: "Security settings could not be updated right now." };

  account.totpRequired = totpRequired;
  audit(account, "settings", "totp_requirement_updated", { totpRequired });
  return { status: "updated", settings: buildAuthSecuritySettings(account) };
}

// ─── Logout ───────────────────────────────────────────────────────────────────

export async function logout(rawToken?: string) {
  if (!rawToken) return;

  const claims = await verifyAccessToken(rawToken);
  const jti = claims?.jti;

  if (DEMO_AUTH_ENABLED && jti) {
    const record = sessions.get(jti);
    sessions.delete(jti);
    persistedSessionTouchCache.delete(jti);
    if (record) {
      const account = findMemoryAccountById(record.actor.id);
      if (account) audit(account, "auth.session", "revoked", { sessionId: jti });
    }
  }

  if (!jti) return;
  persistedSessionTouchCache.delete(jti);
  const hasRefreshTokensTable = await supportsRefreshTokensTable();

  await withDb(async (pool) => {
    await pool.query(`update sessions set revoked_at = now() where session_token = $1`, [jti]);
    if (hasRefreshTokensTable) {
      await pool.query(`update refresh_tokens set revoked_at = now() where session_id = $1 and revoked_at is null`, [jti]);
    }
    return true;
  });
}

// ─── Terms acceptance ─────────────────────────────────────────────────────────

export async function acceptTerms(rawToken: string, documentType: "terms_of_service" | "privacy_notice", acceptedVersion: string, ipAddress: string, userAgent: string) {
  const claims = await verifyAccessToken(rawToken);
  if (!claims) return null;
  const jti = claims.jti;

  if (DEMO_AUTH_ENABLED) {
    const record = sessions.get(jti);
    if (record) {
      const account = findMemoryAccountById(record.actor.id);
      if (!account) return null;

      account.acceptedTermsVersion = acceptedVersion;
      record.actor.requiresTermsAcceptance = false;

      const acceptance: TermsAcceptance = {
        userId: account.id,
        tenantId: account.tenantId,
        documentType,
        acceptedVersion,
        acceptedAt: nowIso(),
        ipAddress,
        userAgent
      };

      termsAcceptances.push(acceptance);
      audit(account, "auth.terms", "accepted", { documentType, acceptedVersion });

      return { acceptance, session: await getSession(rawToken) };
    }
  }

  const persisted = await withDb(async (pool) => {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const sessionResult = await client.query<{ user_id: string; tenant_id: string | null }>(
        `select user_id, tenant_id from sessions where session_token = $1 and revoked_at is null`,
        [jti]
      );

      if (sessionResult.rowCount === 0) {
        await client.query("ROLLBACK");
        return null;
      }

      const documentResult = await client.query<{ id: string }>(
        `insert into terms_documents (document_type, version, content_url)
         values ($1, $2, $3)
         on conflict (document_type, version) do update
         set content_url = excluded.content_url
         returning id`,
        [documentType, acceptedVersion, `/docs/${documentType}/${acceptedVersion}`]
      );

      await client.query(
        `insert into terms_acceptances (tenant_id, user_id, document_id, accepted_version, accepted_at, ip_address, user_agent)
         values ($1, $2, $3, $4, now(), $5::inet, $6)`,
        [sessionResult.rows[0].tenant_id, sessionResult.rows[0].user_id, documentResult.rows[0].id, acceptedVersion, ipAddress, userAgent]
      );

      const acceptanceCountResult = await client.query<{ accepted_documents: number }>(
        `select count(distinct td.document_type)::int as accepted_documents
         from terms_acceptances ta
         join terms_documents td on td.id = ta.document_id
         where ta.user_id = $1
           and ta.accepted_version = $2
           and td.document_type in ('terms_of_service', 'privacy_notice')`,
        [sessionResult.rows[0].user_id, acceptedVersion]
      );

      if ((acceptanceCountResult.rows[0]?.accepted_documents ?? 0) >= 2) {
        await client.query(
          `update sessions set requires_terms_acceptance = false where session_token = $1`,
          [jti]
        );
      }

      await client.query("COMMIT");

      return {
        acceptance: {
          userId: sessionResult.rows[0].user_id,
          tenantId: sessionResult.rows[0].tenant_id ?? undefined,
          documentType,
          acceptedVersion,
          acceptedAt: nowIso(),
          ipAddress,
          userAgent
        } satisfies TermsAcceptance,
        session: await getPersistedSession(jti, rawToken)
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  });

  return persisted;
}

// ─── Password reset ───────────────────────────────────────────────────────────

export async function requestPasswordReset(identifier: string) {
  const account = findMemoryAccount(identifier);
  if (account) {
    audit(account, "auth.password", "reset_requested", {});
  }

  await withDb(async (pool) => {
    const lookup = identifier.trim().toLowerCase();
    const phone = identifier.trim();
    const result = await pool.query<{ user_id: string | null }>(
      `select u.id as user_id from users u
       where lower(coalesce(u.email, '')) = $1 or u.phone = $2
       limit 1`,
      [lookup, phone]
    );

    if ((result.rowCount ?? 0) > 0 && result.rows[0].user_id) {
      await pool.query(
        `insert into password_reset_requests (user_id, identifier, token, expires_at)
         values ($1, $2, $3, now() + interval '30 minutes')`,
        [result.rows[0].user_id, identifier.trim(), randomUUID()]
      );
    }

    return true;
  });

  return { status: "queued" as const, message: "A reset link was queued for delivery if the account exists." };
}

export async function consumePasswordReset(token: string, newPassword: string) {
  if (!token || !newPassword || newPassword.length < 8) {
    return { status: "invalid" as const, message: "Token and a password of at least 8 characters are required." };
  }

  const hasRefreshTokensTable = await supportsRefreshTokensTable();

  const result = await withDb(async (pool) => {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const resetRow = await client.query<{ id: string; user_id: string }>(
        `select id, user_id
         from password_reset_requests
         where token = $1
           and consumed_at is null
           and expires_at > now()
         limit 1`,
        [token]
      );

      if (resetRow.rowCount === 0) {
        await client.query("ROLLBACK");
        return { status: "invalid" as const, message: "This reset link is invalid or has expired." };
      }

      const { id: requestId, user_id: userId } = resetRow.rows[0];

      await client.query(
        `update credentials
         set password_hash = crypt($2, gen_salt('bf')), updated_at = now()
         where user_id = $1`,
        [userId, newPassword]
      );

      await client.query(
        `update password_reset_requests set consumed_at = now() where id = $1`,
        [requestId]
      );

      // Revoke all existing sessions for security after password change
      await client.query(
        `update sessions set revoked_at = now() where user_id = $1 and revoked_at is null`,
        [userId]
      );
      if (hasRefreshTokensTable) {
        await client.query(
          `update refresh_tokens set revoked_at = now() where user_id = $1 and revoked_at is null`,
          [userId]
        );
      }

      await client.query("COMMIT");
      return { status: "ok" as const };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  });

  return result ?? { status: "invalid" as const, message: "Password reset unavailable right now." };
}

// ─── Refresh token rotation ───────────────────────────────────────────────────

export async function rotateRefreshToken(
  refreshToken: string,
  ipAddress = "",
  userAgent = ""
): Promise<{ sessionToken: string; sessionId: string; refreshToken: string; expiresAt: string } | null> {
  if (!(await supportsRefreshTokensTable())) {
    return null;
  }

  const tokenHash = hashToken(refreshToken);

  // Demo mode: check in-memory Map
  if (DEMO_AUTH_ENABLED) {
    const demoRecord = demoRefreshTokens.get(tokenHash);
    if (demoRecord && Date.now() < demoRecord.expiresAt) {
      demoRefreshTokens.delete(tokenHash);
      const account = findMemoryAccountById(demoRecord.userId);
      if (!account) return null;

      const session = await createSessionForAccount(account);
      const newRefreshToken = randomUUID();
      const newHash = hashToken(newRefreshToken);
      demoRefreshTokens.set(newHash, {
        userId: account.id,
        jti: session.sessionId,
        expiresAt: Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000
      });

      return { sessionToken: session.sessionToken, sessionId: session.sessionId, refreshToken: newRefreshToken, expiresAt: session.expiresAt };
    }
  }

  const result = await withDb(async (pool) => {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const tokenRow = await client.query<{ id: string; user_id: string; session_id: string }>(
        `select id, user_id, session_id
         from refresh_tokens
         where token_hash = $1
           and revoked_at is null
           and expires_at > now()
         limit 1
         for update`,
        [tokenHash]
      );

      if (tokenRow.rowCount === 0) {
        await client.query("ROLLBACK");
        return null;
      }

      const { id: tokenId, user_id: userId } = tokenRow.rows[0];

      // Revoke old refresh token
      await client.query(`update refresh_tokens set revoked_at = now() where id = $1`, [tokenId]);

      await client.query("COMMIT");

      return userId;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  });

  if (!result) return null;

  const account = await loadPersistedAccountById(result);
  if (!account) return null;

  const session = await createPersistedSessionForAccount(account, ipAddress, userAgent);
  if (!session || !session.refreshToken) return null;

  return {
    sessionToken: session.sessionToken,
    sessionId: session.sessionId,
    refreshToken: session.refreshToken,
    expiresAt: session.expiresAt
  };
}

// ─── Session cleanup ──────────────────────────────────────────────────────────

export async function cleanExpiredSessions(): Promise<void> {
  // Purge expired in-memory entries
  const now = Date.now();
  for (const [jti, record] of sessions) {
    if (now > record.expiresAt) {
      sessions.delete(jti);
      persistedSessionTouchCache.delete(jti);
    }
  }
  for (const [hash, record] of demoRefreshTokens) {
    if (now > record.expiresAt) demoRefreshTokens.delete(hash);
  }
  const hasRefreshTokensTable = await supportsRefreshTokensTable();

  await withDb(async (pool) => {
    await pool.query(`delete from sessions where expires_at < now() - interval '1 hour'`);
    if (hasRefreshTokensTable) {
      await pool.query(`delete from refresh_tokens where expires_at < now() - interval '1 hour'`);
    }
    await pool.query(`delete from otp_challenges where expires_at < now() - interval '1 hour'`);
    return true;
  });
}

// ─── Audit ────────────────────────────────────────────────────────────────────

export function listAuthAuditEvents() {
  return [...authAuditEvents];
}

// ─── Workspace provisioning ───────────────────────────────────────────────────

export async function provisionWorkspaceSession(input: CreateWorkspaceRequest) {
  const workspaceSlug = slugify(input.companyName);
  const tenantId = randomUUID();
  const adminInvite = input.invites.find((invite) => invite.role.toLowerCase().includes("admin"));
  const adminName = adminInvite?.name?.trim() || `${input.companyName.trim()} Admin`;
  const adminEmail = adminInvite?.email?.trim().toLowerCase() || `admin@${workspaceSlug}.local`;
  const generatedPhone = nextGeneratedPhone();

  const account: AccountRecord = {
    id: randomUUID(),
    name: adminName,
    email: adminEmail,
    phone: generatedPhone,
    role: "company_admin",
    workspaceRole: "owner",
    permissionGroups: defaultPermissionGroupsForWorkspaceRole("owner"),
    tenantId,
    permissions: ["tenant.read", "tenant.manage", "finance.read", "finance.manage", "inventory.manage", "production.manage", "service_order.manage", "audit.read"],
    password: "Workspace2026!",
    redirectPath: "/smb/home",
    privilegedAccess: { isPrivileged: false, requiresDedicatedAccount: false, isBreakGlass: false, sessionTtlMinutes: 480 },
    acceptedTermsVersion: undefined,
    loginIntent: "smb_customer",
    totpRequired: false,
    otpMethod: {
      methodType: "sms",
      providerName: "demo_sms",
      destination: generatedPhone,
      isPrimary: true,
      isEnabled: true
    }
  };

  accounts.push(account);
  audit(account, "auth.session", "workspace_provisioned", {
    tenantId,
    companyName: input.companyName,
    businessType: input.businessType,
    plan: input.plan
  });

  const session = await createSessionForAccount(account);

  return {
    tenantId,
    tenantSlug: workspaceSlug,
    tenantName: input.companyName.trim(),
    session,
    adminUser: {
      id: account.id,
      name: account.name,
      email: account.email,
      phone: account.phone,
      role: account.role,
      workspaceRole: account.workspaceRole,
      permissionGroups: account.permissionGroups,
      permissions: account.permissions,
      tenantId: account.tenantId
    } satisfies AuthenticatedUser
  };
}

export function rollbackProvisionedWorkspaceSession(accountId: string, sessionId: string) {
  sessions.delete(sessionId);
  const accountIndex = accounts.findIndex((account) => account.id === accountId);
  if (accountIndex >= 0) {
    accounts.splice(accountIndex, 1);
  }
}
