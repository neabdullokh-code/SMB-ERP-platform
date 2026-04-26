/* SMB Documents: 1C-style journals + forms
 *
 *  - Goods receipts  (receipts IN the warehouse)
 *  - Goods issues    (issues OUT of the warehouse)
 *  - Inventory transfers (between two warehouses)
 *  - Production orders (BOM-driven: OUT raw, IN finished)
 *
 * Every page talks to the real platform API through the Next.js proxy at
 * /api/{documents,inventory,production}/*. The "Post and close" flow catches
 * the structured INSUFFICIENT_STOCK error returned by Phase 2a and highlights
 * the offending tabular rows in red.
 */

const {
  useState: useStateD,
  useEffect: useEffectD,
  useMemo: useMemoD,
  useCallback: useCallbackD
} = React;

/* ---------- API helpers ---------- */

async function apiFetch(path, init) {
  const headers = { ...(init && init.headers ? init.headers : {}) };
  const hasBody = init && init.body != null;
  if (hasBody && !headers["content-type"]) headers["content-type"] = "application/json";
  const res = await fetch(path, { credentials: "include", ...(init || {}), headers, cache: "no-store" });
  const ct = res.headers.get("content-type") || "";
  const body = ct.includes("application/json") ? await res.json() : null;
  return { ok: res.ok, status: res.status, body };
}

const DOC_CONFIG = {
  "goods-receipts": {
    title: "Goods receipts",
    subtitle: "Приходные накладные · пополняют склад",
    kindLabel: "Goods receipt",
    numberPrefix: "GR",
    journalPath: "/smb/documents/goods-receipts",
    newPath: "/smb/documents/goods-receipts/new",
    apiPath: "/api/documents/goods-receipts",
    showWarehouse: true,
    showCounterparty: true,
    showUnitCost: true
  },
  "goods-issues": {
    title: "Goods issues",
    subtitle: "Расходные накладные · списывают со склада",
    kindLabel: "Goods issue",
    numberPrefix: "GI",
    journalPath: "/smb/documents/goods-issues",
    newPath: "/smb/documents/goods-issues/new",
    apiPath: "/api/documents/goods-issues",
    showWarehouse: true,
    showCounterparty: true,
    showUnitCost: false
  },
  "inventory-transfers": {
    title: "Inventory transfers",
    subtitle: "Перемещение между складами",
    kindLabel: "Transfer",
    numberPrefix: "TR",
    journalPath: "/smb/documents/inventory-transfers",
    newPath: "/smb/documents/inventory-transfers/new",
    apiPath: "/api/documents/inventory-transfers",
    showWarehouse: false,
    showTransferWarehouses: true,
    showUnitCost: false
  },
  "production-orders": {
    title: "Production orders",
    subtitle: "Заказы на производство · BOM-driven",
    kindLabel: "Production order",
    numberPrefix: "PO",
    journalPath: "/smb/documents/production-orders",
    newPath: "/smb/documents/production-orders/new",
    apiPath: "/api/documents/production-orders",
    isProduction: true
  }
};

function statusTone(status) {
  if (status === "POSTED") return "good";
  if (status === "VOID") return "bad";
  return "warn"; /* DRAFT */
}

function statusLabel(status) {
  if (status === "POSTED") return "Posted";
  if (status === "VOID") return "Void";
  return "Draft";
}

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

/* ---------- Document journal (list view) ---------- */

