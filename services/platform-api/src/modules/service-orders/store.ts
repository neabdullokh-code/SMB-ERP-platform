import { randomUUID } from "node:crypto";
import type { ApprovalRequest, ServiceOrder } from "@sqb/domain-types";
import { withDb } from "../../lib/db.js";
import { fixtures } from "../../lib/fixtures.js";

// ── Row types ──────────────────────────────────────────────────────────────

type ServiceOrderRow = {
  id: string;
  tenant_id: string;
  title: string;
  customer: string;
  status: ServiceOrder["status"];
  requested_by: string;
  due_date: string;
};

type ApprovalRow = {
  id: string;
  tenant_id: string;
  entity_type: ApprovalRequest["entityType"];
  entity_id: string;
  submitted_by: string;
  approver_role: ApprovalRequest["approverRole"];
  status: ApprovalRequest["status"];
};

// ── Mappers ────────────────────────────────────────────────────────────────

function mapServiceOrder(row: ServiceOrderRow): ServiceOrder {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    title: row.title,
    customer: row.customer,
    status: row.status,
    requestedBy: row.requested_by,
    dueDate: row.due_date
  };
}

function mapApproval(row: ApprovalRow): ApprovalRequest {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    submittedBy: row.submitted_by,
    approverRole: row.approver_role,
    status: row.status
  };
}

// ── Service Orders ─────────────────────────────────────────────────────────

export async function listServiceOrders(
  tenantId: string,
  filters?: { status?: ServiceOrder["status"]; q?: string }
): Promise<ServiceOrder[]> {
  const result = await withDb(async (pool) => {
    const params: unknown[] = [tenantId];
    const whereParts = ["tenant_id = $1", "deleted_at is null"];

    if (filters?.status) {
      params.push(filters.status);
      whereParts.push(`status = $${params.length}`);
    }

    if (filters?.q) {
      params.push(`%${filters.q.toLowerCase()}%`);
      whereParts.push(`(lower(title) like $${params.length} or lower(customer) like $${params.length} or lower(requested_by) like $${params.length})`);
    }

    const whereClause = whereParts.join(" and ");
    const res = await pool.query<ServiceOrderRow>(
      `select id, tenant_id, title, customer, status, requested_by, due_date::text as due_date
       from service_orders
       where ${whereClause}
       order by due_date asc, created_at desc`,
      params
    );
    return res.rows.map(mapServiceOrder);
  });

  if (result === null) {
    let orders = fixtures.serviceOrders.filter((o) => o.tenantId === tenantId);
    if (filters?.status) {
      orders = orders.filter((o) => o.status === filters.status);
    }
    if (filters?.q) {
      const q = filters.q.toLowerCase();
      orders = orders.filter(
        (o) =>
          o.title.toLowerCase().includes(q) ||
          o.customer.toLowerCase().includes(q) ||
          o.requestedBy.toLowerCase().includes(q)
      );
    }
    return orders;
  }

  return result;
}

export async function getServiceOrder(tenantId: string, orderId: string): Promise<ServiceOrder | null> {
  const result = await withDb(async (pool) => {
    const res = await pool.query<ServiceOrderRow>(
      `select id, tenant_id, title, customer, status, requested_by, due_date::text as due_date
       from service_orders
       where tenant_id = $1
         and id = $2
         and deleted_at is null`,
      [tenantId, orderId]
    );
    return res.rows[0] ? mapServiceOrder(res.rows[0]) : null;
  });

  if (result === null) {
    return fixtures.serviceOrders.find((o) => o.tenantId === tenantId && o.id === orderId) ?? null;
  }

  return result;
}

export async function createServiceOrder(
  tenantId: string,
  actorId: string,
  data: { title: string; customer: string; requestedBy: string; dueDate: string }
): Promise<ServiceOrder> {
  const result = await withDb(async (pool) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const orderId = randomUUID();
      const orderRes = await client.query<ServiceOrderRow>(
        `insert into service_orders (
           id, tenant_id, title, customer, status, requested_by, due_date, created_by, updated_by
         ) values (
           $1, $2, $3, $4, 'submitted', $5, $6::date, $7, $7
         )
         returning id, tenant_id, title, customer, status, requested_by, due_date::text as due_date`,
        [orderId, tenantId, data.title, data.customer, data.requestedBy, data.dueDate, actorId]
      );

      const approvalId = randomUUID();
      await client.query(
        `insert into approvals (
           id, tenant_id, entity_type, entity_id, approver_role, status, created_by, updated_by
         ) values (
           $1, $2, 'service_order', $3, 'company_admin', 'pending', $4, $4
         )`,
        [approvalId, tenantId, orderId, actorId]
      );

      await client.query("COMMIT");
      return mapServiceOrder(orderRes.rows[0]);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  });

  if (result === null) {
    const order: ServiceOrder = {
      id: randomUUID(),
      tenantId,
      title: data.title,
      customer: data.customer,
      status: "submitted",
      requestedBy: data.requestedBy,
      dueDate: data.dueDate
    };
    fixtures.serviceOrders.push(order);

    const approval: ApprovalRequest = {
      id: randomUUID(),
      tenantId,
      entityType: "service_order",
      entityId: order.id,
      submittedBy: data.requestedBy,
      approverRole: "company_admin",
      status: "pending"
    };
    fixtures.approvals.push(approval);

    return order;
  }

  return result;
}

