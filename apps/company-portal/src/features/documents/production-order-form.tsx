"use client";

import { useMemo, useState } from "react";
import {
  Button,
  Callout,
  FormField,
  SectionCard,
  Select,
  TextInput,
  Textarea
} from "@sqb/ui";
import type { BomOption, InventoryItemOption, WarehouseOption } from "./api";
import type { InsufficientStockDetail } from "./document-form";

type SubmitIntent = "draft" | "post" | "post-and-close";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

async function apiRequest<T>(path: string, init: RequestInit) {
  const response = await fetch(path, {
    ...init,
    headers: { "content-type": "application/json", ...(init.headers ?? {}) }
  });
  const contentType = response.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json") ? ((await response.json()) as T) : null;
  return { ok: response.ok, status: response.status, body };
}

/**
 * Production-order form. A production order is a single-line document in the
 * 1C model — one BOM, one output item, one quantity — so it has no tabular
 * section. Posting pulls the BOM's raw-material lines, validates on-hand in
 * the target warehouse, and writes OUT rows for each input + one IN row for
 * the finished good.
 */
export function ProductionOrderForm({
  warehouses,
  items,
  boms,
  backHref
}: {
  warehouses: WarehouseOption[];
  items: InventoryItemOption[];
  boms: BomOption[];
  backHref: string;
}) {
  const [documentNumber, setDocumentNumber] = useState("");
  const [documentDate, setDocumentDate] = useState(todayIso());
  const [scheduledDate, setScheduledDate] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [bomId, setBomId] = useState("");
  const [outputItemId, setOutputItemId] = useState("");
  const [plannedUnits, setPlannedUnits] = useState("");
  const [producedUnits, setProducedUnits] = useState("");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState<SubmitIntent | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [stockErrors, setStockErrors] = useState<InsufficientStockDetail[]>([]);

  const warehouseOptions = useMemo(
    () => [
      { value: "", label: "Select warehouse…" },
      ...warehouses.map((w) => ({ value: w.id, label: `${w.code} — ${w.name}` }))
    ],
    [warehouses]
  );

  const itemOptions = useMemo(
    () => [
      { value: "", label: "Select finished good…" },
      ...items.map((i) => ({ value: i.id, label: `${i.sku} — ${i.name}` }))
    ],
    [items]
  );

  const bomOptions = useMemo(
    () => [
      { value: "", label: "Select BOM…" },
      ...boms.map((b) => ({ value: b.id, label: `${b.code} v${b.version} — output ${b.outputSku}` }))
    ],
    [boms]
  );

  const validate = (): string | null => {
    if (!documentDate) return "Document date is required.";
    if (!warehouseId) return "Warehouse is required.";
    if (!bomId) return "BOM is required.";
    if (!outputItemId) return "Output item is required.";
    const p = Number(plannedUnits);
    if (!Number.isFinite(p) || p <= 0) return "Planned units must be > 0.";
    if (producedUnits) {
      const pr = Number(producedUnits);
      if (!Number.isFinite(pr) || pr <= 0) return "Produced units must be > 0 when provided.";
    }
    return null;
  };

  const buildPayload = () => {
    const payload: Record<string, unknown> = {
      documentNumber: documentNumber.trim() || undefined,
      documentDate,
      warehouseId,
      bomId,
      outputItemId,
      plannedUnits,
      notes: notes.trim() || undefined
    };
    if (scheduledDate) payload.scheduledDate = scheduledDate;
    if (producedUnits) payload.producedUnits = producedUnits;
    return payload;
  };

  const handleSubmit = async (intent: SubmitIntent) => {
    const error = validate();
    if (error) {
      setFormError(error);
      setStockErrors([]);
      return;
    }

    setFormError(null);
    setStockErrors([]);
    setSubmitting(intent);

    try {
      const createResponse = await apiRequest<{
        data?: { document: { id: string; documentNumber: string; status: string } };
        error?: { message?: string };
      }>(`/api/documents/production-orders`, {
        method: "POST",
        body: JSON.stringify(buildPayload())
      });

      if (!createResponse.ok || !createResponse.body?.data?.document) {
        setFormError(createResponse.body?.error?.message ?? "Failed to save production order.");
        return;
      }

      const draft = createResponse.body.data.document;

      if (intent === "draft") {
        window.location.href = `${backHref}/${draft.id}`;
        return;
      }

      const postResponse = await apiRequest<{
        data?: { document: unknown };
        error?: { message?: string; errorCode?: string; details?: InsufficientStockDetail[] };
      }>(`/api/documents/production-orders/${draft.id}/post`, {
        method: "POST",
        body: JSON.stringify({})
      });

      if (!postResponse.ok) {
        const err = postResponse.body?.error;
        if (err?.errorCode === "INSUFFICIENT_STOCK" && err.details) {
          setStockErrors(err.details);
          setFormError(err.message ?? "Insufficient raw materials to post this order.");
        } else {
          setFormError(err?.message ?? "Failed to post production order. Draft was saved.");
        }
        return;
      }

      window.location.href = intent === "post-and-close" ? backHref : `${backHref}/${draft.id}`;
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Network error. Please try again.");
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div style={{ display: "grid", gap: "1.25rem" }}>
      {formError ? (
        <Callout tone="bad" title="Cannot post this production order">
          {formError}
          {stockErrors.length > 0 ? (
            <ul style={{ margin: "0.5rem 0 0", paddingLeft: "1.25rem" }}>
              {stockErrors.map((d) => {
                const item = items.find((i) => i.id === d.itemId);
                const label = d.itemName ?? item?.name ?? d.itemSku ?? d.itemId.slice(0, 8);
                return (
                  <li key={d.itemId}>
                    <strong>{label}</strong>: available {d.available}, requested {d.requested}
                  </li>
                );
              })}
            </ul>
          ) : null}
        </Callout>
      ) : null}

      <SectionCard title="Header">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
          <FormField label="Document number" hint="Leave empty to auto-generate">
            <TextInput value={documentNumber} onChange={setDocumentNumber} placeholder="e.g. PO-2026-000001" />
          </FormField>
          <FormField label="Document date" required>
            <TextInput type="date" value={documentDate} onChange={setDocumentDate} />
          </FormField>
          <FormField label="Scheduled date">
            <TextInput type="date" value={scheduledDate} onChange={setScheduledDate} />
          </FormField>
          <FormField label="Warehouse" required hint="Where raw materials are consumed and finished goods land">
            <Select value={warehouseId} onChange={setWarehouseId} options={warehouseOptions} />
          </FormField>
          <FormField label="BOM" required>
            <Select value={bomId} onChange={setBomId} options={bomOptions} />
          </FormField>
          <FormField label="Output item" required>
            <Select value={outputItemId} onChange={setOutputItemId} options={itemOptions} />
          </FormField>
          <FormField label="Planned units" required>
            <TextInput
              type="number"
              min={0}
              step="0.0001"
              value={plannedUnits}
              onChange={setPlannedUnits}
              placeholder="e.g. 10"
            />
          </FormField>
          <FormField
            label="Produced units"
            hint="Leave empty to use planned units when posting"
          >
            <TextInput
              type="number"
              min={0}
              step="0.0001"
              value={producedUnits}
              onChange={setProducedUnits}
            />
          </FormField>
        </div>
        <div style={{ marginTop: "1rem" }}>
          <FormField label="Notes">
            <Textarea value={notes} onChange={setNotes} placeholder="Shift, operator, QC notes…" />
          </FormField>
        </div>
      </SectionCard>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", flexWrap: "wrap" }}>
        <Button variant="ghost" onClick={() => handleSubmit("draft")} disabled={submitting !== null}>
          {submitting === "draft" ? "Saving…" : "Save draft"}
        </Button>
        <Button variant="secondary" onClick={() => handleSubmit("post")} disabled={submitting !== null}>
          {submitting === "post" ? "Posting…" : "Post"}
        </Button>
        <Button variant="primary" onClick={() => handleSubmit("post-and-close")} disabled={submitting !== null}>
          {submitting === "post-and-close" ? "Posting…" : "Post and close"}
        </Button>
      </div>
    </div>
  );
}
