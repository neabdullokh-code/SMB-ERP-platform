import { randomUUID } from "node:crypto";
import Decimal from "decimal.js";
import type {
  Bill,
  BillStatus,
  CashFlowBucket,
  CounterpartyType,
  CreateBillRequest,
  CreateInvoiceRequest,
  CreateManualJournalRequest,
  EntrySide,
  FinanceAccount,
  FinanceAccountCategory,
  FinanceDocumentLine,
  Invoice,
  InvoiceStatus,
  JournalLine,
  PaymentDirection,
  RecordBillPaymentRequest,
  RecordInvoicePaymentRequest,
  TenantFinanceSnapshot
} from "@sqb/domain-types";
import type { PoolClient, QueryResultRow } from "pg";
import { withDb } from "../../lib/db.js";

const MONEY_SCALE = 2;
const DEFAULT_PAGE_SIZE = 50;
const DEFAULT_CURRENCY = "UZS" as const;

type FinanceSystemKey =
  | "cash"
  | "accounts_receivable"
  | "inventory"
  | "vat_receivable"
  | "accounts_payable"
  | "vat_payable"
  | "retained_earnings"
  | "sales_revenue"
  | "cost_of_goods_sold"
  | "operating_expense";

type FinanceDocumentRecord = {
  id: string;
  tenant_id: string;
  counterparty_id: string;
  counterparty_name: string;
  number: string;
  status: string;
  issue_date: string | null;
  due_date: string;
  subtotal: string;
  tax_total: string;
  total: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  paid_total: string;
  outstanding_total: string;
};

type FinanceLineRecord = {
  id: string;
  document_id: string;
  description: string;
  quantity: string;
  unit_price: string;
  tax_rate: string;
  line_subtotal: string;
  tax_total: string;
  line_total: string;
  account_id: string;
};

type AccountLookup = {
  id: string;
  code: string;
  name: string;
  category: FinanceAccountCategory;
  normal_side: EntrySide;
  system_key: string | null;
};

type CounterpartyRow = {
  id: string;
  tenant_id: string;
  name: string;
  type: CounterpartyType;
  tax_id: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
};

type DocumentKind = "invoice" | "bill";

type BatchLineInput = {
  accountId: string;
  entrySide: EntrySide;
  amount: Decimal;
  memo?: string;
  counterpartyId?: string;
};

type CoreAccountMap = Record<FinanceSystemKey, AccountLookup>;

class FinanceUnavailableError extends Error {
  constructor() {
    super("Finance persistence unavailable");
  }
}

const DEFAULT_CHART: Array<{
  code: string;
  name: string;
  category: FinanceAccountCategory;
  normalSide: EntrySide;
  systemKey: FinanceSystemKey;
}> = [
    { code: "1001", name: "Cash", category: "asset", normalSide: "debit", systemKey: "cash" },
    { code: "1100", name: "Accounts receivable", category: "asset", normalSide: "debit", systemKey: "accounts_receivable" },
    { code: "1200", name: "Inventory", category: "asset", normalSide: "debit", systemKey: "inventory" },
    { code: "1150", name: "Recoverable VAT", category: "asset", normalSide: "debit", systemKey: "vat_receivable" },
    { code: "2001", name: "Accounts payable", category: "liability", normalSide: "credit", systemKey: "accounts_payable" },
    { code: "2100", name: "VAT payable", category: "liability", normalSide: "credit", systemKey: "vat_payable" },
    { code: "3001", name: "Retained earnings", category: "equity", normalSide: "credit", systemKey: "retained_earnings" },
    { code: "4000", name: "Sales revenue", category: "revenue", normalSide: "credit", systemKey: "sales_revenue" },
    { code: "5000", name: "Cost of goods sold", category: "expense", normalSide: "debit", systemKey: "cost_of_goods_sold" },
    { code: "5100", name: "Operating expenses", category: "expense", normalSide: "debit", systemKey: "operating_expense" }
  ];

function money(value: Decimal.Value) {
  return new Decimal(value).toDecimalPlaces(MONEY_SCALE, Decimal.ROUND_HALF_UP);
}

function moneyText(value: Decimal.Value) {
  return money(value).toFixed(MONEY_SCALE);
}

function parseMoney(value: Decimal.Value) {
  try {
    return money(value);
  } catch {
    throw new Error("Amount must be a valid decimal string.");
  }
}

function isoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("Date fields must use YYYY-MM-DD.");
  }

  return value;
}

function currentDate() {
  return new Date().toISOString().slice(0, 10);
}

function monthStart(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), 1)).toISOString().slice(0, 10);
}

function formatMonthLabel(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(`${value}T00:00:00Z`));
}

async function runWithDb<T>(operation: (client: PoolClient) => Promise<T>) {
  const result = await withDb(async (pool) => {
    const client = await pool.connect();

    try {
      return await operation(client);
    } finally {
      client.release();
    }
  });

  if (result === null) {
    throw new FinanceUnavailableError();
  }

  return result;
}

/**
 * Open a tenant-scoped transaction on an already-checked-out client. Pins
 * `app.tenant_id` via `SET LOCAL` so RLS policies (008_finance_rls.sql) get a
 * real value to compare against for the duration of this transaction. Every
 * finance BEGIN in this store should go through this helper.
 */
async function beginTenantTx(client: PoolClient, tenantId: string) {
  await client.query("BEGIN");
  // Postgres `SET LOCAL` does not accept bind parameters for the value, so
  // we use set_config(name, value, is_local=true) which does.
  await client.query(`select set_config('app.tenant_id', $1, true)`, [tenantId]);
}

/**
 * Acquire a row-level lock on the invoice header so a concurrent post/void/
 * payment can't interleave with the current transaction. Must be called
 * BEFORE loadInvoicesInternal inside any posting transaction.
 */
async function lockInvoiceRow(client: PoolClient, tenantId: string, invoiceId: string) {
  await client.query(
    `select id from finance_invoices where tenant_id = $1 and id = $2 for update`,
    [tenantId, invoiceId]
  );
}

async function lockBillRow(client: PoolClient, tenantId: string, billId: string) {
  await client.query(
    `select id from finance_bills where tenant_id = $1 and id = $2 for update`,
    [tenantId, billId]
  );
}

function assertPositive(value: Decimal, fieldName: string) {
  if (value.lte(0)) {
    throw new Error(`${fieldName} must be greater than zero.`);
  }
}

function todayIsAfter(dateValue: string) {
  return dateValue < currentDate();
}

function resolveIssuedInvoiceStatus(outstanding: Decimal, total: Decimal, dueDate: string): InvoiceStatus {
  if (outstanding.lte(0)) {
    return "paid";
  }

  if (outstanding.lt(total)) {
    return "partially_paid";
  }

  return todayIsAfter(dueDate) ? "overdue" : "issued";
}

function resolvePostedBillStatus(outstanding: Decimal, total: Decimal, dueDate: string): BillStatus {
  if (outstanding.lte(0)) {
    return "paid";
  }

  if (outstanding.lt(total)) {
    return "partially_paid";
  }

  return todayIsAfter(dueDate) ? "overdue" : "posted";
}

function ensureSingleCurrency(currency?: string) {
  if (currency && currency !== DEFAULT_CURRENCY) {
    throw new Error("Only UZS is supported in finance v1.");
  }
}