function DocumentJournal({ go, kind }) {
  const config = DOC_CONFIG[kind];
  const [rows, setRows] = useStateD([]);
  const [loading, setLoading] = useStateD(true);
  const [error, setError] = useStateD(null);

  const loadDocs = useCallbackD(() => {
    setLoading(true);
    setError(null);
    apiFetch(config.apiPath, { method: "GET" }).then((res) => {
      if (!res.ok) {
        setError(
          (res.body && res.body.error && res.body.error.message) ||
            `Failed to load (HTTP ${res.status})`
        );
        setRows([]);
      } else {
        const data = (res.body && res.body.data) || {};
        const docs = data.documents || (res.body && res.body.documents) || [];
        setRows(docs);
      }
      setLoading(false);
    });
  }, [config.apiPath]);

  useEffectD(() => {
    loadDocs();
  }, [loadDocs]);

  function rowTotal(r) {
    if (r.totalAmountUzs != null && Number(r.totalAmountUzs) > 0) return Number(r.totalAmountUzs);
    const lines = Array.isArray(r.lines) ? r.lines : [];
    return lines.reduce((a, l) => a + Number(l.lineTotalUzs || l.quantity * l.unitCostUzs || 0), 0);
  }
  const total = rows.reduce((acc, r) => acc + rowTotal(r), 0);
  const postedCount = rows.filter((r) => r.status === "POSTED").length;
  const draftCount = rows.filter((r) => r.status === "DRAFT").length;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>{config.title}</h1>
          <div className="sub">
            {config.subtitle} ·{" "}
            <span className="mono" style={{ color: "var(--ink)" }}>
              {rows.length} documents
            </span>
          </div>
        </div>
        <span className="sp" />
        <Button
          variant="primary"
          icon={<Icon.Plus size={13} />}
          onClick={() => go(config.newPath)}
        >
          Create new
        </Button>
      </div>

      <div className="grid grid-4 mb-16">
        <Kpi label="Documents" value={rows.length} />
        <Kpi label="Posted" value={postedCount} />
        <Kpi label="Drafts" value={draftCount} />
        <Kpi label="Value" value={fmtUZS(total)} unit="UZS" />
      </div>

      <div className="card card-pad-0">
        <div className="tbl-toolbar">
          <div className="mono muted" style={{ fontSize: 11 }}>
            {loading ? "Loading…" : `${rows.length} documents`}
          </div>
          <span className="sp" />
          <Button variant="ghost" size="sm" icon={<Icon.Refresh size={12} />} onClick={loadDocs} disabled={loading}>
            Refresh
          </Button>
        </div>

        {error && (
          <div style={{ padding: "12px 16px" }}>
            <Banner tone="bad" title="Cannot load journal">{error}</Banner>
          </div>
        )}

        <div style={{ overflowX: "auto" }}>
          <table className="tbl compact">
            <thead>
              <tr>
                <th>Doc #</th>
                <th>Date</th>
                <th>{config.isProduction ? "BOM / Output" : "Warehouse"}</th>
                {!config.isProduction && <th>Counterparty</th>}
                {config.isProduction && <th className="tr">Units</th>}
                <th className="tr">Total</th>
                <th>Status</th>
                <th style={{ width: 40 }} />
              </tr>
            </thead>
            <tbody>
              {!loading && rows.length === 0 && !error && (
                <tr>
                  <td colSpan={config.isProduction ? 7 : 7} className="dim" style={{ padding: 24 }}>
                    No documents yet. Click <strong>Create new</strong> to start.
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.id} style={{ cursor: "pointer" }}>
                  <td className="id mono">{r.documentNumber || r.id.slice(0, 8)}</td>
                  <td className="dim">{formatDate(r.documentDate)}</td>
                  {config.isProduction ? (
                    <td style={{ color: "var(--ink)" }}>
                      {r.bomCode || r.bomId || "—"}
                    </td>
                  ) : (
                    <td style={{ color: "var(--ink)" }}>{r.warehouseCode || r.warehouseId || "—"}</td>
                  )}
                  {!config.isProduction && (
                    <td className="dim">{r.counterpartyId ? r.counterpartyId.slice(0, 8) : "—"}</td>
                  )}
                  {config.isProduction && <td className="num">{r.plannedUnits || "—"}</td>}
                  <td className="num">{fmtUZS(rowTotal(r))}</td>
                  <td>
                    <Pill tone={statusTone(r.status)}>{statusLabel(r.status)}</Pill>
                  </td>
                  <td>
                    <button className="icon-btn">
                      <Icon.More size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ---------- Warehouse / item / BOM catalog hooks ---------- */

function useCatalog() {
  const [warehouses, setWarehouses] = useStateD([]);
  const [items, setItems] = useStateD([]);
  const [boms, setBoms] = useStateD([]);
  const [loaded, setLoaded] = useStateD(false);

  useEffectD(() => {
    let cancelled = false;
    Promise.all([
      apiFetch("/api/inventory/warehouses", { method: "GET" }),
      apiFetch("/api/inventory/items", { method: "GET" }),
      apiFetch("/api/production/boms", { method: "GET" })
    ]).then(([wh, it, bm]) => {
      if (cancelled) return;
      const whList = (wh.body && wh.body.data && wh.body.data.warehouses) || (wh.body && wh.body.warehouses) || [];
      const itList = (it.body && it.body.data && it.body.data.items) || (it.body && it.body.items) || [];
      const bmRaw = (bm.body && bm.body.data) || bm.body || {};
      const bmList = Array.isArray(bmRaw) ? bmRaw : (bmRaw.boms || []);
      setWarehouses(whList.map((w) => ({
        id: w.id, code: w.code, name: w.name
      })));
      setItems(itList.map((i) => ({
        id: i.id, sku: i.sku, name: i.name, unitCost: Number(i.unitCostUzs || 0)
      })));
      const skuToId = new Map(itList.map((i) => [i.sku, i.id]));
      setBoms(bmList.map((b) => ({
        id: b.id, code: b.code, version: b.version,
        outputItemId: b.outputItemId || skuToId.get(b.outputSku)
      })));
      setLoaded(true);
    });
    return () => { cancelled = true; };
  }, []);

  return { warehouses, items, boms, loaded };
}

/* ---------- Shared form chrome ---------- */

function DocumentFormFooter({ busy, onSaveDraft, onPost, onPostClose, onCancel }) {
  return (
    <div className="row gap-8" style={{ marginTop: 16, justifyContent: "flex-end" }}>
      <Button variant="ghost" onClick={onCancel} disabled={busy}>
        Cancel
      </Button>
      <Button variant="ghost" onClick={onSaveDraft} disabled={busy}>
        Save draft
      </Button>
      <Button onClick={onPost} disabled={busy}>
        Post
      </Button>
      <Button variant="primary" onClick={onPostClose} disabled={busy}>
        {busy ? "Working…" : "Post and close"}
      </Button>
    </div>
  );
}

function ErrorBanner({ error, insufficientDetails }) {
  if (!error && !(insufficientDetails && insufficientDetails.length)) return null;
  if (insufficientDetails && insufficientDetails.length) {
    return (
      <Banner tone="bad" title="Insufficient stock">
        <ul style={{ margin: "4px 0 0 16px", padding: 0 }}>
          {insufficientDetails.map((d, i) => (
            <li key={i} style={{ fontSize: 12 }}>
              <strong>{d.itemName || d.itemSku || d.itemId}</strong> — available{" "}
              <span className="mono">{d.available}</span>, requested{" "}
              <span className="mono">{d.requested}</span>
            </li>
          ))}
        </ul>
      </Banner>
    );
  }
  return <Banner tone="bad" title="Cannot post this document">{error}</Banner>;
}

/* ---------- Goods receipt / goods issue / transfer form ---------- */

function emptyLine() {
  return { itemId: "", quantity: "", unitCostUzs: "" };
}

function InventoryDocumentForm({ go, kind }) {
  const config = DOC_CONFIG[kind];
  const catalog = useCatalog();

  const [documentDate, setDocumentDate] = useStateD(() => new Date().toISOString().slice(0, 10));
  const [documentNumber, setDocumentNumber] = useStateD("");
  const [warehouseId, setWarehouseId] = useStateD("");
  const [fromWarehouseId, setFromWarehouseId] = useStateD("");
  const [toWarehouseId, setToWarehouseId] = useStateD("");
  const [counterpartyId, setCounterpartyId] = useStateD("");
  const [notes, setNotes] = useStateD("");
  const [lines, setLines] = useStateD([emptyLine()]);
  const [draftId, setDraftId] = useStateD(null);
  const [busy, setBusy] = useStateD(false);
  const [error, setError] = useStateD(null);
  const [insufficient, setInsufficient] = useStateD([]);

  const itemById = useMemoD(() => {
    const m = new Map();
    catalog.items.forEach((i) => m.set(i.id, i));
    return m;
  }, [catalog.items]);

  const insufficientByItem = useMemoD(() => {
    const m = new Map();
    (insufficient || []).forEach((d) => m.set(d.itemId, d));
    return m;
  }, [insufficient]);

  function updateLine(index, patch) {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }
  function addLine() {
    setLines((prev) => [...prev, emptyLine()]);
  }
  function removeLine(index) {
    setLines((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  function collectPayload() {
    const base = {
      documentDate,
      documentNumber: documentNumber || undefined,
      notes: notes || undefined,
      lines: lines
        .filter((l) => l.itemId && Number(l.quantity) > 0)
        .map((l) => {
          const item = itemById.get(l.itemId);
          const qty = Number(l.quantity);
          const rawCost = l.unitCostUzs !== "" && l.unitCostUzs != null
            ? l.unitCostUzs
            : (item ? item.unitCost : 0);
          const cost = Number(rawCost);
          return {
            itemId: l.itemId,
            quantity: qty.toFixed(4),
            unitCostUzs: cost.toFixed(2)
          };
        })
    };
    if (config.showTransferWarehouses) {
      return {
        ...base,
        sourceWarehouseId: fromWarehouseId,
        destinationWarehouseId: toWarehouseId
      };
    }
    return { ...base, warehouseId, counterpartyId: counterpartyId || undefined };
  }

  async function saveOrUpdateDraft() {
    // Backend does not expose PATCH on document drafts; void the old draft
    // (if any) and always create a fresh one so user edits between failed
    // attempts are picked up.
    const payload = collectPayload();
    if (draftId) {
      try {
        await apiFetch(`${config.apiPath}/${draftId}/void`, {
          method: "POST",
          body: JSON.stringify({})
        });
      } catch (e) { /* ignore */ }
      setDraftId(null);
    }
    const res = await apiFetch(config.apiPath, {
      method: "POST",
      body: JSON.stringify(payload)
    });
    const docBody = (res.body && res.body.data && res.body.data.document) || (res.body && res.body.document);
    if (res.ok && docBody) {
      setDraftId(docBody.id);
    }
    return res;
  }

  async function handleSaveDraft() {
    setBusy(true);
    setError(null);
    setInsufficient([]);
    const res = await saveOrUpdateDraft();
    setBusy(false);
    if (!res.ok) {
      setError((res.body && res.body.error && res.body.error.message) || `HTTP ${res.status}`);
    }
  }

  async function handlePost(andClose) {
    setBusy(true);
    setError(null);
    setInsufficient([]);
    const draftRes = await saveOrUpdateDraft();
    if (!draftRes.ok) {
      setBusy(false);
      setError((draftRes.body && draftRes.body.error && draftRes.body.error.message) || "Failed to save draft");
      return;
    }
    const draftDoc = (draftRes.body && draftRes.body.data && draftRes.body.data.document) || (draftRes.body && draftRes.body.document);
    const id = (draftDoc && draftDoc.id) || draftId;
    const postRes = await apiFetch(`${config.apiPath}/${id}/post`, {
      method: "POST",
      body: JSON.stringify({})
    });
    setBusy(false);
    if (!postRes.ok) {
      const err = postRes.body && postRes.body.error;
      if (err && err.errorCode === "INSUFFICIENT_STOCK" && Array.isArray(err.details)) {
        setInsufficient(err.details);
      } else {
        setError((err && err.message) || `Failed to post (HTTP ${postRes.status})`);
      }
      return;
    }
    if (andClose) go(config.journalPath);
  }

  const isTransfer = !!config.showTransferWarehouses;

  return (
    <div className="page">
      <div className="row mb-8" style={{ fontSize: 12, color: "var(--muted)" }}>
        <a style={{ cursor: "pointer" }} onClick={() => go(config.journalPath)}>
          {config.title}
        </a>
        <span>/</span>
        <span>New</span>
      </div>

      <div className="page-head">
        <div>
          <div className="eyebrow mb-4">{config.kindLabel}</div>
          <h1>New {config.title.toLowerCase()}</h1>
          <div className="sub">
            Status: <Pill tone="warn">Draft</Pill> · posting writes to the inventory ledger
          </div>
        </div>
      </div>

      <ErrorBanner error={error} insufficientDetails={insufficient} />

      <div className="card" style={{ padding: 16, marginTop: 12 }}>
        <div className="grid grid-3 mb-16">
          <Field label="Document date" required>
            <input
              type="date"
              className="input"
              value={documentDate}
              onChange={(e) => setDocumentDate(e.target.value)}
            />
          </Field>
          <Field label="Document number" hint={`Auto-generated if blank (e.g. ${config.numberPrefix}-2026-000001)`}>
            <input
              className="input"
              placeholder={`${config.numberPrefix}-…`}
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
            />
          </Field>
          {!isTransfer && (
            <Field label="Warehouse" required>
              <select
                className="input"
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
              >
                <option value="">Select warehouse…</option>
                {catalog.warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.code} — {w.name}
                  </option>
                ))}
              </select>
            </Field>
          )}
          {isTransfer && (
            <>
              <Field label="From warehouse" required>
                <select
                  className="input"
                  value={fromWarehouseId}
                  onChange={(e) => setFromWarehouseId(e.target.value)}
                >
                  <option value="">Select source warehouse…</option>
                  {catalog.warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.code} — {w.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="To warehouse" required>
                <select
                  className="input"
                  value={toWarehouseId}
                  onChange={(e) => setToWarehouseId(e.target.value)}
                >
                  <option value="">Select destination…</option>
                  {catalog.warehouses
                    .filter((w) => w.id !== fromWarehouseId)
                    .map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.code} — {w.name}
                      </option>
                    ))}
                </select>
              </Field>
            </>
          )}
          {!isTransfer && config.showCounterparty && (
            <Field label="Counterparty ID" hint="Optional UUID (legacy field)">
              <input
                className="input"
                placeholder="00000000-0000-0000-0000-…"
                value={counterpartyId}
                onChange={(e) => setCounterpartyId(e.target.value)}
              />
            </Field>
          )}
        </div>

        <Field label="Notes">
          <textarea
            className="input"
            rows={2}
            placeholder="Internal comment"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Field>

        <div style={{ marginTop: 16 }}>
          <div className="row" style={{ alignItems: "baseline", marginBottom: 6 }}>
            <strong style={{ fontSize: 13 }}>Tabular section</strong>
            <span className="sp" />
            <Button variant="ghost" size="sm" icon={<Icon.Plus size={12} />} onClick={addLine}>
              Add row
            </Button>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="tbl compact">
              <thead>
                <tr>
                  <th style={{ width: 36 }}>#</th>
                  <th>Item</th>
                  <th className="tr" style={{ width: 120 }}>Quantity</th>
                  {config.showUnitCost && (
                    <th className="tr" style={{ width: 140 }}>Unit cost (UZS)</th>
                  )}
                  <th className="tr" style={{ width: 140 }}>Line total</th>
                  <th style={{ width: 40 }} />
                </tr>
              </thead>
              <tbody>
                {lines.map((l, idx) => {
                  const item = itemById.get(l.itemId);
                  const unitCost =
                    Number(l.unitCostUzs || (item ? item.unitCost : 0)) || 0;
                  const lineTotal = Number(l.quantity || 0) * unitCost;
                  const insufficientDetail = insufficientByItem.get(l.itemId);
                  const bg = insufficientDetail ? "var(--bad-bg)" : undefined;
                  return (
                    <tr key={idx} style={{ background: bg }}>
                      <td className="dim">{idx + 1}</td>
                      <td>
                        <select
                          className="input"
                          value={l.itemId}
                          onChange={(e) => {
                            const nextId = e.target.value;
                            const nextItem = itemById.get(nextId);
                            updateLine(idx, {
                              itemId: nextId,
                              unitCostUzs:
                                config.showUnitCost && nextItem && !l.unitCostUzs
                                  ? String(nextItem.unitCost)
                                  : l.unitCostUzs
                            });
                          }}
                        >
                          <option value="">Select item…</option>
                          {catalog.items.map((i) => (
                            <option key={i.id} value={i.id}>
                              {i.sku} — {i.name}
                            </option>
                          ))}
                        </select>
                        {insufficientDetail && (
                          <div
                            style={{
                              fontSize: 11,
                              color: "var(--bad)",
                              marginTop: 4,
                              fontFamily: "var(--mono)"
                            }}
                          >
                            Only {insufficientDetail.available} available, requested{" "}
                            {insufficientDetail.requested}
                          </div>
                        )}
                      </td>
                      <td>
                        <input
                          className="input"
                          type="number"
                          min="0"
                          step="0.0001"
                          style={{ textAlign: "right" }}
                          value={l.quantity}
                          onChange={(e) => updateLine(idx, { quantity: e.target.value })}
                        />
                      </td>
                      {config.showUnitCost && (
                        <td>
                          <input
                            className="input"
                            type="number"
                            min="0"
                            step="1"
                            style={{ textAlign: "right" }}
                            value={l.unitCostUzs}
                            onChange={(e) => updateLine(idx, { unitCostUzs: e.target.value })}
                          />
                        </td>
                      )}
                      <td className="num">{fmtUZS(Math.round(lineTotal))}</td>
                      <td>
                        <button
                          className="icon-btn"
                          onClick={() => removeLine(idx)}
                          disabled={lines.length === 1}
                          title="Remove row"
                        >
                          <Icon.Trash size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <DocumentFormFooter
          busy={busy}
          onSaveDraft={handleSaveDraft}
          onPost={() => handlePost(false)}
          onPostClose={() => handlePost(true)}
          onCancel={() => go(config.journalPath)}
        />
      </div>
    </div>
  );
}

/* ---------- Production order form (BOM-driven) ---------- */

function ProductionOrderFormPage({ go }) {
  const config = DOC_CONFIG["production-orders"];
  const catalog = useCatalog();

  const [documentDate, setDocumentDate] = useStateD(() => new Date().toISOString().slice(0, 10));
  const [documentNumber, setDocumentNumber] = useStateD("");
  const [warehouseId, setWarehouseId] = useStateD("");
  const [bomId, setBomId] = useStateD("");
  const [plannedUnits, setPlannedUnits] = useStateD("1");
  const [notes, setNotes] = useStateD("");
  const [draftId, setDraftId] = useStateD(null);
  const [busy, setBusy] = useStateD(false);
  const [error, setError] = useStateD(null);
  const [insufficient, setInsufficient] = useStateD([]);

  const itemById = useMemoD(() => {
    const m = new Map();
    catalog.items.forEach((i) => m.set(i.id, i));
    return m;
  }, [catalog.items]);

  const selectedBom = useMemoD(
    () => catalog.boms.find((b) => b.id === bomId) || null,
    [catalog.boms, bomId]
  );

  const collectPayload = () => {
    const pu = Number(plannedUnits) || 0;
    return {
      documentDate,
      documentNumber: documentNumber || undefined,
      warehouseId,
      bomId,
      outputItemId: selectedBom ? selectedBom.outputItemId : undefined,
      plannedUnits: pu.toFixed(4),
      notes: notes || undefined
    };
  };

  async function saveOrUpdateDraft() {
    // Backend does not expose PATCH on production-order drafts; void the
    // old draft (if any) and create a fresh one so user edits between
    // failed attempts are picked up.
    const payload = collectPayload();
    if (draftId) {
      try {
        await apiFetch(`${config.apiPath}/${draftId}/void`, {
          method: "POST",
          body: JSON.stringify({})
        });
      } catch (e) { /* ignore */ }
      setDraftId(null);
    }
    const res = await apiFetch(config.apiPath, {
      method: "POST",
      body: JSON.stringify(payload)
    });
    const docBody = (res.body && res.body.data && res.body.data.document) || (res.body && res.body.document);
    if (res.ok && docBody) {
      setDraftId(docBody.id);
    }
    return res;
  }

  async function handleSaveDraft() {
    setBusy(true);
    setError(null);
    setInsufficient([]);
    const res = await saveOrUpdateDraft();
    setBusy(false);
    if (!res.ok) {
      setError((res.body && res.body.error && res.body.error.message) || `HTTP ${res.status}`);
    }
  }

  async function handlePost(andClose) {
    setBusy(true);
    setError(null);
    setInsufficient([]);
    const draftRes = await saveOrUpdateDraft();
    if (!draftRes.ok) {
      setBusy(false);
      setError((draftRes.body && draftRes.body.error && draftRes.body.error.message) || "Failed to save draft");
      return;
    }
    const draftDoc = (draftRes.body && draftRes.body.data && draftRes.body.data.document) || (draftRes.body && draftRes.body.document);
    const id = (draftDoc && draftDoc.id) || draftId;
    const postRes = await apiFetch(`${config.apiPath}/${id}/post`, {
      method: "POST",
      body: JSON.stringify({})
    });
    setBusy(false);
    if (!postRes.ok) {
      const err = postRes.body && postRes.body.error;
      if (err && err.errorCode === "INSUFFICIENT_STOCK" && Array.isArray(err.details)) {
        setInsufficient(err.details);
      } else {
        setError((err && err.message) || `Failed to post (HTTP ${postRes.status})`);
      }
      return;
    }
    if (andClose) go(config.journalPath);
  }

  return (
    <div className="page">
      <div className="row mb-8" style={{ fontSize: 12, color: "var(--muted)" }}>
        <a style={{ cursor: "pointer" }} onClick={() => go(config.journalPath)}>
          {config.title}
        </a>
        <span>/</span>
        <span>New</span>
      </div>

      <div className="page-head">
        <div>
          <div className="eyebrow mb-4">{config.kindLabel}</div>
          <h1>New production order</h1>
          <div className="sub">
            Status: <Pill tone="warn">Draft</Pill> · posting consumes raw materials and produces the finished good
          </div>
        </div>
      </div>

      <ErrorBanner error={error} insufficientDetails={insufficient} />

      <div className="card" style={{ padding: 16, marginTop: 12 }}>
        <div className="grid grid-3 mb-16">
          <Field label="Document date" required>
            <input
              type="date"
              className="input"
              value={documentDate}
              onChange={(e) => setDocumentDate(e.target.value)}
            />
          </Field>
          <Field label="Document number" hint="Auto-generated if blank">
            <input
              className="input"
              placeholder="PO-…"
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
            />
          </Field>
          <Field label="Warehouse" required>
            <select
              className="input"
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
            >
              <option value="">Select warehouse…</option>
              {catalog.warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.code} — {w.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="BOM" required hint="Bill of materials · defines raw consumption + finished output">
            <select className="input" value={bomId} onChange={(e) => setBomId(e.target.value)}>
              <option value="">Select BOM…</option>
              {catalog.boms.map((b) => {
                const out = itemById.get(b.outputItemId);
                return (
                  <option key={b.id} value={b.id}>
                    {b.code} v{b.version} → {out ? out.sku : "output"}
                  </option>
                );
              })}
            </select>
          </Field>
          <Field label="Planned units" required>
            <input
              className="input"
              type="number"
              min="1"
              step="1"
              style={{ textAlign: "right" }}
              value={plannedUnits}
              onChange={(e) => setPlannedUnits(e.target.value)}
            />
          </Field>
          <Field label="Output">
            <div className="dim" style={{ paddingTop: 8 }}>
              {selectedBom
                ? (() => {
                    const out = itemById.get(selectedBom.outputItemId);
                    return out ? `${out.sku} — ${out.name}` : "—";
                  })()
                : "Choose a BOM to populate"}
            </div>
          </Field>
        </div>

        <Field label="Notes">
          <textarea
            className="input"
            rows={2}
            placeholder="Internal comment"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Field>

        {insufficient && insufficient.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div className="card" style={{ padding: 10, borderColor: "var(--bad)" }}>
              <strong style={{ fontSize: 12 }}>Lines that failed validation</strong>
              <table className="tbl compact" style={{ marginTop: 6 }}>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th className="tr">Available</th>
                    <th className="tr">Requested</th>
                  </tr>
                </thead>
                <tbody>
                  {insufficient.map((d, i) => (
                    <tr key={i} style={{ background: "var(--bad-bg)" }}>
                      <td style={{ color: "var(--ink)" }}>
                        <strong>{d.itemName || d.itemSku || d.itemId}</strong>
                        <div style={{ fontSize: 11, color: "var(--bad)" }}>
                          Only {d.available} available, requested {d.requested}
                        </div>
                      </td>
                      <td className="num">{d.available}</td>
                      <td className="num">{d.requested}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <DocumentFormFooter
          busy={busy}
          onSaveDraft={handleSaveDraft}
          onPost={() => handlePost(false)}
          onPostClose={() => handlePost(true)}
          onCancel={() => go(config.journalPath)}
        />
      </div>
    </div>
  );
}

/* ---------- Public exports for ROUTES table ---------- */

function GoodsReceiptsJournal({ go }) { return <DocumentJournal go={go} kind="goods-receipts" />; }
function GoodsIssuesJournal({ go }) { return <DocumentJournal go={go} kind="goods-issues" />; }
function InventoryTransfersJournal({ go }) { return <DocumentJournal go={go} kind="inventory-transfers" />; }
function ProductionOrdersJournal({ go }) { return <DocumentJournal go={go} kind="production-orders" />; }

function GoodsReceiptForm({ go }) { return <InventoryDocumentForm go={go} kind="goods-receipts" />; }
function GoodsIssueForm({ go }) { return <InventoryDocumentForm go={go} kind="goods-issues" />; }
function InventoryTransferForm({ go }) { return <InventoryDocumentForm go={go} kind="inventory-transfers" />; }
