// SMB — Dashboard (hero) + AI Copilot (hero, streaming)

const SMB_DASHBOARD_I18N = {
  ru: {
    greeting: "Доброе утро, Jasur",
    subtitle: "Вторник, 18 марта · 4 новых активности с прошлого входа",
    export: "Экспорт",
    newInvoice: "Новый счет",
    kpiRevenue: "Выручка · Март",
    kpiRevenueDelta: "к фев",
    kpiCash: "Денежные средства",
    kpiCashDelta: "к прошлой неделе",
    kpiInventory: "Стоимость запасов",
    kpiInventoryDelta: "312 SKU",
    kpiOrders: "Ожидают обработки",
    kpiOrdersUnit: "открыто",
    kpiOrdersDelta: "3 просрочено",
    chartTitle: "Выручка · Последние 6 месяцев",
    chartRevenue: "Выручка",
    chartCashCollected: "Собрано средств",
    activity: "Активность",
    viewAll: "ПОКАЗАТЬ ВСЕ →",
    aiAssessed: "ОЦЕНЕНО AI",
    creditScore: "Ваш кредитный рейтинг",
    creditStrength: "Высокий",
    creditTrend: "+2 за прошлый месяц",
    creditPrequalPrefix: "Вам предварительно одобрено",
    creditPrequalAmount: "до 240 млн UZS",
    creditPrequalSuffix: "финансирования.",
    financingOptions: "Смотреть варианты финансирования",
    quickActions: "Быстрые действия",
    needsAttention: "Требует внимания",
    askCopilot: "Спросить Copilot",
    quickActionsList: [
      { i: "Plus", l: "Создать счет", s: "Выставить счет клиенту", p: "/smb/finance/invoices" },
      { i: "Scan", l: "Скан накладной / счета", s: "AI извлекает позиции", p: "/smb/inventory/scan", ai: true },
      { i: "Box", l: "Добавить запасы", s: "Новый SKU или партия", p: "/smb/inventory" },
      { i: "Coin", l: "Зафиксировать оплату", s: "Отметить счет оплаченным", p: "/smb/finance/bills" }
    ],
    activityItems: [
      { t: "2м", kind: "invoice", text: "Счет #INV-1482 оплачен Oriental Trade LLC", amt: "+14 500 000 UZS" },
      { t: "14м", kind: "stock", text: "Поступило 38 шт. · Масло 5л · от Samarkand Oil Co." },
      { t: "38м", kind: "ai", text: "Copilot отметил: медленно оборачиваемый товар — Порошок 6кг" },
      { t: "1ч", kind: "order", text: "Заказ PO-0451 подтвержден Malika Karimova" },
      { t: "2ч", kind: "invoice", text: "Счет #INV-1481 отправлен Zamon Foods · срок 14 апр" },
      { t: "4ч", kind: "bank", text: "Перевод 8 200 000 UZS на расчетный счет SQB выполнен" },
      { t: "1д", kind: "user", text: "Новый сотрудник: Bekzod Yusupov · Оператор склада" }
    ],
    attentionList: [
      { t: "Сахар рафинированный 50кг", d: "86 в наличии · мин 120", tone: "warn" },
      { t: "Стиральный порошок 6кг", d: "12 в наличии · мин 40", tone: "bad" },
      { t: "Минеральная вода 1.5л", d: "0 в наличии · нет на складе", tone: "bad" },
      { t: "INV-1475 просрочен", d: "Retail Centre · 8 дней", tone: "warn" }
    ]
  },
  en: {
    greeting: "Good morning, Jasur",
    subtitle: "Tuesday, 18 March · 4 new activities since you last signed in",
    export: "Export",
    newInvoice: "New invoice",
    kpiRevenue: "Revenue · March",
    kpiRevenueDelta: "vs Feb",
    kpiCash: "Cash on hand",
    kpiCashDelta: "vs last week",
    kpiInventory: "Inventory value",
    kpiInventoryDelta: "312 SKUs",
    kpiOrders: "Pending orders",
    kpiOrdersUnit: "open",
    kpiOrdersDelta: "3 overdue",
    chartTitle: "Revenue · Last 6 months",
    chartRevenue: "Revenue",
    chartCashCollected: "Cash collected",
    activity: "Activity",
    viewAll: "VIEW ALL →",
    aiAssessed: "AI ASSESSED",
    creditScore: "Your credit score",
    creditStrength: "Strong",
    creditTrend: "+2 since last month",
    creditPrequalPrefix: "You're pre-qualified for",
    creditPrequalAmount: "up to UZS 240 M",
    creditPrequalSuffix: "in financing.",
    financingOptions: "View financing options",
    quickActions: "Quick actions",
    needsAttention: "Needs attention",
    askCopilot: "Ask Copilot",
    quickActionsList: [
      { i: "Plus", l: "Create invoice", s: "Bill a customer", p: "/smb/finance/invoices" },
      { i: "Scan", l: "Scan waybill / invoice", s: "AI extracts line items", p: "/smb/inventory/scan", ai: true },
      { i: "Box", l: "Add inventory", s: "New SKU or batch", p: "/smb/inventory" },
      { i: "Coin", l: "Record payment", s: "Mark a bill paid", p: "/smb/finance/bills" }
    ],
    activityItems: [
      { t: "2m", kind: "invoice", text: "Invoice #INV-1482 paid by Oriental Trade LLC", amt: "+14 500 000 UZS" },
      { t: "14m", kind: "stock", text: "38 units received · Cooking oil 5L · from Samarkand Oil Co." },
      { t: "38m", kind: "ai", text: "Copilot flagged: slow-moving stock — Laundry detergent 6kg" },
      { t: "1h", kind: "order", text: "Purchase order PO-0451 approved by Malika Karimova" },
      { t: "2h", kind: "invoice", text: "Invoice #INV-1481 sent to Zamon Foods · due 14 Apr" },
      { t: "4h", kind: "bank", text: "UZS 8 200 000 transfer to SQB current account completed" },
      { t: "1d", kind: "user", text: "New employee added: Bekzod Yusupov · Warehouse Operator" }
    ],
    attentionList: [
      { t: "Sugar refined 50kg", d: "86 in stock · min 120", tone: "warn" },
      { t: "Laundry detergent 6kg", d: "12 in stock · min 40", tone: "bad" },
      { t: "Mineral water 1.5L", d: "0 in stock · out of stock", tone: "bad" },
      { t: "INV-1475 overdue", d: "Retail Centre · 8 days", tone: "warn" }
    ]
  },
  uz: {
    greeting: "Xayrli tong, Jasur",
    subtitle: "Seshanba, 18-mart · oxirgi kirishdan beri 4 ta yangi faoliyat",
    export: "Eksport",
    newInvoice: "Yangi hisob",
    kpiRevenue: "Tushum · Mart",
    kpiRevenueDelta: "fevralga nisbatan",
    kpiCash: "Naqd mablag'",
    kpiCashDelta: "o'tgan haftaga nisbatan",
    kpiInventory: "Zaxira qiymati",
    kpiInventoryDelta: "312 SKU",
    kpiOrders: "Kutilayotgan buyurtmalar",
    kpiOrdersUnit: "ochiq",
    kpiOrdersDelta: "3 ta muddati o'tgan",
    chartTitle: "Tushum · Oxirgi 6 oy",
    chartRevenue: "Tushum",
    chartCashCollected: "Yig'ilgan mablag'",
    activity: "Faollik",
    viewAll: "BARCHASINI KO'RISH →",
    aiAssessed: "AI BAHOLADI",
    creditScore: "Sizning kredit reytingingiz",
    creditStrength: "Kuchli",
    creditTrend: "+2 o'tgan oyga nisbatan",
    creditPrequalPrefix: "Sizga oldindan ma'qullangan",
    creditPrequalAmount: "240 mln UZS gacha",
    creditPrequalSuffix: "moliyalashtirish.",
    financingOptions: "Moliyalashtirish variantlarini ko'rish",
    quickActions: "Tezkor amallar",
    needsAttention: "E'tibor talab qiladi",
    askCopilot: "Copilotdan so'rash",
    quickActionsList: [
      { i: "Plus", l: "Hisob yaratish", s: "Mijozga hisob yuborish", p: "/smb/finance/invoices" },
      { i: "Scan", l: "Yuk xati / hisobni skanerlash", s: "AI pozitsiyalarni ajratadi", p: "/smb/inventory/scan", ai: true },
      { i: "Box", l: "Zaxira qo'shish", s: "Yangi SKU yoki partiya", p: "/smb/inventory" },
      { i: "Coin", l: "To'lovni qayd etish", s: "Hisob to'langanini belgilash", p: "/smb/finance/bills" }
    ],
    activityItems: [
      { t: "2d", kind: "invoice", text: "INV-1482 hisobi Oriental Trade LLC tomonidan to'landi", amt: "+14 500 000 UZS" },
      { t: "14d", kind: "stock", text: "38 dona qabul qilindi · 5L o'simlik yog'i · Samarkand Oil Co.dan" },
      { t: "38d", kind: "ai", text: "Copilot belgiladi: sekin aylanayotgan zaxira — 6kg kir kukuni" },
      { t: "1s", kind: "order", text: "PO-0451 xarid buyurtmasi Malika Karimova tomonidan tasdiqlandi" },
      { t: "2s", kind: "invoice", text: "INV-1481 hisobi Zamon Foodsga yuborildi · muddati 14-apr" },
      { t: "4s", kind: "bank", text: "8 200 000 UZS SQB hisob raqamiga o'tkazildi" },
      { t: "1k", kind: "user", text: "Yangi xodim qo'shildi: Bekzod Yusupov · Ombor operatori" }
    ],
    attentionList: [
      { t: "Rafinad shakar 50kg", d: "86 ta mavjud · min 120", tone: "warn" },
      { t: "Kir yuvish kukuni 6kg", d: "12 ta mavjud · min 40", tone: "bad" },
      { t: "Mineral suv 1.5L", d: "0 ta mavjud · omborda yo'q", tone: "bad" },
      { t: "INV-1475 muddati o'tgan", d: "Retail Centre · 8 kun", tone: "warn" }
    ]
  }
};

