// Bank — Credit queue (hero) and Loan Application review (centerpiece)

function CreditQueue({ go }) {
  const [sel, setSel] = useStateS(0);
  const [filter, setFilter] = useStateS("all");
  const queue = LOAN_QUEUE;
  const filterOptions = [
    { key: "all", label: "Все" },
    { key: "approve", label: "ИИ: одобрить" },
    { key: "review", label: "ИИ: на проверку" },
    { key: "decline", label: "ИИ: отклонить" }
  ];
  const aiDecisionLabel = (value) => {
    if (value === "approve") return "одобрить";
    if (value === "review") return "на проверку";
    if (value === "decline") return "отклонить";
    return value;
  };
  const translateProduct = (value) => {
    if (value === "Inventory financing") return "Финансирование запасов";
    return value;
  };
  const translateSubmitted = (value) => {
    if (typeof value !== "string") return value;
    return value.replace("Today", "Сегодня");
  };
  return (
    <div className="page page-flush">
      <div className="page-head">
        <div>
          <h1>Кредитная очередь</h1>
          <div className="sub">17 заявок · среднее время решения <span className="mono" style={{color:"var(--ai)"}}>4ч 12м</span> · SLA 24ч</div>
        </div>
        <span className="sp"/>
        <div className="chip">Состояние SLA <span style={{color:"var(--good)", marginLeft:6}}>98%</span></div>
        <Button variant="ghost" icon={<Icon.Filter size={13}/>}>Фильтр</Button>
      </div>
      <div className="split-layout" style={{gridTemplateColumns:"340px 1fr", alignItems:"start", height:"calc(100vh - 170px)", minHeight:620, overflow:"hidden"}}>
        <div className="card card-pad-0" style={{overflow:"hidden", height:"100%", display:"flex", flexDirection:"column"}}>
          <div className="tbl-toolbar" style={{gap:4}}>
            {filterOptions.map((option) => (
              <button key={option.key} className="chip" onClick={() => setFilter(option.key)}
                style={{background: filter===option.key ? "var(--ink)":undefined, color:filter===option.key?"var(--surface)":undefined, borderColor:filter===option.key?"var(--ink)":undefined}}>{option.label}</button>
            ))}
          </div>
          <div style={{flex:1, minHeight:0, overflowY:"auto"}}>
            {queue.map((q, i) => (
              <div key={q.id} onClick={() => setSel(i)}
                className="hairline-b"
                style={{padding:"12px 14px", cursor:"pointer", background: sel===i ? "var(--ai-bg)" : "transparent", borderLeft: sel===i ? "3px solid var(--ai)" : "3px solid transparent"}}>
                <div className="row">
                  <span className="mono id" style={{fontSize:10}}>{q.id}</span>
                  <span className="sp"/>
                  <Pill tone={q.aiRec==="approve"?"good":q.aiRec==="review"?"warn":"bad"} dot={false}>ИИ: {aiDecisionLabel(q.aiRec)}</Pill>
                </div>
                <div style={{fontSize:13, color:"var(--ink)", fontWeight:500, marginTop:4}}>{q.co}</div>
                <div className="muted" style={{fontSize:11, marginTop:2}}>{translateProduct(q.product)} · <span className="mono">{q.amt}</span></div>
                <div className="row mt-8">
                  <span className="mono muted" style={{fontSize:10}}>Скоринг {q.score} · {translateSubmitted(q.submitted)}</span>
                  <span className="sp"/>
                  {q.priority === "high" && <Pill tone="bad" dot={false}>Приоритет</Pill>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <LoanReview app={queue[sel]} go={go} viewportHeight="calc(100vh - 170px)"/>
      </div>
    </div>
  );
}

function LoanReview({ app, go, viewportHeight = "calc(100vh - 190px)" }) {
  const [decision, setDecision] = useStateS(null);
  const [aiAsked, setAiAsked] = useStateS(false);
  const [editingAmount, setEditingAmount] = useStateS(false);
  const [showProfit, setShowProfit] = useStateS(false);
  const [approvedAmount, setApprovedAmount] = useStateS(app.amt);

  const score = app.score || 81;
  const parseAmountM = (value) => {
    const match = String(value || "").match(/([\d.]+)/);
    return match ? Number(match[1]) : 0;
  };
  const fmtAmountM = (value) => `${Math.max(1, Math.round(value))}M UZS`;
  const parseRevenueB = (value) => {
    const match = String(value || "").match(/([\d.]+)/);
    return match ? Number(match[1]) : 0;
  };
  const toPdfLiteral = (value) => String(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  const buildSimplePdf = (lines) => {
    const content = [
      "BT",
      "/F1 11 Tf",
      "48 790 Td",
      ...lines.map((line, idx) => `${idx === 0 ? "" : "T*"}(${toPdfLiteral(line)}) Tj`),
      "ET",
      ""
    ].join("\n");

    const objects = [
      "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
      "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
      "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n",
      "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
      `5 0 obj\n<< /Length ${content.length} >>\nstream\n${content}endstream\nendobj\n`
    ];

    let pdf = "%PDF-1.4\n";
    const offsets = [0];
    objects.forEach((obj) => {
      offsets.push(pdf.length);
      pdf += obj;
    });
    const xrefPos = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n`;
    pdf += "0000000000 65535 f \n";
    offsets.slice(1).forEach((offset) => {
      pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
    });
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;
    return pdf;
  };
  const askAiAmount = () => {
    const requested = parseAmountM(app.amt);
    const ratio = score >= 85 ? 1 : score >= 75 ? 0.9 : score >= 65 ? 0.78 : 0.62;
    const suggested = fmtAmountM(requested * ratio);
    setApprovedAmount(suggested);
    setAiAsked(true);
    setEditingAmount(false);
    setDecision(null);
  };
  const approveChosenAmount = () => {
    if (!approvedAmount) return;
    setDecision("approved");
  };
  const downloadDecisionPdf = () => {
    const lines = [
      "SQB Credit Decision",
      `Application: ${app.id}`,
      `Company: ${app.co}`,
      `Requested amount: ${app.amt}`,
      `Approved amount: ${approvedAmount}`,
      `AI requested: ${aiAsked ? "yes" : "no"}`,
      `Credit score: ${score}`,
      `Product: ${app.product}`,
      `Term: ${app.term}`,
      `Generated: ${new Date().toISOString()}`
    ];
    const pdfText = buildSimplePdf(lines);
    const blob = new Blob([pdfText], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${app.id}-credit-decision.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };
  const estimatedProfitB = (parseRevenueB(app.revenueTTM) * 0.14).toFixed(2);

  useEffectS(() => {
    setDecision(null);
    setAiAsked(false);
    setEditingAmount(false);
    setShowProfit(false);
    setApprovedAmount(app.amt);
  }, [app.id, app.amt]);

  return (
    <div className="card card-pad-0" style={{height: viewportHeight, minHeight:620, overflow:"hidden", display:"flex", flexDirection:"column"}}>
      <div style={{padding:"14px 18px", borderBottom:"1px solid var(--line)", display:"flex", alignItems:"center", gap:14, flexShrink:0}}>
        <div className="avatar lg warm">{app.co.split(" ").map(w=>w[0]).slice(0,2).join("")}</div>
        <div>
          <div className="eyebrow mb-4">Заявка <span className="mono" style={{color:"var(--ink)"}}>{app.id}</span> · подана {String(app.submitted || "").replace("Today", "Сегодня")}</div>
          <div style={{fontSize:20, fontWeight:500, color:"var(--ink)"}}>{app.co}</div>
          <div className="row gap-8 mt-4 muted" style={{fontSize:12}}>
            <span>{app.product}</span><span className="sep-dot"/>
            <span className="mono">{app.amt}</span><span className="sep-dot"/>
            <span>{app.term}</span><span className="sep-dot"/>
            <span>{app.purpose}</span>
          </div>
        </div>
        <span className="sp"/>
        <Button variant="ghost" icon={<Icon.Mail size={13}/>}>Написать клиенту</Button>
        <Button variant="ghost" icon={<Icon.FileDoc size={13}/>} onClick={downloadDecisionPdf}>Скачать PDF</Button>
      </div>

      <div className="grid" style={{gridTemplateColumns:"1.4fr 1fr", gap:0, flex:1, minHeight:0, overflow:"hidden"}}>
        <div style={{padding:18, borderRight:"1px solid var(--line)", overflowY:"auto", minHeight:0}}>
          {/* AI Recommendation */}
          <div className="ai-card" style={{padding:16}}>
            <div className="row">
              <span className="ai-tag"><Icon.Sparkle size={10}/> РЕКОМЕНДАЦИЯ ИИ</span>
              <span className="sp"/>
              <span className="mono muted" style={{fontSize:10}}>МОДЕЛЬ v2.4 · {String(app.submitted || "").replace("Today", "Сегодня")}</span>
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
                  Рекомендация: <span style={{color: app.aiRec==="approve"?"var(--good)":app.aiRec==="review"?"var(--warn)":"var(--bad)", textTransform:"capitalize"}}>{app.aiRec === "approve" ? "одобрить" : app.aiRec === "review" ? "на проверку" : "отклонить"}</span>
                </div>
                <div className="muted mt-4" style={{fontSize:12, lineHeight:1.5}}>
                  {app.aiRationale}
                </div>
                <div className="row mt-8" style={{gap:8, flexWrap:"wrap"}}>
                  <Pill tone="ai" dot={false}>Уверенность 94%</Pill>
                  <Pill tone="good" dot={false}>Риск дефолта 2.1%</Pill>
                  <Pill tone="info" dot={false}>Ожидаемая доходность 16.2%</Pill>
                </div>
              </div>
            </div>
          </div>

          {/* Factors */}
          <h2 className="mt-16">Факторы влияния</h2>
          <div className="col gap-4 mt-8">
            {(app.factors || [
              {n:"Рост выручки · +38% г/г", tone:"good", w:22},
              {n:"Денежный поток · рост срока дебиторки", tone:"warn", w:18},
              {n:"Оборачиваемость запасов · 6.2x", tone:"good", w:14},
              {n:"Концентрация клиентов · 28%", tone:"warn", w:12},
              {n:"Платежи поставщикам · 0 просрочек", tone:"good", w:10},
              {n:"История операций в SQB · 2.3 года", tone:"good", w:15},
            ]).map((f,i) => (
              <div key={i} className="row hairline-b" style={{padding:"6px 0", fontSize:12.5}}>
                <Pill tone={f.tone} dot={false}>{f.tone==="good"?"+":f.tone==="warn"?"~":"−"}</Pill>
                <span style={{marginLeft:8, flex:1}}>{f.n}</span>
                <span className="mono muted" style={{fontSize:11}}>вес {f.w}%</span>
              </div>
            ))}
          </div>

          {/* Financials */}
          <h2 className="mt-16">Финансы ERP в реальном времени <AIChip label="LIVE"/></h2>
          <div className="grid grid-2 mt-8" style={{gap:10}}>
            <div className="hairline" style={{padding:12, borderRadius:6}}>
              <div className="eyebrow">Выручка · последние 6 мес</div>
              <LineChart width={260} height={70} categories={REVENUE_LABELS}
                series={[{data:REVENUE_6MO, color:"var(--ink)", dots:false, area:true}]}
                padding={[8,6,14,24]}/>
            </div>
            <div className="hairline" style={{padding:12, borderRadius:6}}>
              <div className="eyebrow">Денежный поток</div>
              <LineChart width={260} height={70} categories={REVENUE_LABELS}
                series={[{data:[48,56,62,54,68,72], color:"var(--good)", dots:false, area:true}]}
                padding={[8,6,14,24]}/>
            </div>
            <div className="hairline" style={{padding:12, borderRadius:6}}>
              <div className="eyebrow">Отраслевой риск · Оптовая торговля</div>
              <div className="num-md mt-4">Средний</div>
              <div className="muted" style={{fontSize:11}}>Тренд сектора: стабильный рост</div>
            </div>
            <div className="hairline" style={{padding:12, borderRadius:6}}>
              <div className="eyebrow">Отношения с SQB</div>
              <div className="num-md mt-4">2.3 года</div>
              <div className="muted" style={{fontSize:11}}>1 420 операций · 0 овердрафтов</div>
            </div>
          </div>
        </div>

        {/* Right — key facts + decision */}
        <div style={{padding:18, overflowY:"auto", minHeight:0}}>
          <h2>Заявитель</h2>
          <div className="col gap-8 mt-8" style={{fontSize:12.5}}>
            <div className="row"><span className="muted">Компания</span><span className="sp"/><span style={{color:"var(--ink)"}}>{app.co}</span></div>
            <div className="row"><span className="muted">TIN</span><span className="sp"/><span className="mono">{app.tin}</span></div>
            <div className="row"><span className="muted">Отрасль</span><span className="sp"/><span>{app.industry}</span></div>
            <div className="row"><span className="muted">Регион</span><span className="sp"/><span>{app.region}</span></div>
            <div className="row"><span className="muted">Сотрудники</span><span className="sp"/><span className="mono">{app.employees}</span></div>
            <div className="row"><span className="muted">Выручка TTM</span><span className="sp"/><span className="mono">{app.revenueTTM}</span></div>
          </div>

          <div className="divider"/>
          <h2>Документы <span className="mono muted" style={{fontSize:10, marginLeft:6}}>ЗАГРУЖЕНЫ АВТОМАТИЧЕСКИ</span></h2>
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
          <h2>Решение</h2>
          <div className="col gap-8 mt-8">
            <Field label="Одобренная сумма">
              <input
                className="input mono"
                value={approvedAmount}
                onChange={(e) => setApprovedAmount(e.target.value)}
                disabled={!editingAmount}
                style={{opacity: editingAmount ? 1 : 0.8}}
              />
            </Field>
            <Field label="Ставка"><input className="input mono" defaultValue="18%"/></Field>
            <Field label="Срок"><input className="input mono" defaultValue={app.term}/></Field>
            <Field label="Комментарий"><textarea className="input" rows={3} placeholder="Необязательный комментарий для клиента..."/></Field>
          </div>

          <div className="divider"/>
          <div className="col gap-8">
            <Button variant="primary" className="block" onClick={askAiAmount}>
              <Icon.Check size={13}/> Спросить у ИИ: сколько можно одобрить
            </Button>
            <Button variant="ghost" className="block" onClick={() => setEditingAmount((prev) => !prev)}>
              <Icon.Edit size={13}/> {editingAmount ? "Сохранить сумму" : "Редактировать сумму ИИ"}
            </Button>
            <Button variant="ghost" className="block" onClick={approveChosenAmount}>
              <Icon.Check size={13}/> Одобрить сумму {aiAsked ? "от ИИ" : "вручную"}
            </Button>
            <Button variant="ghost" className="block" onClick={() => setShowProfit((prev) => !prev)}>
              <Icon.FileDoc size={13}/> {showProfit ? "Скрыть прибыль компании" : "Посмотреть прибыль компании"}
            </Button>
            <Button variant="ghost" className="block" onClick={() => setDecision("declined")} style={{color:"var(--bad)"}}>
              <Icon.X size={13}/> Отклонить
            </Button>
          </div>

          {showProfit && (
            <div className="mt-12 card" style={{padding:12}}>
              <div className="row"><span className="muted">Выручка TTM</span><span className="sp"/><span className="mono">{app.revenueTTM}</span></div>
              <div className="row mt-8"><span className="muted">Оценка прибыли (14%)</span><span className="sp"/><span className="mono">{estimatedProfitB} B UZS</span></div>
              <div className="muted mt-8" style={{fontSize:11}}>Оценка рассчитана автоматически на основе TTM и используется как быстрый ориентир при кредитном решении.</div>
            </div>
          )}

          {decision && (
            <div className="mt-12 banner" style={{background: decision==="declined"?"var(--bad-bg)":"var(--good-bg)", color: decision==="declined"?"var(--bad)":"var(--good)"}}>
              <Icon.Check size={14}/>
              <div style={{flex:1}}>
                <div className="title">Решение сохранено: {decision === "approved" ? `одобрено (${approvedAmount})` : "отклонено"}</div>
                <div className="desc">Клиент уведомлён через ERP и e-mail. Автовыплата на счёт SQB запланирована в тот же день.</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { CreditQueue, LoanReview });
