import type {
  AuditEvent,
  BalanceSheet,
  BankPortfolioAnalytics,
  BankTenantHealth,
  Bill,
  CashFlowBucket,
  Counterparty,
  CounterpartyListItem,
  CreditApplicationDetail,
  CreditAssignRequest,
  CreditDecisionRequest,
  CreditQueueItem,
  CreateBillRequest,
  CreateInvoiceRequest,
  CreateManualJournalRequest,
  FinanceAccount,
  InventoryItem,
  InventoryMovement,
  Invoice,
  JournalLine,
  Payment,
  PaymentDirection,
  ProductionOrder,
  ProfitAndLoss,
  RecordBillPaymentRequest,
  RecordInvoicePaymentRequest,
  ServiceOrder,
  TenantFinanceSnapshot,
  TrialBalance
} from "@sqb/domain-types";

export interface PlatformApiClientOptions {
  baseUrl: string;
  headers?: HeadersInit;
}

interface Envelope<T> {
  data: T;
  meta: Record<string, unknown> | null;
  error: null;
}

/** 
 * Simple audit utility to log missing data during development 
 */
function auditData(label: string, data: any) {
  if (process.env.NODE_ENV !== "development") return;
  if (!data || typeof data !== "object") return;

  const isEnvelope = "data" in data && "error" in data;
  const target = isEnvelope ? data.data : data;

  const missing = Object.entries(data || {})
    .filter(([_, v]) => v === undefined || v === null)
    .map(([k]) => k);
  
  if (missing.length > 0) console.warn(`⚠️ [${label}] Missing/Null fields:`, missing);
}

async function requestJson<T>(baseUrl: string, path: string, headers?: HeadersInit): Promise<T> {
  const url = `${baseUrl}${path}`;
  
  if (process.env.NODE_ENV === "development") {
    console.group(`🔍 [GET] ${path}`);
    // Check if Authorization header exists without logging the actual secret
    const hasAuth = !!(headers as any)?.["Authorization"] || !!(headers as any)?.["authorization"];
    console.log(`Auth Header Present: ${hasAuth}`);
    console.log(`Full URL: ${url}`);
  }

  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      "content-type": "application/json",
      ...headers
    },
    cache: "no-store"
  });

  if (!response.ok) {
    if (process.env.NODE_ENV === "development") {
      const errorText = await response.text().catch(() => "Unknown Error");
      console.error(`❌ [API Error] ${response.status} ${response.statusText}`, errorText);
      console.groupEnd();
    }
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");
  const data = isJson ? await response.json() : await response.text();
  
  if (process.env.NODE_ENV === "development") {
    auditData("Backend -> Frontend", data);
    console.log("Response (Backend -> Frontend):", data);
    console.groupEnd();
  }

  return data as T;
}

async function requestPlatform<T>(baseUrl: string, path: string, init: RequestInit = {}, headers?: HeadersInit): Promise<T> {
  const url = `${baseUrl}${path}`;

  if (process.env.NODE_ENV === "development") {
    console.group(`🚀 [${init.method || "GET"}] ${path}`);
    const hasAuth = !!(headers as any)?.["Authorization"] || !!(init.headers as any)?.["Authorization"];
    console.log(`Auth Header Present: ${hasAuth}`);
    if (init.body) {
      const body = JSON.parse(init.body as string);
      auditData("Frontend -> Backend", body);
      console.log("Payload:", body);
    }
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...headers,
      ...init.headers
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    if (process.env.NODE_ENV === "development") {
      console.error(`❌ [API Error] ${response.status}`, errorBody);
      console.groupEnd();
    }
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");
  const data = isJson ? await response.json() : await response.text();

  if (process.env.NODE_ENV === "development") {
    console.log("Response (Backend -> Frontend):", data);
    console.groupEnd();
  }

  return data as T;
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      search.set(key, String(value));
    }
  }
  return search.size > 0 ? `?${search.toString()}` : "";
}

