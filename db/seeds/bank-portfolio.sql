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
