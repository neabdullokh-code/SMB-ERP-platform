# Finance UI Behavior Notes

## Date-driven statuses

- Invoice and bill badges in SMB finance are derived from `dueDate` and outstanding amount.
- If `dueDate` is before today and outstanding is greater than `0`, the UI shows `overdue`.
- If outstanding is `0`, the UI shows `paid`.

## Ledger balances

- General ledger balances are computed from trial balance rows when available.
- If trial balance is not available, balances are derived from ledger debit/credit totals by account normal side.

## Cash flow fallback

- Cash flow KPIs and chart use `/finance/cash-flow` buckets first.
- If buckets are empty/zero, the UI derives monthly inflow/outflow from `/finance/payments`.

## Functional finance actions

- Invoices: `Export`, `New`, and `Send reminder` are functional.
- Bills: `Export`, `New`, and `Mark paid` are functional.
- General ledger: `Export` and `New` (manual journal) are functional.
- Cash flow: `Export` and `New` (manual journal) are functional.
- Reports: `Preview`, `Generate`, header `Export`, and `Refresh` are functional.
