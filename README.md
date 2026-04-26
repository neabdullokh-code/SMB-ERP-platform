# SQB Business OS — Multi-Tenant ERP + Bank Lending Platform

> A production-grade ERP system built for Uzbek SMBs, with an integrated bank portal for automated credit underwriting — all in a single full-stack monorepo.

---

## What Problem Does This Solve?

Small businesses in Central Asia manage their operations in spreadsheets. Banks ask for those same spreadsheets when evaluating loan applications. This creates manual overhead, data transcription errors, and slow credit decisions that can take weeks.

**SQB Business OS** eliminates this gap with two connected portals:

1. **Company Portal** — gives SMBs a complete operational system: double-entry accounting, inventory management, production tracking, and service order workflows in one place.

2. **Bank Portal** — gives bank staff a live, automatically scored view of each SMB client. Credit applications are backed by real operational data (cash flow, AR aging, inventory quality, payment history), and a risk engine runs on a schedule to surface alerts and underwriting recommendations without manual analysis.

No spreadsheet exports. No data re-entry at the bank. The data that drives credit decisions is the same data the business uses every day.

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          npm workspaces monorepo                          │
│                                                                            │
│  ┌──────────────────────┐    ┌──────────────────────────┐               │
│  │   Company Portal      │    │      Bank Portal           │               │
│  │   Next.js 15 :3000    │    │      Next.js 15 :3001      │               │
│  │                       │    │                            │               │
│  │  Finance (GL, AR, AP) │    │  Portfolio Dashboard        │               │
│  │  Inventory + OCR      │    │  Credit Queue (underwrite) │               │
│  │  Production (BOM)     │    │  Audit Trail               │               │
│  │  Service Orders       │    │  Tenant Health Table       │               │
│  └──────────┬────────────┘    └────────────┬───────────────┘               │
│             │                              │                               │
│             └─────────────┬───────────────┘                               │
│                           ▼                                                │
│             ┌─────────────────────────────┐                               │
│             │       Platform API            │                               │
│             │       Fastify 5  :4000        │                               │
│             │                               │                               │
│             │  13 domain modules (plugins): │                               │
│             │  auth · tenancy · finance      │                               │
│             │  inventory · production        │                               │
│             │  service-orders · credit       │                               │
│             │  bank-monitoring · documents   │                               │
│             │  workflow · notifications      │                               │
│             │  audit · profile               │                               │
│             └──────────┬──────────────────┘                               │
│                        │                                                   │
│           ┌────────────┼────────────────┐                                 │
│           ▼            ▼                ▼                                 │
│      PostgreSQL 16   Redis 7          MinIO                               │
│      (RLS enabled)   (BullMQ)     (S3-compatible)                        │
│                                                                            │
│             ┌─────────────────────────────┐                               │
│             │      Background Worker        │                               │
│             │      node-cron scheduler      │                               │
│             │                               │                               │
│             │  risk-refresh   (every 1h)    │                               │
│             │  credit-alerts  (every 15m)   │                               │
│             │  health-project (every 6h)    │                               │
│             │  otp-cleanup    (every 5m)    │                               │
│             └─────────────────────────────┘                               │
│                                                                            │
│  Shared packages:                                                          │
│  @sqb/ui · @sqb/api-client · @sqb/domain-types · @sqb/config             │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Monorepo Structure

```
sqb-business-os/
├── apps/
│   ├── company-portal/        # SMB-facing Next.js 15 app (port 3000)
│   └── bank-portal/           # Bank-facing Next.js 15 app (port 3001)
├── services/
│   ├── platform-api/          # Fastify 5 REST API (port 4000)
│   └── worker/                # Background job scheduler (node-cron)
├── packages/
│   ├── ui/                    # Shared React component library
│   ├── api-client/            # Typed HTTP client (fetch-based, no extra deps)
│   ├── domain-types/          # Shared TypeScript interfaces & enums
│   ├── config/                # Zod-validated env loading + JSON logger factory
│   ├── tsconfig/              # Base TypeScript configs
│   └── eslint-config/         # Shared ESLint rules
├── db/
│   ├── migrations/            # 17 ordered plain-SQL migration files
│   └── seeds/                 # Demo data
└── infra/
    └── docker/                # docker-compose.yml (PostgreSQL, Redis, MinIO)
```

---

## Feature Modules

### Company Portal (`apps/company-portal`)

The daily operational interface for business owners, accountants, and warehouse managers.

#### Finance

A complete double-entry accounting system:

