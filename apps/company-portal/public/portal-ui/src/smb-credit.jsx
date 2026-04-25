// SMB — Credit & Financing + Loan application form

function SmbCredit({ go }) {
  const [loading, setLoading] = useStateS(true);
  const [error, setError] = useStateS("");
  const [overview, setOverview] = useStateS(null);

  const loadCreditOverview = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/dashboard/overview", {
        method: "GET",
        credentials: "include",
        cache: "no-store"
      });
      const body = await response.json();
      if (!response.ok || !body.data?.creditScore) {
        throw new Error(body.error?.message || body.message || "Unable to load credit profile.");
      }
      setOverview(body.data);
      setError("");
    } catch (loadError) {
      setOverview(null);
      setError(loadError instanceof Error ? loadError.message : "Unable to load credit profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffectS(() => {
    loadCreditOverview();
  }, []);

  const credit = overview?.creditScore || null;
  const score = credit?.score || 0;
  const scoreBand = credit?.band ? String(credit.band).toUpperCase() : "PENDING";
  const pd = Number(credit?.probabilityOfDefault || 0);
  const suggestedLimit = Number(credit?.suggestedLimitUzs || 0);

  const factorMeta = [
    { key: "paymentDiscipline", n: "Payment discipline", w: 24 },
    { key: "cashFlowCoverage", n: "Cash-flow coverage", w: 22 },
    { key: "leverage", n: "Leverage ratio", w: 20, invert: true },
    { key: "inventoryPressure", n: "Inventory pressure", w: 16, invert: true },
    { key: "revenueMomentum", n: "Revenue momentum", w: 18 }
  ];
  const factorValues = credit?.factors || {};
  const factors = factorMeta.map((meta) => {
    const raw = Number(factorValues[meta.key] || 0);
    const normalized = meta.invert ? (1 - raw) : raw;
    const pct = Math.max(0, Math.min(100, Math.round(normalized * 100)));
    const tone = pct >= 75 ? "good" : pct >= 50 ? "warn" : "bad";
    const state = pct >= 75 ? "Strong" : pct >= 50 ? "Moderate" : "Weak";
    const note = `${pct}% contribution`;
    return { ...meta, s: state, tone, note, strengthPct: pct };
  });

  const PRODUCTS = credit ? [
    {
      name:"Short-term working capital",
      rate:`${Math.max(14, 22 - Math.round(score / 12))}%`,
      term:"6–12 months",
      max:`${fmtShort(Math.round(suggestedLimit))} UZS`,
      fee:"0.5%",
      desc:"Cover cash-flow gaps, supplier prepayments, and seasonal stock.",
      good:true,
      match:Math.max(65, Math.min(98, score + 10)),
    },
    {
      name:"Trade finance line",
      rate:`${Math.max(12, 20 - Math.round(score / 14))}%`,
      term:"Revolving · 24mo",
      max:`${fmtShort(Math.round(suggestedLimit * 1.4))} UZS`,
      fee:"0.3%",
      desc:"Pay suppliers up to 60 days before your customers pay you.",
      good:score >= 60,
      match:Math.max(55, Math.min(94, score + 4)),
    },
    {
      name:"Equipment financing",
      rate:`${Math.max(11, 18 - Math.round(score / 15))}%`,
      term:"Up to 5 years",
      max:`${fmtShort(Math.round(suggestedLimit * 3.2))} UZS`,
      fee:"1.0%",
      desc:"Vehicles, refrigeration, packaging lines. Collateralized.",
      good:false,
      match:Math.max(40, Math.min(88, score - 8)),
    },
  ] : [];

  const exportReport = () => {
    if (!credit) return;
    const rows = [
      ["key", "value"],
      ["score", String(credit.score)],
      ["band", String(credit.band)],
      ["probability_of_default", String(credit.probabilityOfDefault)],
      ["suggested_limit_uzs", String(credit.suggestedLimitUzs)],
      ...factors.map((factor) => [`factor_${factor.key}`, String(factor.strengthPct)])
    ];
    const csv = rows.map((row) => row.map((cell) => String(cell).includes(",") ? `"${String(cell).replace(/"/g, "\"\"")}"` : String(cell)).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `credit-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1200);
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Credit & Financing</h1>
          <div className="sub">AI-assessed in real time from your ERP data. Decision in 24 hours, no paperwork.</div>
        </div>
        <span className="sp"/>
        <Button variant="ghost" icon={<Icon.Refresh size={13}/>} onClick={loadCreditOverview}>Refresh</Button>
        <Button variant="ghost" icon={<Icon.Download size={13}/>} onClick={exportReport} disabled={!credit}>Download credit report</Button>
      </div>
      {error && (
        <Banner tone="warn" title="Live credit profile unavailable">
          {error}
        </Banner>
      )}

      <div className="grid" style={{gridTemplateColumns:"1.1fr 1.4fr", gap:12, marginBottom:16}}>
        {/* Score card */}
        <div className="ai-card" style={{padding:20, position:"relative"}}>
          <span className="ai-tag"><Icon.Sparkle size={10}/> AI ASSESSED</span>
          <div className="eyebrow">Your score as seen by SQB Bank</div>
          <div className="row mt-8" style={{gap:24, alignItems:"center"}}>
            <div style={{position:"relative"}}>
              <Donut size={132} thickness={14}
                segments={[
                  { value: score, color: score >= 75 ? "var(--good)" : score >= 55 ? "var(--warn)" : "var(--bad)" },
                  { value: Math.max(0, 100 - score), color:"var(--line)" },
                ]}
                center={
                  <div>
                    <div className="num-xl" style={{fontSize:34, lineHeight:1}}>{score}</div>
                    <div className="mono muted" style={{fontSize:10}}>/100 · {scoreBand}</div>
                  </div>
                }/>
            </div>
            <div style={{flex:1}}>
              <div className="row gap-8 mb-8"><Pill tone={score >= 75 ? "good" : score >= 55 ? "warn" : "bad"} dot={false}>{score >= 80 ? "A-" : score >= 65 ? "B+" : score >= 50 ? "C" : "D"}</Pill><span className="muted">Risk tier</span></div>
              <div className="row gap-8 mb-8"><span className="pill info">PD {(pd * 100).toFixed(1)}%</span></div>
              <div className="muted" style={{fontSize:12}}>
                {loading ? "Scoring profile from live ERP data..." : credit ? `Model: ${credit.model?.name || "Open scorecard model"}` : "No live score yet."}
              </div>
              <div className="row mt-12" style={{gap:20}}>
                <div><div className="eyebrow">Pre-qualified</div><div className="num-md">{credit ? `${fmtShort(suggestedLimit)} UZS` : "—"}</div></div>
                <div><div className="eyebrow">Interest from</div><div className="num-md">{credit ? `${Math.max(11, 22 - Math.round(score / 12))}%` : "—"}</div></div>
                <div><div className="eyebrow">Decision</div><div className="num-md">24h</div></div>
              </div>
            </div>
          </div>
        </div>

        {/* Factor breakdown */}
        <div className="card card-pad-0">
          <div className="panel-title">Factor breakdown <AIChip/> <span className="sp"/><span className="mono muted" style={{fontSize:10}}>UPDATED 2 MIN AGO</span></div>
          <div style={{padding:8}}>
            {factors.length === 0 ? (
              <div className="empty" style={{minHeight:180}}>
                <Icon.Chart size={24}/>
                <h3>{loading ? "Loading factors..." : "No factor breakdown"}</h3>
                <div>{loading ? "Computing live credit factors." : "Credit model factors are not available yet."}</div>
              </div>
            ) : factors.map((f,i) => (
              <div key={i} className="row hairline-b" style={{padding:"8px 10px", borderBottom: i === factors.length-1 ? "0" : undefined, gap:12}}>
                <div style={{flex:1}}>
                  <div className="row gap-8">
                    <div style={{fontSize:12.5, color:"var(--ink)"}}>{f.n}</div>
                    <span className="mono muted" style={{fontSize:10}}>· weight {f.w}%</span>
                  </div>
                  <div className="muted" style={{fontSize:11, marginTop:2}}>{f.note}</div>
                </div>
                <div style={{width:120}}>
                  <div className="progress"><span style={{width: `${f.strengthPct}%`, background: f.tone==="good"?"var(--good)":f.tone==="warn"?"var(--warn)":"var(--bad)"}}/></div>
                </div>
                <Pill tone={f.tone}>{f.s}</Pill>
              </div>
            ))}
          </div>
        </div>
      </div>

      <h2 className="mb-8">Eligible products</h2>
      <div className="grid grid-3" style={{gap:12}}>
        {PRODUCTS.length === 0 ? (
          <div className="card">
            <div className="empty" style={{minHeight:200}}>
              <Icon.Handshake size={24}/>
              <h3>{loading ? "Loading offers..." : "No products available"}</h3>
              <div>{loading ? "Evaluating live offers." : "Products appear after score computation."}</div>
            </div>
          </div>
        ) : PRODUCTS.map((p,i) => (
          <div key={i} className={`card ${p.good ? "" : ""}`} style={{padding:0, borderColor: p.good ? "var(--ai-line)" : "var(--line)"}}>
            <div className="panel-title" style={{background: p.good ? "var(--ai-bg)" : "var(--surface-2)", color: p.good ? "var(--ai)" : "var(--muted)"}}>
              {p.good && <Icon.Sparkle size={11}/>}
              {p.good ? "RECOMMENDED" : "ALSO ELIGIBLE"}
              <span className="sp"/>
              <span className="mono" style={{fontSize:10}}>MATCH {p.match}%</span>
            </div>
            <div style={{padding:16}}>
              <div style={{fontSize:15, fontWeight:500, color:"var(--ink)"}}>{p.name}</div>
              <div className="muted" style={{fontSize:12, marginTop:4}}>{p.desc}</div>
              <div className="grid grid-3 mt-12" style={{gap:6}}>
                <div><div className="eyebrow">Rate</div><div className="num-md">{p.rate}</div></div>
                <div><div className="eyebrow">Term</div><div className="num-md" style={{fontSize:13}}>{p.term}</div></div>
                <div><div className="eyebrow">Max</div><div className="num-md" style={{fontSize:13}}>{p.max}</div></div>
              </div>
              <div className="divider"/>
              <div className="row">
                <span className="muted" style={{fontSize:11}}>Origination fee {p.fee}</span>
                <span className="sp"/>
                <Button variant={i===0 ? "primary" : "ghost"} size="sm" onClick={() => go("/smb/loan")}>
                  Apply {i===0 && <Icon.Arrow size={12}/>}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 banner ai">
        <span className="ico"><Icon.Sparkle size={15}/></span>
        <div style={{flex:1}}>
          <div className="title">Why pre-filled? Because we already have the data.</div>
          <div className="desc">Your revenue trend, AR/AP, inventory turnover, and SQB transaction history are pulled automatically. No uploading bank statements or filling 12-page forms.</div>
        </div>
      </div>
    </div>
  );
}

function LoanApplication({ go }) {
  const [step, setStep] = useStateS(0);
  const [signed, setSigned] = useStateS(false);
  const [amount, setAmount] = useStateS(180);
  const [term, setTerm] = useStateS(9);
  const steps = ["Review", "Sign", "Submitted"];

  return (
    <div className="page">
      <div className="row mb-8" style={{fontSize:12, color:"var(--muted)"}}>
        <a style={{cursor:"pointer"}} onClick={() => go("/smb/credit")}>Credit & Financing</a>
        <span>/</span>
        <span>Short-term working capital</span>
      </div>
      <div className="page-head">
        <div>
          <h1>Loan application</h1>
          <div className="sub">Short-term working capital · pre-qualified up to <b style={{color:"var(--ink)"}}>240 M UZS</b> at 18% · <span style={{color:"var(--ai)"}}>Decision in 24 hours</span></div>
        </div>
        <span className="sp"/>
        <div className="row gap-12">
          {steps.map((s,i) => (
            <div key={s} className="row gap-4" style={{color: i <= step ? "var(--ink)" : "var(--muted)"}}>
              <span className="mono" style={{
                width:18, height:18, borderRadius:"50%", display:"grid", placeItems:"center",
                background: i < step ? "var(--ink)" : i === step ? "var(--ai-bg)" : "var(--bg)",
                color: i < step ? "var(--surface)" : i === step ? "var(--ai)" : "var(--muted)",
                border: `1px solid ${i===step ? "var(--ai-line)" : "var(--line)"}`,
                fontSize: 10,
              }}>{i < step ? "✓" : i+1}</span>
              <span style={{fontSize:12}}>{s}</span>
            </div>
          ))}
        </div>
      </div>

      {step === 0 && (
        <div className="grid" style={{gridTemplateColumns:"2fr 1fr", gap:12}}>
          <div className="col gap-12">
            <div className="card"><div className="card-body">
              <h2>Loan terms</h2>
              <div className="grid grid-2 mt-8" style={{gap:16}}>
                <Field label={`Amount · ${amount} M UZS`}>
                  <input type="range" min="20" max="240" value={amount} onChange={e=>setAmount(+e.target.value)} style={{width:"100%"}}/>
                  <div className="row mono muted" style={{fontSize:11, justifyContent:"space-between"}}><span>20M</span><span>240M (max)</span></div>
                </Field>
                <Field label={`Term · ${term} months`}>
                  <input type="range" min="3" max="12" value={term} onChange={e=>setTerm(+e.target.value)} style={{width:"100%"}}/>
                  <div className="row mono muted" style={{fontSize:11, justifyContent:"space-between"}}><span>3 mo</span><span>12 mo</span></div>
                </Field>
                <Field label="Purpose">
                  <select className="select" defaultValue="inventory">
                    <option value="inventory">Inventory financing</option>
                    <option>Working capital</option>
                    <option>Equipment</option>
                  </select>
                </Field>
                <Field label="Disbursement account">
                  <input className="input mono" defaultValue="20208 000 100 100 001 · SQB" disabled/>
                </Field>
              </div>
              <div className="hairline mt-12" style={{padding:12, borderRadius:6, background:"var(--surface-2)"}}>
                <div className="row">
                  <div><div className="eyebrow">Est. monthly payment</div><div className="num-md">{((amount*1e6)*(0.18/12) / (1 - Math.pow(1+0.18/12, -term))/1e6).toFixed(1)}M UZS</div></div>
                  <span className="sp"/>
                  <div><div className="eyebrow">Total interest</div><div className="num-md">{((((amount*1e6)*(0.18/12) / (1 - Math.pow(1+0.18/12, -term)))*term - amount*1e6)/1e6).toFixed(1)}M UZS</div></div>
                  <span className="sp"/>
                  <div><div className="eyebrow">APR</div><div className="num-md">18%</div></div>
                </div>
              </div>
            </div></div>

            <div className="card"><div className="card-body">
              <div className="row mb-8"><h2>Pre-filled from your ERP</h2><span className="sp"/><AIChip label="AUTO-FILLED"/></div>
              <div className="grid grid-2" style={{gap:10}}>
                {[
                  ["Company", "Kamolot Savdo LLC"],
                  ["TIN", "301 452 776"],
                  ["Owner", "Jasur Azimov · +998 90 *** 14 82"],
                  ["Business type", "Wholesale distribution"],
                  ["Revenue · trailing 12m", "2 484 000 000 UZS"],
                  ["Avg. cash on hand", "62 400 000 UZS"],
                  ["Inventory value", "412 700 000 UZS"],
                  ["Receivables", "86 400 000 UZS"],
                  ["Employees", "42"],
                  ["SQB since", "January 2024"],
                ].map(([k,v], i) => (
                  <div key={i} className="hairline" style={{padding:10, borderRadius:6, background:"var(--surface-2)"}}>
                    <div className="eyebrow">{k}</div>
                    <div style={{fontSize:13, color:"var(--ink)", fontWeight:500, marginTop:2}} className={k.includes("TIN")||k.includes("Revenue")||k.includes("cash")||k.includes("Inventory")||k.includes("Receivables") ? "mono" : ""}>{v}</div>
                  </div>
                ))}
              </div>
            </div></div>
          </div>

          <div className="col gap-12">
            <div className="ai-card" style={{padding:16}}>
              <span className="ai-tag"><Icon.Sparkle size={10}/> AI</span>
              <h2>AI risk preview</h2>
              <p className="muted" style={{fontSize:12, marginTop:2}}>Here's what the bank will see when they review your application.</p>
              <div className="divider"/>
              <div className="row mb-8"><span className="muted">Expected decision</span><span className="sp"/><Pill tone="good">Approve</Pill></div>
              <div className="row mb-8"><span className="muted">Confidence</span><span className="sp"/><span className="mono" style={{color:"var(--ai)"}}>94%</span></div>
              <div className="row"><span className="muted">Est. rate</span><span className="sp"/><span className="mono" style={{color:"var(--ink)"}}>18%</span></div>
              <div className="progress ai mt-12"><span style={{width:"94%"}}/></div>
            </div>
            <div className="card"><div className="card-body">
              <h2>Documents</h2>
              <div className="muted" style={{fontSize:12}}>No upload needed — we have everything.</div>
              <div className="col gap-4 mt-8">
                {["Tax returns · 2023, 2024","Bank statements (SQB)","VAT returns","P&L + Balance sheet","Inventory valuation"].map((d,i) => (
                  <div key={i} className="row"><Icon.Check size={13} style={{color:"var(--good)"}}/><span style={{fontSize:12.5}}>{d}</span></div>
                ))}
              </div>
            </div></div>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="grid" style={{gridTemplateColumns:"2fr 1fr", gap:12}}>
          <div className="card"><div className="card-body">
            <h2>Review and sign</h2>
            <p className="muted" style={{fontSize:12}}>By signing below you confirm the application is accurate and consent to SQB Bank pulling your ERP data for this assessment.</p>
            <div className="hairline mt-12" style={{padding:16, borderRadius:6, background:"var(--surface-2)", fontSize:12, lineHeight:1.6, maxHeight:260, overflowY:"auto"}}>
              <div className="eyebrow">Loan agreement summary</div>
              <p><b>Borrower:</b> Kamolot Savdo LLC, TIN 301 452 776</p>
              <p><b>Lender:</b> SQB Bank, licence 0003</p>
              <p><b>Principal:</b> {amount} 000 000 UZS at 18% p.a., term {term} months</p>
              <p><b>Purpose:</b> Inventory financing for Q2 seasonal stock</p>
              <p><b>Repayment:</b> Equal monthly installments auto-debited from SQB account 20208 000 100 100 001.</p>
              <p><b>Early repayment:</b> Permitted at any time without penalty.</p>
              <p><b>Default:</b> 30+ days triggers grace period, 60+ days invokes guarantor clause.</p>
              <p className="muted">Full agreement (18 pages) will be emailed upon signature.</p>
            </div>
            <div className="mt-12 row"><input type="checkbox" checked={signed} onChange={e=>setSigned(e.target.checked)} id="sign"/><label htmlFor="sign" style={{fontSize:12.5}}>I, Jasur Azimov, have read and agree to the loan terms above.</label></div>
            <div className="hairline mt-12" style={{padding:16, borderRadius:6, textAlign:"center"}}>
              <div className="eyebrow mb-4">E-signature</div>
              {signed ? (
                <div style={{fontFamily:"'Brush Script MT', cursive", fontSize:32, color:"var(--ink)"}}>Jasur Azimov</div>
              ) : (
                <div className="muted">Tap above to sign</div>
              )}
            </div>
          </div></div>
          <div className="col gap-12">
            <div className="card" style={{padding:14}}>
              <div className="eyebrow">Summary</div>
              <div className="grid grid-2 mt-8" style={{gap:6}}>
                <div><div className="muted" style={{fontSize:11}}>Amount</div><div className="num-md" style={{fontSize:14}}>{amount}M UZS</div></div>
                <div><div className="muted" style={{fontSize:11}}>Term</div><div className="num-md" style={{fontSize:14}}>{term} mo</div></div>
                <div><div className="muted" style={{fontSize:11}}>Rate</div><div className="num-md" style={{fontSize:14}}>18%</div></div>
                <div><div className="muted" style={{fontSize:11}}>Decision</div><div className="num-md" style={{fontSize:14}}>24h</div></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div style={{maxWidth:640, margin:"40px auto", textAlign:"center"}}>
          <div style={{width:72, height:72, borderRadius:"50%", background:"var(--good-bg)", color:"var(--good)", margin:"0 auto 16px", display:"grid", placeItems:"center"}}>
            <Icon.Check size={32}/>
          </div>
          <h1 style={{fontSize:26}}>Application submitted</h1>
          <p className="muted">Application <span className="mono" style={{color:"var(--ink)"}}>LA-2398</span> has been sent to SQB Bank's credit queue. Expect a decision within 24 hours.</p>

          <div className="card mt-16" style={{textAlign:"left"}}>
            <div className="panel-title">Application status</div>
            <div style={{padding:16}}>
              {[
                {s:"Submitted", t:"Just now", d:true},
                {s:"AI pre-scoring", t:"Running · ~2 minutes", d:true, active:true},
                {s:"Credit officer review", t:"Expected within 4–6 hours"},
                {s:"Decision", t:"Within 24 hours"},
                {s:"Funds disbursed", t:"Same day as approval"},
              ].map((x,i) => (
                <div key={i} className="row" style={{padding:"8px 0", gap:12, opacity: x.d ? 1 : 0.55}}>
                  <div style={{width:16, height:16, borderRadius:"50%", border:`1.5px solid ${x.d?"var(--good)":"var(--line)"}`, background: x.d ? "var(--good)" : "transparent", display:"grid", placeItems:"center"}}>
                    {x.d && <Icon.Check size={10} style={{color:"var(--surface)"}}/>}
                  </div>
                  <div style={{flex:1}}><div style={{color:"var(--ink)", fontWeight: x.active ? 500 : 400}}>{x.s}</div><div className="muted" style={{fontSize:11}}>{x.t}</div></div>
                  {x.active && <Pill tone="ai">In progress</Pill>}
                </div>
              ))}
            </div>
          </div>
          <div className="row mt-16" style={{justifyContent:"center"}}>
            <Button variant="ghost" onClick={() => go("/smb/home")}>Back to dashboard</Button>
            <Button variant="primary" onClick={() => go("/bank/credit-queue")}>View as bank <Icon.Arrow size={13}/></Button>
          </div>
        </div>
      )}

      {step < 2 && (
        <div className="row mt-16">
          <Button variant="ghost" onClick={() => step===0 ? go("/smb/credit") : setStep(step-1)}><Icon.ChevLeft size={13}/> Back</Button>
          <span className="sp"/>
          {step === 0 && <Button variant="primary" onClick={() => setStep(1)}>Continue to sign <Icon.Arrow size={13}/></Button>}
          {step === 1 && <Button variant="primary" disabled={!signed} onClick={() => setStep(2)}>Submit application <Icon.Arrow size={13}/></Button>}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { SmbCredit, LoanApplication });
