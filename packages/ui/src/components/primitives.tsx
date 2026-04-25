import type { CSSProperties, MouseEventHandler, ReactNode } from "react";

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
  variant = "primary"
}: {
  children: ReactNode;
  href?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement | HTMLButtonElement>;
  variant?: "primary" | "secondary";
}) {
  const shared: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0.75rem 1rem",
    borderRadius: "0.875rem",
    fontWeight: 600,
    textDecoration: "none",
    border: "1px solid #d4dce6"
  };

  const style =
    variant === "primary"
      ? { ...shared, background: "#0d3b66", color: "#ffffff", borderColor: "#0d3b66" }
      : { ...shared, background: "#ffffff", color: "#10243d" };

  if (href) {
    return (
      <a href={href} style={style} onClick={onClick}>
        {children}
      </a>
    );
  }

  return <button style={style} onClick={onClick}>{children}</button>;
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
