alter table sessions
  add column if not exists last_seen_at timestamptz not null default now();

update sessions
set last_seen_at = coalesce(last_seen_at, created_at)
where last_seen_at is distinct from coalesce(last_seen_at, created_at);

create index if not exists sessions_user_tenant_last_seen_idx
  on sessions (user_id, tenant_id, last_seen_at desc);