- **General Ledger** — every financial event posts paired debit/credit journal entries atomically; no direct GL edits, only via document posting or explicit manual journals
- **Chart of Accounts** — assets, liabilities, equity, revenue, expense categories with custom account creation
- **Invoices (AR)** — create, issue, track payments, and void; status machine: `draft → issued → paid / overdue / voided`
- **Bills (AP)** — mirror invoice workflow for payables with supplier linking
- **Payments** — record incoming/outgoing payments and reconcile against specific invoices or bills
- **Counterparties** — unified customer/supplier records with balance tracking
- **Cash Flow** — 6-month monthly bucketed inflow/outflow view; missing months zero-filled for stable visualization
- **Reports** — trial balance, P&L, and balance sheet generated on demand with PDF export via PDFKit
- **Manual Journals** — ad-hoc GL adjustments for opening balances, reversals, and corrections with full audit trail

All monetary amounts use `decimal.js` to eliminate floating-point errors; values stored as strings in the database.

#### Inventory

Multi-warehouse stock management with complete movement history:

- **Warehouses** — logical storage locations per tenant
- **Items** — SKU, name, category, reorder point, unit cost (UZS), on-hand quantity
- **Stock Movements** — every change to stock is recorded as a typed event: `inbound` (receipt), `outbound` (issue), `transfer` (warehouse-to-warehouse), `adjustment` (correction); each carries a reference document number and actor
- **Stocktakes** — physical count sessions with variance reporting (system quantity vs. counted quantity)
- **Valuation** — cost-basis inventory valuation in Uzbek Som
- **Low-Stock Alerts** — automatic flagging when `on_hand ≤ reorder_point`

Stock on-hand is computed from the cumulative sum of movements — there is no separate snapshot table. Every change has a type, timestamp, reference, and actor. This enables full traceability and supports advanced cost methods (FIFO, weighted-average) in the future.

#### AI Copilot — OCR Document Intake

An OCR + LLM pipeline that digitizes paper documents:

- Accepts JPEG, PNG, or PDF uploads via the company portal
- Extracts text with Tesseract.js (images) or pdf-parse (PDFs)
- Sends extracted text to Google Gemini with a structured prompt that requests JSON output
- Returns: vendor name, date, total amount, line items (description, quantity, unit price)
- Auto-populates inventory receipt or bill forms; user reviews and confirms before saving
- Graceful fallback to manual entry if Gemini API key is not configured

#### Production

Manufacturing order management with material tracking:

- **Bills of Materials (BOMs)** — versioned recipes linking raw material SKUs and quantities to a finished good SKU
- **Production Orders** — state machine: `planned → in_progress → completed / blocked`; tracks planned units, produced units, and scheduled date
- **Material Consumption** — raw materials are pulled from inventory when a production order starts; finished goods are added on completion
- **Scrap Records** — defect tracking with quantity and reason code per order

#### Service Orders

Field service and internal work request management:

- **Work Orders** — state machine: `submitted → approved → in_progress → completed / rejected`
- **Approval Requests** — first-class entities independent from orders; supports chaining and role-based routing (manager, admin, bank_admin)
- **Role-based queue** — unified view filtered by the current user's assignment

---

### Bank Portal (`apps/bank-portal`)

The underwriting and portfolio monitoring interface for bank staff.

#### Portfolio Dashboard

A real-time view across all SMB tenants on the platform:

- **Portfolio KPIs** — total tenants, average credit score, high-risk count, SLA compliance (percentage of credit applications reviewed within 24 hours)
- **Tenant Health Table** — sortable and filterable by industry, region, credit score (0–100), inventory risk level (`low / moderate / high`), and health trend (`up / flat / down`)
- **Portfolio Alerts** — auto-generated from the risk engine: credit score drops, high debt ratios, inventory deterioration, overdue invoices; severity levels: `critical / warn / neutral`

#### Credit Queue

The loan application review workflow:

- **Application List** — filtered by status (`submitted / in_review / approved / declined / counter_offered`), AI recommendation, and priority; sortable by date, score, or tenant
- **Application Detail** — financial summary panel (cash balance, AR/AP aging, monthly net cash flow), risk factor breakdown with impact-weighted bars
- **AI Recommendation** — `approve / review / decline` with rationale derived from the credit score factor breakdown
- **Decision Modal** — record approval, counter-offer (with amended amount/rate/term), or decline with notes; full decision history per application
- **Document Tracking** — auto-pulled financial statements plus user-uploaded files, with document availability status

#### Audit Trail

