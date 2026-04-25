"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  CreditApplicationDetail,
  CreditApplicationStatus,
  CreditDecisionRequest,
  CreditQueueItem
} from "@sqb/domain-types";
import { Button, DataTable, PageHeader, SectionCard, StatusBadge } from "@sqb/ui";

type DecisionType = CreditDecisionRequest["decision"];

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

async function readApi<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    cache: "no-store",
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  const payload = await response.json();
  if (!response.ok) {
    const maybeEnvelope = payload as Envelope<unknown>;
    const message = maybeEnvelope?.error?.message ?? payload?.message ?? `Request failed: ${response.status}`;
    throw new Error(message);
  }

  return extractData<T>(payload);
}

const statusTone = (status: CreditApplicationStatus) => {
  if (status === "approved") return "good" as const;
  if (status === "declined") return "bad" as const;
  if (status === "counter_offered") return "warn" as const;
  if (status === "in_review") return "warn" as const;
  if (status === "submitted") return "neutral" as const;
  return "neutral" as const;
};

const recommendationTone = (value: CreditQueueItem["aiRecommendation"]) => {
  if (value === "approve") return "good" as const;
  if (value === "review") return "warn" as const;
  return "bad" as const;
};

function DecisionModal({
  applicationId,
  product,
  requestedAmount,
  requestedTermMonths,
  onDecide,
  onClose
}: {
  applicationId: string;
  product: string;
  requestedAmount: string;
  requestedTermMonths: number;
  onDecide: (payload: CreditDecisionRequest) => void;
  onClose: () => void;
}) {
  const [decision, setDecision] = useState<DecisionType>("approve");
  const [notes, setNotes] = useState("");
  const [approvedAmount, setApprovedAmount] = useState("");
  const [approvedTermMonths, setApprovedTermMonths] = useState("");
  const [approvedRatePercent, setApprovedRatePercent] = useState("");

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(16,36,61,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "1.25rem",
          padding: "2rem",
          width: "100%",
          maxWidth: "480px",
          boxShadow: "0 24px 64px rgba(16,36,61,0.15)"
        }}
      >
        <h2 style={{ margin: "0 0 0.5rem", color: "#10243d", fontSize: "1.2rem" }}>Record credit decision</h2>
        <p style={{ margin: "0 0 1.5rem", color: "#5f7083", fontSize: "0.9rem" }}>
          {applicationId} · {product} · {requestedAmount} UZS · {requestedTermMonths} months
        </p>

        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", color: "#5f7083", fontSize: "0.82rem", marginBottom: "0.4rem" }}>
            Decision
          </label>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {(["approve", "counter_offer", "decline"] as DecisionType[]).map((d) => (
              <button
                key={d}
                onClick={() => setDecision(d)}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "0.75rem",
                  border: "1px solid",
                  borderColor: decision === d ? "#0d3b66" : "#dfe7f0",
                  background: decision === d ? "#0d3b66" : "#fff",
                  color: decision === d ? "#fff" : "#10243d",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  textTransform: "capitalize"
                }}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {(decision === "approve" || decision === "counter_offer") && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
            <div>
              <label style={{ display: "block", color: "#5f7083", fontSize: "0.78rem", marginBottom: "0.3rem" }}>
                Approved amount
              </label>
              <input
                value={approvedAmount}
                onChange={(event) => setApprovedAmount(event.target.value)}
                placeholder="500000000"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: "block", color: "#5f7083", fontSize: "0.78rem", marginBottom: "0.3rem" }}>
                Term (months)
              </label>
              <input
                value={approvedTermMonths}
                onChange={(event) => setApprovedTermMonths(event.target.value)}
                placeholder="24"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: "block", color: "#5f7083", fontSize: "0.78rem", marginBottom: "0.3rem" }}>
                Rate (%)
              </label>
              <input
                value={approvedRatePercent}
                onChange={(event) => setApprovedRatePercent(event.target.value)}
                placeholder="16.20"
                style={inputStyle}
              />
            </div>
          </div>
        )}

        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", color: "#5f7083", fontSize: "0.82rem", marginBottom: "0.4rem" }}>
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Provide context for the decision..."
            rows={4}
            style={{
              width: "100%",
              padding: "0.75rem",
              borderRadius: "0.75rem",
              border: "1px solid #dfe7f0",
              fontSize: "0.9rem",
              resize: "vertical",
              boxSizing: "border-box"
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              onDecide({
                decision,
                notes: notes.trim() || undefined,
                approvedAmount: approvedAmount.trim() || undefined,
                approvedTermMonths: approvedTermMonths.trim() ? Number(approvedTermMonths) : undefined,
                approvedRatePercent: approvedRatePercent.trim() || undefined
              });
            }}
          >
            Confirm {decision}
          </Button>
        </div>
      </div>
    </div>
  );
}

