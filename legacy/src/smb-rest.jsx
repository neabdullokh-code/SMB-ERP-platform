// SMB — secondary screens: production, services, finance, reports, team, settings

function Placeholder({ title, kpis, children }) {
  return (
    <div className="page">
      <div className="page-head">
        <div><h1>{title}</h1></div>
        <span className="sp"/>
        <Button variant="ghost" icon={<Icon.Download size={13}/>}>Export</Button>
        <Button variant="primary" icon={<Icon.Plus size={13}/>}>New</Button>
      </div>
      {kpis && <div className="grid grid-4 mb-16">{kpis}</div>}
      {children}
    </div>
  );
}

function ProductionBOMs() {
  const BOMs = [
    { id:"BOM-01", n:"Sunflower oil 5L (repack)",   o:"120/day", c:"42 500 UZS", s:"Active" },
    { id:"BOM-02", n:"Mixed pantry bundle",          o:"60/day",  c:"86 200 UZS", s:"Active" },
    { id:"BOM-03", n:"Rice 5kg from bulk Devzira",   o:"200/day", c:"58 000 UZS", s:"Active" },
    { id:"BOM-04", n:"Snack mixed box, 12 items",    o:"25/day",  c:"124 000 UZS", s:"Paused" },
  ];
  return (
    <Placeholder title="Production · Bills of materials"
      kpis={<>
        <Kpi label="Active BOMs" value="14"/>
        <Kpi label="Output today" value="412" unit="units"/>
        <Kpi label="Scrap rate" value="1.8%" delta="−0.3" trend="up"/>
        <Kpi label="Material cost" value="38.2" unit="M UZS"/>
      </>}>
      <div className="card card-pad-0">
        <div className="tbl-toolbar">
          <div className="input-wrap" style={{width:240}}><span className="prefix"><Icon.Search size={13}/></span><input className="input with-prefix" placeholder="Search BOMs"/></div>
          <span className="sp"/>
          <Button size="sm" variant="ghost" icon={<Icon.Filter size={12}/>}>Filter</Button>
        </div>
        <table className="tbl">
          <thead><tr><th>Code</th><th>Recipe</th><th>Output</th><th>Unit cost</th><th>Status</th><th/></tr></thead>
          <tbody>{BOMs.map(b =>
            <tr key={b.id}>
              <td className="id">{b.id}</td>
              <td style={{color:"var(--ink)", fontWeight:500}}>{b.n}</td>
              <td className="mono">{b.o}</td>
              <td className="num">{b.c}</td>
              <td><Pill tone={b.s==="Active"?"good":"warn"}>{b.s}</Pill></td>
              <td className="row-actions"><Icon.ChevRight size={13} className="muted"/></td>
            </tr>)}</tbody>
        </table>
      </div>
    </Placeholder>
  );
}

