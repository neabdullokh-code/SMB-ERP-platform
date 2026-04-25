// SMB inventory screens: live list, detail, OCR scan

function formatRelativeTime(iso) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(diff) || diff < 0) return "—";
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${Math.max(1, minutes)}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function mapInventoryItem(item, movements) {
  const latestMovement = [...movements].find((movement) => movement.itemId === item.id);
  const status = item.onHand <= 0 ? "Out of stock" : item.onHand <= item.reorderPoint ? "Low stock" : "In stock";
  return {
    id: item.id,
    sku: item.sku,
    name: item.name,
    category: item.category,
    onHand: item.onHand,
    reorderPoint: item.reorderPoint,
    valuationUzs: item.valuationUzs,
    price: item.onHand > 0 ? Math.round(item.valuationUzs / item.onHand) : 0,
    lastMovement: latestMovement ? formatRelativeTime(latestMovement.occurredAt) : "—",
    status
  };
}

function parseDelimitedLine(line, delimiter) {
  const cells = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === "\"") {
      if (inQuotes && line[i + 1] === "\"") {
        current += "\"";
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === delimiter && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  cells.push(current.trim());
  return cells;
}

function parseImportRows(text) {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  const headerLine = lines[0];
  const commaCount = (headerLine.match(/,/g) || []).length;
  const semicolonCount = (headerLine.match(/;/g) || []).length;
  const tabCount = (headerLine.match(/\t/g) || []).length;
  const delimiter = tabCount > commaCount && tabCount > semicolonCount ? "\t" : semicolonCount > commaCount ? ";" : ",";
  const headers = parseDelimitedLine(headerLine, delimiter).map((h) => h.toLowerCase().replace(/\s+/g, "_"));

  return lines.slice(1).map((line) => {
    const cells = parseDelimitedLine(line, delimiter);
    const row = {};
    headers.forEach((header, idx) => {
      row[header] = cells[idx] ?? "";
    });
    return row;
  });
}

function firstPresent(row, keys) {
  for (const key of keys) {
    if (row[key] != null && String(row[key]).trim() !== "") return String(row[key]).trim();
  }
  return "";
}

function movementDelta(movement) {
  const quantity = Number.parseFloat(String(movement.quantity || 0));
  if (!Number.isFinite(quantity)) return 0;
  if (movement.movementType === "inbound") return quantity;
  if (movement.movementType === "outbound") return -quantity;
  if (movement.movementType === "adjustment") return quantity;
  return 0;
}

function buildStockHistorySeries(currentOnHand, movements, horizonMonths) {
  const now = new Date();
  const labels = Array.from({ length: horizonMonths }, (_, idx) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (horizonMonths - 1 - idx), 1);
    return date.toLocaleString("en-US", { month: "short" });
  });
  const monthKeys = Array.from({ length: horizonMonths }, (_, idx) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (horizonMonths - 1 - idx), 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  });
  const monthIndex = new Map(monthKeys.map((key, idx) => [key, idx]));
  const monthlyNet = new Array(horizonMonths).fill(0);

  movements.forEach((movement) => {
    if (!movement?.occurredAt) return;
    const date = new Date(movement.occurredAt);
    if (Number.isNaN(date.getTime())) return;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const idx = monthIndex.get(key);
    if (idx == null) return;
    monthlyNet[idx] += movementDelta(movement);
  });

  const values = new Array(horizonMonths).fill(0);
  values[horizonMonths - 1] = Math.max(0, currentOnHand);
  for (let idx = horizonMonths - 2; idx >= 0; idx -= 1) {
    values[idx] = Math.max(0, values[idx + 1] - monthlyNet[idx + 1]);
  }
  return { labels, values };
}

