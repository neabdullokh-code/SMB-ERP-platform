// Auth screens: Login, OTP, Forgot, Onboarding

function AuthHeader() {
  return (
    <div className="row" style={{gap:10, marginBottom: 24}}>
      <div className="logo-mark" style={{width:28, height:28, fontSize:13}}>S</div>
      <div>
        <div className="logo-word" style={{fontSize:15}}>SQB <span className="dim">Business OS</span></div>
        <div className="mono" style={{fontSize:10, color:"var(--muted)", letterSpacing:"0.08em"}}>YOUR BUSINESS. YOUR BANK. ONE PLATFORM.</div>
      </div>
    </div>
  );
}

const AUTH_CHALLENGE_KEY = "__erp_auth_challenge__";
const AUTH_PUBLIC_ROUTES = new Set(["/login", "/otp", "/forgot", "/onboarding", "/terms"]);
const CURRENT_TERMS_VERSION = "2026-04";
const ROUTE_PERMISSIONS = [
  { match: (path) => path.startsWith("/smb/inventory"), permissions: ["inventory.manage"] },
  { match: (path) => path.startsWith("/smb/production"), permissions: ["production.manage"] },
  { match: (path) => path.startsWith("/smb/services"), permissions: ["service_order.manage"] },
  { match: (path) => path.startsWith("/smb/finance"), permissions: ["finance.read"] },
  { match: (path) => path.startsWith("/smb/reports"), permissions: ["finance.read", "audit.read"] },
  { match: (path) => path.startsWith("/smb/team"), permissions: ["tenant.manage"] },
  { match: (path) => path.startsWith("/smb/settings"), permissions: ["tenant.manage"] },
  { match: (path) => path === "/bank/home" || path === "/bank/alerts" || path === "/bank/tenants" || path === "/bank/tenant" || path === "/bank/tenant-mgmt" || path === "/bank/credit-queue" || path === "/bank/cross-sell" || path === "/bank/reports", permissions: ["bank.monitor"] },
  { match: (path) => path === "/bank/audit", permissions: ["audit.read"] },
  { match: (path) => path === "/bank/team" || path === "/bank/settings", permissions: ["tenant.manage"], roles: ["super_admin"] },
];
let cachedSession = null;

function isBankOrigin() {
  const bankHomePath = window.PortalUIRouter?.cleanPathForRoute?.("/bank/home");
  if (bankHomePath === "/app/dashboard") return true;
  if (window.location.port === "3001") return true;
  return window.location.pathname.startsWith("/bank");
}

function companyOrigin() {
  if (window.PortalUIRouter?.originForSurface) {
    return window.PortalUIRouter.originForSurface("company");
  }
  const url = new URL(window.location.href);
  url.port = "3000";
  return url.origin;
}

function bankOrigin() {
  if (window.PortalUIRouter?.originForSurface) {
    return window.PortalUIRouter.originForSurface("bank");
  }
  const url = new URL(window.location.href);
  url.port = "3001";
  return url.origin;
}

function targetOriginForPath(path) {
  if (path === "/onboarding") {
    return companyOrigin();
  }
  if (AUTH_PUBLIC_ROUTES.has(path)) {
    return window.location.origin;
  }
  if (window.PortalUIRouter?.targetOriginForRoute) {
    return window.PortalUIRouter.targetOriginForRoute(path);
  }
  return path.startsWith("/bank") ? bankOrigin() : companyOrigin();
}

function redirectToSurface(path) {
  const targetOrigin = targetOriginForPath(path);
  if (targetOrigin === window.location.origin) {
    return false;
  }

  window.location.href = window.PortalUIRouter.hrefForRoute(targetOrigin, path);
  return true;
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((value || "").trim());
}

function saveAuthChallenge(challenge) {
  window.sessionStorage.setItem(AUTH_CHALLENGE_KEY, JSON.stringify(challenge));
}

