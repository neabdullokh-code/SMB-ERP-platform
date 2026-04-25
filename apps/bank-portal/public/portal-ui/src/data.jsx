// Sample data: Uzbekistan SMB "Kamolot Savdo" + bank portfolio
const SMB = {
  name: "Kamolot Savdo",
  nameShort: "Kamolot",
  tagline: "Wholesale distribution · Tashkent",
  tin: "301 452 776",
  owner: "Jasur Azimov",
  ownerInitials: "JA",
  plan: "SQB Business OS — Free",
  since: "Jan 2024",
  employees: 42,
  region: "Tashkent",
};

const PRODUCTS = [
  { sku: "KS-0102", name: "Cooking oil, sunflower 5L", cat: "Grocery", stock: 1240, min: 300, price: 62000, mvmt: "2h ago", status: "In stock" },
  { sku: "KS-0104", name: "Sugar, refined 50kg bag", cat: "Grocery", stock: 86, min: 120, price: 420000, mvmt: "1d ago", status: "Low" },
  { sku: "KS-0210", name: "Rice, Devzira 25kg",     cat: "Grocery", stock: 540, min: 200, price: 310000, mvmt: "4h ago", status: "In stock" },
  { sku: "KS-0308", name: "Black tea, Akbar 250g", cat: "Beverage", stock: 3020, min: 800, price: 24000, mvmt: "30m ago", status: "In stock" },
  { sku: "KS-0401", name: "Laundry detergent 6kg", cat: "Household", stock: 12, min: 40, price: 185000, mvmt: "3d ago", status: "Low" },
  { sku: "KS-0512", name: "Mineral water 1.5L x12", cat: "Beverage", stock: 0, min: 100, price: 48000, mvmt: "5d ago", status: "Out" },
  { sku: "KS-0617", name: "Canned tomato 800g",    cat: "Pantry",   stock: 2160, min: 400, price: 14500, mvmt: "1h ago", status: "In stock" },
  { sku: "KS-0621", name: "Pasta, Makfa 450g",     cat: "Pantry",   stock: 1880, min: 500, price: 9800,  mvmt: "1h ago", status: "In stock" },
  { sku: "KS-0734", name: "Sunflower seeds 1kg",   cat: "Snacks",   stock: 920,  min: 300, price: 22000, mvmt: "6h ago", status: "In stock" },
  { sku: "KS-0801", name: "Baby formula, stage 2", cat: "Baby",     stock: 48,   min: 60,  price: 280000, mvmt: "2d ago", status: "Low" },
  { sku: "KS-0912", name: "Cotton kitchen towel",  cat: "Household", stock: 640, min: 200, price: 38000,  mvmt: "1d ago", status: "In stock" },
  { sku: "KS-1003", name: "Hand soap 500ml",       cat: "Household", stock: 1420, min: 400, price: 19500, mvmt: "3h ago", status: "In stock" },
];

const REVENUE_6MO = [182, 204, 221, 198, 246, 278]; // in millions UZS
const REVENUE_LABELS = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

const ACTIVITY = [
  { t: "2m",  kind: "invoice", text: "Invoice #INV-1482 paid by Oriental Trade LLC", amt: "+14 500 000 UZS" },
  { t: "14m", kind: "stock",   text: "38 units received · Cooking oil 5L · from Samarkand Oil Co." },
  { t: "38m", kind: "ai",      text: "Copilot flagged: slow-moving stock — Laundry detergent 6kg" },
  { t: "1h",  kind: "order",   text: "Purchase order PO-0451 approved by Malika Karimova" },
  { t: "2h",  kind: "invoice", text: "Invoice #INV-1481 sent to Zamon Foods · due 14 Apr" },
  { t: "4h",  kind: "bank",    text: "UZS 8 200 000 transfer to SQB current account completed" },
  { t: "1d",  kind: "user",    text: "New employee added: Bekzod Yusupov · Warehouse Operator" },
];

