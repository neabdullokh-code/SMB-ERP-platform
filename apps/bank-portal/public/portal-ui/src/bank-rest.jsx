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
          throw new Error(portfolioBody?.message || analyticsBody?.message || "Не удалось загрузить аналитику рисков.");
        }
        setPortfolio(portfolioBody?.data?.tenants || []);
        setAnalytics(analyticsBody?.data?.analytics || null);
        setError("");
      } catch (loadError) {
        if (!cancelled) {
          setPortfolio([]);
          setAnalytics(null);
          setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить аналитику рисков.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const fallbackBucketCounts = portfolio.reduce((acc, tenant) => {
    const risk = tenant?.inventoryRisk;
    if (risk === "low" || risk === "moderate" || risk === "high") acc[risk] += 1;
    return acc;
  }, { low: 0, moderate: 0, high: 0 });

  const totalTenants = Math.max(Number(analytics?.totalTenants) || 0, portfolio.length);
  const bucketCounts = (analytics?.riskBuckets?.low ?? analytics?.riskBuckets?.moderate ?? analytics?.riskBuckets?.high) == null
    ? fallbackBucketCounts
    : {
        low: Number(analytics?.riskBuckets?.low) || 0,
        moderate: Number(analytics?.riskBuckets?.moderate) || 0,
        high: Number(analytics?.riskBuckets?.high) || 0
      };
  const highRiskCount = Math.min(
    totalTenants,
    Math.max(0, Number(analytics?.highRiskCount) || bucketCounts.high)
  );
  const highRiskShare = totalTenants > 0 ? Math.round((highRiskCount / totalTenants) * 100) : 0;
  const moderateShare = totalTenants > 0 ? Math.round((bucketCounts.moderate / totalTenants) * 100) : 0;
  const averageCreditScore = Number.isFinite(Number(analytics?.averageCreditScore))
    ? Number(analytics.averageCreditScore)
    : (portfolio.length > 0
      ? Number((portfolio.reduce((sum, tenant) => sum + (Number(tenant?.creditScore) || 0), 0) / portfolio.length).toFixed(1))
      : 0);
  const slaHealthPercent = Number.isFinite(Number(analytics?.slaHealthPercent))
    ? Number(analytics.slaHealthPercent)
    : 100;
  const reviewCount = Number(analytics?.recommendationCounts?.review) || portfolio.filter((tenant) => tenant?.recommendedAction === "review").length;

  const trendByThreshold = (value, threshold, reverse = false) => (
    reverse ? (value <= threshold ? "up" : "down") : (value >= threshold ? "up" : "down")
  );

  const buildDelinquencyRow = (highPct, moderatePct) => {
    const high = Math.max(0, Math.min(100, Math.round(highPct)));
    const moderate = Math.max(0, Math.min(100 - high, Math.round(moderatePct)));
    const severe = Math.round(high * 0.58);
    const defaulted = high - severe;
    const current = Math.max(0, 100 - moderate - severe - defaulted);
    return [current, moderate, severe, defaulted];
  };

  const delinquencyData = [-4, -2, -1, 0, 1, 2].map((delta) => {
    const projectedHigh = Math.max(0, Math.min(100, highRiskShare + delta));
    const projectedModerate = Math.max(0, Math.min(100 - projectedHigh, moderateShare + Math.round(delta / 2)));
    return buildDelinquencyRow(projectedHigh, projectedModerate);
  });

  const concentration = Object.entries(
    portfolio.reduce((acc, tenant) => {
      const key = tenant.industry || "Другое";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  return (
    <div className="page">
      <div className="page-head">
        <div><h1>Риск портфеля</h1><div className="sub">{loading ? "Загрузка аналитики рисков в реальном времени..." : "Концентрация, просрочка и прогноз дефолта на основе живых данных арендаторов"}</div></div>
        <span className="sp"/>
        <Button variant="ghost" icon={<Icon.Download size={13}/>}>Экспорт</Button>
      </div>
      {error && <Banner tone="warn" title="Аналитика рисков недоступна">{error}</Banner>}
      <div className="grid grid-4 mb-16">
        <Kpi label="Всего арендаторов" value={String(totalTenants)} delta={`${highRiskCount} высокий риск`} trend={trendByThreshold(highRiskCount, Math.round(totalTenants * 0.2), true)}/>
        <Kpi label="Доля высокого риска" value={`${highRiskShare}%`} delta={`${bucketCounts.high || 0} высокий сегмент`} trend={trendByThreshold(highRiskShare, 20, true)}/>
        <Kpi label="Средний балл" value={String(averageCreditScore)} delta={`${bucketCounts.moderate || 0} умеренный риск`} trend={trendByThreshold(averageCreditScore, 70)}/>
        <Kpi label="Состояние SLA" value={`${slaHealthPercent}%`} delta={`${reviewCount} рекомендаций к проверке`} trend={trendByThreshold(slaHealthPercent, 90)}/>
      </div>
      <div className="grid" style={{gridTemplateColumns:"2fr 1fr", gap:12}}>
        <div className="card card-pad-0">
          <div className="panel-title">Водопад просрочки · последние 6 месяцев</div>
          <div style={{padding:14}}>
            <StackedBar width={760} height={220}
              data={delinquencyData}
              categories={REVENUE_LABELS}
              colors={["var(--good)","var(--warn)","var(--bad)","var(--fg)"]}/>
            <div className="row gap-16 mt-8 mono muted" style={{fontSize:10}}>
              <span><span style={{display:"inline-block", width:8, height:8, background:"var(--good)", marginRight:6}}/>Текущие</span>
              <span><span style={{display:"inline-block", width:8, height:8, background:"var(--warn)", marginRight:6}}/>30 дней</span>
              <span><span style={{display:"inline-block", width:8, height:8, background:"var(--bad)", marginRight:6}}/>60 дней</span>
              <span><span style={{display:"inline-block", width:8, height:8, background:"var(--fg)", marginRight:6}}/>90+ дефолт</span>
            </div>
          </div>
        </div>
        <div className="card card-pad-0">
          <div className="panel-title">Риск концентрации</div>
          <div style={{padding:14}}>
            {concentration.map((entry, i) => {
              const pct = Math.round((entry[1] / Math.max(totalTenants, 1)) * 100);
              const tone = pct >= 22 ? "warn" : pct >= 12 ? "info" : "good";
              return (
              <div key={i} className="mb-12">
                <div className="row" style={{fontSize:12}}><span>{entry[0]}</span><span className="sp"/><span className="mono muted">{pct}%</span></div>
                <div className="progress mt-4"><span style={{width:`${Math.min(100, pct * 3.5)}%`, background: tone==="warn"?"var(--warn)":tone==="good"?"var(--good)":"var(--info)"}}/></div>
              </div>
            )})}
            {concentration.length === 0 && <div className="muted mono">Данные по концентрации отсутствуют.</div>}
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
          setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить оповещения.");
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
        <div><h1>Оповещения и аномалии</h1><div className="sub">{loading ? "Загрузка аномалий в реальном времени..." : "Паттерны, обнаруженные ИИ по всем клиентам"}</div></div>
        <span className="sp"/>
        <Button variant="ghost" icon={<Icon.Filter size={13}/>}>Фильтр</Button>
      </div>
      {error && <Banner tone="warn" title="Оповещения недоступны">{error}</Banner>}
      <div className="row mb-12" style={{gap:4}}>
        <span className="chip" style={{background:"var(--ink)", color:"var(--surface)", borderColor:"var(--ink)"}}>Все <span className="mono" style={{opacity:0.7, marginLeft:4}}>{alerts.length}</span></span>
        <span className="chip">Критично <span style={{color:"var(--bad)", marginLeft:4}}>{summary.critical || 0}</span></span>
        <span className="chip">Предупреждения <span style={{color:"var(--warn)", marginLeft:4}}>{summary.warn || 0}</span></span>
        <span className="chip">Инфо <span style={{color:"var(--ai)", marginLeft:4}}>{summary.info || 0}</span></span>
      </div>
      <div className="card card-pad-0">
        {loading && <div className="muted mono" style={{padding:16}}>Загрузка оповещений…</div>}
        {!loading && alerts.length === 0 && <div className="muted mono" style={{padding:16}}>Активных оповещений нет.</div>}
        {alerts.map((a, i) => (
          <div key={i} className="hairline-b" style={{padding:"14px 16px", display:"grid", gridTemplateColumns:"auto 1fr auto auto", gap:14, alignItems:"flex-start"}}>
            <Pill tone={a.severity === "critical" ? "bad" : a.severity === "warn" ? "warn" : "info"} dot={false}>
              {a.severity === "critical" ? "КРИТИЧНО" : a.severity === "warn" ? "ПРЕДУПРЕЖДЕНИЕ" : "ИНФО"}
            </Pill>
            <div>
              <div className="row gap-8"><span style={{fontSize:13, color:"var(--ink)", fontWeight:500}}>{String(a.type || "").replace(/_/g, " ")}</span><span className="sep-dot"/><span className="muted">{a.tenantName}</span></div>
              <div className="muted mt-4" style={{fontSize:12, lineHeight:1.5}}>{a.message}</div>
            </div>
            <span className="mono muted" style={{fontSize:10}}>{new Date(a.triggeredAt).toLocaleString()}</span>
            <Button size="sm" variant="ghost" onClick={() => go("/bank/tenant")}>Открыть клиента <Icon.ChevRight size={12}/></Button>
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
  const roleLabel = (role) => role === "super_admin" ? "Суперадмин" : "Администратор банка";
  const translateTeamError = (message) => {
    if (!message) return "Не удалось загрузить команду банка.";
    if (message === "Super admin access required.") return "Требуется доступ суперадмина.";
    if (message === "Unable to load bank team.") return "Не удалось загрузить команду банка.";
    return message;
  };
  const relativeTime = (value) => {
    if (!value) return "никогда";
    const diff = Date.now() - new Date(value).getTime();
    if (!Number.isFinite(diff) || diff < 60 * 1000) return "только что";
    if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))} мин назад`;
    if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))} ч назад`;
    return `${Math.floor(diff / (24 * 60 * 60 * 1000))} дн назад`;
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
          setError(translateTeamError(body.message));
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
          setError("Не удалось загрузить команду банка.");
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
      <div className="page-head"><div><h1>Команда банка</h1></div><span className="sp"/><Button variant="primary" icon={<Icon.UserPlus size={13}/>}>Пригласить</Button></div>
      <div className="card card-pad-0">
        <table className="tbl">
          <thead><tr><th>Имя</th><th>Роль</th><th>E-mail</th><th>Последняя активность</th><th/></tr></thead>
          <tbody>{loading ? (
            <tr><td colSpan="5" className="dim mono">Загрузка команды банка...</td></tr>
          ) : T.map((x,i) =>
            <tr key={i}>
              <td><div className="row gap-8"><div className={`avatar sm ${x.c}`}>{x.n.split(" ").map(w=>w[0]).join("")}</div><span style={{color:"var(--ink)", fontWeight:500}}>{x.n}</span></div></td>
              <td className="dim">{x.r}</td>
              <td className="dim mono">{x.e}</td>
              <td className="dim mono">{x.q}</td>
              <td className="row-actions"><Button size="sm" variant="ghost">Управление</Button></td>
            </tr>)}{!loading && T.length === 0 && <tr><td colSpan="5" className="dim mono">Сотрудники банка не найдены.</td></tr>}</tbody>
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
        setError(eventsBody.message || "Не удалось загрузить события аудита.");
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
      setError("Не удалось загрузить события аудита.");
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
    if (!value) return "Неизвестно";
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
          <h1>Журнал аудита</h1>
          <div className="sub">События безопасности, рабочих процессов и мониторинга в рабочем пространстве банка</div>
        </div>
        <span className="sp"/>
        <Button variant="ghost" icon={<Icon.Refresh size={13}/>} onClick={loadAudit}>Обновить</Button>
        <Button variant="ghost" icon={<Icon.Download size={13}/>} onClick={exportAudit} disabled={loading || events.length === 0}>Экспорт</Button>
      </div>

      {error ? <div className="mb-16"><Banner tone="bad" title="Аудит недоступен">{error}</Banner></div> : null}

      <div className="grid grid-3 mb-16">
        <Kpi label="События аудита" value={events.length}/>
        <Kpi label="Break-glass события" value={breakGlassEvents.length}/>
        <Kpi label="Роль просмотра" value={isSuperAdmin ? "Суперадмин" : "Администратор банка"}/>
      </div>

      <div className="card card-pad-0">
        <div className="panel-title">Журнал аудита платформы</div>
        <table className="tbl">
          <thead><tr><th>Время</th><th>Категория</th><th>Действие</th><th>Инициатор</th><th>Ресурс</th></tr></thead>
          <tbody>
            {loading && (
              <tr><td colSpan="5" className="dim mono">Загрузка событий аудита...</td></tr>
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
              <tr><td colSpan="5" className="dim mono">События аудита не найдены.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isSuperAdmin && (
        <div className="card card-pad-0 mt-16">
          <div className="panel-title">Контроль break-glass</div>
          <table className="tbl">
            <thead><tr><th>Время</th><th>Действие</th><th>Инициатор</th><th>Ресурс</th></tr></thead>
            <tbody>
              {loading && (
                <tr><td colSpan="4" className="dim mono">Загрузка break-glass событий...</td></tr>
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
  const formatSettingsError = (error, fallbackMessage) => {
    if (!(error instanceof Error) || !error.message) return fallbackMessage;
    if (error.message.includes("Unexpected end of JSON input")) {
      return "Сервер вернул некорректные данные. Обновите страницу и попробуйте снова.";
    }
    return error.message;
  };

  const canManageOthers = Boolean(profile && (
    profile.role === "super_admin" ||
    profile.role === "bank_admin" ||
    (Array.isArray(profile.permissions) && profile.permissions.includes("tenant.manage"))
  ));

  const relativeTime = (value) => {
    if (!value) return "никогда";
    const diff = Date.now() - new Date(value).getTime();
    if (!Number.isFinite(diff) || diff < 60 * 1000) return "только что";
    if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))} мин назад`;
    if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))} ч назад`;
    return `${Math.floor(diff / (24 * 60 * 60 * 1000))} дн назад`;
  };

  const loadProfile = async () => {
    const response = await fetch("/api/profile/me", { method: "GET", credentials: "include", cache: "no-store" });
    const body = await response.json();
    if (!response.ok || !body.profile) {
      throw new Error(body.message || "Не удалось загрузить профиль.");
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
        setSecurityError(body.message || "Не удалось загрузить настройки привилегированного доступа.");
        return;
      }
      setSecurity(body.settings);
    } catch (error) {
      setSecurity(null);
      setSecurityError(formatSettingsError(error, "Не удалось загрузить настройки привилегированного доступа."));
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
        setSecurityError(formatSettingsError(error, "Не удалось загрузить настройки."));
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
          setSecurityInfo("Смена e-mail подтверждена.");
          await loadProfile();
        } else {
          setSecurityError(body.message || "Не удалось подтвердить e-mail.");
        }
      } catch (error) {
        setSecurityError(formatSettingsError(error, "Не удалось подтвердить e-mail."));
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
        setSecurityError(body.message || "Не удалось обновить настройки привилегированного доступа.");
        return;
      }
      setSecurity(body.settings);
      setSecurityInfo(nextValue
        ? "Вход через приложение-аутентификатор теперь обязателен для этого супер-админа."
        : "Вход через приложение-аутентификатор теперь необязателен для этого супер-админа.");
    } catch (error) {
      setSecurityError(formatSettingsError(error, "Не удалось обновить настройки привилегированного доступа."));
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
        throw new Error(body.message || "Не удалось сохранить профиль.");
      }
      setProfile(body.profile);
      setSecurityInfo("Профиль обновлён.");
      await loadProfiles();
    } catch (error) {
      setSecurityError(formatSettingsError(error, "Не удалось сохранить профиль."));
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
        throw new Error(body.message || "Не удалось загрузить аватар.");
      }
      setProfileForm((prev) => ({ ...prev, avatarStorageKey: body.avatarStorageKey, avatarUrl: body.avatarUrl }));
      setSecurityInfo("Аватар загружен. Сохраните профиль, чтобы применить изменения.");
    } catch (error) {
      setSecurityError(formatSettingsError(error, "Не удалось загрузить аватар."));
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
        throw new Error(body.message || "Не удалось обновить профиль сотрудника.");
      }
      setManageModal((prev) => ({ ...prev, open: false }));
      setSecurityInfo("Профиль сотрудника обновлён.");
      await loadProfiles();
    } catch (error) {
      setSecurityError(formatSettingsError(error, "Не удалось обновить профиль сотрудника."));
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
        throw new Error(body.message || "Не удалось запросить смену e-mail.");
      }
      setEmailModal((prev) => ({ ...prev, open: false }));
      setSecurityInfo(body.verificationPreviewUrl
        ? `Письмо отправлено. Демо-ссылка: ${body.verificationPreviewUrl}`
        : "Письмо для подтверждения отправлено.");
    } catch (error) {
      setSecurityError(formatSettingsError(error, "Не удалось запросить смену e-mail."));
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="page">
      <div className="page-head"><div><h1>Settings</h1></div></div>
      <div className="tabs mb-16">
        <button className={tab === "profile" ? "active" : ""} onClick={() => setTab("profile")}>Профиль</button>
        <button className={tab === "security" ? "active" : ""} onClick={() => setTab("security")}>Безопасность</button>
      </div>
      {securityError ? <div className="mb-12"><Banner tone="bad" title="Настройки недоступны">{securityError}</Banner></div> : null}
      {securityInfo ? <div className="mb-12"><Banner tone="good" title="Настройки обновлены">{securityInfo}</Banner></div> : null}

      {tab === "profile" && (
        <div className="grid" style={{gridTemplateColumns:"1.2fr 1fr", gap:12}}>
          <div className="card"><div className="card-body">
            <h2>Мой профиль</h2>
            {loading && <div className="muted mt-8">Загрузка профиля...</div>}
            {!loading && profile && (
              <div className="col gap-10 mt-10">
                <div className="row gap-12">
                  <div className={`avatar lg ${profileForm.avatarUrl ? "" : "cool"}`} style={profileForm.avatarUrl ? { backgroundImage: `url(${profileForm.avatarUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}>
                    {!profileForm.avatarUrl ? profile.name.split(" ").filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase() : ""}
                  </div>
                  <label className="chip" style={{cursor:"pointer", width:"fit-content"}}>
                    {uploading ? "Загрузка..." : "Загрузить фото"}
                    <input type="file" accept="image/*" style={{display:"none"}} onChange={(event) => uploadAvatar(event.target.files?.[0])}/>
                  </label>
                </div>
                <Field label="ФИО">
                  <input className="input" value={profileForm.name} onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))}/>
                </Field>
                <Field label="Phone"><input className="input mono" value={profile.phone || "—"} readOnly/></Field>
                <Field label="E-mail">
                  <div className="row gap-8">
                    <input className="input" value={profile.email || "—"} readOnly/>
                    <Button variant="ghost" onClick={() => openEmailModal(profile)}>Сменить e-mail</Button>
                  </div>
                </Field>
                <div className="row mt-8">
                  <span className="sp"/>
                  <Button variant="primary" onClick={saveProfile} disabled={savingProfile || uploading}>{savingProfile ? "Сохранение..." : "Сохранить профиль"}</Button>
                </div>
              </div>
            )}
          </div></div>

          {canManageOthers && (
            <div className="card"><div className="card-body">
              <h2>Управление профилями</h2>
              <table className="tbl compact mt-10">
                <thead><tr><th>Имя</th><th>E-mail</th><th>Последняя активность</th><th/></tr></thead>
                <tbody>
                  {profiles.map((user) => (
                    <tr key={user.userId}>
                      <td style={{color:"var(--ink)", fontWeight:500}}>{user.name}</td>
                      <td className="dim mono">{user.email || "—"}</td>
                      <td className="dim mono">{relativeTime(user.lastActiveAt)}</td>
                      <td className="row-actions">
                        <Button size="sm" variant="ghost" onClick={() => openManage(user)}>Изменить</Button>
                        <Button size="sm" variant="ghost" onClick={() => openEmailModal(user)}>E-mail</Button>
                      </td>
                    </tr>
                  ))}
                  {!loading && profiles.length === 0 && <tr><td colSpan="4" className="dim mono">Профили отсутствуют.</td></tr>}
                </tbody>
              </table>
            </div></div>
          )}
        </div>
      )}

      {tab === "security" && (
        <div className="grid" style={{gridTemplateColumns:"1fr 1fr", gap:12}}>
          <div className="card"><div className="card-body">
            <h2>Привилегированный доступ</h2>
            {security ? (
              <div className="col gap-12 mt-16">
                <div className="row">
                  <span>Текущий метод</span>
                  <span className="sp"/>
                  <span className="mono muted">{security.otpMethodLabel || (security.otpMethodType === "totp_app" ? "Приложение-аутентификатор" : "Не настроено")}</span>
                </div>
                <div className="row" style={{alignItems:"flex-start", gap:16}}>
                  <div className="col gap-4" style={{maxWidth:520}}>
                    <span>Требовать приложение-аутентификатор при каждом входе</span>
                    <span className="muted" style={{fontSize:12, lineHeight:1.6}}>
                      {security.canManageTotp
                        ? "Отключите для более быстрого локального доступа супер-админа или включите снова в любой момент, чтобы вернуть проверку аутентификатором."
                        : security.isBreakGlass
                          ? "Для break-glass аккаунтов MFA через аутентификатор всегда обязательно и не может быть отключено здесь."
                          : "Только супер-админ без режима break-glass может менять это требование."}
                    </span>
                  </div>
                  <span className="sp"/>
                  <div style={{opacity: savingSecurity || !security.canManageTotp ? 0.5 : 1, pointerEvents: savingSecurity || !security.canManageTotp ? "none" : "auto"}}>
                    <Toggle on={security.totpRequired} onChange={updateSecurity}/>
                  </div>
                </div>
                {savingSecurity ? <div className="muted" style={{fontSize:12}}>Сохранение настройки привилегированного доступа...</div> : null}
              </div>
            ) : (
              <div className="muted mt-8">Загрузка настроек привилегированного доступа...</div>
            )}
          </div></div>

          <div className="card"><div className="card-body">
            <h2>Пароль</h2>
            <div className="muted mt-8" style={{fontSize:12}}>
              Смена пароля выполняется через процесс сброса.
            </div>
            <div className="mt-12">
              <Button variant="ghost" onClick={() => (window.location.hash = "/forgot")}>Открыть сброс пароля</Button>
            </div>
          </div></div>
        </div>
      )}

      <Modal
        open={emailModal.open}
        onClose={() => !savingProfile && setEmailModal((prev) => ({ ...prev, open: false }))}
        title={`Смена e-mail${emailModal.targetName ? ` · ${emailModal.targetName}` : ""}`}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEmailModal((prev) => ({ ...prev, open: false }))} disabled={savingProfile}>Отмена</Button>
            <span className="sp"/>
            <Button variant="primary" onClick={submitEmailChange} disabled={savingProfile}>{savingProfile ? "Отправка..." : "Отправить подтверждение"}</Button>
          </>
        }
      >
        <div className="col gap-10">
          <Field label="Новый e-mail"><input className="input" value={emailModal.newEmail} onChange={(e) => setEmailModal((prev) => ({ ...prev, newEmail: e.target.value }))}/></Field>
          <Field label="Ваш пароль"><input className="input" type="password" value={emailModal.password} onChange={(e) => setEmailModal((prev) => ({ ...prev, password: e.target.value }))}/></Field>
          <Field label="OTP-код (если требуется)"><input className="input mono" value={emailModal.otpCode} onChange={(e) => setEmailModal((prev) => ({ ...prev, otpCode: e.target.value }))} placeholder="Код из аутентификатора"/></Field>
        </div>
      </Modal>

      <Modal
        open={manageModal.open}
        onClose={() => !savingProfile && setManageModal((prev) => ({ ...prev, open: false }))}
        title="Редактирование профиля сотрудника"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setManageModal((prev) => ({ ...prev, open: false }))} disabled={savingProfile}>Отмена</Button>
            <span className="sp"/>
            <Button variant="primary" onClick={saveManagedProfile} disabled={savingProfile}>{savingProfile ? "Сохранение..." : "Сохранить профиль сотрудника"}</Button>
          </>
        }
      >
        <div className="col gap-10">
          <Field label="ФИО"><input className="input" value={manageModal.name} onChange={(e) => setManageModal((prev) => ({ ...prev, name: e.target.value }))}/></Field>
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
    export: "Экспорт",
    composerPlaceholder: "Спросите о кредитных рисках, клиентах, очереди заявок или концентрации портфеля...",
    attach: "Прикрепить",
    portfolioData: "Данные портфеля",
    send: "Отправить",
    stop: "Остановить",
    modelTag: "SQB AI · анализ",
    groundedNote: "Ответы основаны на актуальных данных портфеля. Проверяйте перед принятием кредитных решений.",
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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const UUID_EMBEDDED_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
const UUID_KEYS = new Set(["tenantId", "id", "alertId", "userId", "assignedBankUserId", "assignedBankUserid"]);

function sanitizeForAI(obj) {
  if (Array.isArray(obj)) return obj.map(sanitizeForAI);
  if (obj && typeof obj === "object") {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      if (UUID_KEYS.has(k)) continue;
      if (typeof v === "string" && UUID_EMBEDDED_RE.test(v)) continue;
      out[k] = sanitizeForAI(v);
    }
    return out;
  }
  return obj;
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
    return sanitizeForAI({
      analytics: analyticsBody?.data?.analytics ?? null,
      alerts: alertsBody?.data?.alerts?.slice(0, 20) ?? [],
      alertsSummary: alertsBody?.data?.summary ?? null,
    });
  } catch {
    return null;
  }
}

function BankCopilotPage({ go, lang = "ru" }) {
  const t = BANK_COPILOT_I18N[lang] || BANK_COPILOT_I18N.ru;
  const session = window.AuthRuntime && window.AuthRuntime.getCachedSession && window.AuthRuntime.getCachedSession();
  const userId = session?.userId || "bank-default";
  const userInitials = (() => {
    const name = session?.name || session?.email || "";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    if (parts[0]) return parts[0].slice(0, 2).toUpperCase();
    return "BA";
  })();

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

  const renderThreadRow = (th) => {
    const title = bankCopilotThreadTitle(th);
    const isActive = th.id === activeThreadId;
    return (
      <div
        key={th.id}
        className={`nav-item ${isActive ? "active" : ""}`}
        style={{ fontSize: 12.5, gap: 8, position: "relative", paddingRight: 26 }}
        onClick={() => selectThread(th.id)}
        title={title}
      >
        <span className="ico">
          {isActive ? <Icon.Sparkle size={12} style={{ color: "var(--ai)" }}/> : <Icon.Hash size={12}/>}
        </span>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{title}</span>
        <button
          className="icon-btn"
          aria-label={t.deleteThread}
          onClick={(e) => { e.stopPropagation(); if (window.confirm(t.confirmDelete)) deleteThread(th.id); }}
          style={{ position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)", padding: 2 }}
        >
          <Icon.Trash size={11}/>
        </button>
      </div>
    );
  };

  const renderMessage = (m, i) => {
    if (m.role === "user") {
      return (
        <div key={i} className="row" style={{ justifyContent: "flex-end", marginBottom: 16 }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "14px 14px 2px 14px", padding: "10px 14px", maxWidth: 520, whiteSpace: "pre-wrap" }}>
            {m.content}
          </div>
          <div className="avatar warm" style={{ width: 28, height: 28, marginLeft: 10 }}>{userInitials}</div>
        </div>
      );
    }
    return (
      <div key={i} style={{ display: "grid", gridTemplateColumns: "28px 1fr", gap: 10, marginBottom: 16 }}>
        <div className="avatar" style={{ background: "var(--ai-bg)", color: "var(--ai)", width: 28, height: 28 }}>
          <Icon.Sparkle size={13}/>
        </div>
        <div className="ai-card" style={{ padding: "10px 14px 14px", position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 6 }}>
            <span className="ai-tag" style={{ position: "static" }}><Icon.Sparkle size={10}/> {t.modelTag}</span>
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.55, color: "var(--fg)" }}>
            {m.pending && !m.content ? null : renderMarkdown(m.content)}
            {m.pending && <span className="caret"/>}
          </div>
        </div>
      </div>
    );
  };

  const isEmpty = !activeThread || activeThread.messages.length === 0;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", height: "calc(100vh - var(--topbar-h))" }}>
      {/* Sidebar */}
      <div className="hairline-r" style={{ padding: 12, overflowY: "auto", background: "var(--surface-2)" }}>
        <div className="row mb-12">
          <Button variant="primary" size="sm" className="block" icon={<Icon.Plus size={12}/>} onClick={newThread}>
            {t.newChat}
          </Button>
        </div>

        {threads.length === 0 ? (
          <div className="muted" style={{ fontSize: 12, padding: "12px 6px" }}>{t.noThreads}</div>
        ) : (
          <>
            {grouped.today.length > 0 && (<><div className="eyebrow mb-4">{t.today}</div>{grouped.today.map(renderThreadRow)}</>)}
            {grouped.lastWeek.length > 0 && (<><div className="eyebrow mt-12 mb-4">{t.lastWeek}</div>{grouped.lastWeek.map(renderThreadRow)}</>)}
            {grouped.older.length > 0 && (<><div className="eyebrow mt-12 mb-4">{t.older}</div>{grouped.older.map(renderThreadRow)}</>)}
          </>
        )}
      </div>

      {/* Main */}
      <div style={{ display: "flex", flexDirection: "column", minWidth: 0, background: "var(--bg)" }}>
        {/* Header */}
        <div className="hairline-b" style={{ padding: "10px 20px", background: "var(--surface)", display: "flex", alignItems: "center", gap: 10 }}>
          <div className="avatar" style={{ background: "var(--ai-bg)", color: "var(--ai)", width: 26, height: 26 }}>
            <Icon.Sparkle size={14}/>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>{t.copilotName} <AIChip/></div>
            <div className="mono muted" style={{ fontSize: 10 }}>{t.groundedInErp}</div>
          </div>
          <span className="sp"/>
          <Button variant="ghost" size="sm" icon={<Icon.Download size={12}/>}>{t.export}</Button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "24px 20px 24px", maxWidth: 880, margin: "0 auto", width: "100%" }}>
          {isEmpty ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--muted)" }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--ai-bg)", color: "var(--ai)", display: "inline-grid", placeItems: "center", marginBottom: 14 }}>
                <Icon.Sparkle size={22}/>
              </div>
              <div style={{ fontSize: 18, color: "var(--ink)", fontWeight: 500, marginBottom: 6 }}>{t.emptyTitle}</div>
              <div style={{ fontSize: 13, marginBottom: 20 }}>{t.emptyHint}</div>
              <div className="row" style={{ flexWrap: "wrap", gap: 8, justifyContent: "center", maxWidth: 640, margin: "0 auto" }}>
                {t.suggestions.map((s, i) => (
                  <button key={i} className="chip" style={{ cursor: "pointer", fontSize: 12.5 }} onClick={() => sendMessage(s)}>
                    {s} <Icon.Arrow size={10} className="muted"/>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {activeThread.messages.map(renderMessage)}
              {errorKey && (
                <div className="banner bad" style={{ maxWidth: 860, margin: "8px auto 0" }}>
                  <span className="ico"><Icon.Alert size={15}/></span>
                  <div style={{ flex: 1 }}>
                    <div className="desc">{errorKey === "auth" ? t.errorAuth : t.errorOffline}</div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Composer */}
        <div style={{ position: "sticky", bottom: 0, background: "var(--bg)", padding: "14px 20px 20px", borderTop: "1px solid var(--line)" }}>
          <div className="hairline" style={{ background: "var(--surface)", borderRadius: 8, padding: 10, maxWidth: 860, margin: "0 auto" }}>
            <textarea
              ref={textareaRef}
              className="input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={t.composerPlaceholder}
              rows={2}
              disabled={streaming}
              style={{ border: 0, boxShadow: "none", resize: "none" }}
            />
            <div className="row" style={{ gap: 8, borderTop: "1px solid var(--line-2)", paddingTop: 8 }}>
              <Button variant="ghost" size="sm" icon={<Icon.Paperclip size={12}/>} disabled>{t.attach}</Button>
              <Button variant="ghost" size="sm" icon={<Icon.Database size={12}/>} disabled>{t.portfolioData}</Button>
              <span className="sp"/>
              <span className="mono muted" style={{ fontSize: 10 }}>{t.modelTag}</span>
              {streaming ? (
                <Button variant="ghost" size="sm" icon={<Icon.X size={12}/>} onClick={stopStream}>{t.stop}</Button>
              ) : (
                <Button variant="primary" size="sm" icon={<Icon.Arrow size={12}/>} onClick={() => sendMessage(draft)} disabled={!draft.trim()}>{t.send}</Button>
              )}
            </div>
          </div>
          <div style={{ textAlign: "center", marginTop: 8, fontSize: 11, color: "var(--muted)" }}>{t.groundedNote}</div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { RiskPage, AlertsPage, ProductsPage, BankTeam, BankAuditPage, BankSettings, NotificationsPage, SearchPage, NotFound, BankCopilotPage });
