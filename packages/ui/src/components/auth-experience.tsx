"use client";

import type { CSSProperties, FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

export type AuthExperienceMode = "login" | "otp" | "forgot" | "terms" | "onboarding";

interface AuthChallenge {
  challengeId: string;
  maskedPhone: string;
  deliveryLabel: string;
  expiresAt: string;
  resendAvailableAt: string;
  attemptsRemaining?: number;
}

interface AuthSession {
  redirectPath: string;
  requiresTermsAcceptance: boolean;
}

interface ApiResponse<T> {
  ok: boolean;
  status: number;
  body: T;
}

interface LoginResponse {
  status: "authenticated" | "otp_pending" | "locked";
  challenge?: AuthChallenge;
  session?: AuthSession;
  message?: string;
}

interface VerifyOtpResponse {
  status: "authenticated" | "otp_invalid" | "locked";
  session?: AuthSession;
  message?: string;
}

interface TermsAcceptResponse {
  session?: AuthSession;
  message?: string;
}

interface OnboardingInvite {
  name: string;
  role: string;
  email: string;
}

interface OnboardingResponse {
  session?: AuthSession;
  message?: string;
}

export interface AuthExperienceStat {
  label: string;
  value: string;
  detail: string;
}

export interface AuthExperienceProps {
  mode: AuthExperienceMode;
  portalLabel: string;
  portalName: string;
  heroTitle: string;
  heroAccentText?: string;
  heroDescription: string;
  heroPoints: string[];
  stats: AuthExperienceStat[];
  loginIntent: "smb_customer" | "bank_staff";
  challengeStorageKey: string;
  termsVersion: string;
  accentStart: string;
  accentEnd: string;
  accentGlow: string;
  actorName?: string;
  onCreateWorkspace?: () => void;
  onSelectLoginIntent?: (intent: "smb_customer" | "bank_staff") => void;
  navigate: (path: string) => void;
  replace: (path: string) => void;
  mapRedirectPath: (path?: string | null) => string;
}

function getLoginIntentCopy(loginIntent: "smb_customer" | "bank_staff") {
  if (loginIntent === "bank_staff") {
    return {
      identifierLabel: "Work email or phone",
      identifierPlaceholder: "name@company.com",
      passwordPlaceholder: "Enter your password",
      bottomPrompt: "Need access restored?",
      bottomAction: "Request reset",
      forgotLead: "Enter your work email or phone. We'll send you a reset link.",
      forgotLabel: "Work email or phone",
      forgotPlaceholder: "name@company.com"
    };
  }

  return {
    identifierLabel: "Email or phone",
    identifierPlaceholder: "name@company.com",
    passwordPlaceholder: "Enter your password",
    bottomPrompt: `New to SQB Business OS?`,
    bottomAction: "Create workspace",
    forgotLead: "Enter your email or phone. We'll send you a reset link.",
    forgotLabel: "Email or phone",
    forgotPlaceholder: "name@company.com"
  };
}

const AUTH_CARD_COPY: Record<AuthExperienceMode, { eyebrow: string; title: string; description: string }> = {
  login: {
    eyebrow: "Sign in",
    title: "Continue with password and OTP",
    description: "Use your assigned portal credentials. We will confirm access with a one-time code."
  },
  otp: {
    eyebrow: "Verification",
    title: "Enter the one-time code",
    description: "The code is bound to this login attempt and expires automatically."
  },
  forgot: {
    eyebrow: "Password recovery",
    title: "Request a reset link",
    description: "We will queue a reset notification for the account identifier you enter."
  },
  terms: {
    eyebrow: "Required consent",
    title: "Accept the current platform documents",
    description: "Access stays blocked until both acknowledgements are recorded on your active session."
  },
  onboarding: {
    eyebrow: "Workspace setup",
    title: "Create your company workspace",
    description: "Provision your tenant, team, and starter access in one guided flow."
  }
};

const ONBOARDING_STEPS = ["Company", "Business type", "Team", "Plan"] as const;
const BUSINESS_OPTIONS = [
  { key: "Wholesale", detail: "Distribute goods to retailers" },
  { key: "Retail", detail: "Sell direct to consumers" },
  { key: "Manufacturing", detail: "Produce and assemble goods" },
  { key: "Food production", detail: "Bakery, dairy, packaged food" },
  { key: "Services", detail: "Professional or field services" },
  { key: "Textiles", detail: "Garment and fabric production" },
  { key: "Other", detail: "Enter a business type not listed above" }
] as const;

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function postJson<T>(path: string, payload: unknown): Promise<ApiResponse<T>> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });

  let body: unknown = {};
  try {
    body = await response.json();
  } catch {
    body = {};
  }

  return { ok: response.ok, status: response.status, body: body as T };
}

function readStoredChallenge(storageKey: string) {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.sessionStorage.getItem(storageKey);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthChallenge;
  } catch {
    window.sessionStorage.removeItem(storageKey);
    return null;
  }
}

function persistChallenge(storageKey: string, challenge: AuthChallenge | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (!challenge) {
    window.sessionStorage.removeItem(storageKey);
    return;
  }

  window.sessionStorage.setItem(storageKey, JSON.stringify(challenge));
}

function secondsUntil(dateString?: string) {
  if (!dateString) {
    return 0;
  }

  const value = Math.ceil((new Date(dateString).getTime() - Date.now()) / 1000);
  return value > 0 ? value : 0;
}

function formatCountdown(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

function MailIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="auth-input-icon">
      <path
        d="M2.5 4.25h11a.75.75 0 0 1 .75.75v6a.75.75 0 0 1-.75.75h-11a.75.75 0 0 1-.75-.75V5a.75.75 0 0 1 .75-.75Zm0 1.2V11h11V5.45L8.38 8.9a.75.75 0 0 1-.76 0L2.5 5.45Zm.73-.95L8 7.65l4.77-3.15H3.23Z"
        fill="currentColor"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="auth-input-icon">
      <path
        d="M5.25 6V4.75a2.75 2.75 0 1 1 5.5 0V6h.75A1.5 1.5 0 0 1 13 7.5v4A1.5 1.5 0 0 1 11.5 13h-7A1.5 1.5 0 0 1 3 11.5v-4A1.5 1.5 0 0 1 4.5 6h.75Zm1.5 0h2.5V4.75a1.25 1.25 0 1 0-2.5 0V6Zm-2.25 1.5v4h7v-4h-7Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="auth-input-icon">
      <path d="M2.5 8h9.4m0 0L8.6 4.7m3.3 3.3-3.3 3.3" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="auth-input-icon">
      <path
        d="M4.4 2.6h2.5l1.2 3-1.5 1A8.6 8.6 0 0 0 9.4 9.4l1-1.5 3 1.2v2.5a1.3 1.3 0 0 1-1.3 1.3A10.5 10.5 0 0 1 3.1 3.9 1.3 1.3 0 0 1 4.4 2.6Z"
        fill="currentColor"
      />
    </svg>
  );
}

