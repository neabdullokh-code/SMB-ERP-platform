alter table users
  add column if not exists email text;

create unique index if not exists users_email_unique_idx
  on users (lower(email))
  where email is not null;

create table if not exists tenant_profiles (
  tenant_id uuid primary key references tenants(id),
  tin text not null,
  business_type text not null,
  region text not null,
  address text not null,
  plan text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tin)
);
