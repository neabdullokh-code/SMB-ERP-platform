import { z } from "zod";

const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
const positiveDecimal = z.string().refine(
  (v) => { try { return Number(v) > 0; } catch { return false; } },
  { message: "Must be a positive decimal string." }
);
const nonNegativeDecimal = z.string().refine(
  (v) => { try { return Number(v) >= 0; } catch { return false; } },
  { message: "Must be a non-negative decimal string." }
);
const isoDate = z.string().regex(isoDateRegex, "Date must use YYYY-MM-DD format.");

const documentLineSchema = z.object({
  description: z.string().min(1, "Line description is required."),
  quantity: positiveDecimal,
  unitPrice: positiveDecimal,
  taxRate: nonNegativeDecimal.optional(),
  accountId: z.string().uuid().optional()
});

export const CreateInvoiceSchema = z.object({
  counterpartyId: z.string().uuid().optional(),
  counterpartyName: z.string().min(1, "Counterparty name is required."),
  counterpartyEmail: z.string().email().optional(),
  counterpartyPhone: z.string().optional(),
  counterpartyTaxId: z.string().optional(),
  number: z.string().optional(),
  dueDate: isoDate,
  notes: z.string().optional(),
  lines: z.array(documentLineSchema).min(1, "At least one line item is required.")
});

export const CreateBillSchema = z.object({
  counterpartyId: z.string().uuid().optional(),
  counterpartyName: z.string().min(1, "Counterparty name is required."),
  counterpartyEmail: z.string().email().optional(),
  counterpartyPhone: z.string().optional(),
  counterpartyTaxId: z.string().optional(),
  number: z.string().optional(),
  dueDate: isoDate,
  notes: z.string().optional(),
  lines: z.array(documentLineSchema).min(1, "At least one line item is required.")
});

export const RecordPaymentSchema = z.object({
  paymentDate: isoDate,
  amount: positiveDecimal,
  cashAccountId: z.string().uuid().optional(),
  reference: z.string().optional()
});

export const ManualJournalSchema = z.object({
  effectiveDate: isoDate,
  memo: z.string().optional(),
  sourceType: z.enum(["manual_adjustment", "opening_balance"]).optional(),
  lines: z.array(z.object({
    accountId: z.string().uuid("Account ID must be a valid UUID."),
    entrySide: z.enum(["debit", "credit"]),
    amount: positiveDecimal,
    memo: z.string().optional()
  })).min(2, "At least two journal lines are required.")
});

export function parseOrThrow<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (result.success) {
    return result.data;
  }

  const firstIssue = result.error.issues[0];
  const path = firstIssue.path.length > 0 ? `${firstIssue.path.join(".")}: ` : "";
  const error = new Error(`${path}${firstIssue.message}`);
  (error as Error & { statusCode: number }).statusCode = 400;
  throw error;
}
