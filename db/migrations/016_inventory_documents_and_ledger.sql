-- =============================================================================
-- Migration 016 — Inventory Documents + Ledger_Inventory (1C accumulation register)
-- =============================================================================
-- Introduces the Document/Ledger pattern for inventory:
--
--   * Doc_GoodsReceipt_Header   + Doc_GoodsReceipt_Lines
--   * Doc_GoodsIssue_Header     + Doc_GoodsIssue_Lines
--   * Doc_InventoryTransfer_Header + Doc_InventoryTransfer_Lines
--   * Ledger_Inventory          (append-only accumulation register)
--   * v_inventory_on_hand       (read model for current stock per warehouse)
--
-- Documents carry status DRAFT | POSTED | VOID. Only POSTED documents write
-- rows to the ledger. VOID documents write reversing rows instead of deleting.
--
-- The legacy `stock_movements` table is preserved for backward-compat reads
-- (it is NOT dropped in this migration) and is backfilled into the ledger via
-- a synthetic Goods Receipt per row so historical on-hand balances survive the
-- migration. A follow-up migration will drop `stock_movements` once the new
-- flow has been exercised for one release cycle.
-- =============================================================================

-- ── Movement type & document status enums ────────────────────────────────────

do $$
begin
  if not exists (select 1 from pg_type where typname = 'inventory_movement_type') then
    create type inventory_movement_type as enum ('IN', 'OUT');
  end if;
  if not exists (select 1 from pg_type where typname = 'inventory_document_kind') then
    create type inventory_document_kind as enum (
      'goods_receipt',
      'goods_issue',
      'inventory_transfer',
      'production_consumption',
      'production_output',
      'stocktake_adjustment',
      'legacy_backfill'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'document_status') then
    create type document_status as enum ('DRAFT', 'POSTED', 'VOID');
  end if;
end$$;

-- ── Counterparties (shared, reused by finance) ───────────────────────────────
-- finance_counterparties already exists; inventory documents reuse it via the
-- same FK so the catalog is not duplicated.

-- ── Doc_GoodsReceipt ────────────────────────────────────────────────────────

create table if not exists doc_goods_receipt_header (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  document_number text not null,
  document_date date not null,
  warehouse_id uuid not null references warehouses(id),
  counterparty_id uuid references finance_counterparties(id),
  status document_status not null default 'DRAFT',
  notes text,
  posted_at timestamptz,
  voided_at timestamptz,
  created_by uuid references users(id),
  updated_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, document_number)
);

create table if not exists doc_goods_receipt_lines (
  id uuid primary key default uuid_generate_v4(),
  header_id uuid not null references doc_goods_receipt_header(id) on delete cascade,
  tenant_id uuid not null references tenants(id) on delete cascade,
  position integer not null default 0,
  item_id uuid not null references inventory_items(id),
  quantity numeric(18,4) not null check (quantity > 0),
  unit_cost_uzs numeric(18,2) not null check (unit_cost_uzs >= 0),
  line_total_uzs numeric(18,2) not null check (line_total_uzs >= 0),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists doc_goods_receipt_header_tenant_date_idx
  on doc_goods_receipt_header (tenant_id, document_date desc);
create index if not exists doc_goods_receipt_header_tenant_status_idx
  on doc_goods_receipt_header (tenant_id, status);
create index if not exists doc_goods_receipt_lines_header_idx
  on doc_goods_receipt_lines (header_id);
create index if not exists doc_goods_receipt_lines_item_idx
  on doc_goods_receipt_lines (tenant_id, item_id);

-- ── Doc_GoodsIssue ──────────────────────────────────────────────────────────

create table if not exists doc_goods_issue_header (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  document_number text not null,
  document_date date not null,
  warehouse_id uuid not null references warehouses(id),
  counterparty_id uuid references finance_counterparties(id),
  status document_status not null default 'DRAFT',
  notes text,
  posted_at timestamptz,
  voided_at timestamptz,
  created_by uuid references users(id),
  updated_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, document_number)
);

