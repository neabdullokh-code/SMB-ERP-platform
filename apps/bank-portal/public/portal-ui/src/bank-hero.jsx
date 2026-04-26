// Bank — Dashboard, All Tenants, Tenant Detail
const UZ_MAP = "M10,30 L40,20 L70,25 L120,15 L180,20 L220,30 L260,25 L320,30 L340,50 L330,80 L300,95 L250,100 L200,110 L150,115 L110,108 L80,100 L50,90 L30,75 L10,55 Z";

function BankDashboard({ go }) {
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow mb-4">SQB Bank · Business OS Platform</div>
          <h1>Portfolio overview</h1>
          <div className="sub">Live view across all SMB tenants · updated 14s ago</div>
        </div>
        <span className="sp"/>
        <div className="chip"><Icon.Globe size={12}/> All regions</div>
        <Button variant="ghost" icon={<Icon.Download size={13}/>}>Export</Button>
      </div>

      <div className="grid grid-4 mb-16">
        <Kpi label="Active SMB tenants" value="2 347" delta="+84" deltaLabel="this month" trend="up"
          spark={<Sparkline data={[2100,2140,2190,2230,2270,2320,2347]} width={68} height={22}/>}/>
        <Kpi label="Monthly loan volume" value="45.2" unit="B UZS" delta="+12.3%" deltaLabel="vs Feb" trend="up"
          spark={<Sparkline data={[28,32,36,34,40,45]} width={68} height={22}/>}/>
        <Kpi label="Avg credit score" value="72" unit="/100" delta="+1.2" deltaLabel="YoY" trend="up"
          spark={<Sparkline data={[68,69,69,70,71,72]} width={68} height={22}/>}/>
        <Kpi label="Alerts · attention" value="17" delta="6 high severity" trend="down"
          spark={<div className="sparkbars">{[3,5,4,6,8,5,7,9,6,8,7,10].map((h,i)=><span key={i} style={{height:h*1.6+"px", background:"var(--bad)"}}/>)}</div>}/>
      </div>

      <div className="grid" style={{gridTemplateColumns:"2fr 1fr", gap:12}}>
        <div className="card card-pad-0">
          <div className="panel-title">
            Loan book · last 12 months
            <span className="sp"/>
            <div className="btn-group"><button className="btn sm">6M</button><button className="btn sm primary">12M</button><button className="btn sm">All</button></div>
          </div>
          <div style={{padding:8}}>
            <LineChart width={760} height={220} padding={[18,18,28,48]}
              categories={["Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar"]}
              series={[
                { data:[210,225,242,260,275,290,305,320,340,365,392,452], color:"var(--ink)", dots:true, area:true },
                { data:[180,190,205,218,230,245,258,270,288,310,332,384], color:"var(--ai)", dashed:true },
              ]}/>
          </div>
        </div>

        <div className="card card-pad-0">
          <div className="panel-title">Industry mix</div>
          <div style={{padding:12}}>
            <div className="row" style={{gap:16}}>
              <Donut size={128} thickness={18}
                segments={[
                  { value:28, color:"var(--ink)" },
                  { value:18, color:"var(--ai)" },
                  { value:14, color:"var(--good)" },
                  { value:12, color:"var(--info)" },
                  { value:10, color:"var(--warn)" },
                  { value:18, color:"var(--line)" },
                ]}/>
              <div style={{flex:1}}>
                {[
                  ["Wholesale",28,"var(--ink)"],
                  ["Food production",18,"var(--ai)"],
                  ["Services",14,"var(--good)"],
                  ["Textiles",12,"var(--info)"],
                  ["Construction",10,"var(--warn)"],
                  ["Other",18,"var(--line)"],
                ].map(([n,v,c],i) => (
                  <div key={i} className="row" style={{fontSize:11.5, padding:"3px 0"}}>
                    <span style={{width:8, height:8, background:c, marginRight:8, borderRadius:2}}/>
                    <span>{n}</span><span className="sp"/>
                    <span className="mono">{v}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid mt-16" style={{gridTemplateColumns:"1.2fr 1fr", gap:12}}>
        <div className="card card-pad-0">
          <div className="panel-title">Geographic distribution · Uzbekistan</div>
          <div style={{padding:14, display:"grid", gridTemplateColumns:"1.4fr 1fr", gap:14}}>
            <svg viewBox="0 0 360 140" style={{width:"100%", height:"auto", background:"var(--surface-2)", borderRadius:4}}>
              <path d={UZ_MAP} fill="var(--line-2)" stroke="var(--line)"/>
              {[
                {cx:90,cy:70,r:16,n:"Tashkent",v:842},
                {cx:150,cy:80,r:10,n:"Samarkand",v:314},
                {cx:80,cy:95,r:8,n:"Bukhara",v:186},
                {cx:210,cy:65,r:9,n:"Namangan",v:244},
                {cx:250,cy:80,r:7,n:"Ferghana",v:172},
                {cx:180,cy:45,r:6,n:"Khorezm",v:128},
                {cx:130,cy:55,r:7,n:"Navoi",v:154},
              ].map((p,i) => (
                <g key={i}>
                  <circle cx={p.cx} cy={p.cy} r={p.r} fill="var(--ai)" opacity="0.2"/>
                  <circle cx={p.cx} cy={p.cy} r={3} fill="var(--ai)"/>
                  <text x={p.cx} y={p.cy - p.r - 3} textAnchor="middle" fontSize="8" fontFamily="var(--mono)" fill="var(--ink)">{p.n}</text>
                </g>
              ))}
            </svg>
            <div>
              <div className="eyebrow mb-8">Top regions</div>
              {[
                ["Tashkent",842,36],
                ["Samarkand",314,13],
                ["Namangan",244,10],
                ["Bukhara",186,8],
                ["Ferghana",172,7],
                ["Navoi",154,7],
              ].map(([n,v,p],i) => (
                <div key={i} className="row hairline-b" style={{padding:"6px 0", fontSize:12, borderBottom: i===5 ? "0":undefined}}>
                  <span>{n}</span><span className="sp"/>
                  <span className="mono muted" style={{width:50, textAlign:"right"}}>{v}</span>
                  <span className="mono" style={{width:32, textAlign:"right", color:"var(--ai)"}}>{p}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card card-pad-0">
          <div className="panel-title">Requires attention <span className="sp"/><Pill tone="bad" dot={false}>17</Pill></div>
          <div>
            {ALERTS.slice(0,5).map((a, i) => (
              <div key={i} className="hairline-b" style={{padding:"10px 14px", display:"grid", gridTemplateColumns:"auto 1fr auto", gap:10, alignItems:"flex-start", cursor:"pointer"}}
                   onClick={() => go("/bank/alerts")}>
                <Pill tone={a.sev} dot={false}>{a.sev.toUpperCase()}</Pill>
                <div>
                  <div style={{fontSize:12.5, color:"var(--ink)", fontWeight:500}}>{a.type} · <span className="muted" style={{fontWeight:400}}>{a.co}</span></div>
                  <div className="muted" style={{fontSize:11, marginTop:2}}>{a.note}</div>
                </div>
                <div className="mono muted" style={{fontSize:10}}>{a.t}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function BankTenants({ go }) {
  const [q, setQ] = useStateS("");
  const [loading, setLoading] = useStateS(true);
  const [error, setError] = useStateS("");
  const [tenants, setTenants] = useStateS([]);
  const [ind, setInd] = useStateS("All");

  useEffectS(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/bank/portfolio", {
          method: "GET",
          credentials: "include",
          cache: "no-store"
        });
        const body = await response.json();
        if (cancelled) return;

        if (!response.ok || !Array.isArray(body?.data?.tenants)) {
          throw new Error(body?.message || "Unable to load tenant portfolio.");
        }

        setTenants(body.data.tenants);
        setError("");
      } catch (loadError) {
        if (!cancelled) {
          setTenants([]);
          setError(loadError instanceof Error ? loadError.message : "Unable to load tenant portfolio.");
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

  const industries = ["All", ...new Set(tenants.map((tenant) => tenant.industry || "Other"))];
  const rows = tenants.filter((tenant) => {
    const industry = tenant.industry || "Other";
    const query = q.trim().toLowerCase();
    const matchedIndustry = ind === "All" || industry === ind;
    const matchedQuery = query === ""
      || String(tenant.tenantName || "").toLowerCase().includes(query)
      || String(tenant.tenantId || "").toLowerCase().includes(query)
      || String(tenant.region || "").toLowerCase().includes(query);
    return matchedIndustry && matchedQuery;
  });

  const totalTenants = tenants.length;
  const trendLabel = (trend) => trend === "up" ? "+1" : trend === "down" ? "-1" : "0";
  const formatTenantCode = (tenantId, index) => {
    const raw = String(tenantId || "");
    if (/^T-\d+$/i.test(raw)) return raw.toUpperCase();
    const digits = raw.replace(/\D/g, "");
    const serial = (digits ? digits.slice(-5) : String(index + 1)).padStart(5, "0");
    return `T-${serial}`;
  };
  const relativeTime = (value) => {
    if (!value) return "—";
    const diff = Date.now() - new Date(value).getTime();
    if (!Number.isFinite(diff)) return "—";
    if (diff < 60 * 1000) return "now";
    if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}m ago`;
    if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))}h ago`;
    return `${Math.floor(diff / (24 * 60 * 60 * 1000))}d ago`;
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>All tenants</h1>
          <div className="sub">
            {loading ? "Loading tenant portfolio..." : `${totalTenants} active SMBs on SQB Business OS`}
          </div>
        </div>
        <span className="sp"/>
        <Button variant="ghost" icon={<Icon.Filter size={13}/>}>Saved views</Button>
        <Button variant="ghost" icon={<Icon.Download size={13}/>}>Export</Button>
      </div>
      {error && <Banner tone="warn" title="Tenant portfolio unavailable">{error}</Banner>}
      <div className="card card-pad-0">
        <div className="tbl-toolbar">
          <div className="input-wrap" style={{width:260}}><span className="prefix"><Icon.Search size={13}/></span><input className="input with-prefix" placeholder="Search company or TIN" value={q} onChange={e=>setQ(e.target.value)}/></div>
          <div className="row gap-4">
            {industries.slice(0,5).map(c => (
              <button key={c} className="chip" onClick={() => setInd(c)}
                style={{background:ind===c?"var(--ink)":undefined, color:ind===c?"var(--surface)":undefined, borderColor:ind===c?"var(--ink)":undefined}}>{c}</button>
            ))}
            <span className="chip filter-add"><Icon.Plus size={11}/> Region</span>
            <span className="chip filter-add"><Icon.Plus size={11}/> Score</span>
            <span className="chip filter-add"><Icon.Plus size={11}/> Risk</span>
          </div>
          <span className="sp"/>
          <div className="mono muted" style={{fontSize:11}}>
            {loading ? "Loading..." : `${rows.length} of ${totalTenants}`}
          </div>
        </div>
        <table className="tbl">
          <thead><tr>
            <th className="check"><input type="checkbox"/></th>
            <th>Company</th><th>Industry</th><th>Region</th>
            <th style={{width:100}}>Expected return</th>
            <th>Credit score</th><th>Trend</th><th>Activity</th><th>Flags</th><th/>
          </tr></thead>
          <tbody>
            {loading && <tr><td colSpan="10" className="dim mono">Loading tenants...</td></tr>}
            {!loading && rows.length === 0 && <tr><td colSpan="10" className="dim mono">No tenants found.</td></tr>}
            {rows.map((t, rowIndex) => (
            <tr key={t.tenantId} onClick={() => go("/bank/tenant")} style={{cursor:"pointer"}}>
              <td className="check"><input type="checkbox"/></td>
              <td>
                <div className="row gap-8">
                  <div className="avatar sm cool">{String(t.tenantName || "").split(" ").map((w) => w[0]).slice(0,2).join("")}</div>
                  <div>
                    <div style={{color:"var(--ink)", fontWeight:500}}>{t.tenantName}</div>
                    <div className="id mono" style={{fontSize:10.5}}>{formatTenantCode(t.tenantId, rowIndex)}</div>
                  </div>
                </div>
              </td>
              <td className="dim">{t.industry || "Other"}</td>
              <td className="dim">{t.region || "Unknown"}</td>
              <td className="dim mono">{t.expectedReturnPercent}%</td>
              <td><ScorePill value={t.creditScore} trend={trendLabel(t.healthTrend)}/></td>
              <td className="mono" style={{color: t.healthTrend === "down" ? "var(--bad)" : "var(--good)"}}>{String(t.healthTrend || "").toUpperCase()}</td>
              <td className="dim mono" style={{fontSize:11}}>{relativeTime(t.refreshedAt)}</td>
              <td>
                <div className="row gap-4">
                  <Pill tone={t.inventoryRisk === "high" ? "bad" : t.inventoryRisk === "moderate" ? "warn" : "good"} dot={false}>
                    {t.inventoryRisk}
                  </Pill>
                  <Pill tone={t.recommendedAction === "approve" ? "good" : t.recommendedAction === "review" ? "warn" : "bad"} dot={false}>
                    {t.recommendedAction}
                  </Pill>
                </div>
              </td>
              <td className="row-actions"><Icon.ChevRight size={13} className="muted"/></td>
            </tr>))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TenantDetail({ go }) {
  const [tab, setTab] = useStateS("overview");
  const t = TENANTS[2]; // Kamolot Savdo
  return (
    <div className="page">
      <div className="row mb-8" style={{fontSize:12, color:"var(--muted)"}}>
        <a style={{cursor:"pointer"}} onClick={() => go("/bank/tenants")}>All tenants</a>
        <span>/</span><span>{t.co}</span>
      </div>
      <div className="page-head">
        <div className="row" style={{gap:14}}>
          <div className="avatar lg warm">KS</div>
          <div>
            <div className="eyebrow mb-4">TIN 301 452 776 · Customer since Jan 2024</div>
            <h1>{t.co}</h1>
            <div className="row gap-8 mt-4">
              <span className="muted">{t.ind} · {t.reg}</span>
              <span className="sep-dot"/>
              <span className="muted">Owner: Jasur Azimov</span>
              <span className="sep-dot"/>
              <ScorePill value={t.score} trend={t.trend}/>
            </div>
          </div>
        </div>
        <span className="sp"/>
        <Button variant="ghost" icon={<Icon.Mail size={13}/>}>Contact</Button>
        <Button variant="ghost" icon={<Icon.Pin size={13}/>}>Pin</Button>
        <Button variant="primary" icon={<Icon.Handshake size={13}/>} onClick={() => go("/bank/credit-queue")}>Offer financing</Button>
      </div>
      <Tabs tabs={[
        {key:"overview", label:"Overview"},
        {key:"financials", label:"Financials"},
        {key:"credit", label:"Credit history", count:4},
        {key:"loans", label:"Loan portfolio", count:2},
        {key:"txn", label:"Transactions"},
        {key:"docs", label:"Documents"},
        {key:"notes", label:"Notes"},
      ]} value={tab} onChange={setTab}/>

      <div className="mt-16">
        {tab === "overview" && (
          <div className="grid grid-4 mb-16">
            <Kpi label="Revenue TTM" value="2.48" unit="B UZS" delta="+38% YoY" trend="up" spark={<Sparkline data={t.rev} width={64} height={22}/>}/>
            <Kpi label="SQB deposits" value="64.2" unit="M UZS" delta="+12%" trend="up"/>
            <Kpi label="Active loans" value="2" delta="120M outstanding" trend="up"/>
            <Kpi label="Risk tier" value="A−" delta="Stable" trend="up"/>
          </div>
        )}
        {tab !== "overview" && <Banner tone="info" title={`${tab[0].toUpperCase()+tab.slice(1)} data loaded`}>Switch tabs to explore other sections. This view is wired up with real ERP data.</Banner>}

        <div className="grid mt-16" style={{gridTemplateColumns:"2fr 1fr", gap:12}}>
          <div className="card card-pad-0">
            <div className="panel-title">ERP financial snapshot <AIChip label="LIVE"/></div>
            <div style={{padding:8}}>
              <LineChart width={740} height={220} categories={REVENUE_LABELS}
                series={[
                  {data:REVENUE_6MO, color:"var(--ink)", dots:true, area:true},
                  {data:[120,130,142,138,160,172], color:"var(--ai)", dashed:true},
                ]} padding={[18,18,28,48]}/>
              <div className="row gap-16 mono muted" style={{fontSize:10, padding:"4px 16px"}}>
                <span><span style={{display:"inline-block", width:8, height:2, background:"var(--ink)", marginRight:6}}/>Revenue</span>
                <span><span style={{display:"inline-block", width:8, height:2, background:"var(--ai)", marginRight:6}}/>Gross margin</span>
              </div>
            </div>
          </div>
          <div className="col gap-12">
            <div className="card"><div className="card-body">
              <h2>Contacts</h2>
              <div className="col gap-8 mt-8">
                {[
                  {n:"Jasur Azimov",r:"Owner",p:"+998 90 *** 14 82",c:"warm"},
                  {n:"Malika Karimova",r:"Company admin",p:"+998 71 *** 22 30",c:"green"},
                  {n:"Dilnoza Rashidova",r:"Finance manager",p:"+998 93 *** 18 04",c:"plum"},
                ].map((p,i) => (
                  <div key={i} className="row gap-8">
                    <div className={`avatar sm ${p.c}`}>{p.n.split(" ").map(w=>w[0]).join("")}</div>
                    <div><div style={{fontSize:13, color:"var(--ink)"}}>{p.n}</div><div className="muted mono" style={{fontSize:10}}>{p.r} · {p.p}</div></div>
                  </div>
                ))}
              </div>
            </div></div>
            <div className="ai-card" style={{padding:14}}>
              <span className="ai-tag"><Icon.Sparkle size={10}/> AI</span>
              <h2>Cross-sell suggestion</h2>
              <p style={{fontSize:12, color:"var(--fg-2)", margin:"6px 0"}}>Based on inventory spike detected, this tenant may benefit from <b>trade finance</b>.</p>
              <div className="row"><span className="mono muted" style={{fontSize:11}}>Est. revenue: 28M UZS/yr</span><span className="sp"/><Button size="sm" variant="ai">Contact</Button></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { BankDashboard, BankTenants, TenantDetail });
