// SMB — secondary screens: production, services, finance, reports, team, settings

function Placeholder({ title, kpis, children, headerActions }) {
  return (
    <div className="page">
      <div className="page-head">
        <div><h1>{title}</h1></div>
        <span className="sp"/>
        {headerActions || (
          <>
            <Button variant="ghost" icon={<Icon.Download size={13}/>}>Export</Button>
            <Button variant="primary" icon={<Icon.Plus size={13}/>}>New</Button>
          </>
        )}
      </div>
      {kpis && <div className="grid grid-4 mb-16">{kpis}</div>}
      {children}
    </div>
  );
}

async function fetchPortalJson(path) {
  const response = await fetch(path, {
    credentials: "include",
    cache: "no-store"
  });
  const body = await response.json();
  return { response, body };
}

function formatEntityCode(value, prefix) {
  if (!value) return "—";
  if (typeof value !== "string") return `${prefix}-0000`;
  if (/^[A-Z]+-\d+$/i.test(value)) return value.toUpperCase();
  const parts = value.split("-");
  const tail = parts[parts.length - 1] || "";
  const numeric = Number.parseInt(tail, 10);
  if (Number.isFinite(numeric)) return `${prefix}-${String(numeric).padStart(4, "0")}`;
  return `${prefix}-${value.slice(0, 8).toUpperCase()}`;
}

