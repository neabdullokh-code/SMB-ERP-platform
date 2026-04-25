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

- Company portal groups features under `src/features/*`
- Bank portal does the same, but only for bank-safe experiences
- Shared visual primitives live in `packages/ui`
- Shared contracts and fixtures live in `packages/domain-types`

