// Bank — remaining pages: Portfolio Risk, Alerts, Products, Team, Settings

function RiskPage() {
  return (
    <div className="page">
      <div className="page-head">
        <div><h1>Portfolio risk</h1><div className="sub">Concentration, delinquency, and default forecast across 2 347 tenants</div></div>
        <span className="sp"/>
        <Button variant="ghost" icon={<Icon.Download size={13}/>}>Export</Button>
      </div>
      <div className="grid grid-4 mb-16">
        <Kpi label="Total exposure" value="45.2" unit="B UZS" delta="+12% QoQ" trend="up"/>
        <Kpi label="Non-performing loans" value="1.8%" delta="−0.4 pp" trend="up"/>
        <Kpi label="Avg LGD" value="22%" delta="Industry 28%" trend="up"/>
        <Kpi label="Stress-test result" value="B+" delta="Stable @ 8% GDP shock" trend="up"/>
      </div>
      <div className="grid" style={{gridTemplateColumns:"2fr 1fr", gap:12}}>
        <div className="card card-pad-0">
          <div className="panel-title">Delinquency waterfall · last 6 months</div>
          <div style={{padding:14}}>
            <StackedBar width={760} height={220}
              data={[[92,5,2,1],[91,5,2,2],[90,6,2,2],[92,4,2,2],[93,4,2,1],[94,3,2,1]]}
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
            {[
              {n:"Wholesale",v:28,w:45,tone:"warn"},
              {n:"Food production",v:18,w:30,tone:"info"},
              {n:"Services",v:14,w:22,tone:"good"},
              {n:"Textiles",v:12,w:18,tone:"good"},
              {n:"Construction",v:10,w:24,tone:"warn"},
              {n:"Other",v:18,w:28,tone:"info"},
            ].map((x, i) => (
              <div key={i} className="mb-12">
                <div className="row" style={{fontSize:12}}><span>{x.n}</span><span className="sp"/><span className="mono muted">{x.v}%</span></div>
                <div className="progress mt-4"><span style={{width:x.v*3.5 + "%", background: x.tone==="warn"?"var(--warn)":x.tone==="good"?"var(--good)":"var(--info)"}}/></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AlertsPage({ go }) {
  return (
    <div className="page">
      <div className="page-head">
        <div><h1>Alerts & anomalies</h1><div className="sub">AI-detected patterns across all tenants</div></div>
        <span className="sp"/>
        <Button variant="ghost" icon={<Icon.Filter size={13}/>}>Filter</Button>
      </div>
      <div className="row mb-12" style={{gap:4}}>
        <span className="chip" style={{background:"var(--ink)", color:"var(--surface)", borderColor:"var(--ink)"}}>All <span className="mono" style={{opacity:0.7, marginLeft:4}}>17</span></span>
        <span className="chip">High <span style={{color:"var(--bad)", marginLeft:4}}>6</span></span>
        <span className="chip">Medium <span style={{color:"var(--warn)", marginLeft:4}}>8</span></span>
        <span className="chip">Cross-sell <span style={{color:"var(--ai)", marginLeft:4}}>3</span></span>
      </div>
      <div className="card card-pad-0">
        {ALERTS.map((a, i) => (
          <div key={i} className="hairline-b" style={{padding:"14px 16px", display:"grid", gridTemplateColumns:"auto 1fr auto auto", gap:14, alignItems:"flex-start"}}>
            <Pill tone={a.sev} dot={false}>{a.sev.toUpperCase()}</Pill>
            <div>
              <div className="row gap-8"><span style={{fontSize:13, color:"var(--ink)", fontWeight:500}}>{a.type}</span><span className="sep-dot"/><span className="muted">{a.co}</span></div>
              <div className="muted mt-4" style={{fontSize:12, lineHeight:1.5}}>{a.note}</div>
              {a.action && <div className="mt-8"><span className="pill ai">SUGGESTED: {a.action}</span></div>}
            </div>
            <span className="mono muted" style={{fontSize:10}}>{a.t}</span>
            <Button size="sm" variant="ghost" onClick={() => go("/bank/tenant")}>Open tenant <Icon.ChevRight size={12}/></Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductsPage() {
  const prods = [
    {n:"Short-term working capital", r:"18%", t:"6–12 mo", m:"240 M UZS", a:842, v:"8.4 B"},
    {n:"Trade finance line",         r:"16%", t:"24 mo",   m:"420 M UZS", a:214, v:"12.1 B"},
    {n:"Equipment financing",        r:"14%", t:"5 yr",    m:"1.2 B UZS", a:124, v:"18.4 B"},
    {n:"Invoice factoring",          r:"20%", t:"90 days", m:"180 M UZS", a:86,  v:"3.2 B"},
    {n:"Overdraft line",             r:"22%", t:"Revolving",m:"80 M UZS", a:412, v:"2.8 B"},
  ];
  return (
    <div className="page">
      <div className="page-head">
        <div><h1>Products</h1><div className="sub">Credit products offered across all tenants</div></div>
        <span className="sp"/>
        <Button variant="primary" icon={<Icon.Plus size={13}/>}>New product</Button>
      </div>
      <div className="card card-pad-0">
        <table className="tbl">
          <thead><tr><th>Product</th><th>Rate</th><th>Term</th><th>Max amount</th><th className="tr">Active loans</th><th className="tr">Volume</th><th/></tr></thead>
          <tbody>{prods.map((p,i) =>
            <tr key={i}>
              <td style={{color:"var(--ink)", fontWeight:500}}>{p.n}</td>
              <td className="mono">{p.r}</td>
              <td className="dim">{p.t}</td>
              <td className="mono">{p.m}</td>
              <td className="num">{p.a}</td>
              <td className="num">{p.v} UZS</td>
              <td className="row-actions"><Button size="sm" variant="ghost">Configure</Button></td>
            </tr>)}</tbody>
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
  const [security, setSecurity] = useStateS(null);
  const [loadingSecurity, setLoadingSecurity] = useStateS(true);
  const [savingSecurity, setSavingSecurity] = useStateS(false);
  const [securityError, setSecurityError] = useStateS("");
  const [securityInfo, setSecurityInfo] = useStateS("");

  const loadSecurity = async () => {
    setLoadingSecurity(true);
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
    } finally {
      setLoadingSecurity(false);
    }
  };

  useEffectS(() => {
    loadSecurity();
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

  return (
    <div className="page">
      <div className="page-head"><div><h1>Settings</h1></div></div>
      <div className="grid" style={{gridTemplateColumns:"1fr 1fr", gap:12}}>
        <div className="card"><div className="card-body">
          <h2>AI model</h2>
          <div className="col gap-8 mt-8">
            <div className="row"><span>Credit scoring model</span><span className="sp"/><select className="select" style={{width:140}}><option>v2.4 (current)</option><option>v2.3</option></select></div>
            <div className="row"><span>Auto-approve threshold</span><span className="sp"/><input className="input mono" defaultValue="Score ≥ 75" style={{width:140}}/></div>
            <div className="row"><span>Auto-decline threshold</span><span className="sp"/><input className="input mono" defaultValue="Score < 45" style={{width:140}}/></div>
            <div className="row"><span>Explanations in UI</span><span className="sp"/><Toggle on={true} onChange={()=>{}}/></div>
          </div>
        </div></div>
        <div className="card"><div className="card-body">
          <h2>SLA & approvals</h2>
          <div className="col gap-8 mt-8">
            <div className="row"><span>Target decision time</span><span className="sp"/><input className="input mono" defaultValue="24 hours" style={{width:140}}/></div>
            <div className="row"><span>Dual approval above</span><span className="sp"/><input className="input mono" defaultValue="500 M UZS" style={{width:140}}/></div>
            <div className="row"><span>Notify on queue > 10</span><span className="sp"/><Toggle on={true} onChange={()=>{}}/></div>
          </div>
        </div></div>
        <div className="card" style={{gridColumn:"1 / span 2"}}><div className="card-body">
          <h2>Privileged access</h2>
          <div className="muted mt-8" style={{fontSize:12, lineHeight:1.6}}>
            Super admin authenticator enforcement can now be managed here. When it is turned off, password sign-in creates the privileged session immediately.
          </div>
          {securityError ? <div className="mt-12"><Banner tone="bad" title="Security settings unavailable">{securityError}</Banner></div> : null}
          {securityInfo ? <div className="mt-12"><Banner tone="good" title="Security settings updated">{securityInfo}</Banner></div> : null}
          {loadingSecurity ? (
            <div className="muted mt-16">Loading privileged access settings...</div>
          ) : security ? (
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
          ) : null}
        </div></div>
      </div>
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

Object.assign(window, { RiskPage, AlertsPage, ProductsPage, BankTeam, BankAuditPage, BankSettings, NotificationsPage, SearchPage, NotFound });
