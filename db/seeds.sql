-- Flattened seed file for Supabase SQL editor


-- File: db\seeds\demo.sql

insert into tenants (id, slug, name)
values
  ('00000000-0000-0000-0000-000000000101', 'kamolot-savdo', 'Kamolot Savdo LLC'),
  ('00000000-0000-0000-0000-000000000102', 'silk-road-textiles', 'Silk Road Textiles')
on conflict (id) do update
set slug = excluded.slug,
    name = excluded.name;

insert into tenant_profiles (tenant_id, tin, business_type, region, address, plan)
values
  (
    '00000000-0000-0000-0000-000000000101',
    '301 452 776',
    'Wholesale',
    'Tashkent',
    'Mirobod district, Tashkent 100170',
    'business_os_free'
  ),
  (
    '00000000-0000-0000-0000-000000000102',
    '305 995 441',
    'Textiles',
    'Namangan',
    'Davlatobod district, Namangan 160100',
    'business_os_free'
  )
on conflict (tenant_id) do update
set tin = excluded.tin,
    business_type = excluded.business_type,
    region = excluded.region,
    address = excluded.address,
    plan = excluded.plan,
    updated_at = now();

insert into users (id, full_name, email, phone)
values
  ('00000000-0000-0000-0000-000000000201', 'Jasur Azimov', 'jasur@kamolot.uz', '+998901111111'),
  ('00000000-0000-0000-0000-000000000202', 'Bekzod Yusupov', 'bekzod@kamolot.uz', '+998903333333'),
  ('00000000-0000-0000-0000-000000000207', 'Malika Karimova', 'malika@kamolot.uz', '+998907777777'),
  ('00000000-0000-0000-0000-000000000208', 'Dilnoza Rashidova', 'dilnoza@kamolot.uz', '+998906666666'),
  ('00000000-0000-0000-0000-000000000209', 'Sardor Toshev', 'sardor@kamolot.uz', '+998908888888'),
  ('00000000-0000-0000-0000-000000000203', 'Malika Karimova', 'malika.karimova@sqb.uz', '+998902222222'),
  ('00000000-0000-0000-0000-000000000204', 'Aziza Platform Admin', 'admin.platform@sqb.uz', '+998904444444'),
  ('00000000-0000-0000-0000-000000000205', 'Emergency Admin One', 'breakglass.one@sqb.uz', '+998905555551'),
  ('00000000-0000-0000-0000-000000000206', 'Emergency Admin Two', 'breakglass.two@sqb.uz', '+998905555552')
on conflict (id) do update
set full_name = excluded.full_name,
    email = excluded.email,
    phone = excluded.phone;

insert into memberships (tenant_id, user_id, role, permission_groups)
values
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000201', 'company_admin', '["tenant_governance","finance_operations","inventory_operations","production_operations","service_operations","audit_compliance"]'::jsonb),
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000207', 'company_admin', '["tenant_governance","finance_operations","inventory_operations","production_operations","service_operations","audit_compliance"]'::jsonb),
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000202', 'warehouse_clerk', '["inventory_operations"]'::jsonb),
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000208', 'executive', '["executive_oversight","audit_compliance"]'::jsonb),
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000209', 'production_operator', '["production_operations"]'::jsonb)
on conflict do nothing;

insert into bank_staff_memberships (user_id, role)
values
  ('00000000-0000-0000-0000-000000000203', 'bank_admin'),
  ('00000000-0000-0000-0000-000000000204', 'super_admin'),
  ('00000000-0000-0000-0000-000000000205', 'super_admin'),
  ('00000000-0000-0000-0000-000000000206', 'super_admin')
on conflict (user_id) do update
set role = excluded.role,
    updated_at = now();

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
on conflict (id) do update
set tenant_id = excluded.tenant_id,
    code = excluded.code,
    name = excluded.name,
    location = excluded.location,
    created_by = excluded.created_by,
    updated_by = excluded.updated_by,
    updated_at = now();

insert into stocktakes (
  id,
  tenant_id,
  warehouse_id,
  started_at,
  completed_at,
  variance_count,
  created_by,
  updated_by
)
values
  (
    '00000000-0000-0000-0000-000000002401',
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000002101',
    '2026-04-18T06:00:00Z',
    '2026-04-18T08:30:00Z',
    2,
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000201'
  )
on conflict (id) do update
set tenant_id = excluded.tenant_id,
    warehouse_id = excluded.warehouse_id,
    started_at = excluded.started_at,
    completed_at = excluded.completed_at,
    variance_count = excluded.variance_count,
    created_by = excluded.created_by,
    updated_by = excluded.updated_by,
    updated_at = now();

