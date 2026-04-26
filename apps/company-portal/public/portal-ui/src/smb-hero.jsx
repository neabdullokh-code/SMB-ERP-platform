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
    id: "tax", tone: "bad", icon: "Alert",
    ru: { label: "НДС к уплате", emoji: "⚠️", title: "Налог НДС к уплате", subtitle: "Срок: 20 апреля", amount: "14 200 000 UZS", action: "Оплатить сейчас", chart: null, path: "/smb/finance/bills" },
    en: { label: "VAT Due",      emoji: "⚠️", title: "VAT tax due",         subtitle: "Deadline: Apr 20", amount: "14 200 000 UZS", action: "Pay now",          chart: null, path: "/smb/finance/bills" },
    uz: { label: "QQS to'lovi", emoji: "⚠️", title: "QQS to'lovi",          subtitle: "Muddat: 20-aprel", amount: "14 200 000 UZS", action: "Hozir to'lash",    chart: null, path: "/smb/finance/bills" },
  },
  {
    id: "growth", tone: "good", icon: "Chart",
    ru: { label: "Рост продаж",    emoji: "📈", title: "Лучший март за 3 года", subtitle: "+38% к прошлому году · Март 278 млн", action: "Посмотреть",     chart: [182,204,221,198,246,278], path: "/smb/finance/invoices" },
    en: { label: "Sales Growth",   emoji: "📈", title: "Best March in 3 years",  subtitle: "+38% vs last year · Mar 278M",         action: "View details",   chart: [182,204,221,198,246,278], path: "/smb/finance/invoices" },
    uz: { label: "Savdo o'sishi",  emoji: "📈", title: "3 yildagi eng yaxshi mart", subtitle: "O'tgan yilga +38% · Mart 278M",      action: "Ko'rish",       chart: [182,204,221,198,246,278], path: "/smb/finance/invoices" },
  },
  {
    id: "offer", tone: "ai", icon: "Bank",
    ru: { label: "Предложение банка", emoji: "🏦", title: "Предодобренный кредит", subtitle: "SQB · до 240 млн UZS · ставка 18%", amount: "240 000 000 UZS", action: "Узнать подробнее", chart: null, path: "/smb/credit" },
    en: { label: "Bank Offer",        emoji: "🏦", title: "Pre-approved credit",   subtitle: "SQB · up to UZS 240M · rate 18%",    amount: "240 000 000 UZS", action: "Learn more",       chart: null, path: "/smb/credit" },
    uz: { label: "Bank taklifi",      emoji: "🏦", title: "Oldindan ma'qullangan kredit", subtitle: "SQB · 240M UZS gacha · 18%",  amount: "240 000 000 UZS", action: "Batafsil",         chart: null, path: "/smb/credit" },
  },
  {
    id: "overdue", tone: "warn", icon: "Doc",
    ru: { label: "3 счета просроч.", emoji: "📋", title: "Просроченные счета", subtitle: "Нужно срочно: 3 счёта не оплачены", amount: "28 400 000 UZS", action: "Отправить напоминания", chart: null, path: "/smb/finance/invoices" },
    en: { label: "3 Overdue",         emoji: "📋", title: "Overdue invoices",  subtitle: "Action needed: 3 invoices unpaid",    amount: "28 400 000 UZS", action: "Send reminders",       chart: null, path: "/smb/finance/invoices" },
    uz: { label: "3 muddati o'tgan",  emoji: "📋", title: "Muddati o'tgan hisoblar", subtitle: "Kerak: 3 ta hisob to'lanmagan", amount: "28 400 000 UZS", action: "Eslatma yuborish",    chart: null, path: "/smb/finance/invoices" },
  },
];

