import { randomUUID } from "node:crypto";
import type { AuditEvent } from "@sqb/domain-types";
import type { PoolClient } from "pg";
import { withDb } from "../../lib/db.js";

export type AuditEventInput = Omit<AuditEvent, "id" | "occurredAt"> & {
  id?: string;
  occurredAt?: string;
};

export type AuditEventQuery = {
  category?: string;
  actorRole?: string;
  tenantId?: string;
  q?: string;
  from?: string;
  to?: string;
  limit?: string | number;
};

type AuditEventRow = {
  id: string;
  actor_user_id: string | null;
  actor_role: AuditEvent["actorRole"];
  tenant_id: string | null;
  category: AuditEvent["category"];
  action: string;
  resource_type: string;
  resource_id: string;
  occurred_at: string;
  metadata: Record<string, string | number | boolean | null>;
};

function normalizeDate(value?: string) {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

function normalizeLimit(value?: string | number) {
  return Math.min(Math.max(Number.parseInt(String(value ?? "100"), 10) || 100, 1), 500);
}

function mapAuditEvent(row: AuditEventRow): AuditEvent {
  return {
    id: row.id,
    actorUserId: row.actor_user_id ?? "unknown",
    actorRole: row.actor_role,
    tenantId: row.tenant_id ?? undefined,
    category: row.category,
    action: row.action,
    resourceType: row.resource_type,
    resourceId: row.resource_id,
    occurredAt: row.occurred_at,
    metadata: row.metadata ?? {}
  };
}

function filterFallbackEvents(events: AuditEvent[], query: AuditEventQuery, authTenantId?: string) {
  const q = query.q?.trim().toLowerCase();
  const from = query.from ? new Date(query.from).getTime() : Number.NaN;
  const to = query.to ? new Date(query.to).getTime() : Number.NaN;

  return events
    .filter((event) => {
      if (authTenantId && event.tenantId !== authTenantId) return false;
      if (query.category && event.category !== query.category) return false;
      if (query.actorRole && event.actorRole !== query.actorRole) return false;
      if (query.tenantId && event.tenantId !== query.tenantId) return false;

      const occurredAt = new Date(event.occurredAt).getTime();
      if (Number.isFinite(from) && occurredAt < from) return false;
      if (Number.isFinite(to) && occurredAt > to) return false;

      if (q) {
        const metadata = Object.entries(event.metadata)
          .map(([key, value]) => `${key} ${String(value)}`)
          .join(" ");
        const haystack = [
          event.actorRole,
          event.category,
          event.action,
          event.resourceType,
          event.resourceId,
          event.tenantId ?? "bank-level",
          metadata
        ].join(" ").toLowerCase();

        if (!haystack.includes(q)) return false;
      }

      return true;
    })
    .sort((left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime())
    .slice(0, normalizeLimit(query.limit));
}

export async function insertAuditEventWithClient(client: PoolClient, input: AuditEventInput) {
  const id = input.id ?? randomUUID();
  const occurredAt = input.occurredAt ?? new Date().toISOString();

  await client.query(
    `insert into audit_events (
       id,
       tenant_id,
       actor_user_id,
       actor_role,
       category,
       action,
       resource_type,
       resource_id,
       metadata,
       occurred_at
     ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10)`,
    [
      id,
      input.tenantId ?? null,
      input.actorUserId,
      input.actorRole,
      input.category,
      input.action,
      input.resourceType,
      input.resourceId,
      JSON.stringify(input.metadata ?? {}),
      occurredAt
    ]
  );

  return { id, occurredAt };
}

export async function recordAuditEvent(input: AuditEventInput) {
  return withDb(async (pool) => {
    const client = await pool.connect();
    try {
      return await insertAuditEventWithClient(client, input);
    } finally {
      client.release();
    }
  });
}

export async function listAuditEvents(
  query: AuditEventQuery = {},
  options: { authTenantId?: string; fallbackEvents?: AuditEvent[] } = {}
) {
  const result = await withDb(async (pool) => {
    const values: Array<string | number> = [];
    const where: string[] = [];

    if (options.authTenantId) {
      values.push(options.authTenantId);
      where.push(`tenant_id = $${values.length}`);
    }

    if (query.category) {
      values.push(query.category);
      where.push(`category = $${values.length}`);
    }

    if (query.actorRole) {
      values.push(query.actorRole);
      where.push(`actor_role = $${values.length}`);
    }

    if (query.tenantId) {
      values.push(query.tenantId);
      where.push(`tenant_id = $${values.length}`);
    }

    const from = normalizeDate(query.from);
    if (from) {
      values.push(from);
      where.push(`occurred_at >= $${values.length}`);
    }

    const to = normalizeDate(query.to);
    if (to) {
      values.push(to);
      where.push(`occurred_at <= $${values.length}`);
    }

    if (query.q?.trim()) {
      values.push(`%${query.q.trim().toLowerCase()}%`);
      where.push(`lower(concat_ws(' ', actor_role, category, action, resource_type, resource_id, coalesce(tenant_id::text, 'bank-level'), metadata::text)) like $${values.length}`);
    }

    values.push(normalizeLimit(query.limit));

    const sql = `select
        id,
        actor_user_id,
        actor_role,
        tenant_id,
        category,
        action,
        resource_type,
        resource_id,
        occurred_at::text,
        metadata
      from audit_events
      ${where.length > 0 ? `where ${where.join(" and ")}` : ""}
      order by occurred_at desc
      limit $${values.length}`;

    const response = await pool.query<AuditEventRow>(sql, values);
    return response.rows.map(mapAuditEvent);
  });

  if (result !== null) {
    return result;
  }

  return filterFallbackEvents(options.fallbackEvents ?? [], query, options.authTenantId);
}
