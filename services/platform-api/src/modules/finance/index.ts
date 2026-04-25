import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type {
  CreateBillRequest,
  CreateInvoiceRequest,
  CreateManualJournalRequest,
  PaymentDirection,
  RecordBillPaymentRequest,
  RecordInvoicePaymentRequest
} from "@sqb/domain-types";
import { hasPermission } from "@sqb/domain-types";
import { resolveRequestAuth } from "../../lib/permissions.js";
import { ok, paginated } from "../../lib/envelope.js";
import { getTrialBalance, getProfitAndLoss, getBalanceSheet } from "./reports.js";
import { generateInvoicePdf, generateBillPdf } from "./pdf.js";
import {
  createBill,
  createInvoice,
  createManualJournal,
  getCashFlow,
  getCounterparty,
  getTenantFinanceSnapshot,
  isFinanceUnavailableError,
  issueInvoice,
  listBills,
  listCounterparties,
  listFinanceAccounts,
  listInvoices,
  listLedgerEntries,
  listPayments,
  postBill,
  recordBillPayment,
  recordInvoicePayment,
  voidBill,
  voidInvoice
} from "./store.js";
import {
  CreateBillSchema,
  CreateInvoiceSchema,
  ManualJournalSchema,
  RecordPaymentSchema,
  parseOrThrow
} from "./validation.js";

async function requireAuthenticatedCompanyFinance(request: FastifyRequest, reply: FastifyReply, writeAccess = false) {
  const auth = await resolveRequestAuth(request);

  if (!auth.isAuthenticated || !auth.session) {
    reply.code(401).send({ data: null, meta: null, error: { message: "Authenticated session required.", errorCode: null } });
    return null;
  }

  const requiredPermission = writeAccess ? "finance.manage" : "finance.read";
  if (!hasPermission(auth.permissions, requiredPermission)) {
    reply.code(403).send({ data: null, meta: null, error: { message: "Finance access is restricted to assigned finance permissions.", errorCode: null } });
    return null;
  }

  if (!auth.tenantId) {
    reply.code(400).send({ data: null, meta: null, error: { message: "Tenant-scoped finance access requires a tenant session.", errorCode: null } });
    return null;
  }

  return {
    tenantId: auth.tenantId,
    actorUserId: auth.actorUserId
  };
}

async function requireBankFinanceAccess(request: FastifyRequest, reply: FastifyReply) {
  const auth = await resolveRequestAuth(request);

  if (!auth.isAuthenticated || !auth.session) {
    reply.code(401).send({ data: null, meta: null, error: { message: "Authenticated session required.", errorCode: null } });
    return null;
  }

  if (!hasPermission(auth.permissions, "bank.monitor")) {
    reply.code(403).send({ data: null, meta: null, error: { message: "Finance snapshot access is restricted to bank monitoring permissions.", errorCode: null } });
    return null;
  }

  return { actorUserId: auth.actorUserId };
}

function sendFinanceError(reply: FastifyReply, error: unknown) {
  if (isFinanceUnavailableError(error)) {
    return reply.code(503).send({ data: null, meta: null, error: { message: error.message, errorCode: "FINANCE_UNAVAILABLE" } });
  }

  const message = error instanceof Error ? error.message : "Finance request failed.";
  const statusCode = message.toLowerCase().includes("not found") ? 404 : 400;
  return reply.code(statusCode).send({ data: null, meta: null, error: { message, errorCode: null } });
}

