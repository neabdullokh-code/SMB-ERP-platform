import { cookies } from "next/headers";

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/**
 * Server-side fetch that forwards the browser session cookie as the
 * `x-session-token` header the platform API expects. Returns `null` when the
 * request fails for any reason so pages can render a graceful empty state
 * instead of throwing.
 */
export async function fetchFromApi<T>(path: string): Promise<T | null> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("erp_auth_session")?.value;
    const headers: Record<string, string> = { "content-type": "application/json" };
    if (sessionToken) headers["x-session-token"] = sessionToken;

    const res = await fetch(`${API_BASE}${path}`, { headers, cache: "no-store" });
    if (!res.ok) return null;

    const body = await res.json();
    return (body?.data ?? body) as T;
  } catch {
    return null;
  }
}

export interface WarehouseOption {
  id: string;
  code: string;
  name: string;
}

export interface InventoryItemOption {
  id: string;
  sku: string;
  name: string;
  unitCostUzs: number;
  warehouseId: string;
}

export interface BomOption {
  id: string;
  code: string;
  outputSku: string;
  version: string;
}

export async function fetchWarehouses(): Promise<WarehouseOption[]> {
  const data = await fetchFromApi<{ warehouses?: WarehouseOption[] }>("/inventory/warehouses");
  if (!data) return [];
  if (Array.isArray((data as unknown as WarehouseOption[]))) return data as unknown as WarehouseOption[];
  return data.warehouses ?? [];
}

export async function fetchInventoryItems(): Promise<InventoryItemOption[]> {
  const data = await fetchFromApi<{ items?: InventoryItemOption[] }>("/inventory/items");
  if (!data) return [];
  if (Array.isArray((data as unknown as InventoryItemOption[]))) return data as unknown as InventoryItemOption[];
  return data.items ?? [];
}

export async function fetchBoms(): Promise<BomOption[]> {
  const data = await fetchFromApi<{ boms?: BomOption[] }>("/production/boms");
  if (!data) return [];
  if (Array.isArray((data as unknown as BomOption[]))) return data as unknown as BomOption[];
  return data.boms ?? [];
}
