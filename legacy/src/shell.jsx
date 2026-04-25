// App shell: sidebars for SMB + Bank, top bar, notifications drawer, route renderer
const { useState: useStateS, useEffect: useEffectS, useMemo: useMemoS } = React;

/* ---------- Sidebars ---------- */
const SMB_NAV = [
  { section: "Overview", items: [
    { path: "/smb/home",      label: "Dashboard",   icon: "Home" },
    { path: "/smb/copilot",   label: "AI Copilot",  icon: "Sparkle", ai: true },
  ]},
  { section: "Operations", items: [
    { path: "/smb/inventory", label: "Inventory",   icon: "Box", count: 312 },
    { path: "/smb/production",label: "Production",  icon: "Factory" },
    { path: "/smb/services",  label: "Services",    icon: "Wrench" },
  ]},
  { section: "Finance", items: [
    { path: "/smb/finance/ledger",   label: "General ledger", icon: "Ledger" },
    { path: "/smb/finance/invoices", label: "Invoices",       icon: "Doc",    count: 24 },
    { path: "/smb/finance/bills",    label: "Bills",          icon: "File" },
    { path: "/smb/finance/cash",     label: "Cash flow",      icon: "Chart" },
    { path: "/smb/reports",          label: "Reports",        icon: "Download" },
  ]},
  { section: "Growth", items: [
    { path: "/smb/credit",    label: "Credit & Financing", icon: "Handshake", ai: true },
  ]},
  { section: "Admin", items: [
    { path: "/smb/team",      label: "Team",       icon: "Users" },
    { path: "/smb/settings",  label: "Settings",   icon: "Gear" },
  ]},
];

const BANK_NAV = [
  { section: "Overview", items: [
    { path: "/bank/home",      label: "Portfolio",    icon: "Home" },
    { path: "/bank/alerts",    label: "Alerts",       icon: "Alert", count: 17 },
  ]},
  { section: "Tenants", items: [
    { path: "/bank/tenants",   label: "All tenants",  icon: "Database", count: "2 347" },
    { path: "/bank/tenant-mgmt",label:"Tenant mgmt",  icon: "Layers" },
  ]},
  { section: "Credit", items: [
    { path: "/bank/credit-queue", label: "Credit queue", icon: "Inbox", count: 8 },
    { path: "/bank/cross-sell",   label: "Cross-sell",   icon: "Sparkle", ai: true },
  ]},
  { section: "Analytics", items: [
    { path: "/bank/reports",    label: "Reports",      icon: "Chart" },
  ]},
  { section: "Platform", items: [
    { path: "/bank/team",       label: "Bank team",    icon: "Users" },
    { path: "/bank/settings",   label: "Platform",     icon: "Gear" },
    { path: "/bank/audit",      label: "Audit log",    icon: "Shield" },
  ]},
];

