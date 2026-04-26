"use client";

import { useState } from "react";
import { Button, DataTable, SectionCard, StatusBadge } from "@sqb/ui";

// ─── Types ────────────────────────────────────────────────────────────────────

type AlertLevel = "green" | "yellow" | "red";
type CompanyStatus = "approve" | "review" | "reject";

type Company = {
  id: number;
  name: string;
  industry: string;
  score: number;
  scoreDelta: number;
  weeklyRevenue: string;
  limit: string;
  status: CompanyStatus;
  lastSeen: string;
  alert: AlertLevel | null;
  alertText: string | null;
};

// ─── Mock data ────────────────────────────────────────────────────────────────

const COMPANIES: Company[] = [
  { id: 1, name: "ООО Tekstil Pro", industry: "Текстиль", score: 89, scoreDelta: 12, weeklyRevenue: "48.2 млн", limit: "250 млн", status: "approve", lastSeen: "сегодня", alert: "green", alertText: "Скор вырос до 89 — можно увеличить лимит" },
  { id: 2, name: "ИП Каримов А.Р.", industry: "Розничная торговля", score: 61, scoreDelta: -4, weeklyRevenue: "12.7 млн", limit: "80 млн", status: "review", lastSeen: "21 день назад", alert: "yellow", alertText: "Не заходил в систему 21 день — активности нет" },
  { id: 3, name: "ООО МегаСтрой", industry: "Строительство", score: 34, scoreDelta: -18, weeklyRevenue: "7.4 млн", limit: "120 млн", status: "reject", lastSeen: "3 дня назад", alert: "red", alertText: "Скор упал до 34 — высокий кредитный риск" },
  { id: 4, name: "ТОО АгроПлюс", industry: "Сельское хозяйство", score: 76, scoreDelta: 3, weeklyRevenue: "31.0 млн", limit: "180 млн", status: "approve", lastSeen: "вчера", alert: null, alertText: null },
  { id: 5, name: "ИП Хасанов М.", industry: "Общественное питание", score: 55, scoreDelta: 1, weeklyRevenue: "6.8 млн", limit: "40 млн", status: "review", lastSeen: "2 дня назад", alert: null, alertText: null },
  { id: 6, name: "ООО DigitalHub", industry: "IT-услуги", score: 92, scoreDelta: 5, weeklyRevenue: "22.5 млн", limit: "300 млн", status: "approve", lastSeen: "сегодня", alert: null, alertText: null },
  { id: 7, name: "ООО ФармаПро", industry: "Фармацевтика", score: 48, scoreDelta: -7, weeklyRevenue: "9.1 млн", limit: "60 млн", status: "review", lastSeen: "5 дней назад", alert: "yellow", alertText: "Скор опустился ниже 50 — требует проверки" },
  { id: 8, name: "ИП Рахимова З.", industry: "Образование", score: 70, scoreDelta: 2, weeklyRevenue: "4.3 млн", limit: "30 млн", status: "approve", lastSeen: "сегодня", alert: null, alertText: null },
];

const SCORE_DIST = [
  { label: "0–30", count: 1, color: "#e53e3e" },
  { label: "30–50", count: 4, color: "#dd6b20" },
  { label: "50–70", count: 12, color: "#d69e2e" },
  { label: "70–90", count: 22, color: "#38a169" },
  { label: "90–100", count: 8, color: "#2b6cb0" },
];

const MONTHLY_SCORE = [58, 60, 63, 61, 65, 67, 66, 70, 72, 74, 71, 75];
const MONTHS = ["Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек", "Янв", "Фев", "Мар"];

