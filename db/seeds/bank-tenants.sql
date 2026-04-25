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