async function createBatch(
  client: PoolClient,
  input: {
    tenantId: string;
    sourceType: "invoice_issue" | "bill_post" | "payment" | "manual_adjustment" | "opening_balance" | "reversal";
    sourceId?: string;
    memo?: string;
    postedAt?: string;
    actorUserId: string;
    reversalOfBatchId?: string;
    lines: BatchLineInput[];
  }
) {
  if (input.lines.length < 2) {
    throw new Error("At least two journal lines are required.");
  }

  const debitTotal = input.lines
    .filter((line) => line.entrySide === "debit")
    .reduce((sum, line) => sum.plus(line.amount), new Decimal(0));
  const creditTotal = input.lines
    .filter((line) => line.entrySide === "credit")
    .reduce((sum, line) => sum.plus(line.amount), new Decimal(0));

  if (!debitTotal.equals(creditTotal)) {
    throw new Error("Journal batch is not balanced.");
  }

  const batchId = randomUUID();
  const postedAt = input.postedAt ? `${isoDate(input.postedAt)}T00:00:00.000Z` : new Date().toISOString();

  await client.query(
    `insert into finance_journal_batches (
      id,
      tenant_id,
      source_type,
      source_id,
      memo,
      posted_at,
      reversal_of_batch_id,
      created_by
    ) values ($1, $2, $3, $4, $5, $6::timestamptz, $7, $8)`,
    [batchId, input.tenantId, input.sourceType, input.sourceId ?? null, input.memo ?? null, postedAt, input.reversalOfBatchId ?? null, input.actorUserId]
  );

  for (const line of input.lines) {
    await client.query(
      `insert into finance_journal_lines (
        id,
        tenant_id,
        batch_id,
        account_id,
        counterparty_id,
        entry_side,
        amount,
        memo
      ) values ($1, $2, $3, $4, $5, $6, $7::numeric, $8)`,
      [randomUUID(), input.tenantId, batchId, line.accountId, line.counterpartyId ?? null, line.entrySide, moneyText(line.amount), line.memo ?? null]
    );
  }

  return batchId;
}

export async function seedDefaultFinanceAccountsForTenant(client: PoolClient, tenantId: string, actorUserId?: string) {
  for (const account of DEFAULT_CHART) {
    await client.query(
      `insert into finance_accounts (
        tenant_id,
        code,
        name,
        category,
        normal_side,
        currency,
        system_key,
        is_system,
        created_by,
        updated_by
      ) values (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        true,
        $8,
        $8
      )
      on conflict (tenant_id, code) do update
      set name = excluded.name,
          category = excluded.category,
          normal_side = excluded.normal_side,
          currency = excluded.currency,
          system_key = excluded.system_key,
          is_system = true,
          updated_by = excluded.updated_by,
          updated_at = now()`,
      [tenantId, account.code, account.name, account.category, account.normalSide, DEFAULT_CURRENCY, account.systemKey, actorUserId ?? null]
    );
  }
}

async function loadCoreAccounts(client: PoolClient, tenantId: string) {
  const result = await client.query<AccountLookup>(
    `select id, code, name, category, normal_side, system_key
     from finance_accounts
     where tenant_id = $1
       and system_key is not null`,
    [tenantId]
  );

  const records = Object.fromEntries(
    result.rows
      .filter((row): row is AccountLookup & { system_key: FinanceSystemKey } => Boolean(row.system_key))
      .map((row) => [row.system_key, row])
  ) as Partial<CoreAccountMap>;

  const missing = DEFAULT_CHART.map((account) => account.systemKey).filter((key) => !records[key]);
  if (missing.length > 0) {
    throw new Error(`Tenant chart of accounts is incomplete: ${missing.join(", ")}`);
  }

  return records as CoreAccountMap;
}

async function loadAccountById(client: PoolClient, tenantId: string, accountId: string) {
  const result = await client.query<AccountLookup>(
    `select id, code, name, category, normal_side, system_key
     from finance_accounts
     where tenant_id = $1
       and id = $2`,
    [tenantId, accountId]
  );

  if (result.rowCount === 0) {
    throw new Error("Finance account not found for tenant.");
  }

  return result.rows[0];
}

async function resolveCashAccount(client: PoolClient, tenantId: string, cashAccountId?: string) {
  if (cashAccountId) {
    const account = await loadAccountById(client, tenantId, cashAccountId);
    if (account.category !== "asset") {
      throw new Error("Cash account must be an asset account.");
    }
    return account;
  }

  const coreAccounts = await loadCoreAccounts(client, tenantId);
  return coreAccounts.cash;
}

async function upsertCounterparty(
  client: PoolClient,
  input: {
    tenantId: string;
    counterpartyId?: string;
    name: string;
    type: CounterpartyType;
    email?: string;
    phone?: string;
    taxId?: string;
  }
) {
  const name = input.name.trim();
  if (!name) {
    throw new Error("Counterparty name is required.");
  }

  if (input.counterpartyId) {
    const existing = await client.query<CounterpartyRow>(
      `select id, tenant_id, name, type, tax_id, phone, email, created_at, updated_at
       from finance_counterparties
       where tenant_id = $1
         and id = $2`,
      [input.tenantId, input.counterpartyId]
    );

    if (existing.rowCount === 0) {
      throw new Error("Counterparty not found for tenant.");
    }

    const nextType =
      existing.rows[0].type === input.type || existing.rows[0].type === "both" || input.type === "both"
        ? existing.rows[0].type
        : "both";

    await client.query(
      `update finance_counterparties
       set name = $3,
           type = $4,
           tax_id = coalesce($5, tax_id),
           phone = coalesce($6, phone),
           email = coalesce($7, email),
           updated_at = now()
       where tenant_id = $1
         and id = $2`,
      [input.tenantId, input.counterpartyId, name, nextType, input.taxId ?? null, input.phone ?? null, input.email ?? null]
    );

    return input.counterpartyId;
  }

  const existingByName = await client.query<{ id: string; type: CounterpartyType }>(
    `select id, type
     from finance_counterparties
     where tenant_id = $1
       and lower(name) = lower($2)
     limit 1`,
    [input.tenantId, name]
  );

  if ((existingByName.rowCount ?? 0) > 0) {
    const nextType =
      existingByName.rows[0].type === input.type || existingByName.rows[0].type === "both" || input.type === "both"
        ? existingByName.rows[0].type
        : "both";

    await client.query(
      `update finance_counterparties
       set type = $3,
           tax_id = coalesce($4, tax_id),
           phone = coalesce($5, phone),
           email = coalesce($6, email),
           updated_at = now()
       where tenant_id = $1
         and id = $2`,
      [input.tenantId, existingByName.rows[0].id, nextType, input.taxId ?? null, input.phone ?? null, input.email ?? null]
    );

    return existingByName.rows[0].id;
  }

  const id = randomUUID();
  await client.query(
    `insert into finance_counterparties (
      id,
      tenant_id,
      name,
      type,
      tax_id,
      phone,
      email
    ) values ($1, $2, $3, $4, $5, $6, $7)`,
    [id, input.tenantId, name, input.type, input.taxId ?? null, input.phone ?? null, input.email ?? null]
  );

  return id;
}

async function nextDocumentNumber(client: PoolClient, tenantId: string, kind: DocumentKind) {
  const tableName = kind === "invoice" ? "finance_invoices" : "finance_bills";
  const prefix = kind === "invoice" ? "INV" : "BILL";
  const result = await client.query<{ count: string }>(`select count(*)::text as count from ${tableName} where tenant_id = $1`, [tenantId]);
  const next = Number(result.rows[0]?.count ?? "0") + 1;
  return `${prefix}-${String(next).padStart(4, "0")}`;
}

function mapDocumentLines(lines: FinanceLineRecord[]): FinanceDocumentLine[] {
  return lines.map((line) => ({
    id: line.id,
    description: line.description,
    quantity: moneyText(line.quantity),
    unitPrice: moneyText(line.unit_price),
    taxRate: moneyText(line.tax_rate),
    lineSubtotal: moneyText(line.line_subtotal),
    taxTotal: moneyText(line.tax_total),
    lineTotal: moneyText(line.line_total),
    accountId: line.account_id
  }));
}

