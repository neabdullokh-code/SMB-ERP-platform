import type { ReactNode } from "react";

export interface NavItem {
  href: string;
  label: string;
}

export function AppShell({
  title,
  subtitle,
  navItems,
  children
}: {
  title: string;
  subtitle: string;
  navItems: NavItem[];
  children: ReactNode;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #f4f7fb 0%, #eef4f8 100%)",
        color: "#10243d"
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", minHeight: "100vh" }}>
        <aside
          style={{
            borderRight: "1px solid #dbe5ef",
            padding: "1.5rem 1.25rem",
            background: "rgba(255,255,255,0.7)",
            backdropFilter: "blur(12px)"
          }}
        >
          <div style={{ marginBottom: "2rem" }}>
            <div style={{ fontWeight: 800, fontSize: "1.1rem" }}>SQB Business OS</div>
            <p style={{ margin: "0.35rem 0 0", color: "#5f7083" }}>{subtitle}</p>
          </div>
          <nav style={{ display: "grid", gap: "0.5rem" }}>
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                style={{
                  padding: "0.8rem 0.9rem",
                  borderRadius: "0.85rem",
                  color: "#10243d",
                  textDecoration: "none",
                  background: "#ffffff",
                  border: "1px solid #dde6f0"
                }}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </aside>
        <main style={{ padding: "1.5rem" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gap: "1.5rem" }}>
            <header
              style={{
                padding: "1rem 1.25rem",
                borderRadius: "1rem",
                background: "#0d3b66",
                color: "#ffffff"
              }}
            >
              <div style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.8 }}>Active workspace</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, marginTop: "0.35rem" }}>{title}</div>
            </header>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

