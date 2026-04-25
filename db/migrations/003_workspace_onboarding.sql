create table workspace_invitations (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id),
  full_name text not null,
  email text not null,
  role text not null check (role in ('company_admin', 'employee')),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked')),
  invited_at timestamptz not null default now(),
  accepted_at timestamptz,
  unique (tenant_id, email)
);
