"use client";

import { useState } from "react";
import type {
  LoanApplication,
  LoanApplicationStep1,
  LoanApplicationStep2,
  LoanApplicationStep3
} from "@sqb/domain-types";
import { PageHeader, SectionCard } from "@sqb/ui";

type Step = 1 | 2 | 3 | 4 | 5;
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

async function uploadDocument(applicationId: string, file: File): Promise<void> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`/api/credit/applications/${applicationId}/documents`, {
    method: "POST",
    body: formData,
    cache: "no-store"
  });
  const payload = await response.json();
  if (!response.ok) {
    const maybeEnvelope = payload as Envelope<unknown>;
    const message = maybeEnvelope?.error?.message ?? payload?.message ?? `Document upload failed: ${response.status}`;
    throw new Error(message);
  }
}

const STEPS = [
  { step: 1 as Step, label: "Business info" },
  { step: 2 as Step, label: "Loan details" },
  { step: 3 as Step, label: "Financials" },
  { step: 4 as Step, label: "Documents" },
  { step: 5 as Step, label: "Review" }
];

const inputStyle = {
  width: "100%",
  padding: "0.65rem 0.85rem",
  borderRadius: "0.75rem",
  border: "1px solid #dfe7f0",
  fontSize: "0.9rem",
  color: "#10243d",
  boxSizing: "border-box" as const
};

const labelStyle = {
  display: "block" as const,
  fontSize: "0.82rem",
  color: "#5f7083",
  marginBottom: "0.35rem",
  fontWeight: 600 as const
};

const fieldStyle = { marginBottom: "1rem" };

