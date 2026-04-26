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
