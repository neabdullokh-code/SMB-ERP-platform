create table finance_accounts (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  code text not null,
  name text not null,
  category text not null check (category in ('asset', 'liability', 'equity', 'revenue', 'expense')),
  normal_side text not null check (normal_side in ('debit', 'credit')),
  currency text not null default 'UZS' check (currency = 'UZS'),
  system_key text,
  is_system boolean not null default false,
  created_by uuid references users(id),
  updated_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, code),
  unique (tenant_id, system_key)
);

create table finance_counterparties (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  name text not null,
  type text not null check (type in ('customer', 'supplier', 'both')),
  tax_id text,
  phone text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, name)
);

create table finance_journal_batches (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  source_type text not null check (source_type in ('invoice_issue', 'bill_post', 'payment', 'manual_adjustment', 'opening_balance', 'reversal')),
  source_id uuid,
  memo text,
  posted_at timestamptz not null default now(),
  reversal_of_batch_id uuid references finance_journal_batches(id),
  created_by uuid references users(id),
  created_at timestamptz not null default now()
);

create table finance_journal_lines (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  batch_id uuid not null references finance_journal_batches(id) on delete cascade,
  account_id uuid not null references finance_accounts(id),
  counterparty_id uuid references finance_counterparties(id),
  entry_side text not null check (entry_side in ('debit', 'credit')),
  amount numeric(18,2) not null check (amount > 0),
  memo text,
  created_at timestamptz not null default now()
);

create table finance_invoices (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  counterparty_id uuid not null references finance_counterparties(id),
  number text not null,
  status text not null check (status in ('draft', 'issued', 'voided')),
  currency text not null default 'UZS' check (currency = 'UZS'),
  issue_date date,
  due_date date not null,
  subtotal numeric(18,2) not null default 0,
  tax_total numeric(18,2) not null default 0,
  total numeric(18,2) not null default 0,
  notes text,
  issued_batch_id uuid references finance_journal_batches(id),
  created_by uuid references users(id),
  updated_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, number)
);

create table finance_invoice_lines (
  id uuid primary key default uuid_generate_v4(),
  invoice_id uuid not null references finance_invoices(id) on delete cascade,
  revenue_account_id uuid not null references finance_accounts(id),
  position integer not null default 0,
  description text not null,
  quantity numeric(18,2) not null check (quantity > 0),
  unit_price numeric(18,2) not null check (unit_price > 0),
  tax_rate numeric(8,2) not null default 0 check (tax_rate >= 0),
  line_subtotal numeric(18,2) not null,
  tax_total numeric(18,2) not null,
  line_total numeric(18,2) not null,
  created_at timestamptz not null default now()
);

create table finance_bills (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  counterparty_id uuid not null references finance_counterparties(id),
  number text not null,
  status text not null check (status in ('draft', 'posted', 'voided')),
  currency text not null default 'UZS' check (currency = 'UZS'),
  issue_date date,
  due_date date not null,
  subtotal numeric(18,2) not null default 0,
  tax_total numeric(18,2) not null default 0,
  total numeric(18,2) not null default 0,
  notes text,
  posted_batch_id uuid references finance_journal_batches(id),
  created_by uuid references users(id),
  updated_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, number)
);

create table finance_bill_lines (
  id uuid primary key default uuid_generate_v4(),
  bill_id uuid not null references finance_bills(id) on delete cascade,
  expense_account_id uuid not null references finance_accounts(id),
  position integer not null default 0,
  description text not null,
  quantity numeric(18,2) not null check (quantity > 0),
  unit_price numeric(18,2) not null check (unit_price > 0),
  tax_rate numeric(8,2) not null default 0 check (tax_rate >= 0),
  line_subtotal numeric(18,2) not null,
  tax_total numeric(18,2) not null,
  line_total numeric(18,2) not null,
  created_at timestamptz not null default now()
);

create table finance_payments (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  direction text not null check (direction in ('incoming', 'outgoing')),
  counterparty_id uuid not null references finance_counterparties(id),
  payment_date date not null,
  amount numeric(18,2) not null check (amount > 0),
  currency text not null default 'UZS' check (currency = 'UZS'),
  reference text,
  cash_account_id uuid not null references finance_accounts(id),
  batch_id uuid not null references finance_journal_batches(id),
  created_by uuid references users(id),
  created_at timestamptz not null default now()
);

create table finance_payment_allocations (
  id uuid primary key default uuid_generate_v4(),
  payment_id uuid not null references finance_payments(id) on delete cascade,
  invoice_id uuid references finance_invoices(id),
  bill_id uuid references finance_bills(id),
  amount numeric(18,2) not null check (amount > 0),
  created_at timestamptz not null default now(),
  check (
    (invoice_id is not null and bill_id is null)
    or (invoice_id is null and bill_id is not null)
  )
);

create index finance_accounts_tenant_idx on finance_accounts (tenant_id, category, code);
create index finance_journal_batches_tenant_posted_idx on finance_journal_batches (tenant_id, posted_at desc);
create index finance_journal_lines_tenant_account_idx on finance_journal_lines (tenant_id, account_id);
create index finance_invoices_tenant_status_idx on finance_invoices (tenant_id, status, due_date);
create index finance_bills_tenant_status_idx on finance_bills (tenant_id, status, due_date);
create index finance_payments_tenant_date_idx on finance_payments (tenant_id, payment_date desc);

insert into finance_accounts (
  tenant_id,
  code,
  name,
  category,
  normal_side,
  currency,
  system_key,
  is_system
)
select
  tenants.id,
  defaults.code,
  defaults.name,
  defaults.category,
  defaults.normal_side,
  'UZS',
  defaults.system_key,
  true
from tenants
cross join (
  values
    ('1001', 'Cash', 'asset', 'debit', 'cash'),
    ('1100', 'Accounts receivable', 'asset', 'debit', 'accounts_receivable'),
    ('1150', 'Recoverable VAT', 'asset', 'debit', 'vat_receivable'),
    ('1200', 'Inventory', 'asset', 'debit', 'inventory'),
    ('2001', 'Accounts payable', 'liability', 'credit', 'accounts_payable'),
    ('2100', 'VAT payable', 'liability', 'credit', 'vat_payable'),
    ('3001', 'Retained earnings', 'equity', 'credit', 'retained_earnings'),
    ('4000', 'Sales revenue', 'revenue', 'credit', 'sales_revenue'),
    ('5000', 'Cost of goods sold', 'expense', 'debit', 'cost_of_goods_sold'),
    ('5100', 'Operating expenses', 'expense', 'debit', 'operating_expense')
) as defaults(code, name, category, normal_side, system_key)
on conflict (tenant_id, code) do nothing;
