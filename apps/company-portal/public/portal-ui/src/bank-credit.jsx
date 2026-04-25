// Bank — Credit queue (live) and Loan Application review

function CreditQueue({ go }) {
  const [loading, setLoading] = useStateS(true);
  const [error, setError] = useStateS("");
  const [queue, setQueue] = useStateS([]);
  const [sel, setSel] = useStateS(0);
  const [filter, setFilter] = useStateS("All");
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
        throw new Error(body?.message || "Unable to load credit queue.");
      }
      setQueue(body.data.applications);
      setError("");
    } catch (loadError) {
      setQueue([]);
      setError(loadError instanceof Error ? loadError.message : "Unable to load credit queue.");
    } finally {
      setLoading(false);
    }
  };

  useEffectS(() => {
    loadQueue();
  }, []);

  const filteredQueue = queue.filter((item) => {
    if (filter === "All") return true;
    if (filter === "AI: approve") return item.aiRecommendation === "approve";
    if (filter === "AI: review") return item.aiRecommendation === "review";
    if (filter === "AI: decline") return item.aiRecommendation === "decline";
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
          throw new Error(body?.message || "Unable to load credit application detail.");
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
          <h1>Credit queue</h1>
          <div className="sub">{loading ? "Loading applications..." : `${filteredQueue.length} applications · live bank queue`}</div>
        </div>
        <span className="sp"/>
        <Button variant="ghost" icon={<Icon.Refresh size={13}/>} onClick={loadQueue}>Refresh</Button>
      </div>

      {error && <Banner tone="warn" title="Credit queue unavailable">{error}</Banner>}

      <div className="split-layout" style={{gridTemplateColumns:"340px 1fr"}}>
        <div className="card card-pad-0" style={{overflow:"hidden"}}>
          <div className="tbl-toolbar" style={{gap:4}}>
            {["All","AI: approve","AI: review","AI: decline"].map((category) => (
              <button key={category} className="chip" onClick={() => { setFilter(category); setSel(0); }}
                style={{background: filter===category ? "var(--ink)":undefined, color:filter===category?"var(--surface)":undefined, borderColor:filter===category?"var(--ink)":undefined}}>{category}</button>
            ))}
          </div>
          <div style={{maxHeight:"calc(100vh - 220px)", overflowY:"auto"}}>
            {loading && <div className="muted mono" style={{padding:12}}>Loading applications…</div>}
            {!loading && filteredQueue.length === 0 && <div className="muted mono" style={{padding:12}}>No applications in this filter.</div>}
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
                  <span className="mono muted" style={{fontSize:10}}>Score {item.scoreSnapshot} · {new Date(item.submittedAt).toLocaleString()}</span>
                  <span className="sp"/>
                  {item.priority === "high" && <Pill tone="bad" dot={false}>Priority</Pill>}
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

  if (loading) {
    return <div className="card"><div className="card-body muted mono">Loading application detail…</div></div>;
  }

  if (!app) {
    return <div className="card"><div className="card-body muted mono">Select an application to view details.</div></div>;
  }

  const score = app.scoreSnapshot || 0;
  const recommendationTone = app.aiRecommendation === "approve" ? "good" : app.aiRecommendation === "review" ? "warn" : "bad";

  return (
    <div className="card card-pad-0">
      <div style={{padding:"14px 18px", borderBottom:"1px solid var(--line)", display:"flex", alignItems:"center", gap:14}}>
        <div className="avatar lg warm">{app.tenantName.split(" ").map((word)=>word[0]).slice(0,2).join("")}</div>
        <div>
          <div className="eyebrow mb-4">Application <span className="mono" style={{color:"var(--ink)"}}>{app.id}</span> · submitted {new Date(app.submittedAt).toLocaleString()}</div>
          <div style={{fontSize:20, fontWeight:500, color:"var(--ink)"}}>{app.tenantName}</div>
          <div className="row gap-8 mt-4 muted" style={{fontSize:12}}>
            <span>{app.product}</span><span className="sep-dot"/>
            <span className="mono">{fmtShort(Number(app.requestedAmount || 0))} UZS</span><span className="sep-dot"/>
            <span>{app.requestedTermMonths} months</span><span className="sep-dot"/>
            <span>{app.purpose}</span>
          </div>
        </div>
      </div>

      <div className="grid" style={{gridTemplateColumns:"1.4fr 1fr", gap:0}}>
        <div style={{padding:18, borderRight:"1px solid var(--line)"}}>
          <div className="ai-card" style={{padding:16}}>
            <div className="row">
              <span className="ai-tag"><Icon.Sparkle size={10}/> AI RECOMMENDATION</span>
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
                  Recommend: <span style={{color: recommendationTone === "good" ? "var(--good)" : recommendationTone === "warn" ? "var(--warn)" : "var(--bad)", textTransform:"capitalize"}}>{app.aiRecommendation}</span>
                </div>
                <div className="muted mt-4" style={{fontSize:12, lineHeight:1.5}}>{app.aiRationale}</div>
              </div>
            </div>
          </div>

          <h2 className="mt-16">Contributing factors</h2>
          <div className="col gap-4 mt-8">
            {(app.scoreFactors || []).map((factor, i) => (
              <div key={i} className="row hairline-b" style={{padding:"6px 0", fontSize:12.5}}>
                <Pill tone={factor.tone === "neutral" ? "info" : factor.tone} dot={false}>{factor.impact > 0 ? "+" : factor.impact < 0 ? "−" : "~"}</Pill>
                <span style={{marginLeft:8, flex:1}}>{factor.label}</span>
                <span className="mono muted" style={{fontSize:11}}>{factor.value}</span>
              </div>
            ))}
            {(!app.scoreFactors || app.scoreFactors.length === 0) && <div className="muted mono">No factor details available.</div>}
          </div>
        </div>

        <div style={{padding:18}}>
          <h2>Applicant</h2>
          <div className="col gap-8 mt-8" style={{fontSize:12.5}}>
            <div className="row"><span className="muted">Company</span><span className="sp"/><span style={{color:"var(--ink)"}}>{app.tenantName}</span></div>
            <div className="row"><span className="muted">Industry</span><span className="sp"/><span>{app.industry}</span></div>
            <div className="row"><span className="muted">Region</span><span className="sp"/><span>{app.region}</span></div>
            <div className="row"><span className="muted">Status</span><span className="sp"/><Pill tone="info" dot={false}>{app.status}</Pill></div>
            <div className="row"><span className="muted">Requested</span><span className="sp"/><span className="mono">{fmtShort(Number(app.requestedAmount || 0))} UZS</span></div>
          </div>

          <div className="divider"/>
          <h2>Decision (manual)</h2>
          <div className="col gap-8 mt-8">
            <Button variant="primary" className="block" onClick={() => setDecision("approved")}> <Icon.Check size={13}/> Approve as recommended </Button>
            <Button variant="ghost" className="block" onClick={() => setDecision("counter")}> <Icon.Edit size={13}/> Counter-offer </Button>
            <Button variant="ghost" className="block" onClick={() => setDecision("declined")} style={{color:"var(--bad)"}}> <Icon.X size={13}/> Decline </Button>
          </div>

          {decision && (
            <div className="mt-12 banner" style={{background: decision==="declined"?"var(--bad-bg)":"var(--good-bg)", color: decision==="declined"?"var(--bad)":"var(--good)"}}>
              <Icon.Check size={14}/>
              <div style={{flex:1}}>
                <div className="title">Decision prepared: {decision}</div>
                <div className="desc">Final submit endpoint wiring can be added to persist this action.</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { CreditQueue, LoanReview });