async function loadInvoiceLines(client: PoolClient, invoiceIds: string[]) {
  if (invoiceIds.length === 0) {
    return new Map<string, FinanceDocumentLine[]>();
  }

  const result = await client.query<FinanceLineRecord>(
    `select
       id,
       invoice_id as document_id,
       description,
       quantity::text,
       unit_price::text,
       tax_rate::text,
       line_subtotal::text,
       tax_total::text,
       line_total::text,
       revenue_account_id as account_id
     from finance_invoice_lines
     where invoice_id = any($1::uuid[])
     order by position asc, created_at asc`,
    [invoiceIds]
  );

  const grouped = new Map<string, FinanceDocumentLine[]>();
  for (const row of result.rows) {
    const bucket = grouped.get(row.document_id) ?? [];
    bucket.push(...mapDocumentLines([row]));
    grouped.set(row.document_id, bucket);
  }

  return grouped;
}

async function loadBillLines(client: PoolClient, billIds: string[]) {
  if (billIds.length === 0) {
    return new Map<string, FinanceDocumentLine[]>();
  }

  const result = await client.query<FinanceLineRecord>(
    `select
       id,
       bill_id as document_id,
       description,
       quantity::text,
       unit_price::text,
       tax_rate::text,
       line_subtotal::text,
       tax_total::text,
       line_total::text,
       expense_account_id as account_id
     from finance_bill_lines
     where bill_id = any($1::uuid[])
     order by position asc, created_at asc`,
    [billIds]
  );

  const grouped = new Map<string, FinanceDocumentLine[]>();
  for (const row of result.rows) {
    const bucket = grouped.get(row.document_id) ?? [];
    bucket.push(...mapDocumentLines([row]));
    grouped.set(row.document_id, bucket);
  }

  return grouped;
}

function mapInvoice(record: FinanceDocumentRecord, lines: FinanceDocumentLine[]): Invoice {
  const total = parseMoney(record.total);
  const outstanding = parseMoney(record.outstanding_total);
  const status = record.status === "draft" || record.status === "voided"
    ? (record.status as InvoiceStatus)
    : resolveIssuedInvoiceStatus(outstanding, total, record.due_date);

  return {
    id: record.id,
    tenantId: record.tenant_id,
    counterpartyId: record.counterparty_id,
    counterpartyName: record.counterparty_name,
    number: record.number,
    status,
    currency: DEFAULT_CURRENCY,
    issueDate: record.issue_date ?? undefined,
    dueDate: record.due_date,
    subtotal: moneyText(record.subtotal),
    taxTotal: moneyText(record.tax_total),
    total: moneyText(record.total),
    outstandingTotal: moneyText(record.outstanding_total),
    collectedTotal: moneyText(record.paid_total),
    notes: record.notes ?? undefined,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    lines
  };
}

function mapBill(record: FinanceDocumentRecord, lines: FinanceDocumentLine[]): Bill {
  const total = parseMoney(record.total);
  const outstanding = parseMoney(record.outstanding_total);
  const status = record.status === "draft" || record.status === "voided"
    ? (record.status as BillStatus)
    : resolvePostedBillStatus(outstanding, total, record.due_date);

  return {
    id: record.id,
    tenantId: record.tenant_id,
    counterpartyId: record.counterparty_id,
    counterpartyName: record.counterparty_name,
    number: record.number,
    status,
    currency: DEFAULT_CURRENCY,
    issueDate: record.issue_date ?? undefined,
    dueDate: record.due_date,
    subtotal: moneyText(record.subtotal),
    taxTotal: moneyText(record.tax_total),
    total: moneyText(record.total),
    outstandingTotal: moneyText(record.outstanding_total),
    paidTotal: moneyText(record.paid_total),
    notes: record.notes ?? undefined,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    lines
  };
}

async function loadInvoicesInternal(client: PoolClient, tenantId: string, invoiceId?: string) {
  const params: Array<string | string[]> = [tenantId];
  let whereClause = `where fi.tenant_id = $1`;
  if (invoiceId) {
    params.push(invoiceId);
    whereClause += ` and fi.id = $2`;
  }

  const invoices = await client.query<FinanceDocumentRecord>(
    `select
       fi.id,
       fi.tenant_id,
       fi.counterparty_id,
       fc.name as counterparty_name,
       fi.number,
       fi.status,
       fi.issue_date::text,
       fi.due_date::text,
       fi.subtotal::text,
       fi.tax_total::text,
       fi.total::text,
       fi.notes,
       fi.created_at::text,
       fi.updated_at::text,
       coalesce(sum(fpa.amount), 0)::text as paid_total,
       (fi.total - coalesce(sum(fpa.amount), 0))::text as outstanding_total
     from finance_invoices fi
     join finance_counterparties fc on fc.id = fi.counterparty_id
     left join finance_payment_allocations fpa on fpa.invoice_id = fi.id
     ${whereClause}
     group by fi.id, fc.name
     order by coalesce(fi.issue_date, fi.created_at::date) desc, fi.created_at desc`,
    params
  );

  const linesByInvoice = await loadInvoiceLines(client, invoices.rows.map((row) => row.id));
  return invoices.rows.map((row) => mapInvoice(row, linesByInvoice.get(row.id) ?? []));
}

async function loadBillsInternal(client: PoolClient, tenantId: string, billId?: string) {
  const params: Array<string | string[]> = [tenantId];
  let whereClause = `where fb.tenant_id = $1`;
  if (billId) {
    params.push(billId);
    whereClause += ` and fb.id = $2`;
  }

  const bills = await client.query<FinanceDocumentRecord>(
    `select
       fb.id,
       fb.tenant_id,
       fb.counterparty_id,
       fc.name as counterparty_name,
       fb.number,
       fb.status,
       fb.issue_date::text,
       fb.due_date::text,
       fb.subtotal::text,
       fb.tax_total::text,
       fb.total::text,
       fb.notes,
       fb.created_at::text,
       fb.updated_at::text,
       coalesce(sum(fpa.amount), 0)::text as paid_total,
       (fb.total - coalesce(sum(fpa.amount), 0))::text as outstanding_total
     from finance_bills fb
     join finance_counterparties fc on fc.id = fb.counterparty_id
     left join finance_payment_allocations fpa on fpa.bill_id = fb.id
     ${whereClause}
     group by fb.id, fc.name
     order by coalesce(fb.issue_date, fb.created_at::date) desc, fb.created_at desc`,
    params
  );

  const linesByBill = await loadBillLines(client, bills.rows.map((row) => row.id));
  return bills.rows.map((row) => mapBill(row, linesByBill.get(row.id) ?? []));
}

function buildDocumentLines(
  payloadLines: CreateInvoiceRequest["lines"] | CreateBillRequest["lines"],
  defaultAccountId: string
) {
  if (!Array.isArray(payloadLines) || payloadLines.length === 0) {
    throw new Error("At least one line item is required.");
  }

  return payloadLines.map((line, index) => {
    if (!line.description?.trim()) {
      throw new Error(`Line ${index + 1} description is required.`);
    }

    const quantity = parseMoney(line.quantity);
    const unitPrice = parseMoney(line.unitPrice);
    const taxRate = parseMoney(line.taxRate ?? "0");

    assertPositive(quantity, `Line ${index + 1} quantity`);
    assertPositive(unitPrice, `Line ${index + 1} unit price`);
    if (taxRate.lt(0)) {
      throw new Error(`Line ${index + 1} tax rate cannot be negative.`);
    }

    const lineSubtotal = money(quantity.mul(unitPrice));
    const taxTotal = money(lineSubtotal.mul(taxRate).div(100));
    const lineTotal = money(lineSubtotal.plus(taxTotal));

    return {
      description: line.description.trim(),
      quantity,
      unitPrice,
      taxRate,
      lineSubtotal,
      taxTotal,
      lineTotal,
      accountId: line.accountId ?? defaultAccountId
    };
  });
}

