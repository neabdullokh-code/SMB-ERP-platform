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
      'warehouse_clerk',
      'production_operator',
      'service_staff',
      'accountant_economist',
      'executive',
      'auditor',
      'employee'
    )
  );

alter table workspace_invitations
  drop constraint if exists workspace_invitations_role_check;

alter table workspace_invitations
  add constraint workspace_invitations_role_check
  check (
    role in (
      'owner',
      'company_admin',
      'manager',
      'operator',
      'warehouse_clerk',
      'production_operator',
      'service_staff',
      'accountant_economist',
      'executive',
      'auditor'
    )
  );