export function createPlatformApiClient(options: PlatformApiClientOptions) {
  const { baseUrl, headers } = options;

  return {
    // ── Operations ──────────────────────────────────────────
    getInventorySummary: () => requestJson<{ items: InventoryItem[]; movements: InventoryMovement[] }>(baseUrl, "/inventory/summary", headers),
    getProductionOrders: () => requestJson<{ orders: ProductionOrder[] }>(baseUrl, "/production/orders", headers),
    getServiceOrders: () => requestJson<{ serviceOrders: ServiceOrder[] }>(baseUrl, "/service-orders", headers),
    getBankPortfolio: (params?: {
      q?: string;
      region?: string;
      inventoryRisk?: "low" | "moderate" | "high";
      trend?: "up" | "flat" | "down";
      sort?: "score_desc" | "score_asc" | "tenant";
    }) => requestJson<{ tenants: BankTenantHealth[] }>(baseUrl, `/bank/portfolio${buildQuery(params ?? {})}`, headers),
    getBankPortfolioAnalytics: () =>
      requestJson<{ analytics: BankPortfolioAnalytics }>(baseUrl, "/bank/portfolio/analytics", headers),
    getAuditEvents: (params?: {
      category?: string;
      actorRole?: string;
      tenantId?: string;
      q?: string;
      from?: string;
      to?: string;
      limit?: number;
    }) => requestJson<{ events: AuditEvent[] }>(baseUrl, `/audit/events${buildQuery(params ?? {})}`, headers),
    getCreditQueue: (params?: {
      status?: "submitted" | "in_review" | "approved" | "counter_offered" | "declined";
      recommendation?: "approve" | "review" | "decline";
      priority?: "high" | "normal";
      q?: string;
      sort?: "submitted_desc" | "score_desc" | "tenant";
    }) => requestJson<{ applications: CreditQueueItem[] }>(baseUrl, `/bank/credit-queue${buildQuery(params ?? {})}`, headers),
    getCreditApplication: (applicationId: string) =>
      requestJson<{ application: CreditApplicationDetail }>(baseUrl, `/bank/credit-queue/${applicationId}`, headers),
    assignCreditApplication: (applicationId: string, payload: CreditAssignRequest) =>
      requestPlatform<{ application: CreditApplicationDetail }>(baseUrl, `/bank/credit-queue/${applicationId}/assign`, {
        method: "POST",
        body: JSON.stringify(payload)
      }, headers),
    submitCreditDecision: (applicationId: string, payload: CreditDecisionRequest) =>
      requestPlatform<{ application: CreditApplicationDetail }>(baseUrl, `/bank/credit-queue/${applicationId}/decision`, {
        method: "POST",
        body: JSON.stringify(payload)
      }, headers),

    // ── Finance: Accounts ───────────────────────────────────
    getFinanceAccounts: () => requestJson<Envelope<FinanceAccount[]>>(baseUrl, "/finance/accounts", headers),

    // ── Finance: Ledger ─────────────────────────────────────
    getFinanceLedger: (params?: { from?: string; to?: string; accountId?: string; page?: number }) =>
      requestJson<Envelope<JournalLine[]> & { meta: { page: number; pageSize: number; total: number } }>(
        baseUrl, `/finance/ledger${buildQuery(params ?? {})}`, headers
      ),

    // ── Finance: Invoices ───────────────────────────────────
    getInvoices: () => requestJson<Envelope<Invoice[]>>(baseUrl, "/finance/invoices", headers),
    createInvoice: (payload: CreateInvoiceRequest) =>
      requestPlatform<Envelope<Invoice>>(baseUrl, "/finance/invoices", { method: "POST", body: JSON.stringify(payload) }, headers),
    issueInvoice: (invoiceId: string) =>
      requestPlatform<Envelope<Invoice>>(baseUrl, `/finance/invoices/${invoiceId}/issue`, { method: "POST", body: JSON.stringify({}) }, headers),
    voidInvoice: (invoiceId: string) =>
      requestPlatform<Envelope<Invoice>>(baseUrl, `/finance/invoices/${invoiceId}/void`, { method: "POST", body: JSON.stringify({}) }, headers),
    recordInvoicePayment: (invoiceId: string, payload: RecordInvoicePaymentRequest) =>
      requestPlatform<Envelope<Invoice>>(baseUrl, `/finance/invoices/${invoiceId}/payments`, { method: "POST", body: JSON.stringify(payload) }, headers),

    // ── Finance: Bills ──────────────────────────────────────
    getBills: () => requestJson<Envelope<Bill[]>>(baseUrl, "/finance/bills", headers),
    createBill: (payload: CreateBillRequest) =>
      requestPlatform<Envelope<Bill>>(baseUrl, "/finance/bills", { method: "POST", body: JSON.stringify(payload) }, headers),
    postBill: (billId: string) =>
      requestPlatform<Envelope<Bill>>(baseUrl, `/finance/bills/${billId}/post`, { method: "POST", body: JSON.stringify({}) }, headers),
    voidBill: (billId: string) =>
      requestPlatform<Envelope<Bill>>(baseUrl, `/finance/bills/${billId}/void`, { method: "POST", body: JSON.stringify({}) }, headers),
    recordBillPayment: (billId: string, payload: RecordBillPaymentRequest) =>
      requestPlatform<Envelope<Bill>>(baseUrl, `/finance/bills/${billId}/payments`, { method: "POST", body: JSON.stringify(payload) }, headers),

    // ── Finance: Journals ───────────────────────────────────
    createManualJournal: (payload: CreateManualJournalRequest) =>
      requestPlatform<Envelope<{ batchId: string }>>(baseUrl, "/finance/journals/manual", { method: "POST", body: JSON.stringify(payload) }, headers),

    // ── Finance: Cash Flow ──────────────────────────────────
    getCashFlow: (params?: { from?: string; to?: string; bucket?: "month" }) =>
      requestJson<Envelope<CashFlowBucket[]>>(baseUrl, `/finance/cash-flow${buildQuery(params ?? {})}`, headers),

    // ── Finance: Counterparties ─────────────────────────────
    getCounterparties: () => requestJson<Envelope<CounterpartyListItem[]>>(baseUrl, "/finance/counterparties", headers),
    getCounterparty: (counterpartyId: string) =>
      requestJson<Envelope<Counterparty>>(baseUrl, `/finance/counterparties/${counterpartyId}`, headers),

    // ── Finance: Payments ───────────────────────────────────
    getPayments: (params?: { from?: string; to?: string; direction?: PaymentDirection }) =>
      requestJson<Envelope<Payment[]>>(baseUrl, `/finance/payments${buildQuery(params ?? {})}`, headers),

    // ── Finance: Reports ────────────────────────────────────
    getTrialBalance: (params?: { from?: string; to?: string }) =>
      requestJson<Envelope<TrialBalance>>(baseUrl, `/finance/reports/trial-balance${buildQuery(params ?? {})}`, headers),
    getProfitAndLoss: (params?: { from?: string; to?: string }) =>
      requestJson<Envelope<ProfitAndLoss>>(baseUrl, `/finance/reports/profit-and-loss${buildQuery(params ?? {})}`, headers),
    getBalanceSheet: (params?: { asOfDate?: string }) =>
      requestJson<Envelope<BalanceSheet>>(baseUrl, `/finance/reports/balance-sheet${buildQuery(params ?? {})}`, headers),

    // ── Finance: Bank Snapshot ──────────────────────────────
    getFinanceSnapshot: (tenantId: string) =>
      requestJson<Envelope<TenantFinanceSnapshot>>(baseUrl, `/finance/snapshot/${tenantId}`, headers),

    // ── Finance: PDF Downloads ──────────────────────────────
    getInvoicePdfUrl: (invoiceId: string) => `${baseUrl}/finance/invoices/${invoiceId}/pdf`,
    getBillPdfUrl: (billId: string) => `${baseUrl}/finance/bills/${billId}/pdf`
  };
}

export * from "./auth-gateway";
