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
