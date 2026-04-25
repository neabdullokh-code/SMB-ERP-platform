import { StatusBadge } from "@sqb/ui";

export type DocumentStatus = "DRAFT" | "POSTED" | "VOID";

export function statusTone(status: DocumentStatus): "neutral" | "good" | "warn" | "bad" {
  if (status === "POSTED") return "good";
  if (status === "VOID") return "bad";
  return "warn";
}

export function statusLabel(status: DocumentStatus): string {
  if (status === "POSTED") return "Posted";
  if (status === "VOID") return "Void";
  return "Draft";
}

export function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  return <StatusBadge tone={statusTone(status)}>{statusLabel(status)}</StatusBadge>;
}
