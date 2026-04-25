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