function loadAuthChallenge() {
  const raw = window.sessionStorage.getItem(AUTH_CHALLENGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

function clearAuthChallenge() {
  window.sessionStorage.removeItem(AUTH_CHALLENGE_KEY);
}

async function authRequest(path, payload, method = "POST") {
  const response = await fetch(`/api/auth${path}`, {
    method,
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: method === "GET" ? undefined : JSON.stringify(payload || {})
  });
  const body = await response.json();
  return { ok: response.ok, status: response.status, body };
}

async function tenantRequest(path, payload, method = "POST") {
  const response = await fetch(`/api/tenants${path}`, {
    method,
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: method === "GET" ? undefined : JSON.stringify(payload || {})
  });
  const body = await response.json();
  return { ok: response.ok, status: response.status, body };
}

async function fetchAuthSession() {
  try {
    const response = await fetch("/api/auth/session", {
      method: "GET",
      credentials: "include",
      cache: "no-store"
    });
    if (response.status >= 500) return { authenticated: false, transient: true };
    if (!response.ok) return { authenticated: false, transient: false };
    const body = await response.json();
    if (!body?.session) return { authenticated: false, transient: false };
    return { authenticated: true, session: body.session, transient: false };
  } catch {
    return { authenticated: false, transient: true };
  }
}

function sessionPermissions(session) {
  return Array.isArray(session && session.actor && session.actor.permissions)
    ? session.actor.permissions
    : [];
}

function canAccessRoute(path, session) {
  if (!session) return false;

  const isBankRole = session.role === "bank_admin" || session.role === "super_admin";
  if (isBankRole) {
    return !path.startsWith("/smb") && path !== "/search";
  }

  if (path.startsWith("/bank")) {
    return false;
  }

  const matched = ROUTE_PERMISSIONS.find((entry) => entry.match(path));
  if (!matched) {
    return true;
  }

  if (Array.isArray(matched.roles) && !matched.roles.includes(session.role)) {
    return false;
  }

  const permissions = sessionPermissions(session);
  return matched.permissions.some((permission) => permissions.includes(permission));
}

function allowedRoute(path, session) {
  if (!session) return "/login";
  const isBankRole = session.role === "bank_admin" || session.role === "super_admin";
  if (isBankRole && (path.startsWith("/smb") || path === "/search")) return session.redirectPath;
  if (!isBankRole && path.startsWith("/bank")) return session.redirectPath;
  if (!canAccessRoute(path, session)) return session.redirectPath;
  return path;
}

async function logoutAndReset() {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" }
    });
  } finally {
    clearAuthChallenge();
  }
}

Object.assign(window, {
  AuthRuntime: {
    AUTH_PUBLIC_ROUTES,
    fetchSession: fetchAuthSession,
    canAccessRoute,
    allowedRoute,
    getCachedSession: () => cachedSession,
    setCachedSession: (session) => {
      cachedSession = session || null;
    },
    saveChallenge: saveAuthChallenge,
    loadChallenge: loadAuthChallenge,
    clearChallenge: clearAuthChallenge,
    logout: logoutAndReset,
    targetOriginForPath,
    redirectToSurface
  }
});

