-- Bank portal: Audit log (bulk mock data)
-- Generates a large, realistic timeline for audit dashboards.

do $$
declare
  v_seed_batch constant text := 'bank_audit_mock_v1';
begin
  if exists (
    select 1
    from audit_events
    where metadata ->> 'seed_batch' = v_seed_batch
  ) then
    return;
  end if;

  insert into audit_events (
    tenant_id,
    actor_user_id,
    actor_role,
    category,
    action,
    resource_type,
    resource_id,
    metadata,
    occurred_at
  )
  select
    case
      when gs % 9 = 0 then '00000000-0000-0000-0000-000000000102'::uuid
      else '00000000-0000-0000-0000-000000000101'::uuid
    end as tenant_id,
    case
      when gs % 11 = 0 then '00000000-0000-0000-0000-000000000204'::uuid
      else '00000000-0000-0000-0000-000000000203'::uuid
    end as actor_user_id,
    case
      when gs % 11 = 0 then 'super_admin'
      else 'bank_admin'
    end as actor_role,
    (array['audit', 'risk', 'portfolio', 'credit', 'access', 'compliance'])[(gs % 6) + 1] as category,
    (array[
      'viewed_audit_log',
      'tenant_reviewed',
      'credit_application_scored',
      'risk_flag_created',
      'policy_override_requested',
      'alert_acknowledged',
      'report_exported',
      'user_permission_checked'
    ])[(gs % 8) + 1] as action,
    (array['tenant', 'credit_application', 'session', 'report', 'alert'])[(gs % 5) + 1] as resource_type,
    case
      when gs % 5 = 0 then ('APP-' || lpad(gs::text, 6, '0'))
      when gs % 5 = 1 then ('TENANT-' || lpad(((gs % 2) + 1)::text, 3, '0'))
      when gs % 5 = 2 then ('SESSION-' || lpad(gs::text, 8, '0'))
      when gs % 5 = 3 then ('REPORT-' || lpad(gs::text, 6, '0'))
      else ('ALERT-' || lpad(gs::text, 6, '0'))
    end as resource_id,
    jsonb_build_object(
      'seed_batch', v_seed_batch,
      'sequence', gs,
      'severity', (array['info', 'low', 'medium', 'high'])[(gs % 4) + 1],
      'source', (array['rule_engine', 'risk_job', 'bank_ui', 'system'])[(gs % 4) + 1],
      'note', 'Synthetic audit event for UI and analytics testing'
    ) as metadata,
    now() - (gs * interval '4 minutes') as occurred_at
  from generate_series(1, 1500) as gs;
end $$;