function RiskFactorBar({
  label,
  impact,
  value
}: {
  label: string;
  impact: number;
  value: string;
}) {
  return (
    <div style={{ marginBottom: "0.6rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.2rem" }}>
        <span style={{ fontSize: "0.8rem", color: "#5f7083" }}>{label}</span>
        <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#10243d" }}>
          {value} ({impact >= 0 ? `+${impact}` : impact})
        </span>
      </div>
      <div style={{ height: "6px", background: "#edf2f7", borderRadius: "999px" }}>
        <div
          style={{
            height: "100%",
            width: `${Math.max(0, Math.min(100, 50 + impact * 2))}%`,
            borderRadius: "999px",
            background: impact >= 0 ? "#22c55e" : impact >= -10 ? "#f59e0b" : "#ef4444",
            transition: "width 0.4s ease"
          }}
        />
      </div>
    </div>
  );
}

export function CreditQueuePage() {
  const [applications, setApplications] = useState<CreditQueueItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<CreditApplicationDetail | null>(null);
  const [decisionTarget, setDecisionTarget] = useState<CreditQueueItem | null>(null);
  const [activeTab, setActiveTab] = useState<"queue" | "all">("queue");
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadQueue() {
    setLoading(true);
    try {
      const payload = await readApi<{ applications: CreditQueueItem[] }>("/api/bank/credit-queue");
      setApplications(payload.applications ?? []);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load credit queue.");
    } finally {
      setLoading(false);
    }
  }

  async function loadDetail(id: string) {
    setDetailLoading(true);
    try {
      const payload = await readApi<{ application: CreditApplicationDetail }>(`/api/bank/credit-queue/${id}`);
      setSelectedDetail(payload.application ?? null);
      setError(null);
    } catch (loadError) {
      setSelectedDetail(null);
      setError(loadError instanceof Error ? loadError.message : "Failed to load application detail.");
    } finally {
      setDetailLoading(false);
    }
  }

  useEffect(() => {
    void loadQueue();
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setSelectedDetail(null);
      return;
    }

    void loadDetail(selectedId);
  }, [selectedId]);

  const queue = useMemo(
    () => applications.filter((application) => application.status === "submitted" || application.status === "in_review"),
    [applications]
  );
  const displayed = activeTab === "queue" ? queue : applications;

  async function handleDecide(payload: CreditDecisionRequest) {
    if (!decisionTarget) return;

    try {
      await readApi<{ application: CreditApplicationDetail }>(
        `/api/bank/credit-queue/${decisionTarget.id}/decision`,
        {
          method: "POST",
          body: JSON.stringify(payload)
        }
      );
      setDecisionTarget(null);
      await loadQueue();
      if (selectedId === decisionTarget.id) {
        await loadDetail(decisionTarget.id);
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to submit credit decision.");
    }
  }

  const canDecide = (application: CreditQueueItem) =>
    application.status === "submitted" || application.status === "in_review";

  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      {decisionTarget && (
        <DecisionModal
          applicationId={decisionTarget.id}
          product={decisionTarget.product}
          requestedAmount={decisionTarget.requestedAmount}
          requestedTermMonths={decisionTarget.requestedTermMonths}
          onDecide={handleDecide}
          onClose={() => setDecisionTarget(null)}
        />
      )}

      <PageHeader
        eyebrow="Credit queue"
        title="Loan application review"
        description="Bank officer queue: review submitted applications, inspect score factors and financial data, then record a credit decision."
        actions={
          <a
            href="/app/credit/apply"
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "0.75rem 1.25rem",
              borderRadius: "0.875rem",
              background: "#0d3b66",
              color: "#fff",
              fontWeight: 600,
              textDecoration: "none",
              fontSize: "0.9rem"
            }}
          >
            + New application
          </a>
        }
      />
      {error ? (
        <SectionCard title="Data load issue" description={error}>
          <Button variant="secondary" onClick={() => void loadQueue()}>Retry</Button>
        </SectionCard>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: selectedId ? "1fr 420px" : "1fr", gap: "1.5rem" }}>
        {/* ── Application list ─────────────────────────────────────── */}
        <div>
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
            {(["queue", "all"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: "0.45rem 1rem",
                  borderRadius: "0.75rem",
                  border: "1px solid",
                  borderColor: activeTab === tab ? "#0d3b66" : "#dfe7f0",
                  background: activeTab === tab ? "#0d3b66" : "#fff",
                  color: activeTab === tab ? "#fff" : "#5f7083",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: "0.82rem"
                }}
              >
                {tab === "queue" ? `Pending review (${queue.length})` : `All applications (${applications.length})`}
              </button>
            ))}
          </div>

          <SectionCard
            title={activeTab === "queue" ? "Awaiting review" : "All loan applications"}
            description={loading ? "Loading queue..." : "Click a row to inspect full application details and decision history."}
          >
            <DataTable
              columns={["Tenant", "Loan amount", "Purpose", "AI recommendation", "Status", "Submitted", "Actions"]}
              rows={displayed.map((app) => {
                const isActive = selectedId === app.id;
                return [
                  <button
                    key={`tenant-${app.id}`}
                    onClick={() => setSelectedId(isActive ? null : app.id)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontWeight: 600,
                      color: isActive ? "#0d3b66" : "#10243d",
                      textAlign: "left",
                      padding: 0,
                      textDecoration: isActive ? "underline" : "none"
                    }}
                  >
                    {app.tenantName}
                  </button>,
                  `${Math.round(Number(app.requestedAmount) / 1_000_000)}M UZS`,
                  app.purpose,
                  <StatusBadge key={`ai-${app.id}`} tone={recommendationTone(app.aiRecommendation)}>
                    {app.aiRecommendation}
                  </StatusBadge>,
                  <StatusBadge tone={statusTone(app.status)}>{app.status.replace("_", " ")}</StatusBadge>,
                  app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : "Draft",
                  canDecide(app) ? (
                    <button
                      onClick={() => setDecisionTarget(app)}
                      style={{
                        padding: "0.35rem 0.75rem",
                        borderRadius: "0.625rem",
                        border: "1px solid #0d3b66",
                        background: "#fff",
                        color: "#0d3b66",
                        fontWeight: 600,
                        cursor: "pointer",
                        fontSize: "0.8rem"
                      }}
                    >
                      Decide
                    </button>
                  ) : (
                    <span style={{ color: "#a0aec0", fontSize: "0.8rem" }}>—</span>
                  )
                ];
              })}
            />
          </SectionCard>
        </div>

        {/* ── Application detail panel ──────────────────────────────── */}
        {selectedId && (
          <div style={{ display: "grid", gap: "1rem", alignContent: "start" }}>
            <SectionCard
              title={selectedDetail?.tenantName ?? "Application detail"}
              description={
                selectedDetail
                  ? `ID: ${selectedDetail.id} · Status: ${selectedDetail.status.replace("_", " ")}`
                  : detailLoading
                    ? "Loading detail..."
                    : "Application detail unavailable"
              }
            >
              {selectedDetail ? (
                <div style={{ display: "grid", gap: "0.5rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem" }}>
                    <div><span style={{ color: "#5f7083", fontSize: "0.8rem" }}>Industry</span><br />{selectedDetail.industry}</div>
                    <div><span style={{ color: "#5f7083", fontSize: "0.8rem" }}>Region</span><br />{selectedDetail.region}</div>
                    <div><span style={{ color: "#5f7083", fontSize: "0.8rem" }}>Product</span><br />{selectedDetail.product}</div>
                    <div><span style={{ color: "#5f7083", fontSize: "0.8rem" }}>Term</span><br />{selectedDetail.requestedTermMonths} months</div>
                  </div>
                  <div style={{ marginTop: "0.75rem", borderTop: "1px solid #edf2f7", paddingTop: "0.75rem" }}>
                    <div style={{ color: "#5f7083", fontSize: "0.8rem", marginBottom: "0.3rem" }}>Loan request (requested)</div>
                    <div style={{ fontWeight: 700, fontSize: "1.2rem", color: "#10243d" }}>
                      {Number(selectedDetail.requestedAmount).toLocaleString()} UZS
                    </div>
                    <div style={{ color: "#5f7083", fontSize: "0.85rem", marginTop: "0.2rem" }}>
                      {selectedDetail.requestedTermMonths} months · {selectedDetail.purpose}
                    </div>
                  </div>
                  {selectedDetail.financialSummary ? (
                    <div style={{ marginTop: "0.75rem", borderTop: "1px solid #edf2f7", paddingTop: "0.75rem" }}>
                      <div style={{ color: "#5f7083", fontSize: "0.8rem", marginBottom: "0.5rem" }}>Financial snapshot</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem", fontSize: "0.85rem" }}>
                        <div><span style={{ color: "#5f7083" }}>Cash balance</span><br />{selectedDetail.financialSummary.cashBalance}</div>
                        <div><span style={{ color: "#5f7083" }}>AR overdue</span><br />{selectedDetail.financialSummary.arOverdue}</div>
                        <div><span style={{ color: "#5f7083" }}>AR outstanding</span><br />{selectedDetail.financialSummary.arOutstanding}</div>
                        <div><span style={{ color: "#5f7083" }}>Net cash flow</span><br />{selectedDetail.financialSummary.monthlyNetCashFlow}</div>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <p style={{ margin: 0, color: "#5f7083", fontSize: "0.85rem" }}>Detail not available.</p>
              )}
            </SectionCard>

            {selectedDetail?.scoreFactors?.length ? (
              <SectionCard title={`Risk score snapshot: ${selectedDetail.scoreSnapshot}`} description="Score factors from projection model.">
                {selectedDetail.scoreFactors.map((factor) => (
                  <RiskFactorBar key={factor.key} label={factor.label} impact={factor.impact} value={factor.value} />
                ))}
              </SectionCard>
            ) : null}

            {selectedDetail?.documents?.length ? (
              <SectionCard title="Documents" description="Submitted and auto-pulled documents for this application.">
                <DataTable
                  columns={["Name", "Status", "Source"]}
                  rows={selectedDetail.documents.map((document) => [
                    document.name,
                    document.status,
                    document.sourceType
                  ])}
                />
              </SectionCard>
            ) : null}

            {selectedDetail?.decisions?.length ? (
              <SectionCard title="Decision history" description="All decisions recorded for this application.">
                {selectedDetail.decisions.map((decision) => (
                  <div
                    key={decision.id}
                    style={{
                      padding: "0.75rem",
                      border: "1px solid #edf2f7",
                      borderRadius: "0.75rem",
                      marginBottom: "0.5rem"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                      <StatusBadge tone={decision.decision === "approve" ? "good" : decision.decision === "counter_offer" ? "warn" : "bad"}>
                        {decision.decision}
                      </StatusBadge>
                      <span style={{ color: "#5f7083", fontSize: "0.8rem" }}>
                        {new Date(decision.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p style={{ margin: 0, color: "#5f7083", fontSize: "0.85rem" }}>
                      {decision.notes ?? "No notes provided."}
                    </p>
                  </div>
                ))}
              </SectionCard>
            ) : null}

            {selectedDetail && canDecide(selectedDetail) ? (
              <Button variant="primary" onClick={() => setDecisionTarget(selectedDetail)}>
                Record decision
              </Button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "0.55rem 0.65rem",
  borderRadius: "0.75rem",
  border: "1px solid #dfe7f0",
  fontSize: "0.85rem",
  color: "#10243d"
};
