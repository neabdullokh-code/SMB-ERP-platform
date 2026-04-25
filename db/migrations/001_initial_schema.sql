create extension if not exists "uuid-ossp";

create table tenants (
  id uuid primary key default uuid_generate_v4(),
  slug text not null unique,
  name text not null,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table users (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  phone text not null unique,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table memberships (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id),
  user_id uuid not null references users(id),
  role text not null check (role in ('super_admin', 'bank_admin', 'company_admin', 'employee')),
  created_at timestamptz not null default now()
);

create table terms_documents (
  id uuid primary key default uuid_generate_v4(),
  document_type text not null check (document_type in ('terms_of_service', 'privacy_notice')),
  version text not null,
  content_url text not null,
  published_at timestamptz not null default now(),
  unique (document_type, version)
);

create table terms_acceptances (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id),
  user_id uuid not null references users(id),
  document_id uuid not null references terms_documents(id),
  accepted_version text not null,
  accepted_at timestamptz not null default now(),
  ip_address inet not null,
  user_agent text not null
);

create table audit_events (
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

create table warehouses (
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

create table inventory_items (
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

create table stock_movements (
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

create table stocktakes (
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

create table production_boms (
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

create table production_orders (
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

create table scrap_records (
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

create table service_orders (
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

create table approvals (
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

create table bank_tenant_health (
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

create policy tenant_isolation_warehouses on warehouses
  using (tenant_id = current_setting('app.tenant_id', true)::uuid);
create policy tenant_isolation_inventory_items on inventory_items
  using (tenant_id = current_setting('app.tenant_id', true)::uuid);
create policy tenant_isolation_stock_movements on stock_movements
  using (tenant_id = current_setting('app.tenant_id', true)::uuid);
create policy tenant_isolation_stocktakes on stocktakes
  using (tenant_id = current_setting('app.tenant_id', true)::uuid);
create policy tenant_isolation_production_boms on production_boms
  using (tenant_id = current_setting('app.tenant_id', true)::uuid);
create policy tenant_isolation_production_orders on production_orders
  using (tenant_id = current_setting('app.tenant_id', true)::uuid);
create policy tenant_isolation_scrap_records on scrap_records
  using (tenant_id = current_setting('app.tenant_id', true)::uuid);
create policy tenant_isolation_service_orders on service_orders
  using (tenant_id = current_setting('app.tenant_id', true)::uuid);
create policy tenant_isolation_approvals on approvals
  using (tenant_id = current_setting('app.tenant_id', true)::uuid);

