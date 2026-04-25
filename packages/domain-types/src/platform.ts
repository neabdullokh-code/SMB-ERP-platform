import type { PermissionGroupKey } from "./access-control";

export type Role =
  | "super_admin"
  | "bank_admin"
  | "company_admin"
  | "employee";

export type CompanyWorkspaceRole =
  | "owner"
  | "company_admin"
  | "manager"
  | "operator";

export type LoginIntent = "smb_customer" | "bank_staff";
export type OtpDeliveryMethod = "sms" | "totp_app";

export type Permission =
  | "tenant.read"
  | "tenant.manage"
  | "finance.read"
  | "finance.manage"
  | "inventory.manage"
  | "production.manage"
  | "service_order.manage"
  | "bank.monitor"
  | "audit.read"
  | "credit.apply"
  | "credit.review"
  | "credit.manage";

export interface TenantContext {
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  isolationMode: "logical";
}

export interface AuthenticatedUser {
  id: string;
  name: string;
  email?: string;
  phone: string;
  role: Role;
  workspaceRole?: CompanyWorkspaceRole;
  permissionGroups?: PermissionGroupKey[];
  permissions: Permission[];
  tenantId?: string;
  lastActiveAt?: string;
}

export interface PrivilegedAccessFlags {
  isPrivileged: boolean;
  requiresDedicatedAccount: boolean;
  isBreakGlass: boolean;
  sessionTtlMinutes: number;
}

export interface SessionActor extends AuthenticatedUser {
  redirectPath: string;
  requiresTermsAcceptance: boolean;
  privilegedAccess: PrivilegedAccessFlags;
}

export interface AuthChallenge {
  challengeId: string;
  loginIntent: LoginIntent;
  maskedPhone: string;
  deliveryMethod: OtpDeliveryMethod;
  deliveryLabel: string;
  resendSupported: boolean;
  expiresAt: string;
  resendAvailableAt: string;
  state: "otp_pending" | "locked";
}

export interface OtpChallenge extends AuthChallenge {
  attemptsRemaining: number;
}

export interface AuthSession {
  sessionToken: string;
  sessionId: string;
  refreshToken?: string;
  role: Role;
  tenantId?: string;
  isPrivileged: boolean;
  requiresTermsAcceptance: boolean;
  redirectPath: string;
  actor: SessionActor;
  expiresAt: string;
}

export type AuthErrorCode =
  | "INVALID_CREDENTIALS"
  | "LOGIN_INTENT_MISMATCH"
  | "OTP_REQUIRED"
  | "OTP_INVALID"
  | "OTP_EXPIRED"
  | "OTP_RESEND_COOLDOWN"
  | "ACCOUNT_LOCKED"
  | "SESSION_INVALID"
  | "FORBIDDEN";

export interface PasswordLoginRequest {
  loginIntent: LoginIntent;
  identifier: string;
  password: string;
}

export interface PasswordLoginResponse {
  status: "authenticated" | "otp_pending" | "locked";
  challenge?: AuthChallenge;
  session?: AuthSession;
  errorCode?: AuthErrorCode;
  message?: string;
}

export interface OtpVerifyRequest {
  challengeId: string;
  code: string;
}

export interface OtpVerifyResponse {
  status: "authenticated" | "otp_invalid" | "locked";
  session?: AuthSession;
  errorCode?: AuthErrorCode;
  message?: string;
}

export interface AuthSecuritySettings {
  role: Role;
  totpRequired: boolean;
  canManageTotp: boolean;
  isBreakGlass: boolean;
  otpMethodType?: OtpDeliveryMethod;
  otpMethodLabel?: string;
}

export interface AuthSecuritySettingsResponse {
  settings: AuthSecuritySettings;
}

export interface UpdateAuthSecuritySettingsRequest {
  totpRequired: boolean;
}

export interface WorkspaceInvite {
  name: string;
  role: CompanyWorkspaceRole;
  email: string;
  permissionGroups?: PermissionGroupKey[];
}

export interface WorkspaceInvitation extends WorkspaceInvite {
  id: string;
  tenantId: string;
  status: "pending" | "accepted" | "revoked";
  invitedAt: string;
}

export interface UpdateWorkspaceMemberAccessRequest {
  role: CompanyWorkspaceRole;
  permissionGroups: PermissionGroupKey[];
}

export interface CreateWorkspaceInviteRequest extends WorkspaceInvite {}

export interface CreateWorkspaceRequest {
  companyName: string;
  tin: string;
  region: string;
  address: string;
  businessType: string;
  invites: WorkspaceInvite[];
  plan: "business_os_free";
}

export interface CreateWorkspaceResponse {
  status: "workspace_created";
  tenantId: string;
  tenantName: string;
  session: AuthSession;
}

export interface TermsAcceptRequest {
  documentType: "terms_of_service" | "privacy_notice";
  acceptedVersion: string;
}

export interface TermsAcceptance {
  userId: string;
  tenantId?: string;
  documentType: "terms_of_service" | "privacy_notice";
  acceptedVersion: string;
  acceptedAt: string;
  ipAddress: string;
  userAgent: string;
}

export interface RefreshTokenResponse {
  sessionToken: string;
  sessionId: string;
  refreshToken?: string;
  expiresAt: string;
}

export interface PasswordResetConsumeRequest {
  token: string;
  newPassword: string;
}

export interface InviteAcceptRequest {
  token: string;
  name: string;
  phone: string;
  password: string;
}

export interface AuditEvent {
  id: string;
  actorUserId: string;
  actorRole: Role;
  tenantId?: string;
  category:
    | "auth"
    | "auth.password"
    | "auth.otp"
    | "auth.session"
    | "auth.lockout"
    | "auth.terms"
    | "auth.privileged_access"
    | "auth.break_glass"
    | "terms"
    | "inventory"
    | "production"
    | "service_orders"
    | "workflow"
    | "bank_monitoring"
    | "credit.application"
    | "credit.decision"
    | "credit.document"
    | "credit.risk"
    | "settings";
  action: string;
  resourceType: string;
  resourceId: string;
  occurredAt: string;
  metadata: Record<string, string | number | boolean | null>;
}
