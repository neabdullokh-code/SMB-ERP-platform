-- Flattened migration file for Supabase SQL editor


-- File: db\migrations\001_initial_schema.sql

create extension if not exists "uuid-ossp";

create table if not exists tenants (
  id uuid primary key default uuid_generate_v4(),
  slug text not null unique,
  name text not null,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  phone text not null unique,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists memberships (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id),
  user_id uuid not null references users(id),
  role text not null check (role in ('super_admin', 'bank_admin', 'company_admin', 'employee')),
  created_at timestamptz not null default now()
);

create table if not exists terms_documents (
  id uuid primary key default uuid_generate_v4(),
  document_type text not null check (document_type in ('terms_of_service', 'privacy_notice')),
  version text not null,
  content_url text not null,
  published_at timestamptz not null default now(),
  unique (document_type, version)
);

create table if not exists terms_acceptances (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id),
  user_id uuid not null references users(id),
  document_id uuid not null references terms_documents(id),
  accepted_version text not null,
  accepted_at timestamptz not null default now(),
  ip_address inet not null,
  user_agent text not null
);

create table if not exists audit_events (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id),
  actor_user_id uuid references users(id),
  actor_role text not null,
  category text not null,
  action text not null,
  resource_type text not null,
  resource_id text not null,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create table if not exists warehouses (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id),
  code text not null,
  name text not null,
  location text not null,
  created_by uuid references users(id),
  updated_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (tenant_id, code)
);

create table if not exists inventory_items (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id),
  warehouse_id uuid not null references warehouses(id),
  sku text not null,
  name text not null,
  category text not null,
  reorder_point integer not null default 0,
  created_by uuid references users(id),
  updated_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (tenant_id, sku)
);

create table if not exists stock_movements (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id),
  item_id uuid not null references inventory_items(id),
  movement_type text not null check (movement_type in ('inbound', 'outbound', 'transfer', 'adjustment')),
  quantity numeric(14,2) not null,
  reference text not null,
  created_by uuid references users(id),
  updated_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists stocktakes (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id),
  warehouse_id uuid not null references warehouses(id),
  started_at timestamptz not null,
  completed_at timestamptz,
  variance_count integer not null default 0,
  created_by uuid references users(id),
  updated_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists production_boms (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id),
  code text not null,
  output_sku text not null,
  version text not null,
  materials jsonb not null,
  created_by uuid references users(id),
  updated_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (tenant_id, code, version)
);

create table if not exists production_orders (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id),
  bom_id uuid not null references production_boms(id),
  status text not null check (status in ('planned', 'in_progress', 'completed', 'blocked')),
  planned_units integer not null,
  produced_units integer not null default 0,
  scheduled_date date not null,
  created_by uuid references users(id),
  updated_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists scrap_records (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id),
  production_order_id uuid not null references production_orders(id),
  reason text not null,
  quantity numeric(14,2) not null,
  created_by uuid references users(id),
  updated_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists service_orders (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id),
  title text not null,
  customer text not null,
  status text not null check (status in ('submitted', 'approved', 'in_progress', 'completed', 'rejected')),
  requested_by text not null,
  due_date date not null,
  created_by uuid references users(id),
  updated_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists approvals (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id),
  entity_type text not null,
  entity_id uuid not null,
  approver_role text not null,
  status text not null check (status in ('pending', 'approved', 'rejected')),
  created_by uuid references users(id),
  updated_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists bank_tenant_health (
  tenant_id uuid primary key references tenants(id),
  credit_score integer not null,
  inventory_risk text not null,
  workflow_bottlenecks integer not null default 0,
  overdue_service_orders integer not null default 0,
  health_trend text not null,
  refreshed_at timestamptz not null default now()
);

alter table warehouses enable row level security;
alter table inventory_items enable row level security;
alter table stock_movements enable row level security;
alter table stocktakes enable row level security;
alter table production_boms enable row level security;
alter table production_orders enable row level security;
alter table scrap_records enable row level security;
alter table service_orders enable row level security;
alter table approvals enable row level security;

drop policy if exists tenant_isolation_warehouses on warehouses;
create policy tenant_isolation_warehouses on warehouses
  using (tenant_id = current_setting('app.tenant_id', true)::uuid);
drop policy if exists tenant_isolation_inventory_items on inventory_items;
create policy tenant_isolation_inventory_items on inventory_items
  using (tenant_id = current_setting('app.tenant_id', true)::uuid);
