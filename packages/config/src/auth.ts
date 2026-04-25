import type { Permission, PermissionGroupKey, Role } from "@sqb/domain-types";
import { permissionGroupsForRole, roleAccessPolicies } from "@sqb/domain-types";

export const rolePermissions = Object.fromEntries(
  Object.entries(roleAccessPolicies).map(([role, policy]) => [role, [...policy.permissions]])
) as Record<Role, Permission[]>;

export const rolePermissionGroups = Object.fromEntries(
  Object.keys(roleAccessPolicies).map((role) => [
    role,
    permissionGroupsForRole(role as Role).map((group) => group.key)
  ])
) as Record<Role, PermissionGroupKey[]>;

