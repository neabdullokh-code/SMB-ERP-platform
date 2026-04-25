// SMB — secondary screens: production, services, finance, reports, team, settings

const SMB_REST_I18N = {
  ru: {
    export: "Экспорт",
    create: "Новый",
    servicesTitle: "Сервисы · Заказы на работы",
    statuses: {
      Requested: "Запрошено",
      Approved: "Подтверждено",
      "In progress": "В работе",
      Completed: "Завершено"
    },
    taskTypes: {
      "Delivery · Tashkent": "Доставка · Ташкент",
      "Pickup": "Самовывоз",
      "Cold chain delivery": "Доставка с холодовой цепью",
      "Internal transfer": "Внутренний трансфер",
      "Inventory audit": "Инвентаризационный аудит",
      "Delivery": "Доставка"
    },
    nextStage: "Следующий этап"
  },
  en: {
    export: "Export",
    create: "New",
    servicesTitle: "Services · Work orders",
    statuses: {
      Requested: "Requested",
      Approved: "Approved",
      "In progress": "In progress",
      Completed: "Completed"
    },
    taskTypes: {
      "Delivery · Tashkent": "Delivery · Tashkent",
      "Pickup": "Pickup",
      "Cold chain delivery": "Cold chain delivery",
      "Internal transfer": "Internal transfer",
      "Inventory audit": "Inventory audit",
      "Delivery": "Delivery"
    },
    nextStage: "Next stage"
  },
  uz: {
    export: "Eksport",
    create: "Yangi",
    servicesTitle: "Xizmatlar · Ish buyurtmalari",
    statuses: {
      Requested: "Yuborilgan",
      Approved: "Tasdiqlangan",
      "In progress": "Jarayonda",
      Completed: "Yakunlangan"
    },
    taskTypes: {
      "Delivery · Tashkent": "Yetkazib berish · Toshkent",
      "Pickup": "Olib ketish",
      "Cold chain delivery": "Sovuq zanjirli yetkazib berish",
      "Internal transfer": "Ichki ko'chirish",
      "Inventory audit": "Inventarizatsiya auditi",
      "Delivery": "Yetkazib berish"
    },
    nextStage: "Keyingi bosqich"
  }
};

function getSmbRestT(lang) {
  return SMB_REST_I18N[lang] || SMB_REST_I18N.ru;
}

function Placeholder({ title, kpis, children, headerActions, lang = "ru" }) {
  const t = getSmbRestT(lang);
  return (
    <div className="page">
      <div className="page-head">
        <div><h1>{title}</h1></div>
        <span className="sp"/>
        {headerActions || (
          <>
            <Button variant="ghost" icon={<Icon.Download size={13}/>}>{t.export}</Button>
            <Button variant="primary" icon={<Icon.Plus size={13}/>}>{t.create}</Button>
          </>
        )}
      </div>
      {kpis && <div className="grid grid-4 mb-16">{kpis}</div>}
      {children}
      <AskCopilotFAB lang={lang}/>
    </div>
  );
}

const PRODUCTION_BOMS_I18N = {
  ru: {
    title: "Производство · Спецификации",
    export: "Экспорт",
    create: "Новый",
    activeBoms: "Активные спецификации",
    outputToday: "Выпуск за сегодня",
    units: "ед.",
    scrapRate: "Процент брака",
    materialCost: "Стоимость материалов",
    searchBoms: "Поиск спецификаций",
    filter: "Фильтр",
    code: "Код",
    recipe: "Рецептура",
    output: "Выпуск",
    unitCost: "Себестоимость",
    status: "Статус",
    active: "Активна",
    paused: "Пауза"
  },
  en: {
    title: "Production · Bills of materials",
    export: "Export",
    create: "New",
    activeBoms: "Active BOMs",
    outputToday: "Output today",
    units: "units",
    scrapRate: "Scrap rate",
    materialCost: "Material cost",
    searchBoms: "Search BOMs",
    filter: "Filter",
    code: "Code",
    recipe: "Recipe",
    output: "Output",
    unitCost: "Unit cost",
    status: "Status",
    active: "Active",
    paused: "Paused"
  },
  uz: {
    title: "Ishlab chiqarish · Spetsifikatsiyalar",
    export: "Eksport",
    create: "Yangi",
    activeBoms: "Faol spetsifikatsiyalar",
    outputToday: "Bugungi ishlab chiqarish",
    units: "dona",
    scrapRate: "Brak darajasi",
    materialCost: "Materiallar tannarxi",
    searchBoms: "Spetsifikatsiyalarni qidirish",
    filter: "Filtr",
    code: "Kod",
    recipe: "Retsept",
    output: "Ishlab chiqarish",
    unitCost: "Birlik tannarxi",
    status: "Holat",
    active: "Faol",
    paused: "To'xtatilgan"
  }
};