function PulseStories({ go, lang = "ru" }) {
  const [open, setOpen] = useStateS(null); // story id
  const story = open ? PULSE_STORIES.find(s => s.id === open) : null;
  const sd = story ? (story[lang] || story.ru || story.en) : null;
  const StoryIcon = story ? (Icon[story.icon] || Icon.Info) : null;
  const toneLabels = {
    ru: { bad: "Срочно", warn: "Внимание", good: "Позитив", ai: "AI" },
    en: { bad: "Urgent", warn: "Attention", good: "Positive", ai: "AI" },
    uz: { bad: "Shoshilinch", warn: "Diqqat", good: "Ijobiy", ai: "AI" },
  };
  const toneText = (toneLabels[lang] || toneLabels.ru);
  return (
    <>
      <div className="stories-bar">
        {PULSE_STORIES.map(s => {
          const d = s[lang] || s.ru || s.en;
          const BubbleIcon = Icon[s.icon] || Icon.Info;
          return (
            <div key={s.id} className="story-bubble-wrap" onClick={() => setOpen(s.id)}>
              <div className={`story-ring tone-${s.tone}`}>
                <div className="story-ring-inner"><BubbleIcon size={14}/></div>
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
            <span className="story-panel-emoji">{StoryIcon && <StoryIcon size={18}/>}</span>
            <div style={{marginBottom:6}}>
              <span className={`pill ${story.tone === "bad" ? "bad" : story.tone === "ai" ? "ai" : story.tone === "warn" ? "warn" : "good"}`} style={{fontSize:10, display:"inline-flex", alignItems:"center", gap:4}}>
                <span className="dot"/>
                {story.tone === "bad" ? toneText.bad : story.tone === "warn" ? toneText.warn : story.tone === "good" ? toneText.good : toneText.ai}
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

function BusinessFeed({ go, lang = "ru" }) {
  const items = FEED_ITEMS_I18N[lang] || FEED_ITEMS_I18N.ru || FEED_ITEMS_I18N.en;
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

function SMBDashboard({ go, lang = "ru" }) {
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

      <AskCopilotFAB go={go} lang={lang}/>
    </div>
  );
}


/* ---------------- AI Copilot ---------------- */
const COPILOT_I18N = {
  ru: {
    copilotName: "SQB Copilot",
    newChat: "Новый чат",
    today: "Сегодня",
    lastWeek: "Прошлая неделя",
    older: "Ранее",
    noThreads: "Чатов пока нет",
    groundedInErp: "ОСНОВАНО НА ВАШИХ ДАННЫХ ERP · UZ · RU · EN",
    export: "Экспорт",
    composerPlaceholder: "Спросите про денежный поток, клиентов, запасы или что угодно в вашей ERP...",
    attach: "Прикрепить",
    erpData: "Данные ERP",
    send: "Отправить",
    stop: "Остановить",
    modelTag: "SQB AI · обосновано",
    groundedNote: "Ответы основаны на ваших ERP-данных. Проверяйте важные решения.",
    suggestions: [
      "Почему в этом месяце не хватает денег?",
      "Какие клиенты несут наибольшие риски для денежного потока?",
      "Какие SKU стоит прекратить заказывать?",
      "Имею ли я право на кредит?",
    ],
    emptyTitle: "Чем сегодня помочь?",
    emptyHint: "Я вижу ваши данные по запасам, финансам, заказам и кредиту. Спросите что-нибудь.",
    errorOffline: "Copilot сейчас недоступен. Проверьте API-ключ и попробуйте снова.",
    errorAuth: "Сессия истекла. Войдите заново.",
    deleteThread: "Удалить",
    confirmDelete: "Удалить этот чат?",
  },
  en: {
    copilotName: "SQB Copilot",
    newChat: "New chat",
    today: "Today",
    lastWeek: "Last week",
    older: "Older",
    noThreads: "No chats yet",
    groundedInErp: "GROUNDED IN YOUR ERP · UZ · RU · EN",
    export: "Export",
    composerPlaceholder: "Ask about your cash flow, customers, stock, or anything in your ERP...",
    attach: "Attach",
    erpData: "ERP data",
    send: "Send",
    stop: "Stop",
    modelTag: "SQB AI · grounded",
    groundedNote: "Answers are grounded in your live ERP data. Verify before acting on important decisions.",
    suggestions: [
      "Why is my cash tight this month?",
      "Which customers are my biggest cash-flow risks?",
      "Which SKUs should I stop ordering?",
      "Am I eligible for a loan?",
    ],
    emptyTitle: "How can I help today?",
    emptyHint: "I can see your inventory, finance, orders, and credit data. Ask me anything.",
    errorOffline: "Copilot is offline. Check your AI provider API key and try again.",
    errorAuth: "Your session expired. Please sign in again.",
    deleteThread: "Delete",
    confirmDelete: "Delete this chat?",
  },
  uz: {
    copilotName: "SQB Copilot",
    newChat: "Yangi chat",
    today: "Bugun",
    lastWeek: "O'tgan hafta",
    older: "Avvalroq",
    noThreads: "Chatlar hali yo'q",
    groundedInErp: "ERP MA'LUMOTLARINGIZGA ASOSLANGAN · UZ · RU · EN",
    export: "Eksport",
    composerPlaceholder: "Pul oqimi, mijozlar, zaxira yoki ERP tizimingizdagi istalgan narsa haqida so'rang...",
    attach: "Biriktirish",
    erpData: "ERP ma'lumotlari",
    send: "Yuborish",
    stop: "To'xtatish",
    modelTag: "SQB AI · asoslangan",
    groundedNote: "Javoblar ERP ma'lumotlaringizga asoslangan. Muhim qarorlardan oldin tekshirib oling.",
    suggestions: [
      "Nega bu oy pul oqimim siqilib qoldi?",
      "Qaysi mijozlar pul oqimi uchun eng katta xavf?",
      "Qaysi SKUlarni buyurtma qilishni to'xtatish kerak?",
      "Kreditga loyiqmanmi?",
    ],
    emptyTitle: "Bugun nimada yordam beray?",
    emptyHint: "Sizning zaxira, moliya, buyurtma va kredit ma'lumotlaringizni ko'ra olaman. So'rang.",
    errorOffline: "Copilot hozir ishlamayapti. AI provider API kalitini tekshiring.",
    errorAuth: "Sessiya muddati tugagan. Qayta kiring.",
    deleteThread: "O'chirish",
    confirmDelete: "Ushbu chatni o'chirilsinmi?",
  }
};

const COPILOT_LS_VERSION = 1;
const COPILOT_MAX_THREADS = 50;
const COPILOT_MAX_MESSAGES = 200;

function copilotLsKey(tenantId) {
  return `sqb.copilot.threads.${tenantId || "default"}`;
}

function copilotLoadStore(tenantId) {
  try {
    const raw = window.localStorage.getItem(copilotLsKey(tenantId));
    if (!raw) return { threads: [], activeThreadId: null };
    const data = JSON.parse(raw);
    if (!data || data.version !== COPILOT_LS_VERSION) return { threads: [], activeThreadId: null };
    const threads = Array.isArray(data.threads) ? data.threads : [];
    return { threads, activeThreadId: data.activeThreadId || null };
  } catch (e) {
    return { threads: [], activeThreadId: null };
  }
}

function copilotSaveStore(tenantId, store) {
  try {
    const trimmed = {
      version: COPILOT_LS_VERSION,
      activeThreadId: store.activeThreadId,
      threads: store.threads.slice(0, COPILOT_MAX_THREADS).map((t) => ({
        ...t,
        messages: t.messages.slice(-COPILOT_MAX_MESSAGES),
      })),
    };
    window.localStorage.setItem(copilotLsKey(tenantId), JSON.stringify(trimmed));
  } catch (e) {
    /* quota exceeded — drop silently */
  }
}

function copilotMakeThread() {
  return {
    id: "t_" + Math.random().toString(36).slice(2, 10) + "_" + Date.now().toString(36),
    title: "",
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function copilotGroupThreads(threads) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const sevenDaysAgo = startOfToday - 6 * 86400000;
  const today = [];
  const lastWeek = [];
  const older = [];
  for (const t of [...threads].sort((a, b) => b.updatedAt - a.updatedAt)) {
    if (t.updatedAt >= startOfToday) today.push(t);
    else if (t.updatedAt >= sevenDaysAgo) lastWeek.push(t);
    else older.push(t);
  }
  return { today, lastWeek, older };
}

function copilotThreadTitle(thread, fallback) {
  if (thread.title) return thread.title;
  const firstUser = thread.messages.find((m) => m.role === "user");
  if (firstUser && firstUser.content) {
    const trimmed = firstUser.content.trim().replace(/\s+/g, " ");
    return trimmed.length > 40 ? trimmed.slice(0, 40) + "…" : trimmed;
  }
  return fallback;
}

async function copilotStream({ messages, context, locale, signal, onToken, onDone, onError }) {
  try {
    const res = await fetch("/api/copilot/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, context, locale }),
      signal,
    });
    if (res.status === 401) { onError({ kind: "auth" }); return; }
    if (!res.ok) {
      let detail = "";
      try { detail = await res.text(); } catch (e) {}
      let parsed = null;
      try { parsed = JSON.parse(detail); } catch (e) {}
      onError({ kind: "http", status: res.status, detail: parsed?.message || detail });
      return;
    }
    if (!res.body) { onError({ kind: "no-stream" }); return; }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      if (chunk) onToken(chunk);
    }
    onDone();
  } catch (e) {
    if (e && e.name === "AbortError") { onDone(); return; }
    onError({ kind: "network", message: e && e.message });
  }
}

function CopilotPage({ go, lang }) {
  const t = COPILOT_I18N[lang] || COPILOT_I18N.en;
  const tenantId = (window.AuthRuntime && window.AuthRuntime.getCachedSession && window.AuthRuntime.getCachedSession()?.tenantId) || "default";

  const [store, setStore] = useStateS(() => copilotLoadStore(tenantId));
  const [draft, setDraft] = useStateS("");
  const [streaming, setStreaming] = useStateS(false);
  const [errorKey, setErrorKey] = useStateS(null);
  const abortRef = useRef(null);
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);

  const { threads, activeThreadId } = store;
  const activeThread = threads.find((x) => x.id === activeThreadId) || null;
  const grouped = copilotGroupThreads(threads);

  // Persist on every change
  useEffectS(() => {
    copilotSaveStore(tenantId, store);
  }, [tenantId, store]);

  // Auto-scroll to bottom on new messages / token chunks
  useEffectS(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeThreadId, activeThread && activeThread.messages.length, activeThread && activeThread.messages[activeThread.messages.length - 1]?.content]);

  // Cancel any in-flight stream when leaving page
  useEffectS(() => () => {
    if (abortRef.current) {
      try { abortRef.current.abort(); } catch (e) {}
    }
  }, []);

  function startNewChat() {
    if (streaming && abortRef.current) { try { abortRef.current.abort(); } catch (e) {} }
    const fresh = copilotMakeThread();
    setStore({ threads: [fresh, ...threads], activeThreadId: fresh.id });
    setDraft("");
    setErrorKey(null);
    setTimeout(() => textareaRef.current && textareaRef.current.focus(), 0);
  }

  function selectThread(id) {
    if (streaming) return;
    setStore({ threads, activeThreadId: id });
    setErrorKey(null);
  }

  function deleteThread(id, e) {
    if (e) { e.stopPropagation(); }
    if (!window.confirm(t.confirmDelete)) return;
    const next = threads.filter((x) => x.id !== id);
    const nextActive = activeThreadId === id ? (next[0]?.id || null) : activeThreadId;
    setStore({ threads: next, activeThreadId: nextActive });
  }

  async function send(promptOverride) {
    const text = (promptOverride != null ? promptOverride : draft).trim();
    if (!text || streaming) return;

    let thread = activeThread;
    let baseThreads = threads;
    if (!thread) {
      thread = copilotMakeThread();
      baseThreads = [thread, ...threads];
    }

    const userMsg = { role: "user", content: text, ts: Date.now() };
    const assistantMsg = { role: "assistant", content: "", ts: Date.now(), pending: true };
    const updated = {
      ...thread,
      title: thread.messages.length === 0 ? (text.length > 40 ? text.slice(0, 40) + "…" : text) : thread.title,
      messages: [...thread.messages, userMsg, assistantMsg],
      updatedAt: Date.now(),
    };
    const nextThreads = baseThreads.map((x) => (x.id === thread.id ? updated : x));
    setStore({ threads: nextThreads, activeThreadId: thread.id });
    setDraft("");
    setStreaming(true);
    setErrorKey(null);

    const controller = new AbortController();
    abortRef.current = controller;
    const apiMessages = updated.messages.slice(0, -1).map((m) => ({ role: m.role, content: m.content }));
    const ctx = (typeof window.buildCopilotContext === "function") ? window.buildCopilotContext() : {};

    let acc = "";
    const updateAssistant = (content, done) => {
      setStore((prev) => {
        const updatedThreads = prev.threads.map((x) => {
          if (x.id !== thread.id) return x;
          const msgs = x.messages.slice();
          const last = msgs[msgs.length - 1];
          if (!last || last.role !== "assistant") return x;
          msgs[msgs.length - 1] = { ...last, content, pending: !done };
          return { ...x, messages: msgs, updatedAt: Date.now() };
        });
        return { threads: updatedThreads, activeThreadId: prev.activeThreadId };
      });
    };

    await copilotStream({
      messages: apiMessages,
      context: ctx,
      locale: lang,
      signal: controller.signal,
      onToken: (chunk) => { acc += chunk; updateAssistant(acc, false); },
      onDone: () => {
        updateAssistant(acc, true);
        setStreaming(false);
        abortRef.current = null;
      },
      onError: (err) => {
        const isAuth = err && err.kind === "auth";
        const serverMsg = err && err.detail ? err.detail : null;
        const fallback = isAuth ? t.errorAuth : (serverMsg || t.errorOffline);
        updateAssistant(acc || fallback, true);
        setErrorKey(isAuth ? "auth" : "offline");
        setStreaming(false);
        abortRef.current = null;
        if (isAuth) setTimeout(() => typeof go === "function" && go("/login"), 1200);
      },
    });
  }

  function stopStream() {
    if (abortRef.current) { try { abortRef.current.abort(); } catch (e) {} }
  }

  function onComposerKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  const renderThreadRow = (th) => {
    const title = copilotThreadTitle(th, t.newChat);
    const isActive = th.id === activeThreadId;
    return (
      <div
        key={th.id}
        className={`nav-item ${isActive ? "active" : ""}`}
        style={{ fontSize: 12.5, gap: 8, position: "relative", paddingRight: 26 }}
        onClick={() => selectThread(th.id)}
        title={title}
      >
        <span className="ico">
          {isActive ? <Icon.Sparkle size={12} style={{ color: "var(--ai)" }}/> : <Icon.Hash size={12}/>}
        </span>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{title}</span>
        <button
          className="icon-btn"
          aria-label={t.deleteThread}
          onClick={(e) => deleteThread(th.id, e)}
          style={{ position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)", padding: 2 }}
        >
          <Icon.Trash size={11}/>
        </button>
      </div>
    );
  };

  const renderMessage = (m, i) => {
    if (m.role === "user") {
      return (
        <div key={i} className="row" style={{ justifyContent: "flex-end", marginBottom: 16 }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "14px 14px 2px 14px", padding: "10px 14px", maxWidth: 520, whiteSpace: "pre-wrap" }}>
            {m.content}
          </div>
          <div className="avatar warm" style={{ width: 28, height: 28, marginLeft: 10 }}>JA</div>
        </div>
      );
    }
    return (
      <div key={i} style={{ display: "grid", gridTemplateColumns: "28px 1fr", gap: 10, marginBottom: 16 }}>
        <div className="avatar" style={{ background: "var(--ai-bg)", color: "var(--ai)", width: 28, height: 28 }}>
          <Icon.Sparkle size={13}/>
        </div>
        <div className="ai-card" style={{ padding: "10px 14px 14px", position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 6 }}>
            <span className="ai-tag" style={{ position: "static" }}><Icon.Sparkle size={10}/> {t.modelTag}</span>
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.55, color: "var(--fg)", whiteSpace: "pre-wrap" }}>
            {m.content || (m.pending ? "" : "")}
            {m.pending && <span className="caret"/>}
          </div>
        </div>
      </div>
    );
  };

  const isEmpty = !activeThread || activeThread.messages.length === 0;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", height: "calc(100vh - var(--topbar-h))" }}>
      <div className="hairline-r" style={{ padding: 12, overflowY: "auto", background: "var(--surface-2)" }}>
        <div className="row mb-12">
          <Button variant="primary" size="sm" className="block" icon={<Icon.Plus size={12}/>} onClick={startNewChat}>
            {t.newChat}
          </Button>
        </div>

        {threads.length === 0 ? (
          <div className="muted" style={{ fontSize: 12, padding: "12px 6px" }}>{t.noThreads}</div>
        ) : (
          <>
            {grouped.today.length > 0 && (<><div className="eyebrow mb-4">{t.today}</div>{grouped.today.map(renderThreadRow)}</>)}
            {grouped.lastWeek.length > 0 && (<><div className="eyebrow mt-12 mb-4">{t.lastWeek}</div>{grouped.lastWeek.map(renderThreadRow)}</>)}
            {grouped.older.length > 0 && (<><div className="eyebrow mt-12 mb-4">{t.older}</div>{grouped.older.map(renderThreadRow)}</>)}
          </>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", minWidth: 0, background: "var(--bg)" }}>
        <div className="hairline-b" style={{ padding: "10px 20px", background: "var(--surface)", display: "flex", alignItems: "center", gap: 10 }}>
          <div className="avatar" style={{ background: "var(--ai-bg)", color: "var(--ai)", width: 26, height: 26 }}>
            <Icon.Sparkle size={14}/>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>{t.copilotName} <AIChip/></div>
            <div className="mono muted" style={{ fontSize: 10 }}>{t.groundedInErp}</div>
          </div>
          <span className="sp"/>
          <Button variant="ghost" size="sm" icon={<Icon.Download size={12}/>}>{t.export}</Button>
        </div>

        <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "24px 20px 24px", maxWidth: 880, margin: "0 auto", width: "100%" }}>
          {isEmpty ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--muted)" }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--ai-bg)", color: "var(--ai)", display: "inline-grid", placeItems: "center", marginBottom: 14 }}>
                <Icon.Sparkle size={22}/>
              </div>
              <div style={{ fontSize: 18, color: "var(--ink)", fontWeight: 500, marginBottom: 6 }}>{t.emptyTitle}</div>
              <div style={{ fontSize: 13, marginBottom: 20 }}>{t.emptyHint}</div>
              <div className="row" style={{ flexWrap: "wrap", gap: 8, justifyContent: "center", maxWidth: 640, margin: "0 auto" }}>
                {t.suggestions.map((s, i) => (
                  <button key={i} className="chip" style={{ cursor: "pointer", fontSize: 12.5 }} onClick={() => send(s)}>
                    {s} <Icon.Arrow size={10} className="muted"/>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            activeThread.messages.map(renderMessage)
          )}
        </div>

        <div style={{ position: "sticky", bottom: 0, background: "var(--bg)", padding: "14px 20px 20px", borderTop: "1px solid var(--line)" }}>
          {errorKey && (
            <div className="banner bad" style={{ maxWidth: 860, margin: "0 auto 10px" }}>
              <span className="ico"><Icon.Alert size={15}/></span>
              <div style={{ flex: 1 }}>
                <div className="desc">{errorKey === "auth" ? t.errorAuth : t.errorOffline}</div>
              </div>
            </div>
          )}
          <div className="hairline" style={{ background: "var(--surface)", borderRadius: 8, padding: 10, maxWidth: 860, margin: "0 auto" }}>
            <textarea
              ref={textareaRef}
              className="input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onComposerKey}
              placeholder={t.composerPlaceholder}
              rows={2}
              disabled={streaming}
              style={{ border: 0, boxShadow: "none", resize: "none" }}
            />
            <div className="row" style={{ gap: 8, borderTop: "1px solid var(--line-2)", paddingTop: 8 }}>
              <Button variant="ghost" size="sm" icon={<Icon.Paperclip size={12}/>} disabled>{t.attach}</Button>
              <Button variant="ghost" size="sm" icon={<Icon.Database size={12}/>} disabled>{t.erpData}</Button>
              <span className="sp"/>
              <span className="mono muted" style={{ fontSize: 10 }}>{t.modelTag}</span>
              {streaming ? (
                <Button variant="ghost" size="sm" icon={<Icon.X size={12}/>} onClick={stopStream}>{t.stop}</Button>
              ) : (
                <Button variant="primary" size="sm" icon={<Icon.Arrow size={12}/>} onClick={() => send()} disabled={!draft.trim()}>{t.send}</Button>
              )}
            </div>
          </div>
          <div className="mono muted tc mt-8" style={{ fontSize: 10 }}>{t.groundedNote}</div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { SMBDashboard, CopilotPage, PulseStories, BusinessFeed });
