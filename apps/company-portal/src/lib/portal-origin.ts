import { resolvePortalUrl as resolveSharedPortalUrl } from "@sqb/config/portal";

export type PortalTarget = "company" | "bank";

export function resolvePortalUrl(path: string, target: PortalTarget) {
  return resolveSharedPortalUrl(path, target, {
    companyPortalUrl: process.env.NEXT_PUBLIC_COMPANY_PORTAL_URL,
    bankPortalUrl: process.env.NEXT_PUBLIC_BANK_PORTAL_URL
  });
}
