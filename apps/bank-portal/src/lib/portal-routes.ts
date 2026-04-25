const BANK_ROUTE_TO_PATH: Record<string, string> = {
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

export const BANK_PUBLIC_PROTOTYPE_PATHS = new Set([
  "/login",
  "/otp",
  "/forgot",
  "/terms",
  "/onboarding"
]);
export const BANK_PROTECTED_PROTOTYPE_PATHS = new Set([
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

function normalizePath(path?: string | null) {
  if (!path) {
    return "";
  }

  const normalized = path.startsWith("/") ? path : `/${path}`;
  return normalized.replace(/\/+$/, "") || "/";
}

export function mapBankRedirectPath(path?: string | null) {
  const normalized = normalizePath(path);
  if (!normalized) {
    return "/app/dashboard";
  }

  if (normalized in BANK_ROUTE_TO_PATH) {
    return BANK_ROUTE_TO_PATH[normalized];
  }

  if (normalized.startsWith("/app/")) {
    return normalized;
  }

  return "/app/dashboard";
}