function ProductionBOMs() {
  const [overview, setOverview] = useStateS(null);
  const [loading, setLoading] = useStateS(true);
  const [error, setError] = useStateS("");
  const [createOpen, setCreateOpen] = useStateS(false);
  const [creating, setCreating] = useStateS(false);
  const [createError, setCreateError] = useStateS("");
  const [exporting, setExporting] = useStateS(false);
  const [localOrders, setLocalOrders] = useStateS([]);
  const [orderForm, setOrderForm] = useStateS({
    bomId: "",
    plannedUnits: "1"
  });
  const [orderFormError, setOrderFormError] = useStateS("");
  const [orderSaving, setOrderSaving] = useStateS(false);
  const [materialBalances, setMaterialBalances] = useStateS({});
  const [localScrap, setLocalScrap] = useStateS([]);
  const [scrapForm, setScrapForm] = useStateS({
    productionOrderId: "",
    quantity: "1",
    reason: ""
  });
  const [scrapFormError, setScrapFormError] = useStateS("");
  const [createForm, setCreateForm] = useStateS({
    code: "",
    outputSku: "",
    version: "v1",
    materials: [{ sku: "", quantity: "1", unit: "pcs" }]
  });

  const resetCreateForm = () => {
    setCreateForm({
      code: "",
      outputSku: "",
      version: "v1",
      materials: [{ sku: "", quantity: "1", unit: "pcs" }]
    });
    setCreateError("");
  };

  useEffectS(() => {
    let cancelled = false;
    (async () => {
      try {
        const { response, body } = await fetchPortalJson("/api/production/overview");
        if (cancelled) return;
        if (!response.ok || !body.data) {
          setError(body.error?.message || body.message || "Не удалось загрузить данные производства.");
          setOverview(null);
          return;
        }
        setOverview(body.data);
        setError("");
      } catch {
        if (!cancelled) {
          setError("Не удалось загрузить данные производства.");
          setOverview(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const refreshOverview = async () => {
    const { response, body } = await fetchPortalJson("/api/production/overview");
    if (response.ok && body.data) {
      setOverview(body.data);
      setError("");
      return true;
    }
    return false;
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await fetch("/api/production/export", {
        method: "GET",
        credentials: "include",
        cache: "no-store"
      });
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body?.message || body?.error?.message || "Не удалось выгрузить данные производства.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "production-export.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : "Не удалось выгрузить данные производства.");
    } finally {
      setExporting(false);
    }
  };

  const submitCreateBom = async (event) => {
    event.preventDefault();
    const materials = createForm.materials
      .map((material) => ({
        sku: material.sku.trim(),
        quantity: Number.parseFloat(material.quantity),
        unit: material.unit.trim()
      }))
      .filter((material) => material.sku && material.unit && Number.isFinite(material.quantity) && material.quantity > 0);

    if (!createForm.code.trim() || !createForm.outputSku.trim() || !createForm.version.trim()) {
      setCreateError("Код, SKU выпуска и версия обязательны.");
      return;
    }
    if (materials.length === 0) {
      setCreateError("Добавьте хотя бы один материал.");
      return;
    }

    setCreating(true);
    setCreateError("");
    try {
      const response = await fetch("/api/production/boms", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          code: createForm.code.trim(),
          outputSku: createForm.outputSku.trim(),
          version: createForm.version.trim(),
          materials
        })
      });
      const body = await response.json();
      if (!response.ok || !body.data) {
        throw new Error(body?.message || body?.error?.message || "Не удалось создать норму BOM.");
      }

      setCreateOpen(false);
      resetCreateForm();
      await refreshOverview();
    } catch (createBomError) {
      setCreateError(createBomError instanceof Error ? createBomError.message : "Не удалось создать норму BOM.");
    } finally {
      setCreating(false);
    }
  };

  const updateMaterial = (index, key, value) => {
    setCreateForm((prev) => {
      const next = [...prev.materials];
      next[index] = { ...next[index], [key]: value };
      return { ...prev, materials: next };
    });
  };

  const addMaterialRow = () => {
    setCreateForm((prev) => ({
      ...prev,
      materials: [...prev.materials, { sku: "", quantity: "1", unit: "pcs" }]
    }));
  };

  const removeMaterialRow = (index) => {
    setCreateForm((prev) => ({
      ...prev,
      materials: prev.materials.length > 1 ? prev.materials.filter((_, current) => current !== index) : prev.materials
    }));
  };

  const boms = overview?.boms || [];
  const orders = [...(overview?.orders || []), ...localOrders];
  const scrap = [...(overview?.scrap || []), ...localScrap];
  const totalProduced = orders.reduce((sum, order) => sum + Number(order.producedUnits || 0), 0);
  const totalPlanned = orders.reduce((sum, order) => sum + Number(order.plannedUnits || 0), 0);
  const totalScrap = scrap.reduce((sum, record) => sum + Number(record.quantity || 0), 0);
  const scrapRate = totalPlanned > 0 ? `${((totalScrap / totalPlanned) * 100).toFixed(1)}%` : "0.0%";
  const translateOrderStatus = (status) => {
    switch (status) {
      case "completed":
        return "Завершён";
      case "in_progress":
        return "В работе";
      case "blocked":
        return "Заблокирован";
      case "draft":
        return "Черновик";
      case "planned":
        return "Запланирован";
      default:
        return status ? status.replace(/_/g, " ") : "—";
    }
  };
  const statusTone = (status) => {
    if (status === "completed") return "good";
    if (status === "in_progress") return "ai";
    if (status === "blocked") return "bad";
    return "info";
  };
  const planFactRows = [];
  orders.forEach((order) => {
    const bom = boms.find((candidate) => candidate.id === order.bomId);
    if (!bom || !Array.isArray(bom.materials)) return;
    const orderScrap = scrap
      .filter((record) => record.productionOrderId === order.id)
      .reduce((sum, record) => sum + Number(record.quantity || 0), 0);
    const factualUnits = Number(order.producedUnits || 0) + orderScrap;
    bom.materials.forEach((material) => {
      const ratio = Number(material.quantity || 0);
      if (!Number.isFinite(ratio) || ratio <= 0) return;
      const plannedQty = Number(order.plannedUnits || 0) * ratio;
      const actualQty = factualUnits * ratio;
      planFactRows.push({
        id: `${order.id}-${material.sku}`,
        materialSku: material.sku || "—",
        unit: material.unit || "ед.",
        orderCode: formatEntityCode(order.id, "PO"),
        plannedQty,
        actualQty,
        delta: actualQty - plannedQty
      });
    });
  });
  const getMaterialBalance = (sku) => {
    if (!sku) return 0;
    if (Number.isFinite(materialBalances[sku])) return Number(materialBalances[sku]);
    return 1000; // фронтовой демо-остаток, если backend не отдал склад
  };
  const submitCreateOrder = (event) => {
    event.preventDefault();
    const planned = Number.parseFloat(orderForm.plannedUnits);
    if (!orderForm.bomId) {
      setOrderFormError("Выберите норму BOM для заказа.");
      return;
    }
    if (!Number.isFinite(planned) || planned <= 0) {
      setOrderFormError("План выпуска должен быть больше 0.");
      return;
    }
    const bom = boms.find((item) => item.id === orderForm.bomId);
    if (!bom || !Array.isArray(bom.materials) || bom.materials.length === 0) {
      setOrderFormError("Для выбранной BOM нет материалов.");
      return;
    }
    const requirements = bom.materials
      .map((material) => {
        const perUnit = Number(material.quantity || 0);
        if (!Number.isFinite(perUnit) || perUnit <= 0) return null;
        const required = perUnit * planned;
        const available = getMaterialBalance(material.sku);
        return {
          sku: material.sku,
          unit: material.unit || "ед.",
          required,
          available
        };
      })
      .filter(Boolean);
    const deficits = requirements.filter((row) => row.required > row.available);
    if (deficits.length > 0) {
      const shortageText = deficits
        .slice(0, 3)
        .map((row) => `${row.sku}: не хватает ${(row.required - row.available).toFixed(3)} ${row.unit}`)
        .join("; ");
      setOrderFormError(`Недостаточно остатков сырья: ${shortageText}`);
      return;
    }

    setOrderSaving(true);
    setOrderFormError("");
    const now = Date.now();
    setLocalOrders((prev) => [
      {
        id: `local-po-${now}`,
        bomId: orderForm.bomId,
        plannedUnits: planned,
        producedUnits: 0,
        status: "in_progress"
      },
      ...prev
    ]);
    setMaterialBalances((prev) => {
      const next = { ...prev };
      requirements.forEach((row) => {
        next[row.sku] = row.available - row.required;
      });
      return next;
    });
    setOrderForm({
      bomId: "",
      plannedUnits: "1"
    });
    setOrderSaving(false);
    window.toast && window.toast.good("Производственный заказ создан, сырьё зарезервировано.");
  };
  const markOrderCompleted = (orderId) => {
    setLocalOrders((prev) => prev.map((order) => {
      if (order.id !== orderId) return order;
      return {
        ...order,
        status: "completed",
        producedUnits: Number(order.plannedUnits || 0)
      };
    }));
    window.toast && window.toast.good("Заказ завершён, выпуск оприходован.");
  };
  const submitScrapRecord = (event) => {
    event.preventDefault();
    const qty = Number.parseFloat(scrapForm.quantity);
    if (!scrapForm.productionOrderId) {
      setScrapFormError("Выберите производственный заказ.");
      return;
    }
    if (!Number.isFinite(qty) || qty <= 0) {
      setScrapFormError("Количество брака должно быть больше 0.");
      return;
    }
    if (!scrapForm.reason.trim()) {
      setScrapFormError("Укажите причину брака.");
      return;
    }
    const now = new Date().toISOString();
    setLocalScrap((prev) => [
      {
        id: `local-scrap-${Date.now()}`,
        productionOrderId: scrapForm.productionOrderId,
        quantity: qty,
        reason: scrapForm.reason.trim(),
        recordedAt: now
      },
      ...prev
    ]);
    setScrapForm({
      productionOrderId: "",
      quantity: "1",
      reason: ""
    });
    setScrapFormError("");
    window.toast && window.toast.good("Брак зафиксирован.");
  };
  return (
    <div className="page">
      <div className="page-head">
        <div><h1>Производство</h1></div>
        <span className="sp"/>
        <Button variant="ghost" icon={<Icon.Download size={13}/>} onClick={handleExport} disabled={exporting}>
          {exporting ? "Выгрузка..." : "Экспорт"}
        </Button>
        <Button variant="primary" icon={<Icon.Plus size={13}/>} onClick={() => setCreateOpen(true)}>Новая норма</Button>
      </div>

      <div className="grid grid-4 mb-16">
        <Kpi label="Активные нормы" value={String(boms.length)} delta={loading ? "Загрузка..." : "Синхронизировано"} trend="up"/>
        <Kpi label="Выпуск за сегодня" value={String(totalProduced)} unit="ед."/>
        <Kpi label="Доля брака" value={scrapRate} delta={`${scrap.length} записей`} trend="up"/>
        <Kpi label="Открытые заказы" value={String(orders.filter((o) => o.status !== "completed").length)} unit="заказа"/>
      </div>

      {error && (
        <Banner tone="warn" title="Живые данные недоступны">{error}</Banner>
      )}

      {/* Нормы BOM */}
      <div className="card card-pad-0">
        <div className="tbl-toolbar">
          <div className="input-wrap" style={{width:240}}>
            <span className="prefix"><Icon.Search size={13}/></span>
            <input className="input with-prefix" placeholder="Поиск норм BOM"/>
          </div>
          <span className="sp"/>
        </div>
        <table className="tbl">
          <colgroup>
            <col style={{width:"18%"}}/>
            <col style={{width:"34%"}}/>
            <col style={{width:"16%"}}/>
            <col style={{width:"14%"}}/>
            <col style={{width:"18%"}}/>
          </colgroup>
          <thead><tr><th>Код</th><th>SKU выпуска</th><th>Версия</th><th className="tr">Материалов</th><th>Статус</th></tr></thead>
          <tbody>
            {loading && boms.length === 0 && (
              <tr><td colSpan="5" className="dim mono">Загрузка…</td></tr>
            )}
            {!loading && boms.length === 0 && (
              <tr><td colSpan="5" className="dim mono">Нормы BOM не найдены.</td></tr>
            )}
            {boms.map((b) => (
              <tr key={b.id}>
                <td className="id">{b.code || formatEntityCode(b.id, "BOM")}</td>
                <td style={{fontWeight:500}}>{b.outputSku || "—"}</td>
                <td className="mono">{b.version || "—"}</td>
                <td className="num">{Array.isArray(b.materials) ? b.materials.length : "—"}</td>
                <td><Pill tone="good">Активна</Pill></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Создать заказ */}
      <div className="card mt-12">
        <div className="panel-title">Создать заказ</div>
        <div className="card-body" style={{paddingTop:14}}>
          <form onSubmit={submitCreateOrder}>
            <div className="grid" style={{gridTemplateColumns:"minmax(280px, 1.8fr) minmax(160px, 0.8fr) auto", gap:12, alignItems:"end"}}>
              <Field label="Норма BOM" required>
                <select className="input" value={orderForm.bomId}
                  onChange={(e) => setOrderForm((prev) => ({ ...prev, bomId: e.target.value }))}>
                  <option value="">Выберите норму</option>
                  {boms.map((bom) => (
                    <option key={bom.id} value={bom.id}>
                      {(bom.code || formatEntityCode(bom.id, "BOM"))} · {bom.outputSku || "Без SKU"}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Количество, ед." required>
                <input className="input" type="number" min="1" step="1" value={orderForm.plannedUnits}
                  onChange={(e) => setOrderForm((prev) => ({ ...prev, plannedUnits: e.target.value }))} placeholder="100"/>
              </Field>
              <div className="row" style={{justifyContent:"flex-end", paddingBottom:2}}>
                <Button variant="primary" type="submit" icon={<Icon.Check size={12}/>} disabled={orderSaving || boms.length === 0}>
                  {orderSaving ? "Создание..." : "Создать заказ"}
                </Button>
              </div>
            </div>
            {orderFormError && (
              <div className="banner warn mt-10">
                <span className="ico"><Icon.Alert size={15}/></span>
                <div className="desc">{orderFormError}</div>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Заказы + Брак */}
      <div className="grid" style={{gridTemplateColumns:"1fr 1fr", gap:12, marginTop:12}}>
        <div className="card card-pad-0">
          <div className="panel-title">Производственные заказы</div>
          <table className="tbl">
            <thead><tr><th>Заказ</th><th>BOM</th><th>Статус</th><th className="tr">План</th><th className="tr">Факт</th><th/></tr></thead>
            <tbody>
              {orders.length === 0 && (
                <tr><td colSpan="6" className="dim mono">Заказов пока нет.</td></tr>
              )}
              {orders.map((order) => {
                const bom = boms.find((c) => c.id === order.bomId);
                return (
                  <tr key={order.id}>
                    <td className="id">{formatEntityCode(order.id, "PO")}</td>
                    <td className="mono">{bom?.code || formatEntityCode(order.bomId, "BOM")}</td>
                    <td><Pill tone={statusTone(order.status)}>{translateOrderStatus(order.status)}</Pill></td>
                    <td className="num">{order.plannedUnits}</td>
                    <td className="num">{order.producedUnits}</td>
                    <td className="tr">
                      {String(order.id).startsWith("local-po-") && order.status !== "completed" ? (
                        <Button size="sm" variant="ghost" onClick={() => markOrderCompleted(order.id)}>Завершить</Button>
                      ) : (
                        <span className="dim">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="card card-pad-0">
          <div className="panel-title">Учёт брака</div>
          <div className="card-body hairline-b" style={{padding:"14px 14px 12px"}}>
            <form onSubmit={submitScrapRecord}>
              <div className="grid" style={{gridTemplateColumns:"minmax(170px, 1fr) minmax(130px, 0.7fr) minmax(170px, 1fr)", gap:10, alignItems:"end"}}>
                <Field label="Заказ*">
                  <select className="input" value={scrapForm.productionOrderId}
                    onChange={(e) => setScrapForm((prev) => ({ ...prev, productionOrderId: e.target.value }))}>
                    <option value="">Выберите заказ</option>
                    {orders.map((o) => (
                      <option key={o.id} value={o.id}>{formatEntityCode(o.id, "PO")}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Кол-во брака*">
                  <input className="input" type="number" min="0" step="0.01" value={scrapForm.quantity}
                    onChange={(e) => setScrapForm((prev) => ({ ...prev, quantity: e.target.value }))} placeholder="0"/>
                </Field>
                <Field label="Причина*">
                  <input className="input" value={scrapForm.reason}
                    onChange={(e) => setScrapForm((prev) => ({ ...prev, reason: e.target.value }))} placeholder="Например: дефект упаковки"/>
                </Field>
              </div>
              <div className="row" style={{marginTop: 16}}>
                <span className="sp"/>
                <Button variant="primary" size="sm" type="submit" icon={<Icon.Check size={12}/>}>Зафиксировать брак</Button>
              </div>
            </form>
            {scrapFormError && (
              <div className="banner warn mt-10">
                <span className="ico"><Icon.Alert size={15}/></span>
                <div className="desc">{scrapFormError}</div>
              </div>
            )}
          </div>
          {scrap.length === 0 ? (
            <div className="empty" style={{minHeight:140}}>
              <Icon.Alert size={24}/>
              <h3>Браков нет</h3>
              <div>Записи появятся после фиксации.</div>
            </div>
          ) : (
            <table className="tbl">
              <thead><tr><th>Причина</th><th>Заказ</th><th className="tr">Кол-во</th><th>Дата</th></tr></thead>
              <tbody>
                {scrap.map((record) => (
                  <tr key={record.id}>
                    <td style={{fontWeight:500}}>{record.reason}</td>
                    <td className="mono">{formatEntityCode(record.productionOrderId, "PO")}</td>
                    <td className="num">{record.quantity}</td>
                    <td className="dim mono">{record.recordedAt.slice(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* План vs Факт */}
      <div className="card card-pad-0 mt-12">
        <div className="panel-title">План vs Факт по сырью</div>
        {planFactRows.length === 0 ? (
          <div className="empty" style={{minHeight:120}}>
            <Icon.Doc size={24}/>
            <h3>Нет данных для сравнения</h3>
            <div>Создайте заказ и зафиксируйте выпуск, чтобы увидеть отклонения.</div>
          </div>
        ) : (
          <div style={{overflowX:"auto"}}>
            <table className="tbl compact">
              <colgroup>
                <col style={{width:"32%"}}/>
                <col style={{width:"16%"}}/>
                <col style={{width:"17%"}}/>
                <col style={{width:"17%"}}/>
                <col style={{width:"18%"}}/>
              </colgroup>
              <thead>
                <tr>
                  <th>Сырьё</th>
                  <th>Заказ</th>
                  <th className="tr">План</th>
                  <th className="tr">Факт</th>
                  <th className="tr">Отклонение</th>
                </tr>
              </thead>
              <tbody>
                {planFactRows.map((row) => (
                  <tr key={row.id}>
                    <td className="mono" style={{maxWidth:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}} title={row.materialSku}>{row.materialSku}</td>
                    <td className="mono">{row.orderCode}</td>
                    <td className="num mono" style={{whiteSpace:"nowrap"}}>{row.plannedQty.toFixed(3)} {row.unit}</td>
                    <td className="num mono" style={{whiteSpace:"nowrap"}}>{row.actualQty.toFixed(3)} {row.unit}</td>
                    <td className={`num mono ${row.delta > 0 ? "bad" : row.delta < 0 ? "good" : ""}`} style={{whiteSpace:"nowrap"}}>
                      {row.delta > 0 ? "+" : ""}{row.delta.toFixed(3)} {row.unit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Модалка создания BOM */}
      <Modal
        open={createOpen}
        onClose={() => { if (creating) return; setCreateOpen(false); resetCreateForm(); }}
        title="Новая норма BOM"
        size="md"
        footer={<>
          <Button variant="ghost" type="button" onClick={() => { setCreateOpen(false); resetCreateForm(); }} disabled={creating}>
            Отмена
          </Button>
          <span className="sp"/>
          <Button variant="primary" type="submit" form="create-bom-form" icon={<Icon.Check size={13}/>} disabled={creating}>
            {creating ? "Сохранение..." : "Создать"}
          </Button>
        </>}
      >
        <form id="create-bom-form" onSubmit={submitCreateBom}>
          <div className="grid grid-2" style={{gap:12}}>
            <Field label="Код BOM" required>
              <input className="input" value={createForm.code} onChange={(e) => setCreateForm((prev) => ({ ...prev, code: e.target.value }))} placeholder="BOM-1102"/>
            </Field>
            <Field label="SKU выпуска" required>
              <input className="input" value={createForm.outputSku} onChange={(e) => setCreateForm((prev) => ({ ...prev, outputSku: e.target.value }))} placeholder="SKU-COMP-002"/>
            </Field>
            <Field label="Версия" required>
              <input className="input" value={createForm.version} onChange={(e) => setCreateForm((prev) => ({ ...prev, version: e.target.value }))} placeholder="v1"/>
            </Field>
          </div>
          <div className="mt-12">
            <div className="row mb-8">
              <div className="eyebrow">Материалы (сырьё на 1 ед.)</div>
              <span className="sp"/>
              <Button variant="ghost" size="sm" type="button" icon={<Icon.Plus size={12}/>} onClick={addMaterialRow}>Добавить</Button>
            </div>
            <div className="col gap-8">
              {createForm.materials.map((material, index) => (
                <div key={index} className="grid grid-3" style={{gap:8, alignItems:"end"}}>
                  <Field label={index === 0 ? "SKU сырья" : undefined} required>
                    <input className="input" value={material.sku} onChange={(e) => updateMaterial(index, "sku", e.target.value)} placeholder="RM-BASE-001"/>
                  </Field>
                  <Field label={index === 0 ? "Кол-во на 1 ед." : undefined} required>
                    <input className="input" type="number" min="0" step="0.01" value={material.quantity} onChange={(e) => updateMaterial(index, "quantity", e.target.value)} placeholder="1"/>
                  </Field>
                  <div className="row gap-8">
                    <Field label={index === 0 ? "Ед. изм." : undefined} required>
                      <input className="input" value={material.unit} onChange={(e) => updateMaterial(index, "unit", e.target.value)} placeholder="pcs"/>
                    </Field>
                    {createForm.materials.length > 1 && (
                      <Button variant="ghost" size="sm" type="button" onClick={() => removeMaterialRow(index)} icon={<Icon.Trash size={12}/>}>Удалить</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {createError && (
            <div className="banner warn mt-12">
              <span className="ico"><Icon.Alert size={16}/></span>
              <div className="desc">{createError}</div>
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}

function ServicesKanban() {
  const [overview, setOverview] = useStateS(null);
  const [loading, setLoading] = useStateS(true);
  const [error, setError] = useStateS("");
  const [createOpen, setCreateOpen] = useStateS(false);
  const [creating, setCreating] = useStateS(false);
  const [createError, setCreateError] = useStateS("");
  const [exporting, setExporting] = useStateS(false);
  const [createForm, setCreateForm] = useStateS({
    title: "",
    customer: "",
    requestedBy: "",
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  });

  const refreshOverview = async () => {
    const { response, body } = await fetchPortalJson("/api/service-orders/overview");
    if (response.ok && body.data) {
      setOverview(body.data);
      setError("");
      return true;
    }
    return false;
  };

  useEffectS(() => {
    let cancelled = false;
    (async () => {
      try {
        const { response, body } = await fetchPortalJson("/api/service-orders/overview");
        if (cancelled) return;
        if (!response.ok || !body.data) {
          setError(body.error?.message || body.message || "Unable to load service orders.");
          setOverview(null);
          return;
        }
        setOverview(body.data);
        setError("");
      } catch {
        if (!cancelled) {
          setError("Unable to load service orders.");
          setOverview(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const csvEscape = (value) => {
    const text = value == null ? "" : String(value);
    if (/["\n,]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
    return text;
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const rows = [
        ["kind", "code", "title", "customer", "status", "requestedBy", "dueDate", "approvalStatus"],
        ...orders.map((order) => [
          "service_order",
          formatEntityCode(order.id, "WO"),
          order.title,
          order.customer,
          order.status,
          order.requestedBy,
          order.dueDate,
          ""
        ]),
        ...pendingApprovals.map((approval) => [
          "approval",
          formatEntityCode(approval.entityId, "WO"),
          "",
          "",
          "",
          approval.submittedBy,
          "",
          approval.status
        ])
      ];
      const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "service-orders-export.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setError("Unable to export service orders.");
    } finally {
      setExporting(false);
    }
  };

  const submitCreateOrder = async (event) => {
    event.preventDefault();
    if (!createForm.title.trim() || !createForm.customer.trim() || !createForm.requestedBy.trim() || !createForm.dueDate.trim()) {
      setCreateError("Title, customer, requested by, and due date are required.");
      return;
    }
    setCreating(true);
    setCreateError("");
    try {
      const post = await fetch("/api/service-orders", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: createForm.title.trim(),
          customer: createForm.customer.trim(),
          requestedBy: createForm.requestedBy.trim(),
          dueDate: createForm.dueDate
        })
      });
      const postBody = await post.json();
      if (!post.ok || !postBody.data) {
        throw new Error(postBody.error?.message || postBody.message || "Unable to create service order.");
      }
      setCreateOpen(false);
      setCreateForm({
        title: "",
        customer: "",
        requestedBy: "",
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      });
      await refreshOverview();
    } catch (createOrderError) {
      setCreateError(createOrderError instanceof Error ? createOrderError.message : "Unable to create service order.");
    } finally {
      setCreating(false);
    }
  };

  const orders = overview?.orders || [];
  const pendingApprovals = overview?.approvals || [];
  const orderById = new Map(orders.map((order) => [order.id, order]));
  const cols = [
    { n:"Requested", tone:"info", status:"submitted" },
    { n:"Approved", tone:"warn", status:"approved" },
    { n:"In progress", tone:"ai", status:"in_progress" },
    { n:"Completed", tone:"good", status:"completed" },
  ].map((col) => ({
      ...col,
      items: orders.filter((order) => order.status === col.status)
  }));
  return (
    <Placeholder
      title="Services · Work orders"
      headerActions={
        <>
          <Button variant="ghost" icon={<Icon.Download size={13}/>} onClick={handleExport} disabled={exporting || loading}>
            {exporting ? "Exporting..." : "Export"}
          </Button>
          <Button variant="primary" icon={<Icon.Plus size={13}/>} onClick={() => setCreateOpen(true)}>New</Button>
        </>
      }
    >
      {error && (
        <Banner tone="warn" title="Live service orders unavailable">
          Showing current service order data. {error}
        </Banner>
      )}
      <div className="grid grid-4" style={{gap:12}}>
        {cols.map((col, i) => (
          <div key={i} className="card card-pad-0">
            <div className="panel-title"><Pill tone={col.tone} dot={false}>{col.n}</Pill><span className="sp"/><span className="mono muted" style={{fontSize:11}}>{col.items.length}</span></div>
            <div style={{padding:8}}>
              {col.items.map((w, j) => (
                <div key={j} className="hairline" style={{padding:10, borderRadius:6, marginBottom:8}}>
                  <div style={{fontSize:12.5, color:"var(--ink)", fontWeight:500}}>{w.title}</div>
                  <div className="muted" style={{fontSize:11, marginTop:2}}>{w.customer} · due {w.dueDate}</div>
                  <div className="row mt-8">
                    <div className="avatar sm green">{String(w.requestedBy || w.customer).slice(0, 2).toUpperCase()}</div>
                    <span className="sp"/>
                    <span className="mono muted" style={{fontSize:10}}>{formatEntityCode(w.id, "WO")}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="grid" style={{gridTemplateColumns:"1.2fr .8fr", gap:12, marginTop:12}}>
        <div className="card card-pad-0">
          <div className="panel-title">Service order backlog</div>
          <table className="tbl">
            <thead><tr><th>Order</th><th>Customer</th><th>Status</th><th>Requested by</th></tr></thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="id">{formatEntityCode(order.id, "WO")}</td>
                  <td style={{color:"var(--ink)", fontWeight:500}}>{order.title}</td>
                  <td><Pill tone={order.status === "completed" ? "good" : order.status === "in_progress" ? "ai" : order.status === "approved" ? "warn" : order.status === "rejected" ? "bad" : "info"}>{order.status.replace(/_/g, " ")}</Pill></td>
                  <td className="dim">{order.requestedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card card-pad-0">
          <div className="panel-title">Pending approvals</div>
          {pendingApprovals.length === 0 ? (
            <div className="empty" style={{minHeight:180}}>
              <Icon.Check size={24}/>
              <h3>No approvals pending</h3>
              <div>The backend has no service order approvals in queue.</div>
            </div>
          ) : (
            <table className="tbl">
              <thead><tr><th>Entity</th><th>Submitted by</th><th>Status</th></tr></thead>
              <tbody>
                {pendingApprovals.map((approval) => (
                  <tr key={approval.id}>
                    <td className="id">{formatEntityCode(approval.entityId, "WO")} {orderById.get(approval.entityId)?.title ? `· ${orderById.get(approval.entityId).title}` : ""}</td>
                    <td>{approval.submittedBy}</td>
                    <td><Pill tone="warn">{approval.status}</Pill></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <Modal
        open={createOpen}
        onClose={() => {
          if (creating) return;
          setCreateOpen(false);
          setCreateError("");
        }}
        title="Create service order"
        size="sm"
        footer={
          <>
            <Button variant="ghost" type="button" onClick={() => setCreateOpen(false)} disabled={creating}>Cancel</Button>
            <span className="sp" />
            <Button variant="primary" type="submit" form="create-service-order-form" icon={<Icon.Check size={13} />} disabled={creating}>
              {creating ? "Saving..." : "Create order"}
            </Button>
          </>
        }
      >
        <form id="create-service-order-form" onSubmit={submitCreateOrder}>
          <div className="grid grid-2" style={{ gap: 12 }}>
            <Field label="Title" required>
              <input className="input" value={createForm.title} onChange={(e) => setCreateForm((prev) => ({ ...prev, title: e.target.value }))} placeholder="Delivery to Chorsu Market" />
            </Field>
            <Field label="Customer" required>
              <input className="input" value={createForm.customer} onChange={(e) => setCreateForm((prev) => ({ ...prev, customer: e.target.value }))} placeholder="Chorsu Market" />
            </Field>
            <Field label="Requested by" required>
              <input className="input" value={createForm.requestedBy} onChange={(e) => setCreateForm((prev) => ({ ...prev, requestedBy: e.target.value }))} placeholder="Jasur Azimov" />
            </Field>
            <Field label="Due date" required>
              <input className="input" type="date" value={createForm.dueDate} onChange={(e) => setCreateForm((prev) => ({ ...prev, dueDate: e.target.value }))} />
            </Field>
          </div>
          {createError && (
            <div className="banner warn mt-12">
              <span className="ico"><Icon.Alert size={16} /></span>
              <div className="desc">{createError}</div>
            </div>
          )}
        </form>
      </Modal>
    </Placeholder>
  );
}

function FinancePage({ kind }) {
  const [overview, setOverview] = useStateS(null);
  const [loading, setLoading] = useStateS(true);
  const [error, setError] = useStateS("");
  const [exporting, setExporting] = useStateS(false);
  const [submitting, setSubmitting] = useStateS(false);
  const [payingBillId, setPayingBillId] = useStateS("");
  const [invoiceModalOpen, setInvoiceModalOpen] = useStateS(false);
  const [billModalOpen, setBillModalOpen] = useStateS(false);
  const [journalModalOpen, setJournalModalOpen] = useStateS(false);
  const [actionMessage, setActionMessage] = useStateS("");
  const todayIso = new Date().toISOString().slice(0, 10);
  const [paymentsTab, setPaymentsTab] = useStateS("incoming");
  const [paymentForm, setPaymentForm] = useStateS({
    direction: "outgoing",
    docId: "",
    amount: "",
    paymentDate: todayIso,
    sourceType: "bank_account",
    sourceAccountId: "",
    reference: ""
  });
  const [ocrFile, setOcrFile] = useStateS(null);
  const [ocrAllocations, setOcrAllocations] = useStateS([]);
  const [ocrApplying, setOcrApplying] = useStateS(false);
  const [reconCounterparty, setReconCounterparty] = useStateS("");

  const [invoiceForm, setInvoiceForm] = useStateS({
    counterpartyName: "",
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    description: "Goods supplied",
    quantity: "1",
    unitPrice: "1000000"
  });
  const [billForm, setBillForm] = useStateS({
    counterpartyName: "",
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    description: "Supplier invoice",
    quantity: "1",
    unitPrice: "1000000"
  });
  const [journalForm, setJournalForm] = useStateS({
    effectiveDate: todayIso,
    memo: "Manual adjustment",
    debitAccountId: "",
    creditAccountId: "",
    amount: "100000"
  });

  const parseMoney = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const csvEscape = (value) => {
    const text = value == null ? "" : String(value);
    if (/["\n,]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
    return text;
  };

  const downloadCsv = (filename, rows) => {
    const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  useEffectS(() => {
    let cancelled = false;
    (async () => {
      try {
        const { response, body } = await fetchPortalJson("/api/finance/overview");
        if (cancelled) return;
        if (!response.ok || !body.data) {
          setError(body.error?.message || body.message || "Unable to load finance data.");
          setOverview(null);
          return;
        }
        setOverview(body.data);
        setError("");
      } catch {
        if (!cancelled) {
          setError("Unable to load finance data.");
          setOverview(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const refreshOverview = async () => {
    const { response, body } = await fetchPortalJson("/api/finance/overview");
    if (!response.ok || !body?.data) {
      setError(body?.error?.message || body?.message || "Unable to load finance data.");
      return false;
    }
    setOverview(body.data);
    setError("");
    return true;
  };

  const ledgerAccounts = overview?.accounts || [];
  const ledgerRows = overview?.ledger || [];
  const invoices = overview?.invoices || [];
  const bills = overview?.bills || [];
  const cashFlow = overview?.cashFlow || [];
  const payments = overview?.payments || [];
  const trialBalance = overview?.trialBalance;
  const accountById = new Map(ledgerAccounts.map((account) => [account.id, account]));

  const resolveInvoiceState = (invoice) => {
    const dueDate = (invoice.dueDate || "").slice(0, 10);
    const outstanding = parseMoney(invoice.outstandingTotal);
    if (invoice.status === "voided") return { label: "voided", tone: "warn", overdue: false, paid: false };
    if (invoice.status === "draft") return { label: "draft", tone: "info", overdue: false, paid: false };
    if (invoice.status === "paid" || outstanding <= 0) return { label: "paid", tone: "good", overdue: false, paid: true };
    const overdue = Boolean(dueDate) && dueDate < todayIso;
    if (overdue) return { label: "overdue", tone: "bad", overdue: true, paid: false };
    if (invoice.status === "partially_paid" || outstanding < parseMoney(invoice.total)) return { label: "partially paid", tone: "warn", overdue: false, paid: false };
    return { label: "sent", tone: "info", overdue: false, paid: false };
  };

  const resolveBillState = (bill) => {
    const dueDate = (bill.dueDate || "").slice(0, 10);
    const outstanding = parseMoney(bill.outstandingTotal);
    if (bill.status === "voided") return { label: "voided", tone: "warn", overdue: false, paid: false };
    if (bill.status === "draft") return { label: "draft", tone: "info", overdue: false, paid: false };
    if (bill.status === "paid" || outstanding <= 0) return { label: "paid", tone: "good", overdue: false, paid: true };
    const overdue = Boolean(dueDate) && dueDate < todayIso;
    if (overdue) return { label: "overdue", tone: "warn", overdue: true, paid: false };
    if (bill.status === "partially_paid" || outstanding < parseMoney(bill.total)) return { label: "partially paid", tone: "info", overdue: false, paid: false };
    return { label: "due", tone: "warn", overdue: false, paid: false };
  };

  const invoiceRows = invoices.map((invoice) => ({ ...invoice, uiState: resolveInvoiceState(invoice) }));
  const billRows = bills.map((bill) => ({ ...bill, uiState: resolveBillState(bill) }));
  const paymentSources = ledgerAccounts.slice(0, 8);
  const incomingRows = billRows.map((bill) => ({
    id: bill.id,
    number: bill.number,
    counterpartyName: bill.counterpartyName,
    amount: parseMoney(bill.total),
    outstandingAmount: parseMoney(bill.outstandingTotal),
    dueDate: (bill.dueDate || "").slice(0, 10),
    state: bill.uiState
  }));
  const outgoingRows = invoiceRows.map((invoice) => ({
    id: invoice.id,
    number: invoice.number,
    counterpartyName: invoice.counterpartyName,
    amount: parseMoney(invoice.total),
    outstandingAmount: parseMoney(invoice.outstandingTotal),
    dueDate: (invoice.dueDate || "").slice(0, 10),
    state: invoice.uiState
  }));
  const docsForPayment = paymentForm.direction === "outgoing" ? incomingRows : outgoingRows;
  const counterparties = Array.from(new Set([
    ...incomingRows.map((row) => row.counterpartyName).filter(Boolean),
    ...outgoingRows.map((row) => row.counterpartyName).filter(Boolean)
  ])).sort((left, right) => left.localeCompare(right));

  const hasLiveCashBuckets = cashFlow.some((bucket) => parseMoney(bucket.inflow) !== 0 || parseMoney(bucket.outflow) !== 0 || parseMoney(bucket.net) !== 0);
  const effectiveCashFlow = (() => {
    const monthKeys = [];
    const byMonth = new Map();
    for (let index = 5; index >= 0; index -= 1) {
      const date = new Date();
      date.setUTCDate(1);
      date.setUTCMonth(date.getUTCMonth() - index);
      const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
      monthKeys.push(key);
      byMonth.set(key, {
        periodStart: `${key}-01`,
        periodLabel: date.toLocaleString("en-US", { month: "short" }),
        periodLongLabel: date.toLocaleString("en-US", { month: "long" }),
        inflow: 0,
        outflow: 0,
        net: 0
      });
    }

    if (hasLiveCashBuckets) {
      cashFlow.forEach((bucket) => {
        const key = String(bucket.periodStart || "").slice(0, 7);
        const row = byMonth.get(key);
        if (!row) return;
        row.inflow += parseMoney(bucket.inflow);
        row.outflow += parseMoney(bucket.outflow);
        row.net = row.inflow - row.outflow;
      });
      return monthKeys.map((key) => byMonth.get(key));
    }

    payments.forEach((payment) => {
      const key = String(payment.paymentDate || "").slice(0, 7);
      const row = byMonth.get(key);
      if (!row) return;
      const amount = parseMoney(payment.amount);
      if (payment.direction === "outgoing") row.outflow += amount;
      else row.inflow += amount;
      row.net = row.inflow - row.outflow;
    });
    return monthKeys.map((key) => byMonth.get(key));
  })();
  const inflowTotal = effectiveCashFlow.reduce((sum, bucket) => sum + parseMoney(bucket.inflow), 0);
  const outflowTotal = effectiveCashFlow.reduce((sum, bucket) => sum + parseMoney(bucket.outflow), 0);
  const netTotal = effectiveCashFlow.reduce((sum, bucket) => sum + parseMoney(bucket.net), 0);

  const trialBalanceByCode = new Map((trialBalance?.rows || []).map((row) => [row.accountCode, parseMoney(row.balance)]));
  const ledgerTotalsByCode = new Map();
  if (trialBalanceByCode.size === 0) {
    ledgerRows.forEach((line) => {
      const code = line.accountCode || "";
      if (!code) return;
      const running = ledgerTotalsByCode.get(code) || { debit: 0, credit: 0 };
      const amount = parseMoney(line.amount);
      if (line.entrySide === "credit") running.credit += amount;
      else running.debit += amount;
      ledgerTotalsByCode.set(code, running);
    });
  }

  const shouldShowLedgerFallback = !loading && !overview && Boolean(error);
  const ACCT = ledgerAccounts.length > 0
    ? ledgerAccounts.map((account) => {
        let balance = parseMoney(account.balance);
        if (trialBalanceByCode.has(account.code)) {
          balance = trialBalanceByCode.get(account.code);
        } else if (ledgerTotalsByCode.has(account.code)) {
          const totals = ledgerTotalsByCode.get(account.code);
          balance = account.normalSide === "credit" ? totals.credit - totals.debit : totals.debit - totals.credit;
        }
        return { id: account.id, c: account.code, n: account.name, b: balance };
      })
    : shouldShowLedgerFallback ? [
        { id: "1001", c: "1001", n: "Cash · SQB current", b: 64_200_000 },
        { id: "1100", c: "1100", n: "Accounts receivable", b: 86_400_000 },
        { id: "1200", c: "1200", n: "Inventory", b: 412_700_000 },
        { id: "2001", c: "2001", n: "Accounts payable", b: -78_200_000 },
        { id: "2100", c: "2100", n: "VAT payable", b: -14_200_000 },
        { id: "3001", c: "3001", n: "Retained earnings", b: -402_800_000 },
        { id: "4000", c: "4000", n: "Sales revenue", b: -278_400_000 },
        { id: "5000", c: "5000", n: "Cost of goods sold", b: 192_100_000 }
      ] : [];

  const openReminder = (invoice) => {
    const subject = encodeURIComponent(`Payment reminder: ${invoice.number}`);
    const body = encodeURIComponent(`Dear ${invoice.counterpartyName || "customer"},\n\nThis is a reminder that invoice ${invoice.number} is due on ${(invoice.dueDate || "").slice(0, 10)}.\nOutstanding amount: ${fmtUZS(parseMoney(invoice.outstandingTotal))} UZS.\n\nThank you.`);
    const email = encodeURIComponent(invoice.counterpartyEmail || "");
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  };

  const submitInvoiceCreate = async (event) => {
    event.preventDefault();
    if (!invoiceForm.counterpartyName.trim() || !invoiceForm.dueDate || parseMoney(invoiceForm.quantity) <= 0 || parseMoney(invoiceForm.unitPrice) <= 0) {
      setActionMessage("Invoice form is incomplete.");
      return;
    }
    setSubmitting(true);
    setActionMessage("");
    try {
      const response = await fetch("/api/finance/invoices", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          counterpartyName: invoiceForm.counterpartyName.trim(),
          dueDate: invoiceForm.dueDate,
          lines: [{
            description: invoiceForm.description.trim() || "Goods supplied",
            quantity: String(parseMoney(invoiceForm.quantity)),
            unitPrice: String(parseMoney(invoiceForm.unitPrice))
          }]
        })
      });
      const body = await response.json();
      if (!response.ok || !body.data) {
        throw new Error(body?.error?.message || body?.message || "Unable to create invoice.");
      }
      setInvoiceModalOpen(false);
      setInvoiceForm({
        counterpartyName: "",
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        description: "Goods supplied",
        quantity: "1",
        unitPrice: "1000000"
      });
      await refreshOverview();
    } catch (createError) {
      setActionMessage(createError instanceof Error ? createError.message : "Unable to create invoice.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitBillCreate = async (event) => {
    event.preventDefault();
    if (!billForm.counterpartyName.trim() || !billForm.dueDate || parseMoney(billForm.quantity) <= 0 || parseMoney(billForm.unitPrice) <= 0) {
      setActionMessage("Bill form is incomplete.");
      return;
    }
    setSubmitting(true);
    setActionMessage("");
    try {
      const response = await fetch("/api/finance/bills", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          counterpartyName: billForm.counterpartyName.trim(),
          dueDate: billForm.dueDate,
          lines: [{
            description: billForm.description.trim() || "Supplier invoice",
            quantity: String(parseMoney(billForm.quantity)),
            unitPrice: String(parseMoney(billForm.unitPrice))
          }]
        })
      });
      const body = await response.json();
      if (!response.ok || !body.data) {
        throw new Error(body?.error?.message || body?.message || "Unable to create bill.");
      }
      setBillModalOpen(false);
      setBillForm({
        counterpartyName: "",
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        description: "Supplier invoice",
        quantity: "1",
        unitPrice: "1000000"
      });
      await refreshOverview();
    } catch (createError) {
      setActionMessage(createError instanceof Error ? createError.message : "Unable to create bill.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitManualJournal = async (event) => {
    event.preventDefault();
    if (!journalForm.effectiveDate || !journalForm.debitAccountId || !journalForm.creditAccountId || journalForm.debitAccountId === journalForm.creditAccountId || parseMoney(journalForm.amount) <= 0) {
      setActionMessage("Journal form is incomplete.");
      return;
    }
    setSubmitting(true);
    setActionMessage("");
    try {
      const response = await fetch("/api/finance/journals/manual", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          effectiveDate: journalForm.effectiveDate,
          memo: journalForm.memo.trim(),
          sourceType: "manual_adjustment",
          lines: [
            { accountId: journalForm.debitAccountId, entrySide: "debit", amount: String(parseMoney(journalForm.amount)) },
            { accountId: journalForm.creditAccountId, entrySide: "credit", amount: String(parseMoney(journalForm.amount)) }
          ]
        })
      });
      const body = await response.json();
      if (!response.ok || !body.data) {
        throw new Error(body?.error?.message || body?.message || "Unable to create manual journal.");
      }
      setJournalModalOpen(false);
      await refreshOverview();
    } catch (createError) {
      setActionMessage(createError instanceof Error ? createError.message : "Unable to create manual journal.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkBillPaid = async (bill) => {
    const amount = parseMoney(bill.outstandingTotal) > 0 ? parseMoney(bill.outstandingTotal) : parseMoney(bill.total);
    if (amount <= 0) return;
    setPayingBillId(bill.id);
    setActionMessage("");
    try {
      const response = await fetch(`/api/finance/bills/${bill.id}/payments`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          paymentDate: todayIso,
          amount: String(amount),
          reference: `Bill payment ${bill.number}`
        })
      });
      const body = await response.json();
      if (!response.ok || !body.data) {
        throw new Error(body?.error?.message || body?.message || "Unable to mark bill as paid.");
      }
      await refreshOverview();
    } catch (paymentError) {
      setActionMessage(paymentError instanceof Error ? paymentError.message : "Unable to mark bill as paid.");
    } finally {
      setPayingBillId("");
    }
  };

  const postDocumentPayment = async ({ direction, docId, amount, paymentDate, reference, sourceType, sourceAccountId }) => {
    const url = direction === "outgoing"
      ? `/api/finance/bills/${docId}/payments`
      : `/api/finance/invoices/${docId}/payments`;
    const response = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        paymentDate,
        amount: String(amount),
        reference,
        sourceType,
        sourceAccountId
      })
    });
    const body = await response.json();
    if (!response.ok || !body.data) {
      throw new Error(body?.error?.message || body?.message || "Unable to register payment.");
    }
    return body.data;
  };

  const calcDueInfo = (dueDate) => {
    if (!dueDate) return { text: "—", tone: "info" };
    const date = new Date(`${dueDate}T00:00:00`);
    const now = new Date(`${todayIso}T00:00:00`);
    const diff = Math.round((date.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    if (diff > 0) return { text: `in ${diff} d`, tone: "good" };
    if (diff === 0) return { text: "due today", tone: "warn" };
    return { text: `${Math.abs(diff)} d overdue`, tone: "bad" };
  };

  const toPaymentStatus = (row) => {
    if (row.outstandingAmount <= 0) return { label: "paid", tone: "good" };
    if (row.outstandingAmount < row.amount) return { label: "partially paid", tone: "warn" };
    return { label: "unpaid", tone: "bad" };
  };

  const registerPayment = async (event) => {
    event.preventDefault();
    if (!paymentForm.docId || parseMoney(paymentForm.amount) <= 0 || !paymentForm.paymentDate) {
      setActionMessage("Select document, amount, and payment date.");
      return;
    }
    setSubmitting(true);
    setActionMessage("");
    try {
      await postDocumentPayment({
        direction: paymentForm.direction,
        docId: paymentForm.docId,
        amount: parseMoney(paymentForm.amount),
        paymentDate: paymentForm.paymentDate,
        reference: paymentForm.reference.trim() || "Manual payment",
        sourceType: paymentForm.sourceType,
        sourceAccountId: paymentForm.sourceAccountId || undefined
      });
      await refreshOverview();
      setPaymentForm((prev) => ({
        ...prev,
        docId: "",
        amount: "",
        reference: ""
      }));
      setActionMessage("Payment has been registered.");
    } catch (paymentError) {
      setActionMessage(paymentError instanceof Error ? paymentError.message : "Unable to register payment.");
    } finally {
      setSubmitting(false);
    }
  };

  const analyzeBankStatement = () => {
    if (!ocrFile) {
      setActionMessage("Upload PDF bank statement first.");
      return;
    }
    const openDocs = docsForPayment.filter((doc) => doc.outstandingAmount > 0);
    const allocations = openDocs.slice(0, 4).map((doc, index) => ({
      docId: doc.id,
      number: doc.number,
      counterpartyName: doc.counterpartyName,
      amount: Math.max(1, Math.round(doc.outstandingAmount * (index === 0 ? 1 : 0.5))),
      paymentDate: todayIso
    }));
    setOcrAllocations(allocations);
    setActionMessage(`OCR parsed ${ocrFile.name} and prepared ${allocations.length} allocations.`);
  };

  const applyOcrAllocations = async () => {
    if (ocrAllocations.length === 0) return;
    setOcrApplying(true);
    setActionMessage("");
    try {
      for (const allocation of ocrAllocations) {
        await postDocumentPayment({
          direction: paymentForm.direction,
          docId: allocation.docId,
          amount: allocation.amount,
          paymentDate: allocation.paymentDate,
          reference: `OCR: ${ocrFile ? ocrFile.name : "bank statement"}`,
          sourceType: paymentForm.sourceType,
          sourceAccountId: paymentForm.sourceAccountId || undefined
        });
      }
      await refreshOverview();
      setActionMessage("OCR allocations have been posted.");
      setOcrAllocations([]);
      setOcrFile(null);
    } catch (ocrError) {
      setActionMessage(ocrError instanceof Error ? ocrError.message : "Unable to apply OCR allocations.");
    } finally {
      setOcrApplying(false);
    }
  };

  const handleExport = async (exportKind) => {
    setExporting(true);
    try {
      if (exportKind === "invoices") {
        const rows = [
          ["invoice", "customer", "issue_date", "due_date", "total", "outstanding", "status"],
          ...invoiceRows.map((invoice) => [
            invoice.number,
            invoice.counterpartyName,
            (invoice.issueDate || invoice.createdAt || "").slice(0, 10),
            (invoice.dueDate || "").slice(0, 10),
            parseMoney(invoice.total),
            parseMoney(invoice.outstandingTotal),
            invoice.uiState.label
          ])
        ];
        downloadCsv("finance-invoices.csv", rows);
        return;
      }
      if (exportKind === "bills") {
        const rows = [
          ["bill", "vendor", "issue_date", "due_date", "total", "outstanding", "status"],
          ...billRows.map((bill) => [
            bill.number,
            bill.counterpartyName,
            (bill.issueDate || bill.createdAt || "").slice(0, 10),
            (bill.dueDate || "").slice(0, 10),
            parseMoney(bill.total),
            parseMoney(bill.outstandingTotal),
            bill.uiState.label
          ])
        ];
        downloadCsv("finance-bills.csv", rows);
        return;
      }
      if (exportKind === "cash") {
        const rows = [
          ["period", "inflow", "outflow", "net"],
          ...effectiveCashFlow.map((bucket) => [
            bucket.periodLabel,
            parseMoney(bucket.inflow),
            parseMoney(bucket.outflow),
            parseMoney(bucket.net)
          ])
        ];
        downloadCsv("finance-cash-flow.csv", rows);
        return;
      }
      const rows = [
        ["account_code", "account_name", "balance"],
        ...ACCT.map((account) => [account.c, account.n, account.b])
      ];
      downloadCsv("finance-ledger.csv", rows);
    } catch {
      setActionMessage("Unable to export finance data.");
    } finally {
      setExporting(false);
    }
  };

  if (kind === "payments") {
    const rows = paymentsTab === "incoming" ? incomingRows : outgoingRows;
    const selectedCounterpartyRows = [
      ...incomingRows.map((row) => ({ ...row, direction: "incoming" })),
      ...outgoingRows.map((row) => ({ ...row, direction: "outgoing" }))
    ].filter((row) => !reconCounterparty || row.counterpartyName === reconCounterparty);
    const totalIncoming = selectedCounterpartyRows
      .filter((row) => row.direction === "incoming")
      .reduce((sum, row) => sum + row.amount, 0);
    const totalOutgoing = selectedCounterpartyRows
      .filter((row) => row.direction === "outgoing")
      .reduce((sum, row) => sum + row.amount, 0);
    const totalOutstanding = selectedCounterpartyRows
      .reduce((sum, row) => sum + row.outstandingAmount, 0);

    return (
      <Placeholder
        title="Accounts & Payments"
        headerActions={<>
          <Button variant="ghost" icon={<Icon.Download size={13}/>} onClick={() => handleExport(paymentsTab === "incoming" ? "bills" : "invoices")} disabled={exporting}>
            {exporting ? "Exporting..." : "Export"}
          </Button>
          <Button variant="primary" icon={<Icon.Check size={13}/>} onClick={refreshOverview} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </Button>
        </>}
        kpis={<>
          <Kpi label="Incoming" value={String(incomingRows.length)} delta="We owe suppliers"/>
          <Kpi label="Outgoing" value={String(outgoingRows.length)} delta="Customers owe us"/>
          <Kpi label="Open documents" value={String([...incomingRows, ...outgoingRows].filter((row) => row.outstandingAmount > 0).length)} delta="Need attention"/>
          <Kpi label="Outstanding total" value={fmtUZS(totalOutstanding)} unit="UZS"/>
        </>}
      >
        {error && <Banner tone="warn" title="Live payments data unavailable">Showing current finance data. {error}</Banner>}
        {actionMessage && <Banner tone="warn" title="Payments notice">{actionMessage}</Banner>}

        <div className="card card-pad-0">
          <div className="tbl-toolbar">
            <span className={`chip ${paymentsTab === "incoming" ? "active" : ""}`} onClick={() => {
              setPaymentsTab("incoming");
              setPaymentForm((prev) => ({ ...prev, direction: "outgoing", docId: "", amount: "" }));
            }}>Incoming (payables)</span>
            <span className={`chip ${paymentsTab === "outgoing" ? "active" : ""}`} onClick={() => {
              setPaymentsTab("outgoing");
              setPaymentForm((prev) => ({ ...prev, direction: "incoming", docId: "", amount: "" }));
            }}>Outgoing (receivables)</span>
            <span className="sp"/>
            <span className="mono muted" style={{fontSize:11}}>{rows.length} docs</span>
          </div>
          <table className="tbl">
            <thead><tr><th>Document</th><th>Counterparty</th><th className="tr">Amount</th><th>Due</th><th>Timing</th><th>Status</th></tr></thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan="6" className="dim mono">No documents found.</td></tr>
              ) : null}
              {rows.map((row) => {
                const dueInfo = calcDueInfo(row.dueDate);
                const status = toPaymentStatus(row);
                return (
                  <tr key={row.id}>
                    <td className="id">{row.number}</td>
                    <td style={{fontWeight:500, color:"var(--ink)"}}>{row.counterpartyName || "—"}</td>
                    <td className="num">
                      <div>{fmtUZS(row.amount)}</div>
                      <div className="dim mono" style={{fontSize:11}}>open {fmtUZS(row.outstandingAmount)}</div>
                    </td>
                    <td className="dim mono">{row.dueDate || "—"}</td>
                    <td><Pill tone={dueInfo.tone}>{dueInfo.text}</Pill></td>
                    <td><Pill tone={status.tone}>{status.label}</Pill></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="grid" style={{gridTemplateColumns:"1.3fr .7fr", gap:12, marginTop:12}}>
          <div className="card">
            <div className="panel-title">Register payment</div>
            <form onSubmit={registerPayment}>
              <div className="grid grid-2 mt-12" style={{gap:12}}>
                <Field label="Direction">
                  <select className="input" value={paymentForm.direction} onChange={(e) => setPaymentForm((prev) => ({ ...prev, direction: e.target.value, docId: "", amount: "" }))}>
                    <option value="outgoing">Outgoing payment (to supplier)</option>
                    <option value="incoming">Incoming payment (from customer)</option>
                  </select>
                </Field>
                <Field label="Document" required>
                  <select className="input" value={paymentForm.docId} onChange={(e) => {
                    const nextId = e.target.value;
                    const selected = docsForPayment.find((doc) => doc.id === nextId);
                    setPaymentForm((prev) => ({
                      ...prev,
                      docId: nextId,
                      amount: selected ? String(selected.outstandingAmount || selected.amount || "") : "",
                      reference: selected ? `Payment for ${selected.number}` : prev.reference
                    }));
                  }}>
                    <option value="">Select document</option>
                    {docsForPayment.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.number} · {doc.counterpartyName} · open {fmtUZS(doc.outstandingAmount)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Amount" required>
                  <input className="input" value={paymentForm.amount} onChange={(e) => setPaymentForm((prev) => ({ ...prev, amount: e.target.value }))} placeholder="1000000"/>
                </Field>
                <Field label="Payment date" required>
                  <input className="input" type="date" value={paymentForm.paymentDate} onChange={(e) => setPaymentForm((prev) => ({ ...prev, paymentDate: e.target.value }))}/>
                </Field>
                <Field label="Source type">
                  <select className="input" value={paymentForm.sourceType} onChange={(e) => setPaymentForm((prev) => ({ ...prev, sourceType: e.target.value }))}>
                    <option value="bank_account">Bank account</option>
                    <option value="cashbox">Cashbox</option>
                  </select>
                </Field>
                <Field label="Bank account / cash ledger">
                  <select className="input" value={paymentForm.sourceAccountId} onChange={(e) => setPaymentForm((prev) => ({ ...prev, sourceAccountId: e.target.value }))}>
                    <option value="">Select source</option>
                    {paymentSources.map((account) => (
                      <option key={`source-${account.id}`} value={account.id}>{account.code} · {account.name}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Reference">
                  <input className="input" value={paymentForm.reference} onChange={(e) => setPaymentForm((prev) => ({ ...prev, reference: e.target.value }))} placeholder="Payment order / note"/>
                </Field>
              </div>
              <div className="row mt-12">
                <span className="sp"/>
                <Button variant="primary" type="submit" icon={<Icon.Check size={12}/>} disabled={submitting}>
                  {submitting ? "Saving..." : "Register payment"}
                </Button>
              </div>
            </form>
          </div>

          <div className="card">
            <div className="panel-title">OCR bank statement (PDF)</div>
            <div className="mt-12 col gap-10">
              <Field label="Upload PDF">
                <input className="input" type="file" accept="application/pdf" onChange={(e) => setOcrFile((e.target.files && e.target.files[0]) || null)}/>
              </Field>
              <Button variant="ghost" icon={<Icon.Search size={12}/>} onClick={analyzeBankStatement} disabled={!ocrFile}>
                Analyze statement
              </Button>
              {ocrAllocations.length > 0 && (
                <>
                  <div className="hairline" style={{padding:10, borderRadius:8}}>
                    <div className="mono muted" style={{fontSize:11, marginBottom:6}}>Prepared allocations</div>
                    <div className="col gap-6">
                      {ocrAllocations.map((allocation) => (
                        <div key={`ocr-${allocation.docId}`} className="row">
                          <span className="mono">{allocation.number}</span>
                          <span className="sp"/>
                          <span className="mono">{fmtUZS(allocation.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button variant="primary" icon={<Icon.Check size={12}/>} onClick={applyOcrAllocations} disabled={ocrApplying}>
                    {ocrApplying ? "Posting..." : "Post OCR allocations"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="card card-pad-0 mt-12">
          <div className="panel-title">
            Auto reconciliation statement
            <span className="sp"/>
            <select className="input" style={{width:260}} value={reconCounterparty} onChange={(e) => setReconCounterparty(e.target.value)}>
              <option value="">All counterparties</option>
              {counterparties.map((counterparty) => (
                <option key={`cp-${counterparty}`} value={counterparty}>{counterparty}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-3" style={{gap:12, padding:"0 12px 12px"}}>
            <Kpi label="Payables total" value={fmtUZS(totalIncoming)} unit="UZS"/>
            <Kpi label="Receivables total" value={fmtUZS(totalOutgoing)} unit="UZS"/>
            <Kpi label="Outstanding" value={fmtUZS(totalOutstanding)} unit="UZS"/>
          </div>
          <table className="tbl">
            <thead><tr><th>Type</th><th>Document</th><th>Counterparty</th><th className="tr">Total</th><th className="tr">Open</th><th>Status</th></tr></thead>
            <tbody>
              {selectedCounterpartyRows.length === 0 ? (
                <tr><td colSpan="6" className="dim mono">No reconciliation rows for selected counterparty.</td></tr>
              ) : null}
              {selectedCounterpartyRows.map((row) => {
                const status = toPaymentStatus(row);
                return (
                  <tr key={`recon-${row.direction}-${row.id}`}>
                    <td><Pill tone={row.direction === "incoming" ? "warn" : "good"}>{row.direction === "incoming" ? "payable" : "receivable"}</Pill></td>
                    <td className="id">{row.number}</td>
                    <td>{row.counterpartyName || "—"}</td>
                    <td className="num">{fmtUZS(row.amount)}</td>
                    <td className="num">{fmtUZS(row.outstandingAmount)}</td>
                    <td><Pill tone={status.tone}>{status.label}</Pill></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Placeholder>
    );
  }

  if (kind === "cash") {
    return (
      <Placeholder
        title="Cash flow"
        headerActions={<>
          <Button variant="ghost" icon={<Icon.Download size={13}/>} onClick={() => handleExport("cash")} disabled={exporting}>
            {exporting ? "Exporting..." : "Export"}
          </Button>
          <Button variant="primary" icon={<Icon.Plus size={13}/>} onClick={() => setJournalModalOpen(true)}>New</Button>
        </>}
        kpis={<>
          <Kpi label="Inflow" value={fmtUZS(Math.round(inflowTotal / 1_000_000))} unit="M UZS" delta={loading ? "Loading..." : "Live from backend"} trend="up"/>
          <Kpi label="Outflow" value={fmtUZS(Math.round(outflowTotal / 1_000_000))} unit="M UZS" delta="Live from backend" trend="down"/>
          <Kpi label="Net" value={fmtUZS(Math.round(netTotal / 1_000_000))} unit="M UZS" delta="Live from backend" trend="up"/>
          <Kpi label="Buckets" value={String(effectiveCashFlow.length)} delta="Monthly buckets" trend="up"/>
        </>}>
        {error && <Banner tone="warn" title="Live cash flow unavailable">Showing current cash flow data. {error}</Banner>}
        {actionMessage && <Banner tone="warn" title="Finance action notice">{actionMessage}</Banner>}
        <div className="card card-pad-0">
          <div className="panel-title">Monthly net cash flow · last 6 months</div>
          <div style={{padding:8}}>
            <StackedBar width={900} height={240}
              data={effectiveCashFlow.map((bucket) => [parseMoney(bucket.inflow), parseMoney(bucket.outflow)])}
              categories={effectiveCashFlow.map((bucket) => bucket.periodLabel)}
              colors={["var(--ink)","var(--ai)"]}/>
            <div className="row gap-16 mono muted" style={{fontSize:10, padding:"6px 16px"}}>
              <span><span style={{display:"inline-block", width:8, height:8, background:"var(--ink)", marginRight:6}}/>Inflow</span>
              <span><span style={{display:"inline-block", width:8, height:8, background:"var(--ai)", marginRight:6}}/>Outflow</span>
            </div>
          </div>
        </div>
        <Modal
          open={journalModalOpen}
          onClose={() => {
            if (!submitting) {
              setJournalModalOpen(false);
              setActionMessage("");
            }
          }}
          title="New manual journal"
          size="sm"
          footer={
            <>
              <Button variant="ghost" type="button" onClick={() => setJournalModalOpen(false)} disabled={submitting}>Cancel</Button>
              <span className="sp" />
              <Button variant="primary" type="submit" form="finance-manual-journal-form" icon={<Icon.Check size={13} />} disabled={submitting}>
                {submitting ? "Saving..." : "Create journal"}
              </Button>
            </>
          }
        >
          <form id="finance-manual-journal-form" onSubmit={submitManualJournal}>
            <div className="grid grid-2" style={{ gap: 12 }}>
              <Field label="Effective date" required>
                <input className="input" type="date" value={journalForm.effectiveDate} onChange={(e) => setJournalForm((prev) => ({ ...prev, effectiveDate: e.target.value }))} />
              </Field>
              <Field label="Amount" required>
                <input className="input" value={journalForm.amount} onChange={(e) => setJournalForm((prev) => ({ ...prev, amount: e.target.value }))} />
              </Field>
              <Field label="Debit account" required>
                <select className="input" value={journalForm.debitAccountId} onChange={(e) => setJournalForm((prev) => ({ ...prev, debitAccountId: e.target.value }))}>
                  <option value="">Select account</option>
                  {ledgerAccounts.map((account) => <option key={`debit-${account.id}`} value={account.id}>{account.code} · {account.name}</option>)}
                </select>
              </Field>
              <Field label="Credit account" required>
                <select className="input" value={journalForm.creditAccountId} onChange={(e) => setJournalForm((prev) => ({ ...prev, creditAccountId: e.target.value }))}>
                  <option value="">Select account</option>
                  {ledgerAccounts.map((account) => <option key={`credit-${account.id}`} value={account.id}>{account.code} · {account.name}</option>)}
                </select>
              </Field>
              <Field label="Memo">
                <input className="input" value={journalForm.memo} onChange={(e) => setJournalForm((prev) => ({ ...prev, memo: e.target.value }))} />
              </Field>
            </div>
          </form>
        </Modal>
      </Placeholder>
    );
  }

  if (kind === "invoices") {
    return (
      <Placeholder
        title="Invoices · Receivables"
        headerActions={<>
          <Button variant="ghost" icon={<Icon.Download size={13}/>} onClick={() => handleExport("invoices")} disabled={exporting}>
            {exporting ? "Exporting..." : "Export"}
          </Button>
          <Button variant="primary" icon={<Icon.Plus size={13}/>} onClick={() => setInvoiceModalOpen(true)}>New</Button>
        </>}
      >
        {error && <Banner tone="warn" title="Live invoices unavailable">Showing current invoice data. {error}</Banner>}
        {actionMessage && <Banner tone="warn" title="Finance action notice">{actionMessage}</Banner>}
        <div className="card card-pad-0">
          <div className="tbl-toolbar">
            <span className="chip" style={{background:"var(--ink)", color:"var(--surface)", borderColor:"var(--ink)"}}>All <span className="mono" style={{opacity:0.7, marginLeft:4}}>{invoiceRows.length}</span></span>
            <span className="chip">Sent <span className="mono" style={{marginLeft:4}}>{invoiceRows.filter((invoice) => invoice.uiState.label === "sent").length}</span></span>
            <span className="chip">Overdue <span className="mono" style={{marginLeft:4, color:"var(--bad)"}}>{invoiceRows.filter((invoice) => invoice.uiState.overdue).length}</span></span>
            <span className="chip">Paid <span className="mono" style={{marginLeft:4}}>{invoiceRows.filter((invoice) => invoice.uiState.paid).length}</span></span>
          </div>
          <table className="tbl">
            <thead><tr><th>Invoice</th><th>Customer</th><th>Date</th><th>Due</th><th className="tr">Amount</th><th>Status</th><th/></tr></thead>
            <tbody>{invoiceRows.map((invoice) =>
              <tr key={invoice.id}>
                <td className="id">{invoice.number}</td>
                <td style={{fontWeight:500, color:"var(--ink)"}}>{invoice.counterpartyName}</td>
                <td className="dim mono">{(invoice.issueDate || invoice.createdAt || "").slice(0, 10) || "—"}</td>
                <td className="dim mono">{(invoice.dueDate || "").slice(0, 10) || "—"}</td>
                <td className="num">{fmtUZS(parseMoney(invoice.total))}</td>
                <td><Pill tone={invoice.uiState.tone}>{invoice.uiState.label}</Pill></td>
                <td className="row-actions">{!invoice.uiState.paid && <Button size="sm" variant="ghost" onClick={() => openReminder(invoice)}>Send reminder</Button>}</td>
              </tr>)}</tbody>
          </table>
        </div>
        <Modal
          open={invoiceModalOpen}
          onClose={() => {
            if (!submitting) {
              setInvoiceModalOpen(false);
              setActionMessage("");
            }
          }}
          title="New invoice"
          size="sm"
          footer={
            <>
              <Button variant="ghost" type="button" onClick={() => setInvoiceModalOpen(false)} disabled={submitting}>Cancel</Button>
              <span className="sp" />
              <Button variant="primary" type="submit" form="finance-create-invoice-form" icon={<Icon.Check size={13} />} disabled={submitting}>
                {submitting ? "Saving..." : "Create invoice"}
              </Button>
            </>
          }
        >
          <form id="finance-create-invoice-form" onSubmit={submitInvoiceCreate}>
            <div className="grid grid-2" style={{ gap: 12 }}>
              <Field label="Customer" required>
                <input className="input" value={invoiceForm.counterpartyName} onChange={(e) => setInvoiceForm((prev) => ({ ...prev, counterpartyName: e.target.value }))} placeholder="Oriental Trade LLC" />
              </Field>
              <Field label="Due date" required>
                <input className="input" type="date" value={invoiceForm.dueDate} onChange={(e) => setInvoiceForm((prev) => ({ ...prev, dueDate: e.target.value }))} />
              </Field>
              <Field label="Description" required>
                <input className="input" value={invoiceForm.description} onChange={(e) => setInvoiceForm((prev) => ({ ...prev, description: e.target.value }))} />
              </Field>
              <Field label="Quantity" required>
                <input className="input" value={invoiceForm.quantity} onChange={(e) => setInvoiceForm((prev) => ({ ...prev, quantity: e.target.value }))} />
              </Field>
              <Field label="Unit price" required>
                <input className="input" value={invoiceForm.unitPrice} onChange={(e) => setInvoiceForm((prev) => ({ ...prev, unitPrice: e.target.value }))} />
              </Field>
            </div>
          </form>
        </Modal>
      </Placeholder>
    );
  }

  if (kind === "bills") {
    return (
      <Placeholder
        title="Bills · Payables"
        headerActions={<>
          <Button variant="ghost" icon={<Icon.Download size={13}/>} onClick={() => handleExport("bills")} disabled={exporting}>
            {exporting ? "Exporting..." : "Export"}
          </Button>
          <Button variant="primary" icon={<Icon.Plus size={13}/>} onClick={() => setBillModalOpen(true)}>New</Button>
        </>}
      >
        {error && <Banner tone="warn" title="Live bills unavailable">Showing current bill data. {error}</Banner>}
        {actionMessage && <Banner tone="warn" title="Finance action notice">{actionMessage}</Banner>}
        <div className="card card-pad-0">
          <table className="tbl">
            <thead><tr><th>Bill</th><th>Vendor</th><th>Date</th><th>Due</th><th className="tr">Amount</th><th>Status</th><th/></tr></thead>
            <tbody>{billRows.map((bill) =>
              <tr key={bill.id}>
                <td className="id">{bill.number}</td>
                <td style={{fontWeight:500, color:"var(--ink)"}}>{bill.counterpartyName}</td>
                <td className="dim mono">{(bill.issueDate || bill.createdAt || "").slice(0, 10) || "—"}</td>
                <td className="dim mono">{(bill.dueDate || "").slice(0, 10) || "—"}</td>
                <td className="num">{fmtUZS(parseMoney(bill.total))}</td>
                <td><Pill tone={bill.uiState.tone}>{bill.uiState.label}</Pill></td>
                <td className="row-actions">
                  {!bill.uiState.paid && (
                    <Button size="sm" variant="primary" onClick={() => handleMarkBillPaid(bill)} disabled={payingBillId === bill.id}>
                      {payingBillId === bill.id ? "Saving..." : "Mark paid"}
                    </Button>
                  )}
                </td>
              </tr>)}</tbody>
          </table>
        </div>
        <Modal
          open={billModalOpen}
          onClose={() => {
            if (!submitting) {
              setBillModalOpen(false);
              setActionMessage("");
            }
          }}
          title="New bill"
          size="sm"
          footer={
            <>
              <Button variant="ghost" type="button" onClick={() => setBillModalOpen(false)} disabled={submitting}>Cancel</Button>
              <span className="sp" />
              <Button variant="primary" type="submit" form="finance-create-bill-form" icon={<Icon.Check size={13} />} disabled={submitting}>
                {submitting ? "Saving..." : "Create bill"}
              </Button>
            </>
          }
        >
          <form id="finance-create-bill-form" onSubmit={submitBillCreate}>
            <div className="grid grid-2" style={{ gap: 12 }}>
              <Field label="Vendor" required>
                <input className="input" value={billForm.counterpartyName} onChange={(e) => setBillForm((prev) => ({ ...prev, counterpartyName: e.target.value }))} placeholder="Samarkand Oil Co." />
              </Field>
              <Field label="Due date" required>
                <input className="input" type="date" value={billForm.dueDate} onChange={(e) => setBillForm((prev) => ({ ...prev, dueDate: e.target.value }))} />
              </Field>
              <Field label="Description" required>
                <input className="input" value={billForm.description} onChange={(e) => setBillForm((prev) => ({ ...prev, description: e.target.value }))} />
              </Field>
              <Field label="Quantity" required>
                <input className="input" value={billForm.quantity} onChange={(e) => setBillForm((prev) => ({ ...prev, quantity: e.target.value }))} />
              </Field>
              <Field label="Unit price" required>
                <input className="input" value={billForm.unitPrice} onChange={(e) => setBillForm((prev) => ({ ...prev, unitPrice: e.target.value }))} />
              </Field>
            </div>
          </form>
        </Modal>
      </Placeholder>
    );
  }

  return (
    <Placeholder
      title="General ledger"
      headerActions={<>
        <Button variant="ghost" icon={<Icon.Download size={13}/>} onClick={() => handleExport("ledger")} disabled={exporting}>
          {exporting ? "Exporting..." : "Export"}
        </Button>
        <Button variant="primary" icon={<Icon.Plus size={13}/>} onClick={() => setJournalModalOpen(true)}>New</Button>
      </>}
    >
      {error && <Banner tone="warn" title="Live ledger unavailable">Showing current ledger data. {error}</Banner>}
      {actionMessage && <Banner tone="warn" title="Finance action notice">{actionMessage}</Banner>}
      <div className="card card-pad-0">
        <table className="tbl">
          <thead><tr><th>Code</th><th>Account</th><th className="tr">Balance</th></tr></thead>
          <tbody>
            {loading && ACCT.length === 0 ? (
              <tr><td colSpan="3" className="dim mono">Loading ledger accounts…</td></tr>
            ) : null}
            {!loading && ACCT.length === 0 ? (
              <tr><td colSpan="3" className="dim mono">No ledger accounts available.</td></tr>
            ) : null}
            {ACCT.map((a) => (
              <tr key={a.c}>
                <td className="id">{a.c}</td>
                <td style={{color:"var(--ink)"}}>{a.n}</td>
                <td className="num" style={{color: a.b < 0 ? "var(--bad)" : "var(--ink)"}}>{fmtUZS(a.b)} UZS</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card card-pad-0" style={{marginTop:12}}>
        <div className="panel-title">Recent ledger entries</div>
        <table className="tbl">
          <thead><tr><th>Account</th><th>Memo</th><th>Side</th><th className="tr">Amount</th></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="4" className="dim mono">Loading ledger entries…</td></tr>
            ) : null}
            {!loading && (!ledgerRows.slice || ledgerRows.length === 0) ? (
              <tr><td colSpan="4" className="dim mono">No ledger entries available.</td></tr>
            ) : null}
            {(ledgerRows.slice ? ledgerRows.slice(0, 8) : []).map((line) => (
              <tr key={line.id}>
                <td className="id">{line.accountCode}</td>
                <td>{line.memo || accountById.get(line.accountId)?.name || line.accountName}</td>
                <td><Pill tone={line.entrySide === "debit" ? "good" : "warn"}>{line.entrySide}</Pill></td>
                <td className="num">{fmtUZS(parseMoney(line.amount))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal
        open={journalModalOpen}
        onClose={() => {
          if (!submitting) {
            setJournalModalOpen(false);
            setActionMessage("");
          }
        }}
        title="New manual journal"
        size="sm"
        footer={
          <>
            <Button variant="ghost" type="button" onClick={() => setJournalModalOpen(false)} disabled={submitting}>Cancel</Button>
            <span className="sp" />
            <Button variant="primary" type="submit" form="finance-manual-journal-form" icon={<Icon.Check size={13} />} disabled={submitting}>
              {submitting ? "Saving..." : "Create journal"}
            </Button>
          </>
        }
      >
        <form id="finance-manual-journal-form" onSubmit={submitManualJournal}>
          <div className="grid grid-2" style={{ gap: 12 }}>
            <Field label="Effective date" required>
              <input className="input" type="date" value={journalForm.effectiveDate} onChange={(e) => setJournalForm((prev) => ({ ...prev, effectiveDate: e.target.value }))} />
            </Field>
            <Field label="Amount" required>
              <input className="input" value={journalForm.amount} onChange={(e) => setJournalForm((prev) => ({ ...prev, amount: e.target.value }))} />
            </Field>
            <Field label="Debit account" required>
              <select className="input" value={journalForm.debitAccountId} onChange={(e) => setJournalForm((prev) => ({ ...prev, debitAccountId: e.target.value }))}>
                <option value="">Select account</option>
                {ledgerAccounts.map((account) => <option key={`ledger-debit-${account.id}`} value={account.id}>{account.code} · {account.name}</option>)}
              </select>
            </Field>
            <Field label="Credit account" required>
              <select className="input" value={journalForm.creditAccountId} onChange={(e) => setJournalForm((prev) => ({ ...prev, creditAccountId: e.target.value }))}>
                <option value="">Select account</option>
                {ledgerAccounts.map((account) => <option key={`ledger-credit-${account.id}`} value={account.id}>{account.code} · {account.name}</option>)}
              </select>
            </Field>
            <Field label="Memo">
              <input className="input" value={journalForm.memo} onChange={(e) => setJournalForm((prev) => ({ ...prev, memo: e.target.value }))} />
            </Field>
          </div>
        </form>
      </Modal>
    </Placeholder>
  );
}

function ReportsPage() {
  const [overview, setOverview] = useStateS(null);
  const [loading, setLoading] = useStateS(true);
  const [error, setError] = useStateS("");
  const [exporting, setExporting] = useStateS(false);
  const [preview, setPreview] = useStateS({ open: false, title: "", csv: "" });

  const parseMoney = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const csvEscape = (value) => {
    const text = value == null ? "" : String(value);
    if (/["\n,]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
    return text;
  };

  useEffectS(() => {
    let cancelled = false;
    (async () => {
      try {
        const { response, body } = await fetchPortalJson("/api/finance/overview");
        if (cancelled) return;
        if (!response.ok || !body.data) {
          setError(body.error?.message || body.message || "Unable to load reports.");
          setOverview(null);
          return;
        }
        setOverview(body.data);
        setError("");
      } catch {
        if (!cancelled) {
          setError("Unable to load reports.");
          setOverview(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const refreshOverview = async () => {
    const { response, body } = await fetchPortalJson("/api/finance/overview");
    if (!response.ok || !body?.data) {
      setError(body?.error?.message || body?.message || "Unable to load reports.");
      return false;
    }
    setOverview(body.data);
    setError("");
    return true;
  };

  const trialBalance = overview?.trialBalance;
  const profitAndLoss = overview?.profitAndLoss;
  const balanceSheet = overview?.balanceSheet;
  const cashFlow = overview?.cashFlow || [];
  const invoices = overview?.invoices || [];
  const bills = overview?.bills || [];

  const getReportRows = (slug) => {
    if (slug === "trial-balance") {
      return [
        ["account_code", "account_name", "debit", "credit", "balance"],
        ...((trialBalance?.rows || []).map((row) => [row.accountCode, row.accountName, parseMoney(row.totalDebit), parseMoney(row.totalCredit), parseMoney(row.balance)]))
      ];
    }
    if (slug === "profit-and-loss") {
      return [
        ["section", "account_code", "account_name", "amount"],
        ...((profitAndLoss?.revenueAccounts || []).map((row) => ["revenue", row.accountCode, row.accountName, parseMoney(row.amount)])),
        ...((profitAndLoss?.expenseAccounts || []).map((row) => ["expense", row.accountCode, row.accountName, parseMoney(row.amount)])),
        ["summary", "", "net_income", parseMoney(profitAndLoss?.netIncome)]
      ];
    }
    if (slug === "balance-sheet") {
      return [
        ["section", "account_code", "account_name", "balance"],
        ...((balanceSheet?.assets || []).map((row) => ["asset", row.accountCode, row.accountName, parseMoney(row.balance)])),
        ...((balanceSheet?.liabilities || []).map((row) => ["liability", row.accountCode, row.accountName, parseMoney(row.balance)])),
        ...((balanceSheet?.equity || []).map((row) => ["equity", row.accountCode, row.accountName, parseMoney(row.balance)])),
        ["summary", "", "total_assets", parseMoney(balanceSheet?.totalAssets)],
        ["summary", "", "total_liabilities", parseMoney(balanceSheet?.totalLiabilities)],
        ["summary", "", "total_equity", parseMoney(balanceSheet?.totalEquity)]
      ];
    }
    if (slug === "cash-flow") {
      return [
        ["period", "inflow", "outflow", "net"],
        ...cashFlow.map((bucket) => [bucket.periodLabel, parseMoney(bucket.inflow), parseMoney(bucket.outflow), parseMoney(bucket.net)])
      ];
    }
    if (slug === "inventory") {
      return [
        ["type", "code", "name", "amount"],
        ...invoices.map((invoice) => ["invoice", invoice.number, invoice.counterpartyName, parseMoney(invoice.total)]),
        ...bills.map((bill) => ["bill", bill.number, bill.counterpartyName, parseMoney(bill.total)])
      ];
    }
    return [
      ["metric", "value"],
      ["trial_balance_rows", (trialBalance?.rows || []).length],
      ["invoice_count", invoices.length],
      ["bill_count", bills.length]
    ];
  };

  const rowsToCsv = (rows) => rows.map((row) => row.map(csvEscape).join(",")).join("\n");

  const downloadReport = (slug) => {
    const rows = getReportRows(slug);
    const csv = rowsToCsv(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${slug}-report.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const REPORTS = [
    { slug: "trial-balance", n: "Trial balance", d: trialBalance ? (trialBalance.isBalanced ? "Balanced" : "Unbalanced") : "Monthly trial balance", i: "Ledger" },
    { slug: "profit-and-loss", n: "Profit & Loss", d: profitAndLoss ? `Net income ${profitAndLoss.netIncome} UZS` : "Monthly P&L statement", i: "Chart" },
    { slug: "balance-sheet", n: "Balance sheet", d: balanceSheet ? `Assets ${balanceSheet.totalAssets} UZS` : "Assets, liabilities, equity", i: "Coin" },
    { slug: "cash-flow", n: "Cash flow statement", d: "Direct and indirect view", i: "Coin" },
    { slug: "inventory", n: "Inventory report", d: "Valuation, turnover, aging", i: "Box" },
    { slug: "tax-pack", n: "Tax return pack", d: "VAT, CIT · STI ready", i: "Shield" }
  ];

  return (
    <Placeholder
      title="Reports"
      headerActions={<>
        <Button variant="ghost" icon={<Icon.Download size={13}/>} onClick={() => {
          setExporting(true);
          try {
            REPORTS.forEach((report) => downloadReport(report.slug));
          } finally {
            setExporting(false);
          }
        }} disabled={exporting}>
          {exporting ? "Exporting..." : "Export"}
        </Button>
        <Button variant="primary" icon={<Icon.Plus size={13}/>} onClick={refreshOverview} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </Button>
      </>}
    >
      {error && <Banner tone="warn" title="Live reports unavailable">Showing current report data. {error}</Banner>}
      <div className="grid grid-3" style={{gap:12}}>
        {REPORTS.map((r, i) => {
          const IC = Icon[r.i];
          return (
            <div key={i} className="card" style={{padding:14}}>
              <div className="row"><IC size={16} style={{color:"var(--ai)"}}/><span className="sp"/><span className="mono muted" style={{fontSize:10}}>PDF · XLSX</span></div>
              <div style={{fontSize:14, fontWeight:500, color:"var(--ink)", marginTop:8}}>{r.n}</div>
              <div className="muted mt-4" style={{fontSize:12}}>{r.d}</div>
              <div className="row mt-12">
                <Button size="sm" variant="ghost" onClick={() => setPreview({ open: true, title: r.n, csv: rowsToCsv(getReportRows(r.slug)) })}>Preview</Button>
                <Button size="sm" variant="primary" icon={<Icon.Download size={12}/>} onClick={() => downloadReport(r.slug)}>Generate</Button>
              </div>
            </div>
          );
        })}
      </div>
      {trialBalance && (
        <div className="card card-pad-0" style={{marginTop:12}}>
          <div className="panel-title">Trial balance snapshot</div>
          <table className="tbl compact">
            <thead><tr><th>Account</th><th>Name</th><th className="tr">Balance</th></tr></thead>
            <tbody>
              {trialBalance.rows.slice(0, 8).map((row) => (
                <tr key={row.accountId}>
                  <td className="id">{row.accountCode}</td>
                  <td>{row.accountName}</td>
                  <td className="num">{fmtUZS(parseMoney(row.balance))} UZS</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {balanceSheet && (
        <div className="grid grid-3" style={{gap:12, marginTop:12}}>
          <Kpi label="Total assets" value={fmtUZS(Math.round(parseMoney(balanceSheet.totalAssets) / 1_000_000))} unit="M UZS"/>
          <Kpi label="Total liabilities" value={fmtUZS(Math.round(parseMoney(balanceSheet.totalLiabilities) / 1_000_000))} unit="M UZS"/>
          <Kpi label="Total equity" value={fmtUZS(Math.round(parseMoney(balanceSheet.totalEquity) / 1_000_000))} unit="M UZS"/>
        </div>
      )}
      <Modal
        open={preview.open}
        onClose={() => setPreview({ open: false, title: "", csv: "" })}
        title={`Preview · ${preview.title}`}
        size="md"
        footer={<Button variant="ghost" onClick={() => setPreview({ open: false, title: "", csv: "" })}>Close</Button>}
      >
        <pre style={{ maxHeight: 380, overflow: "auto", margin: 0, whiteSpace: "pre-wrap" }}>{preview.csv}</pre>
      </Modal>
    </Placeholder>
  );
}

function TeamPage() {
  const ROLE_FALLBACKS = [
    { role:"owner", label:"Руководитель (legacy)", defaultPermissionGroups:["tenant_governance","finance_operations","inventory_operations","production_operations","service_operations","audit_compliance"] },
    { role:"company_admin", label:"Администратор предприятия", defaultPermissionGroups:["tenant_governance","finance_operations","inventory_operations","production_operations","service_operations","audit_compliance"] },
    { role:"warehouse_clerk", label:"Кладовщик", defaultPermissionGroups:["inventory_operations"] },
    { role:"production_operator", label:"Оператор производства / начальник цеха", defaultPermissionGroups:["production_operations"] },
    { role:"service_staff", label:"Сотрудник сервиса", defaultPermissionGroups:["service_operations"] },
    { role:"accountant_economist", label:"Бухгалтер / экономист", defaultPermissionGroups:["finance_operations"] },
    { role:"executive", label:"Руководитель", defaultPermissionGroups:["executive_oversight","audit_compliance"] },
    { role:"auditor", label:"Аудитор / контролер", defaultPermissionGroups:["auditor_readonly"] },
    { role:"manager", label:"Менеджер (legacy)", defaultPermissionGroups:["finance_operations","inventory_operations","production_operations","service_operations"] },
    { role:"operator", label:"Оператор (legacy)", defaultPermissionGroups:["inventory_operations","production_operations","service_operations"] },
  ];
  const GROUP_FALLBACKS = [
    { key:"tenant_governance", label:"Администрирование предприятия", summary:"Сотрудники, роли, политики и настройки тенанта.", permissions:["tenant.read","tenant.manage"] },
    { key:"finance_operations", label:"Бухгалтерия и экономика", summary:"Отчеты, проводки, затраты и финансовый контроль.", permissions:["finance.read","finance.manage"] },
    { key:"inventory_operations", label:"Складские операции", summary:"Приход/расход, перемещения и инвентаризация.", permissions:["inventory.manage"] },
    { key:"production_operations", label:"Производственные операции", summary:"Заказы, этапы производства и учет брака.", permissions:["production.manage"] },
    { key:"service_operations", label:"Сервисные операции", summary:"Сервисные заказы, этапы выполнения и затраты.", permissions:["service_order.manage"] },
    { key:"executive_oversight", label:"Руководство и KPI", summary:"Управленческий контроль, дашборды и KPI.", permissions:["tenant.read","finance.read"] },
    { key:"auditor_readonly", label:"Аудиторский read-only", summary:"Только просмотр данных и журналов аудита.", permissions:["tenant.read","finance.read","audit.read"] },
    { key:"audit_compliance", label:"Аудит и контроль", summary:"Просмотр журналов и контрольных следов (read-only).", permissions:["audit.read"] },
  ];
  const AVATAR_TONES = ["warm","cool","green","plum","warm","cool","green"];
  const [workspace, setWorkspace] = React.useState({ tenant:null, actor:null, users:[], invites:[], accessCatalog:null });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [errorStatus, setErrorStatus] = React.useState(null);
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [manageOpen, setManageOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);
  const [selectedMember, setSelectedMember] = React.useState(null);
  const [inviteForm, setInviteForm] = React.useState({ name:"", email:"", role:"warehouse_clerk", permissionGroups:["inventory_operations"] });
  const [memberForm, setMemberForm] = React.useState({ role:"warehouse_clerk", permissionGroups:["inventory_operations"] });

  const roles = (workspace.accessCatalog && workspace.accessCatalog.workspaceRoles) || ROLE_FALLBACKS;
  const permissionGroups = (workspace.accessCatalog && workspace.accessCatalog.permissionGroups) || GROUP_FALLBACKS;
  const canManageTeam = Boolean(workspace.actor && Array.isArray(workspace.actor.permissions) && workspace.actor.permissions.includes("tenant.manage"));
  const activeUsers = workspace.users || [];
  const pendingInvites = (workspace.invites || []).filter((invite) => invite.status === "pending");

  const roleLabel = (role) => {
    const match = roles.find((entry) => entry.role === role);
    return match ? match.label : String(role || "").replace(/_/g, " ");
  };

  const defaultsForRole = (role) => {
    const match = roles.find((entry) => entry.role === role);
    return match && Array.isArray(match.defaultPermissionGroups) ? [...match.defaultPermissionGroups] : [];
  };

  const permissionGroupMeta = (key) => permissionGroups.find((group) => group.key === key);

  const effectivePermissions = (groups) => {
    const keys = Array.from(new Set(groups || []));
    return Array.from(new Set(keys.flatMap((key) => {
      const group = permissionGroupMeta(key);
      return group && Array.isArray(group.permissions) ? group.permissions : [];
    })));
  };

  const permissionLabel = (permission) => String(permission || "")
    .replace(/\./g, " ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

  const relativeTime = (value) => {
    if (!value) return "never";
    const diff = Date.now() - new Date(value).getTime();
    if (!Number.isFinite(diff) || diff < 60 * 1000) return "now";
    if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}m ago`;
    if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))}h ago`;
    return `${Math.floor(diff / (24 * 60 * 60 * 1000))}d ago`;
  };

  const applyWorkspacePayload = (body) => {
    setWorkspace({
      tenant: body && body.tenant ? body.tenant : null,
      actor: body && body.actor ? body.actor : null,
      users: body && Array.isArray(body.users) ? body.users : [],
      invites: body && Array.isArray(body.invites) ? body.invites : [],
      accessCatalog: body && body.accessCatalog ? body.accessCatalog : null,
    });
  };

  const loadWorkspace = async () => {
    setLoading(true);
    const result = await tenantRequest("/me", null, "GET");
    setLoading(false);
    if (!result.ok) {
      setErrorStatus(result.status);
      setError((result.body && result.body.message) || "Unable to load team workspace.");
      return;
    }
    setErrorStatus(null);
    setError("");
    applyWorkspacePayload(result.body);
  };

  React.useEffect(() => {
    loadWorkspace();
  }, []);

  const updateGroupSelection = (current, groupKey, checked) => {
    const next = new Set(current || []);
    if (checked) next.add(groupKey); else next.delete(groupKey);
    return Array.from(next);
  };

  const openInvite = () => {
    const role = "warehouse_clerk";
    setInviteForm({ name:"", email:"", role, permissionGroups: defaultsForRole(role) });
    setInviteOpen(true);
  };

  const submitInvite = async () => {
    setSaving(true);
    const result = await tenantRequest("/invites", inviteForm, "POST");
    setSaving(false);
    if (!result.ok) {
      setError((result.body && result.body.message) || "Unable to create invite.");
      return;
    }
    setError("");
    setInviteOpen(false);
    applyWorkspacePayload({ ...workspace, ...result.body, accessCatalog: workspace.accessCatalog });
  };

  const openManage = (member) => {
    setSelectedMember(member);
    setMemberForm({
      role: member.workspaceRole || "warehouse_clerk",
      permissionGroups: Array.isArray(member.permissionGroups) && member.permissionGroups.length
        ? [...member.permissionGroups]
        : defaultsForRole(member.workspaceRole || "warehouse_clerk")
    });
    setManageOpen(true);
  };

  const submitMemberUpdate = async () => {
    if (!selectedMember) return;
    setSaving(true);
    const result = await tenantRequest(`/members/${selectedMember.id}`, memberForm, "PATCH");
    setSaving(false);
    if (!result.ok) {
      setError((result.body && result.body.message) || "Unable to update team member.");
      return;
    }
    setError("");
    setManageOpen(false);
    setSelectedMember(null);
    applyWorkspacePayload({ ...workspace, ...result.body, accessCatalog: workspace.accessCatalog });
  };

  const revokeInvite = async (inviteId) => {
    setSaving(true);
    const result = await tenantRequest(`/invites/${inviteId}/revoke`, {}, "POST");
    setSaving(false);
    if (!result.ok) {
      setError((result.body && result.body.message) || "Unable to revoke invite.");
      return;
    }
    setError("");
    applyWorkspacePayload({ ...workspace, ...result.body, accessCatalog: workspace.accessCatalog });
  };

  const exportWorkspace = () => {
    setExporting(true);
    try {
      const rows = [
        ["name", "email", "role", "status", "last_active", "permission_groups"]
      ];

      activeUsers.forEach((member) => {
        rows.push([
          member.name || "",
          member.email || "",
          roleLabel(member.workspaceRole || member.role),
          "active",
          relativeTime(member.lastActiveAt),
          Array.isArray(member.permissionGroups) ? member.permissionGroups.join("|") : ""
        ]);
      });

      pendingInvites.forEach((invite) => {
        rows.push([
          invite.name || "",
          invite.email || "",
          roleLabel(invite.role),
          invite.status || "pending",
          relativeTime(invite.invitedAt),
          Array.isArray(invite.permissionGroups) ? invite.permissionGroups.join("|") : ""
        ]);
      });

      const csv = rows
        .map((row) => row.map((value) => `"${String(value || "").replace(/"/g, '""')}"`).join(","))
        .join("\r\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const slug = ((workspace.tenant && workspace.tenant.tenantSlug) || "workspace-team").replace(/[^a-z0-9-]/gi, "-").toLowerCase();
      link.href = url;
      link.download = `${slug}-team.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } finally {
      window.setTimeout(() => setExporting(false), 250);
    }
  };

  return (
    <Placeholder
      title="Team"
      headerActions={
        <>
          <Button variant="ghost" icon={<Icon.Download size={13}/>} onClick={exportWorkspace} disabled={loading || exporting || !!errorStatus}>
            {exporting ? "Exporting..." : "Export"}
          </Button>
          <Button variant="primary" icon={<Icon.UserPlus size={13}/>} onClick={openInvite} disabled={!canManageTeam}>
            Invite member
          </Button>
        </>
      }
    >
      <div className="card card-pad-0">
        <div className="tbl-toolbar">
          <span className="sp"/>
        </div>
        {error && <div className="muted" style={{fontSize:12, color:"var(--bad)", padding:"0 12px 12px"}}>{errorStatus === 403 ? "You do not have access to the Team workspace." : error}</div>}
        <table className="tbl">
          <thead><tr><th>Name</th><th>Role</th><th>Email</th><th>Last active</th><th/></tr></thead>
          <tbody>
            {loading && (
              <tr><td colSpan="5" className="dim mono">Loading team members…</td></tr>
            )}
            {!loading && errorStatus === 403 && (
              <tr><td colSpan="5" className="dim mono">Access denied.</td></tr>
            )}
            {!loading && activeUsers.map((member, index) => (
              <tr key={member.id}>
                <td>
                  <div className="row gap-8">
                    <div className={`avatar sm ${AVATAR_TONES[index % AVATAR_TONES.length]}`}>{member.name.split(" ").filter(Boolean).map((word) => word[0]).join("").slice(0, 2)}</div>
                    <span style={{color:"var(--ink)", fontWeight:500}}>{member.name}</span>
                  </div>
                </td>
                <td><Pill tone={["owner", "company_admin", "executive"].includes(member.workspaceRole || member.role) ? "solid-ink" : "info"} dot={false}>{roleLabel(member.workspaceRole || member.role)}</Pill></td>
                <td className="dim mono">{member.email || "—"}</td>
                <td className="dim mono">{relativeTime(member.lastActiveAt)}</td>
                <td className="row-actions">
                  {canManageTeam && <Button size="sm" variant="ghost" onClick={() => openManage(member)}>Manage</Button>}
                </td>
              </tr>
            ))}
            {!loading && !errorStatus && activeUsers.length === 0 && (
              <tr><td colSpan="5" className="dim mono">No team members found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {errorStatus !== 403 && pendingInvites.length > 0 && (
        <div className="card card-pad-0 mt-16">
          <div className="panel-title">Pending invites <span className="sp"/><span className="mono muted" style={{fontSize:10}}>{pendingInvites.length}</span></div>
          <table className="tbl">
            <thead><tr><th>Name</th><th>Role</th><th>Email</th><th>Invited</th><th/></tr></thead>
            <tbody>{pendingInvites.map((invite, index) => (
              <tr key={invite.id}>
                <td>
                  <div className="row gap-8">
                    <div className={`avatar sm ${AVATAR_TONES[index % AVATAR_TONES.length]}`}>{invite.name.split(" ").filter(Boolean).map((word) => word[0]).join("").slice(0, 2) || "IN"}</div>
                    <span style={{color:"var(--ink)", fontWeight:500}}>{invite.name}</span>
                  </div>
                </td>
                <td><Pill tone="warn" dot={false}>{roleLabel(invite.role)}</Pill></td>
                <td className="dim mono">{invite.email}</td>
                <td className="dim mono">{relativeTime(invite.invitedAt)}</td>
                <td className="row-actions">
                  {canManageTeam && <Button size="sm" variant="ghost" onClick={() => revokeInvite(invite.id)}>Revoke</Button>}
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Invite member"
        footer={
          <>
            <Button variant="ghost" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <span className="sp"/>
            <Button variant="primary" onClick={submitInvite} disabled={saving || !inviteForm.name || !inviteForm.email}>
              {saving ? "Sending…" : "Send invite"}
            </Button>
          </>
        }
      >
        <div className="col gap-12">
          <Field label="Full name"><input className="input" value={inviteForm.name} onChange={(e) => setInviteForm({ ...inviteForm, name:e.target.value })}/></Field>
          <Field label="Email"><input className="input mono" value={inviteForm.email} onChange={(e) => setInviteForm({ ...inviteForm, email:e.target.value })}/></Field>
          <Field label="Role">
            <select className="select" value={inviteForm.role} onChange={(e) => setInviteForm({ ...inviteForm, role:e.target.value, permissionGroups: defaultsForRole(e.target.value) })}>
              {roles.map((role) => <option key={role.role} value={role.role}>{role.label}</option>)}
            </select>
          </Field>
          <div className="label">Permission groups</div>
          <div className="col gap-8">
            {permissionGroups.map((group) => (
              <label key={group.key} className="row hairline" style={{padding:10, borderRadius:6, cursor:"pointer", alignItems:"flex-start", gap:10}}>
                <input
                  type="checkbox"
                  checked={inviteForm.permissionGroups.includes(group.key)}
                  onChange={(e) => setInviteForm({ ...inviteForm, permissionGroups: updateGroupSelection(inviteForm.permissionGroups, group.key, e.target.checked) })}
                />
                <div style={{flex:1}}>
                  <div style={{fontWeight:500, color:"var(--ink)"}}>{group.label}</div>
                  <div className="muted" style={{fontSize:11, marginTop:2}}>{group.summary}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      </Modal>

      <Drawer
        open={manageOpen}
        onClose={() => { setManageOpen(false); setSelectedMember(null); }}
        title={selectedMember ? `Manage ${selectedMember.name}` : "Manage member"}
        footer={
          <>
            <Button variant="ghost" onClick={() => { setManageOpen(false); setSelectedMember(null); }}>Cancel</Button>
            <span className="sp"/>
            <Button variant="primary" onClick={submitMemberUpdate} disabled={saving || !selectedMember}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </>
        }
      >
        {selectedMember && (
          <div className="col gap-12">
            <div className="hairline" style={{padding:10, borderRadius:6}}>
              <div style={{fontWeight:500, color:"var(--ink)"}}>{selectedMember.name}</div>
              <div className="muted mono" style={{fontSize:11, marginTop:3}}>{selectedMember.email || "No email"}</div>
            </div>
            <Field label="Role">
              <select className="select" value={memberForm.role} onChange={(e) => setMemberForm({ ...memberForm, role:e.target.value, permissionGroups: defaultsForRole(e.target.value) })}>
                {roles.map((role) => <option key={role.role} value={role.role}>{role.label}</option>)}
              </select>
            </Field>
            <div className="row">
              <div className="label">Permission groups</div>
              <span className="sp"/>
              <Button size="sm" variant="ghost" onClick={() => setMemberForm({ ...memberForm, permissionGroups: defaultsForRole(memberForm.role) })}>Reset defaults</Button>
            </div>
            <div className="col gap-8">
              {permissionGroups.map((group) => (
                <label key={group.key} className="row hairline" style={{padding:10, borderRadius:6, cursor:"pointer", alignItems:"flex-start", gap:10}}>
                  <input
                    type="checkbox"
                    checked={memberForm.permissionGroups.includes(group.key)}
                    onChange={(e) => setMemberForm({ ...memberForm, permissionGroups: updateGroupSelection(memberForm.permissionGroups, group.key, e.target.checked) })}
                  />
                  <div style={{flex:1}}>
                    <div style={{fontWeight:500, color:"var(--ink)"}}>{group.label}</div>
                    <div className="muted" style={{fontSize:11, marginTop:2}}>{group.summary}</div>
                  </div>
                </label>
              ))}
            </div>
            <div className="label">Effective permissions</div>
            <div className="row" style={{gap:6, flexWrap:"wrap"}}>
              {effectivePermissions(memberForm.permissionGroups).map((permission) => (
                <Pill key={permission} tone="info" dot={false}>{permissionLabel(permission)}</Pill>
              ))}
              {effectivePermissions(memberForm.permissionGroups).length === 0 && <span className="muted" style={{fontSize:12}}>No effective permissions selected.</span>}
            </div>
          </div>
        )}
      </Drawer>
    </Placeholder>
  );
}

function SmbSettings() {
  return (
    <Placeholder title="Settings">
      <div className="grid" style={{gridTemplateColumns:"1fr 1fr", gap:12}}>
        <div className="card"><div className="card-body">
          <h2>Company profile</h2>
          <div className="col gap-8 mt-8">
            <Field label="Company name"><input className="input" defaultValue="Kamolot Savdo LLC"/></Field>
            <Field label="TIN"><input className="input mono" defaultValue="301 452 776"/></Field>
            <Field label="Address"><input className="input" defaultValue="Mirobod district, Tashkent 100170"/></Field>
            <Field label="Phone"><input className="input mono" defaultValue="+998 71 200 44 82"/></Field>
          </div>
        </div></div>
        <div className="card"><div className="card-body">
          <h2>Bank account</h2>
          <div className="col gap-8 mt-8">
            <Field label="Primary account"><input className="input mono" defaultValue="20208 000 100 100 001 · SQB"/></Field>
            <Field label="Currency"><select className="select"><option>UZS</option><option>USD</option><option>EUR</option></select></Field>
          </div>
          <div className="divider"/>
          <h2>Locale & notifications</h2>
          <div className="col gap-8 mt-8">
            <div className="row"><span>Language</span><span className="sp"/><select className="select" style={{width:120}}><option>English</option><option>O'zbek</option><option>Русский</option></select></div>
            <div className="row"><span>Email alerts</span><span className="sp"/><Toggle on={true} onChange={()=>{}}/></div>
            <div className="row"><span>SMS alerts</span><span className="sp"/><Toggle on={false} onChange={()=>{}}/></div>
            <div className="row"><span>AI Copilot suggestions</span><span className="sp"/><Toggle on={true} onChange={()=>{}}/></div>
          </div>
        </div></div>
      </div>
    </Placeholder>
  );
}

/* -------- Production order detail, Services WO detail (simple) -------- */
function ProductionOrder({ go }) {
  return (
    <Placeholder title="Production order PO-0451">
      <div className="grid" style={{gridTemplateColumns:"2fr 1fr", gap:12}}>
        <div className="card"><div className="card-body">
          <h2>Inputs</h2>
          <table className="tbl compact"><thead><tr><th>SKU</th><th>Material</th><th className="tr">Required</th><th className="tr">Used</th></tr></thead>
            <tbody>
              <tr><td className="id">KS-0102</td><td>Cooking oil 5L bulk</td><td className="num">120</td><td className="num">118</td></tr>
              <tr><td className="id">KS-0104</td><td>Sugar refined</td><td className="num">40</td><td className="num">40</td></tr>
              <tr><td className="id">KS-0210</td><td>Rice Devzira</td><td className="num">80</td><td className="num">80</td></tr>
            </tbody>
          </table>
          <h2 className="mt-16">Output</h2>
          <div className="row hairline" style={{padding:10, borderRadius:6}}>
            <div style={{flex:1}}><div style={{fontWeight:500, color:"var(--ink)"}}>Pantry bundle · medium</div><div className="muted" style={{fontSize:11}}>Planned 60 · completed 58 · scrap 2</div></div>
            <Pill tone="good">In progress</Pill>
          </div>
        </div></div>
        <div className="card"><div className="card-body">
          <h2>Status</h2>
          <div className="col gap-8">
            <div className="row"><span className="muted">Assignee</span><span className="sp"/><div className="avatar sm green">BY</div> Bekzod Y.</div>
            <div className="row"><span className="muted">Started</span><span className="sp"/>18 Mar · 08:30</div>
            <div className="row"><span className="muted">Est. complete</span><span className="sp"/>18 Mar · 17:00</div>
          </div>
          <div className="progress mt-16"><span style={{width:"72%"}}/></div>
          <div className="muted mt-4" style={{fontSize:11}}>72% of planned output</div>
        </div></div>
      </div>
    </Placeholder>
  );
}

function ServiceOrderDetail() {
  return (
    <Placeholder title="Work order WO-1041">
      <div className="grid" style={{gridTemplateColumns:"2fr 1fr", gap:12}}>
        <div className="card"><div className="card-body">
          <h2>Oriental Trade LLC · Delivery · Tashkent</h2>
          <p className="muted">Requested 18 March · 09:14 by Malika Karimova</p>
          <div className="divider"/>
          <div className="col gap-8">
            <div className="row"><span className="muted">Destination</span><span className="sp"/>Chilonzor district, Tashkent</div>
            <div className="row"><span className="muted">Items</span><span className="sp"/>12 units · 3 SKUs</div>
            <div className="row"><span className="muted">Value</span><span className="sp"/><span className="mono">14 500 000 UZS</span></div>
          </div>
        </div></div>
        <div className="card"><div className="card-body">
          <h2>Approvals</h2>
          <div className="col gap-8">
            <div className="row"><Pill tone="good">Requested</Pill><span className="sp"/><span className="mono muted" style={{fontSize:11}}>M. Karimova</span></div>
            <div className="row"><Pill tone="warn">Awaiting approval</Pill><span className="sp"/><span className="mono muted" style={{fontSize:11}}>Owner</span></div>
          </div>
          <div className="row mt-16"><Button variant="ghost" className="block">Decline</Button><Button variant="primary" className="block">Approve</Button></div>
        </div></div>
      </div>
    </Placeholder>
  );
}

Object.assign(window, { ProductionBOMs, ProductionOrder, ServicesKanban, ServiceOrderDetail, FinancePage, ReportsPage, TeamPage, SmbSettings });
