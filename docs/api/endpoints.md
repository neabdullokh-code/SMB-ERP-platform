# API Surface

Source of truth: `services/platform-api/src/app.ts` and `services/platform-api/src/modules/*/index.ts`.

## Health

- `GET /health`

## Auth

- `POST /auth/login/password`
- `POST /auth/otp/request`
- `POST /auth/otp/verify`
- `GET /auth/session`
- `GET /auth/staff`
- `GET /auth/security`
- `PATCH /auth/security`
- `POST /auth/logout`
- `POST /auth/terms/accept`
- `POST /auth/password/reset/request`
- `POST /auth/password/reset/consume`
- `POST /auth/token/refresh`
- `POST /auth/internal/cleanup`

## Tenancy

- `GET /tenants/me`
- `POST /tenants/onboarding`
- `GET /auth/invites/:token`
- `POST /auth/invites/:token/accept`
- `POST /tenants/invites`
- `PATCH /tenants/members/:userId`
- `POST /tenants/invites/:inviteId/revoke`

## Finance

- `GET /finance/invoices`
- `POST /finance/invoices`
- `POST /finance/invoices/:id/issue`
- `POST /finance/invoices/:id/void`
- `POST /finance/invoices/:id/payments`
- `GET /finance/invoices/:id/pdf`
- `GET /finance/bills`
- `POST /finance/bills`
- `POST /finance/bills/:id/post`
- `POST /finance/bills/:id/void`
- `POST /finance/bills/:id/payments`
- `GET /finance/bills/:id/pdf`
- `GET /finance/accounts`
- `GET /finance/ledger`
- `GET /finance/cash-flow`
- `GET /finance/counterparties`
- `GET /finance/counterparties/:id`
- `GET /finance/payments`
- `POST /finance/journals/manual`
- `GET /finance/reports/trial-balance`
- `GET /finance/reports/profit-and-loss`
- `GET /finance/reports/balance-sheet`
- `GET /finance/snapshot/:tenantId`

## Inventory

- `GET /inventory/summary`
- `GET /inventory/warehouses`
- `POST /inventory/warehouses`
- `GET /inventory/items`
- `POST /inventory/items`
- `PATCH /inventory/items/:itemId`
- `DELETE /inventory/items/:itemId`
- `GET /inventory/movements`
- `POST /inventory/movements`
- `GET /inventory/stocktakes`
- `POST /inventory/stocktakes`
- `POST /inventory/stocktakes/:stocktakeId/complete`

## Production

- `GET /production/overview`
- `GET /production/boms`
- `POST /production/boms`
- `PATCH /production/boms/:bomId`
- `DELETE /production/boms/:bomId`
- `GET /production/orders`
- `POST /production/orders`
- `PATCH /production/orders/:orderId/status`
- `GET /production/scrap`
- `POST /production/scrap`

## Service orders and workflow

- `GET /service-orders`
- `POST /service-orders`
- `GET /service-orders/:orderId`
- `PATCH /service-orders/:orderId/status`
- `GET /workflows/pending`
- `GET /workflows/approvals`
- `POST /workflows/approvals/:approvalId/process`

## Bank monitoring

- `GET /bank/portfolio`
- `GET /bank/portfolio/alerts`
- `GET /bank/portfolio/:tenantId`

## Credit

- `GET /credit/applications`
- `POST /credit/applications`
- `GET /credit/applications/:id`
- `PATCH /credit/applications/:id/step`
- `POST /credit/applications/:id/submit`
- `POST /credit/applications/:id/documents`
- `GET /credit/applications/:id/documents`
- `GET /credit/applications/:id/documents/:docId/url`
- `POST /credit/applications/:id/decision`
- `GET /credit/applications/:id/decisions`
- `GET /credit/risk/:tenantId`
- `POST /credit/risk/:tenantId/compute`

## Audit

- `GET /audit/events`
- `POST /audit/events`
- `GET /audit/break-glass`

## Notifications

- `GET /notifications/health`
- `POST /notifications/send`

## Notes

- Company-scoped routes may require `x-tenant-id` depending on auth context.
- Bank monitoring and credit review routes are intended for `bank_admin` and `super_admin` (permission-gated).
- Workspace access resolves from workspace roles and permission groups, not only legacy role strings.