const TENANTS = [
  { id:"T-00142", co:"Oriental Trade LLC",  ind:"Import / Export", reg:"Tashkent",  rev:[21,24,26,23,28,31], score:84, trend:"+3", act:"2h",  flags:["upsell"] },
  { id:"T-00217", co:"Zamon Foods",         ind:"Food production", reg:"Samarkand", rev:[18,17,16,18,22,26], score:78, trend:"+5", act:"42m", flags:["cross-sell"] },
  { id:"T-00289", co:"Kamolot Savdo",       ind:"Wholesale",       reg:"Tashkent",  rev:[14,15,17,18,20,22], score:81, trend:"+2", act:"12m", flags:[] },
  { id:"T-00314", co:"Silk Road Textiles",  ind:"Textiles",        reg:"Namangan",  rev:[9,11,10,8,7,6],    score:58, trend:"−7", act:"6h",  flags:["cash-flow"] },
  { id:"T-00421", co:"Tashkent Logistics",  ind:"Services",        reg:"Tashkent",  rev:[12,13,14,15,15,16], score:73, trend:"+1", act:"1h",  flags:[] },
  { id:"T-00588", co:"Ferghana Agro",       ind:"Agriculture",     reg:"Ferghana",  rev:[8,12,18,16,14,12], score:65, trend:"−2", act:"3h",  flags:["seasonal"] },
  { id:"T-00612", co:"Nur Auto Parts",      ind:"Automotive",      reg:"Tashkent",  rev:[19,18,21,24,26,29], score:82, trend:"+4", act:"8m",  flags:["cross-sell"] },
  { id:"T-00701", co:"Bukhara Pharma",      ind:"Pharmacy",        reg:"Bukhara",   rev:[22,23,24,25,27,29], score:86, trend:"+1", act:"55m", flags:[] },
  { id:"T-00812", co:"Andijon Construction",ind:"Construction",    reg:"Andijon",   rev:[30,28,22,18,14,12], score:52, trend:"−12",act:"2d",  flags:["overdue"] },
  { id:"T-00901", co:"Chorsu Market Co.",   ind:"Wholesale",       reg:"Tashkent",  rev:[16,17,18,17,19,21], score:71, trend:"+0", act:"4h",  flags:[] },
  { id:"T-01023", co:"Khiva Ceramics",      ind:"Manufacturing",   reg:"Khorezm",   rev:[6,7,8,9,11,13],    score:68, trend:"+3", act:"1h",  flags:[] },
  { id:"T-01144", co:"Navoi Metals",        ind:"Mining",          reg:"Navoi",     rev:[42,44,46,48,49,51], score:89, trend:"+2", act:"20m", flags:["cross-sell"] },
];

const CREDIT_QUEUE = [
  { id:"LA-2398", co:"Kamolot Savdo",      tin:"301 452 776", amt:180_000_000,  purpose:"Inventory financing",     score:81, auto:"Approve",  aiConf:94, submitted:"Today 09:14", officer:null, ind:"Wholesale" },
  { id:"LA-2397", co:"Zamon Foods",        tin:"304 128 991", amt:620_000_000,  purpose:"Equipment · new packaging line", score:78, auto:"Approve",  aiConf:88, submitted:"Today 08:42", officer:"M. Karim", ind:"Food production" },
  { id:"LA-2396", co:"Silk Road Textiles", tin:"302 776 014", amt:240_000_000,  purpose:"Working capital",          score:58, auto:"Decline",  aiConf:71, submitted:"Today 08:03", officer:null, ind:"Textiles" },
  { id:"LA-2395", co:"Nur Auto Parts",     tin:"306 441 722", amt:95_000_000,   purpose:"Inventory financing",     score:82, auto:"Approve",  aiConf:91, submitted:"Today 07:48", officer:null, ind:"Automotive" },
  { id:"LA-2394", co:"Ferghana Agro",      tin:"308 551 633", amt:320_000_000,  purpose:"Seasonal · pre-harvest",   score:65, auto:"Review",   aiConf:64, submitted:"Yesterday", officer:"D. Usmon", ind:"Agriculture" },
  { id:"LA-2393", co:"Bukhara Pharma",     tin:"301 998 442", amt:120_000_000,  purpose:"Inventory + refrigeration", score:86, auto:"Approve",  aiConf:96, submitted:"Yesterday", officer:null, ind:"Pharmacy" },
  { id:"LA-2392", co:"Chorsu Market Co.",  ind:"Wholesale", tin:"301 220 118", amt:210_000_000,  purpose:"Working capital",          score:71, auto:"Review",   aiConf:74, submitted:"Yesterday", officer:null },
  { id:"LA-2391", co:"Andijon Construction", tin:"305 717 040", amt:540_000_000, purpose:"Equipment · excavator",   score:52, auto:"Decline",  aiConf:82, submitted:"Yesterday", officer:"B. Tursun", ind:"Construction" },
];

