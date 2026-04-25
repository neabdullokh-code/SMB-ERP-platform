import type { CompanyWorkspaceRole, LoginIntent, Permission, PrivilegedAccessFlags, Role } from "./platform";

export type AccessSurface = "company" | "bank";

export type PermissionGroupKey =
  | "tenant_governance"
  | "finance_operations"
  | "inventory_operations"
  | "production_operations"
  | "service_operations"
  | "bank_monitoring"
  | "credit_operations"
  | "audit_compliance";

export interface PermissionDefinition {
  key: Permission;
  label: string;
  description: string;
  group: PermissionGroupKey;
  risk: "baseline" | "sensitive" | "high";
}

export interface PermissionGroupDefinition {
  key: PermissionGroupKey;
  label: string;
  summary: string;
  uxGuidance: string;
  permissions: Permission[];
}

export interface RoleAccessPolicy {
  role: Role;
  label: string;
  summary: string;
  surface: AccessSurface;
  defaultRedirectPath: string;
  loginIntent: LoginIntent;
  sessionTtlMinutes: number;
  privilegedAccess: PrivilegedAccessFlags;
  permissions: Permission[];
}

export interface CompanyWorkspaceAccessPolicy {
  role: CompanyWorkspaceRole;
  label: string;
  summary: string;
  authRole: Extract<Role, "company_admin" | "employee">;
  defaultPermissionGroups: PermissionGroupKey[];
}

export const permissionDefinitions: Record<Permission, PermissionDefinition> = {
  "tenant.read": {
    key: "tenant.read",
    label: "Tenant read",
    description: "View tenant workspace metadata, users, and scoped operational context.",
    group: "tenant_governance",
    risk: "baseline"
  },
  "tenant.manage": {
    key: "tenant.manage",
    label: "Tenant manage",
    description: "Change tenant-level settings, workspace policy, and administrative controls.",
    group: "tenant_governance",
    risk: "high"
  },
  "finance.read": {
    key: "finance.read",
    label: "Finance read",
    description: "View ledgers, invoices, bills, cash movement, and finance analytics.",
    group: "finance_operations",
    risk: "sensitive"
  },
  "finance.manage": {
    key: "finance.manage",
    label: "Finance manage",
    description: "Create, approve, or change finance records with downstream reporting impact.",
    group: "finance_operations",
    risk: "high"
  },
  "inventory.manage": {
    key: "inventory.manage",
    label: "Inventory manage",
    description: "Adjust stock, receive inventory, and mutate warehouse-controlled records.",
    group: "inventory_operations",
    risk: "sensitive"
  },
  "production.manage": {
    key: "production.manage",
    label: "Production manage",
    description: "Run production orders, BOM execution, and manufacturing state transitions.",
    group: "production_operations",
    risk: "sensitive"
  },
  "service_order.manage": {
    key: "service_order.manage",
    label: "Service orders manage",
    description: "Create and progress service workflows, approvals, and work orders.",
    group: "service_operations",
    risk: "sensitive"
  },
  "bank.monitor": {
    key: "bank.monitor",
    label: "Bank monitoring",
    description: "Review tenant portfolio posture, exposure, and bank-side risk signals.",
    group: "bank_monitoring",
    risk: "high"
  },
  "credit.apply": {
    key: "credit.apply",
    label: "Credit apply",
    description: "Submit and manage loan applications on behalf of the tenant.",
    group: "credit_operations",
    risk: "sensitive"
  },
  "credit.review": {
    key: "credit.review",
    label: "Credit review",
    description: "View loan applications and risk scores as a bank analyst.",
    group: "credit_operations",
    risk: "sensitive"
  },
  "credit.manage": {
    key: "credit.manage",
    label: "Credit manage",
    description: "Approve, reject, or escalate loan applications and override risk scores.",
    group: "credit_operations",
    risk: "high"
  },
  "audit.read": {
    key: "audit.read",
    label: "Audit read",
    description: "Inspect immutable security, workflow, and operational audit events.",
    group: "audit_compliance",
    risk: "sensitive"
  }
};