export async function updateServiceOrderStatus(
  tenantId: string,
  actorId: string,
  orderId: string,
  status: ServiceOrder["status"]
): Promise<ServiceOrder | null> {
  const result = await withDb(async (pool) => {
    const res = await pool.query<ServiceOrderRow>(
      `update service_orders
       set
         status = $3,
         updated_by = $4,
         updated_at = now()
       where tenant_id = $1
         and id = $2
         and deleted_at is null
       returning id, tenant_id, title, customer, status, requested_by, due_date::text as due_date`,
      [tenantId, orderId, status, actorId]
    );
    return res.rows[0] ? mapServiceOrder(res.rows[0]) : null;
  });

  if (result === null) {
    const idx = fixtures.serviceOrders.findIndex((o) => o.tenantId === tenantId && o.id === orderId);
    if (idx === -1) return null;
    const updated: ServiceOrder = { ...fixtures.serviceOrders[idx], status };
    fixtures.serviceOrders[idx] = updated;
    return updated;
  }

  return result;
}

// ── Approvals ──────────────────────────────────────────────────────────────

export async function listApprovals(
  tenantId: string,
  filters?: { status?: ApprovalRequest["status"]; entityType?: ApprovalRequest["entityType"] }
): Promise<ApprovalRequest[]> {
  const result = await withDb(async (pool) => {
    const params: unknown[] = [tenantId];
    const whereParts = ["a.tenant_id = $1", "a.deleted_at is null"];

    if (filters?.status) {
      params.push(filters.status);
      whereParts.push(`a.status = $${params.length}`);
    }

    if (filters?.entityType) {
      params.push(filters.entityType);
      whereParts.push(`a.entity_type = $${params.length}`);
    }

    const whereClause = whereParts.join(" and ");
    const res = await pool.query<ApprovalRow>(
      `select
         a.id,
         a.tenant_id,
         a.entity_type,
         a.entity_id,
         coalesce(u.full_name, a.created_by::text) as submitted_by,
         a.approver_role,
         a.status
       from approvals a
       left join users u on u.id = a.created_by
       where ${whereClause}
       order by a.created_at desc`,
      params
    );
    return res.rows.map(mapApproval);
  });

  if (result === null) {
    let approvals = fixtures.approvals.filter((a) => a.tenantId === tenantId);
    if (filters?.status) {
      approvals = approvals.filter((a) => a.status === filters.status);
    }
    if (filters?.entityType) {
      approvals = approvals.filter((a) => a.entityType === filters.entityType);
    }
    return approvals;
  }

  return result;
}

export async function processApproval(
  tenantId: string,
  actorId: string,
  approvalId: string,
  status: "approved" | "rejected"
): Promise<ApprovalRequest | null> {
  const result = await withDb(async (pool) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const existing = await client.query<{ id: string; entity_type: string; entity_id: string; status: string }>(
        `select id, entity_type, entity_id, status
         from approvals
         where tenant_id = $1
           and id = $2
           and deleted_at is null`,
        [tenantId, approvalId]
      );

      const approval = existing.rows[0];
      if (!approval) {
        await client.query("ROLLBACK");
        return null;
      }

      const res = await client.query<ApprovalRow>(
        `update approvals
         set
           status = $3,
           updated_by = $4,
           updated_at = now()
         where tenant_id = $1
           and id = $2
         returning
           id,
           tenant_id,
           entity_type,
           entity_id,
           $4::text as submitted_by,
           approver_role,
           status`,
        [tenantId, approvalId, status, actorId]
      );

      if (status === "approved" && approval.entity_type === "service_order") {
        await client.query(
          `update service_orders
           set status = 'approved', updated_by = $3, updated_at = now()
           where tenant_id = $1 and id = $2 and deleted_at is null`,
          [tenantId, approval.entity_id, actorId]
        );
      }

      await client.query("COMMIT");

      const updated = res.rows[0];
      if (!updated) return null;

      const fullRes = await pool.query<ApprovalRow>(
        `select
           a.id,
           a.tenant_id,
           a.entity_type,
           a.entity_id,
           coalesce(u.full_name, a.created_by::text) as submitted_by,
           a.approver_role,
           a.status
         from approvals a
         left join users u on u.id = a.created_by
         where a.tenant_id = $1 and a.id = $2`,
        [tenantId, approvalId]
      );

      return fullRes.rows[0] ? mapApproval(fullRes.rows[0]) : null;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  });

  if (result === null) {
    const idx = fixtures.approvals.findIndex((a) => a.tenantId === tenantId && a.id === approvalId);
    if (idx === -1) return null;

    const updated: ApprovalRequest = { ...fixtures.approvals[idx], status };
    fixtures.approvals[idx] = updated;

    if (status === "approved" && updated.entityType === "service_order") {
      const orderIdx = fixtures.serviceOrders.findIndex(
        (o) => o.tenantId === tenantId && o.id === updated.entityId
      );
      if (orderIdx !== -1) {
        fixtures.serviceOrders[orderIdx] = { ...fixtures.serviceOrders[orderIdx], status: "approved" };
      }
    }

    return updated;
  }

  return result;
}