function ProductionBOMs({ lang = "ru" }) {
  const t = PRODUCTION_BOMS_I18N[lang] || PRODUCTION_BOMS_I18N.ru;
  const BOMs = [
    { id:"BOM-01", n:"Sunflower oil 5L (repack)",   o:"120/day", c:"42 500 UZS", s:"Active" },
    { id:"BOM-02", n:"Mixed pantry bundle",          o:"60/day",  c:"86 200 UZS", s:"Active" },
    { id:"BOM-03", n:"Rice 5kg from bulk Devzira",   o:"200/day", c:"58 000 UZS", s:"Active" },
    { id:"BOM-04", n:"Snack mixed box, 12 items",    o:"25/day",  c:"124 000 UZS", s:"Paused" },
  ];
  return (
    <Placeholder
      title={t.title}
      lang={lang}
      headerActions={
        <>
          <Button variant="ghost" icon={<Icon.Download size={13}/>}>{t.export}</Button>
          <Button variant="primary" icon={<Icon.Plus size={13}/>}>{t.create}</Button>
        </>
      }
      kpis={<>
        <Kpi label={t.activeBoms} value="14"/>
        <Kpi label={t.outputToday} value="412" unit={t.units}/>
        <Kpi label={t.scrapRate} value="1.8%" delta="−0.3" trend="up"/>
        <Kpi label={t.materialCost} value="38.2" unit="M UZS"/>
      </>}>
      <div className="card card-pad-0">
        <div className="tbl-toolbar">
          <div className="input-wrap" style={{width:240}}><span className="prefix"><Icon.Search size={13}/></span><input className="input with-prefix" placeholder={t.searchBoms}/></div>
          <span className="sp"/>
          <Button size="sm" variant="ghost" icon={<Icon.Filter size={12}/>}>{t.filter}</Button>
        </div>
        <table className="tbl">
          <thead><tr><th>{t.code}</th><th>{t.recipe}</th><th>{t.output}</th><th>{t.unitCost}</th><th>{t.status}</th><th/></tr></thead>
          <tbody>{BOMs.map(b =>
            <tr key={b.id}>
              <td className="id">{b.id}</td>
              <td style={{color:"var(--ink)", fontWeight:500}}>{b.n}</td>
              <td className="mono">{b.o}</td>
              <td className="num">{b.c}</td>
              <td><Pill tone={b.s==="Active"?"good":"warn"}>{b.s === "Active" ? t.active : t.paused}</Pill></td>
              <td className="row-actions"><Icon.ChevRight size={13} className="muted"/></td>
            </tr>)}</tbody>
        </table>
      </div>
    </Placeholder>
  );
}

