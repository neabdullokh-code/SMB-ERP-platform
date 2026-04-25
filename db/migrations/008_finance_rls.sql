-- Enable row-level security on all finance tables
alter table finance_accounts enable row level security;
alter table finance_counterparties enable row level security;
alter table finance_journal_batches enable row level security;
alter table finance_journal_lines enable row level security;
alter table finance_invoices enable row level security;
alter table finance_invoice_lines enable row level security;
alter table finance_bills enable row level security;
alter table finance_bill_lines enable row level security;
alter table finance_payments enable row level security;
alter table finance_payment_allocations enable row level security;

-- Tenant isolation policies
create policy tenant_isolation_finance_accounts on finance_accounts
  using (tenant_id = current_setting('app.tenant_id', true)::uuid);

create policy tenant_isolation_finance_counterparties on finance_counterparties
  using (tenant_id = current_setting('app.tenant_id', true)::uuid);

create policy tenant_isolation_finance_journal_batches on finance_journal_batches
  using (tenant_id = current_setting('app.tenant_id', true)::uuid);

create policy tenant_isolation_finance_journal_lines on finance_journal_lines
  using (tenant_id = current_setting('app.tenant_id', true)::uuid);

create policy tenant_isolation_finance_invoices on finance_invoices
  using (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- finance_invoice_lines uses join through finance_invoices for tenant isolation
create policy tenant_isolation_finance_invoice_lines on finance_invoice_lines
  using (exists (
    select 1 from finance_invoices fi
    where fi.id = finance_invoice_lines.invoice_id
      and fi.tenant_id = current_setting('app.tenant_id', true)::uuid
  ));

create policy tenant_isolation_finance_bills on finance_bills
  using (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- finance_bill_lines uses join through finance_bills for tenant isolation
create policy tenant_isolation_finance_bill_lines on finance_bill_lines
  using (exists (
    select 1 from finance_bills fb
    where fb.id = finance_bill_lines.bill_id
      and fb.tenant_id = current_setting('app.tenant_id', true)::uuid
  ));

create policy tenant_isolation_finance_payments on finance_payments
  using (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- finance_payment_allocations inherits isolation from finance_payments
create policy tenant_isolation_finance_payment_allocations on finance_payment_allocations
  using (exists (
    select 1 from finance_payments fp
    where fp.id = finance_payment_allocations.payment_id
      and fp.tenant_id = current_setting('app.tenant_id', true)::uuid
  ));