function AuthHeader() {
  return (
    <div className="row" style={{ gap: 10, marginBottom: 24 }}>
      <div className="logo-mark" style={{ width: 28, height: 28, fontSize: 13 }}>S</div>
      <div>
        <div className="logo-word" style={{ fontSize: 15 }}>
          SQB <span className="dim">Business OS</span>
        </div>
        <div className="mono" style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.08em" }}>
          YOUR BUSINESS. YOUR BANK. ONE PLATFORM.
        </div>
      </div>
    </div>
  );
}

export function AuthExperience({
  mode,
  portalLabel,
  portalName,
  heroTitle,
  heroAccentText,
  heroDescription,
  heroPoints,
  stats,
  loginIntent,
  challengeStorageKey,
  termsVersion,
  accentStart,
  accentEnd,
  accentGlow,
  actorName,
  onCreateWorkspace,
  onSelectLoginIntent,
  navigate,
  replace,
  mapRedirectPath
}: AuthExperienceProps) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [termsChecked, setTermsChecked] = useState(false);
  const [privacyChecked, setPrivacyChecked] = useState(false);
  const [challenge, setChallenge] = useState<AuthChallenge | null>(null);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [companyName, setCompanyName] = useState("Kamolot Savdo LLC");
  const [tin, setTin] = useState("301 452 776");
  const [region, setRegion] = useState("Tashkent");
  const [address, setAddress] = useState("Mirobod district, Tashkent 100170");
  const [businessType, setBusinessType] = useState("Wholesale");
  const [customBusinessType, setCustomBusinessType] = useState("");
  const [invites, setInvites] = useState<OnboardingInvite[]>([
    { name: "Malika Karimova", role: "Company admin", email: "malika@kamolot.uz" },
    { name: "Bekzod Yusupov", role: "Operator", email: "bekzod@kamolot.uz" }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (mode === "otp") {
      setChallenge(readStoredChallenge(challengeStorageKey));
    }
  }, [challengeStorageKey, mode]);

  useEffect(() => {
    if (mode !== "otp" || !challenge) {
      return;
    }

    const timer = window.setInterval(() => setTick((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [challenge, mode]);

  const copy = AUTH_CARD_COPY[mode];
  const loginCopy = getLoginIntentCopy(loginIntent);
  const expiresIn = useMemo(() => secondsUntil(challenge?.expiresAt), [challenge, tick]);
  const resendIn = useMemo(() => secondsUntil(challenge?.resendAvailableAt), [challenge, tick]);
  const themeStyle = {
    minHeight: "100vh",
    background: "var(--bg)",
    ["--accent-start" as string]: accentStart,
    ["--accent-end" as string]: accentEnd,
    ["--accent-glow" as string]: accentGlow
  } satisfies CSSProperties;

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      const result = await postJson<LoginResponse>("/api/auth/login/password", {
        loginIntent,
        identifier,
        password
      });

      if (result.ok && result.body.session) {
        persistChallenge(challengeStorageKey, null);
        const destination = result.body.session.requiresTermsAcceptance
          ? "/terms"
          : mapRedirectPath(result.body.session.redirectPath);
        replace(destination);
        return;
      }

      if (result.body.challenge) {
        persistChallenge(challengeStorageKey, result.body.challenge);
        replace("/otp");
        return;
      }

      setError(result.body.message ?? "Unable to start the verification challenge.");
    } catch {
      setError("Authentication request failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleOtpVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!challenge) {
      setError("Your verification challenge was not found. Start again from login.");
      return;
    }

    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      const result = await postJson<VerifyOtpResponse>("/api/auth/otp/verify", {
        challengeId: challenge.challengeId,
        code: otpDigits.join("")
      });

      if (result.ok && result.body.session) {
        persistChallenge(challengeStorageKey, null);
        const destination = result.body.session.requiresTermsAcceptance
          ? "/terms"
          : mapRedirectPath(result.body.session.redirectPath);
        replace(destination);
        return;
      }

      setError(result.body.message ?? "The code could not be verified.");
    } catch {
      setError("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!challenge || resendIn > 0) {
      return;
    }

    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      const result = await postJson<LoginResponse>("/api/auth/otp/request", {
        challengeId: challenge.challengeId
      });

      if (result.body.challenge) {
        persistChallenge(challengeStorageKey, result.body.challenge);
        setChallenge(result.body.challenge);
        setInfo("A fresh verification code was issued.");
        return;
      }

      setError(result.body.message ?? "Unable to resend the verification code.");
    } catch {
      setError("Could not resend the verification code.");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgot(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      const result = await postJson<{ message?: string }>("/api/auth/password/reset/request", { identifier });
      if (result.ok) {
        setInfo(result.body.message ?? "If the account exists, reset instructions have been queued.");
        return;
      }

      setError(result.body.message ?? "Unable to queue the reset request.");
    } catch {
      setError("Password reset request failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleTerms(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!termsChecked || !privacyChecked) {
      setError("Both acknowledgements are required before access can continue.");
      return;
    }

    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      const termsResult = await postJson<TermsAcceptResponse>("/api/auth/terms/accept", {
        documentType: "terms_of_service",
        acceptedVersion: termsVersion
      });
      const privacyResult = await postJson<TermsAcceptResponse>("/api/auth/terms/accept", {
        documentType: "privacy_notice",
        acceptedVersion: termsVersion
      });

      const nextSession = privacyResult.body.session ?? termsResult.body.session;
      if (!termsResult.ok || !privacyResult.ok || !nextSession) {
        setError(privacyResult.body.message ?? termsResult.body.message ?? "Unable to record consent.");
        return;
      }

      replace(mapRedirectPath(nextSession.redirectPath));
    } catch {
      setError("Consent submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function updateOtpDigit(index: number, rawValue: string) {
    const nextDigit = rawValue.replace(/\D/g, "").slice(-1);
    const next = otpCode.padEnd(6, " ").slice(0, 6).split("");
    next[index] = nextDigit || "";
    setOtpCode(next.join(""));

    if (nextDigit && otpRefs.current[index + 1]) {
      otpRefs.current[index + 1]?.focus();
    }
  }

  function clearOtpAndReturn() {
    persistChallenge(challengeStorageKey, null);
    setOtpCode("");
    replace("/login");
  }

  const otpDigits = otpCode.padEnd(6, " ").slice(0, 6).split("").map((value) => value.trim());
  const normalizedInvites = invites
    .map((invite) => ({
      name: invite.name.trim(),
      role: invite.role.trim(),
      email: invite.email.trim().toLowerCase()
    }))
    .filter((invite) => invite.name || invite.role || invite.email);
  const heroHeading = (
    <>
      {heroTitle} {heroAccentText ? <span>{heroAccentText}</span> : null}
    </>
  );

  function validateOnboardingStep(step = onboardingStep) {
    if (step === 0) {
      if (!companyName.trim() || !tin.trim() || !region.trim() || !address.trim()) {
        return "Please complete company name, TIN, region, and address.";
      }
    }

    if (step === 1 && businessType === "Other" && !customBusinessType.trim()) {
      return "Please enter your business type.";
    }

    if (step === 2) {
      const incompleteInvite = normalizedInvites.find((invite) => !invite.name || !invite.role || !invite.email);
      if (incompleteInvite) {
        return "Each team row must include name, role, and email, or be removed.";
      }

      const invalidInvite = normalizedInvites.find((invite) => !isValidEmail(invite.email));
      if (invalidInvite) {
        return `Invite email is invalid: ${invalidInvite.email}`;
      }

      const seen = new Set<string>();
      for (const invite of normalizedInvites) {
        if (seen.has(invite.email)) {
          return `Duplicate invite email detected: ${invite.email}`;
        }
        seen.add(invite.email);
      }
    }

    return "";
  }

  function continueOnboarding() {
    const nextError = validateOnboardingStep();
    if (nextError) {
      setError(nextError);
      return;
    }

    setError(null);
    setOnboardingStep((step) => step + 1);
  }

  async function handleCreateWorkspace() {
    const nextError = validateOnboardingStep();
    if (nextError) {
      setError(nextError);
      return;
    }

    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      const result = await postJson<OnboardingResponse>("/api/tenants/onboarding", {
        companyName,
        tin,
        region,
        address,
        businessType: businessType === "Other" ? customBusinessType.trim() || "Other" : businessType,
        invites: normalizedInvites,
        plan: "business_os_free"
      });

      if (result.ok && result.body.session) {
        const destination = result.body.session.requiresTermsAcceptance
          ? "/terms"
          : mapRedirectPath(result.body.session.redirectPath);
        replace(destination);
        return;
      }

      setError(result.body.message ?? "Unable to create workspace.");
    } catch {
      setError("Workspace creation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function renderForm() {
    if (mode === "login") {
      return (
        <form onSubmit={handleLogin}>
          <div className="col gap-12">
            <div className="field">
              <label>{loginCopy.identifierLabel}</label>
              <div className="input-wrap">
                <span className="prefix">
                  <MailIcon />
                </span>
                <input
                  className="input with-prefix"
                  autoComplete="username"
                  placeholder={loginCopy.identifierPlaceholder}
                  required
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                />
              </div>
            </div>
            <div className="field">
              <label>Password</label>
              <div className="input-wrap">
                <span className="prefix">
                  <LockIcon />
                </span>
                <input
                  className="input with-prefix with-suffix"
                  type="password"
                  autoComplete="current-password"
                  placeholder={loginCopy.passwordPlaceholder}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <button className="auth-inline-link suffix" onClick={() => navigate("/forgot")} type="button">
                  Forgot?
                </button>
              </div>
            </div>
            <button className="btn primary block" disabled={loading} type="submit">
              {loading ? "Starting verification..." : "Continue"} <ArrowIcon />
            </button>
            <div className="row" style={{ justifyContent: "center", gap: 6, color: "var(--muted)", fontSize: 12 }}>
              {loginCopy.bottomPrompt}
              {loginIntent === "bank_staff" ? (
                <button className="auth-inline-link" onClick={() => navigate("/forgot")} type="button">
                  {loginCopy.bottomAction}
                </button>
              ) : (
                <button
                  className="auth-inline-link"
                  onClick={() => {
                    if (onCreateWorkspace) {
                      onCreateWorkspace();
                      return;
                    }

                    navigate("/onboarding");
                  }}
                  type="button"
                >
                  {loginCopy.bottomAction}
                </button>
              )}
            </div>
          </div>
        </form>
      );
    }

    if (mode === "otp") {
      return (
        <form onSubmit={handleOtpVerify}>
          <div className="row" style={{ gap: 10, marginBottom: 14 }}>
            <div className="avatar warm" style={{ background: "var(--ai-bg)", color: "var(--ai)" }}>
              <PhoneIcon />
            </div>
            <div>
              <div style={{ fontWeight: 500, color: "var(--ink)" }}>Verify your phone</div>
              <div className="muted" style={{ fontSize: 12 }}>
                We sent a 6-digit code to {challenge?.maskedPhone ?? "Unavailable"}
              </div>
            </div>
          </div>

          <div className="row" style={{ gap: 8, justifyContent: "space-between", marginTop: 16 }}>
            {otpDigits.map((digit, index) => (
              <input
                key={index}
                ref={(element) => {
                  otpRefs.current[index] = element;
                }}
                className="input mono"
                style={{ width: 46, height: 52, fontSize: 22, textAlign: "center", fontWeight: 500 }}
                value={digit}
                inputMode="numeric"
                autoComplete={index === 0 ? "one-time-code" : "off"}
                maxLength={1}
                onChange={(event) => updateOtpDigit(index, event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Backspace" && !digit && otpRefs.current[index - 1]) {
                    otpRefs.current[index - 1]?.focus();
                  }
                }}
              />
            ))}
          </div>

          <div className="row mt-16" style={{ justifyContent: "space-between", fontSize: 12 }}>
            <span className="muted">
              Didn&apos;t get it?{" "}
              <button
                className="auth-inline-link"
                disabled={loading || !challenge || resendIn > 0}
                onClick={handleResend}
                type="button"
              >
                {resendIn > 0 ? `Resend in ${formatCountdown(resendIn)}` : "Resend code"}
              </button>
            </span>
            <button className="auth-back-link" onClick={clearOtpAndReturn} type="button">
              Back
            </button>
          </div>

          <div className="auth-message" style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
            <span>Expires in: <strong>{challenge ? formatCountdown(expiresIn) : "0:00"}</strong></span>
            <span>Attempts left: <strong>{challenge?.attemptsRemaining ?? "-"}</strong></span>
          </div>

          <button className="btn primary block mt-16" disabled={loading || !challenge || otpDigits.some((digit) => !digit)} type="submit">
            {loading ? "Verifying..." : "Verify and sign in"} <ArrowIcon />
          </button>
        </form>
      );
    }

    if (mode === "forgot") {
      return (
        <form onSubmit={handleForgot}>
          {info ? (
            <>
              <div className="banner good">
                <div>
                  <div className="title">Check your email</div>
                  <div className="desc">{info}</div>
                </div>
              </div>
              <button className="btn primary block mt-16" onClick={() => replace("/login")} type="button">
                Back to sign in
              </button>
            </>
          ) : (
            <>
              <h2 style={{ margin: "0 0 4px", fontSize: 16 }}>Reset password</h2>
              <p className="muted" style={{ fontSize: 12, marginTop: 0 }}>
                {loginCopy.forgotLead}
              </p>
              <div className="field mt-16">
                <label>{loginCopy.forgotLabel}</label>
                <input
                  className="input"
                  autoComplete="email"
                  placeholder={loginCopy.forgotPlaceholder}
                  required
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                />
              </div>
              <div className="row mt-16" style={{ gap: 8 }}>
                <button className="btn ghost" onClick={() => replace("/login")} type="button">
                  Cancel
                </button>
                <span className="sp" />
                <button className="btn primary" disabled={loading} type="submit">
                  {loading ? "Sending..." : "Send reset link"}
                </button>
              </div>
            </>
          )}
        </form>
      );
    }

    if (mode === "onboarding") {
      return (
        <>
          <div className="card">
            <div className="card-head">
              <div className="eyebrow">Workspace setup - Step {onboardingStep + 1} of 4</div>
              <span className="sp" />
              <div className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>~ 3 min</div>
            </div>
            <div style={{ padding: "0 14px" }}>
              <div className="row" style={{ gap: 4, padding: "10px 0" }}>
                {ONBOARDING_STEPS.map((stepLabel, index) => (
                  <div
                    key={stepLabel}
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 11,
                      color: index <= onboardingStep ? "var(--ink)" : "var(--muted)"
                    }}
                  >
                    <span
                      className="mono"
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        display: "grid",
                        placeItems: "center",
                        background: index < onboardingStep ? "var(--ink)" : index === onboardingStep ? "var(--ai-bg)" : "var(--bg)",
                        color: index < onboardingStep ? "var(--surface)" : index === onboardingStep ? "var(--ai)" : "var(--muted)",
                        border: `1px solid ${index === onboardingStep ? "var(--ai-line)" : "var(--line)"}`,
                        fontSize: 10
                      }}
                    >
                      {index < onboardingStep ? "✓" : index + 1}
                    </span>
                    <span>{stepLabel}</span>
                    {index < ONBOARDING_STEPS.length - 1 ? <span style={{ flex: 1, height: 1, background: "var(--line)" }} /> : null}
                  </div>
                ))}
              </div>
            </div>
            <div className="card-body">
              {onboardingStep === 0 ? (
                <div className="col gap-12">
                  <div className="field">
                    <label>Company name</label>
                    <input className="input" value={companyName} onChange={(event) => setCompanyName(event.target.value)} />
                  </div>
                  <div className="grid grid-2">
                    <div className="field">
                      <label>TIN / Tax ID</label>
                      <input className="input mono" value={tin} onChange={(event) => setTin(event.target.value)} />
                    </div>
                    <div className="field">
                      <label>Region</label>
                      <select className="select" value={region} onChange={(event) => setRegion(event.target.value)}>
                        <option>Tashkent</option>
                        <option>Samarkand</option>
                        <option>Bukhara</option>
                      </select>
                    </div>
                  </div>
                  <div className="field">
                    <label>Address</label>
                    <input className="input" value={address} onChange={(event) => setAddress(event.target.value)} />
                  </div>
                </div>
              ) : null}

              {onboardingStep === 1 ? (
                <div>
                  <div className="label mb-8">Primary business type - pick one</div>
                  <div className="grid grid-3" style={{ gap: 8 }}>
                    {BUSINESS_OPTIONS.map((option) => (
                      <div
                        key={option.key}
                        className="hairline"
                        onClick={() => setBusinessType(option.key)}
                        style={{
                          padding: 12,
                          borderRadius: 6,
                          cursor: "pointer",
                          background: businessType === option.key ? "var(--ai-bg)" : "var(--surface)",
                          borderColor: businessType === option.key ? "var(--ai-line)" : "var(--line)"
                        }}
                      >
                        <div style={{ fontWeight: 500, color: "var(--ink)" }}>{option.key}</div>
                        <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>{option.detail}</div>
                      </div>
                    ))}
                  </div>
                  {businessType === "Other" ? (
                    <div className="field mt-16">
                      <label>Enter business type</label>
                      <input
                        className="input"
                        value={customBusinessType}
                        onChange={(event) => setCustomBusinessType(event.target.value)}
                        placeholder="e.g. Logistics, Agriculture, Construction"
                      />
                    </div>
                  ) : null}
                </div>
              ) : null}

              {onboardingStep === 2 ? (
                <div className="col gap-12">
                  <div className="label">Invite your team (optional)</div>
                  {invites.map((invite, index) => (
                    <div key={`${invite.email}-${index}`} className="row hairline" style={{ padding: 10, borderRadius: 6 }}>
                      <div className="avatar sm green">{invite.name.split(" ").filter(Boolean).map((part) => part[0]).join("").slice(0, 2) || "NA"}</div>
                      <div style={{ flex: 1, display: "grid", gap: 8 }}>
                        <input
                          className="input"
                          value={invite.name}
                          onChange={(event) => {
                            setInvites((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item));
                          }}
                          placeholder="Full name"
                        />
                        <div className="grid grid-2">
                          <input
                            className="input mono"
                            value={invite.email}
                            onChange={(event) => {
                              setInvites((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, email: event.target.value } : item));
                            }}
                            placeholder="Email"
                          />
                          <select
                            className="select"
                            value={invite.role}
                            onChange={(event) => {
                              setInvites((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, role: event.target.value } : item));
                            }}
                          >
                            <option>Company admin</option>
                            <option>Operator</option>
                            <option>Accountant</option>
                            <option>Warehouse manager</option>
                          </select>
                        </div>
                      </div>
                      <button className="icon-btn" onClick={() => setInvites((current) => current.filter((_, itemIndex) => itemIndex !== index))} type="button">
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    className="btn ghost sm"
                    onClick={() => setInvites((current) => [...current, { name: "", role: "Operator", email: "" }])}
                    type="button"
                  >
                    Add another
                  </button>
                </div>
              ) : null}

              {onboardingStep === 3 ? (
                <div>
                  <div className="ai-card" style={{ padding: 14, marginBottom: 12 }}>
                    <span className="ai-tag">AI</span>
                    <div style={{ fontWeight: 500, color: "var(--ink)" }}>Recommended for you: Business OS Free</div>
                    <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                      As a verified SQB Bank customer (TIN {tin || "301 452 776"}), you get the full platform at no cost.
                    </p>
                  </div>
                  <div className="grid grid-2" style={{ gap: 8 }}>
                    <div className="hairline" style={{ padding: 14, borderRadius: 6, borderColor: "var(--ink)", background: "var(--surface)", boxShadow: "0 0 0 1px var(--ink)" }}>
                      <div className="row">
                        <div style={{ fontWeight: 500, color: "var(--ink)" }}>Business OS - Free</div>
                        <span className="sp" />
                        <span className="pill good">Selected</span>
                      </div>
                      <div className="num-md mt-4">
                        0 <span className="mono muted" style={{ fontSize: 11 }}>UZS / month</span>
                      </div>
                      <ul className="muted" style={{ paddingLeft: 16, fontSize: 12, lineHeight: 1.7 }}>
                        <li>Unlimited inventory and invoices</li>
                        <li>AI Copilot, OCR, and cash-flow analytics</li>
                        <li>24-hour loan decisions</li>
                        <li>Free for all SQB Bank SMB customers</li>
                      </ul>
                    </div>
                    <div className="hairline" style={{ padding: 14, borderRadius: 6, opacity: 0.7 }}>
                      <div style={{ fontWeight: 500, color: "var(--ink)" }}>Premium (coming soon)</div>
                      <div className="num-md mt-4 muted">-</div>
                      <ul className="muted" style={{ paddingLeft: 16, fontSize: 12, lineHeight: 1.7 }}>
                        <li>Multi-entity consolidation</li>
                        <li>Advanced API access</li>
                        <li>Dedicated success manager</li>
                      </ul>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {error ? <div className="muted" style={{ fontSize: 12, color: "var(--bad)", padding: "0 14px 12px" }}>{error}</div> : null}

            <div className="modal-foot">
              <button className="btn ghost" onClick={() => onboardingStep === 0 ? replace("/login") : setOnboardingStep((step) => step - 1)} type="button">
                Back
              </button>
              <span className="sp" />
              {onboardingStep < 3 ? (
                <button className="btn primary" onClick={continueOnboarding} type="button">
                  Continue
                </button>
              ) : (
                <button className="btn primary" onClick={handleCreateWorkspace} disabled={loading} type="button">
                  {loading ? "Creating..." : "Enter workspace"}
                </button>
              )}
            </div>
          </div>
        </>
      );
    }

    return (
      <form onSubmit={handleTerms} style={{ display: "grid", gap: "16px" }}>
        <div style={{ padding: "14px", borderRadius: "var(--r-2)", background: "var(--surface-2)", border: "1px solid var(--line)" }}>
          <h3 style={{ margin: "0 0 4px", fontSize: "14px", color: "var(--ink)" }}>Terms of service</h3>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: "13px" }}>Covers platform access, acceptable use, tenant responsibilities, and audit requirements. Version {termsVersion}.</p>
          <label style={{ display: "flex", gap: "8px", alignItems: "flex-start", marginTop: "12px", color: "var(--fg)", cursor: "pointer" }}>
            <input type="checkbox" checked={termsChecked} onChange={(event) => setTermsChecked(event.target.checked)} style={{ marginTop: "2px" }} />
            <span style={{ fontSize: "13px" }}>I have reviewed and accept the current terms of service.</span>
          </label>
        </div>
        <div style={{ padding: "14px", borderRadius: "var(--r-2)", background: "var(--surface-2)", border: "1px solid var(--line)" }}>
          <h3 style={{ margin: "0 0 4px", fontSize: "14px", color: "var(--ink)" }}>Privacy notice</h3>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: "13px" }}>Explains how SQB processes identity, OTP, audit, and workspace data. Version {termsVersion}.</p>
          <label style={{ display: "flex", gap: "8px", alignItems: "flex-start", marginTop: "12px", color: "var(--fg)", cursor: "pointer" }}>
            <input type="checkbox" checked={privacyChecked} onChange={(event) => setPrivacyChecked(event.target.checked)} style={{ marginTop: "2px" }} />
            <span style={{ fontSize: "13px" }}>I have reviewed and accept the current privacy notice.</span>
          </label>
        </div>
        <div className="auth-message">
          Signing as: <strong style={{ color: "var(--ink)" }}>{actorName ?? portalName}</strong>
        </div>
        <button className="btn primary" disabled={loading} type="submit" style={{ width: "100%", marginTop: "8px" }}>
          {loading ? "Recording consent..." : "Accept and continue"}
        </button>
      </form>
    );
  }

  return (
    <div style={themeStyle}>
      <style dangerouslySetInnerHTML={{ __html: `@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');

:root {
  --bg: #f6f5f1;
  --surface: #ffffff;
  --surface-2: #fbfaf6;
  --ink: #0e2a47;
  --ink-2: #1a2b42;
  --fg: #0b1220;
  --fg-2: #36404f;
  --muted: #6a7382;
  --muted-2: #8a909b;
  --line: #e4e2dd;
  --line-2: #edebe5;
  --hover: #f0ede6;
  --grid: #f1eee8;
  --good: #1f7a4d;
  --good-bg: #e8f2ec;
  --warn: #a66a10;
  --warn-bg: #fbf1dc;
  --bad: #b0351d;
  --bad-bg: #f7e4de;
  --info: #27557a;
  --info-bg: #e5eef5;
  --ai: #d18a2b;
  --ai-bg: #fbf3e3;
  --ai-line: #ecd8a8;
  --r-1: 4px;
  --r-2: 6px;
  --r-3: 8px;
  --shadow-1: 0 1px 0 rgba(14, 42, 71, 0.04), 0 1px 2px rgba(14, 42, 71, 0.04);
  --shadow-2: 0 1px 0 rgba(14, 42, 71, 0.05), 0 6px 16px rgba(14, 42, 71, 0.06);
  --shadow-3: 0 2px 0 rgba(14, 42, 71, 0.04), 0 18px 40px rgba(14, 42, 71, 0.12);
  --sans: 'IBM Plex Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --mono: 'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  --nav-w: 232px;
  --topbar-h: 48px;
}

* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  min-height: 100%;
  background: var(--bg);
}

body {
  font-family: var(--sans);
  font-size: 13px;
  line-height: 1.45;
  color: var(--fg);
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

button,
input,
select,
textarea {
  font: inherit;
}

button {
  cursor: pointer;
}

a {
  color: inherit;
  text-decoration: none;
}

h1,
h2,
h3,
h4,
p {
  margin: 0;
}

.mono {
  font-family: var(--mono);
  font-variant-numeric: tabular-nums;
}

.eyebrow,
.section-label {
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--muted);
}

.row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.col {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sp {
  flex: 1;
}

.gap-12 {
  gap: 12px;
}

.mt-16 {
  margin-top: 16px;
}

.mt-4 {
  margin-top: 4px;
}

.mb-8 {
  margin-bottom: 8px;
}

.muted {
  color: var(--muted);
}

.dim {
  color: var(--muted-2);
}

.num-md {
  font-size: 16px;
  font-weight: 500;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}

.logo-mark {
  width: 22px;
  height: 22px;
  border-radius: 4px;
  background: var(--ink);
  color: var(--surface);
  display: grid;
  place-items: center;
  font-family: var(--mono);
  font-weight: 600;
  font-size: 11px;
  letter-spacing: 0.02em;
}

.logo-word {
  font-weight: 600;
  letter-spacing: 0.02em;
  font-size: 13px;
  color: var(--ink);
}

.logo-word .dim {
  color: var(--muted);
  font-weight: 500;
}

.surface-switch {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2px;
  background: var(--bg);
  border: 1px solid var(--line);
  border-radius: var(--r-2);
  padding: 2px;
}

.surface-switch button {
  padding: 5px 8px;
  font-size: 11px;
  border-radius: 4px;
  color: var(--muted);
  font-family: var(--mono);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  border: 0;
  background: transparent;
}

.surface-switch button.active {
  background: var(--surface);
  color: var(--ink);
  box-shadow: var(--shadow-1);
}

.auth-bg {
  min-height: 100vh;
  background: var(--bg);
  display: grid;
  place-items: center;
  padding: 40px 20px;
}

.auth-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  width: min(1000px, 92vw);
  align-items: center;
}

.avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--ink);
  color: var(--surface);
  display: grid;
  place-items: center;
  font-size: 11px;
  font-weight: 600;
  font-family: var(--mono);
  flex: 0 0 28px;
}

.avatar.sm {
  width: 22px;
  height: 22px;
  font-size: 10px;
  flex-basis: 22px;
}

.avatar.green {
  background: #2e5b3e;
}

.hairline {
  border: 1px solid var(--line);
}

.label {
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
}

.icon-btn {
  width: 28px;
  height: 28px;
  border-radius: var(--r-2);
  display: grid;
  place-items: center;
  color: var(--muted);
  border: 0;
  background: transparent;
}

.icon-btn:hover {
  background: var(--hover);
  color: var(--ink);
}

.shell-page {
  display: grid;
  gap: 16px;
}

.page-head {
  display: flex;
  align-items: flex-end;
  gap: 16px;
  padding-bottom: 14px;
  margin-bottom: 2px;
  border-bottom: 1px solid var(--line);
}

.page-head h1 {
  margin-top: 4px;
  font-size: 20px;
  font-weight: 600;
  color: var(--ink);
  letter-spacing: -0.01em;
}

.page-head .sub {
  margin-top: 4px;
  color: var(--muted);
  font-size: 12.5px;
}

.page-head-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid var(--line);
  border-radius: var(--r-2);
  padding: 6px 11px;
  background: var(--surface);
  color: var(--ink);
  white-space: nowrap;
  transition:
    background 80ms ease,
    color 80ms ease,
    border-color 80ms ease;
}

.btn:hover {
  background: var(--hover);
}

.btn.primary {
  border-color: var(--ink);
  background: var(--ink);
  color: var(--surface);
}

.btn.primary:hover {
  background: var(--ink-2);
}

.btn.block {
  display: flex;
  width: 100%;
  justify-content: center;
}

.btn.ghost {
  border-color: transparent;
  background: transparent;
  color: var(--fg-2);
}

.btn.ai {
  border-color: var(--ai-line);
  background: var(--ai-bg);
  color: var(--ai);
}

.grid {
  display: grid;
  gap: 12px;
}

.grid-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.grid-3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.grid-4 {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.card,
.panel,
.table-card,
.focus-card {
  border: 1px solid var(--line);
  border-radius: var(--r-2);
  background: var(--surface);
  box-shadow: var(--shadow-1);
}

.panel-title,
.table-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--line);
  background: var(--surface-2);
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--muted);
}

.card-body,
.panel-body {
  padding: 14px;
}

.card-head {
  padding: 10px 14px;
  border-bottom: 1px solid var(--line);
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12.5px;
  color: var(--ink);
  font-weight: 500;
}

.focus-card {
  border-left: 2px solid var(--ai);
}

.ai-card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-left: 2px solid var(--ai);
  border-radius: var(--r-2);
  position: relative;
}

.ai-tag {
  position: absolute;
  top: 10px;
  right: 10px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  color: var(--ai);
  background: var(--ai-bg);
  border: 1px solid var(--ai-line);
  padding: 1px 6px;
  border-radius: 10px;
}

.story-grid {
  display: grid;
  grid-template-columns: 1.15fr 1fr 1fr;
  gap: 12px;
}

.story-card {
  border: 1px solid var(--line);
  border-radius: var(--r-2);
  background: linear-gradient(180deg, #ffffff, #f8f6f1);
  padding: 14px;
}

.story-card.emphasis {
  background:
    radial-gradient(circle at top right, rgba(209, 138, 43, 0.16), transparent 42%),
    linear-gradient(180deg, #ffffff, #fbf3e3);
}

.story-card strong {
  display: block;
  margin: 10px 0 6px;
  color: var(--ink);
  font-size: 28px;
  letter-spacing: -0.03em;
}

.action-stack,
.info-list,
.feed-list {
  display: grid;
  gap: 8px;
}

.action-item,
.attention-item,
.feed-item,
.inventory-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  border: 1px solid var(--line);
  border-radius: var(--r-2);
  background: var(--surface);
  padding: 12px;
}

.action-item {
  align-items: center;
}

.action-copy,
.feed-copy,
.inventory-copy {
  display: grid;
  gap: 4px;
}

.action-title,
.feed-title,
.inventory-copy strong {
  color: var(--ink);
  font-weight: 500;
}

.action-note,
.feed-copy p,
.inventory-copy p,
.muted-copy {
  color: var(--muted);
  font-size: 12px;
}

.action-icon,
.feed-icon,
.mini-mark {
  display: inline-grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: var(--bg);
  color: var(--ink);
  font-family: var(--mono);
  font-size: 11px;
}

.action-icon.ai,
.mini-mark.ai {
  background: var(--ai-bg);
  color: var(--ai);
}

.trend-chart {
  padding: 18px;
  border-radius: var(--r-2);
  background:
    linear-gradient(180deg, rgba(233, 238, 243, 0.6), rgba(246, 241, 232, 0.45));
}

.trend-bars {
  display: flex;
  align-items: end;
  gap: 10px;
  height: 180px;
}

.trend-bars span {
  flex: 1;
  border-radius: 12px 12px 4px 4px;
  background: linear-gradient(180deg, rgba(14, 42, 71, 0.85), rgba(209, 138, 43, 0.55));
}

.trend-labels {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-top: 12px;
  color: var(--muted);
  font-size: 12px;
}

.pill,
.status-pill,
.score-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  padding: 2px 8px;
  font-family: var(--mono);
  font-size: 11px;
}

.status-pill {
  border: 1px solid transparent;
}

.status-pill.good,
.score-pill.good {
  background: var(--good-bg);
  color: var(--good);
}

.status-pill.warn,
.score-pill.warn {
  background: var(--warn-bg);
  color: var(--warn);
}

.status-pill.bad,
.score-pill.bad {
  background: var(--bad-bg);
  color: var(--bad);
}

.status-pill.ai {
  border-color: var(--ai-line);
  background: var(--ai-bg);
  color: var(--ai);
}

.score-pill {
  border-radius: var(--r-2);
  padding: 2px 6px 2px 3px;
  border: 1px solid var(--line);
}

.score-pill .num {
  border-radius: 4px;
  padding: 0 4px;
  background: currentColor;
  color: var(--surface);
}

.banner {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  border-radius: var(--r-2);
  padding: 10px 12px;
}

.banner.warn {
  background: var(--warn-bg);
  color: var(--warn);
}

.banner.bad {
  background: var(--bad-bg);
  color: var(--bad);
}

.banner.info {
  background: var(--info-bg);
  color: var(--info);
}

.banner.ai {
  border: 1px solid var(--ai-line);
  background: var(--ai-bg);
  color: var(--fg);
}

.banner.good {
  background: var(--good-bg);
  color: var(--good);
}

.banner .title {
  font-weight: 500;
  color: inherit;
}

.banner .desc {
  margin-top: 2px;
  font-size: 12px;
  color: inherit;
  opacity: 0.9;
}

.metric-note {
  color: var(--muted);
  font-size: 12px;
}

.table-toolbar .spacer,
.panel-title .spacer,
.page-head .spacer {
  flex: 1;
}

.table-chip-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid var(--line);
  border-radius: var(--r-2);
  padding: 4px 8px;
  background: var(--surface);
  color: var(--fg-2);
}

.chip.active {
  border-color: var(--ink);
  background: var(--ink);
  color: var(--surface);
}

.field {
  display: grid;
  gap: 4px;
}

.field label {
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
}

.input,
.select {
  width: 100%;
  border: 1px solid var(--line);
  border-radius: var(--r-2);
  min-height: 36px;
  padding: 8px 10px;
  background: var(--surface);
  color: var(--fg);
  outline: none;
  line-height: 1.25;
}

.input:focus,
.select:focus {
  border-color: var(--ink);
  box-shadow: 0 0 0 3px rgba(14, 42, 71, 0.08);
}

.input::placeholder {
  color: var(--muted-2);
  opacity: 1;
}

.input-wrap {
  position: relative;
}

.input-wrap .prefix,
.input-wrap .suffix {
  position: absolute;
  top: 0;
  height: 100%;
  display: inline-flex;
  align-items: center;
  color: var(--muted);
  font-family: var(--mono);
  font-size: 11px;
}

.input-wrap .prefix {
  left: 12px;
}

.input-wrap .suffix {
  right: 12px;
}

.input.with-prefix {
  padding-left: 38px;
}

.input.mono {
  font-family: var(--mono);
  font-variant-numeric: tabular-nums;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table thead th {
  padding: 10px 12px;
  border-bottom: 1px solid var(--line);
  background: var(--surface-2);
  text-align: left;
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
}

.table tbody td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--line-2);
  color: var(--fg);
}

.table tbody tr:last-child td {
  border-bottom: 0;
}

.table tbody tr:hover td {
  background: var(--hover);
}

.text-right {
  text-align: right;
}

.auth-layout {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 40px 20px;
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at top left, color-mix(in srgb, var(--accent-glow) 14%, transparent) 0, transparent 36%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.45), rgba(246, 245, 241, 0.9));
}

.auth-layout::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(var(--grid) 1px, transparent 1px),
    linear-gradient(90deg, var(--grid) 1px, transparent 1px);
  background-size: 32px 32px;
  opacity: 0.2;
  pointer-events: none;
}

.auth-shell {
  display: grid;
  grid-template-columns: 1.05fr minmax(360px, 420px);
  gap: 60px;
  width: min(1000px, 92vw);
  align-items: center;
  position: relative;
  z-index: 1;
}

.auth-copy {
  display: grid;
  gap: 18px;
}

.auth-brand {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.auth-brand-copy {
  display: grid;
  gap: 4px;
}

.auth-logo-mark {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: grid;
  place-items: center;
  background: var(--ink);
  color: var(--surface);
  font-family: var(--mono);
  font-size: 13px;
  font-weight: 600;
}

.auth-brand-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.auth-portal-pill {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 2px 8px;
  background: rgba(255, 255, 255, 0.7);
  color: var(--fg-2);
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.auth-brand-tagline {
  color: var(--muted);
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.auth-title {
  max-width: 460px;
  color: var(--ink);
  font-size: 32px;
  font-weight: 500;
  line-height: 1.15;
  letter-spacing: -0.02em;
}

.auth-title span {
  color: var(--ai);
}

.auth-summary {
  max-width: 380px;
  color: var(--muted);
  font-size: 13px;
}

.auth-stats {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  padding-top: 10px;
}

.auth-stat strong {
  display: block;
  color: var(--ink);
  font-size: 20px;
}

.auth-stat span {
  color: var(--muted);
  font-size: 12px;
}

.auth-card {
  border: 1px solid var(--line);
  border-radius: var(--r-3);
  background: var(--surface);
  padding: 28px;
  box-shadow: var(--shadow-3);
}

.auth-card-copy {
  display: grid;
  gap: 4px;
  margin: 10px 0 16px;
}

.auth-card-copy h2 {
  margin: 0;
  font-size: 16px;
  color: var(--ink);
}

.auth-card-copy p {
  color: var(--muted);
  font-size: 12px;
}

.auth-switch {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2px;
  margin: 0 0 16px;
  padding: 2px;
  border: 1px solid var(--line);
  border-radius: var(--r-2);
  background: var(--bg);
}

.auth-switch button {
  border: 0;
  border-radius: 4px;
  padding: 6px 8px;
  background: transparent;
  color: var(--muted);
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.auth-switch button.active {
  background: var(--surface);
  color: var(--ink);
  box-shadow: var(--shadow-1);
}

.auth-form {
  display: grid;
  gap: 16px;
}

.auth-message {
  margin-top: 12px;
  color: var(--muted);
  font-size: 12px;
}

.auth-message.strong {
  color: var(--ai);
}

.otp-box {
  display: grid;
  gap: 12px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--line);
}

.auth-input-icon {
  width: 14px;
  height: 14px;
  color: var(--muted);
  display: block;
}

.input-wrap .auth-input-icon {
  color: var(--muted);
}

.input.with-suffix {
  padding-right: 78px;
}

.auth-inline-link {
  border: 0;
  background: transparent;
  color: var(--ink);
  padding: 0;
  font-size: 12px;
}

.auth-inline-link:hover {
  color: var(--ink-2);
}

.auth-inline-link:disabled {
  color: var(--muted);
  cursor: not-allowed;
}

.auth-back-link {
  border: 0;
  background: transparent;
  color: var(--muted);
  padding: 0;
  font-size: 12px;
}

.auth-back-link:hover {
  color: var(--ink);
}

.auth-footer-note {
  text-align: center;
  color: var(--muted);
  font-size: 12px;
}

.modal-foot {
  padding: 12px 16px;
  border-top: 1px solid var(--line);
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.placeholder-grid {
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  gap: 12px;
}

.placeholder-actions {
  display: grid;
  gap: 8px;
}

.placeholder-actions .action-item {
  cursor: default;
}

.empty-state {
  display: grid;
  gap: 10px;
  place-items: center;
  padding: 48px 20px;
  border: 1px dashed var(--line);
  border-radius: var(--r-2);
  background: var(--surface-2);
  text-align: center;
}

.empty-state h3 {
  color: var(--ink);
  font-size: 18px;
}

.empty-state p {
  max-width: 48ch;
  color: var(--muted);
}

@media (max-width: 1200px) {
  .grid-4,
  .story-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .placeholder-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
  .auth-grid,
  .auth-shell,
  .story-grid {
    grid-template-columns: 1fr;
  }

  .auth-copy {
    order: 2;
  }

  .auth-card {
    order: 1;
  }
}

@media (max-width: 780px) {
  .grid-2,
  .grid-3,
  .grid-4 {
    grid-template-columns: 1fr;
  }

  .page-head,
  .page-head-actions,
  .action-item,
  .attention-item,
  .feed-item,
  .inventory-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .page-head-actions {
    width: 100%;
    margin-left: 0;
    justify-content: flex-start;
  }
}
` }} />
      {mode === "login" ? (
        <section className="auth-bg">
          <div className="auth-grid">
            <div>
              <AuthHeader />
              <div className="auth-title" style={{ maxWidth: 420 }}>
                {heroHeading}
              </div>
              <p className="muted" style={{ marginTop: 16, maxWidth: 380, fontSize: 13 }}>
                {heroDescription}
              </p>
              <div className="row" style={{ gap: 24, marginTop: 32, fontSize: 12 }}>
                {stats.map((stat) => (
                  <div key={stat.label}>
                    <div className="num-md">{stat.value}</div>
                    <div className="muted">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="auth-card">
              <div className="eyebrow mb-8">{copy.eyebrow}</div>
              <div className="surface-switch" style={{ margin: 0, marginBottom: 16 }}>
                <button
                  type="button"
                  className={loginIntent === "smb_customer" ? "active" : ""}
                  onClick={() => {
                    if (loginIntent !== "smb_customer") {
                      onSelectLoginIntent?.("smb_customer");
                    }
                  }}
                >
                  SMB customer
                </button>
                <button
                  type="button"
                  className={loginIntent === "bank_staff" ? "active" : ""}
                  onClick={() => {
                    if (loginIntent !== "bank_staff") {
                      onSelectLoginIntent?.("bank_staff");
                    }
                  }}
                >
                  Bank staff
                </button>
              </div>
              {error ? <div className="banner bad" style={{ marginBottom: 16 }}>{error}</div> : null}
              {info ? <div className="banner info" style={{ marginBottom: 16 }}>{info}</div> : null}
              {renderForm()}
            </div>
          </div>
        </section>
      ) : mode === "otp" || mode === "forgot" ? (
        <section className="auth-bg">
          <div className="auth-card">
            <AuthHeader />
            {mode === "otp" && !challenge ? (
              <div className="auth-message" style={{ marginBottom: 16 }}>
                Your verification challenge is missing or expired. Return to login to start a new session.
              </div>
            ) : null}
            {error ? <div className="banner bad" style={{ marginBottom: 16 }}>{error}</div> : null}
            {info && mode !== "forgot" ? <div className="banner info" style={{ marginBottom: 16 }}>{info}</div> : null}
            {renderForm()}
          </div>
        </section>
      ) : mode === "onboarding" ? (
        <section className="auth-bg" style={{ alignItems: "flex-start", paddingTop: 60 }}>
          <div style={{ width: "min(620px, 94vw)" }}>
            <AuthHeader />
            {renderForm()}
          </div>
        </section>
      ) : (
        <section className="auth-layout">
          <div className="auth-shell">
            <div className="auth-copy">
              <div className="auth-brand">
                <div className="auth-logo-mark">S</div>
                <div className="auth-brand-copy">
                  <div className="auth-brand-row">
                    <div className="logo-word" style={{ fontSize: "15px", fontWeight: 600, color: "var(--ink)" }}>
                      SQB <span style={{ color: "var(--muted)", fontWeight: 500 }}>Business OS</span>
                    </div>
                    <span className="auth-portal-pill">{portalLabel}</span>
                  </div>
                  <div className="auth-brand-tagline">Your business. Your bank. One platform.</div>
                </div>
              </div>

              <h1 className="auth-title">{heroHeading}</h1>

              <p className="auth-summary">{heroDescription}</p>

              <div className="auth-stats">
                {stats.map((stat) => (
                  <div className="auth-stat" key={stat.label}>
                    <strong>{stat.value}</strong>
                    <span>{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="auth-card">
              <div className="auth-card-copy">
                <div className="eyebrow">{copy.eyebrow}</div>
                <h2>{copy.title}</h2>
                <p>{copy.description}</p>
              </div>
              {error ? <div className="banner bad" style={{ marginBottom: 16 }}>{error}</div> : null}
              {info ? <div className="banner info" style={{ marginBottom: 16 }}>{info}</div> : null}
              {renderForm()}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
