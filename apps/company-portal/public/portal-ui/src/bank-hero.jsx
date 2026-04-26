// Bank — Dashboard, All Tenants, Tenant Detail
const UZ_MAP = "M10,30 L40,20 L70,25 L120,15 L180,20 L220,30 L260,25 L320,30 L340,50 L330,80 L300,95 L250,100 L200,110 L150,115 L110,108 L80,100 L50,90 L30,75 L10,55 Z";

function bankJson(path) {
  return fetch(path, { method: "GET", credentials: "include", cache: "no-store" }).then(async (response) => {
    const body = await response.json();
    return { response, body };
  });
}

function trendTone(trend) {
  return trend === "up" ? "good" : trend === "down" ? "bad" : "info";
}

function trendLabel(trend) {
  return trend === "up" ? "+" : trend === "down" ? "−" : "~";
}

function scoreToSeries(score) {
  const base = Math.max(35, Math.min(95, Number(score || 0)));
  return [Math.max(20, base - 8), Math.max(24, base - 5), Math.max(30, base - 3), base];
}

function BankDashboard({ go }) {
  const [loading, setLoading] = useStateS(true);
  const [error, setError] = useStateS("");
  const [portfolio, setPortfolio] = useStateS([]);
  const [analytics, setAnalytics] = useStateS(null);
  const [alerts, setAlerts] = useStateS([]);

  const load = async () => {
    setLoading(true);
    try {
      const [portfolioResult, analyticsResult, alertsResult] = await Promise.all([
        bankJson("/api/bank/portfolio"),
        bankJson("/api/bank/portfolio/analytics"),
        bankJson("/api/bank/portfolio/alerts")
      ]);

      if (!portfolioResult.response.ok || !analyticsResult.response.ok || !alertsResult.response.ok) {
        throw new Error(
          portfolioResult.body?.message
            || analyticsResult.body?.message
            || alertsResult.body?.message
            || "Unable to load bank dashboard."
        );
      }

      const tenants = portfolioResult.body?.data?.tenants || [];
      const nextAnalytics = analyticsResult.body?.data?.analytics || null;
      const nextAlerts = alertsResult.body?.data?.alerts || [];

      setPortfolio(tenants);
      setAnalytics(nextAnalytics);
      setAlerts(nextAlerts);
      setError("");
    } catch (loadError) {
      setPortfolio([]);
      setAnalytics(null);
      setAlerts([]);
      setError(loadError instanceof Error ? loadError.message : "Unable to load bank dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffectS(() => {
    load();
  }, []);

  const regionCounts = portfolio.reduce((acc, tenant) => {
    const key = tenant.region || "Unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const industryCounts = portfolio.reduce((acc, tenant) => {
    const key = tenant.industry || "Other";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const topRegions = Object.entries(regionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const topIndustries = Object.entries(industryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const scoreSeries = portfolio.slice(0, 12).map((tenant) => tenant.creditScore || 0);
  const scoreLabels = portfolio.slice(0, 12).map((tenant) => tenant.tenantName.split(" ")[0].slice(0, 3));

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow mb-4">SQB Банк · Бизнес-ОС платформа</div>
          <h1>Обзор портфеля</h1>
          <div className="sub">
            {loading ? "Загрузка живого портфеля..." : analytics?.lastRefreshedAt ? `Данные по всем SMB-клиентам в реальном времени · обновлено ${new Date(analytics.lastRefreshedAt).toLocaleString()}` : "Нет доступа к данным в реальном времени"}
          </div>
        </div>
        <span className="sp"/>
        <Button variant="ghost" icon={<Icon.Refresh size={13}/>} onClick={load}>Обновить</Button>
      </div>

      {error && (
        <Banner tone="warn" title="Панель банка недоступна">{error}</Banner>
      )}

      <div className="grid grid-4 mb-16">
        <Kpi label="Активные SMB-клиенты" value={String(analytics?.totalTenants || portfolio.length)} delta={analytics ? `${analytics.highRiskCount} высокий риск` : "—"} trend="up"
          spark={<Sparkline data={scoreSeries.length ? scoreSeries : [0, 0]} width={68} height={22}/>}/>
        <Kpi label="Средний кредитный рейтинг" value={String(analytics?.averageCreditScore || 0)} unit="/100" delta={analytics ? `${analytics.recommendationCounts?.approve || 0} рекомендовано к одобрению` : "—"} trend="up"
          spark={<Sparkline data={scoreSeries.length ? scoreSeries : [0, 0]} width={68} height={22}/>}/>
        <Kpi label="Состояние SLA" value={`${analytics?.slaHealthPercent || 0}%`} delta={`${analytics?.recommendationCounts?.review || 0} на проверке`} trend="up"
          spark={<Sparkline data={[60, 72, 80, Number(analytics?.slaHealthPercent || 0)]} width={68} height={22}/>}/>
        <Kpi label="Оповещения · внимание" value={String(alerts.length)} delta={`${alerts.filter((alert) => alert.severity === "critical").length} крит.`} trend={alerts.length > 0 ? "down" : "up"}
          spark={<div className="sparkbars">{alerts.slice(0, 12).map((alert, i)=><span key={i} style={{height:`${10 + (alert.severity === "critical" ? 12 : alert.severity === "warn" ? 8 : 5)}px`, background: alert.severity === "critical" ? "var(--bad)" : alert.severity === "warn" ? "var(--warn)" : "var(--info)"}}/>)}</div>}/>
      </div>

      <div className="grid" style={{gridTemplateColumns:"2fr 1fr", gap:12}}>
        <div className="card card-pad-0">
          <div className="panel-title">
            Распределение кредитного рейтинга
            <span className="sp"/>
            <div className="chip">Онлайн</div>
          </div>
          <div style={{padding:8}}>
            {scoreSeries.length >= 2 ? (
              <LineChart width={760} height={220} padding={[18,18,28,48]}
                categories={scoreLabels}
                series={[
                  { data: scoreSeries, color:"var(--ink)", dots:true, area:true }
                ]}/>
            ) : (
              <div className="empty" style={{minHeight:220}}>
                <Icon.Chart size={24}/>
                <h3>{loading ? "Загрузка динамики портфеля..." : "Нет данных портфеля"}</h3>
                <div>{loading ? "Загружаем оперативные банковские метрики." : "Пока нет данных по рейтингам клиентов."}</div>
              </div>
            )}
          </div>
        </div>

        <div className="card card-pad-0">
          <div className="panel-title">Отраслевая структура</div>
          <div style={{padding:12}}>
            {topIndustries.length === 0 ? (
              <div className="empty" style={{minHeight:180}}>
                <Icon.Database size={22}/>
                <h3>{loading ? "Загрузка отраслевой структуры..." : "Нет отраслевых данных"}</h3>
                <div>{loading ? "Агрегируем отрасли клиентов." : "Активные клиенты не найдены."}</div>
              </div>
            ) : (
              <div className="row" style={{gap:16}}>
                <Donut size={128} thickness={18}
                  segments={topIndustries.map((item, idx) => ({ value: Math.round((item[1] / Math.max(portfolio.length, 1)) * 100), color: ["var(--ink)","var(--ai)","var(--good)","var(--info)","var(--warn)","var(--line)"][idx % 6] }))}/>
                <div style={{flex:1}}>
                  {topIndustries.map(([name, count], i) => (
                    <div key={i} className="row" style={{fontSize:11.5, padding:"3px 0"}}>
                      <span style={{width:8, height:8, background:["var(--ink)","var(--ai)","var(--good)","var(--info)","var(--warn)","var(--line)"][i % 6], marginRight:8, borderRadius:2}}/>
                      <span>{name}</span><span className="sp"/>
                      <span className="mono">{Math.round((count / Math.max(portfolio.length, 1)) * 100)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid mt-16" style={{gridTemplateColumns:"1.2fr 1fr", gap:12}}>
        <div className="card card-pad-0">
          <div className="panel-title">Географическое распределение · Узбекистан</div>
          <div style={{padding:14, display:"grid", gridTemplateColumns:"1.4fr 1fr", gap:14}}>
            <svg viewBox="0 0 360 140" style={{width:"100%", height:"auto", background:"var(--surface-2)", borderRadius:4}}>
              <path d={UZ_MAP} fill="var(--line-2)" stroke="var(--line)"/>
              {topRegions.slice(0, 7).map((region, i) => {
                const cx = [90,150,80,210,250,180,130][i] || 120;
                const cy = [70,80,95,65,80,45,55][i] || 70;
                const ratio = region[1] / Math.max(topRegions[0]?.[1] || 1, 1);
                const radius = Math.max(5, Math.round(ratio * 16));
                return (
                  <g key={i}>
                    <circle cx={cx} cy={cy} r={radius} fill="var(--ai)" opacity="0.2"/>
                    <circle cx={cx} cy={cy} r={3} fill="var(--ai)"/>
                    <text x={cx} y={cy - radius - 3} textAnchor="middle" fontSize="8" fontFamily="var(--mono)" fill="var(--ink)">{region[0]}</text>
                  </g>
                );
              })}
            </svg>
            <div>
              <div className="eyebrow mb-8">Топ регионов</div>
              {topRegions.map((region, i) => (
                <div key={i} className="row hairline-b" style={{padding:"6px 0", fontSize:12, borderBottom: i===topRegions.length-1 ? "0":undefined}}>
                  <span>{region[0]}</span><span className="sp"/>
                  <span className="mono muted" style={{width:50, textAlign:"right"}}>{region[1]}</span>
                  <span className="mono" style={{width:32, textAlign:"right", color:"var(--ai)"}}>{Math.round((region[1] / Math.max(portfolio.length, 1)) * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card card-pad-0">
          <div className="panel-title">Требует внимания <span className="sp"/><Pill tone="bad" dot={false}>{alerts.length}</Pill></div>
          <div>
            {alerts.length === 0 ? (
              <div className="empty" style={{minHeight:220}}>
                <Icon.Check size={22}/>
                <h3>{loading ? "Загрузка оповещений..." : "Нет активных оповещений"}</h3>
                <div>{loading ? "Проверяем аномалии портфеля." : "Сейчас нет аномалий, требующих внимания."}</div>
              </div>
            ) : alerts.slice(0,5).map((alert, i) => (
              <div key={i} className="hairline-b" style={{padding:"10px 14px", display:"grid", gridTemplateColumns:"auto 1fr auto", gap:10, alignItems:"flex-start", cursor:"pointer"}}
                   onClick={() => go("/bank/alerts")}>
                <Pill tone={alert.severity === "critical" ? "bad" : alert.severity === "warn" ? "warn" : "info"} dot={false}>{alert.severity.toUpperCase()}</Pill>
                <div>
                  <div style={{fontSize:12.5, color:"var(--ink)", fontWeight:500}}>{alert.type.replace(/_/g, " ")} · <span className="muted" style={{fontWeight:400}}>{alert.tenantName}</span></div>
                  <div className="muted" style={{fontSize:11, marginTop:2}}>{alert.message}</div>
                </div>
                <div className="mono muted" style={{fontSize:10}}>{new Date(alert.triggeredAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function BankTenants({ go }) {
  const [loading, setLoading] = useStateS(true);
  const [error, setError] = useStateS("");
  const [tenants, setTenants] = useStateS([]);
  const [q, setQ] = useStateS("");
  const [ind, setInd] = useStateS("All");

  useEffectS(() => {
    let cancelled = false;
    (async () => {
      try {
        const { response, body } = await bankJson("/api/bank/portfolio");
        if (cancelled) return;
        if (!response.ok || !Array.isArray(body?.data?.tenants)) {
          throw new Error(body?.message || "Не удалось загрузить клиентов.");
        }
        setTenants(body.data.tenants);
        setError("");
      } catch (loadError) {
        if (!cancelled) {
          setTenants([]);
          setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить клиентов.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const industries = ["Все", ...new Set(tenants.map((tenant) => tenant.industry || "Другое"))];
  const rows = tenants.filter((tenant) => (ind === "Все" || tenant.industry === ind) && (q === "" || tenant.tenantName.toLowerCase().includes(q.toLowerCase())));

  return (
    <div className="page">
      <div className="page-head">
        <div><h1>Все клиенты</h1><div className="sub">Портфель клиентов в реальном времени из банковского мониторинга</div></div>
        <span className="sp"/>
        <Button variant="ghost" icon={<Icon.Download size={13}/>}>Экспорт</Button>
      </div>
      {error && <Banner tone="warn" title="Клиенты недоступны">{error}</Banner>}
      <div className="card card-pad-0">
        <div className="tbl-toolbar">
          <div className="input-wrap" style={{width:260}}><span className="prefix"><Icon.Search size={13}/></span><input className="input with-prefix" placeholder="Поиск компании" value={q} onChange={e=>setQ(e.target.value)}/></div>
          <div className="row gap-4">
            {industries.slice(0,5).map((category) => (
              <button key={category} className="chip" onClick={() => setInd(category)}
                style={{background:ind===category?"var(--ink)":undefined, color:ind===category?"var(--surface)":undefined, borderColor:ind===category?"var(--ink)":undefined}}>{category}</button>
            ))}
          </div>
          <span className="sp"/>
          <div className="mono muted" style={{fontSize:11}}>{rows.length} из {tenants.length}</div>
        </div>
        <table className="tbl">
          <thead><tr>
            <th>КОМПАНИЯ</th><th>ОТРАСЛЬ</th><th>РЕГИОН</th>
            <th style={{width:100}}>ДИНАМИКА ОЦЕНКИ</th>
            <th>КРЕДИТНЫЙ РЕЙТИНГ</th><th>ТРЕНД</th><th>ДЕЙСТВИЕ</th><th>ОБНОВЛЕНО</th><th/>
          </tr></thead>
          <tbody>
            {loading && <tr><td colSpan="9" className="dim mono">Загрузка клиентов…</td></tr>}
            {!loading && rows.map((tenant) =>
              <tr key={tenant.tenantId} onClick={() => { try { window.sessionStorage.setItem("bank:selectedTenantId", tenant.tenantId); } catch {} go("/bank/tenant"); }} style={{cursor:"pointer"}}>
                <td>
                  <div className="row gap-8">
                    <div className="avatar sm cool">{tenant.tenantName.split(" ").map((word)=>word[0]).slice(0,2).join("")}</div>
                    <div>
                      <div style={{color:"var(--ink)", fontWeight:500}}>{tenant.tenantName}</div>
                      <div className="id mono" style={{fontSize:10.5}}>{tenant.tenantId}</div>
                    </div>
                  </div>
                </td>
                <td className="dim">{tenant.industry}</td>
                <td className="dim">{tenant.region}</td>
                <td><Sparkline data={scoreToSeries(tenant.creditScore)} width={80} height={22}/></td>
                <td><ScorePill value={tenant.creditScore} trend={tenant.healthTrend === "up" ? "+" : tenant.healthTrend === "down" ? "−" : "~"}/></td>
                <td><Pill tone={trendTone(tenant.healthTrend)} dot={false}>{tenant.healthTrend === "up" ? "рост" : tenant.healthTrend === "down" ? "снижение" : "стабильно"}</Pill></td>
                <td><Pill tone={tenant.recommendedAction === "approve" ? "good" : tenant.recommendedAction === "review" ? "warn" : "bad"} dot={false}>{tenant.recommendedAction === "approve" ? "одобрить" : tenant.recommendedAction === "review" ? "проверить" : "отклонить"}</Pill></td>
                <td className="dim mono" style={{fontSize:11}}>{new Date(tenant.refreshedAt).toLocaleString()}</td>
                <td className="row-actions"><Icon.ChevRight size={13} className="muted"/></td>
              </tr>)}
            {!loading && rows.length === 0 && <tr><td colSpan="9" className="dim mono">Клиенты не найдены.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TenantDetail({ go }) {
  const [loading, setLoading] = useStateS(true);
  const [error, setError] = useStateS("");
  const [tenant, setTenant] = useStateS(null);

  const selectedTenantId = (() => {
    try {
      return window.sessionStorage.getItem("bank:selectedTenantId") || "";
    } catch {
      return "";
    }
  })();

  useEffectS(() => {
    let cancelled = false;
    (async () => {
      if (!selectedTenantId) {
        setLoading(false);
        setError("Клиент не выбран. Откройте клиента из списка.");
        return;
      }
      try {
        const { response, body } = await bankJson(`/api/bank/portfolio/${selectedTenantId}`);
        if (cancelled) return;
        if (!response.ok || !body?.data) {
          throw new Error(body?.message || "Unable to load tenant detail.");
        }
        setTenant(body.data);
        setError("");
      } catch (loadError) {
        if (!cancelled) {
          setTenant(null);
          setError(loadError instanceof Error ? loadError.message : "Unable to load tenant detail.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedTenantId]);

  const scoreSeries = scoreToSeries(tenant?.creditScore || 0);

  return (
    <div className="page">
      <div className="row mb-8" style={{fontSize:12, color:"var(--muted)"}}>
        <a style={{cursor:"pointer"}} onClick={() => go("/bank/tenants")}>Все клиенты</a>
        <span>/</span><span>{tenant?.tenantName || "Tenant"}</span>
      </div>
      <div className="page-head">
        <div className="row" style={{gap:14}}>
          <div className="avatar lg warm">{tenant?.tenantName ? tenant.tenantName.split(" ").map((word)=>word[0]).slice(0,2).join("") : "TN"}</div>
          <div>
            <div className="eyebrow mb-4">{tenant?.tenantId || "—"} · Monitoring profile</div>
            <h1>{tenant?.tenantName || "Tenant detail"}</h1>
            <div className="row gap-8 mt-4">
              <span className="muted">{tenant?.industry || "—"} · {tenant?.region || "—"}</span>
              <span className="sep-dot"/>
              <ScorePill value={tenant?.creditScore || 0} trend={tenant?.healthTrend === "up" ? "+" : tenant?.healthTrend === "down" ? "−" : "~"}/>
            </div>
          </div>
        </div>
        <span className="sp"/>
        <Button variant="primary" icon={<Icon.Handshake size={13}/>} onClick={() => go("/bank/credit-queue")}>Open credit queue</Button>
      </div>

      {error && <Banner tone="warn" title="Tenant detail unavailable">{error}</Banner>}

      <div className="grid mt-16" style={{gridTemplateColumns:"2fr 1fr", gap:12}}>
        <div className="card card-pad-0">
          <div className="panel-title">Health trend</div>
          <div style={{padding:8}}>
            {loading ? (
              <div className="empty" style={{minHeight:220}}><Icon.Chart size={24}/><h3>Loading tenant profile...</h3></div>
            ) : tenant ? (
              <LineChart width={740} height={220} categories={["M-3","M-2","M-1","Now"]}
                series={[{data:scoreSeries, color:"var(--ink)", dots:true, area:true}]}
                padding={[18,18,28,48]}/>
            ) : (
              <div className="empty" style={{minHeight:220}}><Icon.Alert size={24}/><h3>No tenant data</h3><div>Select a tenant from the tenant list.</div></div>
            )}
          </div>
        </div>
        <div className="col gap-12">
          <div className="card"><div className="card-body">
            <h2>Monitoring summary</h2>
            {tenant ? (
              <div className="col gap-8 mt-8">
                <div className="row"><span className="muted">Риск запасов</span><span className="sp"/><Pill tone={tenant.inventoryRisk === "high" ? "bad" : tenant.inventoryRisk === "moderate" ? "warn" : "good"} dot={false}>{tenant.inventoryRisk === "high" ? "высокий" : tenant.inventoryRisk === "moderate" ? "умеренный" : "низкий"}</Pill></div>
                <div className="row"><span className="muted">Bottlenecks</span><span className="sp"/><span className="mono">{tenant.workflowBottlenecks}</span></div>
                <div className="row"><span className="muted">Overdue orders</span><span className="sp"/><span className="mono">{tenant.overdueServiceOrders}</span></div>
                <div className="row"><span className="muted">Риск дефолта</span><span className="sp"/><span className="mono">{tenant.defaultRiskPercent}%</span></div>
                <div className="row"><span className="muted">Ожидаемая доходность</span><span className="sp"/><span className="mono">{tenant.expectedReturnPercent}%</span></div>
              </div>
            ) : (
              <div className="muted mt-8">No summary available.</div>
            )}
          </div></div>
          <div className="card"><div className="card-body">
            <h2>Recommended action</h2>
            {tenant ? (
              <div className="row mt-8">
                <Pill tone={tenant.recommendedAction === "approve" ? "good" : tenant.recommendedAction === "review" ? "warn" : "bad"} dot={false}>{tenant.recommendedAction === "approve" ? "одобрить" : tenant.recommendedAction === "review" ? "проверить" : "отклонить"}</Pill>
                <span className="sp"/>
                <span className="mono muted" style={{fontSize:11}}>{new Date(tenant.refreshedAt).toLocaleString()}</span>
              </div>
            ) : (
              <div className="muted mt-8">No action recommendation.</div>
            )}
          </div></div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { BankDashboard, BankTenants, TenantDetail });
