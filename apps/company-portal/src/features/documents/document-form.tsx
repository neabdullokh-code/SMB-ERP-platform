"use client";

import { useCallback, useMemo, useState } from "react";
import {
  Button,
  Callout,
  FormField,
  SectionCard,
  Select,
  TextInput,
  Textarea
} from "@sqb/ui";
import type { InventoryItemOption, WarehouseOption } from "./api";

export type LineField = "itemId" | "quantity" | "unitCostUzs" | "notes";

export interface FormLine {
  itemId: string;
  quantity: string;
  unitCostUzs: string;
  notes: string;
}

export interface InsufficientStockDetail {
  itemId: string;
  itemName?: string;
  itemSku?: string;
  warehouseId?: string;
  available: string;
  requested: string;
}

interface DocumentFormProps {
  kind: "goods-receipt" | "goods-issue" | "inventory-transfer" | "production-order";
  warehouses: WarehouseOption[];
  items: InventoryItemOption[];
  requireUnitCost: boolean;
  primaryWarehouseLabel: string;
  secondaryWarehouseLabel?: string;
  showSecondaryWarehouse?: boolean;
  backHref: string;
}

type SubmitIntent = "draft" | "post" | "post-and-close";

function emptyLine(): FormLine {
  return { itemId: "", quantity: "", unitCostUzs: "", notes: "" };
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

async function apiRequest<T>(path: string, init: RequestInit): Promise<{ ok: boolean; status: number; body: T | null }> {
  const hasBody = init.body != null;
  const headers: Record<string, string> = { ...(init.headers as Record<string, string> | undefined) };
  if (hasBody && !headers["content-type"]) headers["content-type"] = "application/json";
  const response = await fetch(path, { ...init, headers });
  const contentType = response.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json") ? ((await response.json()) as T) : null;
  return { ok: response.ok, status: response.status, body };
}

/**
 * Shared "1C document" form. Renders the header metadata, a tabular section
 * (with "+ Add Row" and remove buttons), and the three action buttons
 * (Save Draft / Post / Post and Close). Handles the server contract:
 *
 *   POST /documents/{kind}              -> creates a DRAFT
 *   POST /documents/{kind}/:id/post     -> flips DRAFT -> POSTED
 *
 * When the backend rejects a post with INSUFFICIENT_STOCK, the error details
 * are mapped back onto the local line rows so offending cells are highlighted
 * in red with the available/requested values in the callout above the table.
 */
export function DocumentForm({
  kind,
  warehouses,
  items,
  requireUnitCost,
  primaryWarehouseLabel,
  secondaryWarehouseLabel,
  showSecondaryWarehouse,
  backHref
}: DocumentFormProps) {
  const [documentNumber, setDocumentNumber] = useState("");
  const [documentDate, setDocumentDate] = useState(todayIso());
  const [warehouseId, setWarehouseId] = useState("");
  const [destinationWarehouseId, setDestinationWarehouseId] = useState("");
  const [counterpartyId, setCounterpartyId] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<FormLine[]>([emptyLine()]);

  const [submitting, setSubmitting] = useState<SubmitIntent | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [stockErrors, setStockErrors] = useState<InsufficientStockDetail[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const itemOptions = useMemo(
    () => [
      { value: "", label: "Select item…" },
      ...items.map((i) => ({ value: i.id, label: `${i.sku} — ${i.name}` }))
    ],
    [items]
  );
  const warehouseOptions = useMemo(
    () => [
      { value: "", label: "Select warehouse…" },
      ...warehouses.map((w) => ({ value: w.id, label: `${w.code} — ${w.name}` }))
    ],
    [warehouses]
  );

  const updateLine = useCallback((index: number, field: LineField, value: string) => {
    setLines((current) =>
      current.map((line, i) => (i === index ? { ...line, [field]: value } : line))
    );
  }, []);

  const addLine = () => setLines((c) => [...c, emptyLine()]);
  const removeLine = (index: number) =>
    setLines((c) => (c.length === 1 ? c : c.filter((_, i) => i !== index)));

  const stockErrorByItem = useMemo(() => {
    const map = new Map<string, InsufficientStockDetail>();
    for (const d of stockErrors) map.set(d.itemId, d);
    return map;
  }, [stockErrors]);

  const validate = (intent: SubmitIntent): string | null => {
    if (!documentDate) return "Document date is required.";
    if (!warehouseId) return `${primaryWarehouseLabel} is required.`;
    if (showSecondaryWarehouse && !destinationWarehouseId) {
      return `${secondaryWarehouseLabel ?? "Destination warehouse"} is required.`;
    }
    if (showSecondaryWarehouse && destinationWarehouseId === warehouseId) {
      return "Source and destination warehouses must differ.";
    }
    if (lines.length === 0) return "At least one line is required.";
    for (let i = 0; i < lines.length; i += 1) {
      const l = lines[i];
      if (!l.itemId) return `Line ${i + 1}: pick an item.`;
      const qty = Number(l.quantity);
      if (!Number.isFinite(qty) || qty <= 0) return `Line ${i + 1}: quantity must be > 0.`;
      if (requireUnitCost) {
        const cost = Number(l.unitCostUzs);
        if (!Number.isFinite(cost) || cost < 0) return `Line ${i + 1}: unit cost must be >= 0.`;
      }
    }
    if (intent !== "draft" && showSecondaryWarehouse && !warehouseId) {
      return "Source warehouse is required.";
    }
    return null;
  };

  const buildPayload = () => {
    const base: Record<string, unknown> = {
      documentNumber: documentNumber.trim() || undefined,
      documentDate,
      notes: notes.trim() || undefined,
      lines: lines.map((l) => {
        const line: Record<string, unknown> = {
          itemId: l.itemId,
          quantity: l.quantity,
          notes: l.notes.trim() || undefined
        };
        if (requireUnitCost) line.unitCostUzs = l.unitCostUzs || "0";
        return line;
      })
    };
    if (showSecondaryWarehouse) {
      base.sourceWarehouseId = warehouseId;
      base.destinationWarehouseId = destinationWarehouseId;
    } else {
      base.warehouseId = warehouseId;
      if (counterpartyId.trim()) base.counterpartyId = counterpartyId.trim();
    }
    return base;
  };

  const handleSubmit = async (intent: SubmitIntent) => {
    const error = validate(intent);
    if (error) {
      setFormError(error);
      setStockErrors([]);
      setSuccessMessage(null);
      return;
    }

    setFormError(null);
    setStockErrors([]);
    setSuccessMessage(null);
    setSubmitting(intent);

    try {
      const createResponse = await apiRequest<{
        data?: { document: { id: string; documentNumber: string; status: string } };
      }>(`/api/documents/${kind}s`, {
        method: "POST",
        body: JSON.stringify(buildPayload())
      });

      if (!createResponse.ok || !createResponse.body?.data?.document) {
        const errBody = createResponse.body as unknown as { error?: { message?: string } };
        setFormError(errBody?.error?.message ?? "Failed to save document.");
        return;
      }

      const draft = createResponse.body.data.document;

      if (intent === "draft") {
        setSuccessMessage(`Saved draft ${draft.documentNumber}.`);
        window.location.href = `${backHref}/${draft.id}`;
        return;
      }

      const postResponse = await apiRequest<{
        data?: { document: { id: string; documentNumber: string; status: string } };
        error?: {
          message?: string;
          errorCode?: string;
          details?: InsufficientStockDetail[];
        };
      }>(`/api/documents/${kind}s/${draft.id}/post`, { method: "POST" });

      if (!postResponse.ok) {
        const errBody = postResponse.body?.error;
        if (errBody?.errorCode === "INSUFFICIENT_STOCK" && errBody.details) {
          setStockErrors(errBody.details);
          setFormError(errBody.message ?? "Insufficient stock to post this document.");
        } else {
          setFormError(errBody?.message ?? "Failed to post document. Draft was saved.");
        }
        return;
      }

      if (intent === "post-and-close") {
        window.location.href = backHref;
        return;
      }

      setSuccessMessage(`Posted ${draft.documentNumber}.`);
      window.location.href = `${backHref}/${draft.id}`;
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Network error. Please try again.");
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div style={{ display: "grid", gap: "1.25rem" }}>
      {formError ? (
        <Callout tone="bad" title="Cannot post this document">
          {formError}
          {stockErrors.length > 0 ? (
            <ul style={{ margin: "0.5rem 0 0", paddingLeft: "1.25rem" }}>
              {stockErrors.map((d) => {
                const item = items.find((i) => i.id === d.itemId);
                const label = d.itemName ?? item?.name ?? d.itemSku ?? d.itemId.slice(0, 8);
                return (
                  <li key={`${d.itemId}-${d.warehouseId ?? ""}`}>
                    <strong>{label}</strong>: available {d.available}, requested {d.requested}
                  </li>
                );
              })}
            </ul>
          ) : null}
        </Callout>
      ) : null}

      {successMessage ? <Callout tone="good" title="Done">{successMessage}</Callout> : null}

      <SectionCard title="Header">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
          <FormField label="Document number" hint="Leave empty to auto-generate">
            <TextInput value={documentNumber} onChange={setDocumentNumber} placeholder="e.g. GR-2026-000001" />
          </FormField>
          <FormField label="Document date" required>
            <TextInput type="date" value={documentDate} onChange={setDocumentDate} />
          </FormField>
          <FormField label={primaryWarehouseLabel} required>
            <Select value={warehouseId} onChange={setWarehouseId} options={warehouseOptions} />
          </FormField>
          {showSecondaryWarehouse ? (
            <FormField label={secondaryWarehouseLabel ?? "Destination warehouse"} required>
              <Select
                value={destinationWarehouseId}
                onChange={setDestinationWarehouseId}
                options={warehouseOptions}
              />
            </FormField>
          ) : null}
          <FormField label="Counterparty (optional)" hint="UUID — a picker will replace this later">
            <TextInput value={counterpartyId} onChange={setCounterpartyId} placeholder="counterparty id" />
          </FormField>
        </div>
        <div style={{ marginTop: "1rem" }}>
          <FormField label="Notes">
            <Textarea value={notes} onChange={setNotes} placeholder="Internal notes…" />
          </FormField>
        </div>
      </SectionCard>

      <SectionCard
        title="Line items"
        description="Add one row per item. Quantities and unit cost are captured at the document level; the ledger is written only when the document is posted."
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {[
                  "#",
                  "Item",
                  "Quantity",
                  requireUnitCost ? "Unit cost (UZS)" : null,
                  "Notes",
                  ""
                ]
                  .filter((x): x is string => Boolean(x))
                  .map((c) => (
                    <th
                      key={c}
                      style={{
                        textAlign: "left",
                        padding: "0.6rem 0.5rem",
                        borderBottom: "1px solid #dfe7f0",
                        color: "#5f7083",
                        fontSize: "0.78rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em"
                      }}
                    >
                      {c}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {lines.map((line, index) => {
                const stockErr = line.itemId ? stockErrorByItem.get(line.itemId) : undefined;
                const rowBg = stockErr ? "#fdecec" : "transparent";
                return (
                  <tr key={index} style={{ background: rowBg }}>
                    <td style={{ padding: "0.6rem 0.5rem", color: "#5f7083", verticalAlign: "top" }}>
                      {index + 1}
                    </td>
                    <td style={{ padding: "0.5rem 0.5rem", minWidth: 260, verticalAlign: "top" }}>
                      <Select
                        value={line.itemId}
                        onChange={(v) => updateLine(index, "itemId", v)}
                        options={itemOptions}
                        error={Boolean(stockErr)}
                      />
                      {stockErr ? (
                        <div style={{ color: "#8b2621", fontSize: "0.78rem", marginTop: "0.35rem" }}>
                          Only {stockErr.available} available, requested {stockErr.requested}
                        </div>
                      ) : null}
                    </td>
                    <td style={{ padding: "0.5rem 0.5rem", width: 140, verticalAlign: "top" }}>
                      <TextInput
                        type="number"
                        min={0}
                        step="0.0001"
                        value={line.quantity}
                        onChange={(v) => updateLine(index, "quantity", v)}
                        error={Boolean(stockErr)}
                      />
                    </td>
                    {requireUnitCost ? (
                      <td style={{ padding: "0.5rem 0.5rem", width: 160, verticalAlign: "top" }}>
                        <TextInput
                          type="number"
                          min={0}
                          step="0.0001"
                          value={line.unitCostUzs}
                          onChange={(v) => updateLine(index, "unitCostUzs", v)}
                        />
                      </td>
                    ) : null}
                    <td style={{ padding: "0.5rem 0.5rem", minWidth: 200, verticalAlign: "top" }}>
                      <TextInput
                        value={line.notes}
                        onChange={(v) => updateLine(index, "notes", v)}
                        placeholder="optional"
                      />
                    </td>
                    <td style={{ padding: "0.5rem 0.5rem", verticalAlign: "top", width: 60 }}>
                      <Button
                        variant="ghost"
                        onClick={() => removeLine(index)}
                        disabled={lines.length === 1}
                      >
                        ✕
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: "0.75rem" }}>
          <Button variant="secondary" onClick={addLine}>
            + Add row
          </Button>
        </div>
      </SectionCard>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "0.75rem",
          flexWrap: "wrap",
          position: "sticky",
          bottom: 0,
          padding: "0.75rem 0",
          background: "transparent"
        }}
      >
        <Button
          variant="ghost"
          onClick={() => handleSubmit("draft")}
          disabled={submitting !== null}
        >
          {submitting === "draft" ? "Saving…" : "Save draft"}
        </Button>
        <Button
          variant="secondary"
          onClick={() => handleSubmit("post")}
          disabled={submitting !== null}
        >
          {submitting === "post" ? "Posting…" : "Post"}
        </Button>
        <Button
          variant="primary"
          onClick={() => handleSubmit("post-and-close")}
          disabled={submitting !== null}
        >
          {submitting === "post-and-close" ? "Posting…" : "Post and close"}
        </Button>
      </div>
    </div>
  );
}
