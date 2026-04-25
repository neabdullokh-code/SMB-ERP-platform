create extension if not exists pgcrypto;

create table if not exists otp_methods (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  method_type text not null check (method_type in ('sms', 'totp_app')),
  provider_name text not null,
  destination text,
  secret text,
  is_primary boolean not null default false,
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists otp_methods_primary_per_user_idx
  on otp_methods (user_id)
  where is_primary = true and is_enabled = true;

alter table credentials
  add constraint credentials_user_id_unique unique (user_id);

alter table otp_challenges
  add column if not exists otp_method_id uuid references otp_methods(id),
  add column if not exists delivery_method text not null default 'sms' check (delivery_method in ('sms', 'totp_app')),
  add column if not exists delivery_target text,
  add column if not exists provider_name text not null default 'demo_sms',
  add column if not exists consumed_at timestamptz;