insert into credentials (
  user_id,
  password_hash,
  is_privileged,
  requires_dedicated_account,
  is_break_glass,
  totp_required
)
values
  ('00000000-0000-0000-0000-000000000201', crypt('Sqb2026!', gen_salt('bf')), false, false, false, false),
  ('00000000-0000-0000-0000-000000000202', crypt('Sqb2026!', gen_salt('bf')), false, false, false, false),
  ('00000000-0000-0000-0000-000000000203', crypt('SqbBank2026!', gen_salt('bf')), true, true, false, false),
  ('00000000-0000-0000-0000-000000000204', crypt('SqbSuper2026!', gen_salt('bf')), true, true, false, false),
  ('00000000-0000-0000-0000-000000000205', crypt('BreakGlass2026!', gen_salt('bf')), true, true, true, true),
  ('00000000-0000-0000-0000-000000000206', crypt('BreakGlass2026!', gen_salt('bf')), true, true, true, true)
on conflict on constraint credentials_user_id_unique do update
set password_hash = excluded.password_hash,
    is_privileged = excluded.is_privileged,
    requires_dedicated_account = excluded.requires_dedicated_account,
    is_break_glass = excluded.is_break_glass,
    totp_required = excluded.totp_required,
    updated_at = now();

insert into otp_methods (
  id,
  user_id,
  method_type,
  provider_name,
  destination,
  secret,
  is_primary,
  is_enabled
)
values
  ('00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000201', 'sms', 'platform_sms', '+998901111111', null, true, true),
  ('00000000-0000-0000-0000-000000000402', '00000000-0000-0000-0000-000000000202', 'sms', 'platform_sms', '+998903333333', null, true, true),
  ('00000000-0000-0000-0000-000000000403', '00000000-0000-0000-0000-000000000203', 'sms', 'platform_sms', '+998902222222', null, true, true),
  ('00000000-0000-0000-0000-000000000404', '00000000-0000-0000-0000-000000000204', 'totp_app', 'google_authenticator', 'Google Authenticator', 'KRSXG5DSNFXGOIDB', true, true),
  ('00000000-0000-0000-0000-000000000405', '00000000-0000-0000-0000-000000000205', 'totp_app', 'google_authenticator', 'Google Authenticator', 'MFRGGZDFMZTWQ2LK', true, true),
  ('00000000-0000-0000-0000-000000000406', '00000000-0000-0000-0000-000000000206', 'totp_app', 'google_authenticator', 'Google Authenticator', 'ONSWG4TFOQ======', true, true)
on conflict (id) do update
set method_type = excluded.method_type,
    provider_name = excluded.provider_name,
    destination = excluded.destination,
    secret = excluded.secret,
    is_primary = excluded.is_primary,
    is_enabled = excluded.is_enabled,
    updated_at = now();

insert into workspace_invitations (
  id,
  tenant_id,
  full_name,
  email,
  role,
  permission_groups,
  accept_token,
  status,
  invited_at
)
values
  (
    '00000000-0000-0000-0000-000000000501',
    '00000000-0000-0000-0000-000000000101',
    'Farhod Juraev',
    'farhod@kamolot.uz',
    'executive',
    '["executive_oversight","audit_compliance"]'::jsonb,
    'demo-team-invite-token',
    'pending',
    now() - interval '20 minutes'
  )
on conflict (id) do update
set full_name = excluded.full_name,
    email = excluded.email,
    role = excluded.role,
    permission_groups = excluded.permission_groups,
    accept_token = excluded.accept_token,
    status = excluded.status,
    invited_at = excluded.invited_at;

insert into terms_documents (id, document_type, version, content_url)
values
  ('00000000-0000-0000-0000-000000000301', 'terms_of_service', '2026-04', 'https://example.com/tos/2026-04'),
  ('00000000-0000-0000-0000-000000000302', 'privacy_notice', '2026-04', 'https://example.com/privacy/2026-04')
on conflict (id) do update
set document_type = excluded.document_type,
    version = excluded.version,
    content_url = excluded.content_url;

insert into terms_acceptances (tenant_id, user_id, document_id, accepted_version, ip_address, user_agent)
values
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000301', '2026-04', '127.0.0.1', 'seed-script'),
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000302', '2026-04', '127.0.0.1', 'seed-script'),
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000301', '2026-04', '127.0.0.1', 'seed-script'),
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000302', '2026-04', '127.0.0.1', 'seed-script'),
  (null, '00000000-0000-0000-0000-000000000203', '00000000-0000-0000-0000-000000000301', '2026-04', '127.0.0.1', 'seed-script'),
  (null, '00000000-0000-0000-0000-000000000203', '00000000-0000-0000-0000-000000000302', '2026-04', '127.0.0.1', 'seed-script'),
  (null, '00000000-0000-0000-0000-000000000204', '00000000-0000-0000-0000-000000000301', '2026-04', '127.0.0.1', 'seed-script'),
  (null, '00000000-0000-0000-0000-000000000204', '00000000-0000-0000-0000-000000000302', '2026-04', '127.0.0.1', 'seed-script')
on conflict do nothing;



-- File: db\seeds\inventory.sql

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


-- File: db\seeds\production.sql

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


