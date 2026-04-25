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
