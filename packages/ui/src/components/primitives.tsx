import type {
  ChangeEvent,
  CSSProperties,
  MouseEventHandler,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes
} from "react";

type Tone = "neutral" | "good" | "warn" | "bad";

const toneMap: Record<Tone, { background: string; color: string }> = {
  neutral: { background: "#e9eef4", color: "#26364a" },
  good: { background: "#d9f4e5", color: "#19663c" },
  warn: { background: "#fff3d6", color: "#7f5c00" },
  bad: { background: "#fde0df", color: "#8b2621" }
};

export function Button({
  children,
  href,
  onClick,
  variant = "primary",
  type = "button",
  disabled,
  fullWidth
}: {
  children: ReactNode;
  href?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement | HTMLButtonElement>;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  fullWidth?: boolean;
}) {
  const shared: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0.75rem 1rem",
    borderRadius: "0.875rem",
    fontWeight: 600,
    textDecoration: "none",
    border: "1px solid #d4dce6",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.55 : 1,
    width: fullWidth ? "100%" : undefined,
    fontSize: "0.95rem"
  };

  let style: CSSProperties;
  if (variant === "primary") {
    style = { ...shared, background: "#0d3b66", color: "#ffffff", borderColor: "#0d3b66" };
  } else if (variant === "secondary") {
    style = { ...shared, background: "#ffffff", color: "#10243d" };
  } else if (variant === "danger") {
    style = { ...shared, background: "#ffffff", color: "#8b2621", borderColor: "#f1c2c0" };
  } else {
    style = { ...shared, background: "transparent", color: "#10243d", borderColor: "transparent" };
  }

  if (href && !disabled) {
    return (
      <a href={href} style={style} onClick={onClick}>
        {children}
      </a>
    );
  }

  return (
    <button type={type} disabled={disabled} style={style} onClick={onClick}>
      {children}
    </button>
  );
}

const inputBorderColor = "#d4dce6";

const inputBaseStyle: CSSProperties = {
  width: "100%",
  padding: "0.6rem 0.75rem",
  borderRadius: "0.65rem",
  border: `1px solid ${inputBorderColor}`,
  background: "#ffffff",
  color: "#10243d",
  fontSize: "0.95rem",
  boxSizing: "border-box"
};

export function FormField({
  label,
  hint,
  error,
  required,
  children
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label style={{ display: "grid", gap: "0.35rem" }}>
      <span style={{ color: "#10243d", fontSize: "0.85rem", fontWeight: 600 }}>
        {label}
        {required ? <span style={{ color: "#8b2621", marginLeft: 4 }}>*</span> : null}
      </span>
      {children}
      {hint && !error ? (
        <span style={{ color: "#5f7083", fontSize: "0.78rem" }}>{hint}</span>
      ) : null}
      {error ? (
        <span style={{ color: "#8b2621", fontSize: "0.78rem" }}>{error}</span>
      ) : null}
    </label>
  );
}

export function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
  error,
  disabled,
  min,
  step
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "number" | "date";
  error?: boolean;
  disabled?: boolean;
  min?: string | number;
  step?: string | number;
}) {
  return (
    <input
      type={type}
      value={value}
      disabled={disabled}
      min={min}
      step={step}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        ...inputBaseStyle,
        borderColor: error ? "#d88780" : inputBorderColor,
        background: disabled ? "#f3f5f8" : inputBaseStyle.background
      }}
    />
  );
}

export function Textarea({
  value,
  onChange,
  placeholder,
  rows = 3
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
} & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange" | "style">) {
  return (
    <textarea
      value={value}
      rows={rows}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ ...inputBaseStyle, fontFamily: "inherit", resize: "vertical" }}
    />
  );
}

export function Select({
  value,
  onChange,
  options,
  placeholder,
  error,
  disabled
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  error?: boolean;
  disabled?: boolean;
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, "value" | "onChange" | "style">) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
      style={{
        ...inputBaseStyle,
        borderColor: error ? "#d88780" : inputBorderColor,
        background: disabled ? "#f3f5f8" : inputBaseStyle.background
      }}
    >
      {placeholder ? (
        <option value="" disabled>
          {placeholder}
        </option>
      ) : null}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Callout({
  tone,
  title,
  children
}: {
  tone: Tone;
  title: string;
  children: ReactNode;
}) {
  const colors = toneMap[tone];
  return (
    <div
      style={{
        borderRadius: "0.9rem",
        padding: "0.9rem 1rem",
        background: colors.background,
        color: colors.color,
        border: "1px solid rgba(0,0,0,0.04)"
      }}
    >
      <div style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: "0.35rem" }}>{title}</div>
      <div style={{ fontSize: "0.85rem" }}>{children}</div>
    </div>
  );
}

export function StatusBadge({ tone, children }: { tone: Tone; children: ReactNode }) {
  const colors = toneMap[tone];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.35rem",
        padding: "0.35rem 0.6rem",
        borderRadius: "999px",
        background: colors.background,
        color: colors.color,
        fontWeight: 600,
        fontSize: "0.8rem"
      }}
    >
      {children}
    </span>
  );
}

export function SectionCard({
  title,
  description,
  children
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section
      style={{
        background: "#ffffff",
        border: "1px solid #dfe7f0",
        borderRadius: "1.25rem",
        padding: "1.25rem",
        boxShadow: "0 12px 32px rgba(16, 36, 61, 0.06)"
      }}
    >
      <div style={{ marginBottom: "1rem" }}>
        <h2 style={{ margin: 0, fontSize: "1.1rem", color: "#10243d" }}>{title}</h2>
        {description ? <p style={{ margin: "0.3rem 0 0", color: "#5f7083" }}>{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function KpiCard({
  label,
  value,
  helper
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div
      style={{
        background: "linear-gradient(180deg, #ffffff 0%, #f7fafc 100%)",
        border: "1px solid #dfe7f0",
        borderRadius: "1rem",
        padding: "1rem"
      }}
    >
      <p style={{ margin: 0, color: "#5f7083", fontSize: "0.85rem" }}>{label}</p>
      <div style={{ marginTop: "0.4rem", fontSize: "1.7rem", fontWeight: 700, color: "#10243d" }}>{value}</div>
      <p style={{ margin: "0.35rem 0 0", color: "#3d6c52", fontSize: "0.9rem" }}>{helper}</p>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "end", justifyContent: "space-between" }}>
      <div>
        <div style={{ textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.75rem", color: "#5f7083", fontWeight: 700 }}>{eyebrow}</div>
        <h1 style={{ margin: "0.3rem 0", fontSize: "2rem", color: "#10243d" }}>{title}</h1>
        <p style={{ margin: 0, color: "#5f7083", maxWidth: "62ch" }}>{description}</p>
      </div>
      {actions ? <div style={{ display: "flex", gap: "0.75rem" }}>{actions}</div> : null}
    </div>
  );
}

export function DataTable({
  columns,
  rows
}: {
  columns: string[];
  rows: Array<Array<ReactNode>>;
}) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column}
                style={{
                  textAlign: "left",
                  padding: "0.8rem 0.65rem",
                  color: "#5f7083",
                  fontSize: "0.82rem",
                  borderBottom: "1px solid #dfe7f0"
                }}
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  style={{
                    padding: "0.9rem 0.65rem",
                    color: "#10243d",
                    borderBottom: "1px solid #edf2f7",
                    verticalAlign: "top"
                  }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
