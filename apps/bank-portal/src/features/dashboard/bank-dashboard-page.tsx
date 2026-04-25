"use client";

import { useEffect, useState } from "react";
import type { BankPortfolioAnalytics, BankTenantHealth, PortfolioAlert } from "@sqb/domain-types";
import { DataTable, KpiCard, PageHeader, SectionCard, StatusBadge } from "@sqb/ui";

type Envelope<T> = {
  data: T;
  meta: Record<string, unknown> | null;
  error: { message: string; errorCode: string | null } | null;
};

function extractData<T>(payload: unknown): T {
  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    (payload as Envelope<T>).data !== undefined
  ) {
    return (payload as Envelope<T>).data;
  }

  return payload as T;
}

async function readApi<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    cache: "no-store"
  });
  const payload = await response.json();
  if (!response.ok) {
    const maybeEnvelope = payload as Envelope<unknown>;
    const message = maybeEnvelope?.error?.message ?? payload?.message ?? `Request failed: ${response.status}`;
    throw new Error(message);
  }
  return extractData<T>(payload);
}

const toneForAlert = (severity: string) => {
  if (severity === "critical") return "bad" as const;
  if (severity === "warn") return "warn" as const;
  return "neutral" as const;
};

interface CollateralTenantRow {
  tenantId: string;
  tenantName: string;
  totalCollateralUzs: string;
  distinctItems: number;
  distinctWarehouses: number;
}

interface CollateralSummary {
  totalCollateralUzs: string;
  tenantCount: number;
  tenants: CollateralTenantRow[];
}

function formatUzs(v: string) {
  const n = Number(v);
  if (!Number.isFinite(n)) return v;
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)} Bn UZS`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} M UZS`;
  return `${Math.round(n).toLocaleString("en-US")} UZS`;
}

export function BankDashboardPage() {
  const [tenants, setTenants] = useState<BankTenantHealth[]>([]);
  const [alerts, setAlerts] = useState<PortfolioAlert[]>([]);
  const [analytics, setAnalytics] = useState<BankPortfolioAnalytics | null>(null);
  const [collateral, setCollateral] = useState<CollateralSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [portfolio, analyticsPayload, alertsPayload, collateralPayload] = await Promise.all([
          readApi<{ tenants: BankTenantHealth[] }>("/api/bank/portfolio"),
          readApi<{ analytics: BankPortfolioAnalytics }>("/api/bank/portfolio/analytics"),
          readApi<{ alerts: PortfolioAlert[] }>("/api/bank/portfolio/alerts"),
          readApi<{ collateral: CollateralSummary }>("/api/bank/portfolio/collateral").catch(() => ({ collateral: null }))
        ]);

        if (!cancelled) {
          setTenants(portfolio.tenants ?? []);
          setAnalytics(analyticsPayload.analytics ?? null);
          setAlerts(alertsPayload.alerts ?? []);
          setCollateral(collateralPayload?.collateral ?? null);
          setError(null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load bank dashboard.");
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
  }, []);

  const criticalAlerts = alerts.filter((alert) => alert.severity === "critical").length;

  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <PageHeader
        eyebrow="Portfolio"
        title="Cross-tenant health monitoring"
        description="Bank-wide read model: curated KPIs, risk scores, and alert signals aggregated from tenant operational data."
      />
      {error ? (
        <SectionCard title="Data load issue" description={error}>
          <p style={{ margin: 0, color: "#5f7083", fontSize: "0.85rem" }}>Dashboard data may be incomplete until API connectivity is restored.</p>
        </SectionCard>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
        <KpiCard
          label="Active tenants"
          value={String(analytics?.totalTenants ?? tenants.length)}
          helper="Tenants in monitored portfolio"
        />
        <KpiCard
          label="Portfolio avg. credit score"
          value={String(analytics?.averageCreditScore ?? 0)}
          helper="Weighted average across all tenants"
        />
        <KpiCard
          label="High inventory risk"
          value={String(analytics?.highRiskCount ?? 0)}
          helper="Flagged for elevated credit exposure"
        />
        <KpiCard
          label="Critical alerts"
          value={String(criticalAlerts)}
          helper="Require immediate review"
        />
        <KpiCard
          label="SLA health"
          value={`${analytics?.slaHealthPercent ?? 0}%`}
          helper="Pending applications within 24h SLA window"
        />
        <KpiCard
          label="Total collateral value"
          value={collateral ? formatUzs(collateral.totalCollateralUzs) : "—"}
          helper="Sum of on-hand × WAC across all tenants"
        />
      </div>

      {collateral && collateral.tenants.length > 0 ? (
        <SectionCard
          title="Tenant collateral valuation"
          description="Inventory on hand priced at weighted-average cost, aggregated from the ledger."
        >
          <DataTable
            columns={["Tenant", "Collateral value", "Items", "Warehouses"]}
            rows={collateral.tenants
              .slice()
              .sort((a, b) => Number(b.totalCollateralUzs) - Number(a.totalCollateralUzs))
              .map((t) => [
                t.tenantName,
                formatUzs(t.totalCollateralUzs),
                t.distinctItems,
                t.distinctWarehouses
              ])}
          />
        </SectionCard>
      ) : null}

      {alerts.length > 0 && (
        <SectionCard
          title="Active portfolio alerts"
          description="Auto-generated from risk model: score drops, high debt ratios, inventory deterioration, and workflow signals."
        >
          <DataTable
            columns={["Severity", "Tenant", "Type", "Message", "Triggered"]}
            rows={alerts.map((alert) => [
              <StatusBadge tone={toneForAlert(alert.severity)}>{alert.severity.toUpperCase()}</StatusBadge>,
              alert.tenantName,
              alert.type.replace(/_/g, " "),
              alert.message,
              new Date(alert.triggeredAt).toLocaleString()
            ])}
          />
        </SectionCard>
      )}

      <SectionCard
        title="Tenant health snapshot"
        description={loading ? "Loading tenant health snapshot..." : "Health indicators sourced from portfolio projection model."}
      >
        <DataTable
          columns={["Tenant", "Industry", "Region", "Credit score", "Recommendation", "Inventory risk", "Trend"]}
          rows={tenants.map((tenant) => {
            return [
              tenant.tenantName,
              tenant.industry,
              tenant.region,
              tenant.creditScore,
              <StatusBadge tone={tenant.recommendedAction === "approve" ? "good" : tenant.recommendedAction === "review" ? "warn" : "bad"}>
                {tenant.recommendedAction}
              </StatusBadge>,
              <StatusBadge
                tone={
                  tenant.inventoryRisk === "high"
                    ? "bad"
                    : tenant.inventoryRisk === "moderate"
                    ? "warn"
                    : "good"
                }
              >
                {tenant.inventoryRisk}
              </StatusBadge>,
              <StatusBadge
                tone={
                  tenant.healthTrend === "up"
                    ? "good"
                    : tenant.healthTrend === "down"
                    ? "bad"
                    : "neutral"
                }
              >
                {tenant.healthTrend}
              </StatusBadge>
            ];
          })}
        />
      </SectionCard>
    </div>
  );
}
