"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import type { BankTenantHealth } from "@sqb/domain-types";
import { DataTable, PageHeader, SectionCard, StatusBadge } from "@sqb/ui";
import { formatDateTime, readJson } from "@/lib/client-api";

export function TenantsPage() {
  const [tenants, setTenants] = useState<BankTenantHealth[]>([]);
  const [filters, setFilters] = useState({
    q: "",
    region: "",
    inventoryRisk: "",
    trend: "",
    sort: "score_desc"
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const search = new URLSearchParams();
      if (filters.q) search.set("q", filters.q);
      if (filters.region) search.set("region", filters.region);
      if (filters.inventoryRisk) search.set("inventoryRisk", filters.inventoryRisk);
      if (filters.trend) search.set("trend", filters.trend);
      if (filters.sort) search.set("sort", filters.sort);

      try {
        const body = await readJson<{ tenants: BankTenantHealth[] }>(`/api/bank/portfolio?${search.toString()}`);
        if (!cancelled) {
          setTenants(body.tenants);
          setError(null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load tenant portfolio.");
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [filters]);

  const regions = useMemo(
    () => Array.from(new Set(tenants.map((tenant) => tenant.region))).sort((left, right) => left.localeCompare(right)),
    [tenants]
  );

  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <PageHeader
        eyebrow="Tenants"
        title="Tenant registry and portfolio watchlist"
        description="The bank retains centralized monitoring access while projection refresh keeps risk posture isolated from tenant OLTP workflows."
      />
      <SectionCard title="Filters" description="Search and narrow the current bank portfolio read model.">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem" }}>
          <input
            value={filters.q}
            onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))}
            placeholder="Search tenant, industry, recommendation"
            style={inputStyle}
          />
          <select value={filters.region} onChange={(event) => setFilters((current) => ({ ...current, region: event.target.value }))} style={inputStyle}>
            <option value="">All regions</option>
            {regions.map((region) => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
          <select value={filters.inventoryRisk} onChange={(event) => setFilters((current) => ({ ...current, inventoryRisk: event.target.value }))} style={inputStyle}>
            <option value="">All risk levels</option>
            <option value="low">Low risk</option>
            <option value="moderate">Moderate risk</option>
            <option value="high">High risk</option>
          </select>
          <select value={filters.trend} onChange={(event) => setFilters((current) => ({ ...current, trend: event.target.value }))} style={inputStyle}>
            <option value="">All trends</option>
            <option value="up">Up</option>
            <option value="flat">Flat</option>
            <option value="down">Down</option>
          </select>
          <select value={filters.sort} onChange={(event) => setFilters((current) => ({ ...current, sort: event.target.value }))} style={inputStyle}>
            <option value="score_desc">Highest score first</option>
            <option value="score_asc">Lowest score first</option>
            <option value="tenant">Tenant name</option>
          </select>
        </div>
      </SectionCard>
      <SectionCard title="Tenant registry view" description={error ?? "Projection-backed tenant health with risk recommendation and refresh timestamp."}>
        <DataTable
          columns={["Tenant", "Region", "Score", "Inventory risk", "Recommendation", "Refreshed"]}
          rows={tenants.map((tenant) => [
            tenant.tenantName,
            tenant.region,
            tenant.creditScore,
            <StatusBadge tone={tenant.inventoryRisk === "high" ? "bad" : tenant.inventoryRisk === "moderate" ? "warn" : "good"}>{tenant.inventoryRisk}</StatusBadge>,
            <StatusBadge tone={tenant.recommendedAction === "approve" ? "good" : tenant.recommendedAction === "review" ? "warn" : "bad"}>{tenant.recommendedAction}</StatusBadge>,
            formatDateTime(tenant.refreshedAt)
          ])}
        />
      </SectionCard>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  border: "1px solid #d4dce6",
  borderRadius: "0.875rem",
  padding: "0.75rem 0.9rem",
  background: "#fff"
} satisfies CSSProperties;