-- File: db\seeds\finance.sql

-- Finance seed derived from legacy/src/smb-rest.jsx

insert into finance_counterparties (
  id,
  tenant_id,
  name,
  type,
  tax_id,
  phone,
  email
)
values
  ('00000000-0000-0000-0000-000000003001', '00000000-0000-0000-0000-000000000101', 'Oriental Trade LLC', 'customer', '301 441 118', '+998901234567', 'billing@orientaltrade.uz'),
  ('00000000-0000-0000-0000-000000003002', '00000000-0000-0000-0000-000000000101', 'Zamon Foods', 'customer', '304 128 991', '+998902345678', 'accounts@zamonfoods.uz'),
  ('00000000-0000-0000-0000-000000003003', '00000000-0000-0000-0000-000000000101', 'Retail Centre', 'customer', '301 889 220', '+998903456789', 'finance@retailcentre.uz'),
  ('00000000-0000-0000-0000-000000003004', '00000000-0000-0000-0000-000000000101', 'Chorsu Market Co.', 'customer', '301 220 118', '+998904567890', 'accounts@chorsu.uz'),
  ('00000000-0000-0000-0000-000000003005', '00000000-0000-0000-0000-000000000101', 'Nur Auto Parts', 'customer', '306 441 722', '+998905678901', 'billing@nurautoparts.uz'),
  ('00000000-0000-0000-0000-000000003006', '00000000-0000-0000-0000-000000000101', 'Ferghana Agro', 'supplier', '308 551 633', '+998906789012', 'invoices@ferghanaagro.uz'),
  ('00000000-0000-0000-0000-000000003007', '00000000-0000-0000-0000-000000000101', 'Samarkand Oil Co.', 'supplier', '302 101 554', '+998907890123', 'ap@samarkandoil.uz'),
  ('00000000-0000-0000-0000-000000003008', '00000000-0000-0000-0000-000000000101', 'Makfa Distribution', 'supplier', '305 662 118', '+998908901234', 'billing@makfa.uz'),
  ('00000000-0000-0000-0000-000000003009', '00000000-0000-0000-0000-000000000101', 'Akbar Tea Imports', 'supplier', '303 771 440', '+998909012345', 'ap@akbartea.uz')
on conflict (tenant_id, name) do update
set type = excluded.type,
    tax_id = excluded.tax_id,
    phone = excluded.phone,
    email = excluded.email,
    updated_at = now();

insert into finance_invoices (
  id,
  tenant_id,
  counterparty_id,
  number,
  status,
  currency,
  issue_date,
  due_date,
  subtotal,
  tax_total,
  total,
  notes,
  created_by,
  updated_by
)
values
  ('00000000-0000-0000-0000-000000003101', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000003001', 'INV-1482', 'issued', 'UZS', '2026-03-12', '2026-03-26', 14500000, 0, 14500000, 'Wholesale delivery', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201'),
  ('00000000-0000-0000-0000-000000003102', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000003002', 'INV-1481', 'issued', 'UZS', '2026-03-11', '2026-03-25', 28200000, 0, 28200000, 'Pantry supply order', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201'),
  ('00000000-0000-0000-0000-000000003103', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000003003', 'INV-1480', 'issued', 'UZS', '2026-03-09', '2026-03-23', 8400000, 0, 8400000, 'Retail centre shipment', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201'),
  ('00000000-0000-0000-0000-000000003104', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000003004', 'INV-1479', 'issued', 'UZS', '2026-03-08', '2026-03-22', 18100000, 0, 18100000, 'Market supply shipment', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201'),
  ('00000000-0000-0000-0000-000000003105', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000003005', 'INV-1478', 'issued', 'UZS', '2026-03-06', '2026-03-20', 6240000, 0, 6240000, 'Auto parts order', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201'),
  ('00000000-0000-0000-0000-000000003106', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000003006', 'INV-1477', 'issued', 'UZS', '2026-03-04', '2026-03-18', 32500000, 0, 32500000, 'Agro seasonal shipment', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201')
on conflict (id) do update
set tenant_id = excluded.tenant_id,
    counterparty_id = excluded.counterparty_id,
    number = excluded.number,
    status = excluded.status,
    currency = excluded.currency,
    issue_date = excluded.issue_date,
    due_date = excluded.due_date,
    subtotal = excluded.subtotal,
    tax_total = excluded.tax_total,
    total = excluded.total,
    notes = excluded.notes,
    created_by = excluded.created_by,
    updated_by = excluded.updated_by,
    updated_at = now();

