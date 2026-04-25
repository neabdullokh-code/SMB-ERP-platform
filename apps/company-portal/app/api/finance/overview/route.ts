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

async function fetchJson(sessionToken: string, path: string) {
  const response = await fetch(`${platformApiUrl()}${path}`, {
    headers: { "x-session-token": sessionToken },
    cache: "no-store"
  });
  const body = await response.json();
  return { response, body };
}

export async function GET(request: Request) {
  const sessionToken = readCookie(request, "erp_auth_session");
  if (!sessionToken) {
    return NextResponse.json({ message: "Session not found", errorCode: "SESSION_INVALID" }, { status: 401 });
  }

  const [accounts, ledger, invoices, bills, cashFlow, reports, payments] = await Promise.all([
    fetchJson(sessionToken, "/finance/accounts"),
    fetchJson(sessionToken, "/finance/ledger"),
    fetchJson(sessionToken, "/finance/invoices"),
    fetchJson(sessionToken, "/finance/bills"),
    fetchJson(sessionToken, "/finance/cash-flow?bucket=month"),
    Promise.all([
      fetchJson(sessionToken, "/finance/reports/trial-balance"),
      fetchJson(sessionToken, "/finance/reports/profit-and-loss"),
      fetchJson(sessionToken, "/finance/reports/balance-sheet")
    ]),
    fetchJson(sessionToken, "/finance/payments")
  ]);

  const firstError =
    !accounts.response.ok ? accounts :
    !ledger.response.ok ? ledger :
    !invoices.response.ok ? invoices :
    !bills.response.ok ? bills :
    !cashFlow.response.ok ? cashFlow :
    !reports[0].response.ok ? reports[0] :
    !reports[1].response.ok ? reports[1] :
    !reports[2].response.ok ? reports[2] :
    !payments.response.ok ? payments :
    null;

  if (firstError) {
    return NextResponse.json(firstError.body, { status: firstError.response.status });
  }

  return NextResponse.json({
    data: {
      accounts: accounts.body.data ?? [],
      ledger: ledger.body.data ?? [],
      ledgerMeta: ledger.body.meta ?? null,
      invoices: invoices.body.data ?? [],
      bills: bills.body.data ?? [],
      cashFlow: cashFlow.body.data ?? [],
      trialBalance: reports[0].body.data ?? null,
      profitAndLoss: reports[1].body.data ?? null,
      balanceSheet: reports[2].body.data ?? null,
      payments: payments.body.data ?? []
    },
    meta: null,
    error: null
  }, { status: 200 });
}
