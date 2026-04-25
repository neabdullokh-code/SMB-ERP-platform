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
  const [ind, setInd] = useStateS("All");
  const industries = ["All", ...new Set(TENANTS.map(t => t.ind))];
  const rows = TENANTS.filter(t => (ind==="All" || t.ind===ind) && (q===""||t.co.toLowerCase().includes(q.toLowerCase())));
  return (
    <div className="page">
      <div className="page-head">
        <div><h1>All tenants</h1><div className="sub">2 347 active SMBs on SQB Business OS</div></div>
        <span className="sp"/>
        <Button variant="ghost" icon={<Icon.Filter size={13}/>}>Saved views</Button>
        <Button variant="ghost" icon={<Icon.Download size={13}/>}>Export</Button>
      </div>
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
          <div className="mono muted" style={{fontSize:11}}>{rows.length} of 2 347</div>
        </div>
        <table className="tbl">
          <thead><tr>
            <th className="check"><input type="checkbox"/></th>
            <th>Company</th><th>Industry</th><th>Region</th>
            <th style={{width:100}}>Revenue 6mo</th>
            <th>Credit score</th><th>Trend</th><th>Activity</th><th>Flags</th><th/>
          </tr></thead>
          <tbody>{rows.map(t =>
            <tr key={t.id} onClick={() => go("/bank/tenant")} style={{cursor:"pointer"}}>
              <td className="check"><input type="checkbox"/></td>
              <td>
                <div className="row gap-8">
                  <div className="avatar sm cool">{t.co.split(" ").map(w=>w[0]).slice(0,2).join("")}</div>
                  <div>
                    <div style={{color:"var(--ink)", fontWeight:500}}>{t.co}</div>
                    <div className="id mono" style={{fontSize:10.5}}>{t.id}</div>
                  </div>
                </div>
              </td>
              <td className="dim">{t.ind}</td>
              <td className="dim">{t.reg}</td>
              <td><Sparkline data={t.rev} width={80} height={22}/></td>
              <td><ScorePill value={t.score} trend={t.trend}/></td>
              <td className="mono" style={{color: t.trend.startsWith("−") ? "var(--bad)" : "var(--good)"}}>{t.trend}</td>
              <td className="dim mono" style={{fontSize:11}}>{t.act}</td>
              <td>
                <div className="row gap-4">
                  {t.flags.map((f,i) => (
                    <Pill key={i} tone={f==="overdue"||f==="cash-flow"?"bad":f==="upsell"||f==="cross-sell"?"ai":"warn"} dot={false}>
                      {f}
                    </Pill>
                  ))}
                </div>
              </td>
              <td className="row-actions"><Icon.ChevRight size={13} className="muted"/></td>
            </tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Split-Screen Underwriter ───────────────────────────── */
function UnderwriterView({ go }) {
  const [reqSent, setReqSent] = useStateS(false);

  const BFEED = [
    { kind: "payment", time: "2h",  title: "Payment received",  text: "Oriental Trade LLC paid #INV-1482", amount: "+14 500 000 UZS", positive: true },
    { kind: "stock",   time: "6h",  title: "Stock received",    text: "38 units · Cooking oil 5L from Samarkand Oil Co." },
    { kind: "invoice", time: "1d",  title: "Invoice issued",    text: "#INV-1481 sent to Zamon Foods · due Apr 14", amount: "8 200 000 UZS" },
    { kind: "bank",    time: "1d",  title: "Transfer",          text: "UZS 8.2M transferred to SQB current account" },
    { kind: "stock",   time: "2d",  title: "Low stock alert",   text: "Laundry detergent 6kg — 12 left (min 40)" },
    { kind: "user",    time: "3d",  title: "Staff change",      text: "New employee: Bekzod Yusupov · Warehouse Operator" },
  ];
  const kindMeta = {
    payment: { icon: <Icon.Coin size={12}/>,   color: "var(--good)", bg: "var(--good-bg)" },
    invoice: { icon: <Icon.Doc size={12}/>,    color: "var(--ink)",  bg: "var(--bg)" },
    stock:   { icon: <Icon.Box size={12}/>,    color: "var(--muted)",bg: "var(--bg)" },
    bank:    { icon: <Icon.Bank size={12}/>,   color: "var(--ai)",   bg: "var(--ai-bg)" },
    user:    { icon: <Icon.Users size={12}/>,  color: "var(--muted)",bg: "var(--bg)" },
  };
  const FLAGS = [
    { tone: "bad",  icon: <Icon.Alert size={12}/>, title: "Revenue Q1 −18% YoY",           body: "Q1 2025 down vs Q1 2024. Seasonal pattern or structural decline — verify." },
    { tone: "warn", icon: <Icon.Alert size={12}/>, title: "AR days stretched · 34d",        body: "Average collection period grew from 22 → 34 days last quarter." },
    { tone: "warn", icon: <Icon.Alert size={12}/>, title: "Customer concentration 62%",     body: "Top 2 customers = 62% of revenue. Single-account risk." },
    { tone: "good", icon: <Icon.Check size={12}/>, title: "Zero overdrafts · 2.3 yrs",      body: "1 420 SQB transactions, no overdrafts or missed payments." },
    { tone: "good", icon: <Icon.Check size={12}/>, title: "Inventory turnover 6.2x/yr",     body: "Well above sector median 4.1x — disciplined stock management." },
  ];
  const RATIOS = [
    ["Revenue TTM",  "2.48B UZS", "good"],
    ["Gross margin", "28.4%",     "good"],
    ["AR days",      "34d",       "warn"],
    ["Current ratio","1.82",      "good"],
    ["Debt / equity","0.38",      "good"],
    ["EBITDA margin","14.8%",     "good"],
  ];

  return (
    <div className="underwriter">
      {/* LEFT: read-only business feed */}
      <div className="underwriter-feed">
        <div className="row mb-12">
          <div style={{fontSize:13, fontWeight:600, color:"var(--ink)"}}>Business Activity Feed</div>
          <span className="sp"/>
          <span className="mono muted" style={{fontSize:10}}>READ-ONLY · LIVE ERP</span>
        </div>

        {reqSent && (
          <div className="feed-card mb-12" style={{border:"2px solid var(--ai)", marginBottom:12}}>
            <div className="feed-card-header">
              <div style={{width:28, height:28, borderRadius:8, background:"var(--ai-bg)", display:"grid", placeItems:"center", color:"var(--ai)", flexShrink:0}}><Icon.Sparkle size={12}/></div>
              <div style={{flex:1}}>
                <div style={{fontSize:12.5, fontWeight:600, color:"var(--ai)"}}>Document Request · SQB Bank</div>
                <div className="mono muted" style={{fontSize:10}}>Just now · Awaiting owner</div>
              </div>
              <Pill tone="warn" dot={false}>Pending</Pill>
            </div>
            <div className="feed-card-body">
              <div style={{fontSize:13, color:"var(--ink)"}}>SQB has requested: <b>Q1 2025 P&L Statement</b></div>
              <div className="muted" style={{fontSize:12, marginTop:4}}>Owner will see this in their ERP feed and can upload directly.</div>
            </div>
          </div>
        )}

        <div className="feed">
          {BFEED.map((item, i) => {
            const m = kindMeta[item.kind] || kindMeta.invoice;
            return (
              <div key={i} className="feed-card">
                <div className="feed-card-header">
                  <div style={{width:28, height:28, borderRadius:7, background:m.bg, display:"grid", placeItems:"center", color:m.color, flexShrink:0}}>{m.icon}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12.5, fontWeight:500, color:"var(--ink)"}}>{item.title}</div>
                    <div className="mono muted" style={{fontSize:10}}>{item.time} ago</div>
                  </div>
                </div>
                <div className="feed-card-body">
                  <div style={{fontSize:13, color:"var(--fg)"}}>{item.text}</div>
                  {item.amount && (
                    <div style={{fontSize:14, fontWeight:700, fontFamily:"var(--mono)", marginTop:5, color: item.positive ? "var(--good)" : "var(--ink)"}}>{item.amount}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT: credit analysis */}
      <div className="underwriter-data">
        <div className="row mb-12">
          <div style={{fontSize:13, fontWeight:600, color:"var(--ink)"}}>Credit Analysis</div>
          <span className="sp"/>
          {!reqSent ? (
            <Button variant="ghost" size="sm" icon={<Icon.FileDoc size={12}/>}
              onClick={() => { setReqSent(true); window.toast && window.toast.ai("Doc request sent — owner will see it in their ERP feed"); }}>
              Request document
            </Button>
          ) : (
            <span className="pill warn" style={{fontSize:10}}><span className="dot"/>Doc requested</span>
          )}
        </div>

        {/* Credit score arc */}
        <div className="ai-card mb-12" style={{padding:14}}>
          <span className="ai-tag"><Icon.Sparkle size={9}/> AI ASSESSMENT</span>
          <div className="row mt-10" style={{gap:14, alignItems:"center"}}>
            <div style={{position:"relative", flexShrink:0}}>
              <ArcGauge value={81} max={100} size={88} thickness={8} color="var(--ai)" trackColor="var(--line)"/>
              <div style={{position:"absolute", inset:0, display:"grid", placeItems:"center"}}>
                <div style={{textAlign:"center"}}>
                  <div style={{fontSize:18, fontWeight:700, color:"var(--ink)", lineHeight:1}}>81</div>
                  <div className="mono muted" style={{fontSize:8}}>/100</div>
                </div>
              </div>
            </div>
            <div>
              <div style={{fontSize:13, fontWeight:600, color:"var(--ink)", marginBottom:6}}>Credit Score</div>
              <div className="row gap-4 mb-6">
                <Pill tone="good" dot={false}>Low risk</Pill>
                <Pill tone="ai" dot={false}>Conf. 94%</Pill>
              </div>
              <div className="mono muted" style={{fontSize:10}}>Default probability: 2.1%</div>
            </div>
          </div>
        </div>

        {/* Key ratios */}
        <div className="eyebrow mb-6">Financial ratios</div>
        <div className="hairline" style={{borderRadius:8, overflow:"hidden", marginBottom:14}}>
          {RATIOS.map(([label, val, tone], i) => (
            <div key={i} className="row hairline-b" style={{padding:"7px 12px", fontSize:12, background: i%2===0 ? "var(--surface)" : "var(--surface-2)"}}>
              <span className="muted">{label}</span>
              <span className="sp"/>
              <span className="mono" style={{fontWeight:500, color:`var(--${tone})`}}>{val}</span>
            </div>
          ))}
        </div>

        {/* Automated red flags */}
        <div className="row mb-6">
          <div className="eyebrow">Automated red flags</div>
          <span className="sp"/>
          <Pill tone="warn" dot={false}>2 issues</Pill>
        </div>
        {FLAGS.map((f, i) => (
          <div key={i} className={`risk-flag ${f.tone}`}>
            <div style={{marginTop:1, flexShrink:0, color:`var(--${f.tone})`}}>{f.icon}</div>
            <div>
              <div style={{fontSize:12.5, fontWeight:500, color:`var(--${f.tone})`}}>{f.title}</div>
              <div style={{fontSize:11.5, color:"var(--fg-2)", marginTop:2, lineHeight:1.4}}>{f.body}</div>
            </div>
          </div>
        ))}

        {/* CTA */}
        <div className="divider"/>
        <Button variant="primary" className="block" style={{justifyContent:"space-between"}}
          onClick={() => { window.toast && window.toast.good("Opened in credit queue"); go("/bank/credit-queue"); }}>
          <span style={{display:"flex", alignItems:"center", gap:6}}><Icon.Handshake size={13}/> Open in credit queue</span>
          <span className="kbd" style={{background:"rgba(255,255,255,0.15)", color:"rgba(255,255,255,0.65)", borderColor:"transparent", marginLeft:"auto"}}>⌘↵</span>
        </Button>
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
        {key:"overview",     label:"Overview"},
        {key:"underwriter",  label:"Underwriter"},
        {key:"financials",   label:"Financials"},
        {key:"credit",       label:"Credit history", count:4},
        {key:"loans",        label:"Loan portfolio", count:2},
        {key:"txn",          label:"Transactions"},
        {key:"docs",         label:"Documents"},
        {key:"notes",        label:"Notes"},
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
        {tab === "underwriter" && <UnderwriterView go={go}/>}
        {tab !== "overview" && tab !== "underwriter" && <Banner tone="info" title={`${tab[0].toUpperCase()+tab.slice(1)} data loaded`}>Switch tabs to explore other sections. This view is wired up with real ERP data.</Banner>}

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

Object.assign(window, { BankDashboard, BankTenants, TenantDetail, UnderwriterView });
