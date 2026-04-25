# Architecture Overview

## Core decisions

- Modular monolith backend first, split later only if scaling or org boundaries demand it.
- Two portals instead of one shared runtime: company users and bank users now have explicit application boundaries.
- Logical tenant isolation with `tenant_id` on tenant-owned records and PostgreSQL row-level security.
- Bank monitoring reads from portfolio projections and curated read models, not unrestricted tenant CRUD endpoints.

## Domain modules

- `identity`: OTP request and verification, session issuance, future MFA
- `tenancy`: tenant registry, memberships, role hierarchy, terms acceptance
- `inventory`: warehouses, items, movements, transfers, stocktakes
- `production`: BOMs, production orders, scrap
- `service-orders`: requests, fulfillment, attachments, comments
- `workflow`: approval routing, escalation, decision history
- `bank-monitoring`: portfolio health, alerts, credit-readiness projections
- `audit`: immutable event log across sensitive actions
- `notifications`: OTP, email, SMS, in-app fanout

## Frontend shape

- `apps/company-portal/public/portal-ui/` is the main authenticated SMB UI
- `apps/bank-portal/public/portal-ui/` is the main authenticated bank UI
- `app/` in each portal is a thin Next.js shell for auth pages, middleware, layouts, and `app/api/*` proxy routes
- `src/lib/*` contains shell, routing, and session helpers; it is not the main page surface
- `src/features/auth/*` is kept only for auth experience code shared by `app/(auth)` pages
- Shared visual primitives live in `packages/ui`
- Shared contracts and fixtures live in `packages/domain-types`

## Operational reliability updates (2026-04-26)

- Route-switch auth validation is now fail-soft for transient session endpoint outages.
- Middleware treats refresh endpoint 5xx/network failures as service unavailability, not session invalidation.
- SMB finance UI removed ledger mock fallback balances and now shows explicit loading/empty states.
- SMB cash flow charts are normalized to last 6 monthly buckets to prevent distorted single-bucket rendering.

