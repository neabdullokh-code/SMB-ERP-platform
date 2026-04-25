import Decimal from "decimal.js";
import type { FinanceAccountCategory } from "@sqb/domain-types";
import type { PoolClient } from "pg";
import { withDb } from "../../lib/db.js";

const MONEY_SCALE = 2;

function moneyText(value: Decimal.Value) {
    return new Decimal(value).toDecimalPlaces(MONEY_SCALE, Decimal.ROUND_HALF_UP).toFixed(MONEY_SCALE);
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

class FinanceUnavailableError extends Error {
    constructor() { super("Finance persistence unavailable"); }
}

async function runWithDb<T>(operation: (client: PoolClient) => Promise<T>) {
    const result = await withDb(async (pool) => {
        const client = await pool.connect();
        try { return await operation(client); }
        finally { client.release(); }
    });
    if (result === null) throw new FinanceUnavailableError();
    return result;
}

// ── Trial Balance ─────────────────────────────────────────

export interface TrialBalanceRow {
    accountId: string;
    accountCode: string;
    accountName: string;
    category: FinanceAccountCategory;
    totalDebit: string;
    totalCredit: string;
    balance: string;
}

export async function getTrialBalance(tenantId: string, filters: { from?: string; to?: string }) {
    return runWithDb(async (client) => {
        const params: Array<string> = [tenantId];
        const dateParts: string[] = [];

        if (filters.from) {
            params.push(isoDate(filters.from));
            dateParts.push(`jb.posted_at::date >= $${params.length}::date`);
        }
        if (filters.to) {
            params.push(isoDate(filters.to));
            dateParts.push(`jb.posted_at::date <= $${params.length}::date`);
        }

        const dateFilter = dateParts.length > 0 ? `and ${dateParts.join(" and ")}` : "";

        const result = await client.query<{
            account_id: string;
            account_code: string;
            account_name: string;
            category: FinanceAccountCategory;
            total_debit: string;
            total_credit: string;
            balance: string;
        }>(
            `select
         fa.id as account_id,
         fa.code as account_code,
         fa.name as account_name,
         fa.category,
         coalesce(sum(case when jl.entry_side = 'debit' then jl.amount else 0 end), 0)::text as total_debit,
         coalesce(sum(case when jl.entry_side = 'credit' then jl.amount else 0 end), 0)::text as total_credit,
         coalesce(sum(
           case when jl.entry_side = fa.normal_side then jl.amount else -jl.amount end
         ), 0)::text as balance
       from finance_accounts fa
       left join finance_journal_lines jl on jl.account_id = fa.id
       left join finance_journal_batches jb on jb.id = jl.batch_id
       where fa.tenant_id = $1
         ${dateFilter}
       group by fa.id
       order by fa.code asc`,
            params
        );

        const rows: TrialBalanceRow[] = result.rows.map((row) => ({
            accountId: row.account_id,
            accountCode: row.account_code,
            accountName: row.account_name,
            category: row.category,
            totalDebit: moneyText(row.total_debit),
            totalCredit: moneyText(row.total_credit),
            balance: moneyText(row.balance)
        }));

        const totalDebit = rows.reduce((sum, row) => sum.plus(row.totalDebit), new Decimal(0));
        const totalCredit = rows.reduce((sum, row) => sum.plus(row.totalCredit), new Decimal(0));

        return {
            periodStart: filters.from ?? null,
            periodEnd: filters.to ?? currentDate(),
            rows,
            totalDebit: moneyText(totalDebit),
            totalCredit: moneyText(totalCredit),
            isBalanced: totalDebit.equals(totalCredit)
        };
    });
}

// ── Profit & Loss ──────────────────────────────────────────

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

export async function getProfitAndLoss(tenantId: string, filters: { from?: string; to?: string }): Promise<ProfitAndLoss> {
    return runWithDb(async (client) => {
        const from = filters.from ? isoDate(filters.from) : `${new Date().getUTCFullYear()}-01-01`;
        const to = filters.to ? isoDate(filters.to) : currentDate();

        const result = await client.query<{
            account_code: string;
            account_name: string;
            category: FinanceAccountCategory;
            amount: string;
        }>(
            `select
         fa.code as account_code,
         fa.name as account_name,
         fa.category,
         coalesce(sum(
           case when jl.entry_side = fa.normal_side then jl.amount else -jl.amount end
         ), 0)::text as amount
       from finance_accounts fa
       join finance_journal_lines jl on jl.account_id = fa.id
       join finance_journal_batches jb on jb.id = jl.batch_id
       where fa.tenant_id = $1
         and fa.category in ('revenue', 'expense')
         and jb.posted_at::date between $2::date and $3::date
       group by fa.id
       having coalesce(sum(
         case when jl.entry_side = fa.normal_side then jl.amount else -jl.amount end
       ), 0) <> 0
       order by fa.category desc, fa.code asc`,
            [tenantId, from, to]
        );

        const revenueAccounts = result.rows
            .filter((row) => row.category === "revenue")
            .map((row) => ({ accountCode: row.account_code, accountName: row.account_name, amount: moneyText(row.amount) }));

        const expenseAccounts = result.rows
            .filter((row) => row.category === "expense")
            .map((row) => ({ accountCode: row.account_code, accountName: row.account_name, amount: moneyText(row.amount) }));

        const totalRevenue = revenueAccounts.reduce((sum, row) => sum.plus(row.amount), new Decimal(0));
        const totalExpenses = expenseAccounts.reduce((sum, row) => sum.plus(row.amount), new Decimal(0));

        return {
            periodStart: from,
            periodEnd: to,
            revenueAccounts,
            expenseAccounts,
            totalRevenue: moneyText(totalRevenue),
            totalExpenses: moneyText(totalExpenses),
            netIncome: moneyText(totalRevenue.minus(totalExpenses))
        };
    }) as Promise<ProfitAndLoss>;
}

// ── Balance Sheet ──────────────────────────────────────────

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

export async function getBalanceSheet(tenantId: string, filters: { asOfDate?: string }): Promise<BalanceSheet> {
    return runWithDb(async (client) => {
        const asOfDate = filters.asOfDate ? isoDate(filters.asOfDate) : currentDate();

        const result = await client.query<{
            account_code: string;
            account_name: string;
            category: FinanceAccountCategory;
            balance: string;
        }>(
            `select
         fa.code as account_code,
         fa.name as account_name,
         fa.category,
         coalesce(sum(
           case when jl.entry_side = fa.normal_side then jl.amount else -jl.amount end
         ), 0)::text as balance
       from finance_accounts fa
       left join finance_journal_lines jl on jl.account_id = fa.id
       left join finance_journal_batches jb on jb.id = jl.batch_id
         and jb.posted_at::date <= $2::date
       where fa.tenant_id = $1
         and fa.category in ('asset', 'liability', 'equity')
       group by fa.id
       order by fa.category asc, fa.code asc`,
            [tenantId, asOfDate]
        );

        function mapRows(category: FinanceAccountCategory): BalanceSheetAccountRow[] {
            return result.rows
                .filter((row) => row.category === category)
                .map((row) => ({ accountCode: row.account_code, accountName: row.account_name, balance: moneyText(row.balance) }));
        }

        const assets = mapRows("asset");
        const liabilities = mapRows("liability");
        const equity = mapRows("equity");

        const totalAssets = assets.reduce((sum, row) => sum.plus(row.balance), new Decimal(0));
        const totalLiabilities = liabilities.reduce((sum, row) => sum.plus(row.balance), new Decimal(0));
        const totalEquity = equity.reduce((sum, row) => sum.plus(row.balance), new Decimal(0));

        return {
            asOfDate,
            assets,
            liabilities,
            equity,
            totalAssets: moneyText(totalAssets),
            totalLiabilities: moneyText(totalLiabilities),
            totalEquity: moneyText(totalEquity)
        };
    }) as Promise<BalanceSheet>;
}
