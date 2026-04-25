export type FinanceAccountCategory = "asset" | "liability" | "equity" | "revenue" | "expense";
export type EntrySide = "debit" | "credit";
export type CounterpartyType = "customer" | "supplier" | "both";
export type InvoiceStatus = "draft" | "issued" | "partially_paid" | "paid" | "overdue" | "voided";
export type BillStatus = "draft" | "posted" | "partially_paid" | "paid" | "overdue" | "voided";
export type PaymentDirection = "incoming" | "outgoing";

export interface FinanceAccount {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  category: FinanceAccountCategory;
  normalSide: EntrySide;
  currency: "UZS";
  systemKey?: string;
  balance: string;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface JournalBatch {
  id: string;
  tenantId: string;
  sourceType: "invoice_issue" | "bill_post" | "payment" | "manual_adjustment" | "opening_balance" | "reversal";
  sourceId?: string;
  memo?: string;
  postedAt: string;
  reversalOfBatchId?: string;
  createdAt: string;
}

export interface JournalLine {
  id: string;
  batchId: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  entrySide: EntrySide;
  amount: string;
  memo?: string;
  counterpartyId?: string;
  sourceType: JournalBatch["sourceType"];
  sourceId?: string;
  postedAt: string;
  runningBalance?: string;
}

export interface Counterparty {
  id: string;
  tenantId: string;
  name: string;
  type: CounterpartyType;
  taxId?: string;
  phone?: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceDocumentLine {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
  taxRate: string;
  lineSubtotal: string;
  taxTotal: string;
  lineTotal: string;
  accountId: string;
}

export interface Invoice {
  id: string;
  tenantId: string;
  counterpartyId: string;
  counterpartyName: string;
  number: string;
  status: InvoiceStatus;
  currency: "UZS";
  issueDate?: string;
  dueDate: string;
  subtotal: string;
  taxTotal: string;
  total: string;
  outstandingTotal: string;
  collectedTotal: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  lines: FinanceDocumentLine[];
}

export interface Bill {
  id: string;
  tenantId: string;
  counterpartyId: string;
  counterpartyName: string;
  number: string;
  status: BillStatus;
  currency: "UZS";
  issueDate?: string;
  dueDate: string;
  subtotal: string;
  taxTotal: string;
  total: string;
  outstandingTotal: string;
  paidTotal: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  lines: FinanceDocumentLine[];
}

export interface PaymentAllocation {
  id: string;
  amount: string;
  invoiceId?: string;
  billId?: string;
}

export interface Payment {
  id: string;
  tenantId: string;
  direction: PaymentDirection;
  counterpartyId: string;
  counterpartyName: string;
  paymentDate: string;
  amount: string;
  currency: "UZS";
  reference?: string;
  cashAccountId: string;
  createdAt: string;
  allocations: PaymentAllocation[];
}

export interface CashFlowBucket {
  periodStart: string;
  periodLabel: string;
  inflow: string;
  outflow: string;
  net: string;
}

export interface RevenueTrendPoint {
  month: string;
  revenue: string;
}

export interface TenantFinanceSnapshot {
  tenantId: string;
  cashBalance: string;
  arOutstanding: string;
  arOverdue: string;
  apOutstanding: string;
  monthlyNetCashFlow: string;
  lastThreeMonthRevenue: RevenueTrendPoint[];
  invoiceCollectionRate: string;
  billPaymentPunctuality: string;
  refreshedAt: string;
}

export interface FinanceDocumentLineInput {
  description: string;
  quantity: string;
  unitPrice: string;
  taxRate?: string;
  accountId?: string;
}

export interface CreateInvoiceRequest {
  counterpartyId?: string;
  counterpartyName: string;
  counterpartyEmail?: string;
  counterpartyPhone?: string;
  counterpartyTaxId?: string;
  number?: string;
  dueDate: string;
  notes?: string;
  lines: FinanceDocumentLineInput[];
}

export interface CreateBillRequest {
  counterpartyId?: string;
  counterpartyName: string;
  counterpartyEmail?: string;
  counterpartyPhone?: string;
  counterpartyTaxId?: string;
  number?: string;
  dueDate: string;
  notes?: string;
  lines: FinanceDocumentLineInput[];
}

export interface RecordInvoicePaymentRequest {
  paymentDate: string;
  amount: string;
  cashAccountId?: string;
  reference?: string;
}

export interface RecordBillPaymentRequest {
  paymentDate: string;
  amount: string;
  cashAccountId?: string;
  reference?: string;
}

export interface CreateManualJournalRequest {
  effectiveDate: string;
  memo?: string;
  sourceType?: "manual_adjustment" | "opening_balance";
  lines: Array<{
    accountId: string;
    entrySide: EntrySide;
    amount: string;
    memo?: string;
  }>;
}

// ── Report Types ────────────────────────────────────────────

export interface TrialBalanceRow {
  accountId: string;
  accountCode: string;
  accountName: string;
  category: FinanceAccountCategory;
  totalDebit: string;
  totalCredit: string;
  balance: string;
}

export interface TrialBalance {
  periodStart: string | null;
  periodEnd: string;
  rows: TrialBalanceRow[];
  totalDebit: string;
  totalCredit: string;
  isBalanced: boolean;
}

export interface ProfitAndLossAccountRow {
  accountCode: string;
  accountName: string;
  amount: string;
}

export interface ProfitAndLoss {
  periodStart: string;
  periodEnd: string;
  revenueAccounts: ProfitAndLossAccountRow[];
  expenseAccounts: ProfitAndLossAccountRow[];
  totalRevenue: string;
  totalExpenses: string;
  netIncome: string;
}

export interface BalanceSheetAccountRow {
  accountCode: string;
  accountName: string;
  balance: string;
}

export interface BalanceSheet {
  asOfDate: string;
  assets: BalanceSheetAccountRow[];
  liabilities: BalanceSheetAccountRow[];
  equity: BalanceSheetAccountRow[];
  totalAssets: string;
  totalLiabilities: string;
  totalEquity: string;
}

// ── Counterparty List Types ─────────────────────────────────

export interface CounterpartyListItem extends Counterparty {
  invoiceCount: number;
  billCount: number;
}
