# Access Control Architecture

## Goal

Establish a single source of truth for:

- roles
- permissions
- permission groups
- redirect surfaces
- login intent
- privileged session posture

The project should use role bundles as defaults and permission checks as the enforcement layer.

## Design principles

1. Deny by default.
2. Prefer permissions over raw role string checks.
3. Keep permissions small, descriptive, and auditable.
4. Group permissions for UX so admins understand access in plain language.
5. Reserve privileged sessions for bank-side roles and shorten their TTL.

## Current implementation

- Shared access-control catalog in `packages/domain-types/src/access-control.ts`
- Config exports derived from the shared catalog in `packages/config/src/auth.ts`
- Session/auth policy alignment in `services/platform-api/src/modules/auth/store.ts`
- Tenant membership persistence for workspace roles and permission groups in `services/platform-api/src/modules/tenancy/store.ts`
- Tenant management endpoints for Team workspace operations in `services/platform-api/src/modules/tenancy/index.ts`
- Permission-based enforcement for finance, inventory, production, services, bank monitoring, and audit modules
- Prototype-preserving Team management UX in `apps/company-portal/public/prototype/src/smb-rest.jsx`

## SMB workspace roles

- `owner`: full tenant governance, finance, operations, and audit visibility
- `company_admin`: delegated administrator with the same default access bundle as owner
- `manager`: finance plus operational execution, but no tenant governance
- `operator`: day-to-day inventory, production, and service execution

Each SMB workspace role maps to:

- a coarse auth role for session routing: `company_admin` or `employee`
- a default set of permission groups
- effective permissions derived from the assigned permission groups

This keeps routing stable while allowing the Team workspace to manage real SMB-specific roles without changing the prototype design language.

## Permission groups

- `tenant_governance`: workspace ownership and tenant policy
- `finance_operations`: accounting visibility and change authority
- `inventory_operations`: warehouse and stock control
- `production_operations`: manufacturing execution
- `service_operations`: service workflow progression
- `bank_monitoring`: bank-side portfolio and risk visibility
- `audit_compliance`: evidence, traceability, and control review

## Bank workspace roles

- `bank_admin`: bank monitoring, tenant portfolio visibility, and general audit review
- `super_admin`: all `bank_admin` capabilities plus platform administration and break-glass oversight

Bank-side separation currently ships with these rules:

- `bank_admin` can access monitoring routes and general audit events
- `bank_admin` cannot access break-glass audit events
- `bank_admin` cannot access platform-administration routes such as Bank Team and Platform Settings
- `super_admin` can access monitoring, audit, break-glass audit, and privileged auth security controls

Frontend bank navigation and route redirects now follow the same policy model as the backend:

- monitoring routes require `bank.monitor`
- audit routes require `audit.read`
- platform administration routes require `tenant.manage` and `super_admin`

## Runtime notes

1. Migration `db/migrations/012_workspace_access_control.sql` widens membership roles and persists `permission_groups` on memberships and invitations.
2. Demo-mode SMB sessions continue to work without Docker-backed Postgres by hydrating an in-memory workspace for `tenant_kamolot`.
3. The Team workspace now reads live tenant data from `/api/tenants/me` and writes through `/api/tenants/invites`, `/api/tenants/members/:userId`, and `/api/tenants/invites/:inviteId/revoke`.
4. The prototype layout, cards, tables, drawers, and modals remain the UI surface; only the underlying data and interaction wiring changed.
5. Bank audit UI now reads through `/api/audit/events` and `/api/audit/break-glass`, which proxy to backend permission-enforced audit endpoints.