Global compliance log:

- Authentication events (login, OTP verify, password reset, session termination)
- Financial mutations (invoice posted, payment recorded, GL adjustment)
- Credit decisions (approvals, declines, counter-offers with actor and timestamp)
- Filterable by category and date range with pagination

---

### Platform API (`services/platform-api`)

A **Fastify 5 modular monolith** with 13 domain modules. Each module is a self-contained Fastify plugin with isolated route registration (`index.ts`), database queries (`store.ts`), and input validation (`validation.ts`).

| Module | Purpose |
|---|---|
| `auth` | Session management, OTP (SMS/TOTP), password reset, terms acceptance |
| `tenancy` | Workspace creation, member roles, email-based invitations |
| `finance` | Double-entry GL, invoices, bills, accounts, payments, cash flow, PDF reports |
| `inventory` | Warehouses, items, stock movements, stocktakes, OCR endpoint |
| `production` | BOMs, production orders, scrap records |
| `service-orders` | Work order state machine and approval routing |
| `credit` | Loan application submission, document management, risk scoring |
| `bank-monitoring` | Portfolio health read model, alert generation, credit queue and decisions |
| `documents` | Atomic document posting: goods receipts, goods issues, inventory transfers |
| `workflow` | Generic approval routing across entity types |
| `notifications` | Event queuing for SMS (Twilio) and email (SendGrid) dispatch |
| `audit` | Event logging and retrieval; super-admin break-glass access log |
| `profile` | User profile, avatar upload, email change with verification tokens |

**Cross-cutting infrastructure:**

- **Request Context Plugin** — extracts `x-session-token`, validates session in the database, resolves role-based permissions, and sets `SET LOCAL app.tenant_id = '...'` as a PostgreSQL session variable that activates RLS policies
- **Error Handling Plugin** — catches `DocumentPostingError` and domain exceptions; formats all errors as `{ error: { code, message, details } }`
- **Rate Limiting** — 100 requests/minute per IP via `@fastify/rate-limit`; overridable per route
- **Multipart** — 20 MB file upload limit for documents and avatars via `@fastify/multipart`
- **CORS** — configurable via `ALLOWED_ORIGINS` env variable; defaults allow localhost:3000 and localhost:3001

---

### Background Worker (`services/worker`)

A `node-cron` scheduler running five independent jobs:

| Job | Schedule | What It Does |
|---|---|---|
| Risk Refresh | Every 1 hour | Fetches credit scores for all tenants via the API and logs results |
| Credit Alerts | Every 15 min | Scans the portfolio for score drops, high debt ratios, and inventory deterioration; creates or updates alert records |
| Tenant Health Projection | Every 6 hours | Computes `healthTrend` (`up/flat/down`) and forward-looking risk metrics for the bank dashboard read model |
| OTP Cleanup | Every 5 min | Deletes OTP challenges older than 10 minutes |
| Notification Dispatch | On startup | Fans out queued notifications to SMS and email providers |

---

## Data Model

### Multi-Tenancy and Authorization

Every database table includes a `tenant_id` column. PostgreSQL Row-Level Security (RLS) policies enforce isolation at the database level, not the application level. The request context plugin sets `SET LOCAL app.tenant_id = '...'` before each query; RLS policies automatically filter all reads and writes to that tenant's rows. A compromised application that skips auth middleware still cannot read another tenant's data — the database rejects it.

**Role hierarchy:**

```
Global roles (platform-wide):
  super_admin   — full access; break-glass logging
  bank_admin    — bank portal access; credit decisions; portfolio view
  company_admin — company portal admin; can invite members
  employee      — company portal operator; restricted by workspace role

Workspace roles (per-tenant assignment):
  owner         — full tenant admin
  company_admin — tenant management
  manager       — approve orders, view reports
  operator      — day-to-day data entry
```

### Authentication Flow

```
Users ──< Sessions (opaque UUID stored hashed in DB, returned as x-session-token)
       ──< OtpChallenges (SMS code or TOTP, expires in 10 min)
       ──< RefreshTokens (rotate on each use — anti-replay)
       ──< WorkspaceMemberships (user + tenant + workspace role)
       ──< WorkspaceInvites (email + accept token)
```

Login: `POST /auth/login/password` → returns OTP challenge → `POST /auth/otp/verify` → returns session token → all subsequent requests use `x-session-token` header.

### Finance Domain

