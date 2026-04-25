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
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000203', 'bank_admin', 'risk', 'payment_overdue', 'tenant', '00000000-0000-0000-0000-000000000008', '{"severity":"high","message":"UZS 42M · 14 days past due"}'::jsonb),
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000203', 'bank_admin', 'risk', 'credit_upgrade', 'tenant', '00000000-0000-0000-0000-000000000102', '{"severity":"info","message":"Score 83 -> 86 · loan renewal eligible"}'::jsonb),
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000203', 'bank_admin', 'risk', 'upsell_opportunity', 'tenant', '00000000-0000-0000-0000-000000000011', '{"severity":"ai","message":"Trade finance fit · UZS 28M est. revenue"}'::jsonb)
on conflict do nothing;
