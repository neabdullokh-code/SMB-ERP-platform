"use client";

import { useState } from "react";
import { Button, Callout } from "@sqb/ui";
import type { InsufficientStockDetail } from "./document-form";
import type { DocumentStatus } from "./status";

interface DocumentActionsProps {
  kindPlural: "goods-receipts" | "goods-issues" | "inventory-transfers" | "production-orders";
  documentId: string;
  status: DocumentStatus;
  backHref: string;
  allowVoid?: boolean;
}

/**
 * Shared post/void action bar for document detail pages. POST and VOID calls
 * go through the Next proxy so the session cookie is forwarded. On
 * INSUFFICIENT_STOCK the per-line details are surfaced as a callout; on
 * success the page is reloaded to re-read the new status + ledger effects.
 */
export function DocumentActions({
  kindPlural,
  documentId,
  status,
  backHref,
  allowVoid = true
}: DocumentActionsProps) {
  const [working, setWorking] = useState<"post" | "void" | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [stockErrors, setStockErrors] = useState<InsufficientStockDetail[]>([]);

  const call = async (action: "post" | "void") => {
    setWorking(action);
    setFormError(null);
    setStockErrors([]);
    try {
      const response = await fetch(`/api/documents/${kindPlural}/${documentId}/${action}`, {
        method: "POST",
        headers: { "content-type": "application/json" }
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        const err = (body as { error?: { message?: string; errorCode?: string; details?: InsufficientStockDetail[] } })?.error;
        if (err?.errorCode === "INSUFFICIENT_STOCK" && err.details) {
          setStockErrors(err.details);
          setFormError(err.message ?? "Insufficient stock to post this document.");
        } else {
          setFormError(err?.message ?? `Failed to ${action} document.`);
        }
        return;
      }
      window.location.reload();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Network error. Please try again.");
    } finally {
      setWorking(null);
    }
  };

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      {formError ? (
        <Callout tone="bad" title="Cannot proceed">
          {formError}
          {stockErrors.length > 0 ? (
            <ul style={{ margin: "0.5rem 0 0", paddingLeft: "1.25rem" }}>
              {stockErrors.map((d) => (
                <li key={d.itemId}>
                  <strong>{d.itemName ?? d.itemSku ?? d.itemId.slice(0, 8)}</strong>: available {d.available}, requested {d.requested}
                </li>
              ))}
            </ul>
          ) : null}
        </Callout>
      ) : null}

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <Button variant="secondary" href={backHref}>
          ← Back to list
        </Button>
        {status === "DRAFT" ? (
          <Button variant="primary" onClick={() => call("post")} disabled={working !== null}>
            {working === "post" ? "Posting…" : "Post"}
          </Button>
        ) : null}
        {status === "POSTED" && allowVoid ? (
          <Button variant="danger" onClick={() => call("void")} disabled={working !== null}>
            {working === "void" ? "Voiding…" : "Void"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
