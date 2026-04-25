import type { AuthSession, CompanyWorkspaceRole, Permission, PermissionGroupKey, Role } from "@sqb/domain-types";

export interface RequestContext {
  requestId: string;
  actorRole: Role;
  workspaceRole?: CompanyWorkspaceRole;
  actorUserId: string;
  permissionGroups?: PermissionGroupKey[];
  permissions: Permission[];
  tenantId?: string;
  isAuthenticated: boolean;
  sessionToken?: string;
  session?: AuthSession;
}
