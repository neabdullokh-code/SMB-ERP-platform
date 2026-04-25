"use client";

export async function readJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });

  const body = await response.json();
  if (!response.ok) {
    throw new Error(body?.message ?? `Request failed with status ${response.status}`);
  }

  return body as T;
}

export function formatMoney(value?: string) {
  const amount = Number(value ?? "0");
  if (!Number.isFinite(amount)) {
    return "0.00 UZS";
  }

  return `${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })} UZS`;
}

export function formatDateTime(value?: string) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(parsed);
}
