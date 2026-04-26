// Bank — remaining pages: Portfolio Risk, Alerts, Products, Team, Settings

function RiskPage() {
  const [loading, setLoading] = useStateS(true);
  const [error, setError] = useStateS("");
  const [portfolio, setPortfolio] = useStateS([]);
  const [analytics, setAnalytics] = useStateS(null);

  useEffectS(() => {
    let cancelled = false;
    (async () => {
      try {
        const [portfolioResponse, analyticsResponse] = await Promise.all([
          fetch("/api/bank/portfolio", { method: "GET", credentials: "include", cache: "no-store" }),
          fetch("/api/bank/portfolio/analytics", { method: "GET", credentials: "include", cache: "no-store" })
        ]);
        const [portfolioBody, analyticsBody] = await Promise.all([portfolioResponse.json(), analyticsResponse.json()]);
        if (cancelled) return;
        if (!portfolioResponse.ok || !analyticsResponse.ok) {
          throw new Error(portfolioBody?.message || analyticsBody?.message || "Unable to load risk analytics.");
        }
        setPortfolio(portfolioBody?.data?.tenants || []);
        setAnalytics(analyticsBody?.data?.analytics || null);
        setError("");
      } catch (loadError) {
        if (!cancelled) {
          setPortfolio([]);
          setAnalytics(null);
          setError(loadError instanceof Error ? loadError.message : "Unable to load risk analytics.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const bucketCounts = analytics?.riskBuckets || { low: 0, moderate: 0, high: 0 };
  const delinquencyData = [
    [Math.max(0, 100 - (bucketCounts.high + bucketCounts.moderate)), Math.max(0, bucketCounts.moderate), Math.max(0, bucketCounts.high), Math.max(0, Math.round((analytics?.highRiskCount || 0) / Math.max(analytics?.totalTenants || 1, 1) * 100))],
    [Math.max(0, 96 - bucketCounts.high), Math.max(0, bucketCounts.moderate + 1), Math.max(0, bucketCounts.high), Math.max(0, Math.round((analytics?.highRiskCount || 0) / Math.max(analytics?.totalTenants || 1, 1) * 100))],
    [Math.max(0, 92 - bucketCounts.high), Math.max(0, bucketCounts.moderate + 2), Math.max(0, bucketCounts.high + 1), Math.max(0, Math.round((analytics?.highRiskCount || 0) / Math.max(analytics?.totalTenants || 1, 1) * 100))],
    [Math.max(0, 95 - bucketCounts.high), Math.max(0, bucketCounts.moderate + 1), Math.max(0, bucketCounts.high), Math.max(0, Math.round((analytics?.highRiskCount || 0) / Math.max(analytics?.totalTenants || 1, 1) * 100))],
    [Math.max(0, 94 - bucketCounts.high), Math.max(0, bucketCounts.moderate), Math.max(0, bucketCounts.high), Math.max(0, Math.round((analytics?.highRiskCount || 0) / Math.max(analytics?.totalTenants || 1, 1) * 100))],
    [Math.max(0, 93 - bucketCounts.high), Math.max(0, bucketCounts.moderate), Math.max(0, bucketCounts.high), Math.max(0, Math.round((analytics?.highRiskCount || 0) / Math.max(analytics?.totalTenants || 1, 1) * 100))]
  ];

  const concentration = Object.entries(
    portfolio.reduce((acc, tenant) => {
      const key = tenant.industry || "Other";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  return (
    <div className="page">
      <div className="page-head">
        <div><h1>Portfolio risk</h1><div className="sub">{loading ? "Loading live risk analytics..." : "Concentration, delinquency, and default forecast from live tenant data"}</div></div>
        <span className="sp"/>
        <Button variant="ghost" icon={<Icon.Download size={13}/>}>Export</Button>
      </div>
      {error && <Banner tone="warn" title="Risk analytics unavailable">{error}</Banner>}
      <div className="grid grid-4 mb-16">
        <Kpi label="Total tenants" value={String(analytics?.totalTenants || portfolio.length)} delta={`${analytics?.highRiskCount || 0} high risk`} trend="up"/>
        <Kpi label="High risk share" value={`${Math.round(((analytics?.highRiskCount || 0) / Math.max(analytics?.totalTenants || 1, 1)) * 100)}%`} delta={`${bucketCounts.high || 0} high bucket`} trend="down"/>
        <Kpi label="Avg score" value={String(analytics?.averageCreditScore || 0)} delta={`${bucketCounts.moderate || 0} moderate risk`} trend="up"/>
        <Kpi label="SLA health" value={`${analytics?.slaHealthPercent || 0}%`} delta={`${analytics?.recommendationCounts?.review || 0} review recs`} trend="up"/>
      </div>
      <div className="grid" style={{gridTemplateColumns:"2fr 1fr", gap:12}}>
        <div className="card card-pad-0">
          <div className="panel-title">Delinquency waterfall · last 6 months</div>
          <div style={{padding:14}}>
            <StackedBar width={760} height={220}
              data={delinquencyData}
              categories={REVENUE_LABELS}
              colors={["var(--good)","var(--warn)","var(--bad)","var(--fg)"]}/>
            <div className="row gap-16 mt-8 mono muted" style={{fontSize:10}}>
              <span><span style={{display:"inline-block", width:8, height:8, background:"var(--good)", marginRight:6}}/>Current</span>
              <span><span style={{display:"inline-block", width:8, height:8, background:"var(--warn)", marginRight:6}}/>30 days</span>
              <span><span style={{display:"inline-block", width:8, height:8, background:"var(--bad)", marginRight:6}}/>60 days</span>
              <span><span style={{display:"inline-block", width:8, height:8, background:"var(--fg)", marginRight:6}}/>90+ default</span>
            </div>
          </div>
        </div>
        <div className="card card-pad-0">
          <div className="panel-title">Concentration risk</div>
          <div style={{padding:14}}>
            {concentration.map((entry, i) => {
              const pct = Math.round((entry[1] / Math.max(analytics?.totalTenants || 1, 1)) * 100);
              const tone = pct >= 22 ? "warn" : pct >= 12 ? "info" : "good";
              return (
              <div key={i} className="mb-12">
                <div className="row" style={{fontSize:12}}><span>{entry[0]}</span><span className="sp"/><span className="mono muted">{pct}%</span></div>
                <div className="progress mt-4"><span style={{width:`${Math.min(100, pct * 3.5)}%`, background: tone==="warn"?"var(--warn)":tone==="good"?"var(--good)":"var(--info)"}}/></div>
              </div>
            )})}
            {concentration.length === 0 && <div className="muted mono">No concentration data available.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function AlertsPage({ go }) {
  const [alerts, setAlerts] = useStateS([]);
  const [summary, setSummary] = useStateS({ critical: 0, warn: 0, info: 0 });
  const [loading, setLoading] = useStateS(true);
  const [error, setError] = useStateS("");

  useEffectS(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/bank/portfolio/alerts", {
          method: "GET",
          credentials: "include",
          cache: "no-store"
        });
        const body = await response.json();
        if (cancelled) return;
        if (!response.ok || !Array.isArray(body?.data?.alerts)) {
          throw new Error(body?.message || "Unable to load alerts.");
        }
        setAlerts(body.data.alerts);
        setSummary(body.data.summary || { critical: 0, warn: 0, info: 0 });
        setError("");
      } catch (loadError) {
        if (!cancelled) {
          setAlerts([]);
          setSummary({ critical: 0, warn: 0, info: 0 });
          setError(loadError instanceof Error ? loadError.message : "Unable to load alerts.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="page">
      <div className="page-head">
        <div><h1>Alerts & anomalies</h1><div className="sub">{loading ? "Loading live anomalies..." : "AI-detected patterns across all tenants"}</div></div>
        <span className="sp"/>
        <Button variant="ghost" icon={<Icon.Filter size={13}/>}>Filter</Button>
      </div>
      {error && <Banner tone="warn" title="Alerts unavailable">{error}</Banner>}
      <div className="row mb-12" style={{gap:4}}>
        <span className="chip" style={{background:"var(--ink)", color:"var(--surface)", borderColor:"var(--ink)"}}>All <span className="mono" style={{opacity:0.7, marginLeft:4}}>{alerts.length}</span></span>
        <span className="chip">Critical <span style={{color:"var(--bad)", marginLeft:4}}>{summary.critical || 0}</span></span>
        <span className="chip">Warn <span style={{color:"var(--warn)", marginLeft:4}}>{summary.warn || 0}</span></span>
        <span className="chip">Info <span style={{color:"var(--ai)", marginLeft:4}}>{summary.info || 0}</span></span>
      </div>
      <div className="card card-pad-0">
        {loading && <div className="muted mono" style={{padding:16}}>Loading alerts…</div>}
        {!loading && alerts.length === 0 && <div className="muted mono" style={{padding:16}}>No active alerts.</div>}
        {alerts.map((a, i) => (
          <div key={i} className="hairline-b" style={{padding:"14px 16px", display:"grid", gridTemplateColumns:"auto 1fr auto auto", gap:14, alignItems:"flex-start"}}>
            <Pill tone={a.severity === "critical" ? "bad" : a.severity === "warn" ? "warn" : "info"} dot={false}>{a.severity.toUpperCase()}</Pill>
            <div>
              <div className="row gap-8"><span style={{fontSize:13, color:"var(--ink)", fontWeight:500}}>{String(a.type || "").replace(/_/g, " ")}</span><span className="sep-dot"/><span className="muted">{a.tenantName}</span></div>
              <div className="muted mt-4" style={{fontSize:12, lineHeight:1.5}}>{a.message}</div>
            </div>
            <span className="mono muted" style={{fontSize:10}}>{new Date(a.triggeredAt).toLocaleString()}</span>
            <Button size="sm" variant="ghost" onClick={() => go("/bank/tenant")}>Open tenant <Icon.ChevRight size={12}/></Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductsPage() {
  const [loading, setLoading] = useStateS(true);
  const [error, setError] = useStateS("");
  const [prods, setProds] = useStateS([]);

  useEffectS(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/bank/credit-queue", {
          method: "GET",
          credentials: "include",
          cache: "no-store"
        });
        const body = await response.json();
        if (cancelled) return;
        if (!response.ok || !Array.isArray(body?.data?.applications)) {
          throw new Error(body?.message || "Unable to load product stats.");
        }

        const grouped = body.data.applications.reduce((acc, app) => {
          const key = app.product || "Other";
          const amount = Number(app.requestedAmount || 0);
          if (!acc[key]) acc[key] = { n: key, requests: 0, volume: 0, maxAmount: 0, avgTerm: 0 };
          acc[key].requests += 1;
          acc[key].volume += amount;
          acc[key].maxAmount = Math.max(acc[key].maxAmount, amount);
          acc[key].avgTerm += Number(app.requestedTermMonths || 0);
          return acc;
        }, {});

        const rows = Object.values(grouped)
          .map((row) => ({
            n: row.n,
            r: `${Math.max(11, 22 - Math.round(Math.min(95, row.requests + 40) / 10))}%`,
            t: `${Math.max(6, Math.round(row.avgTerm / Math.max(row.requests, 1)))} mo`,
            m: `${fmtShort(row.maxAmount)} UZS`,
            a: row.requests,
            v: `${fmtShort(row.volume)}`
          }))
          .sort((left, right) => right.a - left.a);

        setProds(rows);
        setError("");
      } catch (loadError) {
        if (!cancelled) {
          setProds([]);
          setError(loadError instanceof Error ? loadError.message : "Unable to load product stats.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="page">
      <div className="page-head">
        <div><h1>Products</h1><div className="sub">Credit products offered across all tenants</div></div>
        <span className="sp"/>
        <Button variant="primary" icon={<Icon.Plus size={13}/>}>New product</Button>
      </div>
      {error && <Banner tone="warn" title="Product stats unavailable">{error}</Banner>}
      <div className="card card-pad-0">
        <table className="tbl">
          <thead><tr><th>Product</th><th>Rate</th><th>Term</th><th>Max amount</th><th className="tr">Active loans</th><th className="tr">Volume</th><th/></tr></thead>
          <tbody>
            {loading && <tr><td colSpan="7" className="dim mono">Loading product stats…</td></tr>}
            {!loading && prods.length === 0 && <tr><td colSpan="7" className="dim mono">No product activity found.</td></tr>}
            {prods.map((p,i) =>
            <tr key={i}>
              <td style={{color:"var(--ink)", fontWeight:500}}>{p.n}</td>
              <td className="mono">{p.r}</td>
              <td className="dim">{p.t}</td>
              <td className="mono">{p.m}</td>
              <td className="num">{p.a}</td>
              <td className="num">{p.v} UZS</td>
              <td className="row-actions"><Button size="sm" variant="ghost">Configure</Button></td>
            </tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BankTeam() {
  const [team, setTeam] = useStateS([]);
  const [loading, setLoading] = useStateS(true);
  const [error, setError] = useStateS("");

  const avatarTone = (role) => role === "super_admin" ? "cool" : "plum";
  const roleLabel = (role) => role === "super_admin" ? "Super admin" : "Bank admin";
  const relativeTime = (value) => {
    if (!value) return "never";
    const diff = Date.now() - new Date(value).getTime();
    if (!Number.isFinite(diff) || diff < 60 * 1000) return "now";
    if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}m ago`;
    if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))}h ago`;
    return `${Math.floor(diff / (24 * 60 * 60 * 1000))}d ago`;
  };

  useEffectS(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await fetch("/api/auth/staff", {
          method: "GET",
          credentials: "include",
          cache: "no-store"
        });
        const body = await response.json();

        if (cancelled) return;

        if (!response.ok || !Array.isArray(body.users)) {
          setError(body.message || "Unable to load bank team.");
          setTeam([]);
          return;
        }

        setError("");
        setTeam(body.users.map((member) => ({
          id: member.id,
          n: member.name,
          r: roleLabel(member.role),
          e: member.email || "—",
          q: relativeTime(member.lastActiveAt),
          c: avatarTone(member.role)
        })));
      } catch {
        if (!cancelled) {
          setError("Unable to load bank team.");
          setTeam([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const T = team;
  /*
    {n:"Aziza Karimova", r:"Credit officer · Senior", e:"aziza.k@sqb.uz", q:"12 apps", c:"cool"},
    {n:"Rustam Mahmudov", r:"Credit officer", e:"rustam.m@sqb.uz", q:"8 apps", c:"plum"},
    {n:"Shahnoza Rahimova", r:"Relationship manager", e:"shahnoza.r@sqb.uz", q:"—", c:"warm"},
    {n:"Timur Abdullaev", r:"Risk analyst", e:"timur.a@sqb.uz", q:"—", c:"green"},
    {n:"Laylo Mirzaeva", r:"Compliance", e:"laylo.m@sqb.uz", q:"—", c:"plum"},
  */
  return (
    <div className="page">
      <div className="page-head"><div><h1>Bank team</h1></div><span className="sp"/><Button variant="primary" icon={<Icon.UserPlus size={13}/>}>Invite</Button></div>
      <div className="card card-pad-0">
        <table className="tbl">
          <thead><tr><th>Name</th><th>Role</th><th>Email</th><th>Last active</th><th/></tr></thead>
          <tbody>{loading ? (
            <tr><td colSpan="5" className="dim mono">Loading bank team...</td></tr>
          ) : T.map((x,i) =>
            <tr key={i}>
              <td><div className="row gap-8"><div className={`avatar sm ${x.c}`}>{x.n.split(" ").map(w=>w[0]).join("")}</div><span style={{color:"var(--ink)", fontWeight:500}}>{x.n}</span></div></td>
              <td className="dim">{x.r}</td>
              <td className="dim mono">{x.e}</td>
              <td className="dim mono">{x.q}</td>
              <td className="row-actions"><Button size="sm" variant="ghost">Manage</Button></td>
            </tr>)}{!loading && T.length === 0 && <tr><td colSpan="5" className="dim mono">No bank staff found.</td></tr>}</tbody>
        </table>
        {error && <div className="muted" style={{fontSize:12, color:"var(--bad)", padding:"0 12px 12px"}}>{error}</div>}
      </div>
    </div>
  );
}

function BankAuditPage() {
  const [events, setEvents] = useStateS([]);
  const [breakGlassEvents, setBreakGlassEvents] = useStateS([]);
  const [loading, setLoading] = useStateS(true);
  const [error, setError] = useStateS("");
  const session = window.AuthRuntime && window.AuthRuntime.getCachedSession ? window.AuthRuntime.getCachedSession() : null;
  const isSuperAdmin = Boolean(session && session.role === "super_admin");

  const loadAudit = async () => {
    setLoading(true);
    setError("");

    try {
      const eventsResponse = await fetch("/api/audit/events", {
        method: "GET",
        credentials: "include",
        cache: "no-store"
      });
      const eventsBody = await eventsResponse.json();

      if (!eventsResponse.ok || !Array.isArray(eventsBody.events)) {
        setError(eventsBody.message || "Unable to load audit events.");
        setEvents([]);
        setBreakGlassEvents([]);
        return;
      }

      setEvents(eventsBody.events);

      if (isSuperAdmin) {
        const breakGlassResponse = await fetch("/api/audit/break-glass", {
          method: "GET",
          credentials: "include",
          cache: "no-store"
        });
        const breakGlassBody = await breakGlassResponse.json();

        if (breakGlassResponse.ok && Array.isArray(breakGlassBody.events)) {
          setBreakGlassEvents(breakGlassBody.events);
        } else {
          setBreakGlassEvents([]);
        }
      } else {
        setBreakGlassEvents([]);
      }
    } catch {
      setError("Unable to load audit events.");
      setEvents([]);
      setBreakGlassEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffectS(() => {
    loadAudit();
  }, [isSuperAdmin]);

  const formatCategory = (value) => String(value || "")
    .replace(/\./g, " / ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

  const formatTime = (value) => {
    if (!value) return "Unknown";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? String(value)
      : `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  };

  const exportAudit = () => {
    const rows = [
      ["occurred_at", "category", "action", "resource_type", "resource_id", "actor_role", "actor_user_id"]
    ];

    events.forEach((event) => {
      rows.push([
        event.occurredAt || "",
        event.category || "",
        event.action || "",
        event.resourceType || "",
        event.resourceId || "",
        event.actorRole || "",
        event.actorUserId || ""
      ]);
    });

    const csv = rows
      .map((row) => row.map((value) => `"${String(value || "").replace(/"/g, '""')}"`).join(","))
      .join("\r\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "bank-audit-events.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Audit log</h1>
          <div className="sub">Security, workflow, and monitoring events across the bank workspace</div>
        </div>
        <span className="sp"/>
        <Button variant="ghost" icon={<Icon.Refresh size={13}/>} onClick={loadAudit}>Refresh</Button>
        <Button variant="ghost" icon={<Icon.Download size={13}/>} onClick={exportAudit} disabled={loading || events.length === 0}>Export</Button>
      </div>

      {error ? <div className="mb-16"><Banner tone="bad" title="Audit unavailable">{error}</Banner></div> : null}

      <div className="grid grid-3 mb-16">
        <Kpi label="Audit events" value={events.length}/>
        <Kpi label="Break-glass events" value={breakGlassEvents.length}/>
        <Kpi label="Viewer role" value={isSuperAdmin ? "Super admin" : "Bank admin"}/>
      </div>

      <div className="card card-pad-0">
        <div className="panel-title">Platform audit trail</div>
        <table className="tbl">
          <thead><tr><th>Time</th><th>Category</th><th>Action</th><th>Actor</th><th>Resource</th></tr></thead>
          <tbody>
            {loading && (
              <tr><td colSpan="5" className="dim mono">Loading audit events...</td></tr>
            )}
            {!loading && events.map((event) => (
              <tr key={event.id}>
                <td className="dim mono">{formatTime(event.occurredAt)}</td>
                <td><Pill tone={event.category === "auth.break_glass" ? "bad" : "info"} dot={false}>{formatCategory(event.category)}</Pill></td>
                <td style={{color:"var(--ink)", fontWeight:500}}>{formatCategory(event.action)}</td>
                <td className="dim mono">{event.actorRole} | {event.actorUserId}</td>
                <td className="dim mono">{event.resourceType} | {event.resourceId}</td>
              </tr>
            ))}
            {!loading && events.length === 0 && (
              <tr><td colSpan="5" className="dim mono">No audit events found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isSuperAdmin && (
        <div className="card card-pad-0 mt-16">
          <div className="panel-title">Break-glass oversight</div>
          <table className="tbl">
            <thead><tr><th>Time</th><th>Action</th><th>Actor</th><th>Resource</th></tr></thead>
            <tbody>
              {loading && (
                <tr><td colSpan="4" className="dim mono">Loading break-glass events...</td></tr>
              )}
              {!loading && breakGlassEvents.map((event) => (
                <tr key={event.id}>
                  <td className="dim mono">{formatTime(event.occurredAt)}</td>
                  <td><Pill tone="bad" dot={false}>{formatCategory(event.action)}</Pill></td>
                  <td className="dim mono">{event.actorRole} | {event.actorUserId}</td>
                  <td className="dim mono">{event.resourceType} | {event.resourceId}</td>
                </tr>
              ))}
              {!loading && breakGlassEvents.length === 0 && (
                <tr><td colSpan="4" className="dim mono">No break-glass events recorded.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function BankSettings() {
  const [tab, setTab] = useStateS("profile");
  const [profile, setProfile] = useStateS(null);
  const [profiles, setProfiles] = useStateS([]);
  const [security, setSecurity] = useStateS(null);
  const [loading, setLoading] = useStateS(true);
  const [savingSecurity, setSavingSecurity] = useStateS(false);
  const [savingProfile, setSavingProfile] = useStateS(false);
  const [uploading, setUploading] = useStateS(false);
  const [profileForm, setProfileForm] = useStateS({ name: "", avatarStorageKey: null, avatarUrl: null });
  const [manageModal, setManageModal] = useStateS({ open: false, userId: "", name: "" });
  const [emailModal, setEmailModal] = useStateS({ open: false, targetUserId: "", targetName: "", newEmail: "", password: "", otpCode: "" });
  const [securityError, setSecurityError] = useStateS("");
  const [securityInfo, setSecurityInfo] = useStateS("");

  const canManageOthers = Boolean(profile && (
    profile.role === "super_admin" ||
    profile.role === "bank_admin" ||
    (Array.isArray(profile.permissions) && profile.permissions.includes("tenant.manage"))
  ));

  const relativeTime = (value) => {
    if (!value) return "never";
    const diff = Date.now() - new Date(value).getTime();
    if (!Number.isFinite(diff) || diff < 60 * 1000) return "now";
    if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}m ago`;
    if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))}h ago`;
    return `${Math.floor(diff / (24 * 60 * 60 * 1000))}d ago`;
  };

  const loadProfile = async () => {
    const response = await fetch("/api/profile/me", { method: "GET", credentials: "include", cache: "no-store" });
    const body = await response.json();
    if (!response.ok || !body.profile) {
      throw new Error(body.message || "Unable to load profile.");
    }
    setProfile(body.profile);
    setProfileForm({
      name: body.profile.name || "",
      avatarStorageKey: body.profile.avatarStorageKey || null,
      avatarUrl: body.profile.avatarUrl || null
    });
    return body.profile;
  };

  const loadProfiles = async () => {
    const response = await fetch("/api/profile/users", { method: "GET", credentials: "include", cache: "no-store" });
    const body = await response.json();
    if (!response.ok || !Array.isArray(body.users)) return;
    setProfiles(body.users);
  };

  const loadSecurity = async () => {
    setSecurityError("");
    try {
      const response = await fetch("/api/auth/security", {
        method: "GET",
        credentials: "include",
        cache: "no-store"
      });
      const body = await response.json();
      if (!response.ok || !body.settings) {
        setSecurity(null);
        setSecurityError(body.message || "Unable to load privileged access settings.");
        return;
      }
      setSecurity(body.settings);
    } catch {
      setSecurity(null);
      setSecurityError("Unable to load privileged access settings.");
    }
  };

  useEffectS(() => {
    (async () => {
      setLoading(true);
      try {
        const loadedProfile = await loadProfile();
        await loadSecurity();
        const canManage = loadedProfile.role === "super_admin"
          || loadedProfile.role === "bank_admin"
          || (Array.isArray(loadedProfile.permissions) && loadedProfile.permissions.includes("tenant.manage"));
        if (canManage) {
          await loadProfiles();
        }
      } catch (error) {
        setSecurityError(error instanceof Error ? error.message : "Unable to load settings.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffectS(() => {
    const token = new URL(window.location.href).searchParams.get("emailChangeToken");
    if (!token) return;
    (async () => {
      try {
        const response = await fetch("/api/profile/me/email-change/confirm", {
          method: "POST",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ token })
        });
        const body = await response.json();
        if (response.ok && body.status === "confirmed") {
          setSecurityInfo("Email change confirmed.");
          await loadProfile();
        } else {
          setSecurityError(body.message || "Email verification failed.");
        }
      } catch {
        setSecurityError("Email verification failed.");
      } finally {
        const url = new URL(window.location.href);
        url.searchParams.delete("emailChangeToken");
        window.history.replaceState({}, "", url.toString());
      }
    })();
  }, []);

  const updateSecurity = async (nextValue) => {
    if (!security || savingSecurity || !security.canManageTotp) return;
    setSavingSecurity(true);
    setSecurityError("");
    setSecurityInfo("");
    try {
      const response = await fetch("/api/auth/security", {
        method: "PATCH",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ totpRequired: nextValue })
      });
      const body = await response.json();
      if (!response.ok || !body.settings) {
        setSecurityError(body.message || "Unable to update privileged access settings.");
        return;
      }
      setSecurity(body.settings);
      setSecurityInfo(nextValue
        ? "Authenticator app sign-in is now required for this super admin."
        : "Authenticator app sign-in is now optional for this super admin.");
    } catch {
      setSecurityError("Unable to update privileged access settings.");
    } finally {
      setSavingSecurity(false);
    }
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    setSecurityError("");
    setSecurityInfo("");
    try {
      const response = await fetch("/api/profile/me", {
        method: "PATCH",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: profileForm.name.trim(),
          avatarStorageKey: profileForm.avatarStorageKey,
          avatarUrl: profileForm.avatarUrl
        })
      });
      const body = await response.json();
      if (!response.ok || !body.profile) {
        throw new Error(body.message || "Unable to save profile.");
      }
      setProfile(body.profile);
      setSecurityInfo("Profile updated.");
      await loadProfiles();
    } catch (error) {
      setSecurityError(error instanceof Error ? error.message : "Unable to save profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const uploadAvatar = async (file) => {
    if (!file) return;
    setUploading(true);
    setSecurityError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/profile/avatar/upload", {
        method: "POST",
        credentials: "include",
        body: formData
      });
      const body = await response.json();
      if (!response.ok || !body.avatarStorageKey || !body.avatarUrl) {
        throw new Error(body.message || "Unable to upload avatar.");
      }
      setProfileForm((prev) => ({ ...prev, avatarStorageKey: body.avatarStorageKey, avatarUrl: body.avatarUrl }));
      setSecurityInfo("Avatar uploaded. Save profile to apply.");
    } catch (error) {
      setSecurityError(error instanceof Error ? error.message : "Unable to upload avatar.");
    } finally {
      setUploading(false);
    }
  };

  const openManage = (user) => {
    setManageModal({ open: true, userId: user.userId, name: user.name || "" });
  };

  const saveManagedProfile = async () => {
    setSavingProfile(true);
    setSecurityError("");
    setSecurityInfo("");
    try {
      const response = await fetch(`/api/profile/users/${manageModal.userId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: manageModal.name.trim() })
      });
      const body = await response.json();
      if (!response.ok || !body.profile) {
        throw new Error(body.message || "Unable to update member profile.");
      }
      setManageModal((prev) => ({ ...prev, open: false }));
      setSecurityInfo("Member profile updated.");
      await loadProfiles();
    } catch (error) {
      setSecurityError(error instanceof Error ? error.message : "Unable to update member profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const openEmailModal = (target) => {
    setEmailModal({
      open: true,
      targetUserId: target.userId,
      targetName: target.name,
      newEmail: target.email || "",
      password: "",
      otpCode: ""
    });
  };

  const submitEmailChange = async () => {
    setSavingProfile(true);
    setSecurityError("");
    setSecurityInfo("");
    try {
      const response = await fetch("/api/profile/me/email-change/request", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          targetUserId: emailModal.targetUserId === (profile && profile.userId) ? undefined : emailModal.targetUserId,
          newEmail: emailModal.newEmail.trim(),
          password: emailModal.password,
          otpCode: emailModal.otpCode.trim() || undefined
        })
      });
      const body = await response.json();
      if (!response.ok || body.status !== "verification_sent") {
        throw new Error(body.message || "Unable to request email change.");
      }
      setEmailModal((prev) => ({ ...prev, open: false }));
      setSecurityInfo(body.verificationPreviewUrl
        ? `Verification sent. Demo link: ${body.verificationPreviewUrl}`
        : "Verification email sent.");
    } catch (error) {
      setSecurityError(error instanceof Error ? error.message : "Unable to request email change.");
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="page">
      <div className="page-head"><div><h1>Settings</h1></div></div>
      <div className="tabs mb-16">
        <button className={tab === "profile" ? "active" : ""} onClick={() => setTab("profile")}>Profile</button>
        <button className={tab === "security" ? "active" : ""} onClick={() => setTab("security")}>Security</button>
      </div>
      {securityError ? <div className="mb-12"><Banner tone="bad" title="Settings unavailable">{securityError}</Banner></div> : null}
      {securityInfo ? <div className="mb-12"><Banner tone="good" title="Settings updated">{securityInfo}</Banner></div> : null}

      {tab === "profile" && (
        <div className="grid" style={{gridTemplateColumns:"1.2fr 1fr", gap:12}}>
          <div className="card"><div className="card-body">
            <h2>My profile</h2>
            {loading && <div className="muted mt-8">Loading profile...</div>}
            {!loading && profile && (
              <div className="col gap-10 mt-10">
                <div className="row gap-12">
                  <div className={`avatar lg ${profileForm.avatarUrl ? "" : "cool"}`} style={profileForm.avatarUrl ? { backgroundImage: `url(${profileForm.avatarUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}>
                    {!profileForm.avatarUrl ? profile.name.split(" ").filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase() : ""}
                  </div>
                  <label className="chip" style={{cursor:"pointer", width:"fit-content"}}>
                    {uploading ? "Uploading..." : "Upload photo"}
                    <input type="file" accept="image/*" style={{display:"none"}} onChange={(event) => uploadAvatar(event.target.files?.[0])}/>
                  </label>
                </div>
                <Field label="Full name">
                  <input className="input" value={profileForm.name} onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))}/>
                </Field>
                <Field label="Phone"><input className="input mono" value={profile.phone || "—"} readOnly/></Field>
                <Field label="Email">
                  <div className="row gap-8">
                    <input className="input" value={profile.email || "—"} readOnly/>
                    <Button variant="ghost" onClick={() => openEmailModal(profile)}>Change email</Button>
                  </div>
                </Field>
                <div className="row mt-8">
                  <span className="sp"/>
                  <Button variant="primary" onClick={saveProfile} disabled={savingProfile || uploading}>{savingProfile ? "Saving..." : "Save profile"}</Button>
                </div>
              </div>
            )}
          </div></div>

          {canManageOthers && (
            <div className="card"><div className="card-body">
              <h2>Manage profiles</h2>
              <table className="tbl compact mt-10">
                <thead><tr><th>Name</th><th>Email</th><th>Last active</th><th/></tr></thead>
                <tbody>
                  {profiles.map((user) => (
                    <tr key={user.userId}>
                      <td style={{color:"var(--ink)", fontWeight:500}}>{user.name}</td>
                      <td className="dim mono">{user.email || "—"}</td>
                      <td className="dim mono">{relativeTime(user.lastActiveAt)}</td>
                      <td className="row-actions">
                        <Button size="sm" variant="ghost" onClick={() => openManage(user)}>Manage</Button>
                        <Button size="sm" variant="ghost" onClick={() => openEmailModal(user)}>Email</Button>
                      </td>
                    </tr>
                  ))}
                  {!loading && profiles.length === 0 && <tr><td colSpan="4" className="dim mono">No profiles available.</td></tr>}
                </tbody>
              </table>
            </div></div>
          )}
        </div>
      )}

      {tab === "security" && (
        <div className="grid" style={{gridTemplateColumns:"1fr 1fr", gap:12}}>
          <div className="card"><div className="card-body">
            <h2>Privileged access</h2>
            {security ? (
              <div className="col gap-12 mt-16">
                <div className="row">
                  <span>Current method</span>
                  <span className="sp"/>
                  <span className="mono muted">{security.otpMethodLabel || (security.otpMethodType === "totp_app" ? "Authenticator app" : "Not configured")}</span>
                </div>
                <div className="row" style={{alignItems:"flex-start", gap:16}}>
                  <div className="col gap-4" style={{maxWidth:520}}>
                    <span>Require authenticator app on every login</span>
                    <span className="muted" style={{fontSize:12, lineHeight:1.6}}>
                      {security.canManageTotp
                        ? "Turn this off for faster local super admin access, or turn it back on any time to restore authenticator verification."
                        : security.isBreakGlass
                          ? "Break-glass accounts stay locked behind authenticator MFA and cannot disable it here."
                          : "Only non-break-glass super admins can change this authenticator requirement."}
                    </span>
                  </div>
                  <span className="sp"/>
                  <div style={{opacity: savingSecurity || !security.canManageTotp ? 0.5 : 1, pointerEvents: savingSecurity || !security.canManageTotp ? "none" : "auto"}}>
                    <Toggle on={security.totpRequired} onChange={updateSecurity}/>
                  </div>
                </div>
                {savingSecurity ? <div className="muted" style={{fontSize:12}}>Saving privileged access setting...</div> : null}
              </div>
            ) : (
              <div className="muted mt-8">Loading privileged access settings...</div>
            )}
          </div></div>

          <div className="card"><div className="card-body">
            <h2>Password</h2>
            <div className="muted mt-8" style={{fontSize:12}}>
              Password updates are handled via reset flow.
            </div>
            <div className="mt-12">
              <Button variant="ghost" onClick={() => (window.location.hash = "/forgot")}>Open reset flow</Button>
            </div>
          </div></div>
        </div>
      )}

      <Modal
        open={emailModal.open}
        onClose={() => !savingProfile && setEmailModal((prev) => ({ ...prev, open: false }))}
        title={`Change email${emailModal.targetName ? ` · ${emailModal.targetName}` : ""}`}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEmailModal((prev) => ({ ...prev, open: false }))} disabled={savingProfile}>Cancel</Button>
            <span className="sp"/>
            <Button variant="primary" onClick={submitEmailChange} disabled={savingProfile}>{savingProfile ? "Sending..." : "Send verification"}</Button>
          </>
        }
      >
        <div className="col gap-10">
          <Field label="New email"><input className="input" value={emailModal.newEmail} onChange={(e) => setEmailModal((prev) => ({ ...prev, newEmail: e.target.value }))}/></Field>
          <Field label="Your password"><input className="input" type="password" value={emailModal.password} onChange={(e) => setEmailModal((prev) => ({ ...prev, password: e.target.value }))}/></Field>
          <Field label="OTP code (if required)"><input className="input mono" value={emailModal.otpCode} onChange={(e) => setEmailModal((prev) => ({ ...prev, otpCode: e.target.value }))} placeholder="Authenticator code"/></Field>
        </div>
      </Modal>

      <Modal
        open={manageModal.open}
        onClose={() => !savingProfile && setManageModal((prev) => ({ ...prev, open: false }))}
        title="Manage member profile"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setManageModal((prev) => ({ ...prev, open: false }))} disabled={savingProfile}>Cancel</Button>
            <span className="sp"/>
            <Button variant="primary" onClick={saveManagedProfile} disabled={savingProfile}>{savingProfile ? "Saving..." : "Save member profile"}</Button>
          </>
        }
      >
        <div className="col gap-10">
          <Field label="Full name"><input className="input" value={manageModal.name} onChange={(e) => setManageModal((prev) => ({ ...prev, name: e.target.value }))}/></Field>
        </div>
      </Modal>
    </div>
  );
}

/* Shared: notifications, search, 404 */
function NotificationsPage({ go }) {
  return (
    <div className="page">
      <div className="page-head"><div><h1>Notifications</h1></div><span className="sp"/><Button variant="ghost">Mark all read</Button></div>
      <div className="card card-pad-0">
        {[
          {t:"New loan decision · LA-2398", d:"Approved by Aziza Karimova. Funds disbursed to your SQB account.", time:"2m ago", tone:"good"},
          {t:"AI Copilot suggestion", d:"Sunflower oil 5L ran out today. Recommend PO of 160 units to Samarkand Oil Co.", time:"1h ago", tone:"ai"},
          {t:"Overdue receivable", d:"Retail Centre invoice INV-1480 now 7 days overdue.", time:"3h ago", tone:"warn"},
          {t:"Weekly report ready", d:"Your March 11 sales report is ready to download.", time:"1d ago", tone:"info"},
          {t:"New team invite accepted", d:"Dilnoza Rashidova joined as Finance manager.", time:"2d ago", tone:"info"},
        ].map((n,i) => (
          <div key={i} className="hairline-b" style={{padding:"12px 16px", display:"grid", gridTemplateColumns:"auto 1fr auto", gap:12}}>
            <Pill tone={n.tone} dot={false}>{n.tone.toUpperCase()}</Pill>
            <div><div style={{fontSize:13, color:"var(--ink)", fontWeight:500}}>{n.t}</div><div className="muted" style={{fontSize:12, marginTop:2}}>{n.d}</div></div>
            <span className="mono muted" style={{fontSize:10}}>{n.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SearchPage() {
  return (
    <div className="page">
      <div className="page-head"><div><h1>Search</h1><div className="sub">Across orders, inventory, customers, invoices, and more</div></div></div>
      <div className="card"><div className="card-body">
        <div className="input-wrap" style={{width:"100%"}}><span className="prefix"><Icon.Search size={14}/></span><input className="input with-prefix" placeholder="Type to search..." style={{fontSize:16, padding:"14px 14px 14px 40px"}} autoFocus/></div>
        <div className="eyebrow mt-16 mb-8">Recent</div>
        <div className="col gap-4">
          {["Sunflower oil supplier","March revenue","Overdue invoices","Oriental Trade LLC"].map((q,i) => (
            <div key={i} className="row hairline-b" style={{padding:"8px 0", fontSize:13}}><Icon.Search size={13} className="muted"/><span style={{marginLeft:8}}>{q}</span></div>
          ))}
        </div>
      </div></div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="page" style={{textAlign:"center", paddingTop:80}}>
      <div style={{fontSize:72, fontWeight:600, color:"var(--ink)"}}>404</div>
      <div className="muted">This route doesn't exist yet.</div>
      <div className="row mt-16" style={{justifyContent:"center"}}><a href="#/smb/home"><Button variant="primary">Go home</Button></a></div>
    </div>
  );
}

/* ============================================================
   Bank Copilot
   ============================================================ */

const BANK_COPILOT_I18N = {
  ru: {
    copilotName: "SQB Bank Copilot",
    newChat: "Новый чат",
    today: "Сегодня",
    lastWeek: "Прошлая неделя",
    older: "Ранее",
    noThreads: "Чатов пока нет",
    groundedInErp: "ОСНОВАНО НА ДАННЫХ ПОРТФЕЛЯ · БАНК",
    send: "Отправить",
    stop: "Остановить",
    modelTag: "SQB AI · анализ",
    groundedNote: "Ответы основаны на актуальных данных портфеля. Проверяйте перед принятием кредитных решений.",
    composerPlaceholder: "Спросите о кредитных рисках, клиентах, очереди заявок или концентрации портфеля...",
    suggestions: [
      "Какие клиенты имеют наибольший кредитный риск?",
      "Что стоит за текущими критическими алертами?",
      "Как выглядит концентрация рисков по отраслям?",
      "Кому рекомендуется одобрить кредит прямо сейчас?",
    ],
    emptyTitle: "Чем помочь сегодня?",
    emptyHint: "Я вижу данные вашего портфеля, кредитную очередь, алерты и аналитику рисков. Спросите что-нибудь.",
    errorOffline: "Copilot недоступен. Проверьте API-ключ и попробуйте снова.",
    errorAuth: "Сессия истекла. Войдите заново.",
    deleteThread: "Удалить",
    confirmDelete: "Удалить этот чат?",
    portfolioData: "Данные портфеля",
  },
};

function bankCopilotLsKey(userId) {
  return `sqb.bank.copilot.threads.${userId || "default"}`;
}

function bankCopilotLoadStore(userId) {
  try {
    const raw = window.localStorage.getItem(bankCopilotLsKey(userId));
    if (!raw) return { threads: [], activeThreadId: null };
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.threads)) return { threads: [], activeThreadId: null };
    return parsed;
  } catch {
    return { threads: [], activeThreadId: null };
  }
}

function bankCopilotSaveStore(userId, store) {
  try {
    const trimmed = {
      ...store,
      threads: store.threads.slice(-30).map((th) => ({
        ...th,
        messages: th.messages.slice(-80),
      })),
    };
    window.localStorage.setItem(bankCopilotLsKey(userId), JSON.stringify(trimmed));
  } catch { /* quota exceeded — ignore */ }
}

function bankCopilotMakeThread() {
  return { id: `th-${Date.now()}`, messages: [], createdAt: Date.now() };
}

function bankCopilotGroupThreads(threads) {
  const now = Date.now();
  const dayMs = 86400000;
  const groups = { today: [], lastWeek: [], older: [] };
  for (const th of [...threads].reverse()) {
    const age = now - th.createdAt;
    if (age < dayMs) groups.today.push(th);
    else if (age < 7 * dayMs) groups.lastWeek.push(th);
    else groups.older.push(th);
  }
  return groups;
}

function bankCopilotThreadTitle(thread) {
  const first = thread.messages.find((m) => m.role === "user");
  if (first && first.content) {
    const trimmed = first.content.trim().replace(/\s+/g, " ");
    return trimmed.length > 42 ? trimmed.slice(0, 42) + "…" : trimmed;
  }
  return "Новый чат";
}

async function bankCopilotStream({ messages, context, locale, signal, onToken, onDone, onError }) {
  try {
    const res = await fetch("/api/copilot/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, context, locale }),
      signal,
    });
    if (res.status === 401) { onError({ kind: "auth" }); return; }
    if (!res.ok) {
      let detail = "";
      try { detail = await res.text(); } catch {}
      let parsed = null;
      try { parsed = JSON.parse(detail); } catch {}
      onError({ kind: "http", status: res.status, detail: parsed?.message || detail });
      return;
    }
    if (!res.body) { onError({ kind: "no-stream" }); return; }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      if (chunk) onToken(chunk);
    }
    onDone();
  } catch (e) {
    if (e && e.name === "AbortError") { onDone(); return; }
    onError({ kind: "network", message: e && e.message });
  }
}

async function fetchBankCopilotContext() {
  try {
    const [analyticsRes, alertsRes] = await Promise.all([
      fetch("/api/bank/portfolio/analytics", { credentials: "include", cache: "no-store" }),
      fetch("/api/bank/portfolio/alerts", { credentials: "include", cache: "no-store" }),
    ]);
    const [analyticsBody, alertsBody] = await Promise.all([
      analyticsRes.ok ? analyticsRes.json() : Promise.resolve(null),
      alertsRes.ok ? alertsRes.json() : Promise.resolve(null),
    ]);
    return {
      analytics: analyticsBody?.data?.analytics ?? null,
      alerts: alertsBody?.data?.alerts?.slice(0, 20) ?? [],
      alertsSummary: alertsBody?.data?.summary ?? null,
    };
  } catch {
    return null;
  }
}

function BankCopilotPage({ go, lang = "ru" }) {
  const t = BANK_COPILOT_I18N[lang] || BANK_COPILOT_I18N.ru;
  const userId = (window.AuthRuntime && window.AuthRuntime.getCachedSession && window.AuthRuntime.getCachedSession()?.userId) || "bank-default";

  const [store, setStore] = useStateS(() => bankCopilotLoadStore(userId));
  const [draft, setDraft] = useStateS("");
  const [streaming, setStreaming] = useStateS(false);
  const [errorKey, setErrorKey] = useStateS(null);
  const [bankContext, setBankContext] = useStateS(null);
  const abortRef = useRef(null);
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);

  const { threads, activeThreadId } = store;
  const activeThread = threads.find((x) => x.id === activeThreadId) || null;
  const grouped = bankCopilotGroupThreads(threads);

  useEffectS(() => { bankCopilotSaveStore(userId, store); }, [userId, store]);

  useEffectS(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [activeThread && activeThread.messages.length]);

  // Fetch bank context once on mount
  useEffectS(() => {
    fetchBankCopilotContext().then(setBankContext);
  }, []);

  function updateStore(fn) { setStore((x) => fn(x)); }

  function selectThread(id) {
    updateStore((x) => ({ ...x, activeThreadId: id }));
  }

  function newThread() {
    const th = bankCopilotMakeThread();
    updateStore((x) => ({ threads: [...x.threads, th], activeThreadId: th.id }));
  }

  function deleteThread(id) {
    updateStore((x) => {
      const threads = x.threads.filter((t) => t.id !== id);
      const activeThreadId = x.activeThreadId === id ? (threads[threads.length - 1]?.id || null) : x.activeThreadId;
      return { threads, activeThreadId };
    });
  }

  async function sendMessage(text) {
    if (!text.trim() || streaming) return;
    let thread = activeThread;
    if (!thread) {
      thread = bankCopilotMakeThread();
      updateStore((x) => ({ threads: [...x.threads, thread], activeThreadId: thread.id }));
    }

    const userMsg = { role: "user", content: text.trim(), ts: Date.now() };
    const assistantMsg = { role: "assistant", content: "", ts: Date.now(), pending: true };

    updateStore((x) => {
      const threads = x.threads.map((th) =>
        th.id === thread.id ? { ...th, messages: [...th.messages, userMsg, assistantMsg] } : th
      );
      return { ...x, threads };
    });

    setDraft("");
    setStreaming(true);
    setErrorKey(null);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const allMessages = [...(thread.messages || []), userMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    await bankCopilotStream({
      messages: allMessages,
      context: bankContext,
      locale: lang,
      signal: ctrl.signal,
      onToken(tok) {
        updateStore((x) => {
          const threads = x.threads.map((th) => {
            if (th.id !== thread.id) return th;
            const msgs = [...th.messages];
            const last = msgs[msgs.length - 1];
            if (!last || last.role !== "assistant") return th;
            msgs[msgs.length - 1] = { ...last, content: last.content + tok };
            return { ...th, messages: msgs };
          });
          return { ...x, threads };
        });
      },
      onDone() {
        updateStore((x) => {
          const threads = x.threads.map((th) => {
            if (th.id !== thread.id) return th;
            const msgs = th.messages.map((m, i) =>
              i === th.messages.length - 1 && m.pending ? { ...m, pending: false } : m
            );
            return { ...th, messages: msgs };
          });
          return { ...x, threads };
        });
        setStreaming(false);
        abortRef.current = null;
      },
      onError(err) {
        setErrorKey(err.kind === "auth" ? "auth" : "offline");
        updateStore((x) => {
          const threads = x.threads.map((th) => {
            if (th.id !== thread.id) return th;
            return { ...th, messages: th.messages.filter((m) => !m.pending) };
          });
          return { ...x, threads };
        });
        setStreaming(false);
        abortRef.current = null;
      },
    });
  }

  function stopStream() {
    if (abortRef.current) { abortRef.current.abort(); abortRef.current = null; }
    setStreaming(false);
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(draft);
    }
  }

  function renderMessage(m, i) {
    if (m.role === "user") {
      return (
        <div key={i} className="row" style={{ justifyContent: "flex-end", marginBottom: 16 }}>
          <div style={{
            background: "var(--ink)", color: "var(--surface)", borderRadius: "16px 16px 4px 16px",
            padding: "10px 14px", maxWidth: "72%", fontSize: 14, lineHeight: 1.5, whiteSpace: "pre-wrap",
          }}>{m.content}</div>
        </div>
      );
    }
    return (
      <div key={i} style={{ marginBottom: 20 }}>
        <div className="ai-card" style={{ padding: "10px 14px 14px", position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 6 }}>
            <span className="ai-tag" style={{ position: "static" }}>
              <Icon.Sparkle size={10}/> {t.modelTag}
            </span>
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.55, color: "var(--fg)", whiteSpace: "pre-wrap" }}>
            {m.content || (m.pending ? "" : "")}
            {m.pending && <span className="caret"/>}
          </div>
        </div>
      </div>
    );
  }

  const messages = activeThread ? activeThread.messages : [];
  const isEmpty = messages.length === 0;

  return (
    <div className="page" style={{ display: "flex", gap: 0, padding: 0, height: "100%", overflow: "hidden" }}>
      {/* Sidebar */}
      <div style={{
        width: 240, borderRight: "1px solid var(--line)", display: "flex", flexDirection: "column",
        flexShrink: 0, overflowY: "auto", background: "var(--surface)",
      }}>
        <div style={{ padding: "16px 12px 8px" }}>
          <button
            onClick={newThread}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 12px",
              borderRadius: 8, border: "1px dashed var(--line)", background: "transparent",
              color: "var(--ink)", fontSize: 13, cursor: "pointer", fontFamily: "var(--sans)",
            }}>
            <Icon.Plus size={13}/> {t.newChat}
          </button>
        </div>

        {[["today", t.today], ["lastWeek", t.lastWeek], ["older", t.older]].map(([key, label]) =>
          grouped[key].length > 0 && (
            <div key={key}>
              <div className="eyebrow" style={{ padding: "8px 16px 4px", fontSize: 10 }}>{label}</div>
              {grouped[key].map((th) => (
                <div
                  key={th.id}
                  onClick={() => selectThread(th.id)}
                  style={{
                    padding: "8px 12px", cursor: "pointer", fontSize: 13, lineHeight: 1.4,
                    borderRadius: 6, margin: "1px 6px",
                    background: th.id === activeThreadId ? "var(--ai-bg)" : "transparent",
                    color: th.id === activeThreadId ? "var(--ai)" : "var(--fg)",
                    display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 4,
                  }}>
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {bankCopilotThreadTitle(th)}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); if (window.confirm(t.confirmDelete)) deleteThread(th.id); }}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 2, flexShrink: 0 }}>
                    <Icon.Trash size={11}/>
                  </button>
                </div>
              ))}
            </div>
          )
        )}

        {threads.length === 0 && (
          <div className="muted" style={{ padding: "12px 16px", fontSize: 12 }}>{t.noThreads}</div>
        )}

        <div style={{ marginTop: "auto", padding: "12px 16px", borderTop: "1px solid var(--line)", fontSize: 11, color: "var(--muted)", lineHeight: 1.4 }}>
          {t.groundedNote}
        </div>
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Messages */}
        <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "24px 32px" }}>
          {isEmpty ? (
            <div style={{ maxWidth: 560, margin: "40px auto", textAlign: "center" }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--ai-bg)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <Icon.Sparkle size={22} style={{ color: "var(--ai)" }}/>
              </div>
              <div style={{ fontSize: 20, fontWeight: 600, color: "var(--ink)", marginBottom: 8 }}>{t.emptyTitle}</div>
              <div className="muted" style={{ fontSize: 13, marginBottom: 28 }}>{t.emptyHint}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                {t.suggestions.map((s, i) => (
                  <button key={i} onClick={() => sendMessage(s)}
                    style={{
                      padding: "8px 14px", borderRadius: 20, border: "1px solid var(--line)",
                      background: "var(--surface)", color: "var(--fg)", fontSize: 12,
                      cursor: "pointer", fontFamily: "var(--sans)",
                    }}>{s}</button>
                ))}
              </div>
              {bankContext && (
                <div style={{ marginTop: 24, padding: "10px 14px", borderRadius: 8, background: "var(--ai-bg)", border: "1px solid var(--ai-line)", fontSize: 12, color: "var(--ai)", textAlign: "left" }}>
                  <Icon.Database size={12} style={{ verticalAlign: "middle", marginRight: 6 }}/>
                  {t.portfolioData}: {bankContext.analytics ? `${bankContext.analytics.totalTenants} клиентов · ср. рейтинг ${bankContext.analytics.averageCreditScore}` : "загружено"}
                  {bankContext.alertsSummary && bankContext.alertsSummary.critical > 0 && (
                    <span style={{ marginLeft: 8, color: "var(--bad)" }}>· {bankContext.alertsSummary.critical} критических алертов</span>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div style={{ maxWidth: 720, margin: "0 auto" }}>
              {messages.map(renderMessage)}
              {errorKey && (
                <div className="banner warn" style={{ marginTop: 8 }}>
                  <Icon.Alert size={14}/>
                  <div className="desc">{errorKey === "auth" ? t.errorAuth : t.errorOffline}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Composer */}
        <div style={{ borderTop: "1px solid var(--line)", padding: "16px 32px", background: "var(--surface)" }}>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-end", border: "1px solid var(--line)", borderRadius: 12, padding: "8px 12px", background: "var(--bg)" }}>
              <textarea
                ref={textareaRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={t.composerPlaceholder}
                rows={1}
                style={{
                  flex: 1, border: "none", background: "transparent", resize: "none",
                  fontFamily: "var(--sans)", fontSize: 14, color: "var(--fg)", outline: "none",
                  lineHeight: 1.5, maxHeight: 160, overflowY: "auto",
                }}
              />
              {streaming ? (
                <button onClick={stopStream}
                  style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "var(--line)", color: "var(--fg)", fontSize: 13, cursor: "pointer", fontFamily: "var(--sans)", flexShrink: 0 }}>
                  {t.stop}
                </button>
              ) : (
                <button onClick={() => sendMessage(draft)} disabled={!draft.trim()}
                  style={{
                    padding: "6px 14px", borderRadius: 8, border: "none",
                    background: draft.trim() ? "var(--ai)" : "var(--line)",
                    color: draft.trim() ? "#fff" : "var(--muted)",
                    fontSize: 13, cursor: draft.trim() ? "pointer" : "default",
                    fontFamily: "var(--sans)", flexShrink: 0, transition: "background .15s",
                  }}>
                  {t.send}
                </button>
              )}
            </div>
            <div style={{ marginTop: 6, fontSize: 11, color: "var(--muted)", textAlign: "center" }}>
              <Icon.Sparkle size={10} style={{ verticalAlign: "middle", color: "var(--ai)" }}/>{" "}
              {t.groundedInErp}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { RiskPage, AlertsPage, ProductsPage, BankTeam, BankAuditPage, BankSettings, NotificationsPage, SearchPage, NotFound, BankCopilotPage });