/* ─── Pulse Stories ──────────────────────────────────────── */
const PULSE_STORIES = [
  {
    id: "tax", tone: "bad",
    ru: { label: "НДС к уплате", emoji: "⚠️", title: "Налог НДС к уплате", subtitle: "Срок: 20 апреля", amount: "14 200 000 UZS", action: "Оплатить сейчас", chart: null, path: "/smb/finance/bills" },
    en: { label: "VAT Due",      emoji: "⚠️", title: "VAT tax due",         subtitle: "Deadline: Apr 20", amount: "14 200 000 UZS", action: "Pay now",          chart: null, path: "/smb/finance/bills" },
    uz: { label: "QQS to'lovi", emoji: "⚠️", title: "QQS to'lovi",          subtitle: "Muddat: 20-aprel", amount: "14 200 000 UZS", action: "Hozir to'lash",    chart: null, path: "/smb/finance/bills" },
  },
  {
    id: "growth", tone: "good",
    ru: { label: "Рост продаж",    emoji: "📈", title: "Лучший март за 3 года", subtitle: "+38% к прошлому году · Март 278 млн", action: "Посмотреть",     chart: [182,204,221,198,246,278], path: "/smb/finance/invoices" },
    en: { label: "Sales Growth",   emoji: "📈", title: "Best March in 3 years",  subtitle: "+38% vs last year · Mar 278M",         action: "View details",   chart: [182,204,221,198,246,278], path: "/smb/finance/invoices" },
    uz: { label: "Savdo o'sishi",  emoji: "📈", title: "3 yildagi eng yaxshi mart", subtitle: "O'tgan yilga +38% · Mart 278M",      action: "Ko'rish",       chart: [182,204,221,198,246,278], path: "/smb/finance/invoices" },
  },
  {
    id: "offer", tone: "ai",
    ru: { label: "Предложение банка", emoji: "🏦", title: "Предодобренный кредит", subtitle: "SQB · до 240 млн UZS · ставка 18%", amount: "240 000 000 UZS", action: "Узнать подробнее", chart: null, path: "/smb/credit" },
    en: { label: "Bank Offer",        emoji: "🏦", title: "Pre-approved credit",   subtitle: "SQB · up to UZS 240M · rate 18%",    amount: "240 000 000 UZS", action: "Learn more",       chart: null, path: "/smb/credit" },
    uz: { label: "Bank taklifi",      emoji: "🏦", title: "Oldindan ma'qullangan kredit", subtitle: "SQB · 240M UZS gacha · 18%",  amount: "240 000 000 UZS", action: "Batafsil",         chart: null, path: "/smb/credit" },
  },
  {
    id: "overdue", tone: "warn",
    ru: { label: "3 счета просроч.", emoji: "📋", title: "Просроченные счета", subtitle: "Нужно срочно: 3 счёта не оплачены", amount: "28 400 000 UZS", action: "Отправить напоминания", chart: null, path: "/smb/finance/invoices" },
    en: { label: "3 Overdue",         emoji: "📋", title: "Overdue invoices",  subtitle: "Action needed: 3 invoices unpaid",    amount: "28 400 000 UZS", action: "Send reminders",       chart: null, path: "/smb/finance/invoices" },
    uz: { label: "3 muddati o'tgan",  emoji: "📋", title: "Muddati o'tgan hisoblar", subtitle: "Kerak: 3 ta hisob to'lanmagan", amount: "28 400 000 UZS", action: "Eslatma yuborish",    chart: null, path: "/smb/finance/invoices" },
  },
];

