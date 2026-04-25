// Shared components + icons + helpers. Exposed on window for cross-file use.
const { useState, useEffect, useRef, useMemo, useCallback } = React;

/* ---------------- icons (tiny inline SVG set) ---------------- */
const I = ({ d, size = 15, stroke = 1.6, fill = "none", style, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor"
       strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
       className={className} style={style}>
    {typeof d === "string" ? <path d={d} /> : d}
  </svg>
);

const Icon = {
  Home:      (p) => <I {...p} d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z" />,
  Box:       (p) => <I {...p} d={<><path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/></>} />,
  Factory:   (p) => <I {...p} d={<><path d="M3 21V10l5 3V10l5 3V10l5 3v8z"/><path d="M3 21h18"/></>} />,
  Wrench:    (p) => <I {...p} d="M14.7 6.3a4 4 0 0 0-5.4 5.4l-6.3 6.3 2.4 2.4 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.2 2.2-2-2 2.2-2.2z" />,
  Coin:      (p) => <I {...p} d={<><circle cx="12" cy="12" r="9"/><path d="M8 12h8M12 8v8"/></>} />,
  Chart:     (p) => <I {...p} d={<><path d="M3 3v18h18"/><path d="M7 15l4-4 4 3 5-7"/></>} />,
  Users:     (p) => <I {...p} d={<><circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-3 3.5-5 7-5s7 2 7 5"/><circle cx="17" cy="9" r="3"/><path d="M15 20c0-2.5 2-4.5 5-4.5"/></>} />,
  Gear:      (p) => <I {...p} d={<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></>} />,
  File:      (p) => <I {...p} d={<><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/></>} />,
  Bank:      (p) => <I {...p} d={<><path d="M3 10l9-5 9 5"/><path d="M5 10v8M9 10v8M15 10v8M19 10v8"/><path d="M3 21h18"/></>} />,
  Search:    (p) => <I {...p} d={<><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></>} />,
  Bell:      (p) => <I {...p} d={<><path d="M6 8a6 6 0 1 1 12 0c0 7 3 7 3 10H3c0-3 3-3 3-10z"/><path d="M10 21a2 2 0 0 0 4 0"/></>} />,
  Help:      (p) => <I {...p} d={<><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4"/><circle cx="12" cy="17" r=".6" fill="currentColor"/></>} />,
  ChevDown:  (p) => <I {...p} d="M6 9l6 6 6-6" />,
  ChevRight: (p) => <I {...p} d="M9 6l6 6-6 6" />,
  ChevLeft:  (p) => <I {...p} d="M15 6l-6 6 6 6" />,
  ChevUp:    (p) => <I {...p} d="M6 15l6-6 6 6" />,
  Plus:      (p) => <I {...p} d="M12 5v14M5 12h14" />,
  Minus:     (p) => <I {...p} d="M5 12h14" />,
  X:         (p) => <I {...p} d="M6 6l12 12M18 6L6 18" />,
  Check:     (p) => <I {...p} d="M5 12.5l4 4 10-10" />,
  Sparkle:   (p) => <I {...p} d={<><path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8z"/><path d="M19 15l.9 2 2 .9-2 .9-.9 2-.9-2-2-.9 2-.9z"/></>} />,
  Upload:    (p) => <I {...p} d={<><path d="M12 16V4"/><path d="M6 10l6-6 6 6"/><path d="M4 20h16"/></>} />,
  Download:  (p) => <I {...p} d={<><path d="M12 4v12"/><path d="M18 10l-6 6-6-6"/><path d="M4 20h16"/></>} />,
  Filter:    (p) => <I {...p} d="M4 5h16l-6 8v5l-4 2v-7z" />,
  Sort:      (p) => <I {...p} d="M7 4v16m0 0l-3-3m3 3l3-3M17 20V4m0 0l-3 3m3-3l3 3" />,
  More:      (p) => <I {...p} d={<><circle cx="5" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="19" cy="12" r="1.4" fill="currentColor"/></>} />,
  Globe:     (p) => <I {...p} d={<><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></>} />,
  Doc:       (p) => <I {...p} d={<><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/></>} />,
  Scan:      (p) => <I {...p} d={<><path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2"/><path d="M4 12h16"/></>} />,
  Bolt:      (p) => <I {...p} d="M13 2L3 14h7l-1 8 10-12h-7z" />,
  Arrow:     (p) => <I {...p} d="M5 12h14M13 6l6 6-6 6" />,
  ArrowUpR:  (p) => <I {...p} d="M7 17L17 7M8 7h9v9" />,
  Refresh:   (p) => <I {...p} d={<><path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 4v5h-5"/></>} />,
  Paperclip: (p) => <I {...p} d="M21 12l-8.5 8.5a5 5 0 0 1-7-7l9-9a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3l7.5-7.5" />,
  Pin:       (p) => <I {...p} d={<><circle cx="12" cy="10" r="3"/><path d="M12 22c5-6 8-10 8-12a8 8 0 1 0-16 0c0 2 3 6 8 12z"/></>} />,
  Alert:     (p) => <I {...p} d={<><path d="M12 3l10 18H2z"/><path d="M12 10v5"/><circle cx="12" cy="18" r=".7" fill="currentColor"/></>} />,
  Shield:    (p) => <I {...p} d={<><path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/></>} />,
  Info:      (p) => <I {...p} d={<><circle cx="12" cy="12" r="9"/><path d="M12 8v.5M12 11v6"/></>} />,
  Sun:       (p) => <I {...p} d={<><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/></>} />,
  Moon:      (p) => <I {...p} d="M21 13a9 9 0 1 1-10-10 7 7 0 0 0 10 10z" />,
  Logout:    (p) => <I {...p} d={<><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"/><path d="M10 17l-5-5 5-5"/><path d="M15 12H5"/></>} />,
  Lock:      (p) => <I {...p} d={<><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></>} />,
  Mail:      (p) => <I {...p} d={<><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></>} />,
  Phone:     (p) => <I {...p} d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />,
  Pencil:    (p) => <I {...p} d={<><path d="M4 20h4l10-10-4-4L4 16z"/><path d="M14 6l4 4"/></>} />,
  Copy:      (p) => <I {...p} d={<><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/></>} />,
  Eye:       (p) => <I {...p} d={<><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></>} />,
  Trash:     (p) => <I {...p} d={<><path d="M4 7h16M10 7V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13"/></>} />,
  Link:      (p) => <I {...p} d={<><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></>} />,
  Play:      (p) => <I {...p} d="M6 4l14 8-14 8z" fill="currentColor" stroke="none" />,
  Hash:      (p) => <I {...p} d="M5 9h14M5 15h14M10 3L8 21M16 3l-2 18" />,
  Map:       (p) => <I {...p} d={<><path d="M9 3v18M15 6v15M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z"/></>} />,
  Inbox:     (p) => <I {...p} d={<><path d="M3 13l3-8h12l3 8"/><path d="M3 13v6a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6"/><path d="M3 13h5l1 3h6l1-3h5"/></>} />,
  Database:  (p) => <I {...p} d={<><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5"/><path d="M3 12c0 1.7 4 3 9 3s9-1.3 9-3"/></>} />,
  Layers:    (p) => <I {...p} d={<><path d="M12 2l10 6-10 6L2 8z"/><path d="M2 14l10 6 10-6"/></>} />,
  Handshake: (p) => <I {...p} d={<><path d="M2 12l4-4 3 3 3-3 3 3 4-4 3 3-7 7-3-2-3 2-3-2-4 2z"/></>} />,
  Ledger:    (p) => <I {...p} d={<><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 3v18M12 8h5M12 12h5M12 16h3"/></>} />,
  Ticket:    (p) => <I {...p} d={<><path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z"/><path d="M10 8v8"/></>} />,
  UserPlus:  (p) => <I {...p} d={<><circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-3 3.5-5 7-5 1.5 0 2.8.4 4 1"/><path d="M18 10v6M15 13h6"/></>} />,
  FileDoc:   (p) => <I {...p} d={<><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/></>} />,
  Edit:      (p) => <I {...p} d={<><path d="M4 20h4l10-10-4-4L4 16z"/><path d="M14 6l4 4"/></>} />,
};

/* ---------------- helpers ---------------- */
const fmtUZS = (n) => {
  if (n == null) return "—";
  const s = Math.abs(n).toLocaleString("en-US").replace(/,/g, " ");
  return (n < 0 ? "−" : "") + s;
};
const fmtShort = (n) => {
  const abs = Math.abs(n);
  if (abs >= 1e9) return (n/1e9).toFixed(1).replace(/\.0$/,"") + "B";
  if (abs >= 1e6) return (n/1e6).toFixed(1).replace(/\.0$/,"") + "M";
  if (abs >= 1e3) return (n/1e3).toFixed(1).replace(/\.0$/,"") + "K";
  return String(n);
};

/* ---------------- small components ---------------- */
function Button({ children, variant="default", size, icon, iconRight, onClick, disabled, className="", ...rest }) {
  const cls = ["btn"];
  if (variant === "primary") cls.push("primary");
  if (variant === "ghost") cls.push("ghost");
  if (variant === "destructive") cls.push("destructive");
  if (variant === "solid-destructive") cls.push("solid-destructive");
  if (variant === "good") cls.push("good");
  if (variant === "ai") cls.push("ai");
  if (size) cls.push(size);
  cls.push(className);
  return (
    <button className={cls.join(" ")} onClick={onClick} disabled={disabled} {...rest}>
      {icon}
      {children}
      {iconRight}
    </button>
  );
}

function Pill({ tone="neutral", children, dot=true, className="" }) {
  const tclass = { good: "good", warn: "warn", bad: "bad", info: "info", ai: "ai", "solid-ink": "solid-ink" }[tone] || "";
  return (
    <span className={`pill ${tclass} ${className}`}>
      {dot && <span className="dot" />}
      {children}
    </span>
  );
}

function ScorePill({ value, trend }) {
  const tone = value >= 80 ? "good" : value >= 60 ? "warn" : "bad";
  return (
    <span className={`score-pill ${tone}`}>
      <span className="num">{value}</span>
      <span>/100</span>
      {trend && <span className="trend">{trend}</span>}
    </span>
  );
}

function AIChip({ label="AI" }) {
  return (
    <span className="pill ai" style={{padding: "1px 7px"}}>
      <Icon.Sparkle size={10} />
      {label}
    </span>
  );
}

function Toggle({ on, onChange }) {
  return <div className={`toggle ${on ? "on":""}`} onClick={() => onChange(!on)} role="switch" aria-checked={on} />;
}

function Field({ label, hint, children, required }) {
  return (
    <div className="field">
      {label && <label>{label}{required && <span className="bad" style={{marginLeft:4}}>*</span>}</label>}
      {children}
      {hint && <div className="muted" style={{fontSize:11}}>{hint}</div>}
    </div>
  );
}

function Banner({ tone="info", title, children, icon, action, onClose }) {
  const ico = {
    info: <Icon.Info size={16}/>, good: <Icon.Check size={16}/>,
    warn: <Icon.Alert size={16}/>, bad: <Icon.Alert size={16}/>,
    ai: <Icon.Sparkle size={16}/>,
  }[tone];
  return (
    <div className={`banner ${tone}`}>
      <span className="ico">{icon || ico}</span>
      <div style={{flex:1}}>
        {title && <div className="title">{title}</div>}
        {children && <div className="desc">{children}</div>}
      </div>
      {action}
      {onClose && <button className="icon-btn" onClick={onClose} style={{color: "inherit"}}><Icon.X size={14}/></button>}
    </div>
  );
}

/* ---------------- Sparkline / Line / Bar / Donut (inline SVG) ---------------- */
function Sparkline({ data, width=64, height=22, stroke="var(--ink)", fill=null, strokeWidth=1.2 }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);
  const pts = data.map((v,i) => [i*stepX, height - ((v-min)/range) * (height-2) - 1]);
  const path = pts.map((p,i) => (i===0?"M":"L") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const area = path + ` L${width} ${height} L0 ${height} Z`;
  return (
    <svg width={width} height={height}>
      {fill && <path d={area} fill={fill} opacity="0.4"/>}
      <path d={path} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round"/>
    </svg>
  );
}

function LineChart({ series, width=600, height=200, categories, yTicks=4, colors, showArea=false, padding=[28,14,24,40] }) {
  const [pt, pr, pb, pl] = padding;
  const w = width - pl - pr, h = height - pt - pb;
  const all = series.flatMap(s => s.data);
  const min = Math.min(0, ...all), max = Math.max(...all) * 1.08 || 1;
  const range = max - min || 1;
  const stepX = w / (series[0].data.length - 1 || 1);
  const C = colors || ["var(--ink)", "var(--ai)", "var(--good)", "var(--bad)"];
  const yVals = Array.from({length:yTicks+1}, (_,i) => min + (range*i)/yTicks);
  return (
    <svg width={width} height={height} style={{display:"block"}}>
      {/* grid */}
      {yVals.map((v,i) => {
        const y = pt + h - (v-min)/range * h;
        return (
          <g key={i}>
            <line x1={pl} x2={pl+w} y1={y} y2={y} stroke="var(--line-2)" />
            <text x={pl-6} y={y+3} fontSize="10" fill="var(--muted)" textAnchor="end" fontFamily="var(--mono)">{fmtShort(v)}</text>
          </g>
        );
      })}
      {/* categories */}
      {categories && categories.map((c,i) => (
        <text key={i} x={pl + i*stepX} y={height - 6} fontSize="10" fill="var(--muted)" textAnchor="middle" fontFamily="var(--mono)">{c}</text>
      ))}
      {/* series */}
      {series.map((s, si) => {
        const pts = s.data.map((v,i) => [pl + i*stepX, pt + h - (v-min)/range * h]);
        const path = pts.map((p,i) => (i===0?"M":"L") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
        const color = s.color || C[si % C.length];
        return (
          <g key={si}>
            {(showArea || s.area) && <path d={path + ` L${pl+w} ${pt+h} L${pl} ${pt+h} Z`} fill={color} opacity="0.08"/>}
            <path d={path} fill="none" stroke={color} strokeWidth={s.dashed ? 1.2 : 1.6} strokeDasharray={s.dashed?"4 3":undefined} strokeLinejoin="round" strokeLinecap="round"/>
            {s.dots && pts.map((p,i) => <circle key={i} cx={p[0]} cy={p[1]} r="2.5" fill="var(--surface)" stroke={color} strokeWidth="1.4"/>)}
          </g>
        );
      })}
    </svg>
  );
}

function BarChart({ data, width=600, height=180, categories, color="var(--ink)", padding=[20,10,24,40] }) {
  const [pt, pr, pb, pl] = padding;
  const w = width - pl - pr, h = height - pt - pb;
  const max = Math.max(...data) * 1.1 || 1;
  const barW = w / data.length * 0.6;
  const step = w / data.length;
  return (
    <svg width={width} height={height}>
      {[0, 0.5, 1].map((f,i) => {
        const y = pt + h - f*h;
        return <g key={i}>
          <line x1={pl} x2={pl+w} y1={y} y2={y} stroke="var(--line-2)"/>
          <text x={pl-6} y={y+3} fontSize="10" fill="var(--muted)" textAnchor="end" fontFamily="var(--mono)">{fmtShort(max*f)}</text>
        </g>;
      })}
      {data.map((v,i) => {
        const bh = (v/max) * h;
        const x = pl + i*step + (step - barW)/2;
        const y = pt + h - bh;
        return <g key={i}>
          <rect x={x} y={y} width={barW} height={bh} fill={color} rx="1"/>
          {categories && <text x={pl + i*step + step/2} y={height-6} fontSize="10" fill="var(--muted)" textAnchor="middle" fontFamily="var(--mono)">{categories[i]}</text>}
        </g>;
      })}
    </svg>
  );
}

function StackedBar({ data, width=600, height=180, categories, colors=["var(--ink)","var(--ai)","var(--good)"], padding=[14,10,24,40] }) {
  // data: [[a,b,c], ...]
  const [pt, pr, pb, pl] = padding;
  const w = width - pl - pr, h = height - pt - pb;
  const totals = data.map(r => r.reduce((a,b)=>a+b,0));
  const max = Math.max(...totals) * 1.1 || 1;
  const step = w / data.length, barW = step * 0.6;
  return (
    <svg width={width} height={height}>
      {[0, 0.5, 1].map((f,i) => {
        const y = pt + h - f*h;
        return <line key={i} x1={pl} x2={pl+w} y1={y} y2={y} stroke="var(--line-2)"/>;
      })}
      {data.map((r, i) => {
        let yOff = 0;
        const x = pl + i*step + (step-barW)/2;
        return (
          <g key={i}>
            {r.map((v, j) => {
              const bh = (v/max) * h;
              yOff += bh;
              return <rect key={j} x={x} y={pt + h - yOff} width={barW} height={bh-0.5} fill={colors[j % colors.length]} />;
            })}
            {categories && <text x={pl + i*step + step/2} y={height-6} fontSize="10" fill="var(--muted)" textAnchor="middle" fontFamily="var(--mono)">{categories[i]}</text>}
          </g>
        );
      })}
    </svg>
  );
}

function Donut({ segments, size=120, thickness=18, center }) {
  const total = segments.reduce((a,b)=>a+b.value,0);
  const r = size/2, ri = r - thickness;
  let acc = 0;
  const arcs = segments.map((s,i) => {
    const start = acc / total * Math.PI * 2 - Math.PI/2;
    acc += s.value;
    const end = acc / total * Math.PI * 2 - Math.PI/2;
    const large = end - start > Math.PI ? 1 : 0;
    const x1 = r + Math.cos(start)*r, y1 = r + Math.sin(start)*r;
    const x2 = r + Math.cos(end)*r, y2 = r + Math.sin(end)*r;
    const x3 = r + Math.cos(end)*ri, y3 = r + Math.sin(end)*ri;
    const x4 = r + Math.cos(start)*ri, y4 = r + Math.sin(start)*ri;
    return <path key={i} fill={s.color}
      d={`M${x1} ${y1} A${r} ${r} 0 ${large} 1 ${x2} ${y2} L${x3} ${y3} A${ri} ${ri} 0 ${large} 0 ${x4} ${y4} Z`} />;
  });
  return (
    <svg width={size} height={size}>
      {arcs}
      {center && <foreignObject x="0" y="0" width={size} height={size}>
        <div style={{width:size, height:size, display:"grid", placeItems:"center", textAlign:"center"}}>{center}</div>
      </foreignObject>}
    </svg>
  );
}

/* ---------------- KPI ---------------- */
function Kpi({ label, value, unit, delta, deltaLabel, spark, trend="up" }) {
  return (
    <div className="kpi">
      <div className="label">{label}</div>
      <div className="value">{value}{unit && <span className="unit">{unit}</span>}</div>
      {(delta || deltaLabel) && (
        <div className={`delta ${trend}`}>
          <span>{trend === "up" ? "↑" : "↓"}</span>
          <span>{delta}</span>
          {deltaLabel && <><span className="sep">·</span><span style={{color:"var(--muted)"}}>{deltaLabel}</span></>}
        </div>
      )}
      {spark && <div className="spark">{spark}</div>}
    </div>
  );
}

/* ---------------- Arc gauge (simple SVG) ---------------- */
function ArcGauge({ value=0, max=100, size=80, thickness=8, color="var(--ai)", trackColor="var(--line)", label }) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value / max));
  const dash = c * pct;
  return (
    <div style={{position:"relative", width:size, height:size}}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} stroke={trackColor} strokeWidth={thickness} fill="none"/>
        <circle cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth={thickness} fill="none"
          strokeDasharray={`${dash} ${c - dash}`} strokeDashoffset={c * 0.25} strokeLinecap="round"
          style={{transition:"stroke-dasharray 400ms ease"}}/>
      </svg>
      <div style={{position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column"}}>
        <div style={{fontSize: size * 0.26, fontWeight:600, color:"var(--ink)"}}>{value}</div>
        {label && <div style={{fontSize:10, color:"var(--muted)"}}>{label}</div>}
      </div>
    </div>
  );
}

/* ---------------- Modal / Drawer ---------------- */
function Modal({ open, onClose, title, footer, children, size }) {
  useEffect(() => {
    if (!open) return;
    const h = (e) => e.key === "Escape" && onClose && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div className={`modal ${size || ""}`} role="dialog">
        <div className="modal-head">
          <h2>{title}</h2>
          <span className="sp" />
          <button className="icon-btn" onClick={onClose}><Icon.X size={14}/></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </>
  );
}

function Drawer({ open, onClose, title, children, footer, wide }) {
  useEffect(() => {
    if (!open) return;
    const h = (e) => e.key === "Escape" && onClose && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <>
      <div className="scrim" onClick={onClose}/>
      <div className={`drawer ${wide ? "wide": ""}`}>
        <div className="drawer-head">
          <h2 style={{margin:0, fontSize:14}}>{title}</h2>
          <span className="sp"/>
          <button className="icon-btn" onClick={onClose}><Icon.X size={14}/></button>
        </div>
        <div className="drawer-body">{children}</div>
        {footer && <div className="drawer-foot">{footer}</div>}
      </div>
    </>
  );
}

/* ---------------- Tabs ---------------- */
function Tabs({ tabs, value, onChange }) {
  return (
    <div className="tabs">
      {tabs.map(t => (
        <button key={t.key} className={t.key === value ? "active" : ""} onClick={() => onChange(t.key)}>
          {t.label}
          {t.count != null && <span className="mono" style={{marginLeft:6, color:"var(--muted)", fontSize:10}}>{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

/* ---------------- Router ---------------- */
const CLEAN_ROUTE_PATHS = {
  "/login": "/login",
  "/otp": "/otp",
  "/forgot": "/forgot",
  "/terms": "/terms",
  "/onboarding": "/onboarding",
  "/bank/home": "/bank/home",
  "/bank/alerts": "/bank/alerts",
  "/bank/tenants": "/bank/tenants",
  "/bank/tenant": "/bank/tenant",
  "/bank/tenant-mgmt": "/bank/tenant-mgmt",
  "/bank/credit-queue": "/bank/credit-queue",
  "/bank/cross-sell": "/bank/cross-sell",
  "/bank/reports": "/bank/reports",
  "/bank/team": "/bank/team",
  "/bank/settings": "/bank/settings",
  "/bank/audit": "/bank/audit",
  "/search": "/search",
  "/smb/home": "/app/dashboard",
  "/smb/copilot": "/app/copilot",
  "/smb/inventory": "/app/inventory",
  "/smb/inventory/detail": "/app/inventory/detail",
  "/smb/inventory/scan": "/app/inventory/scan",
  "/smb/production": "/app/production",
  "/smb/production/order": "/app/production/order",
  "/smb/services": "/app/service-orders",
  "/smb/services/wo": "/app/service-orders/work-order",
  "/smb/finance/ledger": "/app/finance/ledger",
  "/smb/finance/invoices": "/app/finance/invoices",
  "/smb/finance/bills": "/app/finance/bills",
  "/smb/finance/cash": "/app/finance/cash",
  "/smb/documents/goods-receipts": "/app/documents/goods-receipts",
  "/smb/documents/goods-receipts/new": "/app/documents/goods-receipts/new",
  "/smb/documents/goods-issues": "/app/documents/goods-issues",
  "/smb/documents/goods-issues/new": "/app/documents/goods-issues/new",
  "/smb/documents/inventory-transfers": "/app/documents/inventory-transfers",
  "/smb/documents/inventory-transfers/new": "/app/documents/inventory-transfers/new",
  "/smb/documents/production-orders": "/app/documents/production-orders",
  "/smb/documents/production-orders/new": "/app/documents/production-orders/new",
  "/smb/reports": "/app/reports",
  "/smb/credit": "/app/credit",
  "/smb/loan": "/app/loan",
  "/smb/team": "/app/team",
  "/smb/settings": "/app/settings",
  "/smb/notifications": "/app/notifications",
};

const CLEAN_PATH_ROUTE_ALIASES = {
  "/app/finance": "/smb/finance/ledger",
  "/app/finance/ledger": "/smb/finance/ledger",
  "/app/finance/invoices": "/smb/finance/invoices",
  "/app/finance/bills": "/smb/finance/bills",
  "/app/finance/cash": "/smb/finance/cash",
  "/app/finance/accounts": "/smb/finance/ledger",
  "/app/finance/reports": "/smb/reports",
  "/app/finance/counterparties": "/smb/finance/invoices",
  "/app/finance/payments": "/smb/finance/bills",
};

const CLEAN_ROUTE_PATH_ALIASES = {
  "/smb/finance": "/app/finance",
  "/smb/finance/accounts": "/app/finance/accounts",
  "/smb/finance/reports": "/app/finance/reports",
  "/smb/finance/counterparties": "/app/finance/counterparties",
  "/smb/finance/payments": "/app/finance/payments",
};

const CLEAN_PATH_ROUTES = {
  ...Object.fromEntries(
    Object.entries(CLEAN_ROUTE_PATHS).map(([route, pathname]) => [pathname, route]),
  ),
  ...CLEAN_PATH_ROUTE_ALIASES,
};

function normalizeRoute(route) {
  if (!route) return "";
  return route.startsWith("/") ? route : `/${route}`;
}

function resolveRouteFromLocation() {
  const hashRoute = normalizeRoute((window.location.hash || "").replace(/^#/, ""));
  if (hashRoute) {
    return hashRoute;
  }

  const pathname = window.location.pathname.replace(/\/+$/, "") || "/";
  return CLEAN_PATH_ROUTES[pathname] || "/login";
}

function cleanPathForRoute(route) {
  const normalized = normalizeRoute(route);
  return CLEAN_ROUTE_PATHS[normalized] || CLEAN_ROUTE_PATH_ALIASES[normalized] || null;
}

function hrefForRoute(origin, route) {
  const normalized = normalizeRoute(route) || "/login";
  const cleanPath = cleanPathForRoute(normalized);
  if (!cleanPath) {
    return `${origin}/prototype/index.html#${normalized}`;
  }
  return `${origin}${cleanPath}`;
}

function emitRouteChange() {
  window.dispatchEvent(new Event("prototype-route-change"));
}

function navigateToRoute(route, options = {}) {
  const normalized = normalizeRoute(route) || "/login";
  const cleanPath = cleanPathForRoute(normalized);

  if (cleanPath) {
    const url = new URL(window.location.href);
    url.pathname = cleanPath;
    url.hash = "";
    const method = options.replace ? "replaceState" : "pushState";
    window.history[method]({ route: normalized }, "", url);
    emitRouteChange();
    return;
  }

  if (options.replace) {
    const url = new URL(window.location.href);
    url.hash = normalized;
    window.location.replace(url.toString());
    return;
  }

  window.location.hash = normalized;
}

function useHashRoute() {
  const [route, setRoute] = useState(() => resolveRouteFromLocation());
  useEffect(() => {
    const sync = () => setRoute(resolveRouteFromLocation());
    window.addEventListener("hashchange", sync);
    window.addEventListener("popstate", sync);
    window.addEventListener("prototype-route-change", sync);
    return () => {
      window.removeEventListener("hashchange", sync);
      window.removeEventListener("popstate", sync);
      window.removeEventListener("prototype-route-change", sync);
    };
  }, []);
  const go = useCallback((p, options) => {
    navigateToRoute(p, options);
  }, []);
  return [route, go];
}

/* expose */
Object.assign(window, {
  I, Icon, fmtUZS, fmtShort,
  Button, Pill, ScorePill, AIChip, Toggle, Field, Banner,
  Sparkline, LineChart, BarChart, StackedBar, Donut, Kpi, KpiAnimated: Kpi, ArcGauge,
  Modal, Drawer, Tabs, useHashRoute,
  PrototypeRouter: {
    cleanPathForRoute,
    hrefForRoute,
    navigateToRoute,
    resolveRouteFromLocation,
  },
});
