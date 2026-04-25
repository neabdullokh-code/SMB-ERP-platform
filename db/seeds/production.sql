-- Production seed derived from legacy/src/smb-rest.jsx

insert into production_boms (
  id,
  tenant_id,
  code,
  output_sku,
  version,
  materials,
  created_by,
  updated_by
)
values
  ('00000000-0000-0000-0000-000000001101', '00000000-0000-0000-0000-000000000101', 'BOM-01', 'KSM-5L-REP', 'v1', '[{"sku":"KS-0102","quantity":1,"unit":"pcs"},{"sku":"RM-BOTTLE","quantity":1,"unit":"pcs"}]'::jsonb, '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201'),
  ('00000000-0000-0000-0000-000000001102', '00000000-0000-0000-0000-000000000101', 'BOM-02', 'PANTRY-BUNDLE', 'v1', '[{"sku":"KS-0617","quantity":6,"unit":"pcs"},{"sku":"KS-0621","quantity":10,"unit":"pcs"}]'::jsonb, '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201'),
  ('00000000-0000-0000-0000-000000001103', '00000000-0000-0000-0000-000000000101', 'BOM-03', 'KS-0210-PACK', 'v1', '[{"sku":"KS-0210","quantity":1,"unit":"pcs"}]'::jsonb, '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201'),
  ('00000000-0000-0000-0000-000000001104', '00000000-0000-0000-0000-000000000101', 'BOM-04', 'SNACK-BOX', 'v1', '[{"sku":"KS-0734","quantity":12,"unit":"pcs"},{"sku":"KS-0308","quantity":4,"unit":"pcs"}]'::jsonb, '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201')
on conflict (id) do update
set tenant_id = excluded.tenant_id,
    code = excluded.code,
    output_sku = excluded.output_sku,
    version = excluded.version,
    materials = excluded.materials,
    created_by = excluded.created_by,
    updated_by = excluded.updated_by,
    updated_at = now();

insert into production_orders (
  id,
  tenant_id,
  bom_id,
  status,
  planned_units,
  produced_units,
  scheduled_date,
  created_by,
  updated_by
)
values
  ('00000000-0000-0000-0000-000000001201', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000001101', 'planned', 50, 0, '2026-04-24', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201'),
  ('00000000-0000-0000-0000-000000001202', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000001102', 'in_progress', 60, 58, '2026-04-24', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201')
on conflict (id) do update
set bom_id = excluded.bom_id,
    status = excluded.status,
    planned_units = excluded.planned_units,
    produced_units = excluded.produced_units,
    scheduled_date = excluded.scheduled_date,
    created_by = excluded.created_by,
    updated_by = excluded.updated_by,
    updated_at = now();

insert into scrap_records (
  id,
  tenant_id,
  production_order_id,
  reason,
  quantity,
  created_by,
  updated_by
)
values
  ('00000000-0000-0000-0000-000000001301', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000001202', 'Spillage during packaging', 2, '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201')
on conflict (id) do update
set production_order_id = excluded.production_order_id,
    reason = excluded.reason,
    quantity = excluded.quantity,
    created_by = excluded.created_by,
    updated_by = excluded.updated_by,
    updated_at = now();