```
FinanceAccounts (chart of accounts: asset / liability / equity / revenue / expense)
    └── JournalBatches (grouped by source document)
            └── JournalLines (debit + credit pairs, running balance)

Counterparties (unified customers and suppliers)
    ├── Invoices (AR) ──< FinanceDocumentLines (description, qty, price, tax)
    ├── Bills   (AP)  ──< FinanceDocumentLines
    └── Payments (links to specific invoice or bill)

ManualJournals (ad-hoc GL adjustments with required description)
```

### Inventory Domain

```
Warehouses (named storage locations per tenant)

InventoryItems (SKU, reorder_point, unit_cost_uzs, on_hand derived from movements)
    └── InventoryMovements
            type: inbound | outbound | transfer | adjustment
            fields: qty, date, reference_doc, warehouse_id, actor_id

Stocktakes
    └── StocktakeLines (item + system_qty + counted_qty → variance)
```

### Production Domain

```
BOMs (Bills of Materials — versioned)
    └── BomMaterials (raw_material_sku, quantity, unit)
           output_sku → finished good

ProductionOrders
    ├── bom_id, status, planned_units, produced_units, scheduled_date
    └── ScrapRecords (reason_code, quantity)
```

### Credit and Bank Monitoring Domain

```
CreditApplications
    ├── wizard steps: step1 (business), step2 (loan terms), step3 (financials)
    ├── status: submitted → in_review → approved | counter_offered | declined
    ├── CreditDocuments (auto-pulled or user-uploaded; availability status)
    └── CreditDecisions (decision + amended_terms + notes + actor + timestamp)

BankTenantHealth  ← read model, updated hourly by worker
    ├── credit_score (0–100, see scoring model below)
    ├── score_factors (array: label, impact, value — drives UI impact bars)
    ├── inventory_risk: low | moderate | high
    ├── health_trend: up | flat | down
    └── recommended_action: approve | review | decline

PortfolioAlerts   ← auto-generated by credit-alerts worker job
    ├── severity: critical | warn | neutral
    └── type: credit_score_drop | high_debt_ratio | inventory_deterioration | ...
```

---

## Credit Scoring Model (`risk_v1`)

The scoring engine runs hourly per tenant and produces a 0–100 score from weighted operational signals:

| Factor | Weight | Data Source |
|---|---|---|
| Cash balance vs. liabilities | 20% | Finance module — current cash position |
| Debt ratio | 15% | Finance module — total liabilities / total assets |
| Revenue trend | 15% | Finance module — month-over-month revenue change |
| Inventory quality | 15% | Inventory module — overdue stocktakes, low-stock items |
| Payment punctuality | 15% | Finance module — % invoices collected on time |
| Overdue invoices | 10% | Finance module — AR aging analysis |
| Service order completion rate | 5% | Service module — completed vs. open orders |
| Bill payment timeliness | 5% | Finance module — AP aging analysis |

**Score bands:** green (70–100), yellow (50–69), red (0–49).

The bank portal surfaces each factor as a weighted impact bar, so underwriters can see exactly why a score is high or low without opening the business's books.

---

## Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend framework | Next.js (App Router) | 15 |
| Frontend UI library | React | 19 |
| API framework | Fastify | 5 |
| Database | PostgreSQL (with RLS) | 16 |
| ORM | Prisma | 6.2 |
| Raw SQL driver | pg (node-postgres) | 8 |
| Job queue | BullMQ | 5 |
| Job scheduler | node-cron | — |
| Cache / pub-sub | Redis | 7 |
| Object storage | MinIO (S3-compatible) | — |
| PDF generation | PDFKit | 0.18 |
| OCR | Tesseract.js | 7 |
| AI document extraction | Google Gemini API | 0.24 |
| Input validation | Zod | 3 |
| Auth tokens | jose (JOSE / JWT) | 6 |
| Decimal arithmetic | decimal.js | 10 |
| Language | TypeScript | 5.7 |
| Monorepo tooling | npm workspaces | — |
| E2E testing | Playwright | 1.51 |

---

## Quick Start

### Prerequisites

- Node.js 20+
- Docker + Docker Compose
- npm 10+

### 1. Start infrastructure

```bash
docker compose -f infra/docker/docker-compose.yml up -d
# PostgreSQL 16 on :5432, Redis 7 on :6379, MinIO on :9000 / :9001
```

### 2. Configure environment

