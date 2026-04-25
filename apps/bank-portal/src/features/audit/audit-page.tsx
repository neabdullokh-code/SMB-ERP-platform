"use client";

import { useEffect, useState } from "react";
import type { AuditEvent } from "@sqb/domain-types";
import { DataTable, PageHeader, SectionCard, StatusBadge } from "@sqb/ui";

const CATEGORIES = [
  "all",
  "credit.application",
  "credit.decision",
  "credit.document",
  "credit.risk",
  "bank_monitoring",
  "auth",
  "terms",
  "settings"
];
type Envelope<T> = {
  data: T;
  meta: {
    page?: number;
    pageSize?: number;
    total?: number;
  } | null;
  error: { message: string; errorCode: string | null } | null;
};

function extractData<T>(payload: unknown): Envelope<T> {
  if (payload && typeof payload === "object" && "data" in payload) {
    return payload as Envelope<T>;
  }

  return {
    data: payload as T,
    meta: null,
    error: null
  };
}

const categoryTone = (category: string) => {
  if (category.startsWith("credit.decision")) return "warn" as const;
  if (category.startsWith("credit")) return "neutral" as const;
  if (category.startsWith("auth")) return "bad" as const;
  if (category === "bank_monitoring") return "good" as const;
  return "neutral" as const;
};

export function AuditPage() {
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [actorFilter, setActorFilter] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const search = new URLSearchParams();
        if (categoryFilter !== "all") {
          search.set("category", categoryFilter);
        }
        search.set("page", String(page));
        search.set("pageSize", String(pageSize));

        const response = await fetch(`/api/audit/events?${search.toString()}`, {
          cache: "no-store"
        });
        const payload = await response.json();
        if (!response.ok) {
          const message = payload?.error?.message ?? payload?.message ?? `Request failed: ${response.status}`;
          throw new Error(message);
        }

        const envelope = extractData<AuditEvent[]>(payload);
        if (!cancelled) {
          const serverEvents = envelope.data ?? [];
          const filtered = actorFilter
            ? serverEvents.filter(
                (event) =>
                  event.actorUserId.toLowerCase().includes(actorFilter.toLowerCase()) ||
                  event.actorRole.toLowerCase().includes(actorFilter.toLowerCase())
              )
            : serverEvents;

          setEvents(filtered.sort((left, right) => right.occurredAt.localeCompare(left.occurredAt)));
          setTotal(envelope.meta?.total ?? filtered.length);
          setError(null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load audit events.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [actorFilter, categoryFilter, page]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <PageHeader
        eyebrow="Audit"
        title="Immutable activity trail"
        description="Append-only audit log covering credit operations, authentication events, bank monitoring access, and platform configuration changes."
      />
      {error ? (
        <SectionCard title="Data load issue" description={error}>
          <p style={{ margin: 0, color: "#5f7083", fontSize: "0.85rem" }}>
            Audit feed is temporarily unavailable.
          </p>
        </SectionCard>
      ) : null}

      <SectionCard title="Filter events" description="Narrow by category or actor to trace specific workflows.">
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.78rem", color: "#5f7083", marginBottom: "0.3rem" }}>
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              style={{
                padding: "0.5rem 0.75rem",
                borderRadius: "0.625rem",
                border: "1px solid #dfe7f0",
                fontSize: "0.85rem",
                color: "#10243d",
                background: "#fff"
              }}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c === "all" ? "All categories" : c}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.78rem", color: "#5f7083", marginBottom: "0.3rem" }}>
              Actor
            </label>
            <input
              type="text"
              value={actorFilter}
              onChange={(e) => { setActorFilter(e.target.value); setPage(1); }}
              placeholder="Filter by actor ID or role..."
              style={{
                padding: "0.5rem 0.75rem",
                borderRadius: "0.625rem",
                border: "1px solid #dfe7f0",
                fontSize: "0.85rem",
                color: "#10243d",
                minWidth: "220px"
              }}
            />
          </div>

          <div style={{ alignSelf: "flex-end" }}>
            <span style={{ color: "#5f7083", fontSize: "0.85rem" }}>
              {loading ? "Loading..." : `${total} event${total !== 1 ? "s" : ""} found`}
            </span>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Audit events"
        description="Events are immutable and append-only. Actor, resource, and timestamp are required for every entry."
      >
        <DataTable
          columns={["When", "Actor", "Role", "Category", "Action", "Resource", "Tenant"]}
          rows={events.map((event: AuditEvent) => [
            new Date(event.occurredAt).toLocaleString(),
            event.actorUserId,
            event.actorRole,
            <StatusBadge tone={categoryTone(event.category)}>{event.category}</StatusBadge>,
            event.action,
            `${event.resourceType}:${event.resourceId}`,
            event.tenantId
              ? <StatusBadge tone="neutral">{event.tenantId}</StatusBadge>
              : <StatusBadge tone="good">Bank-level</StatusBadge>
          ])}
        />

        {totalPages > 1 && (
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "1rem", alignItems: "center" }}>
            <span style={{ fontSize: "0.82rem", color: "#5f7083" }}>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                padding: "0.35rem 0.75rem",
                borderRadius: "0.625rem",
                border: "1px solid #dfe7f0",
                background: "#fff",
                cursor: page === 1 ? "not-allowed" : "pointer",
                color: page === 1 ? "#a0aec0" : "#10243d",
                fontSize: "0.82rem"
              }}
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{
                padding: "0.35rem 0.75rem",
                borderRadius: "0.625rem",
                border: "1px solid #dfe7f0",
                background: "#fff",
                cursor: page === totalPages ? "not-allowed" : "pointer",
                color: page === totalPages ? "#a0aec0" : "#10243d",
                fontSize: "0.82rem"
              }}
            >
              Next
            </button>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