export const permissionGroupDefinitions: Record<PermissionGroupKey, PermissionGroupDefinition> = {
  tenant_governance: {
    key: "tenant_governance",
    label: "Tenant governance",
    summary: "Workspace ownership, organization settings, and administrative policy.",
    uxGuidance: "Reserve destructive or policy-changing actions for clearly labeled admin surfaces with audit context.",
    permissions: ["tenant.read", "tenant.manage"]
  },
  finance_operations: {
    key: "finance_operations",
    label: "Finance operations",
    summary: "Ledger visibility, accounting workflows, and money-movement controls.",
    uxGuidance: "Separate read-only reporting from change-making actions, and show approval state next to financial actions.",
    permissions: ["finance.read", "finance.manage"]
  },
  inventory_operations: {
    key: "inventory_operations",
    label: "Inventory operations",
    summary: "Stock handling, warehouse movement, and replenishment actions.",
    uxGuidance: "Prefer explicit confirmations for quantity adjustments and show before/after values.",
    permissions: ["inventory.manage"]
  },
  production_operations: {
    key: "production_operations",
    label: "Production operations",
    summary: "Manufacturing execution, BOM tracking, and production orchestration.",
    uxGuidance: "Keep state transitions visible and irreversible actions contextualized near production metrics.",
    permissions: ["production.manage"]
  },
  service_operations: {
    key: "service_operations",
    label: "Service operations",
    summary: "Service queues, approvals, and work-order lifecycle management.",
    uxGuidance: "Expose approval ownership and status inline so operators understand who can advance a job.",
    permissions: ["service_order.manage"]
  },
  bank_monitoring: {
    key: "bank_monitoring",
    label: "Bank monitoring",
    summary: "Bank-side portfolio oversight and institution-scoped risk review.",
    uxGuidance: "Visually separate bank controls from company controls to avoid cross-surface confusion.",
    permissions: ["bank.monitor"]
  },
  credit_operations: {
    key: "credit_operations",
    label: "Credit operations",
    summary: "Loan application lifecycle, risk scoring, and credit decision workflows.",
    uxGuidance: "Separate applicant-facing apply flows from bank-officer review and decision surfaces.",
    permissions: ["credit.apply", "credit.review", "credit.manage"]
  },
  audit_compliance: {
    key: "audit_compliance",
    label: "Audit and compliance",
    summary: "Regulatory traceability, security review, and operational evidence.",
    uxGuidance: "Show provenance, timestamps, and actor identity near every audit-heavy workflow.",
    permissions: ["audit.read"]
  }
};

export const roleAccessPolicies: Record<Role, RoleAccessPolicy> = {
  super_admin: {
    role: "super_admin",
    label: "Super Admin",
    summary: "Privileged bank platform operator with cross-tenant visibility and short-lived sessions.",
    surface: "bank",
    defaultRedirectPath: "/bank/settings",
    loginIntent: "bank_staff",
    sessionTtlMinutes: 60,
    privilegedAccess: {
      isPrivileged: true,
      requiresDedicatedAccount: true,
      isBreakGlass: false,
      sessionTtlMinutes: 60
    },
    permissions: ["tenant.read", "tenant.manage", "bank.monitor", "audit.read"]
  },
  bank_admin: {
    role: "bank_admin",
    label: "Bank Admin",
    summary: "Bank operations owner focused on tenant monitoring, credit decisions, and audit visibility.",
    surface: "bank",
    defaultRedirectPath: "/bank/home",
    loginIntent: "bank_staff",
    sessionTtlMinutes: 120,
    privilegedAccess: {
      isPrivileged: true,
      requiresDedicatedAccount: true,
      isBreakGlass: false,
      sessionTtlMinutes: 120
    },
    permissions: ["tenant.read", "bank.monitor", "audit.read", "credit.review", "credit.manage"]
  },
  company_admin: {
    role: "company_admin",
    label: "Company Admin",
    summary: "Tenant owner with broad operating control across finance and operations.",
    surface: "company",
    defaultRedirectPath: "/smb/home",
    loginIntent: "smb_customer",
    sessionTtlMinutes: 480,
    privilegedAccess: {
      isPrivileged: false,
      requiresDedicatedAccount: false,
      isBreakGlass: false,
      sessionTtlMinutes: 480
    },
    permissions: ["tenant.read", "tenant.manage", "finance.read", "finance.manage", "inventory.manage", "production.manage", "service_order.manage", "audit.read", "credit.apply"]
  },
  employee: {
    role: "employee",
    label: "Employee",
    summary: "Least-privilege operator with scoped access to day-to-day workflows.",
    surface: "company",
    defaultRedirectPath: "/smb/home",
    loginIntent: "smb_customer",
    sessionTtlMinutes: 480,
    privilegedAccess: {
      isPrivileged: false,
      requiresDedicatedAccount: false,
      isBreakGlass: false,
      sessionTtlMinutes: 480
    },
    permissions: ["tenant.read", "finance.read", "inventory.manage", "service_order.manage"]
  }
};

