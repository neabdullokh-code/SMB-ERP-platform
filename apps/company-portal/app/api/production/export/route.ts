import { NextResponse } from "next/server";

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

function csvEscape(value: unknown) {
  const text = value == null ? "" : String(value);
  if (/["\n,]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export async function GET(request: Request) {
  const sessionToken = readCookie(request, "erp_auth_session");
  if (!sessionToken) {
    return NextResponse.json({ message: "Session not found", errorCode: "SESSION_INVALID" }, { status: 401 });
  }

  const response = await fetch(`${platformApiUrl()}/production/overview`, {
    headers: { "x-session-token": sessionToken },
    cache: "no-store"
  });

  const body = await response.json();
  if (!response.ok || !body?.data) {
    return NextResponse.json(body, { status: response.status });
  }

  const { boms = [], orders = [], scrap = [] } = body.data;
  const rows = [
    ["kind", "id", "code", "outputSku", "version", "bomId", "status", "plannedUnits", "producedUnits", "materialsCount", "reason", "quantity", "scheduledDate", "recordedAt"],
    ...boms.map((bom: { id: string; code: string; outputSku?: string; version?: string; materials?: Array<unknown> }) => [
      "bom",
      bom.id,
      bom.code,
      bom.outputSku ?? "",
      bom.version ?? "",
      "",
      "live",
      "",
      "",
      Array.isArray(bom.materials) ? bom.materials.length : 0,
      "",
      "",
      "",
      ""
    ]),
    ...orders.map((order: { id: string; bomId: string; status: string; plannedUnits: number; producedUnits: number; scheduledDate: string }) => [
      "order",
      order.id,
      "",
      "",
      "",
      order.bomId,
      order.status,
      order.plannedUnits,
      order.producedUnits,
      "",
      "",
      "",
      order.scheduledDate,
      ""
    ]),
    ...scrap.map((record: { id: string; productionOrderId: string; reason: string; quantity: number; recordedAt: string }) => [
      "scrap",
      record.id,
      "",
      "",
      "",
      record.productionOrderId,
      "",
      "",
      "",
      "",
      record.reason,
      record.quantity,
      "",
      record.recordedAt
    ])
  ];

  const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="production-export.csv"'
    }
  });
}
