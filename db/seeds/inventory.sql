-- Inventory seed derived from legacy/src/data.jsx
-- Standalone: seeds the tenant, users, and warehouses it depends on.

insert into tenants (id, slug, name)
values
  ('00000000-0000-0000-0000-000000000101', 'kamolot-savdo', 'Kamolot Savdo LLC')
on conflict (id) do update
set slug = excluded.slug,
    name = excluded.name;

insert into users (id, full_name, email, phone)
values
  ('00000000-0000-0000-0000-000000000201', 'Jasur Azimov', 'jasur@kamolot.uz', '+998901111111'),
  ('00000000-0000-0000-0000-000000000202', 'Bekzod Yusupov', 'bekzod@kamolot.uz', '+998903333333'),
  ('00000000-0000-0000-0000-000000000207', 'Malika Karimova', 'malika@kamolot.uz', '+998907777777'),
  ('00000000-0000-0000-0000-000000000208', 'Dilnoza Rashidova', 'dilnoza@kamolot.uz', '+998906666666'),
  ('00000000-0000-0000-0000-000000000209', 'Sardor Toshev', 'sardor@kamolot.uz', '+998908888888')
on conflict (id) do update
set full_name = excluded.full_name,
    email = excluded.email,
    phone = excluded.phone;

insert into warehouses (
  id,
  tenant_id,
  code,
  name,
  location,
  created_by,
  updated_by
)
values
  (
    '00000000-0000-0000-0000-000000002101',
    '00000000-0000-0000-0000-000000000101',
    'MAIN',
    'Main DC',
    'Tashkent',
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000201'
  ),
  (
    '00000000-0000-0000-0000-000000002102',
    '00000000-0000-0000-0000-000000000101',
    'BR1',
    'Branch Storage',
    'Chilonzor',
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000201'
)
on conflict (tenant_id, code) do update
set name = excluded.name,
    location = excluded.location,
    created_by = excluded.created_by,
    updated_by = excluded.updated_by,
    updated_at = now();
with inventory_seed (id, tenant_id, warehouse_code, sku, name, category, reorder_point, unit_cost_uzs, created_by, updated_by) as (
  values
    ('00000000-0000-0000-0000-000000002201', '00000000-0000-0000-0000-000000000101', 'MAIN', 'KS-0102', 'Cooking oil, sunflower 5L', 'Grocery', 300, 62000, '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201'),
    ('00000000-0000-0000-0000-000000002202', '00000000-0000-0000-0000-000000000101', 'MAIN', 'KS-0104', 'Sugar, refined 50kg bag', 'Grocery', 120, 420000, '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201'),
    ('00000000-0000-0000-0000-000000002204', '00000000-0000-0000-0000-000000000101', 'MAIN', 'KS-0210', 'Rice, Devzira 25kg', 'Grocery', 200, 310000, '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201'),
    ('00000000-0000-0000-0000-000000002205', '00000000-0000-0000-0000-000000000101', 'MAIN', 'KS-0308', 'Black tea, Akbar 250g', 'Beverage', 800, 24000, '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201'),
    ('00000000-0000-0000-0000-000000002203', '00000000-0000-0000-0000-000000000101', 'BR1', 'KS-0401', 'Laundry detergent 6kg', 'Household', 40, 185000, '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201'),
    ('00000000-0000-0000-0000-000000002206', '00000000-0000-0000-0000-000000000101', 'MAIN', 'KS-0512', 'Mineral water 1.5L x12', 'Beverage', 100, 48000, '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201'),
    ('00000000-0000-0000-0000-000000002207', '00000000-0000-0000-0000-000000000101', 'MAIN', 'KS-0617', 'Canned tomato 800g', 'Pantry', 400, 14500, '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201'),
    ('00000000-0000-0000-0000-000000002208', '00000000-0000-0000-0000-000000000101', 'MAIN', 'KS-0621', 'Pasta, Makfa 450g', 'Pantry', 500, 9800, '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201'),
    ('00000000-0000-0000-0000-000000002209', '00000000-0000-0000-0000-000000000101', 'MAIN', 'KS-0734', 'Sunflower seeds 1kg', 'Snacks', 300, 22000, '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201'),
    ('00000000-0000-0000-0000-000000002210', '00000000-0000-0000-0000-000000000101', 'MAIN', 'KS-0801', 'Baby formula, stage 2', 'Baby', 60, 280000, '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201'),
    ('00000000-0000-0000-0000-000000002211', '00000000-0000-0000-0000-000000000101', 'BR1', 'KS-0912', 'Cotton kitchen towel', 'Household', 200, 38000, '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201'),
    ('00000000-0000-0000-0000-000000002212', '00000000-0000-0000-0000-000000000101', 'MAIN', 'KS-1003', 'Hand soap 500ml', 'Household', 400, 19500, '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201')
)
insert into inventory_items (
  id,
  tenant_id,
  warehouse_id,
  sku,
  name,
  category,
  reorder_point,
  unit_cost_uzs,
  created_by,
  updated_by
)
select
  seed.id::uuid,
  seed.tenant_id::uuid,
  w.id,
  seed.sku,
  seed.name,
  seed.category,
  seed.reorder_point,
  seed.unit_cost_uzs,
  seed.created_by::uuid,
  seed.updated_by::uuid
