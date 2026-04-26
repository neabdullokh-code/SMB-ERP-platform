// Bank — кредитная очередь (онлайн) и проверка заявки

function CreditQueue({ go }) {
  const [loading, setLoading] = useStateS(true);
  const [error, setError] = useStateS("");
  const [queue, setQueue] = useStateS([]);
  const [sel, setSel] = useStateS(0);
  const [filter, setFilter] = useStateS("all");
  const [detail, setDetail] = useStateS(null);
  const [detailLoading, setDetailLoading] = useStateS(false);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/bank/credit-queue", {
        method: "GET",
        credentials: "include",
        cache: "no-store"
      });
      const body = await response.json();
      if (!response.ok || !Array.isArray(body?.data?.applications)) {
        throw new Error(body?.message || "Не удалось загрузить кредитную очередь.");
      }
      setQueue(body.data.applications);
      setError("");
    } catch (loadError) {
      setQueue([]);
      setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить кредитную очередь.");
    } finally {
      setLoading(false);
    }
  };

  useEffectS(() => {
    loadQueue();
  }, []);

  const filteredQueue = queue.filter((item) => {
    if (filter === "all") return true;
    if (filter === "approve") return item.aiRecommendation === "approve";
    if (filter === "review") return item.aiRecommendation === "review";
    if (filter === "decline") return item.aiRecommendation === "decline";
    return true;
  });

  useEffectS(() => {
    const selected = filteredQueue[sel] || filteredQueue[0];
    if (!selected) {
      setDetail(null);
      return;
    }

    let cancelled = false;
    (async () => {
      setDetailLoading(true);
      try {
        const response = await fetch(`/api/bank/credit-queue/${selected.id}`, {
          method: "GET",
          credentials: "include",
          cache: "no-store"
        });
        const body = await response.json();
        if (!response.ok || !body?.data?.application) {
          throw new Error(body?.message || "Не удалось загрузить детали кредитной заявки.");
        }
        if (!cancelled) setDetail(body.data.application);
      } catch {
        if (!cancelled) setDetail(null);
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [sel, filter, filteredQueue.length]);

  return (
    <div className="page page-flush">
      <div className="page-head">
        <div>
          <h1>Кредитная очередь</h1>
          <div className="sub">{loading ? "Загрузка заявок..." : `${filteredQueue.length} заявок · очередь банка в реальном времени`}</div>
        </div>
        <span className="sp"/>
        <Button variant="ghost" icon={<Icon.Refresh size={13}/>} onClick={loadQueue}>Обновить</Button>
      </div>

      {error && <Banner tone="warn" title="Кредитная очередь недоступна">{error}</Banner>}

      <div className="split-layout" style={{gridTemplateColumns:"340px 1fr"}}>
        <div className="card card-pad-0" style={{overflow:"hidden"}}>
          <div className="tbl-toolbar" style={{gap:4}}>
            {[
              { key: "all", label: "Все" },
              { key: "approve", label: "AI: одобрить" },
              { key: "review", label: "AI: проверить" },
              { key: "decline", label: "AI: отклонить" },
            ].map((category) => (
              <button key={category.key} className="chip" onClick={() => { setFilter(category.key); setSel(0); }}
                style={{background: filter===category.key ? "var(--ink)":undefined, color:filter===category.key?"var(--surface)":undefined, borderColor:filter===category.key?"var(--ink)":undefined}}>{category.label}</button>
            ))}
          </div>
          <div style={{maxHeight:"calc(100vh - 220px)", overflowY:"auto"}}>
            {loading && <div className="muted mono" style={{padding:12}}>Загрузка заявок…</div>}
            {!loading && filteredQueue.length === 0 && <div className="muted mono" style={{padding:12}}>В этом фильтре заявок нет.</div>}
            {filteredQueue.map((item, i) => (
              <div key={item.id} onClick={() => setSel(i)}
                className="hairline-b"
                style={{padding:"12px 14px", cursor:"pointer", background: sel===i ? "var(--ai-bg)" : "transparent", borderLeft: sel===i ? "3px solid var(--ai)" : "3px solid transparent"}}>
                <div className="row">
                  <span className="mono id" style={{fontSize:10}}>{item.id}</span>
                  <span className="sp"/>
                  <Pill tone={item.aiRecommendation==="approve"?"good":item.aiRecommendation==="review"?"warn":"bad"} dot={false}>AI {item.aiRecommendation}</Pill>
                </div>
                <div style={{fontSize:13, color:"var(--ink)", fontWeight:500, marginTop:4}}>{item.tenantName}</div>
                <div className="muted" style={{fontSize:11, marginTop:2}}>{item.product} · <span className="mono">{fmtShort(Number(item.requestedAmount || 0))} UZS</span></div>
                <div className="row mt-8">
                  <span className="mono muted" style={{fontSize:10}}>Скоринг {item.scoreSnapshot} · {new Date(item.submittedAt).toLocaleString()}</span>
                  <span className="sp"/>
                  {item.priority === "high" && <Pill tone="bad" dot={false}>Приоритет</Pill>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <LoanReview app={detail} loading={detailLoading} go={go}/>
        </div>
      </div>
    </div>
  );
}

function LoanReview({ app, loading, go }) {
  const [decision, setDecision] = useStateS(null);
  const recommendationLabel = app
    ? app.aiRecommendation === "approve"
      ? "одобрить"
      : app.aiRecommendation === "review"
        ? "проверить"
        : app.aiRecommendation === "decline"
          ? "отклонить"
          : app.aiRecommendation
    : "";
  const statusLabel = app
    ? app.status === "new"
      ? "новая"
      : app.status === "under_review"
        ? "на проверке"
        : app.status === "approved"
          ? "одобрена"
          : app.status === "declined"
            ? "отклонена"
            : String(app.status || "").replace(/_/g, " ")
    : "";

  if (loading) {
    return <div className="card"><div className="card-body muted mono">Загрузка деталей заявки…</div></div>;
  }

  if (!app) {
    return <div className="card"><div className="card-body muted mono">Выберите заявку, чтобы посмотреть детали.</div></div>;
  }

  const score = app.scoreSnapshot || 0;
  const recommendationTone = app.aiRecommendation === "approve" ? "good" : app.aiRecommendation === "review" ? "warn" : "bad";

  return (
    <div className="card card-pad-0">
      <div style={{padding:"14px 18px", borderBottom:"1px solid var(--line)", display:"flex", alignItems:"center", gap:14}}>
        <div className="avatar lg warm">{app.tenantName.split(" ").map((word)=>word[0]).slice(0,2).join("")}</div>
        <div>
          <div className="eyebrow mb-4">Заявка <span className="mono" style={{color:"var(--ink)"}}>{app.id}</span> · подана {new Date(app.submittedAt).toLocaleString()}</div>
          <div style={{fontSize:20, fontWeight:500, color:"var(--ink)"}}>{app.tenantName}</div>
          <div className="row gap-8 mt-4 muted" style={{fontSize:12}}>
            <span>{app.product}</span><span className="sep-dot"/>
            <span className="mono">{fmtShort(Number(app.requestedAmount || 0))} UZS</span><span className="sep-dot"/>
            <span>{app.requestedTermMonths} мес.</span><span className="sep-dot"/>
            <span>{app.purpose}</span>
          </div>
        </div>
      </div>

      <div className="grid" style={{gridTemplateColumns:"1.4fr 1fr", gap:0}}>
        <div style={{padding:18, borderRight:"1px solid var(--line)"}}>
          <div className="ai-card" style={{padding:16}}>
            <div className="row">
              <span className="ai-tag"><Icon.Sparkle size={10}/> РЕКОМЕНДАЦИЯ AI</span>
              <span className="sp"/>
              <span className="mono muted" style={{fontSize:10}}>{app.scoreVersion || "risk"}</span>
            </div>
            <div className="row mt-12" style={{gap:20, alignItems:"flex-start"}}>
              <div>
                <Donut size={104} thickness={12}
                  segments={[
                    { value: score, color: recommendationTone === "good" ? "var(--good)" : recommendationTone === "warn" ? "var(--warn)" : "var(--bad)" },
                    { value: Math.max(0, 100-score), color:"var(--line)" },
                  ]}
                  center={<div><div className="num-xl" style={{fontSize:28, lineHeight:1}}>{score}</div><div className="mono muted" style={{fontSize:9}}>/100</div></div>}/>
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:16, color:"var(--ink)", fontWeight:500}}>
                  Рекомендация: <span style={{color: recommendationTone === "good" ? "var(--good)" : recommendationTone === "warn" ? "var(--warn)" : "var(--bad)"}}>{recommendationLabel}</span>
                </div>
                <div className="muted mt-4" style={{fontSize:12, lineHeight:1.5}}>{app.aiRationale}</div>
              </div>
            </div>
          </div>

          <h2 className="mt-16">Факторы скоринга</h2>
          <div className="col gap-4 mt-8">
            {(app.scoreFactors || []).map((factor, i) => (
              <div key={i} className="row hairline-b" style={{padding:"6px 0", fontSize:12.5}}>
                <Pill tone={factor.tone === "neutral" ? "info" : factor.tone} dot={false}>{factor.impact > 0 ? "+" : factor.impact < 0 ? "−" : "~"}</Pill>
                <span style={{marginLeft:8, flex:1}}>{factor.label}</span>
                <span className="mono muted" style={{fontSize:11}}>{factor.value}</span>
              </div>
            ))}
            {(!app.scoreFactors || app.scoreFactors.length === 0) && <div className="muted mono">Подробности по факторам недоступны.</div>}
          </div>
        </div>

        <div style={{padding:18}}>
          <h2>Заявитель</h2>
          <div className="col gap-8 mt-8" style={{fontSize:12.5}}>
            <div className="row"><span className="muted">Компания</span><span className="sp"/><span style={{color:"var(--ink)"}}>{app.tenantName}</span></div>
            <div className="row"><span className="muted">Отрасль</span><span className="sp"/><span>{app.industry}</span></div>
            <div className="row"><span className="muted">Регион</span><span className="sp"/><span>{app.region}</span></div>
            <div className="row"><span className="muted">Статус</span><span className="sp"/><Pill tone="info" dot={false}>{statusLabel}</Pill></div>
            <div className="row"><span className="muted">Запрошено</span><span className="sp"/><span className="mono">{fmtShort(Number(app.requestedAmount || 0))} UZS</span></div>
          </div>

          <div className="divider"/>
          <h2>Решение (вручную)</h2>
          <div className="col gap-8 mt-8">
            <Button variant="primary" className="block" onClick={() => setDecision("approved")}> <Icon.Check size={13}/> Одобрить по рекомендации </Button>
            <Button variant="ghost" className="block" onClick={() => setDecision("counter")}> <Icon.Edit size={13}/> Встречное предложение </Button>
            <Button variant="ghost" className="block" onClick={() => setDecision("declined")} style={{color:"var(--bad)"}}> <Icon.X size={13}/> Отклонить </Button>
          </div>

          {decision && (
            <div className="mt-12 banner" style={{background: decision==="declined"?"var(--bad-bg)":"var(--good-bg)", color: decision==="declined"?"var(--bad)":"var(--good)"}}>
              <Icon.Check size={14}/>
              <div style={{flex:1}}>
                <div className="title">Решение подготовлено: {decision}</div>
                <div className="desc">Можно добавить финальный endpoint отправки, чтобы сохранять это действие.</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { CreditQueue, LoanReview });
