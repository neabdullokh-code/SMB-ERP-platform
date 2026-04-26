// App shell: sidebars for SMB + Bank, top bar, notifications drawer, route renderer
const { useState: useStateS, useEffect: useEffectS, useMemo: useMemoS } = React;

/* ---------- Sidebars ---------- */
const SMB_NAV = [
  { section: "ОБЗОР", items: [
    { path: "/smb/home",      label: "Панель управления",   icon: "Home" },
    { path: "/smb/copilot",   label: "ИИ-ассистент",  icon: "Sparkle", ai: true },
  ]},
  { section: "Операции", items: [
    { path: "/smb/inventory", label: "Склад",   icon: "Box" },
    { path: "/smb/production",label: "Производство",  icon: "Factory" },
    { path: "/smb/services",  label: "Сервисы",     icon: "Wrench" },
  ]},
  { section: "Финансы", items: [
    { path: "/smb/finance/bills",    label: "Закупка",        icon: "File" },
    { path: "/smb/finance/invoices", label: "Продажи",        icon: "Doc" },
    { path: "/smb/finance/payments", label: "Счета и Платежи", icon: "Coin" },
    { path: "/smb/finance/cash",     label: "Денежный поток", icon: "Chart" },
    { path: "/smb/finance/ledger",   label: "Главная книга",  icon: "Ledger" },
    { path: "/smb/reports",          label: "Отчёты",         icon: "Download" },
  ]},
  { section: "Рост", items: [
    { path: "/smb/credit",    label: "Кредитование и финансирование", icon: "Handshake", ai: true },
  ]},
  { section: "Администрирование", items: [
    { path: "/smb/team",      label: "Команда",       icon: "Users" },
    { path: "/smb/settings",  label: "Настройки",   icon: "Gear" },
  ]},
];

const BANK_NAV = [
  { section: "ОБЗОР", items: [
    { path: "/bank/home",      label: "Портфель",    icon: "Home" },
    { path: "/bank/alerts",    label: "Оповещения",       icon: "Alert" },
  ]},
  { section: "КЛИЕНТЫ", items: [
    { path: "/bank/tenants",   label: "Все клиенты",  icon: "Database" },
    { path: "/bank/tenant-mgmt",label:"Управление клиентами",  icon: "Layers" },
  ]},
  { section: "КРЕДИТ", items: [
    { path: "/bank/credit-queue", label: "Кредитная очередь", icon: "Inbox" },
    { path: "/bank/cross-sell",   label: "Кросс-продажи",   icon: "Sparkle", ai: true },
  ]},
  { section: "АНАЛИТИКА", items: [
    { path: "/bank/reports",    label: "Отчёты",      icon: "Chart" },
  ]},
  { section: "ПЛАТФОРМА", items: [
    { path: "/bank/team",       label: "Команда банка",    icon: "Users" },
    { path: "/bank/settings",   label: "Платформа",     icon: "Gear" },
    { path: "/bank/audit",      label: "Журнал аудита",    icon: "Shield" },
  ]},
];

