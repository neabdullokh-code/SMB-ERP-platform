-- =============================================================================
-- Migration 017 — Production Documents + BOM line normalization
-- =============================================================================
-- Adds Document/Ledger pattern for Production:
--
--   * production_bom_lines         (normalized BOM lines replacing jsonb)
--   * doc_production_order_header  (DRAFT | POSTED | VOID)
--
-- The existing `production_orders` table is preserved for backward compat and
-- gets a new `document_id` nullable FK to the new header so a single view can
-- serve both legacy and new orders during the transition. `production_boms`
-- keeps its `materials` jsonb column as a fallback but the normalized
-- `production_bom_lines` rows become the source of truth once populated.
-- =============================================================================

-- ── Normalized BOM lines ────────────────────────────────────────────────────

create table if not exists production_bom_lines (
  id uuid primary key default uuid_generate_v4(),
  bom_id uuid not null references production_boms(id) on delete cascade,
  tenant_id uuid not null references tenants(id) on delete cascade,
  position integer not null default 0,
  item_id uuid not null references inventory_items(id),
  quantity_per_unit numeric(18,4) not null check (quantity_per_unit > 0),
  unit text not null,
  created_at timestamptz not null default now()
);

create index if not exists production_bom_lines_bom_idx on production_bom_lines (bom_id);
create index if not exists production_bom_lines_tenant_item_idx
  on production_bom_lines (tenant_id, item_id);

alter table production_bom_lines enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'production_bom_lines' and policyname = 'tenant_isolation') then
    create policy tenant_isolation on production_bom_lines
      using (tenant_id = current_setting('app.tenant_id', true)::uuid);
  end if;
end$$;

-- ── Production order document ───────────────────────────────────────────────

create table if not exists doc_production_order_header (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  document_number text not null,
  document_date date not null,
  bom_id uuid not null references production_boms(id),
  warehouse_id uuid not null references warehouses(id),
  planned_units numeric(18,4) not null check (planned_units > 0),
  produced_units numeric(18,4) not null default 0 check (produced_units >= 0),
  output_item_id uuid not null references inventory_items(id),
  status document_status not null default 'DRAFT',
  notes text,
  scheduled_date date,
  posted_at timestamptz,
  voided_at timestamptz,
  created_by uuid references users(id),
  updated_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, document_number)
);

create index if not exists doc_production_order_tenant_date_idx
  on doc_production_order_header (tenant_id, document_date desc);
create index if not exists doc_production_order_tenant_status_idx
  on doc_production_order_header (tenant_id, status);

alter table doc_production_order_header enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'doc_production_order_header' and policyname = 'tenant_isolation') then
    create policy tenant_isolation on doc_production_order_header
      using (tenant_id = current_setting('app.tenant_id', true)::uuid);
  end if;
end$$;

-- Legacy production_orders gets a link to the new document so UIs can join
-- during the transition without re-seeding.
alter table production_orders
  add column if not exists document_id uuid references doc_production_order_header(id);