function PulseStories({ go, lang }) {
  const [open, setOpen] = useStateS(null); // story id
  const story = open ? PULSE_STORIES.find(s => s.id === open) : null;
  const sd = story ? (story[lang] || story.en) : null;
  return (
    <>
      <div className="stories-bar">
        {PULSE_STORIES.map(s => {
          const d = s[lang] || s.en;
          return (
            <div key={s.id} className="story-bubble-wrap" onClick={() => setOpen(s.id)}>
              <div className={`story-ring tone-${s.tone}`}>
                <div className="story-ring-inner">{d.emoji}</div>
              </div>
              <span className="story-label">{d.label}</span>
            </div>
          );
        })}
      </div>
      {story && (
        <div className="story-panel-scrim" onClick={() => setOpen(null)}>
          <div className="story-panel" onClick={e => e.stopPropagation()}>
            <button className="story-panel-close" onClick={() => setOpen(null)}><Icon.X size={12}/></button>
            <span className="story-panel-emoji">{sd.emoji}</span>
            <div style={{marginBottom:6}}>
              <span className={`pill ${story.tone === "bad" ? "bad" : story.tone === "ai" ? "ai" : story.tone === "warn" ? "warn" : "good"}`} style={{fontSize:10, display:"inline-flex", alignItems:"center", gap:4}}>
                <span className="dot"/>
                {story.tone === "bad" ? "Urgent" : story.tone === "warn" ? "Attention" : story.tone === "good" ? "Positive" : "AI"}
              </span>
            </div>
            <div style={{fontSize:18, fontWeight:600, color:"var(--ink)", marginBottom:4}}>{sd.title}</div>
            <div className="muted" style={{fontSize:13, marginBottom:12}}>{sd.subtitle}</div>
            {sd.amount && (
              <div style={{fontSize:26, fontWeight:700, fontFamily:"var(--mono)", color:"var(--ink)", margin:"10px 0 14px"}}>
                {sd.amount}
              </div>
            )}
            {sd.chart && (
              <div style={{margin:"8px 0 14px"}}>
                <LineChart width={312} height={72} categories={["Oct","Nov","Dec","Jan","Feb","Mar"]}
                  series={[{ data: sd.chart, color:"var(--good)", dots:false, area:true }]}
                  padding={[8,8,18,32]}/>
              </div>
            )}
            <button className="feed-action-btn primary" style={{width:"100%", marginTop:4, padding:"10px 14px"}}
              onClick={() => { setOpen(null); go(sd.path); }}>
              {sd.action} <Icon.Arrow size={13}/>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/* ─── Business Feed ──────────────────────────────────────── */
const FEED_ITEMS_I18N = {
  ru: [
    { id: 1, kind: "payment", time: "2м",  title: "Входящая оплата",    text: "Oriental Trade LLC оплатил счёт #INV-1482", amount: "+14 500 000 UZS", positive: true, actions: ["Подтвердить", "Зафиксировать"], primary: 0, path: "/smb/finance/invoices" },
    { id: 2, kind: "invoice", time: "38м", title: "Счёт создан",        text: "Счёт #INV-1483 для Zamon Foods · срок 30 апреля", amount: "8 200 000 UZS", actions: ["Отправить клиенту", "Делегировать", "Удалить"], primary: 0, danger: 2, path: "/smb/finance/invoices" },
    { id: 3, kind: "alert",   time: "3ч",  title: "Низкий запас",       text: "Стиральный порошок 6кг — 12 ед. (минимум: 40)", actions: ["Заказать", "Позже"], primary: 0, path: "/smb/inventory" },
    { id: 4, kind: "bank",    time: "4ч",  title: "Перевод выполнен",   text: "8 200 000 UZS переведено на расчётный счёт SQB", amount: "−8 200 000 UZS", actions: ["Выписка"], primary: 0, path: "/smb/finance/bills" },
    { id: 5, kind: "ai",      time: "1д",  title: "Copilot: инсайт",    text: "Медленный оборот: Порошок 6кг (4.2x/г). Рассмотрите промо или уменьшение заказа.", actions: ["Спросить Copilot", "Скрыть"], primary: 0, path: "/smb/copilot" },
  ],
  en: [
    { id: 1, kind: "payment", time: "2m",  title: "Payment received",   text: "Oriental Trade LLC paid invoice #INV-1482", amount: "+14 500 000 UZS", positive: true, actions: ["Confirm receipt", "Record payment"], primary: 0, path: "/smb/finance/invoices" },
    { id: 2, kind: "invoice", time: "38m", title: "Invoice created",     text: "Invoice #INV-1483 for Zamon Foods · due Apr 30", amount: "8 200 000 UZS", actions: ["Send to customer", "Delegate to accountant", "Delete"], primary: 0, danger: 2, path: "/smb/finance/invoices" },
    { id: 3, kind: "alert",   time: "3h",  title: "Low stock alert",     text: "Laundry detergent 6kg — 12 units left (min 40)", actions: ["Reorder now", "Dismiss"], primary: 0, path: "/smb/inventory" },
    { id: 4, kind: "bank",    time: "4h",  title: "Transfer completed",  text: "UZS 8 200 000 transferred to SQB current account", amount: "−8 200 000 UZS", actions: ["View statement"], primary: 0, path: "/smb/finance/bills" },
    { id: 5, kind: "ai",      time: "1d",  title: "Copilot insight",     text: "Slow-moving item: Laundry detergent 6kg (4.2x/yr). Consider a promotion or reduce next order.", actions: ["Ask Copilot", "Dismiss"], primary: 0, path: "/smb/copilot" },
  ],
  uz: [
    { id: 1, kind: "payment", time: "2d",  title: "To'lov qabul qilindi", text: "Oriental Trade LLC INV-1482 hisobini to'ladi", amount: "+14 500 000 UZS", positive: true, actions: ["Tasdiqlash", "Qayd etish"], primary: 0, path: "/smb/finance/invoices" },
    { id: 2, kind: "invoice", time: "38d", title: "Hisob yaratildi",       text: "INV-1483 hisobi Zamon Foodsga · muddat 30-aprel", amount: "8 200 000 UZS", actions: ["Mijozga yuborish", "Hisobchiga topshirish", "O'chirish"], primary: 0, danger: 2, path: "/smb/finance/invoices" },
    { id: 3, kind: "alert",   time: "3s",  title: "Zaxira kam",            text: "6kg kir kukuni — 12 dona qoldi (min 40)", actions: ["Buyurtma berish", "Keyinroq"], primary: 0, path: "/smb/inventory" },
    { id: 4, kind: "bank",    time: "4s",  title: "O'tkazma bajarildi",    text: "8 200 000 UZS SQB hisob raqamiga o'tkazildi", amount: "−8 200 000 UZS", actions: ["Ko'chirma"], primary: 0, path: "/smb/finance/bills" },
    { id: 5, kind: "ai",      time: "1k",  title: "Copilot xulosasi",      text: "Sekin aylanayotgan: 6kg kir kukuni (4.2x/yil). Aksiya yoki buyurtmani kamaytirish tavsiya etiladi.", actions: ["Copilotdan so'rash", "Yopish"], primary: 0, path: "/smb/copilot" },
  ],
};

function BusinessFeed({ go, lang }) {
  const items = FEED_ITEMS_I18N[lang] || FEED_ITEMS_I18N.en;
  const [dismissed, setDismissed] = useStateS(new Set());
  const [done, setDone] = useStateS(new Set());

  const kindMeta = {
    payment: { icon: <Icon.Coin size={13}/>,   color: "var(--good)", bg: "var(--good-bg)" },
    invoice: { icon: <Icon.Doc size={13}/>,    color: "var(--ink)",  bg: "var(--bg)" },
    alert:   { icon: <Icon.Alert size={13}/>,  color: "var(--warn)", bg: "rgba(224,142,36,0.1)" },
    bank:    { icon: <Icon.Bank size={13}/>,   color: "var(--ai)",   bg: "var(--ai-bg)" },
    ai:      { icon: <Icon.Sparkle size={13}/>,color: "var(--ai)",   bg: "var(--ai-bg)" },
    stock:   { icon: <Icon.Box size={13}/>,    color: "var(--muted)",bg: "var(--bg)" },
  };

  return (
    <div className="feed">
      {items.map(item => {
        const meta = kindMeta[item.kind] || kindMeta.invoice;
        const isDone = done.has(item.id);
        const isDismissed = dismissed.has(item.id);
        return (
          <div key={item.id} className={`feed-card${isDismissed ? " feed-dismissed" : ""}`}>
            <div className="feed-card-header">
              <div style={{ width:30, height:30, borderRadius:8, background:meta.bg, display:"grid", placeItems:"center", color:meta.color, flexShrink:0 }}>
                {meta.icon}
              </div>
              <div style={{flex:1, minWidth:0}}>
                <div style={{fontSize:12.5, fontWeight:600, color:"var(--ink)"}}>{item.title}</div>
                <div className="mono muted" style={{fontSize:10}}>{item.time}</div>
              </div>
              {isDone && <span className="pill good" style={{fontSize:10}}><span className="dot"/>Done</span>}
            </div>
            <div className="feed-card-body" onClick={() => go(item.path)} style={{cursor:"pointer"}}>
              <div style={{fontSize:13, color:"var(--fg)", lineHeight:1.45}}>{item.text}</div>
              {item.amount && (
                <div className={`feed-amount ${item.positive ? "positive" : item.amount.startsWith("−") ? "negative" : ""}`}>
                  {item.amount}
                </div>
              )}
            </div>
            {!isDone && !isDismissed && (
              <div className="feed-card-actions">
                {item.actions.map((label, ai) => (
                  <button key={ai}
                    className={`feed-action-btn${ai === item.primary ? " primary" : ai === item.danger ? " danger" : ""}`}
                    onClick={() => {
                      if (ai === item.danger || label.toLowerCase().includes("dismiss") || label.toLowerCase().includes("позже") || label.toLowerCase().includes("скрыть") || label.toLowerCase().includes("yopish") || label.toLowerCase().includes("keyinroq") || label.toLowerCase().includes("позже")) {
                        setDismissed(new Set([...dismissed, item.id]));
                        window.toast && window.toast("Dismissed");
                      } else {
                        setDone(new Set([...done, item.id]));
                        window.toast && window.toast.good(label + " — done!");
                        if (ai === item.primary) setTimeout(() => go(item.path), 600);
                      }
                    }}>
                    {ai === item.primary && <Icon.Check size={11}/>}
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const REVENUE_PERIODS = {
  "3M": { data: [198, 246, 278], labels: ["Jan","Feb","Mar"] },
  "6M": { data: [182, 204, 221, 198, 246, 278], labels: ["Oct","Nov","Dec","Jan","Feb","Mar"] },
  "1Y": { data: [140,155,168,175,182,204,221,198,210,224,246,278], labels: ["Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar"] },
};

function SMBDashboard({ go, lang }) {
  const t = SMB_DASHBOARD_I18N[lang] || SMB_DASHBOARD_I18N.ru;
  const [period, setPeriod] = useStateS("6M");
  const chartData = REVENUE_PERIODS[period] || REVENUE_PERIODS["6M"];
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow mb-4">{t.greeting}</div>
          <h1>Kamolot Savdo · Tashkent</h1>
          <div className="sub">{t.subtitle}</div>
        </div>
        <span className="sp"/>
        <Button variant="ghost" icon={<Icon.Download size={13}/>}
          onClick={() => { window.toast && window.toast.good("Report exported as PDF"); }}>{t.export}</Button>
        <Button variant="primary" icon={<Icon.Plus size={13}/>}
          onClick={() => go("/smb/finance/invoices")}>{t.newInvoice}</Button>
      </div>

      <PulseStories go={go} lang={lang}/>

      <div className="grid grid-4 mb-16">
        <KpiAnimated label={t.kpiRevenue} value="278.4" unit="M UZS"
             delta="+12.8%" deltaLabel={t.kpiRevenueDelta} trend="up"
             spark={<Sparkline data={REVENUE_6MO} width={64} height={24}/>}/>
        <KpiAnimated label={t.kpiCash} value="64.2" unit="M UZS"
             delta="−4.1%" deltaLabel={t.kpiCashDelta} trend="down"
             spark={<Sparkline data={[72,69,71,66,68,65,64]} width={64} height={24} stroke="var(--bad)"/>}/>
        <KpiAnimated label={t.kpiInventory} value="412.7" unit="M UZS"
             delta="+2.3%" deltaLabel={t.kpiInventoryDelta} trend="up"
             spark={<Sparkline data={[380,388,395,402,410,412]} width={64} height={24}/>}/>
        <KpiAnimated label={t.kpiOrders} value="18" unit={t.kpiOrdersUnit}
             delta={t.kpiOrdersDelta} deltaLabel="" trend="down"
             spark={<div className="sparkbars">{[4,7,3,6,8,5,4,9,6].map((h,i)=><span key={i} style={{height: h*2+"px"}}/>)}</div>}/>
      </div>

      <div className="grid" style={{gridTemplateColumns:"1.3fr 1fr", gap:12}}>
        {/* Left: Business Feed (main focal point) */}
        <div>
          <div className="row mb-10">
            <div style={{fontSize:13, fontWeight:600, color:"var(--ink)"}}>
              {t.activity}
            </div>
            <span className="sp"/>
            <a className="mono muted" style={{cursor:"pointer", fontSize:10}} onClick={() => go("/smb/finance/invoices")}>{t.viewAll}</a>
          </div>
          <BusinessFeed go={go} lang={lang}/>
        </div>

        {/* Right: Credit + Quick actions + Needs attention */}
        <div className="col" style={{gap:12}}>
          <div className="ai-card" style={{padding:16, position:"relative"}}>
            <span className="ai-tag"><Icon.Sparkle size={10}/> {t.aiAssessed}</span>
            <div className="eyebrow">{t.creditScore}</div>
            <div className="row mt-8" style={{gap:14, alignItems:"center"}}>
              <div style={{position:"relative", flexShrink:0}}>
                <ArcGauge value={81} max={100} size={88} thickness={9} color="var(--ai)" trackColor="var(--line)"/>
                <div style={{position:"absolute", inset:0, display:"grid", placeItems:"center"}}>
                  <div style={{textAlign:"center"}}>
                    <div style={{fontSize:18, fontWeight:600, color:"var(--ink)", lineHeight:1}}>81</div>
                    <div className="mono muted" style={{fontSize:9}}>/100</div>
                  </div>
                </div>
              </div>
              <div style={{flex:1}}>
                <div className="pill good mb-4"><span className="dot"/>{t.creditStrength}</div>
                <div className="mono muted" style={{fontSize:10, marginBottom:8}}>{t.creditTrend}</div>
                <div className="muted" style={{fontSize:12}}>
                  {t.creditPrequalPrefix} <b style={{color:"var(--ink)"}}>{t.creditPrequalAmount}</b> {t.creditPrequalSuffix}
                </div>
              </div>
            </div>
            <Button variant="primary" className="block mt-12" onClick={() => go("/smb/credit")}>
              {t.financingOptions} <Icon.Arrow size={13}/>
            </Button>
          </div>

          <div className="card">
            <div className="panel-title">{t.quickActions}</div>
            <div className="card-body" style={{padding:10}}>
              {t.quickActionsList.map((a, i) => {
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

          <div className="card">
            <div className="panel-title">{t.needsAttention} <span className="sp"/><Pill tone="warn" dot={false}>4</Pill></div>
            <div className="card-body" style={{padding:10}}>
              {t.attentionList.map((x,i) => {
                const dest = x.t && (x.t.includes("INV") || x.t.includes("счет") || x.t.includes("hisob")) ? "/smb/finance/invoices" : "/smb/inventory";
                return (
                  <div key={i} className="row hairline-b" style={{padding:"8px 4px", gap:10, borderBottom: i===3 ? "0" : undefined, cursor:"pointer"}}
                    onClick={() => go(dest)}>
                    <Pill tone={x.tone} dot={false}>!</Pill>
                    <div style={{flex:1}}>
                      <div style={{fontSize:12.5, color:"var(--ink)"}}>{x.t}</div>
                      <div className="muted" style={{fontSize:11}}>{x.d}</div>
                    </div>
                    <Icon.ChevRight size={13} className="muted"/>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Revenue chart — full width below the feed */}
      <div className="card card-pad-0 mt-16">
        <div className="panel-title">
          {t.chartTitle}
          <span className="sp"/>
          <div className="row" style={{gap:12, fontSize:10, fontFamily:"var(--mono)"}}>
            <span style={{color:"var(--muted)"}}><span style={{display:"inline-block", width:8, height:2, background:"var(--ink)", marginRight:6}}/>{t.chartRevenue}</span>
            <span style={{color:"var(--muted)"}}><span style={{display:"inline-block", width:8, height:2, background:"var(--ai)", marginRight:6, borderTop:"1px dashed var(--ai)"}}/>{t.chartCashCollected}</span>
          </div>
          <div className="btn-group">
            {["3M","6M","1Y"].map(p => (
              <button key={p} className={`btn sm ${period === p ? "period-active" : ""}`} onClick={() => setPeriod(p)}>{p}</button>
            ))}
          </div>
        </div>
        <div style={{padding:"8px 8px 0"}}>
          <LineChart
            width={1100} height={200}
            categories={chartData.labels}
            series={[
              { data: chartData.data, color:"var(--ink)", dots:true, area:true },
              { data: chartData.data.map(v => Math.round(v * 0.82)), color:"var(--ai)", dashed:true },
            ]}
            padding={[18,20,28,44]}
          />
        </div>
      </div>

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
        {t.askCopilot}
        <span className="kbd" style={{background:"rgba(255,255,255,0.15)", color:"rgba(255,255,255,0.7)", borderColor:"transparent"}}>⌘J</span>
      </button>
    </div>
  );
}

/* ---------------- AI Copilot (streaming) ---------------- */
const COPILOT_I18N = {
  ru: {
    newChat: "Новый чат",
    today: "Сегодня",
    cashFlowThisMonth: "Денежный поток в этом месяце",
    topSkuMargin: "Топ-10 SKU по марже",
    lastWeek: "Прошлая неделя",
    lastWeekItems: [
      "Прогноз спроса на Рамадан",
      "Риск концентрации клиентов",
      "Помощь по сверке НДС",
      "Пороги пополнения запасов"
    ],
    groundedInErp: "ОСНОВАНО НА ВАШИХ ДАННЫХ ERP · UZ · RU · EN",
    export: "Экспорт",
    aiGroundedTag: "AI · ОБОСНОВАНО",
    suggestedAction: "Рекомендованное действие",
    exploreFinancing: "Посмотреть финансирование",
    sources: "Источники:",
    sourcesValue: "ERP · 12 счетов · 2 расхода · 1 PO",
    followUps: "Предлагаемые вопросы",
    composerPlaceholder: "Спросите про денежный поток, клиентов, запасы или что угодно в вашей ERP...",
    attach: "Прикрепить",
    erpData: "Данные ERP",
    send: "Отправить",
    groundedNote: "Ответы основаны на ваших ERP-данных за последние 18 месяцев. Проверяйте важные решения.",
    suggestions: [
      "Какие клиенты несут наибольшие риски для денежного потока?",
      "Спрогнозируй выручку на следующий месяц",
      "Какие SKU стоит прекратить заказывать?",
      "Оцени мой налог за Q1"
    ],
    thread: [
      { role: "user", text: "Почему в этом месяце не хватает денег?" },
      { role: "ai", streaming: true, answer: {
        summary: "Три фактора вместе объясняют напряженность с денежным потоком в марте — по каждому есть подтверждение в ERP:",
        points: [
          {
            title: "Рост дебиторки",
            body: "Средний срок оплаты вырос с 22 до 34 дней. Сейчас 86.4M UZS просрочено, в основном из-за 2 крупных клиентов.",
            refs: [{ l: "12 неоплаченных счетов", p: "/smb/finance/invoices" }, { l: "Retail Centre · 18д просрочки", p: "/smb/finance/invoices" }],
          },
          {
            title: "Накопление запасов",
            body: "Вы увеличили запасы на 18% в ожидании роста спроса в Рамадан. 62M UZS заморожено в сахаре, рисе и напитках, которые оборачиваются медленнее, чем в прошлом году.",
            refs: [{ l: "Сахар · 86 ед., оборач. 4.2x", p: "/smb/inventory" }, { l: "Отчет по категории напитков", p: "/smb/reports" }],
          },
          {
            title: "Предоплата поставщику",
            body: "42M UZS предоплачены Samarkand Oil Co. 3 марта за поставку на Q2. Средства вернутся в марже с середины апреля.",
            refs: [{ l: "Платеж PO-0445", p: "/smb/finance/bills" }],
          },
        ],
        recommendation: "С учетом вашего кредитного профиля вам предварительно доступна краткосрочная линия на 120M UZS — решение за 24 часа.",
      }},
    ]
  },
  en: {
    newChat: "New chat",
    today: "Today",
    cashFlowThisMonth: "Cash flow this month",
    topSkuMargin: "Top 10 SKUs margin",
    lastWeek: "Last week",
    lastWeekItems: [
      "Ramadan demand forecast",
      "Customer concentration risk",
      "VAT reconciliation help",
      "Restock thresholds"
    ],
    groundedInErp: "GROUNDED IN YOUR ERP · UZ · RU · EN",
    export: "Export",
    aiGroundedTag: "AI · GROUNDED",
    suggestedAction: "Suggested action",
    exploreFinancing: "Explore financing",
    sources: "Sources:",
    sourcesValue: "ERP · 12 invoices · 2 bills · 1 PO",
    followUps: "Suggested follow-ups",
    composerPlaceholder: "Ask about your cash flow, customers, stock, or anything in your ERP...",
    attach: "Attach",
    erpData: "ERP data",
    send: "Send",
    groundedNote: "{t.groundedNote}",
    suggestions: [
      "Which customers are my biggest cash-flow risks?",
      "Forecast next month's revenue",
      "Which SKUs should I stop ordering?",
      "Estimate my tax liability for Q1"
    ],
    thread: [
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
    ]
  },
  uz: {
    newChat: "Yangi chat",
    today: "Bugun",
    cashFlowThisMonth: "Bu oy pul oqimi",
    topSkuMargin: "Marja bo'yicha TOP 10 SKU",
    lastWeek: "O'tgan hafta",
    lastWeekItems: [
      "Ramazon talabi prognozi",
      "Mijozlar konsentratsiyasi xatari",
      "QQS solishtiruvi bo'yicha yordam",
      "Qayta to'ldirish chegaralari"
    ],
    groundedInErp: "ERP MA'LUMOTLARINGIZGA ASOSLANGAN · UZ · RU · EN",
    export: "Eksport",
    aiGroundedTag: "AI · ASOSLANGAN",
    suggestedAction: "Tavsiya etilgan amal",
    exploreFinancing: "Moliyalashtirishni ko'rish",
    sources: "Manbalar:",
    sourcesValue: "ERP · 12 hisob · 2 xarajat · 1 PO",
    followUps: "Tavsiya etilgan keyingi savollar",
    composerPlaceholder: "Pul oqimi, mijozlar, zaxira yoki ERP tizimingizdagi istalgan narsa haqida so'rang...",
    attach: "Biriktirish",
    erpData: "ERP ma'lumotlari",
    send: "Yuborish",
    groundedNote: "Javoblar oxirgi 18 oy ERP ma'lumotlariga asoslangan. Muhim qarorlarni tekshirib oling.",
    suggestions: [
      "Qaysi mijozlar pul oqimi uchun eng katta xavf tug'diradi?",
      "Keyingi oy tushumini prognoz qil",
      "Qaysi SKUlarni buyurtma qilishni to'xtatish kerak?",
      "Q1 bo'yicha soliq majburiyatimni bahola"
    ],
    thread: [
      { role: "user", text: "Nega bu oy pul oqimim siqilib qoldi?" },
      { role: "ai", streaming: true, answer: {
        summary: "Mart oyidagi pul oqimi bosimini uchta omil tushuntiradi — har biri ERP ma'lumotlari bilan tasdiqlangan:",
        points: [
          {
            title: "Debitor qarzdorlik oshdi",
            body: "O'rtacha to'lov muddati 22 kundan 34 kunga chiqdi. Hozir 86.4M UZS muddati o'tgan, asosan 2 ta yirik mijoz sabab.",
            refs: [{ l: "12 ta to'lanmagan hisob", p: "/smb/finance/invoices" }, { l: "Retail Centre · 18 kun kechikish", p: "/smb/finance/invoices" }],
          },
          {
            title: "Zaxira ortib ketgan",
            body: "Ramazon davrida talab oshishini kutib, zaxirani 18% ga ko'paytirdingiz. 62M UZS shakar, guruch va ichimliklarda band bo'lib qolgan.",
            refs: [{ l: "Shakar · 86 dona, aylanish 4.2x", p: "/smb/inventory" }, { l: "Ichimliklar kategoriyasi hisoboti", p: "/smb/reports" }],
          },
          {
            title: "Yetkazib beruvchiga oldindan to'lov",
            body: "3 mart kuni Samarkand Oil Co.ga Q2 yetkazib berish uchun 42M UZS oldindan to'landi. Mablag' aprel o'rtasidan marja sifatida qaytadi.",
            refs: [{ l: "PO-0445 to'lovi", p: "/smb/finance/bills" }],
          },
        ],
        recommendation: "Kredit profilingizga ko'ra sizga 120M UZS qisqa muddatli aylanma mablag' liniyasi oldindan mos — qaror 24 soatda.",
      }},
    ]
  }
};

function CopilotPage({ go, lang }) {
  const t = COPILOT_I18N[lang] || COPILOT_I18N.ru;
  const [thread, setThread] = useStateS(() => t.thread);
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

  const suggestions = t.suggestions;

  useEffectS(() => {
    setThread(t.thread);
    setPrompt("");
    setStreamIdx(0);
  }, [lang]);

  return (
    <div style={{display:"grid", gridTemplateColumns:"260px 1fr", height:"calc(100vh - var(--topbar-h))"}}>
      {/* threads sidebar */}
      <div className="hairline-r" style={{padding:12, overflowY:"auto", background:"var(--surface-2)"}}>
        <div className="row mb-12">
          <Button variant="primary" size="sm" className="block" icon={<Icon.Plus size={12}/>}>{t.newChat}</Button>
        </div>
        <div className="eyebrow mb-4">{t.today}</div>
        <div className="nav-item active" style={{fontSize:12.5}}>
          <Icon.Sparkle size={12} style={{color:"var(--ai)"}}/>
          <span>{t.cashFlowThisMonth}</span>
        </div>
        <div className="nav-item" style={{fontSize:12.5}}>
          <span className="ico"><Icon.Hash size={12}/></span>
          <span>{t.topSkuMargin}</span>
        </div>
        <div className="eyebrow mt-12 mb-4">{t.lastWeek}</div>
        {t.lastWeekItems.map((x,i) => (
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
            <div className="mono muted" style={{fontSize:10}}>{t.groundedInErp}</div>
          </div>
          <span className="sp"/>
          <Button variant="ghost" size="sm" icon={<Icon.Download size={12}/>}>{t.export}</Button>
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
              <span className="ai-tag"><Icon.Sparkle size={10}/> {t.aiGroundedTag}</span>
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
                            {p.body.length === p.body.length && !p.partial && (
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
                          <div className="title">{t.suggestedAction}</div>
                          <div className="desc">{partial.rec}{!done && <span className="caret"/>}</div>
                        </div>
                        {done && <Button variant="ai" size="sm" onClick={() => go("/smb/credit")}>{t.exploreFinancing} <Icon.Arrow size={12}/></Button>}
                      </div>
                    )}
                  </>
                ) : null}
              </div>
              {done && (
                <div className="row mt-12" style={{gap:6, borderTop:"1px solid var(--line)", paddingTop:10}}>
                  <span className="mono muted" style={{fontSize:10}}>{t.sources} <a style={{color:"var(--ai)"}}>{t.sourcesValue}</a></span>
                  <span className="sp"/>
                  <button className="icon-btn"><Icon.Copy size={13}/></button>
                  <button className="icon-btn"><Icon.Refresh size={13}/></button>
                </div>
              )}
            </div>
          </div>

          {done && (
            <div className="mt-16">
              <div className="eyebrow mb-8">{t.followUps}</div>
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
              placeholder={t.composerPlaceholder}
              rows={2} style={{border:0, boxShadow:"none", resize:"none"}}/>
            <div className="row" style={{gap:8, borderTop:"1px solid var(--line-2)", paddingTop:8}}>
              <Button variant="ghost" size="sm" icon={<Icon.Paperclip size={12}/>}>{t.attach}</Button>
              <Button variant="ghost" size="sm" icon={<Icon.Database size={12}/>}>{t.erpData}</Button>
              <span className="sp"/>
              <span className="mono muted" style={{fontSize:10}}>Haiku 4.5 · grounded</span>
              <Button variant="primary" size="sm" icon={<Icon.Arrow size={12}/>}>{t.send}</Button>
            </div>
          </div>
          <div className="mono muted tc mt-8" style={{fontSize:10}}>
            {t.groundedNote}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { SMBDashboard, CopilotPage, PulseStories, BusinessFeed });
