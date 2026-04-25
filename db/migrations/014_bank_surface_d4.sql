create or replace function prevent_audit_event_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'audit_events is append-only';
end;
$$;

drop trigger if exists audit_events_prevent_update on audit_events;
create trigger audit_events_prevent_update
before update on audit_events
for each row
execute function prevent_audit_event_mutation();

drop trigger if exists audit_events_prevent_delete on audit_events;
create trigger audit_events_prevent_delete
before delete on audit_events
for each row
execute function prevent_audit_event_mutation();

create index if not exists audit_events_occurred_at_idx on audit_events (occurred_at desc);
create index if not exists audit_events_tenant_id_idx on audit_events (tenant_id);
create index if not exists audit_events_category_idx on audit_events (category);
create index if not exists audit_events_actor_role_idx on audit_events (actor_role);
create index if not exists audit_events_metadata_gin_idx on audit_events using gin (metadata);

alter table bank_tenant_health
  add column if not exists industry text not null default 'General business',
  add column if not exists region text not null default 'Unknown',
  add column if not exists score_version text not null default 'risk_v1',
  add column if not exists score_factors jsonb not null default '[]'::jsonb,
  add column if not exists recommended_action text not null default 'review',
  add column if not exists default_risk_percent numeric(6,2) not null default 0,
  add column if not exists expected_return_percent numeric(6,2) not null default 0;

alter table bank_tenant_health
  drop constraint if exists bank_tenant_health_inventory_risk_check;

alter table bank_tenant_health
  add constraint bank_tenant_health_inventory_risk_check
  check (inventory_risk in ('low', 'moderate', 'high'));

alter table bank_tenant_health
  drop constraint if exists bank_tenant_health_health_trend_check;

alter table bank_tenant_health
  add constraint bank_tenant_health_health_trend_check
  check (health_trend in ('up', 'flat', 'down'));

alter table bank_tenant_health
  drop constraint if exists bank_tenant_health_recommended_action_check;

alter table bank_tenant_health
  add constraint bank_tenant_health_recommended_action_check
  check (recommended_action in ('approve', 'review', 'decline'));

create table credit_applications (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id),
  status text not null
    check (status in ('submitted', 'in_review', 'approved', 'counter_offered', 'declined')),
  submitted_at timestamptz not null default now(),
  product text not null,
  purpose text not null,
  requested_amount numeric(14,2) not null,
  requested_term_months integer not null,
  approved_amount numeric(14,2),
  approved_term_months integer,
  approved_rate_percent numeric(6,2),
  priority text not null default 'normal'
    check (priority in ('high', 'normal')),
  ai_recommendation text not null
    check (ai_recommendation in ('approve', 'review', 'decline')),
  ai_rationale text not null,
  score_snapshot integer not null,
  score_version text not null default 'risk_v1',
  assigned_bank_user_id uuid references users(id),
  last_reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index credit_applications_status_idx on credit_applications (status, submitted_at desc);
create index credit_applications_tenant_idx on credit_applications (tenant_id);
create index credit_applications_assigned_bank_user_idx on credit_applications (assigned_bank_user_id);

create table credit_decisions (
  id uuid primary key default uuid_generate_v4(),
  application_id uuid not null references credit_applications(id) on delete cascade,
  actor_user_id uuid not null references users(id),
  actor_role text not null,
  decision text not null
    check (decision in ('approve', 'counter_offer', 'decline')),
  notes text,
  approved_amount numeric(14,2),
  approved_term_months integer,
  approved_rate_percent numeric(6,2),
  created_at timestamptz not null default now()
);

create index credit_decisions_application_idx on credit_decisions (application_id, created_at desc);

create table credit_application_documents (
  id uuid primary key default uuid_generate_v4(),
  application_id uuid not null references credit_applications(id) on delete cascade,
  name text not null,
  status text not null check (status in ('available', 'missing')),
  source_type text not null check (source_type in ('auto_pulled', 'uploaded')),
  created_at timestamptz not null default now()
);

create index credit_application_documents_application_idx on credit_application_documents (application_id);
