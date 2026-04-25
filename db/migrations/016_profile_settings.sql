alter table users
  add column if not exists avatar_storage_key text,
  add column if not exists avatar_url text,
  add column if not exists avatar_updated_at timestamptz;

create table if not exists profile_email_change_verifications (
  id uuid primary key default uuid_generate_v4(),
  target_user_id uuid not null references users(id),
  requested_by_user_id uuid not null references users(id),
  tenant_id uuid references tenants(id),
  new_email text not null,
  token_hash text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (token_hash)
);

create index if not exists profile_email_change_verifications_target_idx
  on profile_email_change_verifications (target_user_id, created_at desc);

create index if not exists profile_email_change_verifications_expires_idx
  on profile_email_change_verifications (expires_at)
  where consumed_at is null;
