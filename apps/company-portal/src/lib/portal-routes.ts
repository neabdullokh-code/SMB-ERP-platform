const COMPANY_ROUTE_TO_PATH: Record<string, string> = {
  "/login": "/login",
  "/otp": "/otp",
  "/forgot": "/forgot",
  "/terms": "/terms",
  "/onboarding": "/onboarding",
  "/bank/home": "/bank/home",
  "/bank/alerts": "/bank/alerts",
  "/bank/tenants": "/bank/tenants",
  "/bank/tenant": "/bank/tenant",
  "/bank/tenant-mgmt": "/bank/tenant-mgmt",
  "/bank/credit-queue": "/bank/credit-queue",
  "/bank/cross-sell": "/bank/cross-sell",
  "/bank/reports": "/bank/reports",
  "/bank/team": "/bank/team",
  "/bank/settings": "/bank/settings",
  "/bank/audit": "/bank/audit",
  "/search": "/search",
  "/smb/home": "/app/dashboard",
  "/smb/copilot": "/app/copilot",
  "/smb/inventory": "/app/inventory",
  "/smb/inventory/detail": "/app/inventory/detail",
  "/smb/inventory/scan": "/app/inventory/scan",
  "/smb/production": "/app/production",
  "/smb/production/order": "/app/production/order",
  "/smb/services": "/app/service-orders",
  "/smb/services/wo": "/app/service-orders/work-order",
  "/smb/finance": "/app/finance",
  "/smb/finance/ledger": "/app/finance/ledger",
  "/smb/finance/invoices": "/app/finance/invoices",
  "/smb/finance/bills": "/app/finance/bills",
  "/smb/finance/cash": "/app/finance/cash",
  "/smb/finance/accounts": "/app/finance/accounts",
  "/smb/finance/reports": "/app/finance/reports",
  "/smb/finance/counterparties": "/app/finance/counterparties",
  "/smb/finance/payments": "/app/finance/payments",
  "/smb/reports": "/app/reports",
  "/smb/credit": "/app/credit",
  "/smb/loan": "/app/loan",
  "/smb/team": "/app/team",
  "/smb/settings": "/app/settings",
  "/smb/notifications": "/app/notifications"
};

export const COMPANY_PUBLIC_PROTOTYPE_PATHS = new Set([
  "/login",
  "/otp",
  "/forgot",
  "/terms",
  "/onboarding"
]);
export const COMPANY_PROTECTED_PROTOTYPE_PATHS = new Set([
  "/bank/home",
  "/bank/alerts",
  "/bank/tenants",
  "/bank/tenant",
  "/bank/tenant-mgmt",
  "/bank/credit-queue",
  "/bank/cross-sell",
  "/bank/reports",
  "/bank/team",
  "/bank/settings",
  "/bank/audit",
  "/search",
  "/app/dashboard",
  "/app/copilot",
  "/app/finance",
  "/app/finance/ledger",
  "/app/finance/invoices",
  "/app/finance/bills",
  "/app/finance/cash",
  "/app/finance/accounts",
  "/app/finance/reports",
  "/app/finance/counterparties",
  "/app/finance/payments",
  "/app/reports",
  "/app/credit",
  "/app/loan",
  "/app/team",
  "/app/settings",
  "/app/notifications"
]);

// Paths served by real Next.js pages (not the legacy prototype).
// Middleware validates the session and then lets Next.js routing take over.
export const COMPANY_NEXTJS_APP_PATHS = new Set([
  "/app/inventory",
  "/app/inventory/detail",
  "/app/production",
  "/app/service-orders",
]);

function normalizePath(path?: string | null) {
  if (!path) {
    return "";
  }

  const normalized = path.startsWith("/") ? path : `/${path}`;
  return normalized.replace(/\/+$/, "") || "/";
}

export function mapCompanyRedirectPath(path?: string | null) {
  const normalized = normalizePath(path);
  if (!normalized) {
    return "/app/dashboard";
  }

  if (normalized in COMPANY_ROUTE_TO_PATH) {
    return COMPANY_ROUTE_TO_PATH[normalized];
  }

  if (normalized === "/search" || normalized.startsWith("/app/") || normalized.startsWith("/bank/")) {
    return normalized;
  }

  return "/app/dashboard";
}
