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