function StepIndicator({ current }: { current: Step }) {
  return (
    <div style={{ display: "flex", gap: "0", marginBottom: "2rem" }}>
      {STEPS.map(({ step, label }, i) => {
        const done = step < current;
        const active = step === current;
        return (
          <div key={step} style={{ display: "flex", alignItems: "center", flex: 1 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  background: done ? "#22c55e" : active ? "#0d3b66" : "#e9eef4",
                  color: done || active ? "#fff" : "#a0aec0",
                  border: active ? "3px solid #0d3b66" : "none",
                  flexShrink: 0
                }}
              >
                {done ? "✓" : step}
              </div>
              <span
                style={{
                  fontSize: "0.72rem",
                  color: active ? "#0d3b66" : done ? "#22c55e" : "#a0aec0",
                  fontWeight: active ? 700 : 500,
                  marginTop: "0.25rem",
                  textAlign: "center"
                }}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                style={{
                  height: "2px",
                  flex: 0,
                  width: "2rem",
                  background: done ? "#22c55e" : "#e9eef4",
                  alignSelf: "flex-start",
                  marginTop: "15px"
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Step1Form({
  value,
  onChange
}: {
  value: Partial<LoanApplicationStep1>;
  onChange: (v: Partial<LoanApplicationStep1>) => void;
}) {
  return (
    <div>
      <div style={fieldStyle}>
        <label style={labelStyle}>Business name *</label>
        <input
          style={inputStyle}
          value={value.businessName ?? ""}
          onChange={(e) => onChange({ ...value, businessName: e.target.value })}
          placeholder="Kamolot Savdo LLC"
        />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div style={fieldStyle}>
          <label style={labelStyle}>Industry *</label>
          <select
            style={{ ...inputStyle, background: "#fff" }}
            value={value.industry ?? ""}
            onChange={(e) => onChange({ ...value, industry: e.target.value })}
          >
            <option value="">Select industry</option>
            <option value="Wholesale">Wholesale</option>
            <option value="Retail">Retail</option>
            <option value="Textiles">Textiles</option>
            <option value="Food & Beverage">Food & Beverage</option>
            <option value="Manufacturing">Manufacturing</option>
            <option value="Construction">Construction</option>
            <option value="IT Services">IT Services</option>
            <option value="Agriculture">Agriculture</option>
          </select>
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Region *</label>
          <select
            style={{ ...inputStyle, background: "#fff" }}
            value={value.region ?? ""}
            onChange={(e) => onChange({ ...value, region: e.target.value })}
          >
            <option value="">Select region</option>
            <option value="Tashkent">Tashkent</option>
            <option value="Namangan">Namangan</option>
            <option value="Samarkand">Samarkand</option>
            <option value="Andijan">Andijan</option>
            <option value="Fergana">Fergana</option>
            <option value="Bukhara">Bukhara</option>
          </select>
        </div>
      </div>
      <div style={fieldStyle}>
        <label style={labelStyle}>Tax identification number (TIN) *</label>
        <input
          style={inputStyle}
          value={value.tin ?? ""}
          onChange={(e) => onChange({ ...value, tin: e.target.value })}
          placeholder="9-digit TIN"
          maxLength={9}
        />
      </div>
    </div>
  );
}

function Step2Form({
  value,
  onChange
}: {
  value: Partial<LoanApplicationStep2>;
  onChange: (v: Partial<LoanApplicationStep2>) => void;
}) {
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem" }}>
        <div style={fieldStyle}>
          <label style={labelStyle}>Loan amount *</label>
          <input
            style={inputStyle}
            type="number"
            value={value.loanAmount ?? ""}
            onChange={(e) => onChange({ ...value, loanAmount: Number(e.target.value) })}
            placeholder="500000000"
            min={1000000}
          />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Currency *</label>
          <select
            style={{ ...inputStyle, background: "#fff" }}
            value={value.currency ?? "UZS"}
            onChange={(e) => onChange({ ...value, currency: e.target.value as "UZS" | "USD" })}
          >
            <option value="UZS">UZS</option>
            <option value="USD">USD</option>
          </select>
        </div>
      </div>
      <div style={fieldStyle}>
        <label style={labelStyle}>Term (months) *</label>
        <select
          style={{ ...inputStyle, background: "#fff" }}
          value={value.termMonths ?? ""}
          onChange={(e) => onChange({ ...value, termMonths: Number(e.target.value) })}
        >
          <option value="">Select term</option>
          {[6, 12, 18, 24, 36, 48, 60].map((m) => (
            <option key={m} value={m}>{m} months</option>
          ))}
        </select>
      </div>
      <div style={fieldStyle}>
        <label style={labelStyle}>Loan purpose *</label>
        <textarea
          style={{ ...inputStyle, resize: "vertical" }}
          rows={3}
          value={value.purpose ?? ""}
          onChange={(e) => onChange({ ...value, purpose: e.target.value })}
          placeholder="Describe how the loan will be used..."
        />
      </div>
    </div>
  );
}

function Step3Form({
  value,
  onChange
}: {
  value: Partial<LoanApplicationStep3>;
  onChange: (v: Partial<LoanApplicationStep3>) => void;
}) {
  const debtRatio =
    value.totalAssets && value.totalLiabilities
      ? ((value.totalLiabilities / value.totalAssets) * 100).toFixed(1)
      : null;

  return (
    <div>
      <p style={{ color: "#5f7083", fontSize: "0.85rem", marginBottom: "1rem" }}>
        All figures in selected currency for the most recent completed financial year.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div style={fieldStyle}>
          <label style={labelStyle}>Annual revenue *</label>
          <input
            style={inputStyle}
            type="number"
            value={value.annualRevenue ?? ""}
            onChange={(e) => onChange({ ...value, annualRevenue: Number(e.target.value) })}
            placeholder="e.g. 3200000000"
          />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Annual expenses *</label>
          <input
            style={inputStyle}
            type="number"
            value={value.annualExpenses ?? ""}
            onChange={(e) => onChange({ ...value, annualExpenses: Number(e.target.value) })}
            placeholder="e.g. 2600000000"
          />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Total assets *</label>
          <input
            style={inputStyle}
            type="number"
            value={value.totalAssets ?? ""}
            onChange={(e) => onChange({ ...value, totalAssets: Number(e.target.value) })}
            placeholder="e.g. 1800000000"
          />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Total liabilities *</label>
          <input
            style={inputStyle}
            type="number"
            value={value.totalLiabilities ?? ""}
            onChange={(e) => onChange({ ...value, totalLiabilities: Number(e.target.value) })}
            placeholder="e.g. 420000000"
          />
        </div>
      </div>
      {debtRatio !== null && (
        <div
          style={{
            padding: "0.75rem 1rem",
            borderRadius: "0.75rem",
            background: Number(debtRatio) > 60 ? "#fde0df" : Number(debtRatio) > 40 ? "#fff3d6" : "#d9f4e5",
            marginTop: "0.5rem"
          }}
        >
          <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>
            Debt-to-asset ratio: {debtRatio}%
          </span>
          <span style={{ color: "#5f7083", fontSize: "0.82rem", marginLeft: "0.5rem" }}>
            {Number(debtRatio) > 60 ? "High — may require additional review" : Number(debtRatio) > 40 ? "Moderate" : "Healthy"}
          </span>
        </div>
      )}
    </div>
  );
}

function Step4Form({
  files,
  onFiles
}: {
  files: File[];
  onFiles: (files: File[]) => void;
}) {
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    onFiles([...files, ...Array.from(e.dataTransfer.files)]);
  };

  return (
    <div>
      <p style={{ color: "#5f7083", fontSize: "0.85rem", marginBottom: "1.25rem" }}>
        Upload supporting documents: financial statements, bank statements, tax certificates, business registration.
      </p>

      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        style={{
          border: "2px dashed #dfe7f0",
          borderRadius: "1rem",
          padding: "2.5rem",
          textAlign: "center",
          background: "#f9fbfd",
          cursor: "pointer",
          marginBottom: "1rem"
        }}
      >
        <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📎</div>
        <p style={{ margin: 0, color: "#5f7083", fontSize: "0.9rem" }}>
          Drag & drop files here, or{" "}
          <label style={{ color: "#0d3b66", fontWeight: 600, cursor: "pointer" }}>
            browse
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png"
              style={{ display: "none" }}
              onChange={(e) => onFiles([...files, ...Array.from(e.target.files ?? [])])}
            />
          </label>
        </p>
        <p style={{ margin: "0.4rem 0 0", color: "#a0aec0", fontSize: "0.78rem" }}>
          PDF, Word, Excel, or images · Max 20MB per file
        </p>
      </div>

      {files.length > 0 && (
        <div style={{ display: "grid", gap: "0.5rem" }}>
          {files.map((file, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.65rem 0.85rem",
                borderRadius: "0.75rem",
                border: "1px solid #dfe7f0",
                background: "#fff"
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "#10243d" }}>{file.name}</div>
                <div style={{ color: "#a0aec0", fontSize: "0.75rem" }}>
                  {(file.size / 1024).toFixed(1)} KB
                </div>
              </div>
              <button
                onClick={() => onFiles(files.filter((_, j) => j !== i))}
                style={{ background: "none", border: "none", color: "#a0aec0", cursor: "pointer", fontSize: "1rem" }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewStep({
  step1,
  step2,
  step3,
  files
}: {
  step1: Partial<LoanApplicationStep1>;
  step2: Partial<LoanApplicationStep2>;
  step3: Partial<LoanApplicationStep3>;
  files: File[];
}) {
  const debtRatio =
    step3.totalAssets && step3.totalLiabilities
      ? ((step3.totalLiabilities / step3.totalAssets) * 100).toFixed(1)
      : "N/A";

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <div style={{ padding: "1rem", border: "1px solid #edf2f7", borderRadius: "0.875rem" }}>
        <div style={{ fontWeight: 700, color: "#10243d", marginBottom: "0.75rem" }}>Business information</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem", fontSize: "0.85rem" }}>
          <span style={{ color: "#5f7083" }}>Business name</span><span>{step1.businessName}</span>
          <span style={{ color: "#5f7083" }}>Industry</span><span>{step1.industry}</span>
          <span style={{ color: "#5f7083" }}>Region</span><span>{step1.region}</span>
          <span style={{ color: "#5f7083" }}>TIN</span><span>{step1.tin}</span>
        </div>
      </div>
      <div style={{ padding: "1rem", border: "1px solid #edf2f7", borderRadius: "0.875rem" }}>
        <div style={{ fontWeight: 700, color: "#10243d", marginBottom: "0.75rem" }}>Loan details</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem", fontSize: "0.85rem" }}>
          <span style={{ color: "#5f7083" }}>Amount</span>
          <span>{step2.loanAmount?.toLocaleString()} {step2.currency}</span>
          <span style={{ color: "#5f7083" }}>Term</span><span>{step2.termMonths} months</span>
          <span style={{ color: "#5f7083" }}>Purpose</span><span>{step2.purpose}</span>
        </div>
      </div>
      <div style={{ padding: "1rem", border: "1px solid #edf2f7", borderRadius: "0.875rem" }}>
        <div style={{ fontWeight: 700, color: "#10243d", marginBottom: "0.75rem" }}>Financial information</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem", fontSize: "0.85rem" }}>
          <span style={{ color: "#5f7083" }}>Annual revenue</span>
          <span>{step3.annualRevenue?.toLocaleString()}</span>
          <span style={{ color: "#5f7083" }}>Annual expenses</span>
          <span>{step3.annualExpenses?.toLocaleString()}</span>
          <span style={{ color: "#5f7083" }}>Total assets</span>
          <span>{step3.totalAssets?.toLocaleString()}</span>
          <span style={{ color: "#5f7083" }}>Total liabilities</span>
          <span>{step3.totalLiabilities?.toLocaleString()}</span>
          <span style={{ color: "#5f7083" }}>Debt/asset ratio</span>
          <span>{debtRatio}%</span>
        </div>
      </div>
      <div style={{ padding: "1rem", border: "1px solid #edf2f7", borderRadius: "0.875rem" }}>
        <div style={{ fontWeight: 700, color: "#10243d", marginBottom: "0.5rem" }}>
          Documents ({files.length})
        </div>
        {files.length === 0 ? (
          <span style={{ color: "#a0aec0", fontSize: "0.85rem" }}>No documents attached</span>
        ) : (
          files.map((f, i) => (
            <div key={i} style={{ fontSize: "0.85rem", color: "#5f7083" }}>• {f.name}</div>
          ))
        )}
      </div>
    </div>
  );
}

export function LoanApplicationForm() {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [step1, setStep1] = useState<Partial<LoanApplicationStep1>>({});
  const [step2, setStep2] = useState<Partial<LoanApplicationStep2>>({ currency: "UZS" });
  const [step3, setStep3] = useState<Partial<LoanApplicationStep3>>({});
  const [files, setFiles] = useState<File[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdApplicationId, setCreatedApplicationId] = useState<string | null>(null);

  const isStep1Valid = Boolean(step1.businessName && step1.industry && step1.region && step1.tin);
  const isStep2Valid = Boolean(step2.loanAmount && step2.termMonths && step2.purpose);
  const isStep3Valid = Boolean(
    step3.annualRevenue && step3.annualExpenses && step3.totalAssets && step3.totalLiabilities
  );

  const canAdvance = () => {
    if (currentStep === 1) return isStep1Valid;
    if (currentStep === 2) return isStep2Valid;
    if (currentStep === 3) return isStep3Valid;
    return true;
  };

  async function handleSubmit() {
    if (!isStep1Valid || !isStep2Valid || !isStep3Valid) {
      setSubmitError("Please complete all required fields before submitting.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const application = await readApi<LoanApplication>("/api/credit/applications", {
        method: "POST",
        body: JSON.stringify({
          businessName: step1.businessName,
          industry: step1.industry,
          region: step1.region,
          tin: step1.tin
        })
      });

      await readApi<LoanApplication>(`/api/credit/applications/${application.id}/step`, {
        method: "PATCH",
        body: JSON.stringify({
          loanAmount: step2.loanAmount,
          currency: step2.currency,
          purpose: step2.purpose,
          termMonths: step2.termMonths
        })
      });

      await readApi<LoanApplication>(`/api/credit/applications/${application.id}/step`, {
        method: "PATCH",
        body: JSON.stringify({
          annualRevenue: step3.annualRevenue,
          annualExpenses: step3.annualExpenses,
          totalAssets: step3.totalAssets,
          totalLiabilities: step3.totalLiabilities
        })
      });

      for (const file of files) {
        await uploadDocument(application.id, file);
      }

      await readApi<LoanApplication>(`/api/credit/applications/${application.id}/submit`, {
        method: "POST",
        body: JSON.stringify({})
      });

      setCreatedApplicationId(application.id);
      setSubmitted(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to submit application.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div style={{ display: "grid", gap: "1.5rem" }}>
        <div
          style={{
            textAlign: "center",
            padding: "3rem 2rem",
            background: "#fff",
            borderRadius: "1.25rem",
            border: "1px solid #dfe7f0"
          }}
        >
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✅</div>
          <h2 style={{ color: "#10243d", marginBottom: "0.5rem" }}>Application submitted</h2>
          <p style={{ color: "#5f7083", marginBottom: "1.5rem" }}>
            Your loan application for{" "}
            <strong>{step1.businessName}</strong> has been submitted for credit review.
            A risk score will be computed and a bank officer will review your application.
            {createdApplicationId ? ` Application ID: ${createdApplicationId}.` : ""}
          </p>
          <a
            href="/app/credit-queue"
            style={{
              display: "inline-flex",
              padding: "0.75rem 1.5rem",
              borderRadius: "0.875rem",
              background: "#0d3b66",
              color: "#fff",
              textDecoration: "none",
              fontWeight: 600
            }}
          >
            View credit queue
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <PageHeader
        eyebrow="Credit application"
        title="New loan application"
        description="Complete all steps to submit your application for credit review. A risk score will be automatically computed from your financial data."
      />

      <SectionCard title="" description="">
        <StepIndicator current={currentStep} />

        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          {currentStep === 1 && <Step1Form value={step1} onChange={setStep1} />}
          {currentStep === 2 && <Step2Form value={step2} onChange={setStep2} />}
          {currentStep === 3 && <Step3Form value={step3} onChange={setStep3} />}
          {currentStep === 4 && <Step4Form files={files} onFiles={setFiles} />}
          {currentStep === 5 && (
            <ReviewStep step1={step1} step2={step2} step3={step3} files={files} />
          )}
          {submitError ? (
            <div
              style={{
                marginTop: "1rem",
                padding: "0.75rem 1rem",
                borderRadius: "0.75rem",
                border: "1px solid #fde0df",
                background: "#fff5f5",
                color: "#8b2621",
                fontSize: "0.85rem"
              }}
            >
              {submitError}
            </div>
          ) : null}

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "2rem" }}>
            <button
              onClick={() => setCurrentStep((s) => Math.max(1, s - 1) as Step)}
              disabled={currentStep === 1 || submitting}
              style={{
                padding: "0.7rem 1.5rem",
                borderRadius: "0.875rem",
                border: "1px solid #dfe7f0",
                background: "#fff",
                color: currentStep === 1 ? "#a0aec0" : "#10243d",
                fontWeight: 600,
                cursor: currentStep === 1 ? "not-allowed" : "pointer",
                fontSize: "0.9rem"
              }}
            >
              Back
            </button>

            {currentStep < 5 ? (
              <button
                onClick={() => canAdvance() && setCurrentStep((s) => (s + 1) as Step)}
                disabled={!canAdvance() || submitting}
                style={{
                  padding: "0.7rem 1.5rem",
                  borderRadius: "0.875rem",
                  border: "none",
                  background: canAdvance() ? "#0d3b66" : "#a0aec0",
                  color: "#fff",
                  fontWeight: 600,
                  cursor: canAdvance() ? "pointer" : "not-allowed",
                  fontSize: "0.9rem"
                }}
              >
                Continue →
              </button>
            ) : (
              <button
                onClick={() => void handleSubmit()}
                disabled={submitting}
                style={{
                  padding: "0.7rem 1.5rem",
                  borderRadius: "0.875rem",
                  border: "none",
                  background: submitting ? "#a0aec0" : "#0d3b66",
                  color: "#fff",
                  fontWeight: 600,
                  cursor: submitting ? "not-allowed" : "pointer",
                  fontSize: "0.9rem"
                }}
              >
                {submitting ? "Submitting..." : "Submit application"}
              </button>
            )}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
