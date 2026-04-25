import { cookies } from "next/headers";
import type { ApprovalRequest, ServiceOrder } from "@sqb/domain-types";
import { DataTable, KpiCard, PageHeader, SectionCard, StatusBadge } from "@sqb/ui";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function fetchServiceOrders(): Promise<ServiceOrder[]> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("erp_auth_session")?.value;
    if (!sessionToken) return [];
    const res = await fetch(`${API_BASE}/service-orders`, {
      headers: { "x-session-token": sessionToken },
      cache: "no-store"
    });
    if (!res.ok) return [];
    const body = await res.json() as { data: ServiceOrder[] };
    return body.data ?? [];
  } catch {
    return [];
  }
}

async function fetchPendingApprovals(): Promise<ApprovalRequest[]> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("erp_auth_session")?.value;
    if (!sessionToken) return [];
    const res = await fetch(`${API_BASE}/workflows/pending`, {
      headers: { "x-session-token": sessionToken },
      cache: "no-store"
    });
    if (!res.ok) return [];
    const body = await res.json() as { data: ApprovalRequest[] };
    return body.data ?? [];
  } catch {
    return [];
  }
}

function orderTone(status: ServiceOrder["status"]): "good" | "bad" | "warn" | "neutral" {
  if (status === "completed") return "good";
  if (status === "rejected") return "bad";
  if (status === "approved") return "good";
  if (status === "in_progress") return "warn";
  return "neutral";
}

export async function ServiceOrdersPage() {
  const [serviceOrders, approvals] = await Promise.all([
    fetchServiceOrders(),
    fetchPendingApprovals()
  ]);

  const submitted = serviceOrders.filter((o) => o.status === "submitted").length;
  const approved = serviceOrders.filter((o) => o.status === "approved").length;
  const inProgress = serviceOrders.filter((o) => o.status === "in_progress").length;
  const completed = serviceOrders.filter((o) => o.status === "completed").length;

  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <PageHeader
        eyebrow="Service orders"
        title="Requests, approvals, and fulfillment"
        description="Approval workflow state is separated from the service order record so routing, rejection, and escalation rules stay explicit."
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem" }}>
        <KpiCard label="Submitted" value={String(submitted)} helper="Awaiting approval" />
        <KpiCard label="Approved" value={String(approved)} helper="Ready to start" />
        <KpiCard label="In progress" value={String(inProgress)} helper="Active" />
        <KpiCard label="Completed" value={String(completed)} helper="Fulfilled" />
      </div>

      <SectionCard
        title="Service order board"
        description="Customer, internal, or field-service work on a common workflow engine."
      >
        {serviceOrders.length === 0 ? (
          <p style={{ color: "var(--muted)", fontSize: 13 }}>No service orders found.</p>
        ) : (
          <DataTable
            columns={["Order", "Title", "Customer", "Requested by", "Due date", "Status"]}
            rows={serviceOrders.map((order) => [
              order.id.slice(0, 8),
              order.title,
              order.customer,
              order.requestedBy,
              order.dueDate,
              <StatusBadge tone={orderTone(order.status)}>{order.status.replace("_", " ")}</StatusBadge>
            ])}
          />
        )}
      </SectionCard>

      <SectionCard title="Pending approvals" description="Workflow approvals are modeled as first-class entities.">
        {approvals.length === 0 ? (
          <p style={{ color: "var(--muted)", fontSize: 13 }}>No pending approvals.</p>
        ) : (
          <DataTable
            columns={["Approval", "Entity type", "Entity", "Approver role", "Status"]}
            rows={approvals.map((approval) => [
              approval.id.slice(0, 8),
              approval.entityType.replace("_", " "),
              approval.entityId.slice(0, 8),
              approval.approverRole,
              <StatusBadge tone="warn">{approval.status}</StatusBadge>
            ])}
          />
        )}
      </SectionCard>
    </div>
  );
}
