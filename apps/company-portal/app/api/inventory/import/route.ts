import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export const runtime = "nodejs";

const DEFAULT_PLATFORM_API_URL = "http://localhost:4000";

function platformApiUrl() {
  return process.env.PLATFORM_API_URL ?? DEFAULT_PLATFORM_API_URL;
}

function readCookie(request: Request, name: string) {
  return request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

function firstPresent(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (value != null && String(value).trim() !== "") return String(value).trim();
  }
  return "";
}

function normalizeRows(rows: Record<string, unknown>[]) {
  return rows
    .map((row) => {
      const normalized: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(row)) {
        normalized[key.trim().toLowerCase().replace(/\s+/g, "_")] = value;
      }
      return normalized;
    })
    .map((row) => ({
      sku: firstPresent(row, ["sku", "product_code", "code"]),
      name: firstPresent(row, ["name", "product_name", "product"]),
      category: firstPresent(row, ["category", "cat"]) || "General",
      reorderPoint: Number.parseInt(firstPresent(row, ["reorder_point", "min", "minimum", "threshold"]) || "0", 10) || 0,
      unitCostUzs: firstPresent(row, ["unit_cost_uzs", "unit_cost", "cost", "price"]),
      quantity: Number.parseFloat(firstPresent(row, ["qty", "quantity", "on_hand", "stock"]) || "0") || 0
    }))
    .filter((row) => row.sku && row.name);
}

async function apiFetch(
  sessionToken: string,
  path: string,
  init?: { method?: string; body?: unknown; query?: URLSearchParams }
) {
  const query = init?.query?.toString();
  const response = await fetch(`${platformApiUrl()}${path}${query ? `?${query}` : ""}`, {
    method: init?.method ?? "GET",
    headers: {
      "content-type": "application/json",
      "x-session-token": sessionToken
    },
    body: init?.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store"
  });
  const body = await response.json();
  return { response, body };
}

export async function POST(request: Request) {
  const sessionToken = readCookie(request, "erp_auth_session");
  if (!sessionToken) {
    return NextResponse.json({ message: "Session not found", errorCode: "SESSION_INVALID" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ message: "Excel file is required." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const workbook = XLSX.read(bytes, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return NextResponse.json({ message: "Workbook has no sheets." }, { status: 400 });
    }

    const worksheet = workbook.Sheets[sheetName];
    const parsed = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: "" });
    const rows = normalizeRows(parsed);
    if (rows.length === 0) {
      return NextResponse.json(
        { message: "No valid rows found. Required columns: sku,name,category (optional qty,unit_cost_uzs,reorder_point)." },
        { status: 400 }
      );
    }

    const warehousesResult = await apiFetch(sessionToken, "/inventory/warehouses");
    const warehouseId = warehousesResult.body?.data?.warehouses?.[0]?.id as string | undefined;
    if (!warehousesResult.response.ok || !warehouseId) {
      return NextResponse.json({ message: "No warehouse found. Create a warehouse first." }, { status: 400 });
    }

    let imported = 0;
    let movements = 0;
    const reference = `IMPORT-${new Date().toISOString().slice(0, 10)}-${file.name}`;

    for (const row of rows) {
      const lookup = await apiFetch(sessionToken, "/inventory/items", {
        query: new URLSearchParams({ q: row.sku })
      });

      let item = lookup.body?.data?.items?.find((entry: { sku: string }) => entry.sku.toLowerCase() === row.sku.toLowerCase());

      if (!item) {
        const created = await apiFetch(sessionToken, "/inventory/items", {
          method: "POST",
          body: {
            warehouseId,
            sku: row.sku,
            name: row.name,
            category: row.category,
            reorderPoint: row.reorderPoint,
            unitCostUzs: row.unitCostUzs || undefined
          }
        });
        if (!created.response.ok || !created.body?.data?.item) {
          return NextResponse.json(
            { message: created.body?.message || created.body?.error?.message || `Unable to create SKU ${row.sku}` },
            { status: created.response.status || 400 }
          );
        }
        item = created.body.data.item;
      }

      imported += 1;

      if (row.quantity > 0) {
        const movement = await apiFetch(sessionToken, "/inventory/movements", {
          method: "POST",
          body: {
            itemId: item.id,
            movementType: "inbound",
            quantity: String(row.quantity),
            reference
          }
        });
        if (!movement.response.ok) {
          return NextResponse.json(
            { message: movement.body?.message || movement.body?.error?.message || `Unable to post inbound for ${row.sku}` },
            { status: movement.response.status || 400 }
          );
        }
        movements += 1;
      }
    }

    return NextResponse.json({
      data: {
        imported,
        movements,
        fileName: file.name
      }
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to import Excel file." },
      { status: 500 }
    );
  }
}