create table if not exists doc_goods_issue_lines (
  id uuid primary key default uuid_generate_v4(),
  header_id uuid not null references doc_goods_issue_header(id) on delete cascade,
  tenant_id uuid not null references tenants(id) on delete cascade,
  position integer not null default 0,
  item_id uuid not null references inventory_items(id),
  quantity numeric(18,4) not null check (quantity > 0),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists doc_goods_issue_header_tenant_date_idx
  on doc_goods_issue_header (tenant_id, document_date desc);
create index if not exists doc_goods_issue_header_tenant_status_idx
  on doc_goods_issue_header (tenant_id, status);
create index if not exists doc_goods_issue_lines_header_idx
  on doc_goods_issue_lines (header_id);
create index if not exists doc_goods_issue_lines_item_idx
  on doc_goods_issue_lines (tenant_id, item_id);

-- ── Doc_InventoryTransfer ───────────────────────────────────────────────────

create table if not exists doc_inventory_transfer_header (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  document_number text not null,
  document_date date not null,
  source_warehouse_id uuid not null references warehouses(id),
  destination_warehouse_id uuid not null references warehouses(id),
  status document_status not null default 'DRAFT',
  notes text,
  posted_at timestamptz,
  voided_at timestamptz,
  created_by uuid references users(id),
  updated_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, document_number),
  check (source_warehouse_id <> destination_warehouse_id)
);

create table if not exists doc_inventory_transfer_lines (
  id uuid primary key default uuid_generate_v4(),
  header_id uuid not null references doc_inventory_transfer_header(id) on delete cascade,
  tenant_id uuid not null references tenants(id) on delete cascade,
  position integer not null default 0,
  item_id uuid not null references inventory_items(id),
  quantity numeric(18,4) not null check (quantity > 0),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists doc_inventory_transfer_header_tenant_date_idx
  on doc_inventory_transfer_header (tenant_id, document_date desc);
create index if not exists doc_inventory_transfer_lines_header_idx
  on doc_inventory_transfer_lines (header_id);

-- ── Ledger_Inventory (append-only accumulation register) ────────────────────

create table if not exists ledger_inventory (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  period_at timestamptz not null default now(),
  document_kind inventory_document_kind not null,
  document_id uuid not null,
  warehouse_id uuid not null references warehouses(id),
  item_id uuid not null references inventory_items(id),
  movement_type inventory_movement_type not null,
  quantity numeric(18,4) not null check (quantity > 0),
  unit_cost_uzs numeric(18,2) not null default 0 check (unit_cost_uzs >= 0),
  cost_uzs numeric(18,2) not null default 0 check (cost_uzs >= 0),
  created_at timestamptz not null default now(),
  created_by uuid references users(id)
);

create index if not exists ledger_inventory_tenant_period_idx
  on ledger_inventory (tenant_id, period_at desc);
create index if not exists ledger_inventory_tenant_item_wh_idx
  on ledger_inventory (tenant_id, item_id, warehouse_id);
create index if not exists ledger_inventory_document_idx
  on ledger_inventory (document_kind, document_id);

-- Ledger is append-only. Updates and deletes are refused by trigger.
create or replace function prevent_ledger_inventory_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'ledger_inventory is append-only';
end;
$$;

drop trigger if exists ledger_inventory_prevent_update on ledger_inventory;
create trigger ledger_inventory_prevent_update
before update on ledger_inventory
for each row execute function prevent_ledger_inventory_mutation();

drop trigger if exists ledger_inventory_prevent_delete on ledger_inventory;
create trigger ledger_inventory_prevent_delete
before delete on ledger_inventory
for each row execute function prevent_ledger_inventory_mutation();

-- ── RLS ─────────────────────────────────────────────────────────────────────

alter table doc_goods_receipt_header enable row level security;
alter table doc_goods_receipt_lines  enable row level security;
alter table doc_goods_issue_header   enable row level security;
alter table doc_goods_issue_lines    enable row level security;
alter table doc_inventory_transfer_header enable row level security;
alter table doc_inventory_transfer_lines  enable row level security;
alter table ledger_inventory         enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'doc_goods_receipt_header' and policyname = 'tenant_isolation') then
    create policy tenant_isolation on doc_goods_receipt_header
      using (tenant_id = current_setting('app.tenant_id', true)::uuid);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'doc_goods_receipt_lines' and policyname = 'tenant_isolation') then
    create policy tenant_isolation on doc_goods_receipt_lines
      using (tenant_id = current_setting('app.tenant_id', true)::uuid);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'doc_goods_issue_header' and policyname = 'tenant_isolation') then
    create policy tenant_isolation on doc_goods_issue_header
      using (tenant_id = current_setting('app.tenant_id', true)::uuid);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'doc_goods_issue_lines' and policyname = 'tenant_isolation') then
    create policy tenant_isolation on doc_goods_issue_lines
      using (tenant_id = current_setting('app.tenant_id', true)::uuid);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'doc_inventory_transfer_header' and policyname = 'tenant_isolation') then
    create policy tenant_isolation on doc_inventory_transfer_header
      using (tenant_id = current_setting('app.tenant_id', true)::uuid);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'doc_inventory_transfer_lines' and policyname = 'tenant_isolation') then
    create policy tenant_isolation on doc_inventory_transfer_lines
      using (tenant_id = current_setting('app.tenant_id', true)::uuid);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'ledger_inventory' and policyname = 'tenant_isolation') then
    create policy tenant_isolation on ledger_inventory
      using (tenant_id = current_setting('app.tenant_id', true)::uuid);
  end if;