```bash
# services/platform-api/.env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sqb_erp
DIRECT_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sqb_erp
REDIS_URL=redis://localhost:6379
JWT_SECRET=change-me-in-production
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
ALLOW_DEMO_AUTH=true          # enables fixture auth when DB unavailable

# apps/company-portal/.env.local
NEXT_PUBLIC_API_URL=http://localhost:4000
GEMINI_API_KEY=your-key-here  # optional; enables AI document extraction

# apps/bank-portal/.env.local
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 3. Apply migrations and seed demo data

```bash
npm run db:migrate --workspace @sqb/platform-api
psql postgresql://postgres:postgres@localhost:5432/sqb_erp < db/seeds/demo.sql
```

### 4. Install and start all services

```bash
npm install
npm run dev
# Company portal: http://localhost:3000
# Bank portal:    http://localhost:3001
# API:            http://localhost:4000
```

Or run services individually:

```bash
npm run dev:api        # Fastify API on :4000
npm run dev:company    # Company portal on :3000
npm run dev:bank       # Bank portal on :3001
npm run dev:worker     # Background worker
```

### 5. Supabase (cloud PostgreSQL)

To use Supabase instead of a local database, set:

```bash
DATABASE_URL=postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres?sslmode=require
DIRECT_DATABASE_URL=postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres?sslmode=require
```

Use the Session Pooler string for `DATABASE_URL` (runtime traffic) and the direct connection for `DIRECT_DATABASE_URL` (migrations). The auth flow is entirely custom — Supabase Auth is not used.

---

## Database Migrations

Plain SQL files in `db/migrations/`, applied in order:

| File | Content |
|---|---|
| `001_initial_schema.sql` | Users, tenants, memberships |
| `002_auth_identity.sql` | Sessions, password hashes |
| `003_workspace_onboarding.sql` | Workspace invites and onboarding |
| `004_user_email_and_tenant_profiles.sql` | Email verification, tenant metadata |
| `005_otp_methods_and_pgcrypto.sql` | OTP challenges, pgcrypto extension |
| `006_sms_provider_normalization.sql` | SMS provider config |
| `007_finance_core.sql` | GL, chart of accounts, invoices, bills, payments |
| `008_finance_rls.sql` | Row-Level Security policies for all finance tables |
| `009_super_admin_totp_toggle.sql` | Super admin TOTP configuration |
| `010_refresh_tokens.sql` | Refresh token rotation table |
| `011_invite_accept_token.sql` | Invite acceptance token indexing |
| `012_workspace_access_control.sql` | Workspace role permission assignments |
| `013_session_last_seen.sql` | Session activity tracking |
| `014_bank_surface_d4.sql` | Bank health projections, portfolio alerts |
| `014_credit_schema.sql` | Credit applications, documents, decisions |
| `015_inventory_unit_cost.sql` | Unit cost column for inventory items |
| `016_inventory_documents_and_ledger.sql` | Movements, warehouses, stocktakes |
| `017_production_documents.sql` | BOMs, production orders, scrap records |

---

## API Conventions

All API responses follow a standard envelope:

```json
// Single resource
{ "data": { ... } }

// Collection with pagination
{ "data": [...], "meta": { "total": 42, "page": 1, "pageSize": 20 } }

