create table credentials (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id),
  password_hash text not null,
  is_privileged boolean not null default false,
  requires_dedicated_account boolean not null default false,
  is_break_glass boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table otp_challenges (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id),
  login_intent text not null check (login_intent in ('smb_customer', 'bank_staff')),
  masked_phone text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  resend_available_at timestamptz not null,
  attempts_remaining integer not null default 5,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create table sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id),
  tenant_id uuid references tenants(id),
  role text not null check (role in ('super_admin', 'bank_admin', 'company_admin', 'employee')),
  session_token text not null unique,
  is_privileged boolean not null default false,
  requires_terms_acceptance boolean not null default false,
  redirect_path text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create table login_attempts (
  id uuid primary key default uuid_generate_v4(),
  identifier text not null,
  login_intent text not null check (login_intent in ('smb_customer', 'bank_staff')),
  outcome text not null,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create table password_reset_requests (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id),
  identifier text not null,
  token text not null unique,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);