async function ensureAccountIdsBelongToTenant(client: PoolClient, tenantId: string, accountIds: string[]) {
  const uniqueIds = [...new Set(accountIds)];
  const result = await client.query<{ id: string }>(
    `select id
     from finance_accounts
     where tenant_id = $1
       and id = any($2::uuid[])`,
    [tenantId, uniqueIds]
  );

  if (result.rowCount !== uniqueIds.length) {
    throw new Error("One or more finance accounts are invalid for the tenant.");
  }
}

async function recordPayment(
  client: PoolClient,
  input: {
    tenantId: string;
    actorUserId: string;
    direction: PaymentDirection;
    counterpartyId: string;
    paymentDate: string;
    amount: Decimal;
    cashAccountId?: string;
    reference?: string;
    invoiceId?: string;
    billId?: string;
  }
) {
  const paymentId = randomUUID();
  const cashAccount = await resolveCashAccount(client, input.tenantId, input.cashAccountId);
  const coreAccounts = await loadCoreAccounts(client, input.tenantId);

  const batchLines: BatchLineInput[] =
    input.direction === "incoming"
      ? [
        { accountId: cashAccount.id, entrySide: "debit", amount: input.amount, memo: input.reference, counterpartyId: input.counterpartyId },
        {
          accountId: coreAccounts.accounts_receivable.id,
          entrySide: "credit",
          amount: input.amount,
          memo: input.reference,
          counterpartyId: input.counterpartyId
        }
      ]
      : [
        {
          accountId: coreAccounts.accounts_payable.id,
          entrySide: "debit",
          amount: input.amount,
          memo: input.reference,
          counterpartyId: input.counterpartyId
        },
        { accountId: cashAccount.id, entrySide: "credit", amount: input.amount, memo: input.reference, counterpartyId: input.counterpartyId }
      ];

  const batchId = await createBatch(client, {
    tenantId: input.tenantId,
    sourceType: "payment",
    sourceId: paymentId,
    actorUserId: input.actorUserId,
    postedAt: input.paymentDate,
    memo: input.reference,
    lines: batchLines
  });

  await client.query(
    `insert into finance_payments (
      id,
      tenant_id,
      direction,
      counterparty_id,
      payment_date,
      amount,
      currency,
      reference,
      cash_account_id,
      batch_id,
      created_by
    ) values ($1, $2, $3, $4, $5::date, $6::numeric, $7, $8, $9, $10, $11)`,
    [
      paymentId,
      input.tenantId,
      input.direction,
      input.counterpartyId,
      isoDate(input.paymentDate),
      moneyText(input.amount),
      DEFAULT_CURRENCY,
      input.reference ?? null,
      cashAccount.id,
      batchId,
      input.actorUserId
    ]
  );

  await client.query(
    `insert into finance_payment_allocations (
      id,
      payment_id,
      invoice_id,
      bill_id,
      amount
    ) values ($1, $2, $3, $4, $5::numeric)`,
    [randomUUID(), paymentId, input.invoiceId ?? null, input.billId ?? null, moneyText(input.amount)]
  );
}

async function loadTenantExists(client: PoolClient, tenantId: string) {
  const result = await client.query<{ id: string }>(`select id from tenants where id = $1`, [tenantId]);
  return (result.rowCount ?? 0) > 0;
}

function asRows<T extends QueryResultRow>(rows: T[]) {
  return rows;
}

export async function listFinanceAccounts(tenantId: string) {
  return runWithDb(async (client) => {
    const result = await client.query<{
      id: string;
      tenant_id: string;
      code: string;
      name: string;
      category: FinanceAccountCategory;
      normal_side: EntrySide;
      currency: "UZS";
      system_key: string | null;
      is_system: boolean;
      created_at: string;
      updated_at: string;
      balance: string;
    }>(
      `select
         fa.id,
         fa.tenant_id,
         fa.code,
         fa.name,
         fa.category,
         fa.normal_side,
         fa.currency,
         fa.system_key,
         fa.is_system,
         fa.created_at::text,
         fa.updated_at::text,
         coalesce(sum(
           case
             when jl.entry_side = fa.normal_side then jl.amount
             else -jl.amount
           end
         ), 0)::text as balance
       from finance_accounts fa
       left join finance_journal_lines jl on jl.account_id = fa.id
       where fa.tenant_id = $1
       group by fa.id
       order by fa.code asc`,
      [tenantId]
    );

    return result.rows.map((row) => ({
      id: row.id,
      tenantId: row.tenant_id,
      code: row.code,
      name: row.name,
      category: row.category,
      normalSide: row.normal_side,
      currency: row.currency,
      systemKey: row.system_key ?? undefined,
      balance: moneyText(row.balance),
      isSystem: row.is_system,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    } satisfies FinanceAccount));
  });
}

export async function listLedgerEntries(tenantId: string, filters: { from?: string; to?: string; accountId?: string; page?: number }) {
  return runWithDb(async (client) => {
    const page = Math.max(1, filters.page ?? 1);
    const offset = (page - 1) * DEFAULT_PAGE_SIZE;
    const params: Array<string | number> = [tenantId];
    const whereParts = [`jb.tenant_id = $1`];

    if (filters.from) {
      params.push(isoDate(filters.from));
      whereParts.push(`jb.posted_at::date >= $${params.length}::date`);
    }

    if (filters.to) {
      params.push(isoDate(filters.to));
      whereParts.push(`jb.posted_at::date <= $${params.length}::date`);
    }

    if (filters.accountId) {
      params.push(filters.accountId);
      whereParts.push(`jl.account_id = $${params.length}`);
    }

    const whereClause = whereParts.join(" and ");
    const totalResult = await client.query<{ total: string }>(
      `select count(*)::text as total
       from finance_journal_lines jl
       join finance_journal_batches jb on jb.id = jl.batch_id
       where ${whereClause}`,
      params
    );

    params.push(DEFAULT_PAGE_SIZE, offset);
    const rows = await client.query<{
      id: string;
      batch_id: string;
      account_id: string;
      account_code: string;
      account_name: string;
      entry_side: EntrySide;
      amount: string;
      memo: string | null;
      counterparty_id: string | null;
      source_type: JournalLine["sourceType"];
      source_id: string | null;
      posted_at: string;
      running_balance: string;
    }>(
      `select
         jl.id,
         jl.batch_id,
         jl.account_id,
         fa.code as account_code,
         fa.name as account_name,
         jl.entry_side,
         jl.amount::text,
         jl.memo,
         jl.counterparty_id,
         jb.source_type,
         jb.source_id,
         jb.posted_at::text,
         sum(
           case
             when jl.entry_side = fa.normal_side then jl.amount
             else -jl.amount
           end
         ) over (
           partition by jl.account_id
           order by jb.posted_at asc, jb.created_at asc, jl.id asc
         )::text as running_balance
       from finance_journal_lines jl
       join finance_journal_batches jb on jb.id = jl.batch_id
       join finance_accounts fa on fa.id = jl.account_id
       where ${whereClause}
       order by jb.posted_at desc, jb.created_at desc, jl.id desc
       limit $${params.length - 1}
       offset $${params.length}`,
      params
    );

    return {
      entries: rows.rows.map((row) => ({
        id: row.id,
        batchId: row.batch_id,
        accountId: row.account_id,
        accountCode: row.account_code,
        accountName: row.account_name,
        entrySide: row.entry_side,
        amount: moneyText(row.amount),
        memo: row.memo ?? undefined,
        counterpartyId: row.counterparty_id ?? undefined,
        sourceType: row.source_type,
        sourceId: row.source_id ?? undefined,
        postedAt: row.posted_at,
        runningBalance: moneyText(row.running_balance)
      } satisfies JournalLine)),
      page,
      pageSize: DEFAULT_PAGE_SIZE,
      total: Number(totalResult.rows[0]?.total ?? "0")
    };
  });
}