drop policy if exists tenant_isolation_stock_movements on stock_movements;
create policy tenant_isolation_stock_movements on stock_movements
  using (tenant_id = current_setting('app.tenant_id', true)::uuid);
drop policy if exists tenant_isolation_stocktakes on stocktakes;
create policy tenant_isolation_stocktakes on stocktakes
  using (tenant_id = current_setting('app.tenant_id', true)::uuid);
drop policy if exists tenant_isolation_production_boms on production_boms;
create policy tenant_isolation_production_boms on production_boms
  using (tenant_id = current_setting('app.tenant_id', true)::uuid);
drop policy if exists tenant_isolation_production_orders on production_orders;
create policy tenant_isolation_production_orders on production_orders
  using (tenant_id = current_setting('app.tenant_id', true)::uuid);
drop policy if exists tenant_isolation_scrap_records on scrap_records;
create policy tenant_isolation_scrap_records on scrap_records
  using (tenant_id = current_setting('app.tenant_id', true)::uuid);
drop policy if exists tenant_isolation_service_orders on service_orders;
create policy tenant_isolation_service_orders on service_orders
  using (tenant_id = current_setting('app.tenant_id', true)::uuid);
drop policy if exists tenant_isolation_approvals on approvals;
create policy tenant_isolation_approvals on approvals
  using (tenant_id = current_setting('app.tenant_id', true)::uuid);



-- File: db\migrations\002_auth_identity.sql

create table if not exists credentials (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id),
  password_hash text not null,
  is_privileged boolean not null default false,
  requires_dedicated_account boolean not null default false,
  is_break_glass boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table credentials
drop constraint if exists credentials_user_id_unique;
drop index if exists credentials_user_id_unique;
create unique index if not exists credentials_user_id_unique_idx
  on credentials (user_id);

create table if not exists otp_challenges (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id),
  login_intent text not null check (login_intent in ('smb_customer', 'bank_staff')),
  masked_phone text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  resend_available_at timestamptz not null,
  attempts_remaining integer not null default 5,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create table if not exists sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id),
  tenant_id uuid references tenants(id),
  role text not null check (role in ('super_admin', 'bank_admin', 'company_admin', 'employee')),
  session_token text not null unique,
  is_privileged boolean not null default false,
  requires_terms_acceptance boolean not null default false,
  redirect_path text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create table if not exists login_attempts (
  id uuid primary key default uuid_generate_v4(),
  identifier text not null,
  login_intent text not null check (login_intent in ('smb_customer', 'bank_staff')),
  outcome text not null,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create table if not exists password_reset_requests (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id),
  identifier text not null,
  token text not null unique,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);


-- File: db\migrations\003_workspace_onboarding.sql

create table if not exists workspace_invitations (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id),
  full_name text not null,
  email text not null,
  role text not null check (role in ('company_admin', 'employee')),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked')),
  invited_at timestamptz not null default now(),
  accepted_at timestamptz,
  unique (tenant_id, email)
);


-- File: db\migrations\004_user_email_and_tenant_profiles.sql

alter table users
  add column if not exists email text;

create unique index if not exists users_email_unique_idx
  on users (lower(email))
  where email is not null;

create table if not exists tenant_profiles (
  tenant_id uuid primary key references tenants(id),
  tin text not null,
  business_type text not null,
  region text not null,
  address text not null,
  plan text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tin)
);


-- File: db\migrations\005_otp_methods_and_pgcrypto.sql

create extension if not exists pgcrypto;

