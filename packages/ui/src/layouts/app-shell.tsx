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
        background: "linear-gradient(180deg, #0b1220 0%, #101a2c 100%)",
        color: "#e7edf5"
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", minHeight: "100vh" }}>
        <aside
          style={{
            borderRight: "1px solid #1e2a40",
            padding: "1.5rem 1.25rem",
            background: "rgba(14,23,38,0.82)",
            backdropFilter: "blur(12px)",
            overflowY: "auto"
          }}
        >
          <div style={{ marginBottom: "2rem" }}>
            <div style={{ fontWeight: 800, fontSize: "1.1rem" }}>SQB Business OS</div>
            <p style={{ margin: "0.35rem 0 0", color: "#8a94a7" }}>{subtitle}</p>
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
                    color: "#8a94a7",
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
                        color: "#e7edf5",
                        textDecoration: "none",
                        background: "#101a2c",
                        border: "1px solid #1e2a40",
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
                background: "linear-gradient(135deg, #0e2a47 0%, #d18a2b 100%)",
                color: "#fff8ed"
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
