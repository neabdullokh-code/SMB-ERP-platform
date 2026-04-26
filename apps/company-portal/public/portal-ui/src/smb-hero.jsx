// SMB — Dashboard (hero) + AI Copilot (hero, streaming)

function SMBDashboard({ go }) {
  const [dashboard, setDashboard] = useStateS(null);
  const [loading, setLoading] = useStateS(true);
  const [error, setError] = useStateS("");
  const [invoiceOpen, setInvoiceOpen] = useStateS(false);
  const [creatingInvoice, setCreatingInvoice] = useStateS(false);
  const [invoiceError, setInvoiceError] = useStateS("");
  const [inventoryOpen, setInventoryOpen] = useStateS(false);
  const [creatingInventory, setCreatingInventory] = useStateS(false);
  const [inventoryError, setInventoryError] = useStateS("");
  const [warehouses, setWarehouses] = useStateS([]);
  const [invoiceForm, setInvoiceForm] = useStateS({
    counterpartyName: "",
    counterpartyEmail: "",
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    description: "Sales invoice",
    quantity: "1",
    unitPrice: "1000000"
  });
  const [inventoryForm, setInventoryForm] = useStateS({
    warehouseId: "",
    sku: "",
    name: "",
    category: "General",
    reorderPoint: "10",
    unitCostUzs: "10000"
  });

  const loadDashboard = async () => {
    try {
      const response = await fetch("/api/dashboard/overview", {
        method: "GET",
        credentials: "include",
        cache: "no-store"
      });
      const body = await response.json();
      if (!response.ok || !body.data) {
        throw new Error(body.error?.message || body.message || "Unable to load dashboard.");
      }
      setDashboard(body.data);
      setError("");
    } catch (loadError) {
      setDashboard(null);
      setError(loadError instanceof Error ? loadError.message : "Unable to load dashboard.");
    } finally {
      setLoading(false);
    }
  };

  const loadWarehouses = async () => {
    try {
      const response = await fetch("/api/inventory/warehouses", {
        method: "GET",
        credentials: "include",
        cache: "no-store"
      });
      const body = await response.json();
      if (response.ok && body?.data?.warehouses) {
        setWarehouses(body.data.warehouses);
        setInventoryForm((prev) => ({
          ...prev,
          warehouseId: prev.warehouseId || body.data.warehouses[0]?.id || ""
        }));
      }
    } catch {
      setWarehouses([]);
    }
  };

  useEffectS(() => {
    loadDashboard();
    loadWarehouses();
  }, []);

  const fmtMillions = (value) => {
    const num = Number(value || 0);
    return `${(num / 1000000).toFixed(1).replace(/\.0$/, "")}`;
  };

  const toCsvValue = (value) => {
    const text = value == null ? "" : String(value);
    if (/["\n,]/.test(text)) return `"${text.replace(/"/g, "\"\"")}"`;
    return text;
  };

  const exportDashboard = () => {
    if (!dashboard) return;
    const rows = [
      ["section", "key", "value"],
      ["kpi", "revenue_month_uzs", String(dashboard.kpis?.revenueMonth || 0)],
      ["kpi", "cash_on_hand_uzs", String(dashboard.kpis?.cashOnHand || 0)],
      ["kpi", "inventory_value_uzs", String(dashboard.kpis?.inventoryValue || 0)],
      ["kpi", "pending_orders", String(dashboard.kpis?.pendingOrders || 0)],
      ["kpi", "overdue_invoices", String(dashboard.kpis?.overdueInvoices || 0)],
      ["credit", "score", String(dashboard.creditScore?.score || 0)],
      ["credit", "band", dashboard.creditScore?.band || ""],
      ["credit", "pd", String(dashboard.creditScore?.probabilityOfDefault || 0)],
      ...(dashboard.revenueSeries || []).map((point) => ([
        "revenue_series",
        point.label || "",
        `${point.revenue || 0}|${point.cashCollected || 0}|${point.net || 0}`
      ])),
      ...(dashboard.activities || []).map((item) => ([
        "activity",
        item.type || "",
        item.text || ""
      ])),
      ...(dashboard.needsAttention || []).map((item) => ([
        "needs_attention",
        item.type || "",
        item.title || ""
      ]))
    ];
    const csv = rows.map((row) => row.map(toCsvValue).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `dashboard-export-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

  const submitInvoice = async (event) => {
    event.preventDefault();
    if (!invoiceForm.counterpartyName || !invoiceForm.dueDate || !invoiceForm.description || Number(invoiceForm.quantity) <= 0 || Number(invoiceForm.unitPrice) <= 0) {
      setInvoiceError("Counterparty, due date, description, quantity, and unit price are required.");
      return;
    }
    setCreatingInvoice(true);
    setInvoiceError("");
    try {
      const response = await fetch("/api/finance/invoices", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          counterpartyName: invoiceForm.counterpartyName.trim(),
          counterpartyEmail: invoiceForm.counterpartyEmail.trim() || undefined,
          dueDate: invoiceForm.dueDate,
          lines: [
            {
              description: invoiceForm.description.trim(),
              quantity: String(Number(invoiceForm.quantity)),
              unitPrice: String(Number(invoiceForm.unitPrice)),
              taxRate: "0"
            }
          ]
        })
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error?.message || body.message || "Unable to create invoice.");
      }
      setInvoiceOpen(false);
      setInvoiceForm({
        counterpartyName: "",
        counterpartyEmail: "",
        dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
        description: "Sales invoice",
        quantity: "1",
        unitPrice: "1000000"
      });
      await loadDashboard();
    } catch (createError) {
      setInvoiceError(createError instanceof Error ? createError.message : "Unable to create invoice.");
    } finally {
      setCreatingInvoice(false);
    }
  };

  const submitInventory = async (event) => {
    event.preventDefault();
    if (!inventoryForm.warehouseId || !inventoryForm.sku || !inventoryForm.name || !inventoryForm.category) {
      setInventoryError("Warehouse, SKU, name, and category are required.");
      return;
    }
    setCreatingInventory(true);
    setInventoryError("");
    try {
      const response = await fetch("/api/inventory/items", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          warehouseId: inventoryForm.warehouseId,
          sku: inventoryForm.sku.trim(),
          name: inventoryForm.name.trim(),
          category: inventoryForm.category.trim(),
          reorderPoint: Math.max(Number.parseInt(inventoryForm.reorderPoint, 10) || 0, 0),
          unitCostUzs: String(Math.max(Number(inventoryForm.unitCostUzs) || 0, 0))
        })
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error?.message || body.message || "Unable to add inventory item.");
      }
      setInventoryOpen(false);
      setInventoryForm((prev) => ({
        ...prev,
        sku: "",
        name: "",
        category: "General",
        reorderPoint: "10",
        unitCostUzs: "10000"
      }));
      await loadDashboard();
    } catch (createError) {
      setInventoryError(createError instanceof Error ? createError.message : "Unable to add inventory item.");
    } finally {
      setCreatingInventory(false);
    }
  };

  const kpis = dashboard?.kpis || {};
  const revenuePoints = dashboard?.revenueSeries || [];
  const revenueData = revenuePoints.map((point) => Math.round(point.revenue / 1000000));
  const cashCollectedData = revenuePoints.map((point) => Math.round(point.cashCollected / 1000000));
  const cashNetData = revenuePoints.map((point) => Math.round(point.net / 1000000));
  const revenueLabels = revenuePoints.map((point) => point.label);
  const activities = dashboard?.activities || [];
  const needsAttention = dashboard?.needsAttention || [];
  const credit = dashboard?.creditScore || null;
  const creditTone = !credit ? "warn" : credit.score >= 80 ? "good" : credit.score >= 60 ? "warn" : "bad";

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow mb-4">Good morning, Jasur</div>
          <h1>Kamolot Savdo · Tashkent</h1>
          <div className="sub">
            {loading
              ? "Loading dashboard..."
              : dashboard
                ? `${new Date(dashboard.generatedAt).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })} · ${activities.length} live activities`
                : "Live data unavailable"}
          </div>
        </div>
        <span className="sp"/>
        <Button variant="ghost" icon={<Icon.Refresh size={13}/>} onClick={loadDashboard}>Refresh</Button>
        <Button variant="ghost" icon={<Icon.Download size={13}/>} onClick={exportDashboard} disabled={!dashboard}>Export</Button>
        <Button variant="primary" icon={<Icon.Plus size={13}/>} onClick={() => setInvoiceOpen(true)}>New invoice</Button>
      </div>
      {error && (
        <Banner tone="warn" title="Live dashboard unavailable">
          {error}
        </Banner>
      )}

      <div className="grid grid-4 mb-16">
        <Kpi label="Revenue · this month" value={fmtMillions(kpis.revenueMonth)} unit="M UZS"
             delta={`${kpis.revenueDeltaPct >= 0 ? "+" : ""}${Number(kpis.revenueDeltaPct || 0).toFixed(1)}%`} deltaLabel="vs prev month" trend={Number(kpis.revenueDeltaPct || 0) >= 0 ? "up" : "down"}
             spark={<Sparkline data={revenueData} width={64} height={24}/>}/>
        <Kpi label="Cash on hand" value={fmtMillions(kpis.cashOnHand)} unit="M UZS"
             delta={Number(kpis.cashOnHand || 0) >= 0 ? "healthy" : "negative"} deltaLabel="current month net" trend={Number(kpis.cashOnHand || 0) >= 0 ? "up" : "down"}
             spark={<Sparkline data={cashNetData} width={64} height={24} stroke={Number(kpis.cashOnHand || 0) >= 0 ? "var(--ink)" : "var(--bad)"}/>}/>
        <Kpi label="Inventory value" value={fmtMillions(kpis.inventoryValue)} unit="M UZS"
             delta={`${kpis.activeSkus || 0}`} deltaLabel="active SKUs" trend="up"
             spark={<Sparkline data={revenueData} width={64} height={24}/>}/>
        <Kpi label="Pending orders" value={String(kpis.pendingOrders || 0)} unit="open"
             delta={`${kpis.overdueInvoices || 0}`} deltaLabel="overdue invoices" trend={Number(kpis.overdueInvoices || 0) > 0 ? "down" : "up"}
             spark={<div className="sparkbars">{cashCollectedData.map((h,i)=><span key={i} style={{height: `${Math.max(4, h/2)}px`}}/>)}</div>}/>
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
            {revenueData.length >= 2 ? (
              <LineChart
                width={760} height={240}
                categories={revenueLabels}
                series={[
                  { data: revenueData, color:"var(--ink)", dots:true, area:true },
                  { data: cashCollectedData, color:"var(--ai)", dashed:true },
                ]}
                padding={[18,20,28,44]}
              />
            ) : (
              <div className="empty" style={{minHeight:240}}>
                <Icon.Chart size={24}/>
                <h3>{loading ? "Loading trend..." : "No revenue trend yet"}</h3>
                <div>{loading ? "Waiting for live metrics." : "Once transactions post, trend lines will appear."}</div>
              </div>
            )}
          </div>
        </div>

        <div className="card card-pad-0">
          <div className="panel-title">Activity
            <span className="sp"/>
            <a className="mono muted" style={{cursor:"pointer", fontSize:10}} onClick={() => go("/smb/finance/invoices")}>VIEW ALL →</a>
          </div>
          <div style={{maxHeight:280, overflowY:"auto"}}>
            {activities.length === 0 ? (
              <div className="empty" style={{minHeight:180}}>
                <Icon.Doc size={22}/>
                <h3>{loading ? "Loading activity..." : "No recent activity"}</h3>
                <div>{loading ? "Fetching live events." : "New operations will appear here in real time."}</div>
              </div>
            ) : activities.map((a, i) => (
              <div key={i} className="hairline-b" style={{padding:"10px 12px", display:"grid", gridTemplateColumns:"28px 1fr auto", gap:10, alignItems:"flex-start", cursor:"pointer"}}
                   onClick={() => go(a.actionPath || "/smb/home")}>
                <div style={{width:22, height:22, borderRadius:4, background:"var(--bg)", display:"grid", placeItems:"center", color:"var(--muted)"}}>
                  {a.type === "invoice" ? <Icon.Doc size={12}/> :
                   a.type === "inventory" ? <Icon.Box size={12}/> :
                   a.type === "order" ? <Icon.Check size={12}/> :
                   a.type === "bill" ? <Icon.Coin size={12}/> :
                                          <Icon.Users size={12}/>}
                </div>
                <div>
                  <div style={{fontSize:12, color:"var(--fg)"}}>{a.text}</div>
                  {a.amount && <div className="mono muted" style={{fontSize:11, marginTop:2}}>{a.amount}</div>}
                </div>
                <div className="mono muted" style={{fontSize:10}}>{a.timeLabel}</div>
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
            <div className="num-xl" style={{lineHeight:1}}>{credit ? credit.score : "—"}<span className="mono muted" style={{fontSize:14}}>/100</span></div>
            <div>
              <div className={`pill ${creditTone} mb-4`}><span className="dot"/>{credit ? String(credit.band || "good").replace(/_/g, " ") : "pending"}</div>
              <div className="mono muted" style={{fontSize:10}}>
                {credit ? `PD ${(Number(credit.probabilityOfDefault || 0) * 100).toFixed(1)}% · ${credit.model?.name || "Open model"}` : "Waiting for latest risk computation"}
              </div>
            </div>
          </div>
          <div className="progress mt-12 ai"><span style={{width:`${credit ? credit.score : 0}%`}}/></div>
          <div className="muted" style={{fontSize:12, marginTop:10}}>
            {credit ? <>You're pre-qualified for <b style={{color:"var(--ink)"}}>up to UZS {fmtShort(credit.suggestedLimitUzs || 0)} </b> in financing.</> : "Pre-qualification appears after live data is loaded."}
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
              {i:"Plus",  l:"Create invoice",       s:"Bill a customer",       onClick:() => setInvoiceOpen(true)},
              {i:"Scan",  l:"Scan waybill / invoice",s:"AI extracts line items",onClick:() => go("/smb/inventory/scan"), ai:true},
              {i:"Box",   l:"Add inventory",        s:"Create SKU in a warehouse",onClick:() => setInventoryOpen(true)},
              {i:"Coin",  l:"Record payment",       s:"Open bill payments",    onClick:() => go("/smb/finance/bills")},
            ].map((a, i) => {
              const IC = Icon[a.i];
              return (
                <div key={i} className="row hairline-b" style={{padding:"10px 8px", cursor:"pointer", gap:10, borderBottom: i===3 ? "0" : undefined}}
                     onClick={a.onClick}>
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
          <div className="panel-title">Needs attention <span className="sp"/><Pill tone="warn" dot={false}>{needsAttention.length}</Pill></div>
          <div className="card-body" style={{padding:10}}>
            {needsAttention.map((x,i) => (
              <div key={i} className="row hairline-b" style={{padding:"8px 4px", gap:10, borderBottom: i===3 ? "0" : undefined, cursor:"pointer"}}
                   onClick={() => go(x.actionPath || "/smb/home")}>
                <Pill tone={x.severity === "bad" ? "bad" : "warn"} dot={false}>!</Pill>
                <div style={{flex:1}}>
                  <div style={{fontSize:12.5, color:"var(--ink)"}}>{x.title}</div>
                  <div className="muted" style={{fontSize:11}}>{x.detail}</div>
                </div>
                <Icon.ChevRight size={13} className="muted"/>
              </div>
            ))}
            {needsAttention.length === 0 && (
              <div className="empty" style={{minHeight:140}}>
                <Icon.Check size={22}/>
                <h3>{loading ? "Scanning alerts..." : "No critical alerts"}</h3>
                <div>{loading ? "Checking invoices and stock levels." : "No overdue invoices or low-stock alerts right now."}</div>
              </div>
            )}
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

      <Modal
        open={invoiceOpen}
        onClose={() => {
          if (creatingInvoice) return;
          setInvoiceOpen(false);
          setInvoiceError("");
        }}
        title="Create invoice"
        footer={
          <>
            <Button variant="ghost" onClick={() => setInvoiceOpen(false)} disabled={creatingInvoice}>Cancel</Button>
            <span className="sp"/>
            <Button variant="primary" type="submit" form="dashboard-create-invoice" icon={<Icon.Check size={12}/>} disabled={creatingInvoice}>
              {creatingInvoice ? "Creating..." : "Create"}
            </Button>
          </>
        }
      >
        <form id="dashboard-create-invoice" onSubmit={submitInvoice}>
          <div className="grid grid-2" style={{gap:12}}>
            <Field label="Customer" required>
              <input className="input" value={invoiceForm.counterpartyName} onChange={(e) => setInvoiceForm((prev) => ({ ...prev, counterpartyName: e.target.value }))} placeholder="Oriental Trade LLC"/>
            </Field>
            <Field label="Email">
              <input className="input" value={invoiceForm.counterpartyEmail} onChange={(e) => setInvoiceForm((prev) => ({ ...prev, counterpartyEmail: e.target.value }))} placeholder="accounts@customer.uz"/>
            </Field>
            <Field label="Due date" required>
              <input className="input" type="date" value={invoiceForm.dueDate} onChange={(e) => setInvoiceForm((prev) => ({ ...prev, dueDate: e.target.value }))}/>
            </Field>
            <Field label="Line description" required>
              <input className="input" value={invoiceForm.description} onChange={(e) => setInvoiceForm((prev) => ({ ...prev, description: e.target.value }))}/>
            </Field>
            <Field label="Quantity" required>
              <input className="input" type="number" min="1" step="0.01" value={invoiceForm.quantity} onChange={(e) => setInvoiceForm((prev) => ({ ...prev, quantity: e.target.value }))}/>
            </Field>
            <Field label="Unit price (UZS)" required>
              <input className="input" type="number" min="1" step="1" value={invoiceForm.unitPrice} onChange={(e) => setInvoiceForm((prev) => ({ ...prev, unitPrice: e.target.value }))}/>
            </Field>
          </div>
          {invoiceError && (
            <div className="banner warn mt-12">
              <span className="ico"><Icon.Alert size={15}/></span>
              <div className="desc">{invoiceError}</div>
            </div>
          )}
        </form>
      </Modal>

      <Modal
        open={inventoryOpen}
        onClose={() => {
          if (creatingInventory) return;
          setInventoryOpen(false);
          setInventoryError("");
        }}
        title="Add inventory SKU"
        footer={
          <>
            <Button variant="ghost" onClick={() => setInventoryOpen(false)} disabled={creatingInventory}>Cancel</Button>
            <span className="sp"/>
            <Button variant="primary" type="submit" form="dashboard-add-inventory" icon={<Icon.Check size={12}/>} disabled={creatingInventory}>
              {creatingInventory ? "Saving..." : "Save SKU"}
            </Button>
          </>
        }
      >
        <form id="dashboard-add-inventory" onSubmit={submitInventory}>
          <div className="grid grid-2" style={{gap:12}}>
            <Field label="Warehouse" required>
              <select className="input" value={inventoryForm.warehouseId} onChange={(e) => setInventoryForm((prev) => ({ ...prev, warehouseId: e.target.value }))}>
                <option value="">Select warehouse</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>{warehouse.code} · {warehouse.name}</option>
                ))}
              </select>
            </Field>
            <Field label="SKU" required>
              <input className="input" value={inventoryForm.sku} onChange={(e) => setInventoryForm((prev) => ({ ...prev, sku: e.target.value }))} placeholder="SKU-NEW-001"/>
            </Field>
            <Field label="Name" required>
              <input className="input" value={inventoryForm.name} onChange={(e) => setInventoryForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="New inventory item"/>
            </Field>
            <Field label="Category" required>
              <input className="input" value={inventoryForm.category} onChange={(e) => setInventoryForm((prev) => ({ ...prev, category: e.target.value }))} placeholder="General"/>
            </Field>
            <Field label="Reorder point">
              <input className="input" type="number" min="0" step="1" value={inventoryForm.reorderPoint} onChange={(e) => setInventoryForm((prev) => ({ ...prev, reorderPoint: e.target.value }))}/>
            </Field>
            <Field label="Unit cost (UZS)">
              <input className="input" type="number" min="0" step="1" value={inventoryForm.unitCostUzs} onChange={(e) => setInventoryForm((prev) => ({ ...prev, unitCostUzs: e.target.value }))}/>
            </Field>
          </div>
          {inventoryError && (
            <div className="banner warn mt-12">
              <span className="ico"><Icon.Alert size={15}/></span>
              <div className="desc">{inventoryError}</div>
            </div>
          )}
        </form>
      </Modal>
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