create table if not exists otp_methods (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  method_type text not null check (method_type in ('sms', 'totp_app')),
  provider_name text not null,
  destination text,
  secret text,
  is_primary boolean not null default false,
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists otp_methods_primary_per_user_idx
  on otp_methods (user_id)
  where is_primary = true and is_enabled = true;

alter table otp_challenges
  add column if not exists otp_method_id uuid references otp_methods(id),
  add column if not exists delivery_method text not null default 'sms' check (delivery_method in ('sms', 'totp_app')),
  add column if not exists delivery_target text,
  add column if not exists provider_name text not null default 'demo_sms',
  add column if not exists consumed_at timestamptz;


-- File: db\migrations\006_sms_provider_normalization.sql

update otp_methods
set provider_name = 'platform_sms',
    updated_at = now()
where provider_name = 'demo_sms';

alter table otp_challenges
  alter column provider_name set default 'platform_sms';


-- File: db\migrations\007_finance_core.sql

create table if not exists finance_accounts (
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

create table if not exists finance_counterparties (
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

create table if not exists finance_journal_batches (
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

create table if not exists finance_journal_lines (
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

create table if not exists finance_invoices (
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

create table if not exists finance_invoice_lines (
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

create table if not exists finance_bills (
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

create table if not exists finance_bill_lines (
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

create table if not exists finance_payments (
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

create table if not exists finance_payment_allocations (
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

create index if not exists finance_accounts_tenant_idx on finance_accounts (tenant_id, category, code);
create index if not exists finance_journal_batches_tenant_posted_idx on finance_journal_batches (tenant_id, posted_at desc);
create index if not exists finance_journal_lines_tenant_account_idx on finance_journal_lines (tenant_id, account_id);
create index if not exists finance_invoices_tenant_status_idx on finance_invoices (tenant_id, status, due_date);
create index if not exists finance_bills_tenant_status_idx on finance_bills (tenant_id, status, due_date);
create index if not exists finance_payments_tenant_date_idx on finance_payments (tenant_id, payment_date desc);

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


-- File: db\migrations\008_finance_rls.sql

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
drop policy if exists tenant_isolation_finance_accounts on finance_accounts;
create policy tenant_isolation_finance_accounts on finance_accounts
  using (tenant_id = current_setting('app.tenant_id', true)::uuid);

drop policy if exists tenant_isolation_finance_counterparties on finance_counterparties;
create policy tenant_isolation_finance_counterparties on finance_counterparties
  using (tenant_id = current_setting('app.tenant_id', true)::uuid);

drop policy if exists tenant_isolation_finance_journal_batches on finance_journal_batches;
create policy tenant_isolation_finance_journal_batches on finance_journal_batches
  using (tenant_id = current_setting('app.tenant_id', true)::uuid);

drop policy if exists tenant_isolation_finance_journal_lines on finance_journal_lines;
create policy tenant_isolation_finance_journal_lines on finance_journal_lines
  using (tenant_id = current_setting('app.tenant_id', true)::uuid);

drop policy if exists tenant_isolation_finance_invoices on finance_invoices;
create policy tenant_isolation_finance_invoices on finance_invoices
  using (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- finance_invoice_lines uses join through finance_invoices for tenant isolation
drop policy if exists tenant_isolation_finance_invoice_lines on finance_invoice_lines;
create policy tenant_isolation_finance_invoice_lines on finance_invoice_lines
  using (exists (
    select 1 from finance_invoices fi
    where fi.id = finance_invoice_lines.invoice_id
      and fi.tenant_id = current_setting('app.tenant_id', true)::uuid
  ));

drop policy if exists tenant_isolation_finance_bills on finance_bills;
create policy tenant_isolation_finance_bills on finance_bills
  using (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- finance_bill_lines uses join through finance_bills for tenant isolation
drop policy if exists tenant_isolation_finance_bill_lines on finance_bill_lines;
create policy tenant_isolation_finance_bill_lines on finance_bill_lines
  using (exists (
    select 1 from finance_bills fb
    where fb.id = finance_bill_lines.bill_id
      and fb.tenant_id = current_setting('app.tenant_id', true)::uuid
  ));

drop policy if exists tenant_isolation_finance_payments on finance_payments;
create policy tenant_isolation_finance_payments on finance_payments
  using (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- finance_payment_allocations inherits isolation from finance_payments
drop policy if exists tenant_isolation_finance_payment_allocations on finance_payment_allocations;
create policy tenant_isolation_finance_payment_allocations on finance_payment_allocations
  using (exists (
    select 1 from finance_payments fp
    where fp.id = finance_payment_allocations.payment_id
      and fp.tenant_id = current_setting('app.tenant_id', true)::uuid
  ));


-- File: db\migrations\009_super_admin_totp_toggle.sql

alter table credentials
  add column if not exists totp_required boolean not null default true;

update credentials
set totp_required = false,
    updated_at = now()
where is_privileged = true
  and is_break_glass = false;


-- File: db\migrations\010_refresh_tokens.sql

create table if not exists refresh_tokens (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references users(id),
  token_hash  text not null unique,
  session_id  text not null,
  expires_at  timestamptz not null,
  revoked_at  timestamptz,
  ip_address  inet,
  user_agent  text,
  created_at  timestamptz not null default now()
);

create index if not exists refresh_tokens_user_id_idx   on refresh_tokens(user_id);
create index if not exists refresh_tokens_expires_at_idx on refresh_tokens(expires_at) where revoked_at is null;


-- File: db\migrations\011_invite_accept_token.sql

alter table workspace_invitations
  add column if not exists accept_token text,
  add column if not exists phone        text;

alter table workspace_invitations
drop constraint if exists workspace_invitations_accept_token_unique;
drop index if exists workspace_invitations_accept_token_unique;
create unique index if not exists workspace_invitations_accept_token_unique_idx
  on workspace_invitations (accept_token);

-- Backfill tokens for any existing pending invitations
update workspace_invitations
set accept_token = gen_random_uuid()::text
where accept_token is null
  and status = 'pending';


-- File: db\migrations\012_workspace_access_control.sql

alter table memberships
  add column if not exists permission_groups jsonb not null default '[]'::jsonb;

alter table workspace_invitations
  add column if not exists permission_groups jsonb not null default '[]'::jsonb;

update memberships
set role = 'operator'
where role = 'employee'
  and tenant_id is not null;

update workspace_invitations
set role = 'operator'
where role = 'employee';

alter table memberships
  drop constraint if exists memberships_role_check;

alter table memberships
  add constraint memberships_role_check
  check (
    role in (
      'super_admin',
      'bank_admin',
      'owner',
      'company_admin',
      'manager',
      'operator',
      'employee'
    )
  );

alter table workspace_invitations
  drop constraint if exists workspace_invitations_role_check;

alter table workspace_invitations
  add constraint workspace_invitations_role_check
  check (role in ('owner', 'company_admin', 'manager', 'operator'));

create index if not exists memberships_tenant_user_idx
  on memberships (tenant_id, user_id);

create index if not exists workspace_invitations_tenant_status_idx
  on workspace_invitations (tenant_id, status, invited_at desc);


-- File: db\migrations\013_session_last_seen.sql

alter table sessions
  add column if not exists last_seen_at timestamptz not null default now();

update sessions
set last_seen_at = coalesce(last_seen_at, created_at)
where last_seen_at is distinct from coalesce(last_seen_at, created_at);

create index if not exists sessions_user_tenant_last_seen_idx
  on sessions (user_id, tenant_id, last_seen_at desc);


-- File: db\migrations\014_bank_surface_d4.sql

create or replace function prevent_audit_event_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'audit_events is append-only';
end;
$$;

drop trigger if exists audit_events_prevent_update on audit_events;
create trigger audit_events_prevent_update
before update on audit_events
for each row
execute function prevent_audit_event_mutation();

drop trigger if exists audit_events_prevent_delete on audit_events;
create trigger audit_events_prevent_delete
before delete on audit_events
for each row
execute function prevent_audit_event_mutation();

create index if not exists audit_events_occurred_at_idx on audit_events (occurred_at desc);
create index if not exists audit_events_tenant_id_idx on audit_events (tenant_id);
create index if not exists audit_events_category_idx on audit_events (category);
create index if not exists audit_events_actor_role_idx on audit_events (actor_role);
create index if not exists audit_events_metadata_gin_idx on audit_events using gin (metadata);

alter table bank_tenant_health
  add column if not exists industry text not null default 'General business',
  add column if not exists region text not null default 'Unknown',
  add column if not exists score_version text not null default 'risk_v1',
  add column if not exists score_factors jsonb not null default '[]'::jsonb,
  add column if not exists recommended_action text not null default 'review',
  add column if not exists default_risk_percent numeric(6,2) not null default 0,
  add column if not exists expected_return_percent numeric(6,2) not null default 0;

alter table bank_tenant_health
  drop constraint if exists bank_tenant_health_inventory_risk_check;

alter table bank_tenant_health
  add constraint bank_tenant_health_inventory_risk_check
  check (inventory_risk in ('low', 'moderate', 'high'));

alter table bank_tenant_health
  drop constraint if exists bank_tenant_health_health_trend_check;

alter table bank_tenant_health
  add constraint bank_tenant_health_health_trend_check
  check (health_trend in ('up', 'flat', 'down'));

alter table bank_tenant_health
  drop constraint if exists bank_tenant_health_recommended_action_check;

alter table bank_tenant_health
  add constraint bank_tenant_health_recommended_action_check
  check (recommended_action in ('approve', 'review', 'decline'));

create table if not exists credit_applications (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id),
  status text not null
    check (status in ('submitted', 'in_review', 'approved', 'counter_offered', 'declined')),
  submitted_at timestamptz not null default now(),
  product text not null,
  purpose text not null,
  requested_amount numeric(14,2) not null,
  requested_term_months integer not null,
  approved_amount numeric(14,2),
  approved_term_months integer,
  approved_rate_percent numeric(6,2),
  priority text not null default 'normal'
    check (priority in ('high', 'normal')),
  ai_recommendation text not null
    check (ai_recommendation in ('approve', 'review', 'decline')),
  ai_rationale text not null,
  score_snapshot integer not null,
  score_version text not null default 'risk_v1',
  assigned_bank_user_id uuid references users(id),
  last_reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists credit_applications_status_idx on credit_applications (status, submitted_at desc);
create index if not exists credit_applications_tenant_idx on credit_applications (tenant_id);
create index if not exists credit_applications_assigned_bank_user_idx on credit_applications (assigned_bank_user_id);

create table if not exists credit_decisions (
  id uuid primary key default uuid_generate_v4(),
  application_id uuid not null references credit_applications(id) on delete cascade,
  actor_user_id uuid not null references users(id),
  actor_role text not null,
  decision text not null
    check (decision in ('approve', 'counter_offer', 'decline')),
  notes text,
  approved_amount numeric(14,2),
  approved_term_months integer,
  approved_rate_percent numeric(6,2),
  created_at timestamptz not null default now()
);

create index if not exists credit_decisions_application_idx on credit_decisions (application_id, created_at desc);

create table if not exists credit_application_documents (
  id uuid primary key default uuid_generate_v4(),
  application_id uuid not null references credit_applications(id) on delete cascade,
  name text not null,
  status text not null check (status in ('available', 'missing')),
  source_type text not null check (source_type in ('auto_pulled', 'uploaded')),
  created_at timestamptz not null default now()
);

create index if not exists credit_application_documents_application_idx on credit_application_documents (application_id);


-- File: db\migrations\014_credit_schema.sql

-- Credit & Bank Surface: loan applications, documents, decisions, risk scores, audit log

CREATE TABLE loan_applications (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id    TEXT NOT NULL,
  step         INTEGER NOT NULL DEFAULT 1,
  status       TEXT NOT NULL DEFAULT 'draft'
               CHECK (status IN ('draft','submitted','under_review','approved','rejected','escalated')),
  step1        JSONB,
  step2        JSONB,
  step3        JSONB,
  risk_score   INTEGER,
  risk_band    TEXT CHECK (risk_band IN ('excellent','good','fair','poor','critical')),
  submitted_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_loan_applications_tenant ON loan_applications (tenant_id);
CREATE INDEX idx_loan_applications_status ON loan_applications (status);

CREATE TABLE loan_documents (
  id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  application_id TEXT NOT NULL REFERENCES loan_applications(id) ON DELETE CASCADE,
  filename       TEXT NOT NULL,
  mime_type      TEXT NOT NULL,
  storage_key    TEXT NOT NULL,
  size_bytes     INTEGER NOT NULL DEFAULT 0,
  uploaded_by    TEXT NOT NULL,
  uploaded_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_loan_documents_application ON loan_documents (application_id);

CREATE TABLE credit_decisions (
  id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  application_id TEXT NOT NULL REFERENCES loan_applications(id) ON DELETE CASCADE,
  decision       TEXT NOT NULL CHECK (decision IN ('approved','rejected','escalated')),
  decided_by     TEXT NOT NULL,
  reason         TEXT NOT NULL,
  decided_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_credit_decisions_application ON credit_decisions (application_id);

CREATE TABLE risk_scores (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id   TEXT NOT NULL,
  score       INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  band        TEXT NOT NULL CHECK (band IN ('excellent','good','fair','poor','critical')),
  factors     JSONB NOT NULL DEFAULT '{}',
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_risk_scores_tenant ON risk_scores (tenant_id);
CREATE INDEX idx_risk_scores_computed ON risk_scores (computed_at DESC);

CREATE TABLE audit_logs (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  actor_user_id TEXT NOT NULL,
  actor_role    TEXT NOT NULL,
  tenant_id     TEXT,
  category      TEXT NOT NULL,
  action        TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id   TEXT NOT NULL,
  occurred_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata      JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX idx_audit_logs_tenant   ON audit_logs (tenant_id);
CREATE INDEX idx_audit_logs_category ON audit_logs (category);
CREATE INDEX idx_audit_logs_occurred ON audit_logs (occurred_at DESC);

-- Trigger to keep updated_at current on loan_applications
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER loan_applications_updated_at
  BEFORE UPDATE ON loan_applications
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- File: db\migrations\015_inventory_unit_cost.sql

alter table inventory_items add column if not exists unit_cost_uzs numeric(14,2) not null default 0;