insert into finance_bills (
  id,
  tenant_id,
  counterparty_id,
  number,
  status,
  currency,
  issue_date,
  due_date,
  subtotal,
  tax_total,
  total,
  notes,
  created_by,
  updated_by
)
values
  ('00000000-0000-0000-0000-000000003201', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000003007', 'BILL-0451', 'posted', 'UZS', '2026-03-18', '2026-04-01', 45700000, 0, 45700000, 'Oil delivery batch', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201'),
  ('00000000-0000-0000-0000-000000003202', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000003008', 'BILL-0449', 'posted', 'UZS', '2026-03-12', '2026-03-26', 18200000, 0, 18200000, 'Makfa distribution restock', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201'),
  ('00000000-0000-0000-0000-000000003203', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000003009', 'BILL-0448', 'posted', 'UZS', '2026-03-08', '2026-03-22', 12400000, 0, 12400000, 'Tea imports', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201'),
  ('00000000-0000-0000-0000-000000003204', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000003007', 'BILL-0445', 'posted', 'UZS', '2026-03-03', '2026-03-17', 42000000, 0, 42000000, 'Oil delivery batch', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201')
on conflict (id) do update
set tenant_id = excluded.tenant_id,
    counterparty_id = excluded.counterparty_id,
    number = excluded.number,
    status = excluded.status,
    currency = excluded.currency,
    issue_date = excluded.issue_date,
    due_date = excluded.due_date,
    subtotal = excluded.subtotal,
    tax_total = excluded.tax_total,
    total = excluded.total,
    notes = excluded.notes,
    created_by = excluded.created_by,
    updated_by = excluded.updated_by,
    updated_at = now();

-- Seed monthly cash movement journals so /finance/cash-flow has DB-backed values.
with month_plan(month_offset, inflow_uzs, outflow_uzs) as (
  values
    (5, 98000000::numeric, 74200000::numeric),
    (4, 104000000::numeric, 76900000::numeric),
    (3, 112500000::numeric, 80600000::numeric),
    (2, 118000000::numeric, 84400000::numeric),
    (1, 126500000::numeric, 91200000::numeric),
    (0, 132000000::numeric, 95500000::numeric)
),
batch_rows as (
  select
    uuid_generate_v5('00000000-0000-0000-0000-000000000999'::uuid, format('seed-cash-in-%s', month_offset)) as id,
    '00000000-0000-0000-0000-000000000101'::uuid as tenant_id,
    'manual_adjustment'::text as source_type,
    null::uuid as source_id,
    format('Seed cash inflow month offset %s', month_offset) as memo,
    (date_trunc('month', now()) - (month_offset || ' months')::interval + interval '10 days') as posted_at,
    '00000000-0000-0000-0000-000000000201'::uuid as created_by
  from month_plan
  union all
  select
    uuid_generate_v5('00000000-0000-0000-0000-000000000999'::uuid, format('seed-cash-out-%s', month_offset)) as id,
    '00000000-0000-0000-0000-000000000101'::uuid as tenant_id,
    'manual_adjustment'::text as source_type,
    null::uuid as source_id,
    format('Seed cash outflow month offset %s', month_offset) as memo,
    (date_trunc('month', now()) - (month_offset || ' months')::interval + interval '18 days') as posted_at,
    '00000000-0000-0000-0000-000000000201'::uuid as created_by
  from month_plan
),
line_rows as (
  -- Inflow: DR cash(1001), CR sales revenue(4000)
  select
    uuid_generate_v5('00000000-0000-0000-0000-000000000999'::uuid, format('seed-cash-in-debit-%s', month_offset)) as id,
    uuid_generate_v5('00000000-0000-0000-0000-000000000999'::uuid, format('seed-cash-in-%s', month_offset)) as batch_id,
    '1001'::text as account_code,
    'debit'::text as entry_side,
    inflow_uzs as amount,
    format('Seed inflow month offset %s', month_offset) as memo
  from month_plan
  union all
  select
    uuid_generate_v5('00000000-0000-0000-0000-000000000999'::uuid, format('seed-cash-in-credit-%s', month_offset)) as id,
    uuid_generate_v5('00000000-0000-0000-0000-000000000999'::uuid, format('seed-cash-in-%s', month_offset)) as batch_id,
    '4000'::text as account_code,
    'credit'::text as entry_side,
    inflow_uzs as amount,
    format('Seed inflow month offset %s', month_offset) as memo
  from month_plan
  union all
  -- Outflow: DR operating expense(5100), CR cash(1001)
  select
    uuid_generate_v5('00000000-0000-0000-0000-000000000999'::uuid, format('seed-cash-out-debit-%s', month_offset)) as id,
    uuid_generate_v5('00000000-0000-0000-0000-000000000999'::uuid, format('seed-cash-out-%s', month_offset)) as batch_id,
    '5100'::text as account_code,
    'debit'::text as entry_side,
    outflow_uzs as amount,
    format('Seed outflow month offset %s', month_offset) as memo
  from month_plan
  union all
  select
    uuid_generate_v5('00000000-0000-0000-0000-000000000999'::uuid, format('seed-cash-out-credit-%s', month_offset)) as id,
    uuid_generate_v5('00000000-0000-0000-0000-000000000999'::uuid, format('seed-cash-out-%s', month_offset)) as batch_id,
    '1001'::text as account_code,
    'credit'::text as entry_side,
    outflow_uzs as amount,
    format('Seed outflow month offset %s', month_offset) as memo
  from month_plan
),
inserted_batches as (
  insert into finance_journal_batches (
    id,
    tenant_id,
    source_type,
    source_id,
    memo,
    posted_at,
    created_by
  )
  select
    b.id,
    b.tenant_id,
    b.source_type,
    b.source_id,
    b.memo,
    b.posted_at,
    b.created_by
  from batch_rows b
  on conflict (id) do update
  set memo = excluded.memo,
      posted_at = excluded.posted_at,
      created_by = excluded.created_by
  returning id
)
insert into finance_journal_lines (
  id,
  tenant_id,
  batch_id,
  account_id,
  counterparty_id,
  entry_side,
  amount,
  memo
)
select
  l.id,
  '00000000-0000-0000-0000-000000000101'::uuid as tenant_id,
  l.batch_id,
  a.id as account_id,
  null::uuid as counterparty_id,
  l.entry_side,
  l.amount,
  l.memo