const MOCK_OPERATIONS = [
  { date: "25.04.2026", type: "Поступление", amount: "+4 200 000 сум", in: true, counterparty: "ООО Алтын Групп" },
  { date: "24.04.2026", type: "Списание", amount: "−1 800 000 сум", in: false, counterparty: "Налоговый комитет" },
  { date: "23.04.2026", type: "Поступление", amount: "+7 600 000 сум", in: true, counterparty: "ИП Юсупов Б." },
  { date: "22.04.2026", type: "Кредитный платёж", amount: "−3 500 000 сум", in: false, counterparty: "SQB" },
  { date: "21.04.2026", type: "Поступление", amount: "+2 100 000 сум", in: true, counterparty: "ТОО МегаТрейд" },
  { date: "20.04.2026", type: "Списание", amount: "−650 000 сум", in: false, counterparty: "Аренда офиса" },
  { date: "19.04.2026", type: "Поступление", amount: "+9 400 000 сум", in: true, counterparty: "ООО Comfort Home" },
  { date: "18.04.2026", type: "Списание", amount: "−2 200 000 сум", in: false, counterparty: "Зарплата" },
  { date: "17.04.2026", type: "Поступление", amount: "+3 300 000 сум", in: true, counterparty: "ИП Мирзаев Р." },
  { date: "16.04.2026", type: "Списание", amount: "−1 100 000 сум", in: false, counterparty: "Логистика" },
];

// ─── Small components ─────────────────────────────────────────────────────────

function ScoreBar({ score }: { score: number }) {
  const color = score >= 70 ? "#38a169" : score >= 50 ? "#d69e2e" : "#e53e3e";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <div style={{ width: 72, height: 6, borderRadius: 3, background: "#edf2f7", overflow: "hidden", flexShrink: 0 }}>
        <div style={{ width: `${score}%`, height: "100%", background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontWeight: 700, color, fontSize: "0.9rem", minWidth: 24 }}>{score}</span>
    </div>
  );
}

function ScoreDelta({ delta }: { delta: number }) {
  if (delta === 0) return <span style={{ color: "#5f7083", fontSize: "0.85rem" }}>—</span>;
  const up = delta > 0;
  return (
    <span style={{ color: up ? "#38a169" : "#e53e3e", fontWeight: 700, fontSize: "0.9rem" }}>
      {up ? "↑" : "↓"} {Math.abs(delta)}
    </span>
  );
}

function ScoreHistogram() {
  const max = Math.max(...SCORE_DIST.map((d) => d.count));
  const W = 300, H = 130, barW = 40, gap = 18;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H + 28}`} preserveAspectRatio="xMidYMid meet">
      {SCORE_DIST.map((d, i) => {
        const barH = (d.count / max) * H;
        const x = i * (barW + gap) + 8;
        const y = H - barH;
        return (
          <g key={d.label}>
            <rect x={x} y={y} width={barW} height={barH} rx={6} fill={d.color} opacity={0.88} />
            <text x={x + barW / 2} y={y - 6} textAnchor="middle" fontSize={11} fill="#5f7083" fontWeight={700}>{d.count}</text>
            <text x={x + barW / 2} y={H + 20} textAnchor="middle" fontSize={9.5} fill="#5f7083">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

function ScoreTrendLine() {
  const n = MONTHLY_SCORE.length;
  const W = 340, H = 130, padX = 24, padY = 12;
  const minV = Math.min(...MONTHLY_SCORE) - 8;
  const maxV = Math.max(...MONTHLY_SCORE) + 8;
  const stepX = (W - padX * 2) / (n - 1);

  const pts = MONTHLY_SCORE.map((v, i): [number, number] => [
    padX + i * stepX,
    padY + (1 - (v - minV) / (maxV - minV)) * (H - padY * 2),
  ]);

  const pathD = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const areaD = `${pathD} L ${pts[n - 1][0].toFixed(1)} ${H} L ${pts[0][0].toFixed(1)} ${H} Z`;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H + 24}`} preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0d3b66" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#0d3b66" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#trendFill)" />
      <path d={pathD} fill="none" stroke="#0d3b66" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      {pts.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={i === n - 1 ? 5 : 3} fill={i === n - 1 ? "#0d3b66" : "#4a90c4"} />
          <text x={x} y={H + 18} textAnchor="middle" fontSize={9} fill="#5f7083">{MONTHS[i]}</text>
        </g>
      ))}
      <text x={pts[n - 1][0] + 8} y={pts[n - 1][1] + 4} fontSize={11} fill="#0d3b66" fontWeight={800}>{MONTHLY_SCORE[n - 1]}</text>
    </svg>
  );
}