end$$;

-- ── Balance read model ──────────────────────────────────────────────────────
-- current on-hand per (tenant, warehouse, item) from the ledger. Views inherit
-- RLS from their base tables so tenant scoping is preserved automatically.

create or replace view v_inventory_on_hand as
select
  l.tenant_id,
  l.warehouse_id,
  l.item_id,
  sum(case when l.movement_type = 'IN' then l.quantity else -l.quantity end) as on_hand,
  -- weighted-average cost = SUM(IN.quantity * IN.unit_cost) / SUM(IN.quantity)
  case
    when sum(case when l.movement_type = 'IN' then l.quantity else 0 end) > 0
      then
        sum(case when l.movement_type = 'IN' then l.quantity * l.unit_cost_uzs else 0 end)
        / nullif(sum(case when l.movement_type = 'IN' then l.quantity else 0 end), 0)
    else 0
  end as wac_unit_cost_uzs
from ledger_inventory l
group by l.tenant_id, l.warehouse_id, l.item_id;

-- ── Backfill legacy stock_movements into ledger_inventory ───────────────────
-- Each legacy row becomes a synthetic goods_receipt or goods_issue row in the
-- ledger with document_kind = 'legacy_backfill' and document_id = the original
-- movement id. `transfer` and `adjustment` rows also fold in: 'transfer' has
-- no destination column in the legacy schema so we treat it as an OUT (the
-- paired IN will not exist — operators can clean this up via a new Transfer
-- document if needed); 'adjustment' is posted as IN or OUT based on the sign
-- convention used by the legacy app (quantity is always stored positive, so
-- treat positive as IN).
--
-- We join to inventory_items to recover warehouse_id since stock_movements
-- lacks it; one legacy row covers exactly one item, so the item's warehouse
-- is the correct destination.

insert into ledger_inventory (
  id,
  tenant_id,
  period_at,
  document_kind,
  document_id,
  warehouse_id,
  item_id,
  movement_type,
  quantity,
  unit_cost_uzs,
  cost_uzs,
  created_at,
  created_by
)
select
  sm.id,
  sm.tenant_id,
  sm.created_at,
  'legacy_backfill'::inventory_document_kind,
  sm.id,
  i.warehouse_id,
  sm.item_id,
  case sm.movement_type
    when 'inbound'    then 'IN'::inventory_movement_type
    when 'outbound'   then 'OUT'::inventory_movement_type
    when 'transfer'   then 'OUT'::inventory_movement_type
    when 'adjustment' then 'IN'::inventory_movement_type
  end as movement_type,
  sm.quantity,
  coalesce(i.unit_cost_uzs, 0),
  sm.quantity * coalesce(i.unit_cost_uzs, 0),
  sm.created_at,
  sm.created_by
from stock_movements sm
join inventory_items i on i.id = sm.item_id and i.tenant_id = sm.tenant_id
where sm.deleted_at is null
on conflict (id) do nothing;