export const companyWorkspaceAccessPolicies: Record<CompanyWorkspaceRole, CompanyWorkspaceAccessPolicy> = {
  owner: {
    role: "owner",
    label: "Owner",
    summary: "Workspace owner with full administrative, financial, and operational authority.",
    authRole: "company_admin",
    defaultPermissionGroups: [
      "tenant_governance",
      "finance_operations",
      "inventory_operations",
      "production_operations",
      "service_operations",
      "audit_compliance"
    ]
  },
  company_admin: {
    role: "company_admin",
    label: "Company admin",
    summary: "Delegated administrator with end-to-end control over tenant operations and team access.",
    authRole: "company_admin",
    defaultPermissionGroups: [
      "tenant_governance",
      "finance_operations",
      "inventory_operations",
      "production_operations",
      "service_operations",
      "audit_compliance"
    ]
  },
  manager: {
    role: "manager",
    label: "Manager",
    summary: "Cross-functional team lead with finance and operations authority, but no workspace governance.",
    authRole: "employee",
    defaultPermissionGroups: [
      "finance_operations",
      "inventory_operations",
      "production_operations",
      "service_operations"
    ]
  },
  operator: {
    role: "operator",
    label: "Operator",
    summary: "Frontline operator focused on day-to-day inventory, production, and service work.",
    authRole: "employee",
    defaultPermissionGroups: [
      "inventory_operations",
      "production_operations",
      "service_operations"
    ]
  }
};

export function permissionsForRole(role: Role): Permission[] {
  return [...roleAccessPolicies[role].permissions];
}

export function permissionGroupsForPermissions(permissions: readonly Permission[]): PermissionGroupDefinition[] {
  const groups = new Set<PermissionGroupKey>();

  for (const permission of permissions) {
    groups.add(permissionDefinitions[permission].group);
  }

  return [...groups].map((groupKey) => permissionGroupDefinitions[groupKey]);
}

export function permissionGroupsForRole(role: Role): PermissionGroupDefinition[] {
  return permissionGroupsForPermissions(roleAccessPolicies[role].permissions);
}

export function isCompanyWorkspaceRole(role: string): role is CompanyWorkspaceRole {
  return role === "owner" || role === "company_admin" || role === "manager" || role === "operator";
}

export function companyWorkspaceAuthRole(role: CompanyWorkspaceRole): Extract<Role, "company_admin" | "employee"> {
  return companyWorkspaceAccessPolicies[role].authRole;
}

export function defaultPermissionGroupsForWorkspaceRole(role: CompanyWorkspaceRole): PermissionGroupKey[] {
  return [...companyWorkspaceAccessPolicies[role].defaultPermissionGroups];
}

export function normalizePermissionGroupKeys(permissionGroups: readonly PermissionGroupKey[]): PermissionGroupKey[] {
  return [...new Set(permissionGroups.filter((group): group is PermissionGroupKey => group in permissionGroupDefinitions))];
}

export function permissionsForPermissionGroups(permissionGroups: readonly PermissionGroupKey[]): Permission[] {
  const permissions = new Set<Permission>();

  for (const group of normalizePermissionGroupKeys(permissionGroups)) {
    for (const permission of permissionGroupDefinitions[group].permissions) {
      permissions.add(permission);
    }
  }

  return [...permissions];
}

export function resolvePermissionGroupsForWorkspaceRole(
  role: CompanyWorkspaceRole,
  permissionGroups?: readonly PermissionGroupKey[]
): PermissionGroupKey[] {
  if (!permissionGroups?.length) {
    return defaultPermissionGroupsForWorkspaceRole(role);
  }

  return normalizePermissionGroupKeys(permissionGroups);
}

export function permissionsForWorkspaceRole(
  role: CompanyWorkspaceRole,
  permissionGroups?: readonly PermissionGroupKey[]
): Permission[] {
  return permissionsForPermissionGroups(resolvePermissionGroupsForWorkspaceRole(role, permissionGroups));
}

export function hasPermission(permissions: readonly Permission[], permission: Permission) {
  return permissions.includes(permission);
}

export function hasAnyPermission(permissions: readonly Permission[], required: readonly Permission[]) {
  return required.length === 0 || required.some((permission) => permissions.includes(permission));
}

export function hasEveryPermission(permissions: readonly Permission[], required: readonly Permission[]) {
  return required.every((permission) => permissions.includes(permission));
}