const ALERTS = [
  { sev:"bad",  type:"Cash flow anomaly", co:"Silk Road Textiles", note:"Receivables stretched 28 → 47 days", t:"2h"  },
  { sev:"warn", type:"Inventory drop",    co:"Kamolot Savdo",      note:"Baby formula stage 2 below min for 3 days", t:"38m" },
  { sev:"bad",  type:"Payment overdue",   co:"Andijon Construction", note:"UZS 42M · 14 days past due", t:"4h" },
  { sev:"info", type:"Credit upgrade",    co:"Bukhara Pharma",     note:"Score 83 → 86 · loan renewal eligible", t:"1h" },
  { sev:"ai",   type:"Upsell opportunity",co:"Navoi Metals",       note:"Trade finance fit · UZS 28M est. revenue", t:"6h" },
  { sev:"warn", type:"Inventory drop",    co:"Chorsu Market Co.",  note:"Laundry detergent · 3 SKUs below min", t:"1d" },
];

const NOTIFS = [
  { t:"2m",  tone:"info",  text:"Oriental Trade paid invoice INV-1482 · 14 500 000 UZS" },
  { t:"14m", tone:"ai",    text:"AI Copilot: cash-flow report ready", },
  { t:"1h",  tone:"warn",  text:"Stock alert: Sugar refined 50kg below minimum" },
  { t:"3h",  tone:"good",  text:"Loan application pre-approved · awaiting signature" },
  { t:"Yd",  tone:"info",  text:"Payroll processed · 42 employees · 186 400 000 UZS" },
];

// Enriched queue items used by bank-credit.jsx
const LOAN_QUEUE = CREDIT_QUEUE.map((q, i) => ({
  ...q,
  amt: (q.amt/1e6).toFixed(0) + "M UZS",
  term: [9, 36, 12, 6, 12, 18, 9, 60][i] + " months",
  product: q.purpose,
  industry: q.ind || "—",
  region: ["Tashkent","Samarkand","Namangan","Tashkent","Ferghana","Bukhara","Tashkent","Andijon"][i],
  employees: [42, 128, 210, 34, 88, 64, 52, 320][i],
  revenueTTM: ["2.48 B","3.12 B","1.94 B","1.02 B","1.86 B","2.24 B","1.58 B","4.42 B"][i] + " UZS",
  priority: q.score < 60 || q.amt > 500_000_000 ? "high" : "normal",
  aiRec: q.auto === "Approve" ? "approve" : q.auto === "Decline" ? "decline" : "review",
  aiRationale: q.auto === "Approve"
    ? `Strong revenue trajectory (${q.score >= 80 ? "+38% YoY" : "+12% YoY"}), stable cash flow, and consistent SQB transaction history. Default risk estimated at 2.1%, well within policy. Recommend approval at standard rate.`
    : q.auto === "Decline"
    ? `Declining revenue for 4 consecutive months, AR days stretched to 47, and customer concentration above policy threshold (38%). Default probability 14.2%. Recommend decline or secured facility.`
    : `Mixed signals: strong revenue growth but industry headwinds and seasonal cash flow volatility. Recommend a credit officer review and possibly a smaller facility with stepped disbursement.`,
  factors: null,
}));

Object.assign(window, { SMB, PRODUCTS, REVENUE_6MO, REVENUE_LABELS, ACTIVITY, TENANTS, CREDIT_QUEUE, LOAN_QUEUE, ALERTS, NOTIFS });
