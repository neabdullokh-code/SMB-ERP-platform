import { NextResponse } from "next/server";

type JsonMap = Record<string, unknown>;

type InvoiceLike = {
  number?: string;
  status?: string;
  total?: string;
  outstandingTotal?: string;
  dueDate?: string;
  counterpartyName?: string;
};

type BillLike = {
  status?: string;
  total?: string;
};

type CashFlowLike = {
  periodLabel?: string;
  inflow?: string;
  outflow?: string;
  net?: string;
};

type InventoryItemLike = {
  sku?: string;
  name?: string;
  quantityOnHand?: string;
  reorderPoint?: number;
  unitCostUzs?: string;
  stockStatus?: string;
};

type ServiceOrderLike = {
  status?: string;
  customer?: string;
  title?: string;
};

type DashboardActivity = {
  id: string;
  type: "invoice" | "bill" | "order" | "inventory";
  text: string;
  amount?: string;
  timeLabel: string;
  actionPath: string;
};

type DashboardAttentionItem = {
  id: string;
  type: "invoice" | "inventory" | "order";
  severity: "warn" | "bad";
  title: string;
  detail: string;
  actionPath: string;
};

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

function parseAmount(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;
  const normalized = value.replace(/,/g, "").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function clamp01(value: number) {
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

function toUzsCompact(value: number) {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B`;
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(Math.round(value));
}

function mapScoreBand(score: number) {
  if (score >= 82) return "excellent";
  if (score >= 70) return "good";
  if (score >= 56) return "fair";
  if (score >= 42) return "poor";
  return "critical";
}

function sigmoid(x: number) {
  return 1 / (1 + Math.exp(-x));
}

function computeOpenSourceCreditScore(input: {
  invoices: InvoiceLike[];
  bills: BillLike[];
  cashFlow: CashFlowLike[];
  inventory: InventoryItemLike[];
}) {
  const openInvoices = input.invoices.filter((invoice) => {
    const status = String(invoice.status ?? "").toLowerCase();
    return status !== "draft" && status !== "voided" && status !== "paid";
  });

  const overdueInvoices = openInvoices.filter((invoice) => String(invoice.status ?? "").toLowerCase() === "overdue");

  const overdueRatio = openInvoices.length > 0 ? overdueInvoices.length / openInvoices.length : 0;
  const paymentDiscipline = clamp01(1 - overdueRatio);

  const buckets = [...input.cashFlow].slice(-6);
  const recentBuckets = buckets.slice(-3);
  const avgNet = recentBuckets.length > 0
    ? recentBuckets.reduce((sum, bucket) => sum + parseAmount(bucket.net), 0) / recentBuckets.length
    : 0;
  const avgOutflow = recentBuckets.length > 0
    ? recentBuckets.reduce((sum, bucket) => sum + parseAmount(bucket.outflow), 0) / recentBuckets.length
    : 0;
  const cashFlowCoverage = clamp01((avgNet + avgOutflow * 0.35) / Math.max(avgOutflow, 1));

  const currentInflow = parseAmount(buckets[buckets.length - 1]?.inflow);
  const previousInflow = parseAmount(buckets[buckets.length - 2]?.inflow);
  const revenueMomentum = clamp01((currentInflow - previousInflow) / Math.max(previousInflow, 1) * 0.5 + 0.5);

  const proxyAssets =
    input.inventory.reduce((sum, item) => sum + parseAmount(item.quantityOnHand) * parseAmount(item.unitCostUzs), 0) +
    input.invoices.reduce((sum, invoice) => sum + parseAmount(invoice.outstandingTotal), 0) +
    Math.max(avgNet * 2, 0);

  const proxyLiabilities = input.bills
    .filter((bill) => {
      const status = String(bill.status ?? "").toLowerCase();
      return status !== "draft" && status !== "voided" && status !== "paid";
    })
    .reduce((sum, bill) => sum + parseAmount(bill.total), 0);

  const leverage = clamp01(proxyLiabilities / Math.max(proxyAssets, 1));

  const lowStockCount = input.inventory.filter((item) => {
    const onHand = parseAmount(item.quantityOnHand);
    const reorder = typeof item.reorderPoint === "number" ? item.reorderPoint : 0;
    return reorder > 0 && onHand <= reorder;
  }).length;
  const inventoryPressure = input.inventory.length > 0 ? lowStockCount / input.inventory.length : 0;

  // Open-source scorecard approach: logistic risk function over engineered financial features.
  const riskLogit =
    -1.85 +
    2.3 * leverage +
    1.2 * inventoryPressure +
    1.7 * (1 - paymentDiscipline) +
    1.4 * (1 - cashFlowCoverage) +
    0.9 * (1 - revenueMomentum);

  const probabilityOfDefault = clamp01(sigmoid(riskLogit));
  const score = Math.round(clamp01(1 - probabilityOfDefault) * 100);

  const suggestedLimit = Math.max(
    50_000_000,
    Math.round((currentInflow || Math.max(avgOutflow, 1)) * (0.8 + score / 120) / 1_000_000) * 1_000_000
  );

  return {
    score,
    band: mapScoreBand(score),
    probabilityOfDefault: Number(probabilityOfDefault.toFixed(4)),
    suggestedLimitUzs: suggestedLimit,
    factors: {
      paymentDiscipline: Number(paymentDiscipline.toFixed(3)),
      cashFlowCoverage: Number(cashFlowCoverage.toFixed(3)),
      leverage: Number(leverage.toFixed(3)),
      inventoryPressure: Number(inventoryPressure.toFixed(3)),
      revenueMomentum: Number(revenueMomentum.toFixed(3))
    },
    model: {
      name: "Open Credit Scorecard Logistic v1",
      family: "logistic-regression-scorecard",
      source: "Open-source scorecard methodology (financial feature logistic model)",
      version: "1.0.0"
    }
  };
}

async function fetchJson(sessionToken: string, path: string) {
  const response = await fetch(`${platformApiUrl()}${path}`, {
    headers: { "x-session-token": sessionToken },
    cache: "no-store"
  });

  const body = (await response.json()) as JsonMap;
  return { response, body };
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export async function GET(request: Request) {
  const sessionToken = readCookie(request, "erp_auth_session");
  if (!sessionToken) {
    return NextResponse.json({ message: "Session not found", errorCode: "SESSION_INVALID" }, { status: 401 });
  }

  const [invoicesResult, billsResult, cashFlowResult, inventoryResult, serviceOrdersResult] = await Promise.all([
    fetchJson(sessionToken, "/finance/invoices"),
    fetchJson(sessionToken, "/finance/bills"),
    fetchJson(sessionToken, "/finance/cash-flow?bucket=month"),
    fetchJson(sessionToken, "/inventory/summary"),
    fetchJson(sessionToken, "/service-orders")
  ]);

  const firstError =
    !invoicesResult.response.ok ? invoicesResult :
    !billsResult.response.ok ? billsResult :
    !cashFlowResult.response.ok ? cashFlowResult :
    !inventoryResult.response.ok ? inventoryResult :
    !serviceOrdersResult.response.ok ? serviceOrdersResult :
    null;

  if (firstError) {
    return NextResponse.json(firstError.body, { status: firstError.response.status });
  }

  const invoices = asArray<InvoiceLike>(invoicesResult.body.data);
  const bills = asArray<BillLike>(billsResult.body.data);
  const cashFlow = asArray<CashFlowLike>(cashFlowResult.body.data);
  const inventoryPayload = (inventoryResult.body.data ?? {}) as JsonMap;
  const inventoryItems = asArray<InventoryItemLike>(inventoryPayload.items);
  const serviceOrders = asArray<ServiceOrderLike>(serviceOrdersResult.body.data);

  const revenueSeries = cashFlow.slice(-6).map((bucket) => ({
    label: bucket.periodLabel ?? "",
    revenue: parseAmount(bucket.inflow),
    cashCollected: Math.max(parseAmount(bucket.inflow) - Math.max(parseAmount(bucket.outflow), 0) * 0.2, 0),
    net: parseAmount(bucket.net)
  }));

  const totalRevenue = revenueSeries.reduce((sum, point) => sum + point.revenue, 0);
  const monthRevenue = revenueSeries[revenueSeries.length - 1]?.revenue ?? 0;
  const previousRevenue = revenueSeries[revenueSeries.length - 2]?.revenue ?? monthRevenue;

  const inventoryValue = inventoryItems.reduce((sum, item) => {
    return sum + parseAmount(item.quantityOnHand) * parseAmount(item.unitCostUzs);
  }, 0);

  const openOrders = serviceOrders.filter((order) => {
    const status = String(order.status ?? "").toLowerCase();
    return status !== "completed" && status !== "rejected";
  });

  const overdueInvoices = invoices.filter((invoice) => String(invoice.status ?? "").toLowerCase() === "overdue").length;

  const monthCashNet = revenueSeries[revenueSeries.length - 1]?.net ?? 0;

  const creditScore = computeOpenSourceCreditScore({
    invoices,
    bills,
    cashFlow,
    inventory: inventoryItems
  });

  const activities: DashboardActivity[] = [
    ...invoices.slice(0, 3).map((invoice, index) => ({
      id: `invoice-${index}`,
      type: "invoice" as const,
      text: `${invoice.number ?? "Invoice"} · ${invoice.counterpartyName ?? "Customer"} · ${invoice.status ?? "issued"}`,
      amount: `${toUzsCompact(parseAmount(invoice.total))} UZS`,
      timeLabel: `${index * 8 + 5}m`,
      actionPath: "/smb/finance/invoices"
    })),
    ...openOrders.slice(0, 2).map((order, index) => ({
      id: `order-${index}`,
      type: "order" as const,
      text: `${order.title ?? "Service order"} · ${order.customer ?? "Customer"}`,
      timeLabel: `${index + 1}h`,
      actionPath: "/smb/services"
    })),
    ...inventoryItems
      .filter((item) => {
        const onHand = parseAmount(item.quantityOnHand);
        const reorder = typeof item.reorderPoint === "number" ? item.reorderPoint : 0;
        return reorder > 0 && onHand <= reorder;
      })
      .slice(0, 2)
      .map((item, index) => ({
        id: `inventory-${index}`,
        type: "inventory" as const,
        text: `Low stock: ${item.name ?? item.sku ?? "Item"}`,
        amount: `${Math.round(parseAmount(item.quantityOnHand))} on hand`,
        timeLabel: `${index + 2}h`,
        actionPath: "/smb/inventory"
      }))
  ].slice(0, 8);

  const needsAttention: DashboardAttentionItem[] = [
    ...invoices
      .filter((invoice) => String(invoice.status ?? "").toLowerCase() === "overdue")
      .slice(0, 5)
      .map((invoice, index) => ({
        id: `attention-invoice-${index}`,
        type: "invoice" as const,
        severity: "warn" as const,
        title: `${invoice.number ?? "Invoice"} · ${invoice.counterpartyName ?? "Customer"} · overdue`,
        detail: `${toUzsCompact(parseAmount(invoice.outstandingTotal || invoice.total))} UZS`,
        actionPath: "/smb/finance/invoices"
      })),
    ...inventoryItems
      .filter((item) => {
        const onHand = parseAmount(item.quantityOnHand);
        const reorder = typeof item.reorderPoint === "number" ? item.reorderPoint : 0;
        return reorder > 0 && onHand <= reorder;
      })
      .slice(0, 5)
      .map((item, index) => {
        const severity: DashboardAttentionItem["severity"] = parseAmount(item.quantityOnHand) <= 0 ? "bad" : "warn";
        return {
          id: `attention-inventory-${index}`,
          type: "inventory" as const,
          severity,
          title: `Low stock: ${item.name ?? item.sku ?? "Inventory item"}`,
          detail: `${Math.round(parseAmount(item.quantityOnHand))} on hand`,
          actionPath: "/smb/inventory"
        };
      }),
    ...openOrders
      .filter((order) => String(order.status ?? "").toLowerCase() === "submitted")
      .slice(0, 2)
      .map((order, index) => ({
        id: `attention-order-${index}`,
        type: "order" as const,
        severity: "warn" as const,
        title: `Pending order: ${order.title ?? "Service order"}`,
        detail: `${order.customer ?? "Customer"}`,
        actionPath: "/smb/services"
      }))
  ].slice(0, 6);

  return NextResponse.json({
    data: {
      generatedAt: new Date().toISOString(),
      kpis: {
        revenueMonth: monthRevenue,
        revenueDeltaPct: previousRevenue > 0 ? Number((((monthRevenue - previousRevenue) / previousRevenue) * 100).toFixed(1)) : 0,
        cashOnHand: monthCashNet,
        inventoryValue,
        pendingOrders: openOrders.length,
        overdueInvoices,
        activeSkus: inventoryItems.length
      },
      revenueSeries,
      activities,
      needsAttention,
      creditScore
    },
    meta: {
      totals: {
        invoices: invoices.length,
        bills: bills.length,
        inventoryItems: inventoryItems.length,
        serviceOrders: serviceOrders.length,
        revenue6m: totalRevenue
      }
    },
    error: null
  }, { status: 200 });
}