const ALERT_STYLE: Record<AlertLevel, { bg: string; border: string; icon: string; text: string }> = {
  green:  { bg: "#f0fff4", border: "#c6f6d5", icon: "🟢", text: "#276749" },
  yellow: { bg: "#fffbeb", border: "#feebc8", icon: "🟡", text: "#7b5e00" },
  red:    { bg: "#fff5f5", border: "#fed7d7", icon: "🔴", text: "#9b2c2c" },
};

function AlertStrip({ companies, onSelect }: { companies: Company[]; onSelect: (c: Company) => void }) {
  const alerted = companies.filter((c) => c.alert !== null);
  if (alerted.length === 0) return null;
  return (
    <div style={{ display: "grid", gap: "0.6rem" }}>
      {alerted.map((c) => {
        const s = ALERT_STYLE[c.alert!];
        return (
          <button
            key={c.id}
            onClick={() => onSelect(c)}
            style={{ display: "flex", alignItems: "center", gap: "0.85rem", padding: "0.9rem 1.1rem", borderRadius: "0.9rem", background: s.bg, border: `1px solid ${s.border}`, cursor: "pointer", textAlign: "left", width: "100%" }}
          >
            <span style={{ fontSize: "1.25rem", flexShrink: 0 }}>{s.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontWeight: 700, color: s.text }}>{c.name}</span>
              <span style={{ color: s.text, marginLeft: "0.5rem", fontSize: "0.92rem" }}>— {c.alertText}</span>
            </div>
            <span style={{ fontSize: "0.8rem", color: s.text, opacity: 0.7, flexShrink: 0 }}>открыть →</span>
          </button>
        );
      })}
    </div>
  );
}

