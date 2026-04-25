import type {
  AuthenticatedUser,
  AuthSecuritySettingsResponse,
  AuthSession,
  BankPortfolioAnalytics,
  BankTenantHealth,
  CreditApplicationDetail,
  CreditAssignRequest,
  CreditDecisionRequest,
  CreditQueueItem,
  CreateWorkspaceInviteRequest,
  CreateWorkspaceRequest,
  CreateWorkspaceResponse,
  InviteAcceptRequest,
  OtpVerifyRequest,
  OtpVerifyResponse,
  PasswordLoginRequest,
  PasswordLoginResponse,
  PasswordResetConsumeRequest,
  RefreshTokenResponse,
  TermsAcceptRequest,
  TermsAcceptance,
  AuditEvent,
  UpdateWorkspaceMemberAccessRequest,
  UpdateAuthSecuritySettingsRequest
} from "@sqb/domain-types";

const DEFAULT_PLATFORM_API_URL = "http://localhost:4000";

function platformApiUrl() {
  return process.env.PLATFORM_API_URL ?? DEFAULT_PLATFORM_API_URL;
}

async function parseJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

function buildQuery(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      search.set(key, String(value));
    }
  }
  return search.size > 0 ? `?${search.toString()}` : "";
}

export async function platformRequest<T>(
  path: string,
  init: RequestInit = {},
  sessionToken?: string
): Promise<{ ok: boolean; status: number; body: T }> {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json");

  if (sessionToken) {
    headers.set("x-session-token", sessionToken);
  }

  const response = await fetch(`${platformApiUrl()}${path}`, {
    ...init,
    headers,
    cache: "no-store"
  });

  return {
    ok: response.ok,
    status: response.status,
    body: await parseJson<T>(response)
  };
}

