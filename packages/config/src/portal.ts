export const BANK_ROUTE_TO_PATH: Record<string, string> = {
  "/login": "/login",
  "/otp": "/otp",
  "/forgot": "/forgot",
  "/terms": "/terms",
  "/onboarding": "/onboarding",
  "/bank/home": "/app/dashboard",
  "/bank/alerts": "/app/alerts",
  "/bank/tenants": "/app/tenants",
  "/bank/tenant": "/app/tenants/detail",
  "/bank/tenant-mgmt": "/app/tenant-management",
  "/bank/credit-queue": "/app/credit-queue",
  "/bank/credit/apply": "/app/credit/apply",
  "/bank/cross-sell": "/app/cross-sell",
  "/bank/reports": "/app/reports",
  "/bank/team": "/app/team",
  "/bank/settings": "/app/settings",
  "/bank/audit": "/app/audit"
};

export const COMPANY_ROUTE_TO_PATH: Record<string, string> = {
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

export const BANK_PUBLIC_PORTAL_PATHS = new Set([
  "/login",
  "/otp",
  "/forgot",
  "/terms",
  "/onboarding"
]);

export const BANK_PROTECTED_PORTAL_PATHS = new Set([
  "/app/dashboard",
  "/app/alerts",
  "/app/tenants",
  "/app/tenants/detail",
  "/app/tenant-management",
  "/app/credit-queue",
  "/app/credit/apply",
  "/app/cross-sell",
  "/app/reports",
  "/app/team",
  "/app/settings",
  "/app/audit"
]);

export const COMPANY_PUBLIC_PORTAL_PATHS = new Set([
  "/login",
  "/otp",
  "/forgot",
  "/terms",
  "/onboarding"
]);

export const COMPANY_PROTECTED_PORTAL_PATHS = new Set([
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
  "/app/inventory",
  "/app/inventory/detail",
  "/app/inventory/scan",
  "/app/production",
  "/app/production/order",
  "/app/service-orders",
  "/app/service-orders/work-order",
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
  "/app/profile",
  "/app/settings",
  "/app/notifications"
]);

export const COMPANY_FALLBACK_PORT = "3000";
export const BANK_FALLBACK_PORT = "3001";

export type PortalTarget = "company" | "bank";

function normalizePath(path?: string | null) {
  if (!path) return "";
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return normalized.replace(/\/+$/, "") || "/";
}

export function mapBankRedirectPath(path?: string | null) {
  const normalized = normalizePath(path);
  if (!normalized) return "/app/dashboard";
  if (normalized in BANK_ROUTE_TO_PATH) return BANK_ROUTE_TO_PATH[normalized];
  if (normalized.startsWith("/app/")) return normalized;
  return "/app/dashboard";
}

export function mapCompanyRedirectPath(path?: string | null) {
  const normalized = normalizePath(path);
  if (!normalized) return "/app/dashboard";
  if (normalized in COMPANY_ROUTE_TO_PATH) return COMPANY_ROUTE_TO_PATH[normalized];
  if (normalized === "/search" || normalized.startsWith("/app/") || normalized.startsWith("/bank/")) return normalized;
  return "/app/dashboard";
}

type ResolvePortalUrlOptions = {
  currentHref?: string;
  companyPortalUrl?: string;
  bankPortalUrl?: string;
  companyFallbackPort?: string;
  bankFallbackPort?: string;
};

export function resolvePortalUrl(path: string, target: PortalTarget, options: ResolvePortalUrlOptions = {}) {
  const currentHref = options.currentHref ?? (typeof window !== "undefined" ? window.location.href : undefined);
  if (!currentHref) return path;

  const configuredBase =
    target === "company"
      ? options.companyPortalUrl
      : options.bankPortalUrl;

  if (configuredBase) {
    const configured = new URL(configuredBase);
    configured.pathname = path;
    configured.search = "";
    configured.hash = "";
    return configured.toString();
  }

  const url = new URL(currentHref);
  url.port =
    target === "company"
      ? options.companyFallbackPort ?? COMPANY_FALLBACK_PORT
      : options.bankFallbackPort ?? BANK_FALLBACK_PORT;
  url.pathname = path;
  url.search = "";
  url.hash = "";
  return url.toString();
}