function LoginPage({ go }) {
  const [role, setRole] = useStateS(isBankOrigin() ? "bank" : "smb");
  const [id, setId] = useStateS("");
  const [pw, setPw] = useStateS("");
  const [error, setError] = useStateS("");
  const [loading, setLoading] = useStateS(false);

  const submit = async () => {
    setLoading(true);
    setError("");
    const result = await authRequest("/login/password", {
      loginIntent: role === "bank" ? "bank_staff" : "smb_customer",
      identifier: id,
      password: pw
    });
    setLoading(false);
    if (result.ok && result.body.session) {
      clearAuthChallenge();
      const destination = result.body.session.requiresTermsAcceptance ? "/terms" : result.body.session.redirectPath;
      if (redirectToSurface(destination)) return;
      go(destination);
      return;
    }
    if (!result.ok || !result.body.challenge) {
      setError(result.body.message || "Unable to sign in.");
      return;
    }
    saveAuthChallenge(result.body.challenge);
    go("/otp");
  };

  return (
    <div className="auth-bg">
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:60, width:"min(1000px, 92vw)", alignItems:"center"}}>
        <div>
          <AuthHeader/>
          <div style={{fontSize:32, fontWeight:500, color:"var(--ink)", letterSpacing:"-0.02em", lineHeight:1.15, maxWidth:420}}>
            Run your business. Unlock financing. <span style={{color:"var(--ai)"}}>One platform.</span>
          </div>
          <p className="muted" style={{marginTop:16, maxWidth:380, fontSize:13}}>
            The free ERP platform from SQB Bank for small and medium businesses in Uzbekistan.
            Inventory, finance, and 24-hour loan decisions - all in one place.
          </p>
          <div className="row" style={{gap:24, marginTop:32, fontSize:12}}>
            <div><div className="num-md">12 400+</div><div className="muted">SMBs on platform</div></div>
            <div><div className="num-md">24h</div><div className="muted">Avg. credit decision</div></div>
            <div><div className="num-md">UZS 1.8T</div><div className="muted">Financed in 2025</div></div>
          </div>
        </div>

        <div className="auth-card">
          <div className="eyebrow mb-8">Sign in</div>
          <div className="surface-switch" style={{margin:0, marginBottom:16}}>
            <button className={role==="smb" ? "active" : ""} onClick={() => setRole("smb")}>SMB CUSTOMER</button>
            <button className={role==="bank" ? "active" : ""} onClick={() => setRole("bank")}>BANK STAFF</button>
          </div>
          <div className="col gap-12">
            <Field label="Email or phone">
              <div className="input-wrap">
                <span className="prefix"><Icon.Mail size={13}/></span>
                <input className="input with-prefix" placeholder="name@company.com" value={id} onChange={e=>setId(e.target.value)}/>
              </div>
            </Field>
            <Field label="Password">
              <div className="input-wrap">
                <span className="prefix"><Icon.Lock size={13}/></span>
                <input className="input with-prefix with-suffix" type="password" placeholder="Enter your password" value={pw} onChange={e=>setPw(e.target.value)}/>
                <a className="suffix" style={{cursor:"pointer", color:"var(--ink)"}} onClick={() => go("/forgot")}>Forgot?</a>
              </div>
            </Field>
            {error && <div className="muted" style={{fontSize:12, color:"var(--bad)", marginTop:-4}}>{error}</div>}
            <Button variant="primary" className="block" onClick={submit} disabled={loading}>
              {loading ? "Checking..." : "Continue"} {!loading && <Icon.Arrow size={14}/>}
            </Button>
            <div className="row" style={{justifyContent:"center", gap:6, color:"var(--muted)", fontSize:12}}>
              New to SQB Business OS? <a style={{color:"var(--ink)", cursor:"pointer"}} onClick={() => isBankOrigin() ? window.location.href = window.PortalUIRouter.hrefForRoute(companyOrigin(), "/onboarding") : go("/onboarding")}>Create workspace</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OtpPage({ go }) {
  const [code, setCode] = useStateS(["","","","","",""]);
  const [challenge, setChallenge] = useStateS(() => loadAuthChallenge());
  const [error, setError] = useStateS("");
  const [loading, setLoading] = useStateS(false);
  const [tick, setTick] = useStateS(Date.now());
  const refs = useRef([]);

  useEffect(() => {
    if (!challenge) go("/login");
  }, [challenge, go]);

  useEffect(() => {
    const timer = window.setInterval(() => setTick(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const onChar = (i, v) => {
    const n = [...code];
    n[i] = v.replace(/\D/g, "").slice(-1);
    setCode(n);
    if (v && refs.current[i + 1]) refs.current[i + 1].focus();
  };

  const verify = async () => {
    setLoading(true);
    setError("");
    const result = await authRequest("/otp/verify", {
      challengeId: challenge.challengeId,
      code: code.join("")
    });
    setLoading(false);
    if (!result.ok || !result.body.session) {
      setError(result.body.message || "Unable to verify code.");
      return;
    }
    clearAuthChallenge();
    const nextPath = result.body.session.requiresTermsAcceptance ? "/terms" : result.body.session.redirectPath;
    if (!redirectToSurface(nextPath)) {
      go(nextPath);
    }
  };

  const resendMs = challenge ? Math.max(0, new Date(challenge.resendAvailableAt).getTime() - tick) : 0;
  const resendLabel = resendMs > 0
    ? `Resend in ${Math.floor(resendMs / 60000)}:${String(Math.floor((resendMs % 60000) / 1000)).padStart(2, "0")}`
    : "Resend code";

  const resend = async () => {
    if (!challenge || resendMs > 0) return;
    setError("");
    const result = await authRequest("/otp/request", { challengeId: challenge.challengeId });
    if (result.body.challenge) {
      saveAuthChallenge(result.body.challenge);
      setChallenge(result.body.challenge);
      return;
    }
    if (result.body.message) setError(result.body.message);
  };

  const usesAuthenticator = challenge?.deliveryMethod === "totp_app";
  const title = usesAuthenticator ? "Enter your authenticator code" : "Verify your phone";
  const subtitle = usesAuthenticator
    ? `Open ${challenge?.deliveryLabel || "your authenticator app"} and enter the current 6-digit code.`
    : `We sent a 6-digit code to ${challenge?.deliveryLabel || challenge?.maskedPhone || "+998 90 *** ** **"}`;

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <AuthHeader/>
        <div className="row" style={{gap:10, marginBottom:14}}>
          <div className="avatar warm" style={{background:"var(--ai-bg)", color:"var(--ai)"}}><Icon.Phone size={14}/></div>
          <div>
            <div style={{fontWeight:500, color:"var(--ink)"}}>{title}</div>
            <div className="muted" style={{fontSize:12}}>{subtitle}</div>
          </div>
        </div>
        <div className="row" style={{gap:8, justifyContent:"space-between", marginTop:16}}>
          {code.map((c, i) => (
            <input
              key={i}
              ref={el => refs.current[i] = el}
              className="input mono"
              style={{width:46, height:52, fontSize:22, textAlign:"center", fontWeight:500}}
              value={c}
              maxLength={1}
              onChange={(e) => onChar(i, e.target.value)}
              onKeyDown={(e) => { if (e.key === "Backspace" && !c && refs.current[i - 1]) refs.current[i - 1].focus(); }}
            />
          ))}
        </div>
        {error && <div className="muted" style={{fontSize:12, color:"var(--bad)", marginTop:10}}>{error}</div>}
        <div className="row mt-16" style={{justifyContent:"space-between", fontSize:12}}>
          <span className="muted">
            {challenge?.resendSupported === false
              ? `Codes refresh automatically in ${challenge?.deliveryLabel || "your authenticator app"}.`
              : <>Didn't get it? <a style={{color:"var(--ink)", cursor:"pointer"}} onClick={resend}>{resendLabel}</a></>}
          </span>
          <a className="muted" style={{cursor:"pointer"}} onClick={() => go("/login")}>← Back</a>
        </div>
        <Button variant="primary" className="block mt-16" onClick={verify} disabled={loading}>
          {loading ? "Verifying..." : "Verify and sign in"} {!loading && <Icon.Arrow size={14}/>}
        </Button>
      </div>
    </div>
  );
}

function ForgotPage({ go }) {
  const [sent, setSent] = useStateS(false);
  const [identifier, setIdentifier] = useStateS("jasur@kamolot.uz");
  return (
    <div className="auth-bg">
      <div className="auth-card">
        <AuthHeader/>
        {!sent ? (
          <>
            <h2 style={{margin:"0 0 4px", fontSize:16}}>Reset password</h2>
            <p className="muted" style={{fontSize:12, marginTop:0}}>Enter your email or phone. We'll send you a reset link.</p>
            <Field label="Email or phone">
              <input className="input" value={identifier} onChange={(e) => setIdentifier(e.target.value)}/>
            </Field>
            <div className="row mt-16" style={{gap:8}}>
              <Button variant="ghost" onClick={() => go("/login")}>Cancel</Button>
              <span className="sp"/>
              <Button variant="primary" onClick={async () => { await authRequest("/password/reset/request", { identifier }); setSent(true); }}>Send reset link</Button>
            </div>
          </>
        ) : (
          <>
            <Banner tone="good" title="Check your email">
              A reset link was sent to {identifier}. It expires in 30 minutes.
            </Banner>
            <Button variant="primary" className="block mt-16" onClick={() => go("/login")}>Back to sign in</Button>
          </>
        )}
      </div>
    </div>
  );
}

function TermsPage({ go }) {
  const [termsChecked, setTermsChecked] = useStateS(false);
  const [privacyChecked, setPrivacyChecked] = useStateS(false);
  const [loading, setLoading] = useStateS(false);
  const [error, setError] = useStateS("");

  const accept = async () => {
    if (!termsChecked || !privacyChecked) {
      setError("Please accept both documents to continue.");
      return;
    }

    setLoading(true);
    setError("");
    const termsResult = await authRequest("/terms/accept", {
      documentType: "terms_of_service",
      acceptedVersion: CURRENT_TERMS_VERSION
    });
    const privacyResult = await authRequest("/terms/accept", {
      documentType: "privacy_notice",
      acceptedVersion: CURRENT_TERMS_VERSION
    });
    setLoading(false);

    const nextSession = privacyResult.body.session || termsResult.body.session;
    if (!termsResult.ok || !privacyResult.ok || !nextSession) {
      setError(privacyResult.body.message || termsResult.body.message || "Unable to record consent.");
      return;
    }

    if (!redirectToSurface(nextSession.redirectPath)) {
      go(nextSession.redirectPath);
    }
  };

  return (
    <div className="auth-bg">
      <div className="auth-card" style={{maxWidth:620}}>
        <AuthHeader/>
        <h2 style={{margin:"0 0 6px", fontSize:18}}>Review and accept</h2>
        <p className="muted" style={{fontSize:12, marginTop:0}}>
          To enter SQB Business OS, please accept the latest Terms of Service and Privacy Notice.
        </p>
        <div className="hairline" style={{padding:12, borderRadius:6, marginTop:12}}>
          <div style={{fontWeight:500, color:"var(--ink)"}}>Terms of Service</div>
          <div className="muted" style={{fontSize:12, marginTop:4}}>
            Covers platform access, acceptable use, tenant responsibilities, and audit requirements. Version {CURRENT_TERMS_VERSION}.
          </div>
          <label className="row mt-12" style={{gap:8, cursor:"pointer"}}>
            <input type="checkbox" checked={termsChecked} onChange={(e) => setTermsChecked(e.target.checked)}/>
            <span style={{fontSize:12}}>I accept the Terms of Service</span>
          </label>
        </div>
        <div className="hairline" style={{padding:12, borderRadius:6, marginTop:10}}>
          <div style={{fontWeight:500, color:"var(--ink)"}}>Privacy Notice</div>
          <div className="muted" style={{fontSize:12, marginTop:4}}>
            Explains how SQB processes identity, OTP, audit, and workspace data. Version {CURRENT_TERMS_VERSION}.
          </div>
          <label className="row mt-12" style={{gap:8, cursor:"pointer"}}>
            <input type="checkbox" checked={privacyChecked} onChange={(e) => setPrivacyChecked(e.target.checked)}/>
            <span style={{fontSize:12}}>I accept the Privacy Notice</span>
          </label>
        </div>
        {error && <div className="muted" style={{fontSize:12, color:"var(--bad)", marginTop:12}}>{error}</div>}
        <div className="row mt-16" style={{gap:8}}>
          <Button variant="ghost" onClick={() => go("/login")}>Cancel</Button>
          <span className="sp"/>
          <Button variant="primary" onClick={accept} disabled={loading}>
            {loading ? "Saving..." : "Accept and continue"} {!loading && <Icon.Arrow size={14}/>}
          </Button>
        </div>
      </div>
    </div>
  );
}

function OnboardingPage({ go }) {
  const [step, setStep] = useStateS(0);
  const [companyName, setCompanyName] = useStateS("Kamolot Savdo LLC");
  const [tin, setTin] = useStateS("301 452 776");
  const [region, setRegion] = useStateS("Tashkent");
  const [address, setAddress] = useStateS("Mirobod district, Tashkent 100170");
  const [businessType, setBusinessType] = useStateS("Wholesale");
  const [customBusinessType, setCustomBusinessType] = useStateS("");
  const [invites, setInvites] = useStateS([
    { name: "Malika Karimova", role: "Company admin", email: "malika@kamolot.uz" },
    { name: "Bekzod Yusupov", role: "Operator", email: "bekzod@kamolot.uz" }
  ]);
  const [loading, setLoading] = useStateS(false);
  const [error, setError] = useStateS("");
  const steps = ["Company", "Business type", "Team", "Plan"];
  const businessOptions = [
    {k:"Wholesale", d:"Distribute goods to retailers"},
    {k:"Retail", d:"Sell direct to consumers"},
    {k:"Manufacturing", d:"Produce & assemble goods"},
    {k:"Food production", d:"Bakery, dairy, packaged food"},
    {k:"Services", d:"Professional or field services"},
    {k:"Textiles", d:"Garment & fabric production"},
    {k:"Other", d:"Enter a business type not listed above"},
  ];

  useEffect(() => {
    if (!isBankOrigin()) return;
    window.location.replace(window.PortalUIRouter.hrefForRoute(companyOrigin(), "/onboarding"));
  }, []);

  const normalizedInvites = invites
    .map((invite) => ({
      name: invite.name.trim(),
      role: invite.role.trim(),
      email: invite.email.trim().toLowerCase()
    }))
    .filter((invite) => invite.name || invite.role || invite.email);

  const validateStep = () => {
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

      const seen = new Set();
      for (const invite of normalizedInvites) {
        if (seen.has(invite.email)) {
          return `Duplicate invite email detected: ${invite.email}`;
        }
        seen.add(invite.email);
      }
    }

    return "";
  };

  const continueStep = () => {
    const nextError = validateStep();
    if (nextError) {
      setError(nextError);
      return;
    }
    setError("");
    setStep(step + 1);
  };

  const createWorkspace = async () => {
    const nextError = validateStep();
    if (nextError) {
      setError(nextError);
      return;
    }
    setLoading(true);
    setError("");
    const result = await tenantRequest("/onboarding", {
      companyName,
      tin,
      region,
      address,
      businessType: businessType === "Other" ? customBusinessType.trim() || "Other" : businessType,
      invites: normalizedInvites,
      plan: "business_os_free"
    });
    setLoading(false);

    if (!result.ok || !result.body.session) {
      setError(result.body.message || "Unable to create workspace.");
      return;
    }

    const nextPath = result.body.session.requiresTermsAcceptance ? "/terms" : result.body.session.redirectPath;
    if (!redirectToSurface(nextPath)) {
      go(nextPath);
    }
  };

  return (
    <div className="auth-bg" style={{alignItems:"flex-start", paddingTop:60}}>
      <div style={{width:"min(620px, 94vw)"}}>
        <AuthHeader/>
        <div className="card">
          <div className="card-head">
            <div className="eyebrow">Workspace setup - Step {step+1} of 4</div>
            <span className="sp"/>
            <div className="mono" style={{fontSize:11, color:"var(--muted)"}}>~ 3 min</div>
          </div>
          <div style={{padding:"0 14px"}}>
            <div className="row" style={{gap:4, padding:"10px 0"}}>
              {steps.map((s,i) => (
                <div key={s} style={{flex:1, display:"flex", alignItems:"center", gap:6, fontSize:11, color: i <= step ? "var(--ink)" : "var(--muted)"}}>
                  <span className="mono" style={{
                    width:18, height:18, borderRadius:"50%", display:"grid", placeItems:"center",
                    background: i < step ? "var(--ink)" : i === step ? "var(--ai-bg)" : "var(--bg)",
                    color: i < step ? "var(--surface)" : i === step ? "var(--ai)" : "var(--muted)",
                    border: `1px solid ${i===step ? "var(--ai-line)" : "var(--line)"}`,
                    fontSize: 10,
                  }}>{i < step ? "✓" : i+1}</span>
                  <span>{s}</span>
                  {i < steps.length - 1 && <span style={{flex:1, height:1, background:"var(--line)"}}/>}
                </div>
              ))}
            </div>
          </div>
          <div className="card-body">
            {step === 0 && (
              <div className="col gap-12">
                <Field label="Company name"><input className="input" value={companyName} onChange={(e) => setCompanyName(e.target.value)}/></Field>
                <div className="grid grid-2">
                  <Field label="TIN / Tax ID"><input className="input mono" value={tin} onChange={(e) => setTin(e.target.value)}/></Field>
                  <Field label="Region">
                    <select className="select" value={region} onChange={(e) => setRegion(e.target.value)}><option>Tashkent</option><option>Samarkand</option><option>Bukhara</option></select>
                  </Field>
                </div>
                <Field label="Address"><input className="input" value={address} onChange={(e) => setAddress(e.target.value)}/></Field>
              </div>
            )}
            {step === 1 && (
              <div>
                <div className="label mb-8">Primary business type - pick one</div>
                <div className="grid grid-3" style={{gap:8}}>
                  {businessOptions.map((b) => (
                    <div key={b.k} className="hairline" onClick={() => setBusinessType(b.k)} style={{padding:12, borderRadius:6, cursor:"pointer", background: businessType===b.k ? "var(--ai-bg)" : "var(--surface)", borderColor: businessType===b.k ? "var(--ai-line)" : "var(--line)"}}>
                      <div style={{fontWeight:500, color:"var(--ink)"}}>{b.k}</div>
                      <div className="muted" style={{fontSize:11, marginTop:2}}>{b.d}</div>
                    </div>
                  ))}
                </div>
                {businessType === "Other" && (
                  <Field label="Enter business type">
                    <input className="input" value={customBusinessType} onChange={(e) => setCustomBusinessType(e.target.value)} placeholder="e.g. Logistics, Agriculture, Construction"/>
                  </Field>
                )}
              </div>
            )}
            {step === 2 && (
              <div className="col gap-12">
                <div className="label">Invite your team (optional)</div>
                {invites.map((p,i) => (
                  <div key={i} className="row hairline" style={{padding:10, borderRadius:6}}>
                    <div className="avatar sm green">{p.name.split(" ").filter(Boolean).map(w=>w[0]).join("").slice(0, 2) || "NA"}</div>
                    <div style={{flex:1, display:"grid", gap:8}}>
                      <input
                        className="input"
                        value={p.name}
                        onChange={(e) => setInvites(invites.map((invite, index) => index === i ? { ...invite, name: e.target.value } : invite))}
                        placeholder="Full name"
                      />
                      <div className="grid grid-2">
                        <input
                          className="input mono"
                          value={p.email}
                          onChange={(e) => setInvites(invites.map((invite, index) => index === i ? { ...invite, email: e.target.value } : invite))}
                          placeholder="Email"
                        />
                        <select
                          className="select"
                          value={p.role}
                          onChange={(e) => setInvites(invites.map((invite, index) => index === i ? { ...invite, role: e.target.value } : invite))}
                        >
                          <option>Company admin</option>
                          <option>Operator</option>
                          <option>Manager</option>
                        </select>
                      </div>
                    </div>
                    <button className="icon-btn" onClick={() => setInvites(invites.filter((_, index) => index !== i))}><Icon.X size={13}/></button>
                  </div>
                ))}
                <Button variant="ghost" size="sm" icon={<Icon.Plus size={13}/>} onClick={() => setInvites([...invites, {
                  name: "",
                  role: "Operator",
                  email: ""
                }])}>Add another</Button>
              </div>
            )}
            {step === 3 && (
              <div>
                <div className="ai-card" style={{padding:14, marginBottom:12}}>
                  <span className="ai-tag"><Icon.Sparkle size={10}/> AI</span>
                  <div style={{fontWeight:500, color:"var(--ink)"}}>Recommended for you: Business OS Free</div>
                  <p className="muted" style={{fontSize:12, marginTop:4}}>
                    As a verified SQB Bank customer (TIN 301 452 776), you get the full platform at no cost.
                  </p>
                </div>
                <div className="grid grid-2" style={{gap:8}}>
                  <div className="hairline" style={{padding:14, borderRadius:6, borderColor:"var(--ink)", background:"var(--surface)", boxShadow:"0 0 0 1px var(--ink)"}}>
                    <div className="row"><div style={{fontWeight:500, color:"var(--ink)"}}>Business OS - Free</div><span className="sp"/><Pill tone="good" dot={false}>Selected</Pill></div>
                    <div className="num-md mt-4">0 <span className="mono muted" style={{fontSize:11}}>UZS / month</span></div>
                    <ul className="muted" style={{paddingLeft:16, fontSize:12, lineHeight:1.7}}>
                      <li>Unlimited inventory & invoices</li>
                      <li>AI Copilot - OCR - cash-flow analytics</li>
                      <li>24-hour loan decisions</li>
                      <li>Free for all SQB Bank SMB customers</li>
                    </ul>
                  </div>
                  <div className="hairline" style={{padding:14, borderRadius:6, opacity:0.7}}>
                    <div style={{fontWeight:500, color:"var(--ink)"}}>Premium (coming soon)</div>
                    <div className="num-md mt-4 muted">-</div>
                    <ul className="muted" style={{paddingLeft:16, fontSize:12, lineHeight:1.7}}>
                      <li>Multi-entity consolidation</li>
                      <li>Advanced API access</li>
                      <li>Dedicated success manager</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
          {error && <div className="muted" style={{fontSize:12, color:"var(--bad)", padding:"0 14px 12px"}}>{error}</div>}
          <div className="modal-foot">
            <Button variant="ghost" onClick={() => step === 0 ? go("/login") : setStep(step-1)}>
              <Icon.ChevLeft size={13}/> Back
            </Button>
            <span className="sp"/>
            {step < 3 ? (
              <Button variant="primary" onClick={continueStep}>Continue <Icon.Arrow size={13}/></Button>
            ) : (
              <Button variant="primary" onClick={createWorkspace} disabled={loading}>{loading ? "Creating..." : "Enter workspace"} {!loading && <Icon.Arrow size={13}/>}</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { LoginPage, OtpPage, ForgotPage, TermsPage, OnboardingPage });
