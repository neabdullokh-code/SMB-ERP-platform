// SMB — Dashboard (hero) + AI Copilot (hero, streaming)

function SMBDashboard({ go }) {
  const revenueSeries = [{ data: REVENUE_6MO, color: "var(--ink)", dots: true, area: true }];
  const cashSeries    = [{ data: [62, 71, 58, 66, 79, 88], color: "var(--ai)", dashed: true }];
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow mb-4">Good morning, Jasur</div>
          <h1>Kamolot Savdo · Tashkent</h1>
          <div className="sub">Tuesday, 18 March · 4 new activities since you last signed in</div>
        </div>
        <span className="sp"/>
        <Button variant="ghost" icon={<Icon.Download size={13}/>}>Export</Button>
        <Button variant="primary" icon={<Icon.Plus size={13}/>}>New invoice</Button>
      </div>

      <div className="grid grid-4 mb-16">
        <Kpi label="Revenue · March"   value="278.4" unit="M UZS"
             delta="+12.8%" deltaLabel="vs Feb" trend="up"
             spark={<Sparkline data={REVENUE_6MO} width={64} height={24}/>}/>
        <Kpi label="Cash on hand"      value="64.2"  unit="M UZS"
             delta="−4.1%" deltaLabel="vs last week" trend="down"
             spark={<Sparkline data={[72,69,71,66,68,65,64]} width={64} height={24} stroke="var(--bad)"/>}/>
        <Kpi label="Inventory value"   value="412.7" unit="M UZS"
             delta="+2.3%" deltaLabel="312 SKUs" trend="up"
             spark={<Sparkline data={[380,388,395,402,410,412]} width={64} height={24}/>}/>
        <Kpi label="Pending orders"    value="18"    unit="open"
             delta="3 overdue" deltaLabel="" trend="down"
             spark={<div className="sparkbars">{[4,7,3,6,8,5,4,9,6].map((h,i)=><span key={i} style={{height: h*2+"px"}}/>)}</div>}/>
      </div>

      <div className="grid" style={{gridTemplateColumns:"2fr 1fr", gap:12}}>
        <div className="card card-pad-0">
          <div className="panel-title">
            Revenue · Last 6 months
            <span className="sp"/>
            <div className="row" style={{gap:12, fontSize:10, fontFamily:"var(--mono)"}}>
              <span style={{color:"var(--muted)"}}><span style={{display:"inline-block", width:8, height:2, background:"var(--ink)", marginRight:6}}/>Revenue</span>
              <span style={{color:"var(--muted)"}}><span style={{display:"inline-block", width:8, height:2, background:"var(--ai)", marginRight:6, borderTop:"1px dashed var(--ai)"}}/>Cash collected</span>
            </div>
            <Button variant="ghost" size="sm">6M</Button>
          </div>
          <div style={{padding:"8px 8px 0"}}>
            <LineChart
              width={760} height={240}
              categories={REVENUE_LABELS}
              series={[
                { data: REVENUE_6MO, color:"var(--ink)", dots:true, area:true },
                { data: [155, 180, 199, 172, 220, 248], color:"var(--ai)", dashed:true },
              ]}
              padding={[18,20,28,44]}
            />
          </div>
        </div>

        <div className="card card-pad-0">
          <div className="panel-title">Activity
            <span className="sp"/>
            <a className="mono muted" style={{cursor:"pointer", fontSize:10}}>VIEW ALL →</a>
          </div>
          <div style={{maxHeight:280, overflowY:"auto"}}>
            {ACTIVITY.map((a, i) => (
              <div key={i} className="hairline-b" style={{padding:"10px 12px", display:"grid", gridTemplateColumns:"28px 1fr auto", gap:10, alignItems:"flex-start"}}>
                <div style={{width:22, height:22, borderRadius:4, background:"var(--bg)", display:"grid", placeItems:"center", color:"var(--muted)"}}>
                  {a.kind === "invoice" ? <Icon.Doc size={12}/> :
                   a.kind === "stock"   ? <Icon.Box size={12}/> :
                   a.kind === "ai"      ? <Icon.Sparkle size={12}/> :
                   a.kind === "order"   ? <Icon.Check size={12}/> :
                   a.kind === "bank"    ? <Icon.Bank size={12}/> :
                                          <Icon.Users size={12}/>}
                </div>
                <div>
                  <div style={{fontSize:12, color: a.kind === "ai" ? "var(--ai)" : "var(--fg)"}}>{a.text}</div>
                  {a.amt && <div className="mono muted" style={{fontSize:11, marginTop:2}}>{a.amt}</div>}
                </div>
                <div className="mono muted" style={{fontSize:10}}>{a.t}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid mt-16" style={{gridTemplateColumns:"1fr 1fr 1fr", gap:12}}>
        {/* Credit card */}
        <div className="ai-card" style={{padding:16, position:"relative"}}>
          <span className="ai-tag"><Icon.Sparkle size={10}/> AI ASSESSED</span>
          <div className="eyebrow">Your credit score</div>
          <div className="row mt-8" style={{gap:14, alignItems:"flex-end"}}>
            <div className="num-xl" style={{lineHeight:1}}>81<span className="mono muted" style={{fontSize:14}}>/100</span></div>
            <div>
              <div className="pill good mb-4"><span className="dot"/>Strong</div>
              <div className="mono muted" style={{fontSize:10}}>+2 since last month</div>
            </div>
          </div>
          <div className="progress mt-12 ai"><span style={{width:"81%"}}/></div>
          <div className="muted" style={{fontSize:12, marginTop:10}}>
            You're pre-qualified for <b style={{color:"var(--ink)"}}>up to UZS 240 M</b> in financing.
          </div>
          <Button variant="primary" className="block mt-12" onClick={() => go("/smb/credit")}>
            View financing options <Icon.Arrow size={13}/>
          </Button>
        </div>

        {/* Quick actions */}
        <div className="card">
          <div className="panel-title">Quick actions</div>
          <div className="card-body" style={{padding:10}}>
            {[
              {i:"Plus",  l:"Create invoice",       s:"Bill a customer",       p:"/smb/finance/invoices"},
              {i:"Scan",  l:"Scan waybill / invoice",s:"AI extracts line items",p:"/smb/inventory/scan", ai:true},
              {i:"Box",   l:"Add inventory",        s:"New SKU or batch",      p:"/smb/inventory"},
              {i:"Coin",  l:"Record payment",       s:"Mark a bill paid",      p:"/smb/finance/bills"},
            ].map((a, i) => {
              const IC = Icon[a.i];
              return (
                <div key={i} className="row hairline-b" style={{padding:"10px 8px", cursor:"pointer", gap:10, borderBottom: i===3 ? "0" : undefined}}
                     onClick={() => go(a.p)}>
                  <div style={{width:28, height:28, borderRadius:6, background: a.ai ? "var(--ai-bg)": "var(--bg)", display:"grid", placeItems:"center", color: a.ai ? "var(--ai)":"var(--ink)"}}>
                    <IC size={14}/>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13, color:"var(--ink)"}}>{a.l} {a.ai && <AIChip/>}</div>
                    <div className="muted" style={{fontSize:11}}>{a.s}</div>
                  </div>
                  <Icon.ChevRight size={13} className="muted"/>
                </div>
              );
            })}
          </div>
        </div>

        {/* Inventory alert */}
        <div className="card">
          <div className="panel-title">Needs attention <span className="sp"/><Pill tone="warn" dot={false}>4</Pill></div>
          <div className="card-body" style={{padding:10}}>
            {[
              {t:"Sugar refined 50kg", d:"86 in stock · min 120", tone:"warn"},
              {t:"Laundry detergent 6kg", d:"12 in stock · min 40", tone:"bad"},
              {t:"Mineral water 1.5L", d:"0 in stock · out of stock", tone:"bad"},
              {t:"INV-1475 overdue", d:"Retail Centre · 8 days", tone:"warn"},
            ].map((x,i) => (
              <div key={i} className="row hairline-b" style={{padding:"8px 4px", gap:10, borderBottom: i===3 ? "0" : undefined}}>
                <Pill tone={x.tone} dot={false}>!</Pill>
                <div style={{flex:1}}>
                  <div style={{fontSize:12.5, color:"var(--ink)"}}>{x.t}</div>
                  <div className="muted" style={{fontSize:11}}>{x.d}</div>
                </div>
                <Icon.ChevRight size={13} className="muted"/>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating copilot */}
      <button
        onClick={() => go("/smb/copilot")}
        style={{
          position:"fixed", right:24, bottom:24, zIndex: 30,
          background: "var(--ink)", color:"var(--surface)",
          padding:"10px 16px", borderRadius: 999, border:"1px solid var(--ink)",
          boxShadow:"var(--shadow-3)", display:"flex", alignItems:"center", gap:10, cursor:"pointer",
          fontFamily:"var(--sans)", fontSize:13, fontWeight:500,
        }}>
        <span style={{color:"var(--ai)"}}><Icon.Sparkle size={14}/></span>
        Ask Copilot
        <span className="kbd" style={{background:"rgba(255,255,255,0.15)", color:"rgba(255,255,255,0.7)", borderColor:"transparent"}}>⌘J</span>
      </button>
    </div>
  );
}

/* ---------------- AI Copilot (streaming) ---------------- */
const COPILOT_THREAD = [
  { role: "user", text: "Why is my cash tight this month?" },
  { role: "ai", streaming: true, answer: {
    summary: "Three factors together explain your March cash tightness — each with direct ERP evidence:",
    points: [
      {
        title: "Receivables stretched",
        body: "Average payment days moved from 22 to 34. UZS 86.4M is currently unpaid past terms, driven mostly by 2 large customers.",
        refs: [{ l: "12 invoices outstanding", p: "/smb/finance/invoices" }, { l: "Retail Centre · 18d overdue", p: "/smb/finance/invoices" }],
      },
      {
        title: "Inventory build-up",
        body: "You grew stock by 18% to meet an expected Ramadan spike. UZS 62M is tied up in sugar, rice, and beverages that are turning more slowly than last year.",
        refs: [{ l: "Sugar · 86u, turn 4.2x", p: "/smb/inventory" }, { l: "Beverage category report", p: "/smb/reports" }],
      },
      {
        title: "Supplier prepayment",
        body: "UZS 42M prepaid to Samarkand Oil Co. on 3 March for a Q2 delivery. The cash will return as margin starting mid-April.",
        refs: [{ l: "Payment PO-0445", p: "/smb/finance/bills" }],
      },
    ],
    recommendation: "Based on your credit profile you pre-qualify for a UZS 120M short-term working-capital line — decision in 24 hours.",
  }},
];

function CopilotPage({ go }) {
  const [thread, setThread] = useStateS(COPILOT_THREAD);
  const [prompt, setPrompt] = useStateS("");
  const [streamIdx, setStreamIdx] = useStateS(0);
  const [pointIdx, setPointIdx] = useStateS(0);
  const boxRef = useRef();

  // Character-by-character stream for the AI message
  useEffectS(() => {
    const ai = thread[thread.length-1];
    if (!ai || ai.role !== "ai" || !ai.streaming) return;
    const total = ai.answer.summary.length + ai.answer.points.reduce((a,p) => a + p.title.length + p.body.length + 2, 0) + ai.answer.recommendation.length;
    if (streamIdx < total) {
      const id = setTimeout(() => setStreamIdx(s => Math.min(s+6, total)), 14);
      return () => clearTimeout(id);
    }
  }, [streamIdx, thread]);

  const lastAI = thread[thread.length-1];
  const streaming = lastAI?.role === "ai" && lastAI?.streaming;
  const done = streaming && streamIdx >= (
    lastAI.answer.summary.length + lastAI.answer.points.reduce((a,p) => a + p.title.length + p.body.length + 2, 0) + lastAI.answer.recommendation.length
  );

  // Compute partial text based on streamIdx
  const partial = (() => {
    if (!streaming) return null;
    let left = streamIdx;
    const ans = lastAI.answer;
    const summary = ans.summary.slice(0, Math.max(0, left)); left -= ans.summary.length;
    const points = ans.points.map(p => {
      if (left <= 0) return null;
      const t = p.title.slice(0, Math.max(0, left)); left -= p.title.length;
      if (left <= 0) return { ...p, title:t, body:"" , partial:true};
      const b = p.body.slice(0, Math.max(0, left)); left -= p.body.length;
      return { ...p, title:t, body:b, partial: left < 0 };
    }).filter(Boolean);
    const rec = left > 0 ? ans.recommendation.slice(0, left) : "";
    return { summary, points, rec };
  })();

  const suggestions = [
    "Which customers are my biggest cash-flow risks?",
    "Forecast next month's revenue",
    "Which SKUs should I stop ordering?",
    "Estimate my tax liability for Q1",
  ];

  return (
    <div style={{display:"grid", gridTemplateColumns:"260px 1fr", height:"calc(100vh - var(--topbar-h))"}}>
      {/* threads sidebar */}
      <div className="hairline-r" style={{padding:12, overflowY:"auto", background:"var(--surface-2)"}}>
        <div className="row mb-12">
          <Button variant="primary" size="sm" className="block" icon={<Icon.Plus size={12}/>}>New chat</Button>
        </div>
        <div className="eyebrow mb-4">Today</div>
        <div className="nav-item active" style={{fontSize:12.5}}>
          <Icon.Sparkle size={12} style={{color:"var(--ai)"}}/>
          <span>Cash flow this month</span>
        </div>
        <div className="nav-item" style={{fontSize:12.5}}>
          <span className="ico"><Icon.Hash size={12}/></span>
          <span>Top 10 SKUs margin</span>
        </div>
        <div className="eyebrow mt-12 mb-4">Last week</div>
        {[
          "Ramadan demand forecast",
          "Customer concentration risk",
          "VAT reconciliation help",
          "Restock thresholds",
        ].map((x,i) => (
          <div key={i} className="nav-item" style={{fontSize:12.5}}>
            <span className="ico"><Icon.Hash size={12}/></span>
            <span style={{overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{x}</span>
          </div>
        ))}
      </div>

      <div style={{display:"flex", flexDirection:"column", minWidth:0, background:"var(--bg)"}}>
        <div className="hairline-b" style={{padding:"10px 20px", background:"var(--surface)", display:"flex", alignItems:"center", gap:10}}>
          <div className="avatar" style={{background:"var(--ai-bg)", color:"var(--ai)", width:26, height:26}}><Icon.Sparkle size={14}/></div>
          <div>
            <div style={{fontSize:13, fontWeight:500, color:"var(--ink)"}}>SQB Copilot <AIChip/></div>
            <div className="mono muted" style={{fontSize:10}}>GROUNDED IN YOUR ERP · UZ · RU · EN</div>
          </div>
          <span className="sp"/>
          <div className="chip"><Icon.Globe size={12}/> English</div>
          <Button variant="ghost" size="sm" icon={<Icon.Download size={12}/>}>Export</Button>
        </div>

        <div ref={boxRef} style={{flex:1, overflowY:"auto", padding:"24px 20px 120px", maxWidth: 880, margin:"0 auto", width:"100%"}}>
          {/* User message */}
          <div className="row" style={{justifyContent:"flex-end", marginBottom:24}}>
            <div style={{background:"var(--surface)", border:"1px solid var(--line)", borderRadius:"14px 14px 2px 14px", padding:"10px 14px", maxWidth:520}}>
              {thread[0].text}
            </div>
            <div className="avatar warm" style={{width:28, height:28, marginLeft:10}}>JA</div>
          </div>

          {/* AI message */}
          <div style={{display:"grid", gridTemplateColumns:"28px 1fr", gap:10}}>
            <div className="avatar" style={{background:"var(--ai-bg)", color:"var(--ai)", width:28, height:28}}>
              <Icon.Sparkle size={13}/>
            </div>
            <div className="ai-card" style={{padding:18, position:"relative"}}>
              <span className="ai-tag"><Icon.Sparkle size={10}/> AI · GROUNDED</span>
              <div style={{fontSize:14, lineHeight:1.55, color:"var(--fg)"}}>
                {partial ? (
                  <>
                    <p style={{margin:"0 0 12px"}}>
                      {partial.summary}{!partial.points.length && !done && <span className="caret"/>}
                    </p>
                    {partial.points.map((p, i) => (
                      <div key={i} className="hairline" style={{padding:12, borderRadius:6, marginBottom:10, background:"var(--surface-2)"}}>
                        <div className="row" style={{gap:10, alignItems:"flex-start"}}>
                          <div className="mono" style={{minWidth:18, color:"var(--ai)", fontWeight:600}}>0{i+1}</div>
                          <div style={{flex:1}}>
                            <div style={{fontWeight:500, color:"var(--ink)"}}>
                              {p.title}
                              {p.partial && !p.body && <span className="caret"/>}
                            </div>
                            <div style={{marginTop:4, color:"var(--fg-2)", fontSize:13}}>
                              {p.body}
                              {p.partial && p.body && <span className="caret"/>}
                            </div>
                            {p.body.length > 0 && !p.partial && (
                              <div className="row mt-8" style={{gap:6, flexWrap:"wrap"}}>
                                {p.refs.map((r, ri) => (
                                  <span key={ri} className="chip" style={{fontSize:11, background:"var(--surface)"}} onClick={() => go(r.p)}>
                                    <Icon.Link size={10}/> {r.l}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {partial.rec && (
                      <div className="banner ai mt-12">
                        <span className="ico"><Icon.Bolt size={15}/></span>
                        <div style={{flex:1, color:"var(--ink)"}}>
                          <div className="title">Suggested action</div>
                          <div className="desc">{partial.rec}{!done && <span className="caret"/>}</div>
                        </div>
                        {done && <Button variant="ai" size="sm" onClick={() => go("/smb/credit")}>Explore financing <Icon.Arrow size={12}/></Button>}
                      </div>
                    )}
                  </>
                ) : null}
              </div>
              {done && (
                <div className="row mt-12" style={{gap:6, borderTop:"1px solid var(--line)", paddingTop:10}}>
                  <span className="mono muted" style={{fontSize:10}}>Sources: <a style={{color:"var(--ai)"}}>ERP · 12 invoices · 2 bills · 1 PO</a></span>
                  <span className="sp"/>
                  <button className="icon-btn"><Icon.Copy size={13}/></button>
                  <button className="icon-btn"><Icon.Refresh size={13}/></button>
                </div>
              )}
            </div>
          </div>

          {done && (
            <div className="mt-16">
              <div className="eyebrow mb-8">Suggested follow-ups</div>
              <div className="row" style={{flexWrap:"wrap", gap:6}}>
                {suggestions.map((s, i) => (
                  <button key={i} className="chip" style={{cursor:"pointer"}} onClick={() => setPrompt(s)}>
                    {s} <Icon.Arrow size={10} className="muted"/>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* composer */}
        <div style={{position:"sticky", bottom:0, background:"var(--bg)", padding:"14px 20px 20px", borderTop:"1px solid var(--line)"}}>
          <div className="hairline" style={{background:"var(--surface)", borderRadius:8, padding:10, maxWidth: 860, margin:"0 auto"}}>
            <textarea className="input" value={prompt} onChange={e=>setPrompt(e.target.value)}
              placeholder="Ask about your cash flow, customers, stock, or anything in your ERP…"
              rows={2} style={{border:0, boxShadow:"none", resize:"none"}}/>
            <div className="row" style={{gap:8, borderTop:"1px solid var(--line-2)", paddingTop:8}}>
              <Button variant="ghost" size="sm" icon={<Icon.Paperclip size={12}/>}>Attach</Button>
              <Button variant="ghost" size="sm" icon={<Icon.Globe size={12}/>}>English</Button>
              <Button variant="ghost" size="sm" icon={<Icon.Database size={12}/>}>ERP data</Button>
              <span className="sp"/>
              <span className="mono muted" style={{fontSize:10}}>Haiku 4.5 · grounded</span>
              <Button variant="primary" size="sm" icon={<Icon.Arrow size={12}/>}>Send</Button>
            </div>
          </div>
          <div className="mono muted tc mt-8" style={{fontSize:10}}>
            Answers are grounded in your ERP data from the last 18 months. Verify important decisions.
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { SMBDashboard, CopilotPage });