export async function financeModule(app: FastifyInstance) {
  // ── Accounts ──────────────────────────────────────────────
  app.get("/finance/accounts", async (request, reply) => {
    const access = await requireAuthenticatedCompanyFinance(request, reply);
    if (!access) return;

    try {
      return ok(await listFinanceAccounts(access.tenantId));
    } catch (error) {
      return sendFinanceError(reply, error);
    }
  });

  // ── Ledger ────────────────────────────────────────────────
  app.get("/finance/ledger", async (request, reply) => {
    const access = await requireAuthenticatedCompanyFinance(request, reply);
    if (!access) return;

    try {
      const query = request.query as { from?: string; to?: string; accountId?: string; page?: string };
      const result = await listLedgerEntries(access.tenantId, {
        from: query.from,
        to: query.to,
        accountId: query.accountId,
        page: query.page ? Number(query.page) : undefined
      });
      return paginated(result.entries, result.page, result.pageSize, result.total);
    } catch (error) {
      return sendFinanceError(reply, error);
    }
  });

  // ── Invoices ──────────────────────────────────────────────
  app.get("/finance/invoices", async (request, reply) => {
    const access = await requireAuthenticatedCompanyFinance(request, reply);
    if (!access) return;

    try {
      return ok(await listInvoices(access.tenantId));
    } catch (error) {
      return sendFinanceError(reply, error);
    }
  });

  app.post("/finance/invoices", async (request, reply) => {
    const access = await requireAuthenticatedCompanyFinance(request, reply, true);
    if (!access) return;

    try {
      const payload = parseOrThrow(CreateInvoiceSchema, request.body) as CreateInvoiceRequest;
      const invoice = await createInvoice(access.tenantId, access.actorUserId, payload);
      return reply.code(201).send(ok(invoice));
    } catch (error) {
      return sendFinanceError(reply, error);
    }
  });

  app.post("/finance/invoices/:id/issue", async (request, reply) => {
    const access = await requireAuthenticatedCompanyFinance(request, reply, true);
    if (!access) return;

    try {
      return ok(await issueInvoice(access.tenantId, access.actorUserId, (request.params as { id: string }).id));
    } catch (error) {
      return sendFinanceError(reply, error);
    }
  });

  app.post("/finance/invoices/:id/void", async (request, reply) => {
    const access = await requireAuthenticatedCompanyFinance(request, reply, true);
    if (!access) return;

    try {
      return ok(await voidInvoice(access.tenantId, access.actorUserId, (request.params as { id: string }).id));
    } catch (error) {
      return sendFinanceError(reply, error);
    }
  });

  app.post("/finance/invoices/:id/payments", async (request, reply) => {
    const access = await requireAuthenticatedCompanyFinance(request, reply, true);
    if (!access) return;

    try {
      const payload = parseOrThrow(RecordPaymentSchema, request.body) as RecordInvoicePaymentRequest;
      return ok(await recordInvoicePayment(access.tenantId, access.actorUserId, (request.params as { id: string }).id, payload));
    } catch (error) {
      return sendFinanceError(reply, error);
    }
  });

  // ── Bills ─────────────────────────────────────────────────
  app.get("/finance/bills", async (request, reply) => {
    const access = await requireAuthenticatedCompanyFinance(request, reply);
    if (!access) return;

    try {
      return ok(await listBills(access.tenantId));
    } catch (error) {
      return sendFinanceError(reply, error);
    }
  });

  app.post("/finance/bills", async (request, reply) => {
    const access = await requireAuthenticatedCompanyFinance(request, reply, true);
    if (!access) return;

    try {
      const payload = parseOrThrow(CreateBillSchema, request.body) as CreateBillRequest;
      const bill = await createBill(access.tenantId, access.actorUserId, payload);
      return reply.code(201).send(ok(bill));
    } catch (error) {
      return sendFinanceError(reply, error);
    }
  });

  app.post("/finance/bills/:id/post", async (request, reply) => {
    const access = await requireAuthenticatedCompanyFinance(request, reply, true);
    if (!access) return;

    try {
      return ok(await postBill(access.tenantId, access.actorUserId, (request.params as { id: string }).id));
    } catch (error) {
      return sendFinanceError(reply, error);
    }
  });

  app.post("/finance/bills/:id/void", async (request, reply) => {
    const access = await requireAuthenticatedCompanyFinance(request, reply, true);
    if (!access) return;

    try {
      return ok(await voidBill(access.tenantId, access.actorUserId, (request.params as { id: string }).id));
    } catch (error) {
      return sendFinanceError(reply, error);
    }
  });

  app.post("/finance/bills/:id/payments", async (request, reply) => {
    const access = await requireAuthenticatedCompanyFinance(request, reply, true);
    if (!access) return;

    try {
      const payload = parseOrThrow(RecordPaymentSchema, request.body) as RecordBillPaymentRequest;
      return ok(await recordBillPayment(access.tenantId, access.actorUserId, (request.params as { id: string }).id, payload));
    } catch (error) {
      return sendFinanceError(reply, error);
    }
  });

  // ── Manual Journals ───────────────────────────────────────
  app.post("/finance/journals/manual", async (request, reply) => {
    const access = await requireAuthenticatedCompanyFinance(request, reply, true);
    if (!access) return;

    try {
      const payload = parseOrThrow(ManualJournalSchema, request.body) as CreateManualJournalRequest;
      return ok(await createManualJournal(access.tenantId, access.actorUserId, payload));
    } catch (error) {
      return sendFinanceError(reply, error);
    }
  });

  // ── Cash Flow ─────────────────────────────────────────────
  app.get("/finance/cash-flow", async (request, reply) => {
    const access = await requireAuthenticatedCompanyFinance(request, reply);
    if (!access) return;

    try {
      const query = request.query as { from?: string; to?: string; bucket?: "month" };
      return ok(await getCashFlow(access.tenantId, query));
    } catch (error) {
      return sendFinanceError(reply, error);
    }
  });

  // ── Counterparties ────────────────────────────────────────
  app.get("/finance/counterparties", async (request, reply) => {
    const access = await requireAuthenticatedCompanyFinance(request, reply);
    if (!access) return;

    try {
      return ok(await listCounterparties(access.tenantId));
    } catch (error) {
      return sendFinanceError(reply, error);
    }
  });

  app.get("/finance/counterparties/:id", async (request, reply) => {
    const access = await requireAuthenticatedCompanyFinance(request, reply);
    if (!access) return;

    try {
      return ok(await getCounterparty(access.tenantId, (request.params as { id: string }).id));
    } catch (error) {
      return sendFinanceError(reply, error);
    }
  });

  // ── Payments ──────────────────────────────────────────────
  app.get("/finance/payments", async (request, reply) => {
    const access = await requireAuthenticatedCompanyFinance(request, reply);
    if (!access) return;

    try {
      const query = request.query as { from?: string; to?: string; direction?: PaymentDirection };
      return ok(await listPayments(access.tenantId, query));
    } catch (error) {
      return sendFinanceError(reply, error);
    }
  });

  // ── Reports ────────────────────────────────────────────────
  app.get("/finance/reports/trial-balance", async (request, reply) => {
    const access = await requireAuthenticatedCompanyFinance(request, reply);
    if (!access) return;

    try {
      const query = request.query as { from?: string; to?: string };
      return ok(await getTrialBalance(access.tenantId, query));
    } catch (error) {
      return sendFinanceError(reply, error);
    }
  });

  app.get("/finance/reports/profit-and-loss", async (request, reply) => {
    const access = await requireAuthenticatedCompanyFinance(request, reply);
    if (!access) return;

    try {
      const query = request.query as { from?: string; to?: string };
      return ok(await getProfitAndLoss(access.tenantId, query));
    } catch (error) {
      return sendFinanceError(reply, error);
    }
  });

  app.get("/finance/reports/balance-sheet", async (request, reply) => {
    const access = await requireAuthenticatedCompanyFinance(request, reply);
    if (!access) return;

    try {
      const query = request.query as { asOfDate?: string };
      return ok(await getBalanceSheet(access.tenantId, query));
    } catch (error) {
      return sendFinanceError(reply, error);
    }
  });

  // ── PDF Downloads ─────────────────────────────────────────
  app.get("/finance/invoices/:id/pdf", async (request, reply) => {
    const access = await requireAuthenticatedCompanyFinance(request, reply);
    if (!access) return;

    try {
      const invoices = await listInvoices(access.tenantId);
      const invoice = invoices?.find((inv) => inv.id === (request.params as { id: string }).id);

      if (!invoice) {
        return reply.code(404).send({ data: null, meta: null, error: { message: "Invoice not found.", errorCode: null } });
      }

      const pdf = generateInvoicePdf(invoice);
      reply.header("Content-Type", "application/pdf");
      reply.header("Content-Disposition", `attachment; filename="${invoice.number}.pdf"`);
      return reply.send(pdf);
    } catch (error) {
      return sendFinanceError(reply, error);
    }
  });

  app.get("/finance/bills/:id/pdf", async (request, reply) => {
    const access = await requireAuthenticatedCompanyFinance(request, reply);
    if (!access) return;

    try {
      const bills = await listBills(access.tenantId);
      const bill = bills?.find((b) => b.id === (request.params as { id: string }).id);

      if (!bill) {
        return reply.code(404).send({ data: null, meta: null, error: { message: "Bill not found.", errorCode: null } });
      }

      const pdf = generateBillPdf(bill);
      reply.header("Content-Type", "application/pdf");
      reply.header("Content-Disposition", `attachment; filename="${bill.number}.pdf"`);
      return reply.send(pdf);
    } catch (error) {
      return sendFinanceError(reply, error);
    }
  });

  // ── Bank Snapshot ─────────────────────────────────────────
  app.get("/finance/snapshot/:tenantId", async (request, reply) => {
    const access = await requireBankFinanceAccess(request, reply);
    if (!access) return;

    try {
      const tenantId = (request.params as { tenantId: string }).tenantId;
      return ok(await getTenantFinanceSnapshot(tenantId));
    } catch (error) {
      return sendFinanceError(reply, error);
    }
  });
}
