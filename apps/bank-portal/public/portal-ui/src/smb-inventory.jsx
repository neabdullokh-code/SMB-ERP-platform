// SMB inventory screens: list, detail, OCR scan (animated)

function InventoryList({ go }) {
  const [q, setQ] = useStateS("");
  const [cat, setCat] = useStateS("All");
  const cats = ["All", ...new Set(PRODUCTS.map(p => p.cat))];
  const rows = PRODUCTS.filter(p => (cat==="All"||p.cat===cat) && (q==="" || p.name.toLowerCase().includes(q.toLowerCase()) || p.sku.includes(q)));

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Inventory</h1>
          <div className="sub">312 SKUs across 8 categories · value <span className="mono" style={{color:"var(--ink)"}}>412 700 000 UZS</span></div>
        </div>
        <span className="sp"/>
        <Button variant="ai" icon={<Icon.Scan size={13}/>} onClick={() => go("/smb/inventory/scan")}>Scan waybill</Button>
        <Button variant="ghost" icon={<Icon.Upload size={13}/>}>Import Excel</Button>
        <Button variant="primary" icon={<Icon.Plus size={13}/>}>Add product</Button>
      </div>

      <div className="grid grid-4 mb-16">
        <Kpi label="Total SKUs" value="312" delta="+8 this week" trend="up"/>
        <Kpi label="Low stock" value="14" delta="−3 vs last week" trend="up"/>
        <Kpi label="Out of stock" value="2" delta="Mineral water, Nivea" trend="down"/>
        <Kpi label="Avg. turnover" value="6.2x" unit="/year" delta="+0.4" trend="up"/>
      </div>

      <div className="card card-pad-0">
        <div className="tbl-toolbar">
          <div className="input-wrap" style={{width:280}}>
            <span className="prefix"><Icon.Search size={13}/></span>
            <input className="input with-prefix" placeholder="Search SKU or name" value={q} onChange={e=>setQ(e.target.value)}/>
          </div>
          <div className="row gap-4">
            {cats.slice(0,6).map(c => (
              <button key={c} className={`chip ${cat===c ? "":""}`} onClick={() => setCat(c)}
                style={{background: cat===c ? "var(--ink)" : undefined, color: cat===c ? "var(--surface)" : undefined, borderColor: cat===c ? "var(--ink)" : undefined}}>{c}</button>
            ))}
            <span className="chip filter-add"><Icon.Plus size={11}/> Add filter</span>
          </div>
          <span className="sp"/>
          <div className="mono muted" style={{fontSize:11}}>{rows.length} results</div>
          <Button variant="ghost" size="sm" icon={<Icon.Download size={12}/>}>Export</Button>
          <Button variant="ghost" size="sm" icon={<Icon.More size={13}/>}/>
        </div>
        <div style={{overflowX:"auto"}}>
          <table className="tbl compact">
            <thead>
              <tr>
                <th className="check"><input type="checkbox"/></th>
                <th>SKU</th><th>Product</th><th>Category</th>
                <th className="tr">Stock</th><th className="tr">Min</th>
                <th className="tr">Unit price</th><th className="tr">Value</th>
                <th>Last movement</th><th>Status</th><th style={{width:40}}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(p => {
                const tone = p.status === "In stock" ? "good" : p.status === "Low" ? "warn" : "bad";
                const val = p.stock * p.price;
                return (
                  <tr key={p.sku} onClick={() => go("/smb/inventory/detail")} style={{cursor:"pointer"}}>
                    <td className="check"><input type="checkbox"/></td>
                    <td className="id">{p.sku}</td>
                    <td style={{color:"var(--ink)", fontWeight:500}}>{p.name}</td>
                    <td className="dim">{p.cat}</td>
                    <td className="num">{p.stock.toLocaleString("en-US").replace(/,/g," ")}</td>
                    <td className="num dim">{p.min}</td>
                    <td className="num">{fmtUZS(p.price)}</td>
                    <td className="num">{fmtUZS(val)}</td>
                    <td className="dim mono" style={{fontSize:11}}>{p.mvmt}</td>
                    <td><Pill tone={tone}>{p.status}</Pill></td>
                    <td><button className="icon-btn"><Icon.More size={14}/></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function InventoryDetail({ go }) {
  const p = PRODUCTS[0];
  const history = [920, 860, 1040, 980, 1180, 1240];
  return (
    <div className="page">
      <div className="row mb-8" style={{fontSize:12, color:"var(--muted)"}}>
        <a style={{cursor:"pointer"}} onClick={() => go("/smb/inventory")}>Inventory</a>
        <span>/</span>
        <span className="id mono">{p.sku}</span>
      </div>
      <div className="page-head">
        <div>
          <div className="eyebrow mb-4">{p.cat}</div>
          <h1>{p.name}</h1>
          <div className="row gap-8 mt-4">
            <span className="id mono muted">SKU {p.sku}</span>
            <span className="sep-dot"/>
            <span className="muted">Supplied by Samarkand Oil Co.</span>
            <span className="sep-dot"/>
            <Pill tone="good">In stock</Pill>
          </div>
        </div>
        <span className="sp"/>
        <Button variant="ghost" icon={<Icon.Refresh size={13}/>}>Transfer</Button>
        <Button variant="primary" icon={<Icon.Pencil size={13}/>}>Adjust stock</Button>
      </div>

      <div className="grid grid-4 mb-16">
        <Kpi label="On hand" value="1 240" unit="units"/>
        <Kpi label="Unit price" value="62 000" unit="UZS"/>
        <Kpi label="Stock value" value="76.9" unit="M UZS" spark={<Sparkline data={history} width={64} height={24}/>}/>
        <Kpi label="Turnover" value="8.1x" unit="/yr" delta="+1.2" trend="up"/>
      </div>

      <div className="grid" style={{gridTemplateColumns:"2fr 1fr", gap:12}}>
        <div className="card card-pad-0">
          <div className="panel-title">Stock history <span className="sp"/><div className="btn-group"><button className="btn sm">1M</button><button className="btn sm primary">6M</button><button className="btn sm">1Y</button></div></div>
          <div style={{padding:8}}>
            <LineChart width={720} height={200} categories={REVENUE_LABELS} series={[{data: history, color:"var(--ink)", dots:true, area:true}, {data:[300,300,300,300,300,300], color:"var(--bad)", dashed:true}]}/>
            <div className="row gap-16 mono muted" style={{fontSize:10, padding:"4px 16px"}}>
              <span><span style={{display:"inline-block", width:8, height:2, background:"var(--ink)", marginRight:6}}/>On hand</span>
              <span><span style={{display:"inline-block", width:8, height:2, background:"var(--bad)", marginRight:6}}/>Min threshold</span>
            </div>
          </div>
        </div>
        <div className="card card-pad-0">
          <div className="panel-title">Movement log</div>
          <div>
            {[
              {d:"18 Mar · 09:40", t:"Received", q:"+120", src:"PO-0451 · Samarkand Oil", tone:"good"},
              {d:"17 Mar · 14:12", t:"Sale",     q:"−48",  src:"Oriental Trade LLC", tone:"bad"},
              {d:"16 Mar · 11:03", t:"Sale",     q:"−24",  src:"Retail Centre", tone:"bad"},
              {d:"15 Mar · 08:22", t:"Transfer", q:"−30",  src:"To Samarkand branch", tone:"info"},
              {d:"14 Mar · 17:50", t:"Received", q:"+200", src:"PO-0449 · Samarkand Oil", tone:"good"},
            ].map((m,i) => (
              <div key={i} className="hairline-b" style={{padding:"10px 14px", display:"grid", gridTemplateColumns:"1fr auto", gap:8}}>
                <div>
                  <div className="row gap-8"><Pill tone={m.tone} dot={false}>{m.t}</Pill><span className="mono" style={{fontSize:12, color: m.tone==="good"?"var(--good)":m.tone==="bad"?"var(--bad)":"var(--info)"}}>{m.q}</span></div>
                  <div className="muted" style={{fontSize:11, marginTop:4}}>{m.src}</div>
                </div>
                <div className="mono muted" style={{fontSize:11}}>{m.d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------ OCR Scan (animated) ------------ */
function OcrScan({ go }) {
  const [stage, setStage] = useStateS(0); // 0 drop, 1 scanning, 2 extracting, 3 done
  const [extracted, setExtracted] = useStateS([]);
  const [jobId, setJobId] = useStateS(null);

  const LINES = [
    { field:"Supplier",     val:"Samarkand Oil Co.", conf:98 },
    { field:"Document no.", val:"WB-23887",          conf:99 },
    { field:"Date",         val:"18 March 2026",     conf:97 },
    { field:"Currency",     val:"UZS",               conf:99 },
  ];
  const ITEMS = [
    { sku:"KS-0102", name:"Cooking oil, sunflower 5L",  qty:120, price:48_000, conf:96 },
    { sku:"KS-0104", name:"Sugar refined 50kg bag",     qty: 40, price:310_000, conf:92 },
    { sku:"KS-0210", name:"Rice, Devzira 25kg",         qty: 80, price:240_000, conf:94 },
    { sku:"?",       name:"Sunflower oil 10L (new SKU)",qty: 30, price:115_000, conf:74 },
  ];

  const start = () => {
    setStage(1); 
    setExtracted([]);
    setJobId("ocr_req_" + Math.random().toString(36).substring(7));

    setTimeout(() => {
      setStage(2);
      const all = [...LINES.map(x => ({type:"field", ...x})), ...ITEMS.map(x => ({type:"item", ...x}))];
      all.forEach((it, i) => setTimeout(() => setExtracted(prev => [...prev, it]), 350 + i*500));
      setTimeout(() => setStage(3), 350 + all.length*500 + 200);
    }, 1500);
  };

  return (
    <div className="page">
      <div className="row mb-8" style={{fontSize:12, color:"var(--muted)"}}>
        <a style={{cursor:"pointer"}} onClick={() => go("/smb/inventory")}>Inventory</a>
        <span>/</span>
        <span>Smart scan</span>
      </div>
      <div className="page-head">
        <div>
          <h1>Scan waybill or invoice <AIChip label="AI · OCR"/></h1>
          <div className="sub">Drop a supplier document and we'll extract supplier, dates, line items, and prices into your inventory.</div>
        </div>
        <span className="sp"/>
        {stage === 0 && <Button variant="primary" onClick={start} icon={<Icon.Play size={13}/>}>Use sample waybill</Button>}
        {stage === 3 && (
          <>
            <Button variant="ghost" onClick={() => { setStage(0); setExtracted([]); }}>Scan another</Button>
            <Button variant="primary" icon={<Icon.Check size={13}/>} onClick={() => go("/smb/inventory")}>Confirm & add to inventory</Button>
          </>
        )}
      </div>

      <div className="grid" style={{gridTemplateColumns:"1fr 1fr", gap:12, alignItems:"stretch"}}>
        {/* Left: document */}
        <div className="card card-pad-0" style={{minHeight:560, display:"flex", flexDirection:"column"}}>
          <div className="panel-title" style={{background: stage === 1 ? "var(--ai-bg)" : ""}}>
            Document preview
            <span className="sp"/>
            {stage > 0 && <span className="mono muted" style={{fontSize:10}}>WB-23887.pdf · 1 of 1</span>}
          </div>
          {stage === 0 ? (
            <div style={{flex:1, display:"grid", placeItems:"center", padding:24}}>
              <div className="hairline" style={{borderStyle:"dashed", padding:40, textAlign:"center", width:"100%", borderRadius:8, background:"var(--surface-2)"}}>
                <div style={{width:52, height:52, margin:"0 auto 10px", borderRadius:"50%", background:"var(--ai-bg)", color:"var(--ai)", display:"grid", placeItems:"center"}}>
                  <Icon.Upload size={22}/>
                </div>
                <div style={{fontWeight:500, color:"var(--ink)"}}>Drop an invoice or waybill</div>
                <div className="muted mt-4" style={{fontSize:12}}>PDF, JPG, PNG, HEIC · up to 20 MB</div>
                <Button className="mt-12" variant="primary" onClick={start}>Choose file</Button>
                <div className="mt-16 mono muted" style={{fontSize:10, letterSpacing:"0.08em"}}>OR</div>
                <Button className="mt-8" variant="ghost" onClick={start}>Use sample waybill from Samarkand Oil Co.</Button>
              </div>
            </div>
          ) : (
            <div style={{flex:1, padding:18, position:"relative", background:"var(--surface-2)"}}>
              {/* mock document */}
              <div className="hairline" style={{background:"var(--surface)", padding:20, minHeight:500, borderRadius:4, fontFamily:"var(--mono)", fontSize:11, position:"relative", overflow:"hidden"}}>
                <div style={{display:"flex", justifyContent:"space-between", borderBottom:"1px solid var(--line)", paddingBottom:8, marginBottom:10}}>
                  <div>
                    <div style={{fontWeight:600, color:"var(--ink)", fontSize:14, fontFamily:"var(--sans)"}}>Samarkand Oil Co.</div>
                    <div>TIN 302 101 554 · Samarkand, UZ</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontWeight:600, color:"var(--ink)"}}>WAYBILL / ТТН</div>
                    <div>No. WB-23887 · 18.03.2026</div>
                  </div>
                </div>
                <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14}}>
                  <div>From: Samarkand Oil Co., Samarkand</div>
                  <div>To: Kamolot Savdo LLC, Tashkent</div>
                </div>
                <table style={{width:"100%", borderCollapse:"collapse", fontSize:10}}>
                  <thead><tr style={{borderBottom:"1px solid var(--line)"}}>
                    <th style={{textAlign:"left", padding:"6px 4px"}}>Item</th>
                    <th style={{textAlign:"right", padding:"6px 4px"}}>Qty</th>
                    <th style={{textAlign:"right", padding:"6px 4px"}}>Price</th>
                    <th style={{textAlign:"right", padding:"6px 4px"}}>Total</th>
                  </tr></thead>
                  <tbody>
                    {["Cooking oil 5L ·120 · 48 000 · 5 760 000",
                      "Sugar refined 50kg ·40 · 310 000 · 12 400 000",
                      "Rice Devzira 25kg ·80 · 240 000 · 19 200 000",
                      "Sunflower oil 10L ·30 · 115 000 · 3 450 000"].map((r,i) => {
                      const parts = r.split("·");
                      return <tr key={i} style={{borderBottom:"1px solid var(--line-2)"}}>
                        <td style={{padding:"5px 4px"}}>{parts[0]}</td>
                        <td style={{padding:"5px 4px", textAlign:"right"}}>{parts[1]}</td>
                        <td style={{padding:"5px 4px", textAlign:"right"}}>{parts[2]}</td>
                        <td style={{padding:"5px 4px", textAlign:"right"}}>{parts[3]}</td>
                      </tr>;
                    })}
                  </tbody>
                </table>
                <div style={{marginTop:18, textAlign:"right"}}>
                  <div>Subtotal: 40 810 000 UZS</div>
                  <div>VAT 12%: 4 897 200 UZS</div>
                  <div style={{fontWeight:600, color:"var(--ink)"}}>Total: 45 707 200 UZS</div>
                </div>
                <div style={{marginTop:30, color:"var(--muted)"}}>
                  Delivered by: Oybek Rakhimov ______________<br/>
                  Received by: Bekzod Yusupov ______________
                </div>

                {/* scanning overlay */}
                {stage === 1 && (
                  <div style={{position:"absolute", inset:0, pointerEvents:"none"}}>
                    <div style={{position:"absolute", left:0, right:0, height:2, background:"var(--ai)", boxShadow:"0 0 14px var(--ai)", top:"50%", animation:"scanline 1.2s ease-in-out infinite"}}/>
                    <style>{`@keyframes scanline {0%{top:0}50%{top:100%}100%{top:0}}`}</style>
                  </div>
                )}
                {stage === 2 && (
                  <>
                    {/* field highlights */}
                    <div style={{position:"absolute", top:18, left:18, width:160, height:20, border:"1.5px solid var(--ai)", borderRadius:3, background:"var(--ai-bg)", opacity:0.35}}/>
                    <div style={{position:"absolute", top:18, right:18, width:160, height:36, border:"1.5px solid var(--ai)", borderRadius:3, background:"var(--ai-bg)", opacity:0.35}}/>
                    <div style={{position:"absolute", top:108, left:18, right:18, height:100, border:"1.5px solid var(--ai)", borderRadius:3, background:"var(--ai-bg)", opacity:0.25}}/>
                  </>
                )}
              </div>
              {stage === 1 && (
                <div style={{position:"absolute", left:18, right:18, bottom:18, padding:"8px 12px", background:"var(--ink)", color:"var(--surface)", borderRadius:6, display:"flex", alignItems:"center", gap:8, fontSize:12}}>
                  <Icon.Refresh size={13} className="spin" style={{color:"var(--ai)"}}/>
                  <span>Job <span className="mono" style={{color:"var(--ai)"}}>{jobId}</span> in BullMQ queue…</span>
                  <span className="sp"/>
                  <span className="mono" style={{opacity:0.7, fontSize:11}}>Processing via AI Pipeline</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: extracted */}
        <div className="card card-pad-0" style={{minHeight:560, display:"flex", flexDirection:"column", borderLeft: "2px solid var(--ai)"}}>
          <div className="panel-title" style={{background: stage === 3 ? "var(--good-bg)" : ""}}>
            <Icon.Sparkle size={11} style={{color:"var(--ai)"}}/>
            Extracted fields
            <span className="sp"/>
            {stage === 3 && (
              <div className="row gap-8">
                <span className="mono muted" style={{fontSize:10}}>Push result via WebSocket</span>
                <Pill tone="good">All verified</Pill>
              </div>
            )}
            {stage === 2 && <span className="mono" style={{fontSize:10, color:"var(--ai)"}}>Extracting… <span className="caret"/></span>}
          </div>
          {stage === 0 ? (
            <div style={{flex:1}} className="empty">
              <Icon.Scan size={24}/>
              <h3>Waiting for document</h3>
              <div>Extracted fields will appear here.</div>
            </div>
          ) : (
            <div style={{padding:12, flex:1, overflowY:"auto"}}>
              <div className="eyebrow mb-8">Header</div>
              <div className="grid grid-2" style={{gap:8}}>
                {LINES.map((l, i) => {
                  const done = extracted.some(e => e.type==="field" && e.field===l.field);
                  return (
                    <div key={l.field} className="hairline" style={{padding:10, borderRadius:6, background: done ? "var(--surface)" : "var(--surface-2)", opacity: done ? 1 : 0.5, transition:"opacity 200ms"}}>
                      <div className="eyebrow" style={{fontSize:9}}>{l.field}</div>
                      <div className="row mt-4" style={{justifyContent:"space-between"}}>
                        <div style={{fontSize:13, color:"var(--ink)", fontWeight:500}}>{done ? l.val : "…"}</div>
                        {done && <span className="pill ai" style={{fontSize:10}}>{l.conf}%</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="eyebrow mb-8 mt-16">Line items</div>
              <table className="tbl compact">
                <thead><tr><th>SKU</th><th>Product</th><th className="tr">Qty</th><th className="tr">Unit</th><th className="tr">Conf</th></tr></thead>
                <tbody>
                  {ITEMS.map((it, i) => {
                    const done = extracted.some(e => e.type==="item" && e.name===it.name);
                    const warn = it.conf < 80;
                    return (
                      <tr key={i} style={{opacity: done ? 1 : 0.3, transition:"opacity 200ms"}}>
                        <td className="id">{it.sku}</td>
                        <td>{it.name}</td>
                        <td className="num">{it.qty}</td>
                        <td className="num">{fmtUZS(it.price)}</td>
                        <td className="tr">
                          {done && <span className={`pill ${warn ? "warn" : "ai"}`} style={{fontSize:10}}>{it.conf}%</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {stage === 3 && (
                <Banner tone="warn" title="1 item needs review" action={<Button size="sm" variant="ghost">Review</Button>}>
                  "Sunflower oil 10L" doesn't match an existing SKU. Create a new SKU or map to existing.
                </Banner>
              )}
            </div>
          )}
          {stage === 3 && (
            <div className="modal-foot">
              <Button variant="ghost">Edit fields</Button>
              <span className="sp"/>
              <div className="mono muted" style={{fontSize:11, alignSelf:"center"}}>270 units · 45 707 200 UZS total</div>
              <Button variant="primary" icon={<Icon.Check size={13}/>} onClick={() => go("/smb/inventory")}>Add to inventory</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { InventoryList, InventoryDetail, OcrScan });