// Error
{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [...] } }
```

**Authentication:** all authenticated routes require the `x-session-token` header with the opaque token returned by `POST /auth/otp/verify`.

**Tenant context:** the session token identifies the user's active tenant. Super-admin operations across tenants pass an `x-tenant-id` header (permission-gated).

**Rate limiting:** 100 requests/minute per IP by default; auth endpoints are stricter.

---

## Key Architectural Decisions

### PostgreSQL RLS for tenant isolation — not application-layer filtering

Multi-tenancy is enforced at the database layer. The request context plugin sets `SET LOCAL app.tenant_id = '...'` before each query, and RLS policies automatically restrict all reads and writes to that tenant's rows. Even a buggy or compromised application handler that skips permission checks cannot read another tenant's data — the database itself enforces the boundary. This is a stronger guarantee than application-level `WHERE tenant_id = ?` filters.

### Double-entry accounting — not a simple ledger

Every financial mutation creates balanced journal entries (debit + credit pairs) in an atomic database transaction. This means the balance sheet always balances, P&L is always derivable from the GL, and every cent has a documented source and destination. There are no "magic reconciliation" queries — the numbers add up by construction.

### Movements-based inventory — not snapshot-based

Stock on-hand is computed from the cumulative sum of all movement records. There is no separate `stock_on_hand` table that gets silently updated. Every quantity change has a type, timestamp, reference document, and actor. This design enables full traceability, supports FIFO/weighted-average cost methods in the future, and eliminates the class of bugs where snapshots get out of sync with the underlying events.

### Bank monitoring as a read model — not live queries

`BankTenantHealth` is a dedicated table refreshed hourly by the worker. The bank portal reads from this pre-computed table rather than joining across all operational tables at query time. This keeps bank dashboard queries fast and predictable, decouples bank reads from company writes, and creates a versioned, timestamped snapshot for audit purposes.

### Modular Fastify monolith — not microservices

Thirteen domain modules registered as Fastify plugins. Each module owns its routes, validation, and database queries with no cross-module function calls in the request path. The structure is designed so that any module can be extracted into a standalone microservice by wrapping its `store.ts` in an HTTP layer — without changing the module's interface or the rest of the system.

### Zod for input validation — not decorators or class-validators

Every mutation endpoint defines a Zod schema inline. This provides runtime safety, composable types, excellent structured error messages (surfaced as 400 responses with field-level detail), and no framework magic — the schema is exactly what the handler accepts.

### decimal.js for all monetary values — not JavaScript numbers

All currency amounts are stored as strings in the database and parsed as `Decimal` objects in application code. JavaScript's IEEE 754 floating-point cannot represent many decimal fractions exactly, which is unacceptable for accounting. `decimal.js` provides arbitrary-precision decimal arithmetic. 0.01 UZS precision is maintained throughout.

---

## Environment Variables Reference

### Platform API

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string (pooled, for runtime) |
| `DIRECT_DATABASE_URL` | Yes | PostgreSQL connection string (direct, for migrations) |
| `REDIS_URL` | Yes | Redis connection string |
| `JWT_SECRET` | Yes | Secret for signing session tokens |
| `ALLOWED_ORIGINS` | Yes | Comma-separated CORS origins |
| `API_HOST` | No | Bind host (default `0.0.0.0`) |
| `API_PORT` | No | Bind port (default `4000`) |
| `MINIO_ENDPOINT` | No | MinIO endpoint for file storage |
| `MINIO_ACCESS_KEY` | No | MinIO access key |
| `MINIO_SECRET_KEY` | No | MinIO secret key |
| `TWILIO_ACCOUNT_SID` | No | Twilio SID for SMS OTP delivery |
| `TWILIO_AUTH_TOKEN` | No | Twilio auth token |
| `TWILIO_FROM_NUMBER` | No | Sender phone number for SMS |
| `ALLOW_DEMO_AUTH` | No | `true` to enable fixture-based auth without a live database |

### Company Portal

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Yes | Base URL of the platform API |
| `GEMINI_API_KEY` | No | Google Gemini API key for OCR document extraction |

### Bank Portal

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Yes | Base URL of the platform API |

---

## Code Quality Commands

```bash
npm run lint           # ESLint across all workspaces
npm run typecheck      # TypeScript strict check across all workspaces
npm run build          # Production build of all workspaces
npm run e2e            # Playwright end-to-end tests (headless)
npm run e2e:headed     # Playwright with browser visible
npm run e2e:ui         # Playwright interactive UI mode
```

---

## Production Readiness

| Feature Area | Status | Notes |
|---|---|---|
| Authentication — password + OTP + session management | Production-ready | SMS via Twilio; TOTP via any authenticator app; refresh token rotation |
| Multi-tenancy — PostgreSQL RLS | Production-ready | Enforced at DB level; survives application-layer bugs |
| Finance — double-entry GL, AR, AP, payments, reports | Production-ready | Full balanced journal; PDF export; decimal arithmetic |
| Inventory — warehouses, movements, stocktakes, valuation | Production-ready | Movements ledger; multi-warehouse; complete audit trail |
| Production — BOMs, orders, scrap tracking | Production-ready | Versioned BOMs; material consumption; state machine |
| Service Orders — workflows, approvals | Production-ready | Role-based routing; first-class approval entities |
| Audit logging | Production-ready | All mutations logged with actor, timestamp, tenant |
| Bank portfolio dashboard | Production-ready | Pre-computed read model; auto-alerts; filterable health table |
| Credit application queue | Production-ready | Full workflow; decision history; document tracking |
| AI document extraction (OCR + Gemini) | MVP | Works in production; depends on external API; graceful fallback |
| Risk scoring engine | MVP | Rule-based v1 with configurable weights; not ML-based |
| SMS / email notifications | MVP | Wired to Twilio / SendGrid; falls back to console log if unconfigured |
| Real-time updates | Not implemented | Polling only; WebSocket layer is the natural next step |