export async function listInvoices(tenantId: string) {
  return runWithDb(async (client) => loadInvoicesInternal(client, tenantId));
}

export async function createInvoice(tenantId: string, actorUserId: string, payload: CreateInvoiceRequest) {
  ensureSingleCurrency(DEFAULT_CURRENCY);

  return runWithDb(async (client) => {
    await beginTenantTx(client, tenantId);

    try {
      const coreAccounts = await loadCoreAccounts(client, tenantId);
      const counterpartyId = await upsertCounterparty(client, {
        tenantId,
        counterpartyId: payload.counterpartyId,
        name: payload.counterpartyName,
        type: "customer",
        email: payload.counterpartyEmail,
        phone: payload.counterpartyPhone,
        taxId: payload.counterpartyTaxId
      });

      const lines = buildDocumentLines(payload.lines, coreAccounts.sales_revenue.id);
      await ensureAccountIdsBelongToTenant(client, tenantId, lines.map((line) => line.accountId));

      const subtotal = lines.reduce((sum, line) => sum.plus(line.lineSubtotal), new Decimal(0));
      const taxTotal = lines.reduce((sum, line) => sum.plus(line.taxTotal), new Decimal(0));
      const total = money(subtotal.plus(taxTotal));
      const invoiceId = randomUUID();
      const number = payload.number?.trim() || await nextDocumentNumber(client, tenantId, "invoice");

      await client.query(
        `insert into finance_invoices (
          id,
          tenant_id,
          counterparty_id,
          number,
          status,
          currency,
          due_date,
          subtotal,
          tax_total,
          total,
          notes,
          created_by,
          updated_by
        ) values (
          $1,
          $2,
          $3,
          $4,
          'draft',
          $5,
          $6::date,
          $7::numeric,
          $8::numeric,
          $9::numeric,
          $10,
          $11,
          $11
        )`,
        [invoiceId, tenantId, counterpartyId, number, DEFAULT_CURRENCY, isoDate(payload.dueDate), moneyText(subtotal), moneyText(taxTotal), moneyText(total), payload.notes?.trim() ?? null, actorUserId]
      );

      for (const [index, line] of lines.entries()) {
        await client.query(
          `insert into finance_invoice_lines (
            id,
            invoice_id,
            revenue_account_id,
            position,
            description,
            quantity,
            unit_price,
            tax_rate,
            line_subtotal,
            tax_total,
            line_total
          ) values (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6::numeric,
            $7::numeric,
            $8::numeric,
            $9::numeric,
            $10::numeric,
            $11::numeric
          )`,
          [
            randomUUID(),
            invoiceId,
            line.accountId,
            index,
            line.description,
            moneyText(line.quantity),
            moneyText(line.unitPrice),
            moneyText(line.taxRate),
            moneyText(line.lineSubtotal),
            moneyText(line.taxTotal),
            moneyText(line.lineTotal)
          ]
        );
      }

      const invoices = await loadInvoicesInternal(client, tenantId, invoiceId);
      await client.query("COMMIT");
      return invoices[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  });
}

export async function issueInvoice(tenantId: string, actorUserId: string, invoiceId: string) {
  return runWithDb(async (client) => {
    await beginTenantTx(client, tenantId);

    try {
      await lockInvoiceRow(client, tenantId, invoiceId);

      const invoices = await loadInvoicesInternal(client, tenantId, invoiceId);
      const invoice = invoices[0];
      if (!invoice) {
        throw new Error("Invoice not found.");
      }

      if (invoice.status !== "draft") {
        throw new Error("Only draft invoices can be issued.");
      }

      const coreAccounts = await loadCoreAccounts(client, tenantId);
      const lines = invoice.lines;
      const taxTotal = lines.reduce((sum, line) => sum.plus(parseMoney(line.taxTotal)), new Decimal(0));
      const batchLines: BatchLineInput[] = [
        {
          accountId: coreAccounts.accounts_receivable.id,
          entrySide: "debit",
          amount: parseMoney(invoice.total),
          memo: `Invoice ${invoice.number}`,
          counterpartyId: invoice.counterpartyId
        }
      ];

      for (const line of lines) {
        batchLines.push({
          accountId: line.accountId,
          entrySide: "credit",
          amount: parseMoney(line.lineSubtotal),
          memo: `Invoice ${invoice.number}`,
          counterpartyId: invoice.counterpartyId
        });
      }

      if (taxTotal.gt(0)) {
        batchLines.push({
          accountId: coreAccounts.vat_payable.id,
          entrySide: "credit",
          amount: taxTotal,
          memo: `Invoice ${invoice.number} VAT`,
          counterpartyId: invoice.counterpartyId
        });
      }

      const batchId = await createBatch(client, {
        tenantId,
        actorUserId,
        sourceType: "invoice_issue",
        sourceId: invoiceId,
        memo: `Issue invoice ${invoice.number}`,
        lines: batchLines
      });

      await client.query(
        `update finance_invoices
         set status = 'issued',
             issue_date = $3::date,
             issued_batch_id = $4,
             updated_by = $5,
             updated_at = now()
         where tenant_id = $1
           and id = $2`,
        [tenantId, invoiceId, currentDate(), batchId, actorUserId]
      );

      const next = await loadInvoicesInternal(client, tenantId, invoiceId);
      await client.query("COMMIT");
      return next[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  });
}

export async function recordInvoicePayment(tenantId: string, actorUserId: string, invoiceId: string, payload: RecordInvoicePaymentRequest) {
  return runWithDb(async (client) => {
    await beginTenantTx(client, tenantId);

    try {
      await lockInvoiceRow(client, tenantId, invoiceId);

      const invoice = (await loadInvoicesInternal(client, tenantId, invoiceId))[0];
      if (!invoice) {
        throw new Error("Invoice not found.");
      }

      if (invoice.status === "draft" || invoice.status === "voided") {
        throw new Error("Only issued invoices can receive payments.");
      }

      const amount = parseMoney(payload.amount);
      assertPositive(amount, "Payment amount");
      const outstanding = parseMoney(invoice.outstandingTotal);
      if (amount.gt(outstanding)) {
        throw new Error("Payment amount exceeds the invoice outstanding balance.");
      }

      await recordPayment(client, {
        tenantId,
        actorUserId,
        direction: "incoming",
        counterpartyId: invoice.counterpartyId,
        paymentDate: payload.paymentDate,
        amount,
        cashAccountId: payload.cashAccountId,
        reference: payload.reference ?? `Payment for ${invoice.number}`,
        invoiceId
      });

      const next = (await loadInvoicesInternal(client, tenantId, invoiceId))[0];
      await client.query("COMMIT");
      return next;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  });
}

export async function listBills(tenantId: string) {
  return runWithDb(async (client) => loadBillsInternal(client, tenantId));
}

export async function createBill(tenantId: string, actorUserId: string, payload: CreateBillRequest) {
  ensureSingleCurrency(DEFAULT_CURRENCY);

  return runWithDb(async (client) => {
    await beginTenantTx(client, tenantId);

    try {
      const coreAccounts = await loadCoreAccounts(client, tenantId);
      const counterpartyId = await upsertCounterparty(client, {
        tenantId,
        counterpartyId: payload.counterpartyId,
        name: payload.counterpartyName,
        type: "supplier",
        email: payload.counterpartyEmail,
        phone: payload.counterpartyPhone,
        taxId: payload.counterpartyTaxId
      });

      const lines = buildDocumentLines(payload.lines, coreAccounts.operating_expense.id);
      await ensureAccountIdsBelongToTenant(client, tenantId, lines.map((line) => line.accountId));

      const subtotal = lines.reduce((sum, line) => sum.plus(line.lineSubtotal), new Decimal(0));
      const taxTotal = lines.reduce((sum, line) => sum.plus(line.taxTotal), new Decimal(0));
      const total = money(subtotal.plus(taxTotal));
      const billId = randomUUID();
      const number = payload.number?.trim() || await nextDocumentNumber(client, tenantId, "bill");

      await client.query(
        `insert into finance_bills (
          id,
          tenant_id,
          counterparty_id,
          number,
          status,
          currency,
          due_date,
          subtotal,
          tax_total,
          total,
          notes,
          created_by,
          updated_by
        ) values (
          $1,
          $2,
          $3,
          $4,
          'draft',
          $5,
          $6::date,
          $7::numeric,
          $8::numeric,
          $9::numeric,
          $10,
          $11,
          $11
        )`,
        [billId, tenantId, counterpartyId, number, DEFAULT_CURRENCY, isoDate(payload.dueDate), moneyText(subtotal), moneyText(taxTotal), moneyText(total), payload.notes?.trim() ?? null, actorUserId]
      );

      for (const [index, line] of lines.entries()) {
        await client.query(
          `insert into finance_bill_lines (
            id,
            bill_id,
            expense_account_id,
            position,
            description,
            quantity,
            unit_price,
            tax_rate,
            line_subtotal,
            tax_total,
            line_total
          ) values (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6::numeric,
            $7::numeric,
            $8::numeric,
            $9::numeric,
            $10::numeric,
            $11::numeric
          )`,
          [
            randomUUID(),
            billId,
            line.accountId,
            index,
            line.description,
            moneyText(line.quantity),
            moneyText(line.unitPrice),
            moneyText(line.taxRate),
            moneyText(line.lineSubtotal),
            moneyText(line.taxTotal),
            moneyText(line.lineTotal)
          ]
        );
      }

      const bills = await loadBillsInternal(client, tenantId, billId);
      await client.query("COMMIT");
      return bills[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  });
}

export async function postBill(tenantId: string, actorUserId: string, billId: string) {
  return runWithDb(async (client) => {
    await beginTenantTx(client, tenantId);

    try {
      await lockBillRow(client, tenantId, billId);

      const bill = (await loadBillsInternal(client, tenantId, billId))[0];
      if (!bill) {
        throw new Error("Bill not found.");
      }

      if (bill.status !== "draft") {
        throw new Error("Only draft bills can be posted.");
      }

      const coreAccounts = await loadCoreAccounts(client, tenantId);
      const taxTotal = bill.lines.reduce((sum, line) => sum.plus(parseMoney(line.taxTotal)), new Decimal(0));
      const batchLines: BatchLineInput[] = [];

      for (const line of bill.lines) {
        batchLines.push({
          accountId: line.accountId,
          entrySide: "debit",
          amount: parseMoney(line.lineSubtotal),
          memo: `Bill ${bill.number}`,
          counterpartyId: bill.counterpartyId
        });
      }

      if (taxTotal.gt(0)) {
        batchLines.push({
          accountId: coreAccounts.vat_receivable.id,
          entrySide: "debit",
          amount: taxTotal,
          memo: `Bill ${bill.number} VAT`,
          counterpartyId: bill.counterpartyId
        });
      }

      batchLines.push({
        accountId: coreAccounts.accounts_payable.id,
        entrySide: "credit",
        amount: parseMoney(bill.total),
        memo: `Bill ${bill.number}`,
        counterpartyId: bill.counterpartyId
      });

      const batchId = await createBatch(client, {
        tenantId,
        actorUserId,
        sourceType: "bill_post",
        sourceId: billId,
        memo: `Post bill ${bill.number}`,
        lines: batchLines
      });

      await client.query(
        `update finance_bills
         set status = 'posted',
             issue_date = $3::date,
             posted_batch_id = $4,
             updated_by = $5,
             updated_at = now()
         where tenant_id = $1
           and id = $2`,
        [tenantId, billId, currentDate(), batchId, actorUserId]
      );

      const next = (await loadBillsInternal(client, tenantId, billId))[0];
      await client.query("COMMIT");
      return next;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  });
}

export async function recordBillPayment(tenantId: string, actorUserId: string, billId: string, payload: RecordBillPaymentRequest) {
  return runWithDb(async (client) => {
    await beginTenantTx(client, tenantId);

    try {
      await lockBillRow(client, tenantId, billId);

      const bill = (await loadBillsInternal(client, tenantId, billId))[0];
      if (!bill) {
        throw new Error("Bill not found.");
      }

      if (bill.status === "draft" || bill.status === "voided") {
        throw new Error("Only posted bills can receive payments.");
      }

      const amount = parseMoney(payload.amount);
      assertPositive(amount, "Payment amount");
      const outstanding = parseMoney(bill.outstandingTotal);
      if (amount.gt(outstanding)) {
        throw new Error("Payment amount exceeds the bill outstanding balance.");
      }

      await recordPayment(client, {
        tenantId,
        actorUserId,
        direction: "outgoing",
        counterpartyId: bill.counterpartyId,
        paymentDate: payload.paymentDate,
        amount,
        cashAccountId: payload.cashAccountId,
        reference: payload.reference ?? `Payment for ${bill.number}`,
        billId
      });

      const next = (await loadBillsInternal(client, tenantId, billId))[0];
      await client.query("COMMIT");
      return next;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  });
}

export async function createManualJournal(tenantId: string, actorUserId: string, payload: CreateManualJournalRequest) {
  return runWithDb(async (client) => {
    const sourceType = payload.sourceType ?? "manual_adjustment";
    const postedAt = isoDate(payload.effectiveDate);

    if (!Array.isArray(payload.lines) || payload.lines.length < 2) {
      throw new Error("At least two manual journal lines are required.");
    }

    await ensureAccountIdsBelongToTenant(client, tenantId, payload.lines.map((line) => line.accountId));

    const lines = payload.lines.map((line) => {
      const amount = parseMoney(line.amount);
      assertPositive(amount, "Manual journal amount");
      return {
        accountId: line.accountId,
        entrySide: line.entrySide,
        amount,
        memo: line.memo
      } satisfies BatchLineInput;
    });

    const batchId = await createBatch(client, {
      tenantId,
      actorUserId,
      sourceType,
      memo: payload.memo,
      postedAt,
      lines
    });

    return { batchId };
  });
}

export async function getCashFlow(tenantId: string, params: { from?: string; to?: string; bucket?: "month" }) {
  return runWithDb(async (client) => {
    const bucket = params.bucket ?? "month";
    if (bucket !== "month") {
      throw new Error("Only monthly cash flow buckets are supported.");
    }

    const from = params.from ? isoDate(params.from) : monthStart(new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() - 5, 1)));
    const to = params.to ? isoDate(params.to) : currentDate();

    const rows = await client.query<{
      period_start: string;
      inflow: string;
      outflow: string;
      net: string;
    }>(
      `select
         date_trunc('month', jb.posted_at)::date::text as period_start,
         coalesce(sum(case when jl.entry_side = 'debit' then jl.amount else 0 end), 0)::text as inflow,
         coalesce(sum(case when jl.entry_side = 'credit' then jl.amount else 0 end), 0)::text as outflow,
         coalesce(sum(case when jl.entry_side = 'debit' then jl.amount else -jl.amount end), 0)::text as net
       from finance_journal_lines jl
       join finance_journal_batches jb on jb.id = jl.batch_id
       join finance_accounts fa on fa.id = jl.account_id
       where jl.tenant_id = $1
         and fa.system_key = 'cash'
         and jb.posted_at::date between $2::date and $3::date
       group by 1
       order by 1 asc`,
      [tenantId, from, to]
    );

    return rows.rows.map((row) => ({
      periodStart: row.period_start,
      periodLabel: formatMonthLabel(row.period_start),
      inflow: moneyText(row.inflow),
      outflow: moneyText(row.outflow),
      net: moneyText(row.net)
    } satisfies CashFlowBucket));
  });
}

export async function getTenantFinanceSnapshot(tenantId: string) {
  return runWithDb(async (client) => {
    if (!(await loadTenantExists(client, tenantId))) {
      throw new Error("Tenant not found.");
    }

    const accountBalances = await listFinanceAccounts(tenantId);
    const cashBalance = accountBalances.find((account) => account.systemKey === "cash")?.balance ?? moneyText(0);

    const arStats = await client.query<{ outstanding: string; overdue: string }>(
      `select
         coalesce(sum(fi.total - coalesce(paid.total_paid, 0)), 0)::text as outstanding,
         coalesce(sum(case when fi.due_date < current_date then fi.total - coalesce(paid.total_paid, 0) else 0 end), 0)::text as overdue
       from finance_invoices fi
       left join (
         select invoice_id, sum(amount) as total_paid
         from finance_payment_allocations
         where invoice_id is not null
         group by invoice_id
       ) paid on paid.invoice_id = fi.id
       where fi.tenant_id = $1
         and fi.status <> 'draft'
         and fi.status <> 'voided'`,
      [tenantId]
    );

    const apStats = await client.query<{ outstanding: string }>(
      `select
         coalesce(sum(fb.total - coalesce(paid.total_paid, 0)), 0)::text as outstanding
       from finance_bills fb
       left join (
         select bill_id, sum(amount) as total_paid
         from finance_payment_allocations
         where bill_id is not null
         group by bill_id
       ) paid on paid.bill_id = fb.id
       where fb.tenant_id = $1
         and fb.status <> 'draft'
         and fb.status <> 'voided'`,
      [tenantId]
    );

    const monthCashFlow = await getCashFlow(tenantId, { from: monthStart(new Date()), to: currentDate(), bucket: "month" });
    const monthlyNetCashFlow = monthCashFlow.at(-1)?.net ?? moneyText(0);

    const revenueTrend = await client.query<{ month: string; revenue: string }>(
      `select
         date_trunc('month', jb.posted_at)::date::text as month,
         coalesce(sum(case when jl.entry_side = fa.normal_side then jl.amount else -jl.amount end), 0)::text as revenue
       from finance_journal_lines jl
       join finance_journal_batches jb on jb.id = jl.batch_id
       join finance_accounts fa on fa.id = jl.account_id
       where jl.tenant_id = $1
         and fa.category = 'revenue'
         and jb.posted_at >= date_trunc('month', now()) - interval '2 months'
       group by 1
       order by 1 asc`,
      [tenantId]
    );

    const invoiceCollectionRate = await client.query<{ total_issued: string; total_collected: string }>(
      `select
         coalesce(sum(fi.total), 0)::text as total_issued,
         coalesce(sum(paid.total_paid), 0)::text as total_collected
       from finance_invoices fi
       left join (
         select invoice_id, sum(amount) as total_paid
         from finance_payment_allocations
         where invoice_id is not null
         group by invoice_id
       ) paid on paid.invoice_id = fi.id
       where fi.tenant_id = $1
         and fi.status <> 'draft'
         and fi.status <> 'voided'`,
      [tenantId]
    );

    const billPunctuality = await client.query<{ total_paid: string; paid_on_time: string }>(
      `select
         count(*)::text as total_paid,
         count(*) filter (
           where last_payment.last_paid_at::date <= fb.due_date
         )::text as paid_on_time
       from finance_bills fb
       join (
         select
           fpa.bill_id,
           sum(fpa.amount) as total_paid,
           max(fp.payment_date) as last_paid_at
         from finance_payment_allocations fpa
         join finance_payments fp on fp.id = fpa.payment_id
         where fpa.bill_id is not null
         group by fpa.bill_id
       ) last_payment on last_payment.bill_id = fb.id
       where fb.tenant_id = $1
         and last_payment.total_paid >= fb.total`,
      [tenantId]
    );

    const totalIssued = parseMoney(invoiceCollectionRate.rows[0]?.total_issued ?? "0");
    const totalCollected = parseMoney(invoiceCollectionRate.rows[0]?.total_collected ?? "0");
    const totalPaidBills = Number(billPunctuality.rows[0]?.total_paid ?? "0");
    const paidOnTimeBills = Number(billPunctuality.rows[0]?.paid_on_time ?? "0");

    return {
      tenantId,
      cashBalance,
      arOutstanding: moneyText(arStats.rows[0]?.outstanding ?? "0"),
      arOverdue: moneyText(arStats.rows[0]?.overdue ?? "0"),
      apOutstanding: moneyText(apStats.rows[0]?.outstanding ?? "0"),
      monthlyNetCashFlow,
      lastThreeMonthRevenue: asRows(revenueTrend.rows).map((row) => ({
        month: row.month,
        revenue: moneyText(row.revenue)
      })),
      invoiceCollectionRate: totalIssued.eq(0) ? "0.00" : money(totalCollected.div(totalIssued).mul(100)).toFixed(MONEY_SCALE),
      billPaymentPunctuality: totalPaidBills === 0 ? "0.00" : money((paidOnTimeBills / totalPaidBills) * 100).toFixed(MONEY_SCALE),
      refreshedAt: new Date().toISOString()
    } satisfies TenantFinanceSnapshot;
  });
}

export async function voidInvoice(tenantId: string, actorUserId: string, invoiceId: string) {
  return runWithDb(async (client) => {
    await beginTenantTx(client, tenantId);

    try {
      await lockInvoiceRow(client, tenantId, invoiceId);

      const invoice = (await loadInvoicesInternal(client, tenantId, invoiceId))[0];
      if (!invoice) {
        throw new Error("Invoice not found.");
      }

      if (invoice.status === "draft" || invoice.status === "voided") {
        throw new Error("Only issued invoices can be voided.");
      }

      const originalBatchResult = await client.query<{ id: string }>(
        `select issued_batch_id as id from finance_invoices where tenant_id = $1 and id = $2`,
        [tenantId, invoiceId]
      );
      const originalBatchId = originalBatchResult.rows[0]?.id;

      if (!originalBatchId) {
        throw new Error("Original journal batch not found for this invoice.");
      }

      const originalLines = await client.query<{
        account_id: string;
        entry_side: EntrySide;
        amount: string;
        memo: string | null;
        counterparty_id: string | null;
      }>(
        `select account_id, entry_side, amount::text, memo, counterparty_id
         from finance_journal_lines
         where batch_id = $1`,
        [originalBatchId]
      );

      const reversedLines: BatchLineInput[] = originalLines.rows.map((line) => ({
        accountId: line.account_id,
        entrySide: line.entry_side === "debit" ? "credit" as EntrySide : "debit" as EntrySide,
        amount: parseMoney(line.amount),
        memo: `Void: ${line.memo ?? ""}`.trim(),
        counterpartyId: line.counterparty_id ?? undefined
      }));

      await createBatch(client, {
        tenantId,
        actorUserId,
        sourceType: "reversal",
        sourceId: invoiceId,
        reversalOfBatchId: originalBatchId,
        memo: `Void invoice ${invoice.number}`,
        lines: reversedLines
      });

      await client.query(
        `update finance_invoices
         set status = 'voided',
             updated_by = $3,
             updated_at = now()
         where tenant_id = $1
           and id = $2`,
        [tenantId, invoiceId, actorUserId]
      );

      const next = (await loadInvoicesInternal(client, tenantId, invoiceId))[0];
      await client.query("COMMIT");
      return next;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  });
}

export async function voidBill(tenantId: string, actorUserId: string, billId: string) {
  return runWithDb(async (client) => {
    await beginTenantTx(client, tenantId);

    try {
      await lockBillRow(client, tenantId, billId);

      const bill = (await loadBillsInternal(client, tenantId, billId))[0];
      if (!bill) {
        throw new Error("Bill not found.");
      }

      if (bill.status === "draft" || bill.status === "voided") {
        throw new Error("Only posted bills can be voided.");
      }

      const originalBatchResult = await client.query<{ id: string }>(
        `select posted_batch_id as id from finance_bills where tenant_id = $1 and id = $2`,
        [tenantId, billId]
      );
      const originalBatchId = originalBatchResult.rows[0]?.id;

      if (!originalBatchId) {
        throw new Error("Original journal batch not found for this bill.");
      }

      const originalLines = await client.query<{
        account_id: string;
        entry_side: EntrySide;
        amount: string;
        memo: string | null;
        counterparty_id: string | null;
      }>(
        `select account_id, entry_side, amount::text, memo, counterparty_id
         from finance_journal_lines
         where batch_id = $1`,
        [originalBatchId]
      );

      const reversedLines: BatchLineInput[] = originalLines.rows.map((line) => ({
        accountId: line.account_id,
        entrySide: line.entry_side === "debit" ? "credit" as EntrySide : "debit" as EntrySide,
        amount: parseMoney(line.amount),
        memo: `Void: ${line.memo ?? ""}`.trim(),
        counterpartyId: line.counterparty_id ?? undefined
      }));

      await createBatch(client, {
        tenantId,
        actorUserId,
        sourceType: "reversal",
        sourceId: billId,
        reversalOfBatchId: originalBatchId,
        memo: `Void bill ${bill.number}`,
        lines: reversedLines
      });

      await client.query(
        `update finance_bills
         set status = 'voided',
             updated_by = $3,
             updated_at = now()
         where tenant_id = $1
           and id = $2`,
        [tenantId, billId, actorUserId]
      );

      const next = (await loadBillsInternal(client, tenantId, billId))[0];
      await client.query("COMMIT");
      return next;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  });
}

export async function listCounterparties(tenantId: string) {
  return runWithDb(async (client) => {
    const result = await client.query<{
      id: string;
      tenant_id: string;
      name: string;
      type: CounterpartyType;
      tax_id: string | null;
      phone: string | null;
      email: string | null;
      created_at: string;
      updated_at: string;
      invoice_count: string;
      bill_count: string;
    }>(
      `select
         fc.id,
         fc.tenant_id,
         fc.name,
         fc.type,
         fc.tax_id,
         fc.phone,
         fc.email,
         fc.created_at::text,
         fc.updated_at::text,
         (select count(*) from finance_invoices fi where fi.counterparty_id = fc.id)::text as invoice_count,
         (select count(*) from finance_bills fb where fb.counterparty_id = fc.id)::text as bill_count
       from finance_counterparties fc
       where fc.tenant_id = $1
       order by fc.name asc`,
      [tenantId]
    );

    return result.rows.map((row) => ({
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      type: row.type,
      taxId: row.tax_id ?? undefined,
      phone: row.phone ?? undefined,
      email: row.email ?? undefined,
      invoiceCount: Number(row.invoice_count),
      billCount: Number(row.bill_count),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  });
}

export async function getCounterparty(tenantId: string, counterpartyId: string) {
  return runWithDb(async (client) => {
    const result = await client.query<CounterpartyRow>(
      `select id, tenant_id, name, type, tax_id, phone, email, created_at::text, updated_at::text
       from finance_counterparties
       where tenant_id = $1 and id = $2`,
      [tenantId, counterpartyId]
    );

    if (result.rowCount === 0) {
      throw new Error("Counterparty not found.");
    }

    const row = result.rows[0];
    return {
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      type: row.type,
      taxId: row.tax_id ?? undefined,
      phone: row.phone ?? undefined,
      email: row.email ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  });
}

export async function listPayments(tenantId: string, filters: { from?: string; to?: string; direction?: PaymentDirection }) {
  return runWithDb(async (client) => {
    const params: Array<string> = [tenantId];
    const whereParts = [`fp.tenant_id = $1`];

    if (filters.from) {
      params.push(isoDate(filters.from));
      whereParts.push(`fp.payment_date >= $${params.length}::date`);
    }

    if (filters.to) {
      params.push(isoDate(filters.to));
      whereParts.push(`fp.payment_date <= $${params.length}::date`);
    }

    if (filters.direction) {
      params.push(filters.direction);
      whereParts.push(`fp.direction = $${params.length}`);
    }

    const whereClause = whereParts.join(" and ");

    const result = await client.query<{
      id: string;
      tenant_id: string;
      direction: PaymentDirection;
      counterparty_id: string;
      counterparty_name: string;
      payment_date: string;
      amount: string;
      currency: string;
      reference: string | null;
      cash_account_id: string;
      created_at: string;
    }>(
      `select
         fp.id,
         fp.tenant_id,
         fp.direction,
         fp.counterparty_id,
         fc.name as counterparty_name,
         fp.payment_date::text,
         fp.amount::text,
         fp.currency,
         fp.reference,
         fp.cash_account_id,
         fp.created_at::text
       from finance_payments fp
       join finance_counterparties fc on fc.id = fp.counterparty_id
       where ${whereClause}
       order by fp.payment_date desc, fp.created_at desc`,
      params
    );

    const paymentIds = result.rows.map((row) => row.id);
    const allocations = paymentIds.length > 0
      ? await client.query<{
        payment_id: string;
        id: string;
        invoice_id: string | null;
        bill_id: string | null;
        amount: string;
      }>(
        `select payment_id, id, invoice_id, bill_id, amount::text
           from finance_payment_allocations
           where payment_id = any($1::uuid[])`,
        [paymentIds]
      )
      : { rows: [] };

    const allocationsByPayment = new Map<string, Array<{ id: string; invoiceId?: string; billId?: string; amount: string }>>();
    for (const row of allocations.rows) {
      const bucket = allocationsByPayment.get(row.payment_id) ?? [];
      bucket.push({
        id: row.id,
        invoiceId: row.invoice_id ?? undefined,
        billId: row.bill_id ?? undefined,
        amount: moneyText(row.amount)
      });
      allocationsByPayment.set(row.payment_id, bucket);
    }

    return result.rows.map((row) => ({
      id: row.id,
      tenantId: row.tenant_id,
      direction: row.direction,
      counterpartyId: row.counterparty_id,
      counterpartyName: row.counterparty_name,
      paymentDate: row.payment_date,
      amount: moneyText(row.amount),
      currency: DEFAULT_CURRENCY as "UZS",
      reference: row.reference ?? undefined,
      cashAccountId: row.cash_account_id,
      createdAt: row.created_at,
      allocations: allocationsByPayment.get(row.id) ?? []
    }));
  });
}

export function isFinanceUnavailableError(error: unknown): error is FinanceUnavailableError {
  return error instanceof FinanceUnavailableError;
}