from inventory_seed seed
join warehouses w
  on w.tenant_id = seed.tenant_id::uuid
 and w.code = seed.warehouse_code
on conflict (tenant_id, sku) do update
set warehouse_id = excluded.warehouse_id,
    name = excluded.name,
    category = excluded.category,
    reorder_point = excluded.reorder_point,
    unit_cost_uzs = excluded.unit_cost_uzs,
    created_by = excluded.created_by,
    updated_by = excluded.updated_by,
    updated_at = now();

with movement_seed (id, tenant_id, sku, movement_type, quantity, reference, created_by, updated_by) as (
  values
    ('00000000-0000-0000-0000-000000002301', '00000000-0000-0000-0000-000000000101', 'KS-0102', 'inbound', 1240, 'GRN-2048', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201'),
    ('00000000-0000-0000-0000-000000002302', '00000000-0000-0000-0000-000000000101', 'KS-0104', 'inbound', 86, 'SO-1482', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201'),
    ('00000000-0000-0000-0000-000000002304', '00000000-0000-0000-0000-000000000101', 'KS-0210', 'inbound', 540, 'GRN-2061', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201'),
    ('00000000-0000-0000-0000-000000002305', '00000000-0000-0000-0000-000000000101', 'KS-0308', 'inbound', 3020, 'GRN-2064', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201'),
    ('00000000-0000-0000-0000-000000002303', '00000000-0000-0000-0000-000000000101', 'KS-0401', 'inbound', 12, 'TR-0091', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201'),
    ('00000000-0000-0000-0000-000000002307', '00000000-0000-0000-0000-000000000101', 'KS-0617', 'inbound', 2160, 'GRN-2070', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201'),
    ('00000000-0000-0000-0000-000000002308', '00000000-0000-0000-0000-000000000101', 'KS-0621', 'inbound', 1880, 'GRN-2071', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201'),
    ('00000000-0000-0000-0000-000000002309', '00000000-0000-0000-0000-000000000101', 'KS-0734', 'inbound', 920, 'GRN-2072', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201'),
    ('00000000-0000-0000-0000-000000002310', '00000000-0000-0000-0000-000000000101', 'KS-0801', 'inbound', 48, 'GRN-2073', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201'),
    ('00000000-0000-0000-0000-000000002311', '00000000-0000-0000-0000-000000000101', 'KS-0912', 'inbound', 640, 'GRN-2074', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201'),
    ('00000000-0000-0000-0000-000000002312', '00000000-0000-0000-0000-000000000101', 'KS-1003', 'inbound', 1420, 'GRN-2075', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201')
)
insert into stock_movements (
  id,
  tenant_id,
  item_id,
  movement_type,
  quantity,
  reference,
  created_by,
  updated_by
)
select
  seed.id::uuid,
  seed.tenant_id::uuid,
  i.id,
  seed.movement_type,
  seed.quantity,
  seed.reference,
  seed.created_by::uuid,
  seed.updated_by::uuid
from movement_seed seed
join inventory_items i
  on i.tenant_id = seed.tenant_id::uuid
 and i.sku = seed.sku
on conflict (id) do update
set tenant_id = excluded.tenant_id,
    item_id = excluded.item_id,
    movement_type = excluded.movement_type,
    quantity = excluded.quantity,
    reference = excluded.reference,
    created_by = excluded.created_by,
    updated_by = excluded.updated_by,
    updated_at = now();