export async function loginWithPassword(payload: PasswordLoginRequest) {
  return platformRequest<PasswordLoginResponse>("/auth/login/password", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function resendOtp(challengeId: string) {
  return platformRequest<PasswordLoginResponse>("/auth/otp/request", {
    method: "POST",
    body: JSON.stringify({ challengeId })
  });
}

export async function verifyOtp(payload: OtpVerifyRequest) {
  return platformRequest<OtpVerifyResponse>("/auth/otp/verify", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function getAuthSession(sessionToken: string) {
  return platformRequest<{ session: AuthSession }>("/auth/session", {
    method: "GET"
  }, sessionToken);
}

export async function getPlatformStaffDirectory(sessionToken: string) {
  return platformRequest<{ users: AuthenticatedUser[] }>("/auth/staff", {
    method: "GET"
  }, sessionToken);
}

export async function getAuthSecuritySettings(sessionToken: string) {
  return platformRequest<AuthSecuritySettingsResponse>("/auth/security", {
    method: "GET"
  }, sessionToken);
}

export async function updateAuthSecuritySettings(sessionToken: string, payload: UpdateAuthSecuritySettingsRequest) {
  return platformRequest<AuthSecuritySettingsResponse>("/auth/security", {
    method: "PATCH",
    body: JSON.stringify(payload)
  }, sessionToken);
}

export async function getAuditEvents(
  sessionToken: string,
  query?: {
    category?: string;
    actorRole?: string;
    tenantId?: string;
    q?: string;
    from?: string;
    to?: string;
    page?: number;
    pageSize?: number;
    limit?: number;
  }
) {
  return platformRequest<{ events: AuditEvent[] }>(`/audit/events${buildQuery(query ?? {})}`, {
    method: "GET"
  }, sessionToken);
}

export async function getBankPortfolio(
  sessionToken: string,
  query?: {
    q?: string;
    region?: string;
    inventoryRisk?: "low" | "moderate" | "high";
    trend?: "up" | "flat" | "down";
    sort?: "score_desc" | "score_asc" | "tenant";
  }
) {
  return platformRequest<{ tenants: BankTenantHealth[] }>(`/bank/portfolio${buildQuery(query ?? {})}`, {
    method: "GET"
  }, sessionToken);
}

export async function getBankPortfolioAnalytics(sessionToken: string) {
  return platformRequest<{ analytics: BankPortfolioAnalytics }>("/bank/portfolio/analytics", {
    method: "GET"
  }, sessionToken);
}

export async function getCreditQueue(
  sessionToken: string,
  query?: {
    status?: "submitted" | "in_review" | "approved" | "counter_offered" | "declined";
    recommendation?: "approve" | "review" | "decline";
    priority?: "high" | "normal";
    q?: string;
    sort?: "submitted_desc" | "score_desc" | "tenant";
  }
) {
  return platformRequest<{ applications: CreditQueueItem[] }>(`/bank/credit-queue${buildQuery(query ?? {})}`, {
    method: "GET"
  }, sessionToken);
}

export async function getCreditApplication(sessionToken: string, applicationId: string) {
  return platformRequest<{ application: CreditApplicationDetail }>(`/bank/credit-queue/${applicationId}`, {
    method: "GET"
  }, sessionToken);
}

export async function assignCreditApplication(sessionToken: string, applicationId: string, payload: CreditAssignRequest) {
  return platformRequest<{ application: CreditApplicationDetail }>(`/bank/credit-queue/${applicationId}/assign`, {
    method: "POST",
    body: JSON.stringify(payload)
  }, sessionToken);
}

export async function submitCreditDecision(sessionToken: string, applicationId: string, payload: CreditDecisionRequest) {
  return platformRequest<{ application: CreditApplicationDetail }>(`/bank/credit-queue/${applicationId}/decision`, {
    method: "POST",
    body: JSON.stringify(payload)
  }, sessionToken);
}

export async function getBreakGlassEvents(sessionToken: string) {
  return platformRequest<{ events: AuditEvent[] }>("/audit/break-glass", {
    method: "GET"
  }, sessionToken);
}

export async function logoutSession(sessionToken: string) {
  return platformRequest<{ status: "logged_out" }>("/auth/logout", {
    method: "POST",
    body: JSON.stringify({})
  }, sessionToken);
}

export async function acceptTerms(sessionToken: string, payload: TermsAcceptRequest) {
  return platformRequest<{ acceptance: TermsAcceptance; session: AuthSession }>("/auth/terms/accept", {
    method: "POST",
    body: JSON.stringify(payload)
  }, sessionToken);
}

export async function requestPasswordReset(identifier: string) {
  return platformRequest<{ status: "queued"; message: string }>("/auth/password/reset/request", {
    method: "POST",
    body: JSON.stringify({ identifier })
  });
}

export async function createWorkspace(payload: CreateWorkspaceRequest) {
  return platformRequest<CreateWorkspaceResponse>("/tenants/onboarding", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function getWorkspaceContext(sessionToken: string) {
  return platformRequest<{
    tenant: unknown;
    actor: AuthSession["actor"];
    users: unknown[];
    invites: unknown[];
    accessCatalog: unknown;
  }>("/tenants/me", {
    method: "GET"
  }, sessionToken);
}

export async function createTenantInvite(sessionToken: string, payload: CreateWorkspaceInviteRequest) {
  return platformRequest<{ tenant: unknown; users: unknown[]; invites: unknown[] }>("/tenants/invites", {
    method: "POST",
    body: JSON.stringify(payload)
  }, sessionToken);
}

export async function updateTenantMemberAccess(
  sessionToken: string,
  userId: string,
  payload: UpdateWorkspaceMemberAccessRequest
) {
  return platformRequest<{ tenant: unknown; users: unknown[]; invites: unknown[] }>(`/tenants/members/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  }, sessionToken);
}

export async function revokeTenantInvite(sessionToken: string, inviteId: string) {
  return platformRequest<{ tenant: unknown; users: unknown[]; invites: unknown[] }>(`/tenants/invites/${inviteId}/revoke`, {
    method: "POST",
    body: JSON.stringify({})
  }, sessionToken);
}

export async function consumePasswordReset(payload: PasswordResetConsumeRequest) {
  return platformRequest<{ status: "ok" } | { status: "invalid"; message: string }>("/auth/password/reset/consume", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function refreshAccessToken(refreshToken: string) {
  return platformRequest<RefreshTokenResponse>("/auth/token/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken })
  });
}

export async function getInvite(token: string) {
  return platformRequest<{ tenantId: string; email: string; name: string; role: string; permissionGroups: string[] }>(`/auth/invites/${token}`, {
    method: "GET"
  });
}

export async function acceptInvite(payload: InviteAcceptRequest) {
  return platformRequest<{ status: "ok"; userId: string } | { status: "invalid"; message: string }>(`/auth/invites/${payload.token}/accept`, {
    method: "POST",
    body: JSON.stringify({ name: payload.name, phone: payload.phone, password: payload.password })
  });
}