function ServicesKanban({ lang = "ru" }) {
  const t = getSmbRestT(lang);
  const cols = [
    { n:"Requested",    tone:"info",  items:[{c:"Oriental Trade",   t:"Delivery · Tashkent", a:"JA"},{c:"Retail Centre", t:"Pickup", a:"BY"}]},
    { n:"Approved",     tone:"warn",  items:[{c:"Zamon Foods",      t:"Cold chain delivery", a:"MK"}]},
    { n:"In progress",  tone:"ai",    items:[{c:"Kamolot branch #2",t:"Internal transfer", a:"BY"},{c:"Nur Auto Parts", t:"Inventory audit", a:"JA"}]},
    { n:"Completed",    tone:"good",  items:[{c:"Chorsu Market",    t:"Delivery", a:"BY"},{c:"Ferghana Agro",   t:"Pickup", a:"MK"}]},
  ];
  return (
    <Placeholder title={t.servicesTitle} lang={lang}>
      <div className="grid grid-4" style={{gap:12}}>
        {cols.map((col, i) => (
          <div key={i} className="card card-pad-0">
            <div className="panel-title"><Pill tone={col.tone} dot={false}>{t.statuses[col.n] || col.n}</Pill><span className="sp"/><span className="mono muted" style={{fontSize:11}}>{col.items.length}</span></div>
            <div style={{padding:8}}>
              {col.items.map((w, j) => (
                <div key={j} className="hairline" style={{padding:10, borderRadius:6, marginBottom:8}}>
                  <div style={{fontSize:12.5, color:"var(--ink)", fontWeight:500}}>{w.c}</div>
                  <div className="muted" style={{fontSize:11, marginTop:2}}>{t.taskTypes[w.t] || w.t}</div>
                  <div className="row mt-8">
                    <div className="avatar sm green">{w.a}</div>
                    <span className="sp"/>
                    <span className="mono muted" style={{fontSize:10}}>WO-{1000 + i*10 + j}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Placeholder>
  );
}

const FINANCE_PAGE_I18N = {
  ru: {
    titles: {
      ledger: "Главная книга",
      invoices: "Счета к получению",
      bills: "Счета к оплате",
      cash: "Денежный поток"
    },
    cash: {
      inflowMarch: "Приток · Март",
      outflowMarch: "Отток · Март",
      net: "Итог",
      healthy: "Хорошая динамика",
      daysCashOnHand: "Дней денежного запаса",
      target45: "Цель: 45",
      monthlyNetCashFlow: "Чистый денежный поток по месяцам · последние 6 месяцев",
      inflow: "Приток",
      outflow: "Отток"
    },
    invoices: {
      all: "Все",
      sent: "Отправлено",
      overdue: "Просрочено",
      paid: "Оплачено",
      newInvoice: "Новый счет",
      invoice: "Счет",
      customer: "Клиент",
      date: "Дата",
      due: "Срок",
      amount: "Сумма",
      status: "Статус",
      sendReminder: "Отправить напоминание"
    },
    bills: {
      bill: "Счет",
      vendor: "Поставщик",
      date: "Дата",
      due: "Срок",
      amount: "Сумма",
      status: "Статус",
      markPaid: "Отметить как оплаченный"
    },
    ledger: {
      code: "Код",
      account: "Счет",
      balance: "Остаток",
      accounts: {
        cashSqbCurrent: "Денежные средства · текущий счет SQB",
        accountsReceivable: "Дебиторская задолженность",
        inventory: "Запасы",
        accountsPayable: "Кредиторская задолженность",
        vatPayable: "НДС к уплате",
        retainedEarnings: "Нераспределенная прибыль",
        salesRevenue: "Выручка от продаж",
        costOfGoodsSold: "Себестоимость продаж"
      }
    },
    statuses: {
      paid: "Оплачено",
      sent: "Отправлено",
      overdue: "Просрочено",
      due: "К оплате"
    }
  },
  en: {
    titles: {
      ledger: "General ledger",
      invoices: "Invoices · Receivables",
      bills: "Bills · Payables",
      cash: "Cash flow"
    },
    cash: {
      inflowMarch: "Inflow · March",
      outflowMarch: "Outflow · March",
      net: "Net",
      healthy: "Healthy",
      daysCashOnHand: "Days cash on hand",
      target45: "Target: 45",
      monthlyNetCashFlow: "Monthly net cash flow · last 6 months",
      inflow: "Inflow",
      outflow: "Outflow"
    },
    invoices: {
      all: "All",
      sent: "Sent",
      overdue: "Overdue",
      paid: "Paid",
      newInvoice: "New invoice",
      invoice: "Invoice",
      customer: "Customer",
      date: "Date",
      due: "Due",
      amount: "Amount",
      status: "Status",
      sendReminder: "Send reminder"
    },
    bills: {
      bill: "Bill",
      vendor: "Vendor",
      date: "Date",
      due: "Due",
      amount: "Amount",
      status: "Status",
      markPaid: "Mark paid"
    },
    ledger: {
      code: "Code",
      account: "Account",
      balance: "Balance",
      accounts: {
        cashSqbCurrent: "Cash · SQB current",
        accountsReceivable: "Accounts receivable",
        inventory: "Inventory",
        accountsPayable: "Accounts payable",
        vatPayable: "VAT payable",
        retainedEarnings: "Retained earnings",
        salesRevenue: "Sales revenue",
        costOfGoodsSold: "Cost of goods sold"
      }
    },
    statuses: {
      paid: "Paid",
      sent: "Sent",
      overdue: "Overdue",
      due: "Due"
    }
  },
  uz: {
    titles: {
      ledger: "Bosh daftar",
      invoices: "Hisob-fakturalar · Debitorlar",
      bills: "To'lovlar · Kreditorlar",
      cash: "Pul oqimi"
    },
    cash: {
      inflowMarch: "Tushum · Mart",
      outflowMarch: "Chiqim · Mart",
      net: "Sof natija",
      healthy: "Ijobiy holat",
      daysCashOnHand: "Naqd zaxira kunlari",
      target45: "Maqsad: 45",
      monthlyNetCashFlow: "Oylik sof pul oqimi · oxirgi 6 oy",
      inflow: "Tushum",
      outflow: "Chiqim"
    },
    invoices: {
      all: "Barchasi",
      sent: "Yuborilgan",
      overdue: "Muddati o'tgan",
      paid: "To'langan",
      newInvoice: "Yangi hisob-faktura",
      invoice: "Hisob-faktura",
      customer: "Mijoz",
      date: "Sana",
      due: "Muddat",
      amount: "Summa",
      status: "Holat",
      sendReminder: "Eslatma yuborish"
    },
    bills: {
      bill: "To'lov hujjati",
      vendor: "Yetkazib beruvchi",
      date: "Sana",
      due: "Muddat",
      amount: "Summa",
      status: "Holat",
      markPaid: "To'langan deb belgilash"
    },
    ledger: {
      code: "Kod",
      account: "Hisob",
      balance: "Qoldiq",
      accounts: {
        cashSqbCurrent: "Naqd pul · SQB joriy hisob",
        accountsReceivable: "Debitor qarz",
        inventory: "Inventar",
        accountsPayable: "Kreditor qarz",
        vatPayable: "To'lanadigan QQS",
        retainedEarnings: "Taqsimlanmagan foyda",
        salesRevenue: "Savdo tushumi",
        costOfGoodsSold: "Sotilgan mahsulot tannarxi"
      }
    },
    statuses: {
      paid: "To'langan",
      sent: "Yuborilgan",
      overdue: "Muddati o'tgan",
      due: "To'lov muddati"
    }
  }
};

function FinancePage({ kind, lang = "ru" }) {
  const t = FINANCE_PAGE_I18N[lang] || FINANCE_PAGE_I18N.ru;
  const titles = t.titles;

  if (kind === "cash") {
    return (
      <Placeholder title={titles.cash} lang={lang}
        kpis={<>
          <Kpi label={t.cash.inflowMarch} value="312" unit="M UZS" delta="+18%" trend="up"/>
          <Kpi label={t.cash.outflowMarch} value="248" unit="M UZS" delta="+9%" trend="down"/>
          <Kpi label={t.cash.net} value="+64" unit="M UZS" delta={t.cash.healthy} trend="up"/>
          <Kpi label={t.cash.daysCashOnHand} value="38" delta={t.cash.target45} trend="down"/>
        </>}>
        <div className="card card-pad-0">
          <div className="panel-title">{t.cash.monthlyNetCashFlow}</div>
          <div style={{padding:8}}>
            <StackedBar width={900} height={240}
              data={[[155,120],[180,140],[199,170],[172,185],[220,190],[248,212]]}
              categories={REVENUE_LABELS}
              colors={["var(--ink)","var(--ai)"]}/>
            <div className="row gap-16 mono muted" style={{fontSize:10, padding:"6px 16px"}}>
              <span><span style={{display:"inline-block", width:8, height:8, background:"var(--ink)", marginRight:6}}/>{t.cash.inflow}</span>
              <span><span style={{display:"inline-block", width:8, height:8, background:"var(--ai)", marginRight:6}}/>{t.cash.outflow}</span>
            </div>
          </div>
        </div>
      </Placeholder>
    );
  }
  if (kind === "invoices") {
    const INVS = [
      { id:"INV-1482", c:"Oriental Trade LLC", d:"12 Mar", due:"26 Mar", amt:14_500_000, s:"Paid"},
      { id:"INV-1481", c:"Zamon Foods",        d:"11 Mar", due:"25 Mar", amt:28_200_000, s:"Sent"},
      { id:"INV-1480", c:"Retail Centre",      d:"09 Mar", due:"23 Mar", amt:8_400_000,  s:"Overdue"},
      { id:"INV-1479", c:"Chorsu Market Co.",  d:"08 Mar", due:"22 Mar", amt:18_100_000, s:"Sent"},
      { id:"INV-1478", c:"Nur Auto Parts",     d:"06 Mar", due:"20 Mar", amt:6_240_000,  s:"Paid"},
      { id:"INV-1477", c:"Ferghana Agro",      d:"04 Mar", due:"18 Mar", amt:32_500_000, s:"Overdue"},
    ];
    return (
      <Placeholder title={titles.invoices} lang={lang}>
        <div className="card card-pad-0">
          <div className="tbl-toolbar">
            <span className="chip" style={{background:"var(--ink)", color:"var(--surface)", borderColor:"var(--ink)"}}>{t.invoices.all} <span className="mono" style={{opacity:0.7, marginLeft:4}}>24</span></span>
            <span className="chip">{t.invoices.sent} <span className="mono" style={{marginLeft:4}}>12</span></span>
            <span className="chip">{t.invoices.overdue} <span className="mono" style={{marginLeft:4, color:"var(--bad)"}}>3</span></span>
            <span className="chip">{t.invoices.paid} <span className="mono" style={{marginLeft:4}}>9</span></span>
            <span className="sp"/>
            <Button size="sm" variant="primary" icon={<Icon.Plus size={12}/>}>{t.invoices.newInvoice}</Button>
          </div>
          <table className="tbl">
            <thead><tr><th>{t.invoices.invoice}</th><th>{t.invoices.customer}</th><th>{t.invoices.date}</th><th>{t.invoices.due}</th><th className="tr">{t.invoices.amount}</th><th>{t.invoices.status}</th><th/></tr></thead>
            <tbody>{INVS.map(i =>
              <tr key={i.id}>
                <td className="id">{i.id}</td>
                <td style={{fontWeight:500, color:"var(--ink)"}}>{i.c}</td>
                <td className="dim mono">{i.d}</td>
                <td className="dim mono">{i.due}</td>
                <td className="num">{fmtUZS(i.amt)}</td>
                <td><Pill tone={i.s==="Paid"?"good":i.s==="Overdue"?"bad":"info"}>{i.s === "Paid" ? t.statuses.paid : i.s === "Overdue" ? t.statuses.overdue : t.statuses.sent}</Pill></td>
                <td className="row-actions">{i.s !== "Paid" && <Button size="sm" variant="ghost">{t.invoices.sendReminder}</Button>}</td>
              </tr>)}</tbody>
          </table>
        </div>
      </Placeholder>
    );
  }
  if (kind === "bills") {
    const BILLS = [
      { id:"BILL-0451", v:"Samarkand Oil Co.",  d:"18 Mar", due:"01 Apr", amt:45_700_000, s:"Due"},
      { id:"BILL-0449", v:"Makfa Distribution", d:"12 Mar", due:"26 Mar", amt:18_200_000, s:"Due"},
      { id:"BILL-0448", v:"Akbar Tea Imports",  d:"08 Mar", due:"22 Mar", amt:12_400_000, s:"Paid"},
      { id:"BILL-0445", v:"Samarkand Oil Co.",  d:"03 Mar", due:"17 Mar", amt:42_000_000, s:"Paid"},
    ];
    return (
      <Placeholder title={titles.bills} lang={lang}>
        <div className="card card-pad-0">
          <table className="tbl">
            <thead><tr><th>{t.bills.bill}</th><th>{t.bills.vendor}</th><th>{t.bills.date}</th><th>{t.bills.due}</th><th className="tr">{t.bills.amount}</th><th>{t.bills.status}</th><th/></tr></thead>
            <tbody>{BILLS.map(i =>
              <tr key={i.id}>
                <td className="id">{i.id}</td>
                <td style={{fontWeight:500, color:"var(--ink)"}}>{i.v}</td>
                <td className="dim mono">{i.d}</td>
                <td className="dim mono">{i.due}</td>
                <td className="num">{fmtUZS(i.amt)}</td>
                <td><Pill tone={i.s==="Paid"?"good":"warn"}>{i.s === "Paid" ? t.statuses.paid : t.statuses.due}</Pill></td>
                <td className="row-actions">{i.s !== "Paid" && <Button size="sm" variant="primary">{t.bills.markPaid}</Button>}</td>
              </tr>)}</tbody>
          </table>
        </div>
      </Placeholder>
    );
  }
  // ledger
  const ACCT = [
    { c:"1001", n:t.ledger.accounts.cashSqbCurrent, b:64_200_000 },
    { c:"1100", n:t.ledger.accounts.accountsReceivable, b:86_400_000 },
    { c:"1200", n:t.ledger.accounts.inventory, b:412_700_000 },
    { c:"2001", n:t.ledger.accounts.accountsPayable, b:-78_200_000 },
    { c:"2100", n:t.ledger.accounts.vatPayable, b:-14_200_000 },
    { c:"3001", n:t.ledger.accounts.retainedEarnings, b:-402_800_000 },
    { c:"4000", n:t.ledger.accounts.salesRevenue, b:-278_400_000 },
    { c:"5000", n:t.ledger.accounts.costOfGoodsSold, b:192_100_000 },
  ];
  return (
    <Placeholder title={titles.ledger} lang={lang}>
      <div className="card card-pad-0">
        <table className="tbl">
          <thead><tr><th>{t.ledger.code}</th><th>{t.ledger.account}</th><th className="tr">{t.ledger.balance}</th></tr></thead>
          <tbody>{ACCT.map(a =>
            <tr key={a.c}>
              <td className="id">{a.c}</td>
              <td style={{color:"var(--ink)"}}>{a.n}</td>
              <td className="num" style={{color: a.b < 0 ? "var(--bad)" : "var(--ink)"}}>{fmtUZS(a.b)} UZS</td>
            </tr>)}</tbody>
        </table>
      </div>
    </Placeholder>
  );
}

const REPORTS_PAGE_I18N = {
  ru: {
    title: "Отчеты",
    format: "PDF · XLSX",
    preview: "Предпросмотр",
    generate: "Сформировать",
    cards: [
      { n:"Прибыли и убытки", d:"Ежемесячный отчет P&L", i:"Chart" },
      { n:"Баланс", d:"Активы, обязательства, капитал", i:"Ledger" },
      { n:"Отчет о движении денежных средств", d:"Прямой и косвенный методы", i:"Coin" },
      { n:"Отчет по запасам", d:"Оценка, оборачиваемость, aging", i:"Box" },
      { n:"Пакет налоговой отчетности", d:"НДС, налог на прибыль · готово для ГНК", i:"Shield" },
      { n:"Сводка по зарплате", d:"Ежемесячный реестр начислений", i:"Users" },
    ]
  },
  en: {
    title: "Reports",
    format: "PDF · XLSX",
    preview: "Preview",
    generate: "Generate",
    cards: [
      { n:"Profit & Loss", d:"Monthly P&L statement", i:"Chart" },
      { n:"Balance sheet", d:"Assets, liabilities, equity", i:"Ledger" },
      { n:"Cash flow statement", d:"Direct and indirect view", i:"Coin" },
      { n:"Inventory report", d:"Valuation, turnover, aging", i:"Box" },
      { n:"Tax return pack", d:"VAT, CIT · STI ready", i:"Shield" },
      { n:"Payroll summary", d:"Monthly payroll register", i:"Users" },
    ]
  },
  uz: {
    title: "Hisobotlar",
    format: "PDF · XLSX",
    preview: "Ko'rib chiqish",
    generate: "Yaratish",
    cards: [
      { n:"Foyda va zarar", d:"Oylik P&L hisobot", i:"Chart" },
      { n:"Balans", d:"Aktivlar, majburiyatlar, kapital", i:"Ledger" },
      { n:"Pul oqimi hisobotı", d:"To'g'ridan-to'g'ri va bilvosita ko'rinish", i:"Coin" },
      { n:"Inventar hisobotı", d:"Baholash, aylanish, eskirish", i:"Box" },
      { n:"Soliq hisobotlari to'plami", d:"QQS, foyda solig'i · DSQ uchun tayyor", i:"Shield" },
      { n:"Ish haqi xulosasi", d:"Oylik ish haqi reyestri", i:"Users" },
    ]
  }
};

function ReportsPage({ lang = "ru" }) {
  const t = REPORTS_PAGE_I18N[lang] || REPORTS_PAGE_I18N.ru;
  const reports = t.cards;
  return (
    <Placeholder title={t.title} lang={lang}>
      <div className="grid grid-3" style={{gap:12}}>
        {reports.map((r, i) => {
          const IC = Icon[r.i];
          return (
            <div key={i} className="card" style={{padding:14}}>
              <div className="row"><IC size={16} style={{color:"var(--ai)"}}/><span className="sp"/><span className="mono muted" style={{fontSize:10}}>{t.format}</span></div>
              <div style={{fontSize:14, fontWeight:500, color:"var(--ink)", marginTop:8}}>{r.n}</div>
              <div className="muted mt-4" style={{fontSize:12}}>{r.d}</div>
              <div className="row mt-12"><Button size="sm" variant="ghost">{t.preview}</Button><Button size="sm" variant="primary" icon={<Icon.Download size={12}/>}>{t.generate}</Button></div>
            </div>
          );
        })}
      </div>
    </Placeholder>
  );
}
function TeamPage({ lang = "ru" }) {
  const TEAM_PAGE_I18N = {
    ru: {
      title: "Команда", export: "Экспорт", exporting: "Экспорт...", invite: "Пригласить участника",
      name: "Имя", role: "Роль", email: "Email", lastActive: "Последняя активность", manage: "Управлять",
      noAccess: "У вас нет доступа к пространству Команда.", loading: "Загрузка участников...", accessDenied: "Доступ запрещен.", noMembers: "Участники не найдены.", revoke: "Отозвать", pendingInvites: "Ожидающие приглашения", invited: "Приглашен", inviteTitle: "Пригласить участника", cancel: "Отмена", sending: "Отправка...", sendInvite: "Отправить приглашение", fullName: "Полное имя", permissionGroups: "Группы разрешений", manageMember: "Управление участником", saving: "Сохранение...", saveChanges: "Сохранить изменения", noEmail: "Нет email", resetDefaults: "Сбросить по умолчанию", effectivePermissions: "Эффективные разрешения", noEffectivePermissions: "Эффективные разрешения не выбраны.",
      never: "никогда", now: "сейчас", mAgo: "мин назад", hAgo: "ч назад", dAgo: "д назад",
      roleNames: { owner: "Владелец", company_admin: "Администратор компании", manager: "Менеджер", operator: "Оператор" },
      groupNames: { tenant_governance: "Управление тенантом", finance_operations: "Финансовые операции", inventory_operations: "Складские операции", production_operations: "Производственные операции", service_operations: "Сервисные операции", audit_compliance: "Аудит и комплаенс" },
      groupSummaries: { tenant_governance: "Владение рабочим пространством, настройки организации и административная политика.", finance_operations: "Главная книга, счета, расходы и денежные процессы.", inventory_operations: "Движение запасов и складские операции.", production_operations: "Производство и исполнение спецификаций BOM.", service_operations: "Управление сервисными заказами и workflow.", audit_compliance: "Аудиторские подтверждения и контроль соответствия." },
    },
    en: {
      title: "Team", export: "Export", exporting: "Exporting...", invite: "Invite member",
      name: "Name", role: "Role", email: "Email", lastActive: "Last active", manage: "Manage",
      noAccess: "You do not have access to the Team workspace.", loading: "Loading team members...", accessDenied: "Access denied.", noMembers: "No team members found.", revoke: "Revoke", pendingInvites: "Pending invites", invited: "Invited", inviteTitle: "Invite member", cancel: "Cancel", sending: "Sending...", sendInvite: "Send invite", fullName: "Full name", permissionGroups: "Permission groups", manageMember: "Manage member", saving: "Saving...", saveChanges: "Save changes", noEmail: "No email", resetDefaults: "Reset defaults", effectivePermissions: "Effective permissions", noEffectivePermissions: "No effective permissions selected.",
      never: "never", now: "now", mAgo: "m ago", hAgo: "h ago", dAgo: "d ago",
      roleNames: { owner: "Owner", company_admin: "Company admin", manager: "Manager", operator: "Operator" },
      groupNames: { tenant_governance: "Tenant governance", finance_operations: "Finance operations", inventory_operations: "Inventory operations", production_operations: "Production operations", service_operations: "Service operations", audit_compliance: "Audit and compliance" },
      groupSummaries: { tenant_governance: "Workspace ownership, organization settings, and administrative policy.", finance_operations: "Ledger, invoices, bills, and money workflows.", inventory_operations: "Stock movement and warehouse operations.", production_operations: "Manufacturing and BOM execution.", service_operations: "Service orders and workflow execution.", audit_compliance: "Audit evidence and compliance review." },
    },
    uz: {
      title: "Jamoa", export: "Eksport", exporting: "Eksport qilinmoqda...", invite: "A'zoni taklif qilish",
      name: "Ism", role: "Lavozim", email: "Email", lastActive: "Oxirgi faollik", manage: "Boshqarish",
      noAccess: "Sizda Jamoa sahifasiga kirish huquqi yo'q.", loading: "Jamoa a'zolari yuklanmoqda...", accessDenied: "Kirish taqiqlangan.", noMembers: "Jamoa a'zolari topilmadi.", revoke: "Bekor qilish", pendingInvites: "Kutilayotgan takliflar", invited: "Taklif yuborilgan", inviteTitle: "A'zoni taklif qilish", cancel: "Bekor qilish", sending: "Yuborilmoqda...", sendInvite: "Taklif yuborish", fullName: "To'liq ism", permissionGroups: "Ruxsat guruhlari", manageMember: "A'zoni boshqarish", saving: "Saqlanmoqda...", saveChanges: "O'zgarishlarni saqlash", noEmail: "Email yo'q", resetDefaults: "Standartga qaytarish", effectivePermissions: "Amaldagi ruxsatlar", noEffectivePermissions: "Amaldagi ruxsatlar tanlanmagan.",
      never: "hech qachon", now: "hozir", mAgo: "daq oldin", hAgo: "soat oldin", dAgo: "kun oldin",
      roleNames: { owner: "Ega", company_admin: "Kompaniya administratori", manager: "Menejer", operator: "Operator" },
      groupNames: { tenant_governance: "Tenant boshqaruvi", finance_operations: "Moliya operatsiyalari", inventory_operations: "Ombor operatsiyalari", production_operations: "Ishlab chiqarish operatsiyalari", service_operations: "Servis operatsiyalari", audit_compliance: "Audit va muvofiqlik" },
      groupSummaries: { tenant_governance: "Ish maydoni egaligi, tashkilot sozlamalari va ma'muriy siyosat.", finance_operations: "Bosh daftar, hisob-fakturalar, xarajatlar va pul oqimi jarayonlari.", inventory_operations: "Zaxira harakati va ombor amaliyotlari.", production_operations: "Ishlab chiqarish va BOM bajarilishi.", service_operations: "Servis buyurtmalari va workflow jarayonlari.", audit_compliance: "Audit dalillari va muvofiqlik nazorati." },
    },
  };
  const t = TEAM_PAGE_I18N[lang] || TEAM_PAGE_I18N.ru;
  const ROLE_FALLBACKS = [
    { role:"owner", label:"Owner", defaultPermissionGroups:["tenant_governance","finance_operations","inventory_operations","production_operations","service_operations","audit_compliance"] },
    { role:"company_admin", label:"Company admin", defaultPermissionGroups:["tenant_governance","finance_operations","inventory_operations","production_operations","service_operations","audit_compliance"] },
    { role:"manager", label:"Manager", defaultPermissionGroups:["finance_operations","inventory_operations","production_operations","service_operations"] },
    { role:"operator", label:"Operator", defaultPermissionGroups:["inventory_operations","production_operations","service_operations"] },
  ];
  const GROUP_FALLBACKS = [
    { key:"tenant_governance", label:"Tenant governance", summary:"Workspace ownership, settings, and access policy.", permissions:["tenant.read","tenant.manage"] },
    { key:"finance_operations", label:"Finance operations", summary:"Ledger, invoices, bills, and money workflows.", permissions:["finance.read","finance.manage"] },
    { key:"inventory_operations", label:"Inventory operations", summary:"Stock movement and warehouse work.", permissions:["inventory.manage"] },
    { key:"production_operations", label:"Production operations", summary:"Manufacturing and BOM execution.", permissions:["production.manage"] },
    { key:"service_operations", label:"Service operations", summary:"Service order and workflow execution.", permissions:["service_order.manage"] },
    { key:"audit_compliance", label:"Audit and compliance", summary:"Audit evidence and compliance review.", permissions:["audit.read"] },
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
  const [inviteForm, setInviteForm] = React.useState({ name:"", email:"", role:"operator", permissionGroups:["inventory_operations","production_operations","service_operations"] });
  const [memberForm, setMemberForm] = React.useState({ role:"operator", permissionGroups:["inventory_operations","production_operations","service_operations"] });

  const roles = (workspace.accessCatalog && workspace.accessCatalog.workspaceRoles) || ROLE_FALLBACKS;
  const permissionGroups = (workspace.accessCatalog && workspace.accessCatalog.permissionGroups) || GROUP_FALLBACKS;
  const canManageTeam = Boolean(workspace.actor && Array.isArray(workspace.actor.permissions) && workspace.actor.permissions.includes("tenant.manage"));
  const activeUsers = workspace.users || [];
  const pendingInvites = (workspace.invites || []).filter((invite) => invite.status === "pending");

  const roleLabel = (role) => {
    if (t.roleNames[role]) return t.roleNames[role];
    const match = roles.find((entry) => entry.role === role);
    return match ? match.label : String(role || "").replace(/_/g, " ");
  };

  const defaultsForRole = (role) => {
    const match = roles.find((entry) => entry.role === role);
    return match && Array.isArray(match.defaultPermissionGroups) ? [...match.defaultPermissionGroups] : [];
  };

  const permissionGroupMeta = (key) => permissionGroups.find((group) => group.key === key);
  const permissionGroupLabel = (group) => t.groupNames[group.key] || group.label;

  const permissionGroupSummary = (group) => t.groupSummaries[group.key] || group.summary;

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
    if (!value) return t.never;
    const diff = Date.now() - new Date(value).getTime();
    if (!Number.isFinite(diff) || diff < 60 * 1000) return t.now;
    if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}${t.mAgo}`;
    if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))}${t.hAgo}`;
    return `${Math.floor(diff / (24 * 60 * 60 * 1000))}${t.dAgo}`;
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
    const role = "operator";
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
      role: member.workspaceRole || "operator",
      permissionGroups: Array.isArray(member.permissionGroups) && member.permissionGroups.length
        ? [...member.permissionGroups]
        : defaultsForRole(member.workspaceRole || "operator")
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
      title={t.title}
      lang={lang}
      headerActions={
        <>
          <Button variant="ghost" icon={<Icon.Download size={13}/>} onClick={exportWorkspace} disabled={loading || exporting || !!errorStatus}>
            {exporting ? t.exporting : t.export}
          </Button>
          <Button variant="primary" icon={<Icon.UserPlus size={13}/>} onClick={openInvite} disabled={!canManageTeam}>
            {t.invite}
          </Button>
        </>
      }
    >
      <div className="card card-pad-0">
        <div className="tbl-toolbar">
          <span className="sp"/>
        </div>
        {error && <div className="muted" style={{fontSize:12, color:"var(--bad)", padding:"0 12px 12px"}}>{errorStatus === 403 ? t.noAccess : error}</div>}
        <table className="tbl">
          <thead><tr><th>{t.name}</th><th>{t.role}</th><th>{t.email}</th><th>{t.lastActive}</th><th/></tr></thead>
          <tbody>
            {loading && (
              <tr><td colSpan="5" className="dim mono">{t.loading}</td></tr>
            )}
            {!loading && errorStatus === 403 && (
              <tr><td colSpan="5" className="dim mono">{t.accessDenied}</td></tr>
            )}
            {!loading && activeUsers.map((member, index) => (
              <tr key={member.id}>
                <td>
                  <div className="row gap-8">
                    <div className={`avatar sm ${AVATAR_TONES[index % AVATAR_TONES.length]}`}>{member.name.split(" ").filter(Boolean).map((word) => word[0]).join("").slice(0, 2)}</div>
                    <span style={{color:"var(--ink)", fontWeight:500}}>{member.name}</span>
                  </div>
                </td>
                <td><Pill tone={(member.workspaceRole || member.role) === "owner" ? "solid-ink" : "info"} dot={false}>{roleLabel(member.workspaceRole || member.role)}</Pill></td>
                <td className="dim mono">{member.email || "—"}</td>
                <td className="dim mono">{relativeTime(member.lastActiveAt)}</td>
                <td className="row-actions">
                  {canManageTeam && <Button size="sm" variant="ghost" onClick={() => openManage(member)}>{t.manage}</Button>}
                </td>
              </tr>
            ))}
            {!loading && !errorStatus && activeUsers.length === 0 && (
              <tr><td colSpan="5" className="dim mono">{t.noMembers}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {errorStatus !== 403 && pendingInvites.length > 0 && (
        <div className="card card-pad-0 mt-16">
          <div className="panel-title">{t.pendingInvites} <span className="sp"/><span className="mono muted" style={{fontSize:10}}>{pendingInvites.length}</span></div>
          <table className="tbl">
            <thead><tr><th>{t.name}</th><th>{t.role}</th><th>{t.email}</th><th>{t.invited}</th><th/></tr></thead>
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
                  {canManageTeam && <Button size="sm" variant="ghost" onClick={() => revokeInvite(invite.id)}>{t.revoke}</Button>}
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title={t.inviteTitle}
        footer={
          <>
            <Button variant="ghost" onClick={() => setInviteOpen(false)}>{t.cancel}</Button>
            <span className="sp"/>
            <Button variant="primary" onClick={submitInvite} disabled={saving || !inviteForm.name || !inviteForm.email}>
              {saving ? t.sending : t.sendInvite}
            </Button>
          </>
        }
      >
        <div className="col gap-12">
          <Field label={t.fullName}><input className="input" value={inviteForm.name} onChange={(e) => setInviteForm({ ...inviteForm, name:e.target.value })}/></Field>
          <Field label="Email"><input className="input mono" value={inviteForm.email} onChange={(e) => setInviteForm({ ...inviteForm, email:e.target.value })}/></Field>
          <Field label={t.role}>
            <select className="select" value={inviteForm.role} onChange={(e) => setInviteForm({ ...inviteForm, role:e.target.value, permissionGroups: defaultsForRole(e.target.value) })}>
              {roles.map((role) => <option key={role.role} value={role.role}>{roleLabel(role.role)}</option>)}
            </select>
          </Field>
          <div className="label">{t.permissionGroups}</div>
          <div className="col gap-8">
            {permissionGroups.map((group) => (
              <label key={group.key} className="row hairline" style={{padding:10, borderRadius:6, cursor:"pointer", alignItems:"flex-start", gap:10}}>
                <input
                  type="checkbox"
                  checked={inviteForm.permissionGroups.includes(group.key)}
                  onChange={(e) => setInviteForm({ ...inviteForm, permissionGroups: updateGroupSelection(inviteForm.permissionGroups, group.key, e.target.checked) })}
                />
                <div style={{flex:1}}>
                  <div style={{fontWeight:500, color:"var(--ink)"}}>{permissionGroupLabel(group)}</div>
                  <div className="muted" style={{fontSize:11, marginTop:2}}>{permissionGroupSummary(group)}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      </Modal>

      <Drawer
        open={manageOpen}
        onClose={() => { setManageOpen(false); setSelectedMember(null); }}
        title={selectedMember ? `${t.manage} ${selectedMember.name}` : t.manageMember}
        footer={
          <>
            <Button variant="ghost" onClick={() => { setManageOpen(false); setSelectedMember(null); }}>{t.cancel}</Button>
            <span className="sp"/>
            <Button variant="primary" onClick={submitMemberUpdate} disabled={saving || !selectedMember}>
              {saving ? t.saving : t.saveChanges}
            </Button>
          </>
        }
      >
        {selectedMember && (
          <div className="col gap-12">
            <div className="hairline" style={{padding:10, borderRadius:6}}>
              <div style={{fontWeight:500, color:"var(--ink)"}}>{selectedMember.name}</div>
              <div className="muted mono" style={{fontSize:11, marginTop:3}}>{selectedMember.email || t.noEmail}</div>
            </div>
            <Field label={t.role}>
              <select className="select" value={memberForm.role} onChange={(e) => setMemberForm({ ...memberForm, role:e.target.value, permissionGroups: defaultsForRole(e.target.value) })}>
                {roles.map((role) => <option key={role.role} value={role.role}>{roleLabel(role.role)}</option>)}
              </select>
            </Field>
            <div className="row">
              <div className="label">{t.permissionGroups}</div>
              <span className="sp"/>
              <Button size="sm" variant="ghost" onClick={() => setMemberForm({ ...memberForm, permissionGroups: defaultsForRole(memberForm.role) })}>{t.resetDefaults}</Button>
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
                    <div style={{fontWeight:500, color:"var(--ink)"}}>{permissionGroupLabel(group)}</div>
                    <div className="muted" style={{fontSize:11, marginTop:2}}>{permissionGroupSummary(group)}</div>
                  </div>
                </label>
              ))}
            </div>
            <div className="label">{t.effectivePermissions}</div>
            <div className="row" style={{gap:6, flexWrap:"wrap"}}>
              {effectivePermissions(memberForm.permissionGroups).map((permission) => (
                <Pill key={permission} tone="info" dot={false}>{permissionLabel(permission)}</Pill>
              ))}
              {effectivePermissions(memberForm.permissionGroups).length === 0 && <span className="muted" style={{fontSize:12}}>{t.noEffectivePermissions}</span>}
            </div>
          </div>
        )}
      </Drawer>
    </Placeholder>
  );
}

const SMB_SETTINGS_I18N = {
  ru: {
    title: "Настройки",
    companyProfile: "Профиль компании",
    companyName: "Название компании",
    tin: "ИНН",
    address: "Адрес",
    phone: "Телефон",
    bankAccount: "Банковский счет",
    primaryAccount: "Основной счет",
    currency: "Валюта",
    localeNotifications: "Язык и уведомления",
    emailAlerts: "Email-уведомления",
    smsAlerts: "SMS-уведомления",
    aiCopilotSuggestions: "Подсказки AI Copilot"
  },
  en: {
    title: "Settings",
    companyProfile: "Company profile",
    companyName: "Company name",
    tin: "TIN",
    address: "Address",
    phone: "Phone",
    bankAccount: "Bank account",
    primaryAccount: "Primary account",
    currency: "Currency",
    localeNotifications: "Locale & notifications",
    emailAlerts: "Email alerts",
    smsAlerts: "SMS alerts",
    aiCopilotSuggestions: "AI Copilot suggestions"
  },
  uz: {
    title: "Sozlamalar",
    companyProfile: "Kompaniya profili",
    companyName: "Kompaniya nomi",
    tin: "STIR",
    address: "Manzil",
    phone: "Telefon",
    bankAccount: "Bank hisobi",
    primaryAccount: "Asosiy hisob",
    currency: "Valyuta",
    localeNotifications: "Til va bildirishnomalar",
    emailAlerts: "Email bildirishnomalari",
    smsAlerts: "SMS bildirishnomalari",
    aiCopilotSuggestions: "AI Copilot tavsiyalari"
  }
};

function SmbSettings({ lang = "ru" }) {
  const t = SMB_SETTINGS_I18N[lang] || SMB_SETTINGS_I18N.ru;
  return (
    <Placeholder title={t.title} lang={lang}>
      <div className="grid" style={{gridTemplateColumns:"1fr 1fr", gap:12}}>
        <div className="card"><div className="card-body">
          <h2>{t.companyProfile}</h2>
          <div className="col gap-8 mt-8">
            <Field label={t.companyName}><input className="input" defaultValue="Kamolot Savdo LLC"/></Field>
            <Field label={t.tin}><input className="input mono" defaultValue="301 452 776"/></Field>
            <Field label={t.address}><input className="input" defaultValue="Mirobod district, Tashkent 100170"/></Field>
            <Field label={t.phone}><input className="input mono" defaultValue="+998 71 200 44 82"/></Field>
          </div>
        </div></div>
        <div className="card"><div className="card-body">
          <h2>{t.bankAccount}</h2>
          <div className="col gap-8 mt-8">
            <Field label={t.primaryAccount}><input className="input mono" defaultValue="20208 000 100 100 001 · SQB"/></Field>
            <Field label={t.currency}><select className="select"><option>UZS</option><option>USD</option><option>EUR</option></select></Field>
          </div>
          <div className="divider"/>
          <h2>{t.localeNotifications}</h2>
          <div className="col gap-8 mt-8">
            <div className="row"><span>{t.emailAlerts}</span><span className="sp"/><Toggle on={true} onChange={()=>{}}/></div>
            <div className="row"><span>{t.smsAlerts}</span><span className="sp"/><Toggle on={false} onChange={()=>{}}/></div>
            <div className="row"><span>{t.aiCopilotSuggestions}</span><span className="sp"/><Toggle on={true} onChange={()=>{}}/></div>
          </div>
        </div></div>
      </div>
    </Placeholder>
  );
}

/* -------- Production order detail, Services WO detail (simple) -------- */
function ProductionOrder({ go, lang }) {
  return (
    <Placeholder title="Production order PO-0451" lang={lang}>
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

function ServiceOrderDetail({ lang }) {
  return (
    <Placeholder title="Work order WO-1041" lang={lang}>
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
