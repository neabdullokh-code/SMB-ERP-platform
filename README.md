# SQB Business OS

Monorepo for an ERP platform with two web portals (company and bank), a Fastify API, and background workers.

The app supports either Supabase Postgres or a self-hosted PostgreSQL server. The existing auth flow remains custom; Supabase Auth is not used in this repo.

## Current stack

- `apps/company-portal`, `apps/bank-portal`: Next.js 15 + React 19
- `services/platform-api`: Fastify 5 + TypeScript + Prisma client + PostgreSQL
- `services/worker`: TypeScript worker jobs
- `packages/*`: shared domain types, UI, config, and API client
- Local infrastructure: Redis 7, MinIO, and optional local PostgreSQL for offline development

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
2. Copy the environment file and set your database DSNs:
   - `Copy-Item .env.example .env`
   - for Supabase, set `DATABASE_URL` to your Session Pooler string for app traffic:
     - `postgresql://postgres.<project-ref>:<url-encoded-password>@aws-0-<region>.pooler.supabase.com:5432/postgres?sslmode=require`
   - for Supabase, set `DIRECT_DATABASE_URL` to your direct database string for migrations:
     - `postgresql://postgres:<url-encoded-password>@db.<project-ref>.supabase.co:5432/postgres?sslmode=require`
   - for self-hosted PostgreSQL, point both `DATABASE_URL` and `DIRECT_DATABASE_URL` at your own server:
     - `postgresql://<user>:<url-encoded-password>@<host>:5432/<database>`
   - keep `PLATFORM_API_URL` and `NEXT_PUBLIC_API_URL` pointed at the local API unless you are changing the topology
   - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are currently unused
3. Start optional local infrastructure:
   - `docker compose -f infra/docker/docker-compose.yml up -d`
   - this is still useful for Redis and MinIO; the bundled local Postgres is optional when using Supabase
4. Apply database migrations to your database:
   - `npm run db:migrate --workspace @sqb/platform-api`
5. Start services:
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

- `DATABASE_URL` is the runtime connection used by the API.
- `DIRECT_DATABASE_URL` is used by Prisma migrations and admin SQL tools.
- On Supabase, prefer the Session Pooler for `DATABASE_URL` and the direct `db.<project-ref>.supabase.co:5432` endpoint for `DIRECT_DATABASE_URL`.
- On self-hosted PostgreSQL, both values can point at the same database server.
- Ensure the password portion of the URIs is URL-encoded if it contains reserved characters such as `+`, `{`, `}`, `>`, `,`, or `@`.
- On Supabase, keep TLS enabled via `?sslmode=require`.
- Apply SQL migrations from `db/migrations` in order, targeting the configured database.
- API also includes Prisma tooling commands:
  - `npm run db:generate --workspace @sqb/platform-api`
  - `npm run db:migrate --workspace @sqb/platform-api`

## Legacy prototype note

The old static prototype is still available under `legacy/` and mirrored under portal `public/prototype` directories for parity-first UI routes. The primary runtime for active development is the Next.js workspace apps.

