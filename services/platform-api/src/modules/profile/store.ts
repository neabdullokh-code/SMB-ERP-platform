import { createHash, randomUUID } from "node:crypto";
import { loadEnv } from "@sqb/config";
import type {
  AuthSession,
  ConfirmEmailChangeResponse,
  RequestEmailChangeResponse,
  Role,
  UpdateProfileRequest,
  UserProfile
} from "@sqb/domain-types";
import { withDb } from "../../lib/db.js";
import { enqueueNotification } from "../../lib/queue-publisher.js";
import { recordAuditEvent } from "../audit/store.js";

const env = loadEnv();
const EMAIL_CHANGE_TOKEN_TTL_MINUTES = 30;

type PersistedProfileRow = {
  user_id: string;
  full_name: string;
  email: string | null;
  phone: string;
  avatar_storage_key: string | null;
  avatar_url: string | null;
  avatar_updated_at: string | null;
  role: Role;
  workspace_role: string | null;
  tenant_id: string | null;
  last_active_at: string | null;
};

type VerificationRow = {
  id: string;
  target_user_id: string;
  requested_by_user_id: string;
  tenant_id: string | null;
  new_email: string;
  token_hash: string;
  expires_at: string;
  consumed_at: string | null;
};

type RequestedByRoleRow = {
  role: string;
  tenant_id: string | null;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function emailLooksValid(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function hashToken(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function mapProfile(row: PersistedProfileRow): UserProfile {
  return {
    userId: row.user_id,
    name: row.full_name,
    email: row.email ?? undefined,
    phone: row.phone,
    avatarStorageKey: row.avatar_storage_key ?? undefined,
    avatarUrl: row.avatar_url ?? undefined,
    avatarUpdatedAt: row.avatar_updated_at ?? undefined,
    role: row.role,
    workspaceRole: row.workspace_role ? row.workspace_role as UserProfile["workspaceRole"] : undefined,
    tenantId: row.tenant_id ?? undefined,
    permissions: [],
    lastActiveAt: row.last_active_at ?? undefined
  };
}

function profileFromSession(session: AuthSession): UserProfile {
  return {
    userId: session.actor.id,
    name: session.actor.name,
    email: session.actor.email,
    phone: session.actor.phone,
    avatarStorageKey: session.actor.avatarStorageKey,
    avatarUrl: session.actor.avatarUrl,
    avatarUpdatedAt: session.actor.avatarUpdatedAt,
    role: session.actor.role,
    workspaceRole: session.actor.workspaceRole,
    tenantId: session.actor.tenantId,
    permissions: session.actor.permissions,
    lastActiveAt: session.actor.lastActiveAt
  };
}

function isTenantAdmin(session: AuthSession) {
  return Boolean(session.tenantId && session.actor.permissions.includes("tenant.manage"));
}

function isBankAdmin(session: AuthSession) {
  return session.actor.role === "super_admin" || session.actor.role === "bank_admin";
}

async function resolveActorRoleForUser(userId: string): Promise<Role> {
  const row = await withDb(async (pool) => {
    const result = await pool.query<RequestedByRoleRow>(
      `select m.role, m.tenant_id
       from memberships m
       where m.user_id = $1
       order by case
         when m.role = 'super_admin' then 1
         when m.role = 'bank_admin' then 2
         when m.role in ('owner', 'company_admin') then 3
         when m.role in ('manager', 'operator') then 4
         else 5
       end
       limit 1`,
      [userId]
    );
    return result.rows[0] ?? null;
  });

  if (!row) return "employee";
  if (row.role === "super_admin") return "super_admin";
  if (row.role === "bank_admin") return "bank_admin";
  if (row.tenant_id && (row.role === "owner" || row.role === "company_admin")) return "company_admin";
  return "employee";
}

export function canEditTargetProfile(session: AuthSession, targetProfile: UserProfile) {
  if (session.actor.id === targetProfile.userId) return true;
  if (isTenantAdmin(session)) {
    return session.tenantId === targetProfile.tenantId;
  }
  if (isBankAdmin(session)) {
    return !targetProfile.tenantId;
  }
  return false;
}

export async function getProfileByUserId(userId: string): Promise<UserProfile | null> {
  const result = await withDb(async (pool) => {
    const response = await pool.query<PersistedProfileRow>(
      `select
         u.id as user_id,
         u.full_name,
         u.email,
         u.phone,
         u.avatar_storage_key,
         u.avatar_url,
         u.avatar_updated_at::text,
         case
           when m.role = 'super_admin' then 'super_admin'
           when m.role = 'bank_admin' then 'bank_admin'
           when m.role in ('owner', 'company_admin') then 'company_admin'
           else 'employee'
         end as role,
         case when m.tenant_id is not null then m.role else null end as workspace_role,
         m.tenant_id,
         (
           select max(coalesce(s.last_seen_at, s.created_at))::text
           from sessions s
           where s.user_id = u.id
             and s.revoked_at is null
         ) as last_active_at
       from users u
       join memberships m on m.user_id = u.id
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
      [userId]
    );

    return response.rows[0] ?? null;
  });

  return result ? mapProfile(result) : null;
}

export async function getMyProfile(session: AuthSession): Promise<UserProfile> {
  const profile = await getProfileByUserId(session.actor.id);
  return profile ?? profileFromSession(session);
}

export async function listProfilesForAdmin(session: AuthSession): Promise<UserProfile[]> {
  const rows = await withDb(async (pool) => {
    if (isTenantAdmin(session)) {
      const response = await pool.query<PersistedProfileRow>(
        `select
           u.id as user_id,
           u.full_name,
           u.email,
           u.phone,
           u.avatar_storage_key,
           u.avatar_url,
           u.avatar_updated_at::text,
           case
             when m.role in ('owner', 'company_admin') then 'company_admin'
             else 'employee'
           end as role,
           m.role as workspace_role,
           m.tenant_id,
           (
             select max(coalesce(s.last_seen_at, s.created_at))::text
             from sessions s
             where s.user_id = u.id
               and s.revoked_at is null
           ) as last_active_at
         from users u
         join memberships m on m.user_id = u.id
         where m.tenant_id = $1
         order by u.full_name asc`,
        [session.tenantId]
      );
      return response.rows;
    }

    if (isBankAdmin(session)) {
      const response = await pool.query<PersistedProfileRow>(
        `select
           u.id as user_id,
           u.full_name,
           u.email,
           u.phone,
           u.avatar_storage_key,
           u.avatar_url,
           u.avatar_updated_at::text,
           case
             when m.role = 'super_admin' then 'super_admin'
             else 'bank_admin'
           end as role,
           null::text as workspace_role,
           null::uuid as tenant_id,
           (
             select max(coalesce(s.last_seen_at, s.created_at))::text
             from sessions s
             where s.user_id = u.id
               and s.revoked_at is null
           ) as last_active_at
         from users u
         join memberships m on m.user_id = u.id
         where m.tenant_id is null
           and m.role in ('super_admin', 'bank_admin')
         order by u.full_name asc`
      );
      return response.rows;
    }

    return [];
  });

  if (!rows) return [];
  return rows.map(mapProfile);
}

export async function updateProfileNamePhoto(
  actorSession: AuthSession,
  targetUserId: string,
  payload: UpdateProfileRequest
): Promise<UserProfile | null> {
  const trimmedName = payload.name?.trim();
  const shouldSetAvatar = Object.prototype.hasOwnProperty.call(payload, "avatarStorageKey") || Object.prototype.hasOwnProperty.call(payload, "avatarUrl");

  const updated = await withDb(async (pool) => {
    const sets: string[] = [];
    const values: Array<string | null> = [];

    if (trimmedName) {
      values.push(trimmedName);
      sets.push(`full_name = $${values.length}`);
    }

    if (shouldSetAvatar) {
      values.push(payload.avatarStorageKey ?? null);
      sets.push(`avatar_storage_key = $${values.length}`);
      values.push(payload.avatarUrl ?? null);
      sets.push(`avatar_url = $${values.length}`);
      sets.push(`avatar_updated_at = now()`);
    }

    if (sets.length === 0) {
      return null;
    }

    values.push(targetUserId);
    const response = await pool.query(
      `update users
       set ${sets.join(", ")}
       where id = $${values.length}
       returning id`,
      values
    );

    if ((response.rowCount ?? 0) === 0) {
      return null;
    }
    return response.rows[0]?.id as string;
  });

  if (!updated) return null;

  const profile = await getProfileByUserId(targetUserId);
  if (!profile) return null;

  await recordAuditEvent({
    actorUserId: actorSession.actor.id,
    actorRole: actorSession.actor.role,
    tenantId: actorSession.tenantId,
    category: "settings",
    action: targetUserId === actorSession.actor.id ? "profile.updated" : "profile.updated_by_admin",
    resourceType: "user_profile",
    resourceId: targetUserId,
    metadata: {
      updatedName: Boolean(trimmedName),
      updatedAvatar: shouldSetAvatar
    }
  });

  return profile;
}

export async function requestEmailChange(
  actorSession: AuthSession,
  targetUserId: string,
  newEmailRaw: string
): Promise<{ status: "ok"; response: RequestEmailChangeResponse } | { status: "error"; message: string; code: number }> {
  const newEmail = normalizeEmail(newEmailRaw);
  if (!emailLooksValid(newEmail)) {
    return { status: "error", code: 400, message: "Email format is invalid." };
  }

  const target = await getProfileByUserId(targetUserId);
  if (!target) {
    return { status: "error", code: 404, message: "Target profile not found." };
  }

  if (!canEditTargetProfile(actorSession, target)) {
    return { status: "error", code: 403, message: "You are not allowed to update this profile." };
  }

  if ((target.email || "").toLowerCase() === newEmail) {
    return { status: "error", code: 409, message: "This email is already active on the profile." };
  }

  const collision = await withDb(async (pool) => {
    const existing = await pool.query<{ exists: boolean }>(
      `select exists(select 1 from users where lower(email) = $1) as exists`,
      [newEmail]
    );
    return existing.rows[0]?.exists ?? false;
  });

  if (collision) {
    return { status: "error", code: 409, message: "This email is already in use." };
  }

  const token = randomUUID();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + EMAIL_CHANGE_TOKEN_TTL_MINUTES * 60 * 1000).toISOString();

  const created = await withDb(async (pool) => {
    await pool.query(
      `insert into profile_email_change_verifications (
         id, target_user_id, requested_by_user_id, tenant_id, new_email, token_hash, expires_at
       ) values ($1, $2, $3, $4, $5, $6, $7::timestamptz)`,
      [randomUUID(), targetUserId, actorSession.actor.id, actorSession.tenantId ?? null, newEmail, tokenHash, expiresAt]
    );
    return true;
  });

  if (!created) {
    return { status: "error", code: 503, message: "Email change service is unavailable right now." };
  }

  const verificationSettingsPath = isBankAdmin(actorSession) ? "/bank/settings" : "/smb/settings";
  const verificationPreviewUrl = `${verificationSettingsPath}?emailChangeToken=${token}`;
  await enqueueNotification({
    type: "generic",
    tenantId: actorSession.tenantId ?? "platform",
    actorId: actorSession.actor.id,
    payload: {
      emails: [newEmail],
      message: `Confirm your new email for SQB Business OS: ${verificationPreviewUrl}`
    }
  });

  await recordAuditEvent({
    actorUserId: actorSession.actor.id,
    actorRole: actorSession.actor.role,
    tenantId: actorSession.tenantId,
    category: "settings",
    action: "profile.email_change_requested",
    resourceType: "user_profile",
    resourceId: targetUserId,
    metadata: {
      newEmail
    }
  });

  return {
    status: "ok",
    response: {
      status: "verification_sent",
      expiresAt,
      delivery: "email",
      verificationPreviewUrl: env.ALLOW_DEMO_AUTH ? verificationPreviewUrl : undefined
    }
  };
}

export async function confirmEmailChange(token: string): Promise<ConfirmEmailChangeResponse> {
  if (!token?.trim()) {
    return { status: "invalid", message: "Verification token is required." };
  }

  const tokenHash = hashToken(token.trim());

  const result = await withDb(async (pool) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const response = await client.query<VerificationRow>(
        `select id, target_user_id, requested_by_user_id, tenant_id, new_email, token_hash, expires_at::text, consumed_at::text
         from profile_email_change_verifications
         where token_hash = $1
         limit 1
         for update`,
        [tokenHash]
      );

      if ((response.rowCount ?? 0) === 0) {
        await client.query("ROLLBACK");
        return { status: "invalid" as const, message: "Verification link is invalid." };
      }

      const verification = response.rows[0];
      if (verification.consumed_at) {
        await client.query("ROLLBACK");
        return { status: "invalid" as const, message: "Verification link was already used." };
      }
      if (new Date(verification.expires_at).getTime() < Date.now()) {
        await client.query("ROLLBACK");
        return { status: "invalid" as const, message: "Verification link expired." };
      }

      await client.query(
        `update users
         set email = $2
         where id = $1`,
        [verification.target_user_id, verification.new_email]
      );

      await client.query(
        `update profile_email_change_verifications
         set consumed_at = now()
         where id = $1`,
        [verification.id]
      );

      await client.query("COMMIT");

      const actorRole = await resolveActorRoleForUser(verification.requested_by_user_id);

      await recordAuditEvent({
        actorUserId: verification.requested_by_user_id,
        actorRole,
        tenantId: verification.tenant_id ?? undefined,
        category: "settings",
        action: "profile.email_change_confirmed",
        resourceType: "user_profile",
        resourceId: verification.target_user_id,
        metadata: {
          newEmail: verification.new_email
        }
      });

      return { status: "confirmed" as const, message: "Email updated successfully." };
    } catch (error) {
      await client.query("ROLLBACK");
      if (typeof error === "object" && error && "code" in error && (error as { code?: string }).code === "23505") {
        return { status: "invalid" as const, message: "This email is already in use." };
      }
      throw error;
    } finally {
      client.release();
    }
  });

  if (!result) {
    return { status: "invalid", message: "Email verification is unavailable right now." };
  }
  return result;
}