function CompanyDetail({ company, onClose }: { company: Company; onClose: () => void }) {
  const kpis = [
    { label: "Кредитный скор", value: String(company.score) },
    { label: "Изменение за месяц", value: `${company.scoreDelta > 0 ? "+" : ""}${company.scoreDelta}` },
    { label: "Оборот за неделю", value: `${company.weeklyRevenue} сум` },
    { label: "Текущий лимит", value: `${company.limit} сум` },
  ];
  return (
    <SectionCard
      title={company.name}
      description={`${company.industry} · Скор: ${company.score} · Последняя активность: ${company.lastSeen}`}
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.75rem", marginBottom: "1.4rem" }}>
        {kpis.map((k) => (
          <div key={k.label} style={{ padding: "0.85rem 1rem", borderRadius: "0.75rem", background: "#f7fafc", border: "1px solid #edf2f7" }}>
            <div style={{ fontSize: "0.78rem", color: "#5f7083", marginBottom: "0.2rem" }}>{k.label}</div>
            <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#10243d" }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#10243d", marginBottom: "0.75rem" }}>Последние 10 операций</div>
      <DataTable
        columns={["Дата", "Тип", "Сумма", "Контрагент"]}
        rows={MOCK_OPERATIONS.map((op) => [
          op.date,
          op.type,
          <span style={{ fontWeight: 700, color: op.in ? "#38a169" : "#e53e3e" }}>{op.amount}</span>,
          op.counterparty,
        ])}
      />

      <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem", flexWrap: "wrap", alignItems: "center" }}>
        <Button variant="primary">Полный отчёт</Button>
        <Button variant="secondary">Изменить лимит</Button>
        <Button variant="secondary">Связаться с компанией</Button>
        <button
          onClick={onClose}
          style={{ marginLeft: "auto", padding: "0.7rem 1rem", borderRadius: "0.875rem", border: "1px solid #dfe7f0", background: "transparent", cursor: "pointer", color: "#5f7083", fontSize: "0.9rem" }}
        >
          Закрыть ✕
        </button>
      </div>
    </SectionCard>
  );
}

const ADD_FIELDS = ["ИНН компании", "Наименование", "Отрасль", "Оборотный капитал", "Дебиторская задолженность", "Кредиторская задолженность", "Чистая прибыль за год"];

function AddCompanyForm({ onClose }: { onClose: () => void }) {
  return (
    <SectionCard title="Подключить новую компанию" description="Введите реквизиты для добавления в мониторинг">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.75rem" }}>
        {ADD_FIELDS.map((field) => (
          <div key={field}>
            <label style={{ display: "block", fontSize: "0.8rem", color: "#5f7083", marginBottom: "0.35rem" }}>{field}</label>
            <input
              placeholder={field}
              style={{ width: "100%", padding: "0.7rem 0.9rem", borderRadius: "0.65rem", border: "1px solid #dfe7f0", fontSize: "0.9rem", color: "#10243d", boxSizing: "border-box", background: "#f7fafc", outline: "none" }}
            />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.1rem" }}>
        <Button variant="primary">Подключить</Button>
        <Button variant="secondary" onClick={onClose}>Отмена</Button>
      </div>
    </SectionCard>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<CompanyStatus, string> = { approve: "Одобрить", review: "На проверке", reject: "Отказать" };
const STATUS_TONE: Record<CompanyStatus, "good" | "warn" | "bad"> = { approve: "good", review: "warn", reject: "bad" };

export function BankDashboardPage() {
  const [selected, setSelected] = useState<Company | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const riskCount = COMPANIES.filter((c) => c.score < 50).length;

  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      {/* Заголовок */}
      <div>
        <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.09em", color: "#5f7083", marginBottom: "0.3rem" }}>Банковский портфель</div>
        <h1 style={{ margin: 0, fontSize: "1.65rem", fontWeight: 800, color: "#10243d" }}>Мониторинг компаний</h1>
        <p style={{ margin: "0.3rem 0 0", color: "#5f7083", fontSize: "0.95rem" }}>
          Сводка по всем подключённым компаниям — скоры, риски, активность и кредитные заявки.
        </p>
      </div>

      {/* KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
        <div style={{ padding: "1.15rem 1.3rem", borderRadius: "1.1rem", background: "linear-gradient(135deg, #0d3b66 0%, #1a5c9a 100%)", color: "#fff" }}>
          <div style={{ fontSize: "0.78rem", opacity: 0.75, marginBottom: "0.3rem" }}>Компаний подключено</div>
          <div style={{ fontSize: "2.2rem", fontWeight: 800, lineHeight: 1 }}>47</div>
          <div style={{ fontSize: "0.82rem", opacity: 0.8, marginTop: "0.4rem" }}>активных за 7 дней: 38</div>
        </div>
        <div style={{ padding: "1.15rem 1.3rem", borderRadius: "1.1rem", background: "linear-gradient(135deg, #1a5e38 0%, #2ecc71 100%)", color: "#fff" }}>
          <div style={{ fontSize: "0.78rem", opacity: 0.75, marginBottom: "0.3rem" }}>Общий портфель</div>
          <div style={{ fontSize: "2.2rem", fontWeight: 800, lineHeight: 1 }}>2.34 млрд</div>
          <div style={{ fontSize: "0.82rem", opacity: 0.8, marginTop: "0.4rem" }}>суммарный объём кредитов</div>
        </div>
        <div style={{ padding: "1.15rem 1.3rem", borderRadius: "1.1rem", background: "linear-gradient(135deg, #9b2c2c 0%, #e53e3e 100%)", color: "#fff" }}>
          <div style={{ fontSize: "0.78rem", opacity: 0.75, marginBottom: "0.3rem" }}>Компаний под риском</div>
          <div style={{ fontSize: "2.2rem", fontWeight: 800, lineHeight: 1 }}>{riskCount}</div>
          <div style={{ fontSize: "0.82rem", opacity: 0.8, marginTop: "0.4rem" }}>скор ниже 50</div>
        </div>
        <div style={{ padding: "1.15rem 1.3rem", borderRadius: "1.1rem", background: "linear-gradient(135deg, #7b4f00 0%, #d69e2e 100%)", color: "#fff" }}>
          <div style={{ fontSize: "0.78rem", opacity: 0.75, marginBottom: "0.3rem" }}>Новых заявок на кредит</div>
          <div style={{ fontSize: "2.2rem", fontWeight: 800, lineHeight: 1 }}>3</div>
          <div style={{ fontSize: "0.82rem", opacity: 0.8, marginTop: "0.4rem" }}>ожидают рассмотрения</div>
        </div>
      </div>

      {/* Алерты */}
      <SectionCard title="Уведомления" description="Автоматические сигналы от системы — нажмите чтобы открыть карточку компании">
        <AlertStrip companies={COMPANIES} onSelect={setSelected} />
      </SectionCard>

      {/* Графики */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <SectionCard title="Распределение по скору" description="Сколько компаний в каждой зоне риска">
          <ScoreHistogram />
        </SectionCard>
        <SectionCard title="Динамика среднего скора" description="Средний скор по портфелю за последние 12 месяцев">
          <ScoreTrendLine />
        </SectionCard>
      </div>

      {/* Быстрые действия */}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <Button variant="primary" onClick={() => { setShowAdd(!showAdd); setSelected(null); }}>
          {showAdd ? "✕ Отмена" : "+ Подключить компанию"}
        </Button>
        <Button variant="secondary">Сформировать отчёт</Button>
        <Button variant="secondary">Экспорт в Excel</Button>
      </div>

      {showAdd && <AddCompanyForm onClose={() => setShowAdd(false)} />}

      {/* Карточка компании */}
      {selected && <CompanyDetail company={selected} onClose={() => setSelected(null)} />}

      {/* Таблица компаний */}
      <SectionCard title="Все компании" description="Нажмите на строку чтобы открыть детальную карточку">
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Компания", "Отрасль", "Скор", "Изм. за месяц", "Оборот нед.", "Лимит", "Рекомендация", "Активность"].map((col) => (
                  <th key={col} style={{ textAlign: "left", padding: "0.8rem 0.7rem", color: "#5f7083", fontSize: "0.82rem", borderBottom: "2px solid #dfe7f0", whiteSpace: "nowrap" }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPANIES.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => { setSelected(c); setShowAdd(false); }}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "#f0f6fc"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}
                >
                  <td style={{ padding: "0.95rem 0.7rem", borderBottom: "1px solid #edf2f7" }}>
                    <div style={{ fontWeight: 700, color: "#10243d", fontSize: "0.95rem" }}>{c.name}</div>
                    {c.alert && (
                      <div style={{ fontSize: "0.74rem", color: ALERT_STYLE[c.alert].text, marginTop: "0.2rem" }}>
                        {ALERT_STYLE[c.alert].icon} {c.alertText}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "0.95rem 0.7rem", borderBottom: "1px solid #edf2f7", color: "#5f7083", fontSize: "0.88rem" }}>{c.industry}</td>
                  <td style={{ padding: "0.95rem 0.7rem", borderBottom: "1px solid #edf2f7" }}><ScoreBar score={c.score} /></td>
                  <td style={{ padding: "0.95rem 0.7rem", borderBottom: "1px solid #edf2f7" }}><ScoreDelta delta={c.scoreDelta} /></td>
                  <td style={{ padding: "0.95rem 0.7rem", borderBottom: "1px solid #edf2f7", fontSize: "0.88rem", color: "#10243d" }}>{c.weeklyRevenue} сум</td>
                  <td style={{ padding: "0.95rem 0.7rem", borderBottom: "1px solid #edf2f7", fontSize: "0.88rem", color: "#10243d" }}>{c.limit} сум</td>
                  <td style={{ padding: "0.95rem 0.7rem", borderBottom: "1px solid #edf2f7" }}>
                    <StatusBadge tone={STATUS_TONE[c.status]}>{STATUS_LABEL[c.status]}</StatusBadge>
                  </td>
                  <td style={{ padding: "0.95rem 0.7rem", borderBottom: "1px solid #edf2f7", fontSize: "0.83rem", color: "#5f7083" }}>{c.lastSeen}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
