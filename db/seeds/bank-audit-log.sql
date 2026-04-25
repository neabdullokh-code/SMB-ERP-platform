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
