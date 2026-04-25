// Bank — Credit queue (hero) and Loan Application review (centerpiece)

function CreditQueue({ go }) {
  const [sel, setSel] = useStateS(0);
  const [filter, setFilter] = useStateS("All");
  const queue = LOAN_QUEUE;
  return (
    <div className="page page-flush">
      <div className="page-head">
        <div>
          <h1>Credit queue</h1>
          <div className="sub">17 applications · avg time to decision <span className="mono" style={{color:"var(--ai)"}}>4h 12m</span> · SLA 24h</div>
        </div>
        <span className="sp"/>
        <div className="chip">SLA health <span style={{color:"var(--good)", marginLeft:6}}>98%</span></div>
        <Button variant="ghost" icon={<Icon.Filter size={13}/>}>Filter</Button>
      </div>
      <div className="split-layout" style={{gridTemplateColumns:"340px 1fr"}}>
        <div className="card card-pad-0" style={{overflow:"hidden"}}>
          <div className="tbl-toolbar" style={{gap:4}}>
            {["All","AI: approve","AI: review","AI: decline"].map(c => (
              <button key={c} className="chip" onClick={() => setFilter(c)}
                style={{background: filter===c ? "var(--ink)":undefined, color:filter===c?"var(--surface)":undefined, borderColor:filter===c?"var(--ink)":undefined}}>{c}</button>
            ))}
          </div>
          <div style={{maxHeight:"calc(100vh - 220px)", overflowY:"auto"}}>
            {queue.map((q, i) => (
              <div key={q.id} onClick={() => setSel(i)}
                className="hairline-b"
                style={{padding:"12px 14px", cursor:"pointer", background: sel===i ? "var(--ai-bg)" : "transparent", borderLeft: sel===i ? "3px solid var(--ai)" : "3px solid transparent"}}>
                <div className="row">
                  <span className="mono id" style={{fontSize:10}}>{q.id}</span>
                  <span className="sp"/>
                  <Pill tone={q.aiRec==="approve"?"good":q.aiRec==="review"?"warn":"bad"} dot={false}>AI {q.aiRec}</Pill>
                </div>
                <div style={{fontSize:13, color:"var(--ink)", fontWeight:500, marginTop:4}}>{q.co}</div>
                <div className="muted" style={{fontSize:11, marginTop:2}}>{q.product} · <span className="mono">{q.amt}</span></div>
                <div className="row mt-8">
                  <span className="mono muted" style={{fontSize:10}}>Score {q.score} · {q.submitted}</span>
                  <span className="sp"/>
                  {q.priority === "high" && <Pill tone="bad" dot={false}>Priority</Pill>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <LoanReview app={queue[sel]} go={go}/>
        </div>
      </div>
    </div>
  );
}

function LoanReview({ app, go }) {
  const [decision, setDecision] = useStateS(null);

  const score = app.score || 81;

  return (
    <div className="card card-pad-0">
      <div style={{padding:"14px 18px", borderBottom:"1px solid var(--line)", display:"flex", alignItems:"center", gap:14}}>
        <div className="avatar lg warm">{app.co.split(" ").map(w=>w[0]).slice(0,2).join("")}</div>
        <div>
          <div className="eyebrow mb-4">Application <span className="mono" style={{color:"var(--ink)"}}>{app.id}</span> · submitted {app.submitted}</div>
          <div style={{fontSize:20, fontWeight:500, color:"var(--ink)"}}>{app.co}</div>
          <div className="row gap-8 mt-4 muted" style={{fontSize:12}}>
            <span>{app.product}</span><span className="sep-dot"/>
            <span className="mono">{app.amt}</span><span className="sep-dot"/>
            <span>{app.term}</span><span className="sep-dot"/>
            <span>{app.purpose}</span>
          </div>
        </div>
        <span className="sp"/>
        <Button variant="ghost" icon={<Icon.Mail size={13}/>}>Email customer</Button>
        <Button variant="ghost" icon={<Icon.FileDoc size={13}/>}>Export PDF</Button>
      </div>

      <div className="grid" style={{gridTemplateColumns:"1.4fr 1fr", gap:0}}>
        <div style={{padding:18, borderRight:"1px solid var(--line)"}}>
          {/* AI Recommendation */}
          <div className="ai-card" style={{padding:16}}>
            <div className="row">
              <span className="ai-tag"><Icon.Sparkle size={10}/> AI RECOMMENDATION</span>
              <span className="sp"/>
              <span className="mono muted" style={{fontSize:10}}>MODEL v2.4 · {app.submitted}</span>
            </div>
            <div className="row mt-12" style={{gap:20, alignItems:"flex-start"}}>
              <div>
                <Donut size={104} thickness={12}
                  segments={[
                    { value: score, color: app.aiRec==="approve" ? "var(--good)" : app.aiRec==="review" ? "var(--warn)" : "var(--bad)" },
                    { value: 100-score, color:"var(--line)" },
                  ]}
                  center={<div><div className="num-xl" style={{fontSize:28, lineHeight:1}}>{score}</div><div className="mono muted" style={{fontSize:9}}>/100</div></div>}/>
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:16, color:"var(--ink)", fontWeight:500}}>
                  Recommend: <span style={{color: app.aiRec==="approve"?"var(--good)":app.aiRec==="review"?"var(--warn)":"var(--bad)", textTransform:"capitalize"}}>{app.aiRec}</span>
                </div>
                <div className="muted mt-4" style={{fontSize:12, lineHeight:1.5}}>
                  {app.aiRationale}
                </div>
                <div className="row mt-8" style={{gap:8, flexWrap:"wrap"}}>
                  <Pill tone="ai" dot={false}>Confidence 94%</Pill>
                  <Pill tone="good" dot={false}>Default risk 2.1%</Pill>
                  <Pill tone="info" dot={false}>Expected return 16.2%</Pill>
                </div>
              </div>
            </div>
          </div>

          {/* Factors */}
          <h2 className="mt-16">Contributing factors</h2>
          <div className="col gap-4 mt-8">
            {(app.factors || [
              {n:"Revenue growth · +38% YoY", tone:"good", w:22},
              {n:"Cash flow · AR days stretched", tone:"warn", w:18},
              {n:"Inventory turnover · 6.2x", tone:"good", w:14},
              {n:"Customer concentration · 28%", tone:"warn", w:12},
              {n:"Supplier payments · 0 late", tone:"good", w:10},
              {n:"SQB transaction history · 2.3yr", tone:"good", w:15},
            ]).map((f,i) => (
              <div key={i} className="row hairline-b" style={{padding:"6px 0", fontSize:12.5}}>
                <Pill tone={f.tone} dot={false}>{f.tone==="good"?"+":f.tone==="warn"?"~":"−"}</Pill>
                <span style={{marginLeft:8, flex:1}}>{f.n}</span>
                <span className="mono muted" style={{fontSize:11}}>weight {f.w}%</span>
              </div>
            ))}
          </div>

          {/* Financials */}
          <h2 className="mt-16">Live ERP financials <AIChip label="LIVE"/></h2>
          <div className="grid grid-2 mt-8" style={{gap:10}}>
            <div className="hairline" style={{padding:12, borderRadius:6}}>
              <div className="eyebrow">Revenue · last 6mo</div>
              <LineChart width={260} height={70} categories={REVENUE_LABELS}
                series={[{data:REVENUE_6MO, color:"var(--ink)", dots:false, area:true}]}
                padding={[8,6,14,24]}/>
            </div>
            <div className="hairline" style={{padding:12, borderRadius:6}}>
              <div className="eyebrow">Cash flow</div>
              <LineChart width={260} height={70} categories={REVENUE_LABELS}
                series={[{data:[48,56,62,54,68,72], color:"var(--good)", dots:false, area:true}]}
                padding={[8,6,14,24]}/>
            </div>
            <div className="hairline" style={{padding:12, borderRadius:6}}>
              <div className="eyebrow">Industry risk · Wholesale</div>
              <div className="num-md mt-4">Medium</div>
              <div className="muted" style={{fontSize:11}}>Sector trend: stable growth</div>
            </div>
            <div className="hairline" style={{padding:12, borderRadius:6}}>
              <div className="eyebrow">SQB relationship</div>
              <div className="num-md mt-4">2.3 years</div>
              <div className="muted" style={{fontSize:11}}>1 420 transactions · 0 overdrafts</div>
            </div>
          </div>
        </div>

        {/* Right — key facts + decision */}
        <div style={{padding:18}}>
          <h2>Applicant</h2>
          <div className="col gap-8 mt-8" style={{fontSize:12.5}}>
            <div className="row"><span className="muted">Company</span><span className="sp"/><span style={{color:"var(--ink)"}}>{app.co}</span></div>
            <div className="row"><span className="muted">TIN</span><span className="sp"/><span className="mono">{app.tin}</span></div>
            <div className="row"><span className="muted">Industry</span><span className="sp"/><span>{app.industry}</span></div>
            <div className="row"><span className="muted">Region</span><span className="sp"/><span>{app.region}</span></div>
            <div className="row"><span className="muted">Employees</span><span className="sp"/><span className="mono">{app.employees}</span></div>
            <div className="row"><span className="muted">Revenue TTM</span><span className="sp"/><span className="mono">{app.revenueTTM}</span></div>
          </div>

          <div className="divider"/>
          <h2>Documents <span className="mono muted" style={{fontSize:10, marginLeft:6}}>AUTO-PULLED</span></h2>
          <div className="col gap-4 mt-8">
            {["Tax returns 2023–2024","VAT filings","P&L statement","Bank statements (SQB)","Inventory valuation","Supplier contracts"].map((d,i) => (
              <div key={i} className="row hairline-b" style={{padding:"4px 0", fontSize:12}}>
                <Icon.FileDoc size={13} style={{color:"var(--muted)"}}/>
                <span style={{marginLeft:6, flex:1}}>{d}</span>
                <Icon.Check size={12} style={{color:"var(--good)"}}/>
              </div>
            ))}
          </div>

          <div className="divider"/>
          <h2>Decision</h2>
          <div className="col gap-8 mt-8">
            <Field label="Approved amount"><input className="input mono" defaultValue={app.amt}/></Field>
            <Field label="Rate"><input className="input mono" defaultValue="18%"/></Field>
            <Field label="Term"><input className="input mono" defaultValue={app.term}/></Field>
            <Field label="Notes"><textarea className="input" rows={3} placeholder="Optional notes for the customer..."/></Field>
          </div>

          <div className="divider"/>
          <div className="col gap-8">
            <Button variant="primary" className="block" onClick={() => setDecision("approved")}>
              <Icon.Check size={13}/> Approve as recommended
            </Button>
            <Button variant="ghost" className="block" onClick={() => setDecision("counter")}>
              <Icon.Edit size={13}/> Counter-offer
            </Button>
            <Button variant="ghost" className="block" onClick={() => setDecision("declined")} style={{color:"var(--bad)"}}>
              <Icon.X size={13}/> Decline
            </Button>
          </div>

          {decision && (
            <div className="mt-12 banner" style={{background: decision==="declined"?"var(--bad-bg)":"var(--good-bg)", color: decision==="declined"?"var(--bad)":"var(--good)"}}>
              <Icon.Check size={14}/>
              <div style={{flex:1}}>
                <div className="title">Decision recorded: {decision}</div>
                <div className="desc">Customer notified via ERP and email. Auto-disbursement to SQB account scheduled for same day.</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { CreditQueue, LoanReview });
