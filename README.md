# SQB Business OS

Monorepo for an ERP platform with two web portals (company and bank), a Fastify API, and background workers.

## Current stack

- `apps/company-portal`, `apps/bank-portal`: Next.js 15 + React 19
- `services/platform-api`: Fastify 5 + TypeScript + Prisma client + PostgreSQL
- `services/worker`: TypeScript worker jobs
- `packages/*`: shared domain types, UI, config, and API client
- Local infrastructure: PostgreSQL 16, Redis 7, MinIO

## Workspace layout

- `apps/company-portal`: company-facing portal
- `apps/bank-portal`: bank-facing portal
- `services/platform-api`: tenant-aware backend APIs
- `services/worker`: background jobs
- `packages/ui`: shared UI primitives
- `packages/domain-types`: shared contracts and demo fixtures
- `packages/api-client`: typed client for portals
- `packages/config`: env parsing and logger
- `db`: SQL migrations and seed data
- `infra`: docker and infrastructure templates
- `legacy`: preserved static prototype

## Quick start

1. Install dependencies:
   - `npm install`
2. Start local infrastructure:
   - `docker compose -f infra/docker/docker-compose.yml up -d`
3. Start services:
   - `npm run dev:api`
   - `npm run dev:company`
   - `npm run dev:bank`
   - `npm run dev:worker`

You can also run all major dev services together with `npm run dev`.

## Local endpoints

- Company portal: `http://localhost:3000`
- Bank portal: `http://localhost:3001`
- Platform API: `http://localhost:4000`

## Quality and build commands

- Lint all workspaces: `npm run lint`
- Type-check all workspaces: `npm run typecheck`
- Build all workspaces: `npm run build`
- Run workspace tests (where present): `npm run test --workspaces --if-present`

## Database and migrations

- Apply SQL migrations from `db/migrations` in order.
- API also includes Prisma tooling commands:
  - `npm run db:generate --workspace @sqb/platform-api`
  - `npm run db:migrate --workspace @sqb/platform-api`

## Legacy prototype note

The old static prototype is still available under `legacy/` and mirrored under portal `public/prototype` directories for parity-first UI routes. The primary runtime for active development is the Next.js workspace apps.