function Sidebar({ surface, setSurface, path, go }) {
  const nav = surface === "smb" ? SMB_NAV : BANK_NAV;
  return (
    <aside className="sidebar">
      <div className="sidebar-head">
        <div className="logo">
          <div className="logo-mark">S</div>
          <div className="logo-word">SQB <span className="dim">Business OS</span></div>
        </div>
      </div>
      <div className="surface-switch">
        <button className={surface === "smb" ? "active" : ""}
                onClick={() => { setSurface("smb"); go("/smb/home"); }}>SMB</button>
        <button className={surface === "bank" ? "active" : ""}
                onClick={() => { setSurface("bank"); go("/bank/home"); }}>Bank</button>
      </div>
      <nav className="nav">
        {nav.map((group, gi) => (
          <div className="nav-group" key={gi}>
            <div className="nav-label">{group.section}</div>
            {group.items.map((it) => {
              const IconC = Icon[it.icon] || Icon.Home;
              const active = path.startsWith(it.path);
              return (
                <div key={it.path} className={`nav-item ${active ? "active" : ""}`} onClick={() => go(it.path)}>
                  <span className="ico"><IconC size={15}/></span>
                  <span>{it.label}</span>
                  {it.count != null && <span className="count mono">{it.count}</span>}
                  {it.ai && <span className="dot-ai" title="AI-powered"/>}
                </div>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="sidebar-foot">
        {surface === "smb" ? (
          <>
            <div className="avatar warm">JA</div>
            <div className="you">
              <div className="name">Jasur Azimov</div>
              <div className="role">OWNER · KAMOLOT SAVDO</div>
            </div>
          </>
        ) : (
          <>
            <div className="avatar cool">MK</div>
            <div className="you">
              <div className="name">Malika Karimova</div>
              <div className="role">CREDIT OFFICER · SQB</div>
            </div>
          </>
        )}
        <button className="icon-btn" title="Sign out" onClick={() => window.AuthRuntime.logout().finally(() => go("/login"))}><Icon.Logout size={14}/></button>
      </div>
    </aside>
  );
}

/* ---------- Top bar ---------- */
function Topbar({ crumbs, onNotif, onSearch }) {
  return (
    <header className="topbar">
      <div className="crumbs">
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="sep">/</span>}
            <span className={i === crumbs.length-1 ? "cur" : ""}>{c}</span>
          </React.Fragment>
        ))}
      </div>
      <div className="topbar-spacer"/>
      <button className="search" onClick={onSearch} style={{cursor:"pointer"}}>
        <Icon.Search size={13}/>
        <span style={{flex:1, color:"var(--muted)"}}>Search tenants, SKUs, invoices…</span>
        <span className="kbd">⌘K</span>
      </button>
      <button className="icon-btn" onClick={onNotif} title="Notifications">
        <Icon.Bell size={15}/>
        <span className="unread"/>
      </button>
      <button className="icon-btn" title="Help"><Icon.Help size={15}/></button>
    </header>
  );
}

/* ---------- Notifications drawer ---------- */
function NotifDrawer({ open, onClose }) {
  return (
    <Drawer open={open} onClose={onClose} title="Notifications"
      footer={<><Button variant="ghost" size="sm">Mark all read</Button><Button variant="ghost" size="sm">Settings</Button></>}>
      <div className="col gap-8">
        <Banner tone="ai" title="AI Copilot ready">Your weekly cash-flow summary is available.</Banner>
        {NOTIFS.map((n, i) => (
          <div key={i} className="row hairline" style={{padding:"10px 12px", borderRadius:6, alignItems:"flex-start", gap:10}}>
            <span className={`pill ${n.tone}`} style={{minWidth:44, justifyContent:"center"}}>{n.t}</span>
            <div style={{flex:1}}>{n.text}</div>
          </div>
        ))}
      </div>
    </Drawer>
  );
}

/* ---------- Search palette ---------- */
function SearchPalette({ open, onClose, go }) {
  const [q, setQ] = useStateS("");
  const items = [
    { group:"SMBs",       items:["Kamolot Savdo","Oriental Trade","Zamon Foods","Nur Auto Parts","Silk Road Textiles","Bukhara Pharma"] },
    { group:"Invoices",   items:["INV-1482 · Oriental Trade","INV-1481 · Zamon Foods","INV-1477 · Retail Centre"] },
    { group:"Loan apps",  items:["LA-2398 · Kamolot · 180M","LA-2396 · Silk Road · 240M","LA-2395 · Nur Auto · 95M"] },
    { group:"Actions",    items:["Create invoice","Scan waybill","Apply for loan","Switch to Bank console"] },
  ];
  const filt = (arr) => !q ? arr : arr.filter(x => x.toLowerCase().includes(q.toLowerCase()));
  if (!open) return null;
  return (
    <>
      <div className="scrim" onClick={onClose}/>
      <div className="modal lg" style={{top:"15%", transform:"translateX(-50%)"}}>
        <div className="modal-head" style={{padding:0}}>
          <div className="row" style={{flex:1, padding:"12px 14px"}}>
            <Icon.Search size={15}/>
            <input autoFocus className="input" style={{border:0, boxShadow:"none"}}
              placeholder="Search everything…" value={q} onChange={(e)=>setQ(e.target.value)}/>
            <span className="kbd">esc</span>
          </div>
        </div>
        <div className="modal-body" style={{padding:0, maxHeight:440, overflowY:"auto"}}>
          {items.map(g => filt(g.items).length > 0 && (
            <div key={g.group} style={{padding:"6px 0"}}>
              <div className="eyebrow" style={{padding:"6px 16px"}}>{g.group}</div>
              {filt(g.items).map((i, idx) => (
                <div key={idx} className="row" style={{padding:"8px 16px", cursor:"pointer"}}
                     onClick={() => { onClose(); }}>
                  <Icon.ArrowUpR size={13} className="muted"/>
                  <span>{i}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* ---------- App shell ---------- */
function AppShell({ surface, setSurface, path, go, crumbs, children }) {
  const [notif, setNotif] = useStateS(false);
  const [search, setSearch] = useStateS(false);
  useEffectS(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setSearch(true); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);
  return (
    <div className="app">
      <Sidebar surface={surface} setSurface={setSurface} path={path} go={go}/>
      <div className="main">
        <Topbar crumbs={crumbs} onNotif={() => setNotif(true)} onSearch={() => setSearch(true)}/>
        <div className="content">{children}</div>
      </div>
      <NotifDrawer open={notif} onClose={() => setNotif(false)}/>
      <SearchPalette open={search} onClose={() => setSearch(false)} go={go}/>
    </div>
  );
}

Object.assign(window, { Sidebar, Topbar, AppShell, SMB_NAV, BANK_NAV });