function Sidebar({ surface, path, go, session }) {
  const [navCounts, setNavCounts] = useStateS({
    smbInventory: null,
    smbInvoices: null,
    bankAlerts: null,
    bankTenants: null,
    bankCreditQueue: null
  });
  const nav = useMemoS(() => {
    const source = surface === "smb" ? SMB_NAV : BANK_NAV;
    const auth = window.AuthRuntime;

    if (!auth || !session) {
      return source.map((group) => ({ ...group, items: [...group.items] }));
    }

    return source
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => auth.canAccessRoute(item.path, session))
      }))
      .filter((group) => group.items.length > 0);
  }, [session, surface]);

  useEffectS(() => {
    let cancelled = false;

    if (!session) {
      setNavCounts({
        smbInventory: null,
        smbInvoices: null,
        bankAlerts: null,
        bankTenants: null,
        bankCreditQueue: null
      });
      return undefined;
    }

    (async () => {
      try {
        const response = await fetch("/api/bootstrap/summary", {
          method: "GET",
          credentials: "include",
          cache: "no-store"
        });
        const body = await response.json();
        if (!response.ok || !body?.data) {
          throw new Error(body?.message || body?.error?.message || "Unable to load sidebar counts.");
        }

        if (!cancelled) {
          setNavCounts({
            smbInventory: body.data.inventoryCount ?? null,
            smbInvoices: body.data.invoiceCount ?? null,
            bankAlerts: body.data.alertCount ?? null,
            bankTenants: body.data.tenantCount ?? null,
            bankCreditQueue: body.data.creditQueueCount ?? null
          });
        }
      } catch {
        if (!cancelled) {
          setNavCounts({
            smbInventory: null,
            smbInvoices: null,
            bankAlerts: null,
            bankTenants: null,
            bankCreditQueue: null
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session, surface]);

  const sessionActor = session && session.actor ? session.actor : null;
  const actorName = sessionActor && sessionActor.name ? sessionActor.name : surface === "smb" ? "Jasur Azimov" : "Malika Karimova";
  const actorRole = sessionActor && (sessionActor.workspaceRole || sessionActor.role)
    ? String(sessionActor.workspaceRole || sessionActor.role).replace(/_/g, " ").toUpperCase()
    : surface === "smb" ? "ВЛАДЕЛЕЦ" : "КРЕДИТНЫЙ ОФИЦЕР";
  const actorTenant = surface === "smb" ? "РАБОЧЕЕ ПРОСТРАНСТВО" : "SQB";
  const actorInitials = actorName.split(" ").filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "SQ";

  return (
    <aside className="sidebar">
      <div className="sidebar-head">
        <div className="logo">
          <div className="logo-mark">S</div>
          <div className="logo-word">SQB <span className="dim">Business OS</span></div>
        </div>
      </div>
      <div className="surface-switch" aria-hidden="true" style={{ gridTemplateColumns: "1fr" }}>
        <button className={surface === "smb" ? "active" : ""} disabled>
          {surface === "smb" ? "Рабочее пространство SMB" : "Рабочее пространство банка"}
        </button>
      </div>
      <nav className="nav">
        {nav.map((group, gi) => (
          <div className="nav-group" key={gi}>
            <div className="nav-label">{group.section}</div>
            {group.items.map((it) => {
              const IconC = Icon[it.icon] || Icon.Home;
              const active = path.startsWith(it.path);
              const resolvedCount =
                it.path === "/smb/inventory" ? navCounts.smbInventory :
                it.path === "/smb/finance/invoices" ? navCounts.smbInvoices :
                it.path === "/bank/alerts" ? navCounts.bankAlerts :
                it.path === "/bank/tenants" ? navCounts.bankTenants :
                it.path === "/bank/credit-queue" ? navCounts.bankCreditQueue :
                null;
              return (
                <div key={it.path} className={`nav-item ${active ? "active" : ""}`} onClick={() => go(it.path)}>
                  <span className="ico"><IconC size={15}/></span>
                  <span>{it.label}</span>
                  {resolvedCount != null && <span className="count mono">{resolvedCount}</span>}
                  {it.ai && <span className="dot-ai" title="С поддержкой ИИ"/>}
                </div>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="sidebar-foot">
        <div
          className="row"
          style={{ flex: 1, minWidth: 0, gap: 10, alignItems: "center", cursor: "pointer" }}
          onClick={() => go(surface === "smb" ? "/smb/profile" : "/bank/profile")}
          title="Открыть профиль"
        >
          {surface === "smb" ? (
            <>
              <div className="avatar warm">{actorInitials}</div>
              <div className="you">
                <div className="name">{actorName}</div>
                <div className="role">{actorRole} | {actorTenant}</div>
              </div>
            </>
          ) : (
            <>
              <div className="avatar cool">{actorInitials}</div>
              <div className="you">
                <div className="name">{actorName}</div>
                <div className="role">{actorRole} | SQB</div>
              </div>
            </>
          )}
        </div>
        <button className="icon-btn" title="Выйти" onClick={() => window.AuthRuntime.logout().finally(() => go("/login"))}><Icon.Logout size={14}/></button>
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
        <span style={{flex:1, color:"var(--muted)"}}>Поиск арендаторов, SKU, счетов...</span>
        <span className="kbd">Ctrl+K</span>
      </button>
      <button className="icon-btn" onClick={onNotif} title="Уведомления">
        <Icon.Bell size={15}/>
        <span className="unread"/>
      </button>
      <button className="icon-btn" title="Помощь"><Icon.Help size={15}/></button>
    </header>
  );
}

/* ---------- Notifications drawer ---------- */
function NotifDrawer({ open, onClose }) {
  const translateNotifText = (text) => {
    if (text === "Oriental Trade paid invoice INV-1482 · 14 500 000 UZS") {
      return "Oriental Trade оплатил счёт INV-1482 · 14 500 000 UZS";
    }
    if (text === "ИИ-ассистент: cash-flow report ready") {
      return "ИИ-ассистент: отчёт по денежному потоку готов";
    }
    if (text === "Stock alert: Sugar refined 50kg below min") {
      return "Оповещение по складу: Sugar refined 50kg ниже минимума";
    }
    return text;
  };

  const translateNotifTime = (timeLabel) => {
    if (typeof timeLabel !== "string") return timeLabel;
    return timeLabel.replace(/m$/, "м").replace(/h$/, "ч");
  };

  return (
    <Drawer open={open} onClose={onClose} title="Уведомления"
      footer={<><Button variant="ghost" size="sm">Отметить все как прочитанные</Button><Button variant="ghost" size="sm">Настройки</Button></>}>
      <div className="col gap-8">
        <Banner tone="ai" title="ИИ-ассистент готов">Ваш еженедельный свод по денежному потоку доступен.</Banner>
        {NOTIFS.map((n, i) => (
          <div key={i} className="row hairline" style={{padding:"10px 12px", borderRadius:6, alignItems:"flex-start", gap:10}}>
            <span className={`pill ${n.tone}`} style={{minWidth:44, justifyContent:"center"}}>{translateNotifTime(n.t)}</span>
            <div style={{flex:1}}>{translateNotifText(n.text)}</div>
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
    { group:"SMB",       items:["Kamolot Savdo","Oriental Trade","Zamon Foods","Nur Auto Parts","Оптовый текстиль","Bukhara Pharma"] },
    { group:"Счета",   items:["INV-1482 | Oriental Trade","INV-1481 | Zamon Foods","INV-1477 | Retail Centre"] },
    { group:"Кредитные заявки",  items:["LA-2398 | Kamolot | 180M","LA-2396 | Silk Road | 240M","LA-2395 | Nur Auto | 95M"] },
    { group:"Действия",    items:["Создать счёт","Сканировать накладную","Подать заявку на кредит","Переключиться в банковскую консоль"] },
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
              placeholder="Поиск по всему..." value={q} onChange={(e)=>setQ(e.target.value)}/>
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
function AppShell({ surface, setSurface, path, go, crumbs, children, session }) {
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
      <Sidebar surface={surface} path={path} go={go} session={session}/>
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
