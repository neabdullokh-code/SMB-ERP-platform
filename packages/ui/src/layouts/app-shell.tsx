import type { ReactNode } from "react";

export interface NavItem {
  href: string;
  label: string;
}

export interface NavGroup {
  label: string;
  icon?: string;
  items: NavItem[];
}

export function AppShell({
  title,
  subtitle,
  navItems,
  navGroups,
  children
}: {
  title: string;
  subtitle: string;
  navItems?: NavItem[];
  navGroups?: NavGroup[];
  children: ReactNode;
}) {
  const groups: NavGroup[] = navGroups ?? [
    {
      label: "Workspace",
      items: navItems ?? []
    }
  ];

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
            backdropFilter: "blur(12px)",
            overflowY: "auto"
          }}
        >
          <div style={{ marginBottom: "2rem" }}>
            <div style={{ fontWeight: 800, fontSize: "1.1rem" }}>SQB Business OS</div>
            <p style={{ margin: "0.35rem 0 0", color: "#5f7083" }}>{subtitle}</p>
          </div>
          <nav style={{ display: "grid", gap: "1.25rem" }}>
            {groups.map((group) => (
              <div key={group.label} style={{ display: "grid", gap: "0.4rem" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    padding: "0 0.25rem",
                    color: "#5f7083",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em"
                  }}
                >
                  {group.icon ? <span aria-hidden="true">{group.icon}</span> : null}
                  <span>{group.label}</span>
                </div>
                <div style={{ display: "grid", gap: "0.35rem" }}>
                  {group.items.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      style={{
                        padding: "0.65rem 0.85rem",
                        borderRadius: "0.75rem",
                        color: "#10243d",
                        textDecoration: "none",
                        background: "#ffffff",
                        border: "1px solid #dde6f0",
                        fontSize: "0.9rem"
                      }}
                    >
                      {item.label}
                    </a>
                  ))}
                </div>
              </div>
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
