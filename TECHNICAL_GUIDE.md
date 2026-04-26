# SQB Business OS - Technical Guide

Этот документ содержит только техническую часть: как поднять проект локально, из чего он состоит и какие команды использовать.

## 1) Технологический стек

- Frontend: Next.js 15 + React 19 (`apps/company-portal`, `apps/bank-portal`)
- Backend: Fastify 5 + TypeScript (`services/platform-api`)
- Worker: TypeScript jobs (`services/worker`)
- Database: PostgreSQL
- Infra (локально): Redis, MinIO, опционально локальный PostgreSQL

## 2) Структура монорепозитория

- `apps/company-portal` - портал компании
- `apps/bank-portal` - портал банка
- `services/platform-api` - основной API
- `services/worker` - фоновые задачи
- `packages/ui` - общие UI-компоненты
- `packages/domain-types` - общие типы и контракты
- `packages/api-client` - клиент API для порталов
- `db` - миграции и сиды
- `infra` - docker и инфраструктурные шаблоны

## 3) Локальный запуск

1. Установить зависимости:
   - `npm install`
2. Подготовить env:
   - скопировать `.env.example` в `.env`
   - заполнить `DATABASE_URL`, `DIRECT_DATABASE_URL`, `PLATFORM_API_URL`, `NEXT_PUBLIC_API_URL`
3. Поднять локальную инфраструктуру (опционально, но обычно нужно):
   - `docker compose -f infra/docker/docker-compose.yml up -d`
4. Применить миграции:
   - `npm run db:migrate --workspace @sqb/platform-api`
5. Запустить сервисы:
   - `npm run dev:api`
   - `npm run dev:company`
   - `npm run dev:bank`
   - `npm run dev:worker`

Также можно стартовать основные сервисы вместе:

- `npm run dev`

## 4) Локальные адреса

- Company portal: `http://localhost:3000`
- Bank portal: `http://localhost:3001`
- Platform API: `http://localhost:4000`

## 5) Полезные команды качества

- Lint: `npm run lint`
- Typecheck: `npm run typecheck`
- Build: `npm run build`
- Tests (где есть): `npm run test --workspaces --if-present`

## 6) Дополнительные документы

- Полная архитектурная и командная карта: `DEVELOPER_GUIDE.md`
- Архитектурный обзор: `docs/architecture/overview.md`
- Список API endpoints: `docs/api/endpoints.md`