function ServicesKanban() {
  const cols = [
    { n:"Requested",    tone:"info",  items:[{c:"Oriental Trade",   t:"Delivery · Tashkent", a:"JA"},{c:"Retail Centre", t:"Pickup", a:"BY"}]},
    { n:"Approved",     tone:"warn",  items:[{c:"Zamon Foods",      t:"Cold chain delivery", a:"MK"}]},
    { n:"In progress",  tone:"ai",    items:[{c:"Kamolot branch #2",t:"Internal transfer", a:"BY"},{c:"Nur Auto Parts", t:"Inventory audit", a:"JA"}]},
    { n:"Completed",    tone:"good",  items:[{c:"Chorsu Market",    t:"Delivery", a:"BY"},{c:"Ferghana Agro",   t:"Pickup", a:"MK"}]},
  ];
  return (
    <Placeholder title="Services · Work orders">
      <div className="grid grid-4" style={{gap:12}}>
        {cols.map((col, i) => (
          <div key={i} className="card card-pad-0">
            <div className="panel-title"><Pill tone={col.tone} dot={false}>{col.n}</Pill><span className="sp"/><span className="mono muted" style={{fontSize:11}}>{col.items.length}</span></div>
            <div style={{padding:8}}>
              {col.items.map((w, j) => (
                <div key={j} className="hairline" style={{padding:10, borderRadius:6, marginBottom:8}}>
                  <div style={{fontSize:12.5, color:"var(--ink)", fontWeight:500}}>{w.c}</div>
                  <div className="muted" style={{fontSize:11, marginTop:2}}>{w.t}</div>
                  <div className="row mt-8">
                    <div className="avatar sm green">{w.a}</div>
                    <span className="sp"/>
                    <span className="mono muted" style={{fontSize:10}}>WO-{1000 + i*10 + j}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Placeholder>
  );
}

function FinancePage({ kind }) {
  const titles = { ledger:"General ledger", invoices:"Invoices · Receivables", bills:"Bills · Payables", cash:"Cash flow" };
  if (kind === "cash") {
    return (
      <Placeholder title="Cash flow"
        kpis={<>
          <Kpi label="Inflow · March" value="312" unit="M UZS" delta="+18%" trend="up"/>
          <Kpi label="Outflow · March" value="248" unit="M UZS" delta="+9%" trend="down"/>
          <Kpi label="Net" value="+64" unit="M UZS" delta="Healthy" trend="up"/>
          <Kpi label="Days cash on hand" value="38" delta="Target: 45" trend="down"/>
        </>}>
        <div className="card card-pad-0">
          <div className="panel-title">Monthly net cash flow · last 6 months</div>
          <div style={{padding:8}}>
            <StackedBar width={900} height={240}
              data={[[155,120],[180,140],[199,170],[172,185],[220,190],[248,212]]}
              categories={REVENUE_LABELS}
              colors={["var(--ink)","var(--ai)"]}/>
            <div className="row gap-16 mono muted" style={{fontSize:10, padding:"6px 16px"}}>
              <span><span style={{display:"inline-block", width:8, height:8, background:"var(--ink)", marginRight:6}}/>Inflow</span>
              <span><span style={{display:"inline-block", width:8, height:8, background:"var(--ai)", marginRight:6}}/>Outflow</span>
            </div>
          </div>
        </div>
      </Placeholder>
    );
  }
  if (kind === "invoices") {
    const INVS = [
      { id:"INV-1482", c:"Oriental Trade LLC", d:"12 Mar", due:"26 Mar", amt:14_500_000, s:"Paid"},
      { id:"INV-1481", c:"Zamon Foods",        d:"11 Mar", due:"25 Mar", amt:28_200_000, s:"Sent"},
      { id:"INV-1480", c:"Retail Centre",      d:"09 Mar", due:"23 Mar", amt:8_400_000,  s:"Overdue"},
      { id:"INV-1479", c:"Chorsu Market Co.",  d:"08 Mar", due:"22 Mar", amt:18_100_000, s:"Sent"},
      { id:"INV-1478", c:"Nur Auto Parts",     d:"06 Mar", due:"20 Mar", amt:6_240_000,  s:"Paid"},
      { id:"INV-1477", c:"Ferghana Agro",      d:"04 Mar", due:"18 Mar", amt:32_500_000, s:"Overdue"},
    ];
    return (
      <Placeholder title="Invoices · Receivables">
        <div className="card card-pad-0">
          <div className="tbl-toolbar">
            <span className="chip" style={{background:"var(--ink)", color:"var(--surface)", borderColor:"var(--ink)"}}>All <span className="mono" style={{opacity:0.7, marginLeft:4}}>24</span></span>
            <span className="chip">Sent <span className="mono" style={{marginLeft:4}}>12</span></span>
            <span className="chip">Overdue <span className="mono" style={{marginLeft:4, color:"var(--bad)"}}>3</span></span>
            <span className="chip">Paid <span className="mono" style={{marginLeft:4}}>9</span></span>
            <span className="sp"/>
            <Button size="sm" variant="primary" icon={<Icon.Plus size={12}/>}>New invoice</Button>
          </div>
          <table className="tbl">
            <thead><tr><th>Invoice</th><th>Customer</th><th>Date</th><th>Due</th><th className="tr">Amount</th><th>Status</th><th/></tr></thead>
            <tbody>{INVS.map(i =>
              <tr key={i.id}>
                <td className="id">{i.id}</td>
                <td style={{fontWeight:500, color:"var(--ink)"}}>{i.c}</td>
                <td className="dim mono">{i.d}</td>
                <td className="dim mono">{i.due}</td>
                <td className="num">{fmtUZS(i.amt)}</td>
                <td><Pill tone={i.s==="Paid"?"good":i.s==="Overdue"?"bad":"info"}>{i.s}</Pill></td>
                <td className="row-actions">{i.s !== "Paid" && <Button size="sm" variant="ghost">Send reminder</Button>}</td>
              </tr>)}</tbody>
          </table>
        </div>
      </Placeholder>
    );
  }
  if (kind === "bills") {
    const BILLS = [
      { id:"BILL-0451", v:"Samarkand Oil Co.",  d:"18 Mar", due:"01 Apr", amt:45_700_000, s:"Due"},
      { id:"BILL-0449", v:"Makfa Distribution", d:"12 Mar", due:"26 Mar", amt:18_200_000, s:"Due"},
      { id:"BILL-0448", v:"Akbar Tea Imports",  d:"08 Mar", due:"22 Mar", amt:12_400_000, s:"Paid"},
      { id:"BILL-0445", v:"Samarkand Oil Co.",  d:"03 Mar", due:"17 Mar", amt:42_000_000, s:"Paid"},
    ];
    return (
      <Placeholder title="Bills · Payables">
        <div className="card card-pad-0">
          <table className="tbl">
            <thead><tr><th>Bill</th><th>Vendor</th><th>Date</th><th>Due</th><th className="tr">Amount</th><th>Status</th><th/></tr></thead>
            <tbody>{BILLS.map(i =>
              <tr key={i.id}>
                <td className="id">{i.id}</td>
                <td style={{fontWeight:500, color:"var(--ink)"}}>{i.v}</td>
                <td className="dim mono">{i.d}</td>
                <td className="dim mono">{i.due}</td>
                <td className="num">{fmtUZS(i.amt)}</td>
                <td><Pill tone={i.s==="Paid"?"good":"warn"}>{i.s}</Pill></td>
                <td className="row-actions">{i.s !== "Paid" && <Button size="sm" variant="primary">Mark paid</Button>}</td>
              </tr>)}</tbody>
          </table>
        </div>
      </Placeholder>
    );
  }
  // ledger
  const ACCT = [
    { c:"1001", n:"Cash · SQB current", b:64_200_000 },
    { c:"1100", n:"Accounts receivable", b:86_400_000 },
    { c:"1200", n:"Inventory", b:412_700_000 },
    { c:"2001", n:"Accounts payable", b:-78_200_000 },
    { c:"2100", n:"VAT payable", b:-14_200_000 },
    { c:"3001", n:"Retained earnings", b:-402_800_000 },
    { c:"4000", n:"Sales revenue", b:-278_400_000 },
    { c:"5000", n:"Cost of goods sold", b:192_100_000 },
  ];
  return (
    <Placeholder title="General ledger">
      <div className="card card-pad-0">
        <table className="tbl">
          <thead><tr><th>Code</th><th>Account</th><th className="tr">Balance</th></tr></thead>
          <tbody>{ACCT.map(a =>
            <tr key={a.c}>
              <td className="id">{a.c}</td>
              <td style={{color:"var(--ink)"}}>{a.n}</td>
              <td className="num" style={{color: a.b < 0 ? "var(--bad)" : "var(--ink)"}}>{fmtUZS(a.b)} UZS</td>
            </tr>)}</tbody>
        </table>
      </div>
    </Placeholder>
  );
}

function ReportsPage() {
  const REPORTS = [
    { n:"Profit & Loss",       d:"Monthly P&L statement", i:"Chart" },
    { n:"Balance sheet",       d:"Assets, liabilities, equity", i:"Ledger" },
    { n:"Cash flow statement", d:"Direct and indirect view", i:"Coin" },
    { n:"Inventory report",    d:"Valuation, turnover, aging", i:"Box" },
    { n:"Tax return pack",     d:"VAT, CIT · STI ready", i:"Shield" },
    { n:"Payroll summary",     d:"Monthly payroll register", i:"Users" },
  ];
  return (
    <Placeholder title="Reports">
      <div className="grid grid-3" style={{gap:12}}>
        {REPORTS.map((r, i) => {
          const IC = Icon[r.i];
          return (
            <div key={i} className="card" style={{padding:14}}>
              <div className="row"><IC size={16} style={{color:"var(--ai)"}}/><span className="sp"/><span className="mono muted" style={{fontSize:10}}>PDF · XLSX</span></div>
              <div style={{fontSize:14, fontWeight:500, color:"var(--ink)", marginTop:8}}>{r.n}</div>
              <div className="muted mt-4" style={{fontSize:12}}>{r.d}</div>
              <div className="row mt-12"><Button size="sm" variant="ghost">Preview</Button><Button size="sm" variant="primary" icon={<Icon.Download size={12}/>}>Generate</Button></div>
            </div>
          );
        })}
      </div>
    </Placeholder>
  );
}

function TeamPage() {
  const TEAM = [
    { n:"Jasur Azimov",      r:"Owner",         e:"jasur@kamolot.uz", last:"now"      },
    { n:"Malika Karimova",   r:"Company admin", e:"malika@kamolot.uz", last:"2m ago"  },
    { n:"Bekzod Yusupov",    r:"Operator",      e:"bekzod@kamolot.uz", last:"1h ago"  },
    { n:"Dilnoza Rashidova", r:"Manager",       e:"dilnoza@kamolot.uz", last:"3h ago" },
    { n:"Sardor Toshev",     r:"Operator",      e:"sardor@kamolot.uz", last:"1d ago"  },
  ];
  const colors = ["warm","cool","green","plum","warm"];
  return (
    <Placeholder title="Team">
      <div className="card card-pad-0">
        <div className="tbl-toolbar"><span className="sp"/><Button size="sm" variant="primary" icon={<Icon.UserPlus size={12}/>}>Invite member</Button></div>
        <table className="tbl">
          <thead><tr><th>Name</th><th>Role</th><th>Email</th><th>Last active</th><th/></tr></thead>
          <tbody>{TEAM.map((t,i) =>
            <tr key={i}>
              <td><div className="row gap-8"><div className={`avatar sm ${colors[i]}`}>{t.n.split(" ").map(w=>w[0]).join("")}</div><span style={{color:"var(--ink)", fontWeight:500}}>{t.n}</span></div></td>
              <td><Pill tone={t.r==="Owner"?"solid-ink":"info"} dot={false}>{t.r}</Pill></td>
              <td className="dim mono">{t.e}</td>
              <td className="dim mono">{t.last}</td>
              <td className="row-actions"><Button size="sm" variant="ghost">Manage</Button></td>
            </tr>)}</tbody>
        </table>
      </div>
    </Placeholder>
  );
}

function SmbSettings() {
  return (
    <Placeholder title="Settings">
      <div className="grid" style={{gridTemplateColumns:"1fr 1fr", gap:12}}>
        <div className="card"><div className="card-body">
          <h2>Company profile</h2>
          <div className="col gap-8 mt-8">
            <Field label="Company name"><input className="input" defaultValue="Kamolot Savdo LLC"/></Field>
            <Field label="TIN"><input className="input mono" defaultValue="301 452 776"/></Field>
            <Field label="Address"><input className="input" defaultValue="Mirobod district, Tashkent 100170"/></Field>
            <Field label="Phone"><input className="input mono" defaultValue="+998 71 200 44 82"/></Field>
          </div>
        </div></div>
        <div className="card"><div className="card-body">
          <h2>Bank account</h2>
          <div className="col gap-8 mt-8">
            <Field label="Primary account"><input className="input mono" defaultValue="20208 000 100 100 001 · SQB"/></Field>
            <Field label="Currency"><select className="select"><option>UZS</option><option>USD</option><option>EUR</option></select></Field>
          </div>
          <div className="divider"/>
          <h2>Locale & notifications</h2>
          <div className="col gap-8 mt-8">
            <div className="row"><span>Language</span><span className="sp"/><select className="select" style={{width:120}}><option>English</option><option>O'zbek</option><option>Русский</option></select></div>
            <div className="row"><span>Email alerts</span><span className="sp"/><Toggle on={true} onChange={()=>{}}/></div>
            <div className="row"><span>SMS alerts</span><span className="sp"/><Toggle on={false} onChange={()=>{}}/></div>
            <div className="row"><span>AI Copilot suggestions</span><span className="sp"/><Toggle on={true} onChange={()=>{}}/></div>
          </div>
        </div></div>
      </div>
    </Placeholder>
  );
}

/* -------- Production order detail, Services WO detail (simple) -------- */
function ProductionOrder({ go }) {
  return (
    <Placeholder title="Production order PO-0451">
      <div className="grid" style={{gridTemplateColumns:"2fr 1fr", gap:12}}>
        <div className="card"><div className="card-body">
          <h2>Inputs</h2>
          <table className="tbl compact"><thead><tr><th>SKU</th><th>Material</th><th className="tr">Required</th><th className="tr">Used</th></tr></thead>
            <tbody>
              <tr><td className="id">KS-0102</td><td>Cooking oil 5L bulk</td><td className="num">120</td><td className="num">118</td></tr>
              <tr><td className="id">KS-0104</td><td>Sugar refined</td><td className="num">40</td><td className="num">40</td></tr>
              <tr><td className="id">KS-0210</td><td>Rice Devzira</td><td className="num">80</td><td className="num">80</td></tr>
            </tbody>
          </table>
          <h2 className="mt-16">Output</h2>
          <div className="row hairline" style={{padding:10, borderRadius:6}}>
            <div style={{flex:1}}><div style={{fontWeight:500, color:"var(--ink)"}}>Pantry bundle · medium</div><div className="muted" style={{fontSize:11}}>Planned 60 · completed 58 · scrap 2</div></div>
            <Pill tone="good">In progress</Pill>
          </div>
        </div></div>
        <div className="card"><div className="card-body">
          <h2>Status</h2>
          <div className="col gap-8">
            <div className="row"><span className="muted">Assignee</span><span className="sp"/><div className="avatar sm green">BY</div> Bekzod Y.</div>
            <div className="row"><span className="muted">Started</span><span className="sp"/>18 Mar · 08:30</div>
            <div className="row"><span className="muted">Est. complete</span><span className="sp"/>18 Mar · 17:00</div>
          </div>
          <div className="progress mt-16"><span style={{width:"72%"}}/></div>
          <div className="muted mt-4" style={{fontSize:11}}>72% of planned output</div>
        </div></div>
      </div>
    </Placeholder>
  );
}

function ServiceOrderDetail() {
  return (
    <Placeholder title="Work order WO-1041">
      <div className="grid" style={{gridTemplateColumns:"2fr 1fr", gap:12}}>
        <div className="card"><div className="card-body">
          <h2>Oriental Trade LLC · Delivery · Tashkent</h2>
          <p className="muted">Requested 18 March · 09:14 by Malika Karimova</p>
          <div className="divider"/>
          <div className="col gap-8">
            <div className="row"><span className="muted">Destination</span><span className="sp"/>Chilonzor district, Tashkent</div>
            <div className="row"><span className="muted">Items</span><span className="sp"/>12 units · 3 SKUs</div>
            <div className="row"><span className="muted">Value</span><span className="sp"/><span className="mono">14 500 000 UZS</span></div>
          </div>
        </div></div>
        <div className="card"><div className="card-body">
          <h2>Approvals</h2>
          <div className="col gap-8">
            <div className="row"><Pill tone="good">Requested</Pill><span className="sp"/><span className="mono muted" style={{fontSize:11}}>M. Karimova</span></div>
            <div className="row"><Pill tone="warn">Awaiting approval</Pill><span className="sp"/><span className="mono muted" style={{fontSize:11}}>Owner</span></div>
          </div>
          <div className="row mt-16"><Button variant="ghost" className="block">Decline</Button><Button variant="primary" className="block">Approve</Button></div>
        </div></div>
      </div>
    </Placeholder>
  );
}

Object.assign(window, { ProductionBOMs, ProductionOrder, ServicesKanban, ServiceOrderDetail, FinancePage, ReportsPage, TeamPage, SmbSettings });