from line_rows l
join finance_accounts a
  on a.tenant_id = '00000000-0000-0000-0000-000000000101'::uuid
 and a.code = l.account_code
on conflict (id) do update
set batch_id = excluded.batch_id,
    account_id = excluded.account_id,
    entry_side = excluded.entry_side,
    amount = excluded.amount,
    memo = excluded.memo;


-- File: db\seeds\service.sql

-- Service seed derived from legacy/src/smb-rest.jsx

insert into service_orders (
  id,
  tenant_id,
  title,
  customer,
  status,
  requested_by,
  due_date,
  created_by,
  updated_by
)
values
  ('00000000-0000-0000-0000-000000004101', '00000000-0000-0000-0000-000000000101', 'Delivery to Oriental Trade', 'Oriental Trade', 'submitted', 'Malika Karimova', '2026-03-19', '00000000-0000-0000-0000-000000000207', '00000000-0000-0000-0000-000000000207'),
  ('00000000-0000-0000-0000-000000004102', '00000000-0000-0000-0000-000000000101', 'Cold chain delivery to Zamon Foods', 'Zamon Foods', 'approved', 'Jasur Azimov', '2026-03-20', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201'),
  ('00000000-0000-0000-0000-000000004103', '00000000-0000-0000-0000-000000000101', 'Internal transfer to Kamolot branch #2', 'Kamolot Savdo', 'in_progress', 'Bekzod Yusupov', '2026-03-18', '00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000202'),
  ('00000000-0000-0000-0000-000000004104', '00000000-0000-0000-0000-000000000101', 'Inventory audit for Nur Auto Parts', 'Nur Auto Parts', 'in_progress', 'Jasur Azimov', '2026-03-21', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201'),
  ('00000000-0000-0000-0000-000000004105', '00000000-0000-0000-0000-000000000101', 'Delivery to Chorsu Market', 'Chorsu Market', 'completed', 'Bekzod Yusupov', '2026-03-15', '00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000202'),
  ('00000000-0000-0000-0000-000000004106', '00000000-0000-0000-0000-000000000101', 'Pickup for Ferghana Agro', 'Ferghana Agro', 'completed', 'Malika Karimova', '2026-03-16', '00000000-0000-0000-0000-000000000207', '00000000-0000-0000-0000-000000000207')
on conflict (id) do update
set title = excluded.title,
    customer = excluded.customer,
    status = excluded.status,
    requested_by = excluded.requested_by,
    due_date = excluded.due_date,
    created_by = excluded.created_by,
    updated_by = excluded.updated_by,
    updated_at = now();

insert into approvals (
  id,
  tenant_id,
  entity_type,
  entity_id,
  approver_role,
  status,
  created_by,
  updated_by
)
values
  ('00000000-0000-0000-0000-000000004201', '00000000-0000-0000-0000-000000000101', 'service_order', '00000000-0000-0000-0000-000000004101', 'owner', 'pending', '00000000-0000-0000-0000-000000000207', '00000000-0000-0000-0000-000000000207'),
  ('00000000-0000-0000-0000-000000004202', '00000000-0000-0000-0000-000000000101', 'service_order', '00000000-0000-0000-0000-000000004102', 'owner', 'approved', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201'),
  ('00000000-0000-0000-0000-000000004203', '00000000-0000-0000-0000-000000000101', 'service_order', '00000000-0000-0000-0000-000000004103', 'manager', 'approved', '00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000202')
on conflict (id) do update
set entity_type = excluded.entity_type,
    entity_id = excluded.entity_id,
    approver_role = excluded.approver_role,
    status = excluded.status,
    created_by = excluded.created_by,
    updated_by = excluded.updated_by,
    updated_at = now();


-- File: db\seeds\credit.sql

-- Credit seed derived from legacy/src/data.jsx and legacy/src/bank-credit.jsx

insert into credit_applications (
  id,
  tenant_id,
  status,
  submitted_at,
  product,
  purpose,
  requested_amount,
  requested_term_months,
  approved_amount,
  approved_term_months,
  approved_rate_percent,
  priority,
  ai_recommendation,
  ai_rationale,
  score_snapshot,
  score_version,
  assigned_bank_user_id,
  last_reviewed_at
)
values
  ('00000000-0000-0000-0000-000000000601', '00000000-0000-0000-0000-000000000101', 'submitted', now() - interval '3 hours', 'Working capital line', 'Inventory financing', 320000000.00, 12, null, null, null, 'normal', 'approve', 'Stable receivables, positive trend, and acceptable payment discipline support approval at standard pricing.', 81, 'risk_v1', null, null),
  ('00000000-0000-0000-0000-000000000602', '00000000-0000-0000-0000-000000000102', 'in_review', now() - interval '7 hours', 'Equipment loan', 'Weaving line upgrade', 680000000.00, 24, null, null, null, 'high', 'review', 'Mixed cash flow and weaker collections need analyst review before pricing and tenor are finalized.', 67, 'risk_v1', '00000000-0000-0000-0000-000000000203', now() - interval '1 hour')
on conflict (id) do update
set status = excluded.status,
    submitted_at = excluded.submitted_at,
    product = excluded.product,
    purpose = excluded.purpose,
    requested_amount = excluded.requested_amount,
    requested_term_months = excluded.requested_term_months,
    approved_amount = excluded.approved_amount,
    approved_term_months = excluded.approved_term_months,
    approved_rate_percent = excluded.approved_rate_percent,
    priority = excluded.priority,
    ai_recommendation = excluded.ai_recommendation,
    ai_rationale = excluded.ai_rationale,
    score_snapshot = excluded.score_snapshot,
    score_version = excluded.score_version,
    assigned_bank_user_id = excluded.assigned_bank_user_id,
    last_reviewed_at = excluded.last_reviewed_at,
    updated_at = now();

insert into credit_application_documents (id, application_id, name, status, source_type)
values
  ('00000000-0000-0000-0000-000000000701', '00000000-0000-0000-0000-000000000601', 'Tax returns 2024', 'available', 'auto_pulled'),
  ('00000000-0000-0000-0000-000000000702', '00000000-0000-0000-0000-000000000601', 'Inventory valuation', 'available', 'auto_pulled'),
  ('00000000-0000-0000-0000-000000000703', '00000000-0000-0000-0000-000000000602', 'Supplier contracts', 'available', 'uploaded'),
  ('00000000-0000-0000-0000-000000000704', '00000000-0000-0000-0000-000000000602', 'VAT filings', 'missing', 'auto_pulled')
on conflict (id) do update
set name = excluded.name,
    status = excluded.status,
    source_type = excluded.source_type;

insert into credit_decisions (
  id,
  application_id,
  actor_user_id,
  actor_role,
  decision,
  notes,
  approved_amount,
  approved_term_months,
  approved_rate_percent,
  created_at
)
values
  ('00000000-0000-0000-0000-000000000801', '00000000-0000-0000-0000-000000000602', '00000000-0000-0000-0000-000000000203', 'bank_admin', 'counter_offer', 'Requested updated VAT filing before final approval.', 540000000.00, 18, 19.50, now() - interval '45 minutes')
on conflict (id) do update
set decision = excluded.decision,
    notes = excluded.notes,
    approved_amount = excluded.approved_amount,
    approved_term_months = excluded.approved_term_months,
    approved_rate_percent = excluded.approved_rate_percent,
    created_at = excluded.created_at;


-- File: db\seeds\bank-portfolio.sql

-- Bank portal: Portfolio

insert into bank_tenant_health (
  tenant_id,
  credit_score,
  inventory_risk,
  workflow_bottlenecks,
  overdue_service_orders,
  health_trend,
  industry,
  region,
  score_version,
  score_factors,
  recommended_action,
  default_risk_percent,
  expected_return_percent,
  refreshed_at
)
values
  ('00000000-0000-0000-0000-000000000101', 81, 'moderate', 2, 0, 'up', 'Wholesale', 'Tashkent', 'risk_v1', '["inventory_turnover","payment_discipline","receivables"]'::jsonb, 'approve', 1.8, 14.2, now()),
  ('00000000-0000-0000-0000-000000000102', 58, 'high', 4, 1, 'down', 'Textiles', 'Namangan', 'risk_v1', '["cash_flow","collections","concentration"]'::jsonb, 'review', 5.6, 11.4, now())
on conflict (tenant_id) do update
set credit_score = excluded.credit_score,
    inventory_risk = excluded.inventory_risk,
    workflow_bottlenecks = excluded.workflow_bottlenecks,
    overdue_service_orders = excluded.overdue_service_orders,
    health_trend = excluded.health_trend,
    industry = excluded.industry,
    region = excluded.region,
    score_version = excluded.score_version,
    score_factors = excluded.score_factors,
    recommended_action = excluded.recommended_action,
    default_risk_percent = excluded.default_risk_percent,
    expected_return_percent = excluded.expected_return_percent,
    refreshed_at = excluded.refreshed_at;


-- File: db\seeds\bank-alerts.sql

-- Bank portal: Alerts

insert into audit_events (
  tenant_id,
  actor_user_id,
  actor_role,
  category,
  action,
  resource_type,
  resource_id,
  metadata
)
values
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000203', 'bank_admin', 'risk', 'cash_flow_anomaly', 'tenant', '00000000-0000-0000-0000-000000000102', '{"severity":"high","message":"Receivables stretched 28 -> 47 days"}'::jsonb),
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000203', 'bank_admin', 'risk', 'inventory_drop', 'tenant', '00000000-0000-0000-0000-000000000101', '{"severity":"medium","message":"Baby formula stage 2 below min for 3 days"}'::jsonb),
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000203', 'bank_admin', 'risk', 'payment_overdue', 'tenant', '00000000-0000-0000-0000-000000000008', '{"severity":"high","message":"UZS 42M ? 14 days past due"}'::jsonb),
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000203', 'bank_admin', 'risk', 'credit_upgrade', 'tenant', '00000000-0000-0000-0000-000000000102', '{"severity":"info","message":"Score 83 -> 86 ? loan renewal eligible"}'::jsonb),
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000203', 'bank_admin', 'risk', 'upsell_opportunity', 'tenant', '00000000-0000-0000-0000-000000000011', '{"severity":"ai","message":"Trade finance fit ? UZS 28M est. revenue"}'::jsonb)
on conflict do nothing;


-- File: db\seeds\bank-tenants.sql

-- Bank portal: All tenants

insert into audit_events (
  tenant_id,
  actor_user_id,
  actor_role,
  category,
  action,
  resource_type,
  resource_id,
  metadata
)
values
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000203', 'bank_admin', 'portfolio', 'tenant_reviewed', 'tenant', '00000000-0000-0000-0000-000000000101', '{"industry":"Wholesale","score":81}'::jsonb),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000203', 'bank_admin', 'portfolio', 'tenant_reviewed', 'tenant', '00000000-0000-0000-0000-000000000102', '{"industry":"Textiles","score":58}'::jsonb)
on conflict do nothing;


-- File: db\seeds\bank-credit-queue.sql

-- Bank portal: Credit queue

insert into credit_applications (
  id,
  tenant_id,
  status,
  submitted_at,
  product,
  purpose,
  requested_amount,
  requested_term_months,
  approved_amount,
  approved_term_months,
  approved_rate_percent,
  priority,
  ai_recommendation,
  ai_rationale,
  score_snapshot,
  score_version,
  assigned_bank_user_id,
  last_reviewed_at
)
values
  ('00000000-0000-0000-0000-000000000601', '00000000-0000-0000-0000-000000000101', 'submitted', now() - interval '3 hours', 'Working capital line', 'Inventory financing', 320000000.00, 12, null, null, null, 'normal', 'approve', 'Stable receivables, positive trend, and acceptable payment discipline support approval at standard pricing.', 81, 'risk_v1', null, null),
  ('00000000-0000-0000-0000-000000000602', '00000000-0000-0000-0000-000000000102', 'in_review', now() - interval '7 hours', 'Equipment loan', 'Weaving line upgrade', 680000000.00, 24, null, null, null, 'high', 'review', 'Mixed cash flow and weaker collections need analyst review before pricing and tenor are finalized.', 67, 'risk_v1', '00000000-0000-0000-0000-000000000203', now() - interval '1 hour')
on conflict (id) do update
set status = excluded.status,
    submitted_at = excluded.submitted_at,
    product = excluded.product,
    purpose = excluded.purpose,
    requested_amount = excluded.requested_amount,
    requested_term_months = excluded.requested_term_months,
    approved_amount = excluded.approved_amount,
    approved_term_months = excluded.approved_term_months,
    approved_rate_percent = excluded.approved_rate_percent,
    priority = excluded.priority,
    ai_recommendation = excluded.ai_recommendation,
    ai_rationale = excluded.ai_rationale,
    score_snapshot = excluded.score_snapshot,
    score_version = excluded.score_version,
    assigned_bank_user_id = excluded.assigned_bank_user_id,
    last_reviewed_at = excluded.last_reviewed_at,
    updated_at = now();


-- File: db\seeds\bank-cross-sell.sql

-- Bank portal: Cross-sell

insert into audit_events (
  tenant_id,
  actor_user_id,
  actor_role,
  category,
  action,
  resource_type,
  resource_id,
  metadata
)
values
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000203', 'bank_admin', 'growth', 'cross_sell_suggested', 'tenant', '00000000-0000-0000-0000-000000000101', '{"product":"trade finance","estimated_revenue":"28M UZS/yr"}'::jsonb)
on conflict do nothing;


-- File: db\seeds\bank-team.sql

-- Bank portal: Bank team

insert into users (id, full_name, email, phone)
values
  ('00000000-0000-0000-0000-000000000301', 'Aziza Karimova', 'aziza.k@sqb.uz', '+998901000301'),
  ('00000000-0000-0000-0000-000000000302', 'Rustam Mahmudov', 'rustam.m@sqb.uz', '+998901000302'),
  ('00000000-0000-0000-0000-000000000303', 'Shahnoza Rahimova', 'shahnoza.r@sqb.uz', '+998901000303'),
  ('00000000-0000-0000-0000-000000000304', 'Timur Abdullaev', 'timur.a@sqb.uz', '+998901000304'),
  ('00000000-0000-0000-0000-000000000305', 'Laylo Mirzaeva', 'laylo.m@sqb.uz', '+998901000305')
on conflict (id) do update
set full_name = excluded.full_name,
    email = excluded.email,
    phone = excluded.phone;


-- File: db\seeds\bank-audit-log.sql

-- Bank portal: Audit log

insert into audit_events (
  tenant_id,
  actor_user_id,
  actor_role,
  category,
  action,
  resource_type,
  resource_id,
  metadata
)
values
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000203', 'bank_admin', 'audit', 'viewed_audit_log', 'tenant', '00000000-0000-0000-0000-000000000101', '{"screen":"bank/audit-log"}'::jsonb)
on conflict do nothing;


-- File: db\seeds\bank-audit-log-bulk.sql

-- Bank portal: Audit log (bulk mock data)
-- Generates a large, realistic timeline for audit dashboards.

do $$
declare
  v_seed_batch constant text := 'bank_audit_mock_v1';
begin
  if exists (
    select 1
    from audit_events
    where metadata ->> 'seed_batch' = v_seed_batch
  ) then
    return;
  end if;

  insert into audit_events (
    tenant_id,
    actor_user_id,
    actor_role,
    category,
    action,
    resource_type,
    resource_id,
    metadata,
    occurred_at
  )
  select
    case
      when gs % 9 = 0 then '00000000-0000-0000-0000-000000000102'::uuid
      else '00000000-0000-0000-0000-000000000101'::uuid
    end as tenant_id,
    case
      when gs % 11 = 0 then '00000000-0000-0000-0000-000000000204'::uuid
      else '00000000-0000-0000-0000-000000000203'::uuid
    end as actor_user_id,
    case
      when gs % 11 = 0 then 'super_admin'
      else 'bank_admin'
    end as actor_role,
    (array['audit', 'risk', 'portfolio', 'credit', 'access', 'compliance'])[(gs % 6) + 1] as category,
    (array[
      'viewed_audit_log',
      'tenant_reviewed',
      'credit_application_scored',
      'risk_flag_created',
      'policy_override_requested',
      'alert_acknowledged',
      'report_exported',
      'user_permission_checked'
    ])[(gs % 8) + 1] as action,
    (array['tenant', 'credit_application', 'session', 'report', 'alert'])[(gs % 5) + 1] as resource_type,
    case
      when gs % 5 = 0 then ('APP-' || lpad(gs::text, 6, '0'))
      when gs % 5 = 1 then ('TENANT-' || lpad(((gs % 2) + 1)::text, 3, '0'))
      when gs % 5 = 2 then ('SESSION-' || lpad(gs::text, 8, '0'))
      when gs % 5 = 3 then ('REPORT-' || lpad(gs::text, 6, '0'))
      else ('ALERT-' || lpad(gs::text, 6, '0'))
    end as resource_id,
    jsonb_build_object(
      'seed_batch', v_seed_batch,
      'sequence', gs,
      'severity', (array['info', 'low', 'medium', 'high'])[(gs % 4) + 1],
      'source', (array['rule_engine', 'risk_job', 'bank_ui', 'system'])[(gs % 4) + 1],
      'note', 'Synthetic audit event for UI and analytics testing'
    ) as metadata,
    now() - (gs * interval '4 minutes') as occurred_at
  from generate_series(1, 1500) as gs;
end $$;


-- File: db\seeds\bank-products.sql

-- Bank portal: Products
-- UI-only mock screen in legacy/src/bank-rest.jsx; no dedicated database table yet.



-- File: db\seeds\bank-notifications.sql

-- Bank portal: Notifications
-- UI-only mock screen in legacy/src/bank-rest.jsx; no dedicated database table yet.



-- File: db\seeds\bank-search.sql

-- Bank portal: Search
-- UI-only mock screen in legacy/src/bank-rest.jsx; no dedicated database table yet.



-- File: db\seeds\bank-reports.sql

-- Bank portal: Reports
-- Reporting screens are UI-only in the legacy mock; no dedicated table seed yet.


-- File: db\seeds\bank-platform.sql

-- Bank portal: Platform
-- Platform settings are UI-only in the legacy mock; no dedicated table seed yet.

