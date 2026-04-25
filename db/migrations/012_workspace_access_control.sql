alter table memberships
  add column if not exists permission_groups jsonb not null default '[]'::jsonb;

alter table workspace_invitations
  add column if not exists permission_groups jsonb not null default '[]'::jsonb;

update memberships
set role = 'operator'
where role = 'employee'
  and tenant_id is not null;

update workspace_invitations
set role = 'operator'
where role = 'employee';

alter table memberships
  drop constraint if exists memberships_role_check;

alter table memberships
  add constraint memberships_role_check
  check (
    role in (
      'super_admin',
      'bank_admin',
      'owner',
      'company_admin',
      'manager',
      'operator',
      'employee'
    )
  );

alter table workspace_invitations
  drop constraint if exists workspace_invitations_role_check;

alter table workspace_invitations
  add constraint workspace_invitations_role_check
  check (role in ('owner', 'company_admin', 'manager', 'operator'));

create index if not exists memberships_tenant_user_idx
  on memberships (tenant_id, user_id);

create index if not exists workspace_invitations_tenant_status_idx
  on workspace_invitations (tenant_id, status, invited_at desc);