function InventoryList({ go }) {
  const [q, setQ] = useStateS("");
  const [cat, setCat] = useStateS("All");
  const [summary, setSummary] = useStateS(null);
  const [loading, setLoading] = useStateS(true);
  const [error, setError] = useStateS("");
  const [addOpen, setAddOpen] = useStateS(false);
  const [saving, setSaving] = useStateS(false);
  const [addError, setAddError] = useStateS("");
  const [warehouseForm, setWarehouseForm] = useStateS({ code: "", name: "", location: "" });
  const [warehouseSaving, setWarehouseSaving] = useStateS(false);
  const [importing, setImporting] = useStateS(false);
  const [importMessage, setImportMessage] = useStateS("");
  const [importError, setImportError] = useStateS("");
  const [actionOpen, setActionOpen] = useStateS(false);
  const [actionTarget, setActionTarget] = useStateS(null);
  const [actionError, setActionError] = useStateS("");
  const [actionBusy, setActionBusy] = useStateS(false);
  const [toolbarMenuOpen, setToolbarMenuOpen] = useStateS(false);
  const importInputRef = React.useRef(null);
  const [addForm, setAddForm] = useStateS({
    warehouseId: "",
    sku: "",
    name: "",
    category: "",
    reorderPoint: "0",
    unitCostUzs: ""
  });

  const reloadSummary = async () => {
    const response = await fetch("/api/inventory/summary", {
      method: "GET",
      credentials: "include",
      cache: "no-store"
    });
    const body = await response.json();
    if (!response.ok || !body.data) {
      throw new Error(body.message || "Unable to load inventory.");
    }
    setSummary(body.data);
    setError("");
    return body.data;
  };

  useEffectS(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await reloadSummary();
        if (cancelled) return;
        setSummary(data);
      } catch {
        if (!cancelled) {
          setSummary(null);
          setError("Unable to load inventory.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const warehouses = summary?.warehouses || [];
  const rawItems = summary?.items ?? [];
  const movements = summary?.movements || [];
  const stocktakes = summary?.stocktakes || [];
  useEffectS(() => {
    if (!addForm.warehouseId && warehouses.length > 0) {
      setAddForm((prev) => ({ ...prev, warehouseId: warehouses[0].id }));
    }
  }, [warehouses, addForm.warehouseId]);
  const items = rawItems.map((item) => mapInventoryItem(item, movements));
  const categories = ["All", ...new Set(items.map((item) => item.category))];
  const rows = items.filter((item) => (cat === "All" || item.category === cat) && (q === "" || item.name.toLowerCase().includes(q.toLowerCase()) || item.sku.toLowerCase().includes(q)));
  const totalValue = items.reduce((sum, item) => sum + item.valuationUzs, 0);
  const lowStock = items.filter((item) => item.onHand > 0 && item.onHand <= item.reorderPoint).length;
  const outOfStock = items.filter((item) => item.onHand <= 0).length;
  const canCreateProduct = warehouses.length > 0;

  const openAddProduct = () => {
    if (!canCreateProduct) {
      setAddError("Create a warehouse first or connect to the live database before adding products.");
      setAddOpen(true);
      return;
    }
    setAddError("");
    setAddOpen(true);
  };

  const closeAddProduct = () => {
    if (saving) return;
    setAddOpen(false);
    setAddError("");
  };

  const submitAddProduct = async (event) => {
    event.preventDefault();
    if (!addForm.warehouseId) {
      setAddError("Select a warehouse first.");
      return;
    }
    if (!addForm.sku.trim() || !addForm.name.trim() || !addForm.category.trim()) {
      setAddError("SKU, name, and category are required.");
      return;
    }

    setSaving(true);
    setAddError("");

    try {
      const response = await fetch("/api/inventory/items", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          warehouseId: addForm.warehouseId,
          sku: addForm.sku.trim(),
          name: addForm.name.trim(),
          category: addForm.category.trim(),
          reorderPoint: Number.parseInt(addForm.reorderPoint, 10) || 0,
          unitCostUzs: addForm.unitCostUzs.trim() || undefined
        })
      });

      const body = await response.json();
      if (!response.ok || !body.data) {
        setAddError(body.message || body.error?.message || "Unable to create product.");
        return;
      }

      setAddOpen(false);
      setAddForm((prev) => ({
        ...prev,
        sku: "",
        name: "",
        category: "",
        reorderPoint: "0",
        unitCostUzs: ""
      }));

      await reloadSummary();
    } catch {
      setAddError("Unable to create product.");
    } finally {
      setSaving(false);
    }
  };

  const submitCreateWarehouse = async (event) => {
    event.preventDefault();
    if (!warehouseForm.code.trim() || !warehouseForm.name.trim() || !warehouseForm.location.trim()) {
      setAddError("Warehouse code, name, and location are required.");
      return;
    }

    setWarehouseSaving(true);
    setAddError("");
    try {
      const response = await fetch("/api/inventory/warehouses", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          code: warehouseForm.code.trim(),
          name: warehouseForm.name.trim(),
          location: warehouseForm.location.trim()
        })
      });
      const body = await response.json();
      if (!response.ok || !body.data?.warehouse) {
        setAddError(body.message || body.error?.message || "Unable to create warehouse.");
        return;
      }
      setWarehouseForm({ code: "", name: "", location: "" });
      setAddForm((prev) => ({ ...prev, warehouseId: body.data.warehouse.id }));
      await reloadSummary();
    } catch {
      setAddError("Unable to create warehouse.");
    } finally {
      setWarehouseSaving(false);
    }
  };

  const findItemBySku = async (sku) => {
    const response = await fetch(`/api/inventory/items?q=${encodeURIComponent(sku)}`, {
      method: "GET",
      credentials: "include",
      cache: "no-store"
    });
    const body = await response.json();
    if (!response.ok || !body.data?.items) return null;
    return body.data.items.find((item) => item.sku.toLowerCase() === sku.toLowerCase()) || null;
  };

  const ensureItemForSku = async (warehouseId, row) => {
    const existing = await findItemBySku(row.sku);
    if (existing) return existing;

    const createResponse = await fetch("/api/inventory/items", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        warehouseId,
        sku: row.sku,
        name: row.name,
        category: row.category,
        reorderPoint: row.reorderPoint,
        unitCostUzs: row.unitCostUzs || undefined
      })
    });
    const createBody = await createResponse.json();
    if (createResponse.ok && createBody.data?.item) return createBody.data.item;

    const fallback = await findItemBySku(row.sku);
    if (fallback) return fallback;

    throw new Error(createBody.message || createBody.error?.message || `Unable to create SKU ${row.sku}`);
  };

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";

    if (!canCreateProduct) {
      setImportError("Create at least one warehouse first, then import.");
      setImportMessage("");
      return;
    }

    setImporting(true);
    setImportError("");
    setImportMessage("");
    try {
      const lowerName = file.name.toLowerCase();
      if (lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls")) {
        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch("/api/inventory/import", {
          method: "POST",
          credentials: "include",
          body: formData
        });
        const body = await response.json();
        if (!response.ok || !body.data) {
          throw new Error(body.message || body.error?.message || "Excel import failed.");
        }
        await reloadSummary();
        setImportMessage(`Imported ${body.data.imported} rows from ${body.data.fileName}. Inbound movements posted for ${body.data.movements} rows.`);
        return;
      }

      const text = await file.text();
      const rows = parseImportRows(text)
        .map((row) => ({
          sku: firstPresent(row, ["sku", "product_code", "code"]),
          name: firstPresent(row, ["name", "product_name", "product"]),
          category: firstPresent(row, ["category", "cat"]) || "General",
          reorderPoint: Number.parseInt(firstPresent(row, ["reorder_point", "min", "minimum", "threshold"]) || "0", 10) || 0,
          unitCostUzs: firstPresent(row, ["unit_cost_uzs", "unit_cost", "cost", "price"]),
          quantity: Number.parseFloat(firstPresent(row, ["qty", "quantity", "on_hand", "stock"]) || "0") || 0
        }))
        .filter((row) => row.sku && row.name);

      if (rows.length === 0) {
        throw new Error("No valid rows found. Required columns: sku,name,category (optional qty,unit_cost_uzs,reorder_point).");
      }

      const warehouseId = addForm.warehouseId || warehouses[0]?.id;
      if (!warehouseId) throw new Error("No warehouse available.");

      let createdOrMatched = 0;
      let moved = 0;
      const reference = `IMPORT-${new Date().toISOString().slice(0, 10)}-${file.name}`;
      for (const row of rows) {
        const item = await ensureItemForSku(warehouseId, row);
        createdOrMatched += 1;
        if (row.quantity > 0) {
          const movementResponse = await fetch("/api/inventory/movements", {
            method: "POST",
            credentials: "include",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              itemId: item.id,
              movementType: "inbound",
              quantity: String(row.quantity),
              reference
            })
          });
          const movementBody = await movementResponse.json();
          if (!movementResponse.ok) {
            throw new Error(movementBody.message || movementBody.error?.message || `Unable to post inbound movement for ${row.sku}`);
          }
          moved += 1;
        }
      }

      await reloadSummary();
      setImportMessage(`Imported ${createdOrMatched} rows. Inbound movements posted for ${moved} rows.`);
    } catch (err) {
      setImportError(err?.message || "Import failed.");
    } finally {
      setImporting(false);
    }
  };

  const openItemDetail = (item) => {
    try {
      window.sessionStorage.setItem("inventory:selectedItemId", item.id);
      window.sessionStorage.setItem("inventory:selectedSku", item.sku);
    } catch {}
    go("/smb/inventory/detail");
  };

  const handleExport = () => {
    const header = ["sku", "name", "category", "onHand", "reorderPoint", "unitPriceUzs", "valuationUzs", "status"];
    const rowsCsv = rows.map((item) =>
      [
        item.sku,
        item.name,
        item.category,
        item.onHand,
        item.reorderPoint,
        item.price,
        item.valuationUzs,
        item.status
      ]
        .map((value) => {
          const text = value == null ? "" : String(value);
          return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
        })
        .join(",")
    );
    const csv = [header.join(","), ...rowsCsv].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `inventory-export-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const openItemActions = (item) => {
    setActionTarget(item);
    setActionError("");
    setActionOpen(true);
  };

  const deleteItem = async () => {
    if (!actionTarget) return;
    setActionBusy(true);
    setActionError("");
    try {
      const response = await fetch(`/api/inventory/items/${actionTarget.id}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (!response.ok && response.status !== 204) {
        const body = await response.json();
        throw new Error(body.message || body.error?.message || "Unable to delete item.");
      }
      setActionOpen(false);
      setActionTarget(null);
      await reloadSummary();
    } catch (err) {
      setActionError(err?.message || "Unable to delete item.");
    } finally {
      setActionBusy(false);
    }
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Inventory</h1>
          <div className="sub">
            {items.length} SKUs across {categories.length - 1} categories · value{" "}
            <span className="mono" style={{ color: "var(--ink)" }}>{fmtUZS(totalValue)} UZS</span>
          </div>
        </div>
        <span className="sp" />
        <Button variant="ai" icon={<Icon.Scan size={13} />} onClick={() => go("/smb/inventory/scan")}>Scan waybill</Button>
        <Button
          variant="ghost"
          icon={<Icon.Upload size={13} />}
          onClick={() => importInputRef.current?.click()}
          disabled={importing}
        >
          {importing ? "Importing..." : "Import Excel"}
        </Button>
        <input
          ref={importInputRef}
          type="file"
          accept=".xlsx,.xls,.csv,.tsv,.txt"
          style={{ display: "none" }}
          onChange={handleImportFile}
        />
        <Button variant="primary" icon={<Icon.Plus size={13} />} onClick={openAddProduct}>Add product</Button>
      </div>

      {error && (
        <Banner tone="warn" title="Live inventory unavailable">
          Live inventory could not be loaded. {error}
        </Banner>
      )}

      {loading && !error && (
        <Banner tone="info" title="Loading live inventory">
          Fetching inventory rows from the backend.
        </Banner>
      )}
      {importMessage && (
        <Banner tone="info" title="Import completed">
          {importMessage}
        </Banner>
      )}
      {importError && (
        <Banner tone="warn" title="Import failed">
          {importError}
        </Banner>
      )}

      <div className="grid grid-4 mb-16">
        <Kpi label="Total SKUs" value={String(items.length)} delta={loading ? "Loading..." : "Live from backend"} trend="up" />
        <Kpi label="Low stock" value={String(lowStock)} delta="At or below reorder point" trend="up" />
        <Kpi label="Out of stock" value={String(outOfStock)} delta="Zero on-hand" trend="down" />
        <Kpi label="Total valuation" value={fmtUZS(Math.round(totalValue / 1_000_000))} unit="M UZS" delta="At cost" trend="up" />
      </div>

      <div className="card card-pad-0">
        <div className="tbl-toolbar">
          <div className="input-wrap" style={{ width: 280 }}>
            <span className="prefix"><Icon.Search size={13} /></span>
            <input className="input with-prefix" placeholder="Search SKU or name" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="row gap-4">
            {categories.slice(0, 6).map((category) => (
              <button
                key={category}
                className="chip"
                onClick={() => setCat(category)}
                style={{
                  background: cat === category ? "var(--ink)" : undefined,
                  color: cat === category ? "var(--surface)" : undefined,
                  borderColor: cat === category ? "var(--ink)" : undefined
                }}
              >
                {category}
              </button>
            ))}
            <span className="chip filter-add"><Icon.Plus size={11} /> Add filter</span>
          </div>
          <span className="sp" />
          <div className="mono muted" style={{ fontSize: 11 }}>{rows.length} results</div>
          <Button variant="ghost" size="sm" icon={<Icon.Download size={12} />} onClick={handleExport}>Export</Button>
          <div style={{ position: "relative" }}>
            <Button variant="ghost" size="sm" icon={<Icon.More size={13} />} onClick={() => setToolbarMenuOpen((prev) => !prev)} />
            {toolbarMenuOpen && (
              <div className="hairline" style={{ position: "absolute", right: 0, top: 34, background: "var(--surface)", borderRadius: 8, minWidth: 180, zIndex: 8, boxShadow: "0 8px 20px rgba(0,0,0,.08)" }}>
                <button className="btn ghost sm" style={{ width: "100%", justifyContent: "flex-start", border: 0, borderRadius: 0 }} onClick={() => { setToolbarMenuOpen(false); handleExport(); }}>Export filtered rows</button>
                <button className="btn ghost sm" style={{ width: "100%", justifyContent: "flex-start", border: 0, borderRadius: 0 }} onClick={async () => { setToolbarMenuOpen(false); await reloadSummary(); }}>Refresh data</button>
              </div>
            )}
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="tbl compact">
            <thead>
              <tr>
                <th className="check"><input type="checkbox" /></th>
                <th>SKU</th>
                <th>Product</th>
                <th>Category</th>
                <th className="tr">Stock</th>
                <th className="tr">Min</th>
                <th className="tr">Unit price</th>
                <th className="tr">Value</th>
                <th>Last movement</th>
                <th>Status</th>
                <th style={{ width: 40 }} />
              </tr>
            </thead>
            <tbody>
              {loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={11} className="muted" style={{ padding: "18px 16px" }}>
                    Loading live inventory rows...
                  </td>
                </tr>
              ) : rows.map((item) => {
                const tone = item.status === "In stock" ? "good" : item.status === "Low stock" ? "warn" : "bad";
                return (
                  <tr key={item.sku} onClick={() => openItemDetail(item)} style={{ cursor: "pointer" }}>
                    <td className="check"><input type="checkbox" /></td>
                    <td className="id">{item.sku}</td>
                    <td style={{ color: "var(--ink)", fontWeight: 500 }}>{item.name}</td>
                    <td className="dim">{item.category}</td>
                    <td className="num">{item.onHand.toLocaleString("en-US").replace(/,/g, " ")}</td>
                    <td className="num dim">{item.reorderPoint}</td>
                    <td className="num">{fmtUZS(item.price)}</td>
                    <td className="num">{fmtUZS(item.valuationUzs)}</td>
                    <td className="dim mono" style={{ fontSize: 11 }}>{item.lastMovement}</td>
                    <td><Pill tone={tone}>{item.status}</Pill></td>
                    <td><button className="icon-btn" onClick={(event) => { event.stopPropagation(); openItemActions(item); }}><Icon.More size={14} /></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1.3fr 1fr", gap: 12 }}>
        <div className="card card-pad-0">
          <div className="panel-title">Warehouses</div>
          {warehouses.length === 0 ? (
            <div className="empty" style={{ minHeight: 180 }}>
              <Icon.Database size={24} />
              <h3>No warehouses</h3>
              <div>The backend did not return warehouse rows yet.</div>
            </div>
          ) : (
            <table className="tbl">
              <thead><tr><th>Code</th><th>Name</th><th>Location</th></tr></thead>
              <tbody>
                {warehouses.map((warehouse) => (
                  <tr key={warehouse.id}>
                    <td className="id">{warehouse.code}</td>
                    <td>{warehouse.name}</td>
                    <td className="dim">{warehouse.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="card card-pad-0">
          <div className="panel-title">Latest stocktake</div>
          {stocktakes.length === 0 ? (
            <div className="empty" style={{ minHeight: 180 }}>
              <Icon.Scan size={24} />
              <h3>No stocktakes</h3>
              <div>The backend has not recorded a stocktake yet.</div>
            </div>
          ) : (
            <table className="tbl">
              <thead><tr><th>Warehouse</th><th>Started</th><th>Completed</th><th className="tr">Variance</th></tr></thead>
              <tbody>
                {stocktakes.map((stocktake) => (
                  <tr key={stocktake.id}>
                    <td className="id">{warehouses.find((warehouse) => warehouse.id === stocktake.warehouseId)?.code || stocktake.warehouseId.slice(0, 8)}</td>
                    <td className="mono">{stocktake.startedAt.slice(0, 10)}</td>
                    <td className="mono">{stocktake.completedAt ? stocktake.completedAt.slice(0, 10) : "Open"}</td>
                    <td className="num">{stocktake.varianceCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal
        open={addOpen}
        onClose={closeAddProduct}
        title="Add product"
        size="sm"
        footer={
          <>
            <Button variant="ghost" type="button" onClick={closeAddProduct} disabled={saving}>Cancel</Button>
            <span className="sp" />
            <Button variant="primary" type="submit" form="add-product-form" icon={<Icon.Check size={13} />} disabled={saving || !canCreateProduct}>
              {saving ? "Saving..." : "Create product"}
            </Button>
          </>
        }
      >
        <form id="add-product-form" onSubmit={submitAddProduct}>
          {!canCreateProduct && (
            <div className="banner warn mb-12">
              <span className="ico"><Icon.Alert size={16} /></span>
              <div className="desc">No warehouse found. Create one first.</div>
            </div>
          )}
          {!canCreateProduct && (
            <div className="hairline" style={{ borderRadius: 8, padding: 12, marginBottom: 12 }}>
              <div className="eyebrow mb-8">Create warehouse</div>
              <div className="grid grid-3" style={{ gap: 8 }}>
                <input
                  className="input"
                  placeholder="Code (e.g. MAIN)"
                  value={warehouseForm.code}
                  onChange={(e) => setWarehouseForm((prev) => ({ ...prev, code: e.target.value }))}
                />
                <input
                  className="input"
                  placeholder="Name"
                  value={warehouseForm.name}
                  onChange={(e) => setWarehouseForm((prev) => ({ ...prev, name: e.target.value }))}
                />
                <input
                  className="input"
                  placeholder="Location"
                  value={warehouseForm.location}
                  onChange={(e) => setWarehouseForm((prev) => ({ ...prev, location: e.target.value }))}
                />
              </div>
              <div className="row mt-8">
                <span className="sp" />
                <Button
                  type="button"
                  variant="ghost"
                  icon={<Icon.Plus size={12} />}
                  onClick={submitCreateWarehouse}
                  disabled={warehouseSaving}
                >
                  {warehouseSaving ? "Creating..." : "Create warehouse"}
                </Button>
              </div>
            </div>
          )}
          <div className="grid grid-2" style={{ gap: 12 }}>
            <Field label="Warehouse" required>
              <select
                className="select"
                value={addForm.warehouseId}
                onChange={(e) => setAddForm((prev) => ({ ...prev, warehouseId: e.target.value }))}
              >
                <option value="">Select warehouse</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.code} · {warehouse.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="SKU" required>
              <input
                className="input"
                value={addForm.sku}
                onChange={(e) => setAddForm((prev) => ({ ...prev, sku: e.target.value }))}
                placeholder="KS-1234"
              />
            </Field>
            <Field label="Product name" required>
              <input
                className="input"
                value={addForm.name}
                onChange={(e) => setAddForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Product name"
              />
            </Field>
            <Field label="Category" required>
              <input
                className="input"
                value={addForm.category}
                onChange={(e) => setAddForm((prev) => ({ ...prev, category: e.target.value }))}
                placeholder="Grocery"
              />
            </Field>
            <Field label="Reorder point">
              <input
                className="input"
                type="number"
                min="0"
                value={addForm.reorderPoint}
                onChange={(e) => setAddForm((prev) => ({ ...prev, reorderPoint: e.target.value }))}
                placeholder="0"
              />
            </Field>
            <Field label="Unit cost UZS">
              <input
                className="input"
                inputMode="decimal"
                value={addForm.unitCostUzs}
                onChange={(e) => setAddForm((prev) => ({ ...prev, unitCostUzs: e.target.value }))}
                placeholder="62000"
              />
            </Field>
          </div>
          {addError && (
            <div className="banner warn mt-12">
              <span className="ico"><Icon.Alert size={16} /></span>
              <div className="desc">{addError}</div>
            </div>
          )}
        </form>
      </Modal>
      <Modal
        open={actionOpen}
        onClose={() => {
          if (actionBusy) return;
          setActionOpen(false);
          setActionTarget(null);
          setActionError("");
        }}
        title={actionTarget ? `Actions · ${actionTarget.sku}` : "Item actions"}
        size="sm"
        footer={
          <>
            <Button variant="ghost" type="button" onClick={() => setActionOpen(false)} disabled={actionBusy}>Close</Button>
          </>
        }
      >
        {actionTarget ? (
          <div className="col gap-8">
            <Button variant="ghost" onClick={() => { setActionOpen(false); openItemDetail(actionTarget); }} icon={<Icon.ChevRight size={12} />}>Open detail</Button>
            <Button variant="ghost" onClick={deleteItem} icon={<Icon.Trash size={12} />} disabled={actionBusy}>
              {actionBusy ? "Deleting..." : "Delete item"}
            </Button>
            {actionError && (
              <div className="banner warn">
                <span className="ico"><Icon.Alert size={16} /></span>
                <div className="desc">{actionError}</div>
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

function InventoryDetail({ go }) {
  const [summary, setSummary] = useStateS(null);
  const [loading, setLoading] = useStateS(true);
  const [error, setError] = useStateS("");
  const [detailMovements, setDetailMovements] = useStateS([]);
  const [horizon, setHorizon] = useStateS(6);
  const [adjustOpen, setAdjustOpen] = useStateS(false);
  const [transferOpen, setTransferOpen] = useStateS(false);
  const [savingAction, setSavingAction] = useStateS(false);
  const [actionError, setActionError] = useStateS("");
  const [adjustForm, setAdjustForm] = useStateS({ mode: "increase", quantity: "1", reference: "ADJ-MANUAL" });
  const [transferForm, setTransferForm] = useStateS({ warehouseId: "", quantity: "1", reference: "TR-INTERNAL" });

  const loadSummary = async () => {
    const response = await fetch("/api/inventory/summary", {
      method: "GET",
      credentials: "include",
      cache: "no-store"
    });
    const body = await response.json();
    if (!response.ok || !body.data) {
      throw new Error(body.message || "Unable to load inventory detail.");
    }
    setSummary(body.data);
    return body.data;
  };

  useEffectS(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadSummary();
        if (!cancelled) setError("");
      } catch (err) {
        if (!cancelled) {
          setSummary(null);
          setError(err?.message || "Unable to load inventory detail.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const warehouses = summary?.warehouses || [];
  const items = summary?.items || [];
  const movements = summary?.movements || [];
  const selectedItemId = (() => {
    try {
      return window.sessionStorage.getItem("inventory:selectedItemId") || "";
    } catch {
      return "";
    }
  })();
  const selectedSku = (() => {
    try {
      return window.sessionStorage.getItem("inventory:selectedSku") || "";
    } catch {
      return "";
    }
  })();
  const item =
    items.find((candidate) => candidate.id === selectedItemId) ||
    items.find((candidate) => selectedSku && candidate.sku === selectedSku) ||
    items[0] ||
    null;
  useEffectS(() => {
    if (!item?.id) {
      setDetailMovements([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(`/api/inventory/movements?itemId=${encodeURIComponent(item.id)}`, {
          method: "GET",
          credentials: "include",
          cache: "no-store"
        });
        const body = await response.json();
        if (cancelled || !response.ok || !body.data?.movements) return;
        setDetailMovements(body.data.movements);
      } catch {
        if (!cancelled) {
          setDetailMovements([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [item?.id]);
  const movementSource = detailMovements.length > 0 ? detailMovements : movements;
  const itemMovements = item
    ? movementSource
        .filter((movement) => movement.itemId === item.id)
        .slice()
        .sort((left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime())
    : [];
  const onHand = item ? Number(item.onHand || 0) : 0;
  const valuationUzs = item ? Number(item.valuationUzs || 0) : 0;
  const unitPrice = onHand > 0 ? Math.round(valuationUzs / onHand) : 0;
  const status = item ? (onHand <= 0 ? "Out of stock" : onHand <= item.reorderPoint ? "Low stock" : "In stock") : "—";
  const turnover = itemMovements.length > 0 ? `${Math.max(1, Math.round((itemMovements.length / Math.max(1, horizon)) * 10) / 10)}x` : "0x";
  const history = buildStockHistorySeries(onHand, itemMovements, horizon);
  const targetWarehouses = item ? warehouses.filter((warehouse) => warehouse.id !== item.warehouseId) : [];

  useEffectS(() => {
    if (!transferForm.warehouseId && targetWarehouses.length > 0) {
      setTransferForm((prev) => ({ ...prev, warehouseId: targetWarehouses[0].id }));
    }
  }, [targetWarehouses, transferForm.warehouseId]);

  const postMovement = async (payload) => {
    const response = await fetch("/api/inventory/movements", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    const body = await response.json();
    if (!response.ok || !body.data) {
      throw new Error(body.message || body.error?.message || "Unable to save movement.");
    }
    return body.data;
  };

  const submitAdjustStock = async (event) => {
    event.preventDefault();
    if (!item) return;
    const quantity = Number.parseFloat(adjustForm.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setActionError("Quantity must be greater than zero.");
      return;
    }
    setSavingAction(true);
    setActionError("");
    try {
      await postMovement({
        itemId: item.id,
        movementType: adjustForm.mode === "increase" ? "adjustment" : "outbound",
        quantity: String(quantity),
        reference: adjustForm.reference.trim() || "ADJ-MANUAL"
      });
      await loadSummary();
      setAdjustOpen(false);
    } catch (err) {
      setActionError(err?.message || "Unable to adjust stock.");
    } finally {
      setSavingAction(false);
    }
  };

  const submitTransfer = async (event) => {
    event.preventDefault();
    if (!item) return;
    if (!transferForm.warehouseId) {
      setActionError("Select target warehouse.");
      return;
    }
    const quantity = Number.parseFloat(transferForm.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setActionError("Transfer quantity must be greater than zero.");
      return;
    }
    setSavingAction(true);
    setActionError("");
    try {
      const patch = await fetch(`/api/inventory/items/${item.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ warehouseId: transferForm.warehouseId })
      });
      const patchBody = await patch.json();
      if (!patch.ok || !patchBody.data) {
        throw new Error(patchBody.message || patchBody.error?.message || "Unable to update warehouse.");
      }

      await postMovement({
        itemId: item.id,
        movementType: "transfer",
        quantity: String(quantity),
        reference: transferForm.reference.trim() || "TR-INTERNAL"
      });
      await loadSummary();
      setTransferOpen(false);
    } catch (err) {
      setActionError(err?.message || "Unable to transfer stock.");
    } finally {
      setSavingAction(false);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <Banner tone="info" title="Loading inventory detail">
          Fetching item profile, stock history, and movements.
        </Banner>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="page">
        <Banner tone="warn" title="Inventory item unavailable">
          {error || "No inventory item selected."}
        </Banner>
      </div>
    );
  }

  const itemWarehouse = warehouses.find((warehouse) => warehouse.id === item.warehouseId);
  return (
    <div className="page">
      <div className="row mb-8" style={{ fontSize: 12, color: "var(--muted)" }}>
        <a style={{ cursor: "pointer" }} onClick={() => go("/smb/inventory")}>Inventory</a>
        <span>/</span>
        <span className="id mono">{item.sku}</span>
      </div>
      <div className="page-head">
        <div>
          <div className="eyebrow mb-4">{item.category}</div>
          <h1>{item.name}</h1>
          <div className="row gap-8 mt-4">
            <span className="id mono muted">SKU {item.sku}</span>
            <span className="sep-dot" />
            <span className="muted">{itemWarehouse ? `Warehouse ${itemWarehouse.code} · ${itemWarehouse.name}` : "Warehouse not assigned"}</span>
            <span className="sep-dot" />
            <Pill tone={status === "In stock" ? "good" : status === "Low stock" ? "warn" : "bad"}>{status}</Pill>
          </div>
        </div>
        <span className="sp" />
        <Button variant="ghost" icon={<Icon.Refresh size={13} />} onClick={() => { setActionError(""); setTransferOpen(true); }}>Transfer</Button>
        <Button variant="primary" icon={<Icon.Pencil size={13} />} onClick={() => { setActionError(""); setAdjustOpen(true); }}>Adjust stock</Button>
      </div>

      <div className="grid grid-4 mb-16">
        <Kpi label="On hand" value={fmtUZS(onHand)} unit="units" />
        <Kpi label="Unit price" value={fmtUZS(unitPrice)} unit="UZS" />
        <Kpi label="Stock value" value={(valuationUzs / 1_000_000).toFixed(1)} unit="M UZS" spark={<Sparkline data={history.values} width={64} height={24} />} />
        <Kpi label="Turnover" value={turnover} unit="/yr" delta={itemMovements.length ? `${itemMovements.length} moves` : "No movement"} trend="up" />
      </div>

      <div className="grid" style={{ gridTemplateColumns: "2fr 1fr", gap: 12 }}>
        <div className="card card-pad-0">
          <div className="panel-title">
            Stock history <span className="sp" />
            <div className="btn-group">
              <button className={`btn sm ${horizon === 1 ? "primary" : ""}`} onClick={() => setHorizon(1)}>1M</button>
              <button className={`btn sm ${horizon === 6 ? "primary" : ""}`} onClick={() => setHorizon(6)}>6M</button>
              <button className={`btn sm ${horizon === 12 ? "primary" : ""}`} onClick={() => setHorizon(12)}>1Y</button>
            </div>
          </div>
          <div style={{ padding: 8 }}>
            <LineChart
              width={720}
              height={200}
              categories={history.labels}
              series={[
                { data: history.values, color: "var(--ink)", dots: true, area: true },
                { data: history.values.map(() => Number(item.reorderPoint || 0)), color: "var(--bad)", dashed: true }
              ]}
            />
            <div className="row gap-16 mono muted" style={{ fontSize: 10, padding: "4px 16px" }}>
              <span><span style={{ display: "inline-block", width: 8, height: 2, background: "var(--ink)", marginRight: 6 }} />On hand</span>
              <span><span style={{ display: "inline-block", width: 8, height: 2, background: "var(--bad)", marginRight: 6 }} />Min threshold</span>
            </div>
          </div>
        </div>
        <div className="card card-pad-0">
          <div className="panel-title">Movement log</div>
          <div>
            {itemMovements.length === 0 ? (
              <div className="empty" style={{ minHeight: 180 }}>
                <Icon.Inbox size={24} />
                <h3>No movement recorded</h3>
                <div>Use Transfer or Adjust stock to create first movement.</div>
              </div>
            ) : itemMovements.map((movement, index) => {
              const quantity = Number.parseFloat(String(movement.quantity || 0));
              const delta = movementDelta(movement);
              const tone =
                movement.movementType === "inbound" || movement.movementType === "adjustment"
                  ? "good"
                  : movement.movementType === "outbound"
                    ? "bad"
                    : "info";
              const labelMap = {
                inbound: "Received",
                outbound: "Sale",
                transfer: "Transfer",
                adjustment: "Adjustment"
              };
              const happenedAt = movement.occurredAt ? new Date(movement.occurredAt) : null;
              const dateLabel = happenedAt && !Number.isNaN(happenedAt.getTime())
                ? `${happenedAt.toLocaleString("en-US", { day: "2-digit", month: "short" })} · ${happenedAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}`
                : "—";
              return (
              <div key={index} className="hairline-b" style={{ padding: "10px 14px", display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}>
                <div>
                  <div className="row gap-8">
                    <Pill tone={tone} dot={false}>{labelMap[movement.movementType] || movement.movementType}</Pill>
                    <span className="mono" style={{ fontSize: 12, color: tone === "good" ? "var(--good)" : tone === "bad" ? "var(--bad)" : "var(--info)" }}>
                      {delta >= 0 ? "+" : "−"}{fmtUZS(Math.abs(Number.isFinite(quantity) ? quantity : 0))}
                    </span>
                  </div>
                  <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>{movement.reference || "Manual update"}</div>
                </div>
                <div className="mono muted" style={{ fontSize: 11 }}>{dateLabel}</div>
              </div>
            )})}
          </div>
        </div>
      </div>
      {actionError && (
        <Banner tone="warn" title="Inventory action failed">
          {actionError}
        </Banner>
      )}
      <Modal
        open={adjustOpen}
        onClose={() => {
          if (savingAction) return;
          setAdjustOpen(false);
        }}
        title={`Adjust stock · ${item.sku}`}
        size="sm"
        footer={
          <>
            <Button variant="ghost" type="button" onClick={() => setAdjustOpen(false)} disabled={savingAction}>Cancel</Button>
            <span className="sp" />
            <Button variant="primary" type="submit" form="adjust-stock-form" icon={<Icon.Check size={13} />} disabled={savingAction}>
              {savingAction ? "Saving..." : "Apply adjustment"}
            </Button>
          </>
        }
      >
        <form id="adjust-stock-form" onSubmit={submitAdjustStock}>
          <div className="grid grid-2" style={{ gap: 12 }}>
            <Field label="Direction" required>
              <select className="select" value={adjustForm.mode} onChange={(e) => setAdjustForm((prev) => ({ ...prev, mode: e.target.value }))}>
                <option value="increase">Increase</option>
                <option value="decrease">Decrease</option>
              </select>
            </Field>
            <Field label="Quantity" required>
              <input className="input" type="number" min="0.01" step="0.01" value={adjustForm.quantity} onChange={(e) => setAdjustForm((prev) => ({ ...prev, quantity: e.target.value }))} />
            </Field>
            <Field label="Reference">
              <input className="input" value={adjustForm.reference} onChange={(e) => setAdjustForm((prev) => ({ ...prev, reference: e.target.value }))} placeholder="ADJ-COUNT-APR25" />
            </Field>
          </div>
        </form>
      </Modal>
      <Modal
        open={transferOpen}
        onClose={() => {
          if (savingAction) return;
          setTransferOpen(false);
        }}
        title={`Transfer stock · ${item.sku}`}
        size="sm"
        footer={
          <>
            <Button variant="ghost" type="button" onClick={() => setTransferOpen(false)} disabled={savingAction}>Cancel</Button>
            <span className="sp" />
            <Button variant="primary" type="submit" form="transfer-stock-form" icon={<Icon.Check size={13} />} disabled={savingAction}>
              {savingAction ? "Saving..." : "Transfer"}
            </Button>
          </>
        }
      >
        <form id="transfer-stock-form" onSubmit={submitTransfer}>
          <div className="grid grid-2" style={{ gap: 12 }}>
            <Field label="Target warehouse" required>
              <select className="select" value={transferForm.warehouseId} onChange={(e) => setTransferForm((prev) => ({ ...prev, warehouseId: e.target.value }))}>
                <option value="">Select warehouse</option>
                {targetWarehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>{warehouse.code} · {warehouse.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Quantity for transfer log" required>
              <input className="input" type="number" min="0.01" step="0.01" value={transferForm.quantity} onChange={(e) => setTransferForm((prev) => ({ ...prev, quantity: e.target.value }))} />
            </Field>
            <Field label="Reference">
              <input className="input" value={transferForm.reference} onChange={(e) => setTransferForm((prev) => ({ ...prev, reference: e.target.value }))} placeholder="TR-2026-0012" />
            </Field>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function OcrScan({ go }) {
  const [stage, setStage] = useStateS(0);
  const [extracted, setExtracted] = useStateS([]);
  const [applying, setApplying] = useStateS(false);
  const [applyError, setApplyError] = useStateS("");
  const [applyMessage, setApplyMessage] = useStateS("");
  const [scanNotice, setScanNotice] = useStateS("");
  const [scanSource, setScanSource] = useStateS("sample");
  const [scanFields, setScanFields] = useStateS([]);
  const [scanItems, setScanItems] = useStateS([]);
  const [selectedFileName, setSelectedFileName] = useStateS("WB-23887.pdf");
  const fileInputRef = React.useRef(null);

  const SAMPLE_LINES = [
    { field: "Supplier", val: "Samarkand Oil Co.", conf: 98 },
    { field: "Document no.", val: "WB-23887", conf: 99 },
    { field: "Date", val: "18 March 2026", conf: 97 },
    { field: "Currency", val: "UZS", conf: 99 }
  ];
  const SAMPLE_ITEMS = [
    { sku: "KS-0102", name: "Cooking oil, sunflower 5L", qty: 120, price: 48_000, conf: 96 },
    { sku: "KS-0104", name: "Sugar refined 50kg bag", qty: 40, price: 310_000, conf: 92 },
    { sku: "KS-0210", name: "Rice, Devzira 25kg", qty: 80, price: 240_000, conf: 94 },
    { sku: "?", name: "Sunflower oil 10L (new SKU)", qty: 30, price: 115_000, conf: 74 }
  ];

  const runExtraction = (fields, items) => {
    setStage(1);
    setExtracted([]);
    setScanFields(fields);
    setScanItems(items);
    setTimeout(() => {
      setStage(2);
      const all = [...fields.map((line) => ({ type: "field", ...line })), ...items.map((item) => ({ type: "item", ...item }))];
      all.forEach((item, index) => setTimeout(() => setExtracted((prev) => [...prev, item]), 350 + index * 500));
      setTimeout(() => setStage(3), 350 + all.length * 500 + 200);
    }, 1200);
  };

  const startSample = () => {
    setScanSource("sample");
    setSelectedFileName("WB-23887.pdf");
    setApplyError("");
    setApplyMessage("");
    setScanNotice("");
    runExtraction(SAMPLE_LINES, SAMPLE_ITEMS);
  };

  const handleChooseFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";
    setScanSource("upload");
    setSelectedFileName(file.name);
    setApplyError("");
    setApplyMessage("");
    setScanNotice("");

    const lowerName = file.name.toLowerCase();
    if (lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls")) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch("/api/inventory/import", {
          method: "POST",
          credentials: "include",
          body: formData
        });
        const body = await response.json();
        if (!response.ok || !body.data) {
          throw new Error(body.message || body.error?.message || "Excel import failed.");
        }
        setScanNotice(`Excel imported: ${body.data.imported} rows (${body.data.movements} inbound movements).`);
        setTimeout(() => go("/smb/inventory"), 700);
      } catch (excelError) {
        setScanNotice(excelError instanceof Error ? excelError.message : "Unable to import Excel file.");
      }
      return;
    }

    const isDelimited = lowerName.endsWith(".csv") || lowerName.endsWith(".tsv") || lowerName.endsWith(".txt");
    if (!isDelimited) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch("/api/inventory/ocr", {
          method: "POST",
          credentials: "include",
          body: formData
        });
        const body = await response.json();
        if (!response.ok || !body.data) {
          throw new Error(body.message || body.error?.message || "OCR extraction failed.");
        }

        const fields = Array.isArray(body.data.fields) ? body.data.fields : [];
        const items = Array.isArray(body.data.items) ? body.data.items : [];
        if (items.length === 0) {
          setStage(0);
          setScanFields([]);
          setScanItems([]);
          setExtracted([]);
          setScanNotice("OCR completed but no line items were detected. You can still use Excel/CSV import.");
          return;
        }
        runExtraction(fields, items);
      } catch (ocrError) {
        setStage(0);
        setScanFields([]);
        setScanItems([]);
        setExtracted([]);
        setScanNotice(ocrError instanceof Error ? ocrError.message : "Unable to run OCR.");
      }
      return;
    }

    try {
      const text = await file.text();
      const parsedRows = parseImportRows(text);
      const rows = parsedRows
        .map((row) => {
          const sku = firstPresent(row, ["sku", "product_code", "code"]) || "?";
          const name = firstPresent(row, ["name", "product_name", "product"]) || "Unnamed item";
          const qty = Number.parseFloat(firstPresent(row, ["qty", "quantity", "count", "units"]) || "0");
          const price = Number.parseFloat(firstPresent(row, ["unit_cost_uzs", "unit_cost", "cost", "price"]) || "0");
          return {
            sku,
            name,
            qty: Number.isFinite(qty) ? qty : 0,
            price: Number.isFinite(price) ? price : 0,
            conf: 95
          };
        })
        .filter((item) => item.qty > 0 || item.price > 0 || item.name !== "Unnamed item");

      if (rows.length === 0) {
        throw new Error("No valid line items found in uploaded file.");
      }

      const fields = [
        { field: "Supplier", val: firstPresent(parsedRows[0], ["supplier", "vendor"]) || "From uploaded file", conf: 92 },
        { field: "Document no.", val: firstPresent(parsedRows[0], ["document_no", "doc_no", "invoice_no", "waybill_no"]) || file.name.replace(/\.[^.]+$/, ""), conf: 91 },
        { field: "Date", val: firstPresent(parsedRows[0], ["date", "document_date", "invoice_date"]) || new Date().toISOString().slice(0, 10), conf: 90 },
        { field: "Currency", val: firstPresent(parsedRows[0], ["currency"]) || "UZS", conf: 92 }
      ];

      runExtraction(fields, rows);
    } catch (fileError) {
      setStage(0);
      setScanFields([]);
      setScanItems([]);
      setExtracted([]);
      setScanNotice(fileError instanceof Error ? fileError.message : "Unable to parse uploaded file.");
    }
  };

  const fetchInventoryContext = async () => {
    const response = await fetch("/api/inventory/summary", {
      method: "GET",
      credentials: "include",
      cache: "no-store"
    });
    const body = await response.json();
    if (!response.ok || !body.data) {
      throw new Error(body.message || "Unable to load inventory context.");
    }
    return body.data;
  };

  const findItemBySku = async (sku) => {
    const response = await fetch(`/api/inventory/items?q=${encodeURIComponent(sku)}`, {
      method: "GET",
      credentials: "include",
      cache: "no-store"
    });
    const body = await response.json();
    if (!response.ok || !body.data?.items) return null;
    return body.data.items.find((item) => item.sku.toLowerCase() === sku.toLowerCase()) || null;
  };

  const confirmAndAdd = async () => {
    setApplying(true);
    setApplyError("");
    setApplyMessage("");
    try {
      if (scanItems.length === 0) {
        throw new Error("No extracted line items to apply.");
      }
      const context = await fetchInventoryContext();
      const warehouseId = context.warehouses?.[0]?.id;
      if (!warehouseId) {
        throw new Error("No warehouse found. Create a warehouse first in Inventory.");
      }

      let added = 0;
      let moved = 0;
      for (let index = 0; index < scanItems.length; index += 1) {
        const extractedItem = scanItems[index];
        const sku = extractedItem.sku === "?" ? `WB-${String(index + 1).padStart(4, "0")}` : extractedItem.sku;
        let item = await findItemBySku(sku);

        if (!item) {
          const createResponse = await fetch("/api/inventory/items", {
            method: "POST",
            credentials: "include",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              warehouseId,
              sku,
              name: extractedItem.name,
              category: "Imported",
              reorderPoint: 0,
              unitCostUzs: String(extractedItem.price)
            })
          });
          const createBody = await createResponse.json();
          if (!createResponse.ok || !createBody.data?.item) {
            throw new Error(createBody.message || createBody.error?.message || `Unable to create SKU ${sku}`);
          }
          item = createBody.data.item;
          added += 1;
        }

        const movementResponse = await fetch("/api/inventory/movements", {
          method: "POST",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            itemId: item.id,
            movementType: "inbound",
            quantity: String(extractedItem.qty),
            reference: scanFields.find((field) => field.field === "Document no.")?.val || selectedFileName
          })
        });
        const movementBody = await movementResponse.json();
        if (!movementResponse.ok) {
          throw new Error(movementBody.message || movementBody.error?.message || `Unable to record movement for ${sku}`);
        }
        moved += 1;
      }

      setApplyMessage(`Waybill posted: ${moved} inbound lines applied, ${added} new SKU(s) created.`);
      setTimeout(() => go("/smb/inventory"), 900);
    } catch (err) {
      setApplyError(err?.message || "Unable to apply waybill.");
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="page">
      <div className="row mb-8" style={{ fontSize: 12, color: "var(--muted)" }}>
        <a style={{ cursor: "pointer" }} onClick={() => go("/smb/inventory")}>Inventory</a>
        <span>/</span>
        <span>Smart scan</span>
      </div>
      <div className="page-head">
        <div>
          <h1>Scan waybill or invoice <AIChip label="AI · OCR" /></h1>
          <div className="sub">Drop a supplier document and we'll extract supplier, dates, line items, and prices into your inventory.</div>
        </div>
        <span className="sp" />
        {stage === 0 && <Button variant="primary" onClick={startSample} icon={<Icon.Play size={13} />}>Use sample waybill</Button>}
        {stage === 3 && (
          <>
            <Button variant="ghost" onClick={() => { setStage(0); setExtracted([]); setScanFields([]); setScanItems([]); }}>Scan another</Button>
            <Button variant="primary" icon={<Icon.Check size={13} />} onClick={confirmAndAdd} disabled={applying}>
              {applying ? "Applying..." : "Confirm & add to inventory"}
            </Button>
          </>
        )}
      </div>
      {applyError && (
        <Banner tone="warn" title="Waybill apply failed">
          {applyError}
        </Banner>
      )}
      {scanNotice && (
        <Banner tone="info" title="Upload notice">
          {scanNotice}
        </Banner>
      )}
      {applyMessage && (
        <Banner tone="info" title="Waybill applied">
          {applyMessage}
        </Banner>
      )}

      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "stretch" }}>
        <div className="card card-pad-0" style={{ minHeight: 560, display: "flex", flexDirection: "column" }}>
          <div className="panel-title">
            Document preview
            <span className="sp" />
            {stage > 0 && <span className="mono muted" style={{ fontSize: 10 }}>{selectedFileName} · 1 of 1</span>}
          </div>
          {stage === 0 ? (
            <div style={{ flex: 1, display: "grid", placeItems: "center", padding: 24 }}>
              <div className="hairline" style={{ borderStyle: "dashed", padding: 40, textAlign: "center", width: "100%", borderRadius: 8, background: "var(--surface-2)" }}>
                <div style={{ width: 52, height: 52, margin: "0 auto 10px", borderRadius: "50%", background: "var(--ai-bg)", color: "var(--ai)", display: "grid", placeItems: "center" }}>
                  <Icon.Upload size={22} />
                </div>
                <div style={{ fontWeight: 500, color: "var(--ink)" }}>Drop an invoice or waybill</div>
                <div className="muted mt-4" style={{ fontSize: 12 }}>PDF, JPG, PNG, HEIC · up to 20 MB</div>
                <Button className="mt-12" variant="primary" onClick={() => fileInputRef.current?.click()}>Choose file</Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.heic,.csv,.tsv,.txt"
                  style={{ display: "none" }}
                  onChange={handleChooseFile}
                />
                <div className="mt-16 mono muted" style={{ fontSize: 10, letterSpacing: "0.08em" }}>OR</div>
                <Button className="mt-8" variant="ghost" onClick={startSample}>Use sample waybill from Samarkand Oil Co.</Button>
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, padding: 18, position: "relative", background: "var(--surface-2)" }}>
              <div className="hairline" style={{ background: "var(--surface)", padding: 20, minHeight: 500, borderRadius: 4, fontFamily: "var(--mono)", fontSize: 11, position: "relative", overflow: "hidden" }}>
                {scanSource === "sample" ? (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--line)", paddingBottom: 8, marginBottom: 10 }}>
                      <div>
                        <div style={{ fontWeight: 600, color: "var(--ink)", fontSize: 14, fontFamily: "var(--sans)" }}>Samarkand Oil Co.</div>
                        <div>TIN 302 101 554 · Samarkand, UZ</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 600, color: "var(--ink)" }}>WAYBILL / ТТН</div>
                        <div>No. WB-23887 · 18.03.2026</div>
                      </div>
                    </div>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid var(--line)" }}>
                          <th style={{ textAlign: "left", padding: "6px 4px" }}>Item</th>
                          <th style={{ textAlign: "right", padding: "6px 4px" }}>Qty</th>
                          <th style={{ textAlign: "right", padding: "6px 4px" }}>Price</th>
                          <th style={{ textAlign: "right", padding: "6px 4px" }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scanItems.map((item, index) => (
                          <tr key={index} style={{ borderBottom: "1px solid var(--line-2)" }}>
                            <td style={{ padding: "5px 4px" }}>{item.name}</td>
                            <td style={{ padding: "5px 4px", textAlign: "right" }}>{item.qty}</td>
                            <td style={{ padding: "5px 4px", textAlign: "right" }}>{fmtUZS(item.price)}</td>
                            <td style={{ padding: "5px 4px", textAlign: "right" }}>{fmtUZS(item.qty * item.price)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                ) : (
                  <div className="col gap-12">
                    <div style={{ fontWeight: 600, color: "var(--ink)", fontFamily: "var(--sans)", fontSize: 14 }}>Uploaded document</div>
                    <div className="mono muted">{selectedFileName}</div>
                    <div className="muted" style={{ fontSize: 12 }}>
                      Parsed using file rows only. No mock waybill data is injected.
                    </div>
                    <table className="tbl compact">
                      <thead><tr><th>SKU</th><th>Name</th><th className="tr">Qty</th><th className="tr">Unit</th></tr></thead>
                      <tbody>
                        {scanItems.map((item, index) => (
                          <tr key={index}>
                            <td className="id">{item.sku}</td>
                            <td>{item.name}</td>
                            <td className="num">{item.qty}</td>
                            <td className="num">{fmtUZS(item.price)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {stage === 1 && (
                  <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
                    <div style={{ position: "absolute", left: 0, right: 0, height: 2, background: "var(--ai)", boxShadow: "0 0 14px var(--ai)", top: "50%", animation: "scanline 1.2s ease-in-out infinite" }} />
                    <style>{`@keyframes scanline {0%{top:0}50%{top:100%}100%{top:0}}`}</style>
                  </div>
                )}
                {stage === 2 && (
                  <>
                    <div style={{ position: "absolute", top: 18, left: 18, width: 160, height: 20, border: "1.5px solid var(--ai)", borderRadius: 3, background: "var(--ai-bg)", opacity: 0.35 }} />
                    <div style={{ position: "absolute", top: 18, right: 18, width: 160, height: 36, border: "1.5px solid var(--ai)", borderRadius: 3, background: "var(--ai-bg)", opacity: 0.35 }} />
                    <div style={{ position: "absolute", top: 108, left: 18, right: 18, height: 100, border: "1.5px solid var(--ai)", borderRadius: 3, background: "var(--ai-bg)", opacity: 0.25 }} />
                  </>
                )}
              </div>
              {stage === 1 && (
                <div style={{ position: "absolute", left: 18, right: 18, bottom: 18, padding: "8px 12px", background: "var(--ink)", color: "var(--surface)", borderRadius: 6, display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                  <Icon.Sparkle size={13} style={{ color: "var(--ai)" }} />
                  <span>Scanning document…</span>
                  <span className="sp" />
                  <span className="mono" style={{ opacity: 0.7, fontSize: 11 }}>Claude OCR · UZ+RU+EN</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="card card-pad-0" style={{ minHeight: 560, display: "flex", flexDirection: "column", borderLeft: "2px solid var(--ai)" }}>
          <div className="panel-title">
            <Icon.Sparkle size={11} style={{ color: "var(--ai)" }} />
            Extracted fields
            <span className="sp" />
            {stage === 3 && <Pill tone="good">All verified</Pill>}
            {stage === 2 && <span className="mono" style={{ fontSize: 10, color: "var(--ai)" }}>Extracting… <span className="caret" /></span>}
          </div>
          {stage === 0 ? (
            <div style={{ flex: 1 }} className="empty">
              <Icon.Scan size={24} />
              <h3>Waiting for document</h3>
              <div>Extracted fields will appear here.</div>
            </div>
          ) : (
            <div style={{ padding: 12, flex: 1, overflowY: "auto" }}>
              <div className="eyebrow mb-8">Header</div>
              <div className="grid grid-2" style={{ gap: 8 }}>
                {scanFields.map((line) => {
                  const done = extracted.some((entry) => entry.type === "field" && entry.field === line.field);
                  return (
                    <div key={line.field} className="hairline" style={{ padding: 10, borderRadius: 6, background: done ? "var(--surface)" : "var(--surface-2)", opacity: done ? 1 : 0.5, transition: "opacity 200ms" }}>
                      <div className="eyebrow" style={{ fontSize: 9 }}>{line.field}</div>
                      <div className="row mt-4" style={{ justifyContent: "space-between" }}>
                        <div style={{ fontSize: 13, color: "var(--ink)", fontWeight: 500 }}>{done ? line.val : "…"}</div>
                        {done && <span className="pill ai" style={{ fontSize: 10 }}>{line.conf}%</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="eyebrow mb-8 mt-16">Line items</div>
              <table className="tbl compact">
                <thead><tr><th>SKU</th><th>Product</th><th className="tr">Qty</th><th className="tr">Unit</th><th className="tr">Conf</th></tr></thead>
                <tbody>
                  {scanItems.map((item, index) => {
                    const done = extracted.some((entry) => entry.type === "item" && entry.name === item.name);
                    const warn = item.conf < 80;
                    return (
                      <tr key={index} style={{ opacity: done ? 1 : 0.3, transition: "opacity 200ms" }}>
                        <td className="id">{item.sku}</td>
                        <td>{item.name}</td>
                        <td className="num">{item.qty}</td>
                        <td className="num">{fmtUZS(item.price)}</td>
                        <td className="tr">{done && <span className={`pill ${warn ? "warn" : "ai"}`} style={{ fontSize: 10 }}>{item.conf}%</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {stage === 3 && scanItems.some((item) => item.conf < 80 || item.sku === "?") && (
                <Banner tone="warn" title="1 item needs review" action={<Button size="sm" variant="ghost">Review</Button>}>
                  At least one extracted line has low confidence or missing SKU. Review before posting.
                </Banner>
              )}
            </div>
          )}
          {stage === 3 && (
            <div className="modal-foot">
              <Button variant="ghost">Edit fields</Button>
              <span className="sp" />
              <div className="mono muted" style={{ fontSize: 11, alignSelf: "center" }}>
                {scanItems.reduce((sum, item) => sum + Number(item.qty || 0), 0)} units · {fmtUZS(scanItems.reduce((sum, item) => sum + Number(item.qty || 0) * Number(item.price || 0), 0))} UZS total
              </div>
              <Button variant="primary" icon={<Icon.Check size={13} />} onClick={confirmAndAdd} disabled={applying}>
                {applying ? "Applying..." : "Add to inventory"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { InventoryList, InventoryDetail, OcrScan });
