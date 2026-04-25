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

insert into finance_accounts (
  tenant_id,
  code,
  name,
  category,
  normal_side,
  currency,
  system_key,
  is_system,
  created_by,
  updated_by
)
values
  ('00000000-0000-0000-0000-000000000101', '1001', 'Cash', 'asset', 'debit', 'UZS', 'cash', true, '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201'),
  ('00000000-0000-0000-0000-000000000101', '1100', 'Accounts receivable', 'asset', 'debit', 'UZS', 'accounts_receivable', true, '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201'),
  ('00000000-0000-0000-0000-000000000101', '1150', 'Recoverable VAT', 'asset', 'debit', 'UZS', 'vat_receivable', true, '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201'),
  ('00000000-0000-0000-0000-000000000101', '1200', 'Inventory', 'asset', 'debit', 'UZS', 'inventory', true, '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201'),
  ('00000000-0000-0000-0000-000000000101', '2001', 'Accounts payable', 'liability', 'credit', 'UZS', 'accounts_payable', true, '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201'),
  ('00000000-0000-0000-0000-000000000101', '2100', 'VAT payable', 'liability', 'credit', 'UZS', 'vat_payable', true, '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201'),
  ('00000000-0000-0000-0000-000000000101', '3001', 'Retained earnings', 'equity', 'credit', 'UZS', 'retained_earnings', true, '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201'),
  ('00000000-0000-0000-0000-000000000101', '4000', 'Sales revenue', 'revenue', 'credit', 'UZS', 'sales_revenue', true, '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201'),
  ('00000000-0000-0000-0000-000000000101', '5000', 'Cost of goods sold', 'expense', 'debit', 'UZS', 'cost_of_goods_sold', true, '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201'),
  ('00000000-0000-0000-0000-000000000101', '5100', 'Operating expenses', 'expense', 'debit', 'UZS', 'operating_expense', true, '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000201')
on conflict (tenant_id, code) do update
set name = excluded.name,
    category = excluded.category,
    normal_side = excluded.normal_side,
    currency = excluded.currency,
    system_key = excluded.system_key,
    is_system = excluded.is_system,
    created_by = excluded.created_by,
    updated_by = excluded.updated_by,
    updated_at = now();

insert into memberships (tenant_id, user_id, role, permission_groups)
values
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000201', 'owner', '["tenant_governance","finance_operations","inventory_operations","production_operations","service_operations","audit_compliance"]'::jsonb),
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000207', 'company_admin', '["tenant_governance","finance_operations","inventory_operations","production_operations","service_operations","audit_compliance"]'::jsonb),
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000202', 'operator', '["inventory_operations","production_operations","service_operations"]'::jsonb),
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000208', 'manager', '["finance_operations","inventory_operations","production_operations","service_operations"]'::jsonb),
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000209', 'operator', '["inventory_operations","production_operations","service_operations"]'::jsonb),
  (null, '00000000-0000-0000-0000-000000000203', 'bank_admin', '[]'::jsonb),
  (null, '00000000-0000-0000-0000-000000000204', 'super_admin', '[]'::jsonb),
  (null, '00000000-0000-0000-0000-000000000205', 'super_admin', '[]'::jsonb),
  (null, '00000000-0000-0000-0000-000000000206', 'super_admin', '[]'::jsonb)
on conflict do nothing;

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
    'manager',
    '["finance_operations","inventory_operations","production_operations","service_operations"]'::jsonb,
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
  (
    '00000000-0000-0000-0000-000000000601',
    '00000000-0000-0000-0000-000000000101',
    'submitted',
    now() - interval '3 hours',
    'Working capital line',
    'Inventory financing',
    320000000.00,
    12,
    null,
    null,
    null,
    'normal',
    'approve',
    'Stable receivables, positive trend, and acceptable payment discipline support approval at standard pricing.',
    81,
    'risk_v1',
    null,
    null
  ),
  (
    '00000000-0000-0000-0000-000000000602',
    '00000000-0000-0000-0000-000000000102',
    'in_review',
    now() - interval '7 hours',
    'Equipment loan',
    'Weaving line upgrade',
    680000000.00,
    24,
    null,
    null,
    null,
    'high',
    'review',
    'Mixed cash flow and weaker collections need analyst review before pricing and tenor are finalized.',
    67,
    'risk_v1',
    '00000000-0000-0000-0000-000000000203',
    now() - interval '1 hour'
  )
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
  (
    '00000000-0000-0000-0000-000000000801',
    '00000000-0000-0000-0000-000000000602',
    '00000000-0000-0000-0000-000000000203',
    'bank_admin',
    'counter_offer',
    'Requested updated VAT filing before final approval.',
    540000000.00,
    18,
    19.50,
    now() - interval '45 minutes'
  )
on conflict (id) do update
set decision = excluded.decision,
    notes = excluded.notes,
    approved_amount = excluded.approved_amount,
    approved_term_months = excluded.approved_term_months,
    approved_rate_percent = excluded.approved_rate_percent,
    created_at = excluded.created_at;
