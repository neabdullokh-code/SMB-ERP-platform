import type { NavGroup, NavItem } from "@sqb/ui";

/**
 * Grouped navigation for the company portal sidebar. Groups mirror the 1C
 * "modules" concept: Warehouse, Production, Finance, etc. Each document
 * journal is a top-level sidebar link so users can jump straight into
 * Goods Receipts / Goods Issues / Transfers without drilling through a
 * parent page.
 */
export const companyNavGroups: NavGroup[] = [
  {
    label: "Overview",
    icon: "📊",
    items: [{ href: "/app/dashboard", label: "Dashboard" }]
  },
  {
    label: "Warehouse",
    icon: "📦",
    items: [
      { href: "/app/inventory", label: "Inventory" },
      { href: "/app/documents/goods-receipts", label: "Goods receipts" },
      { href: "/app/documents/goods-issues", label: "Goods issues" },
      { href: "/app/documents/inventory-transfers", label: "Transfers" }
    ]
  },
  {
    label: "Production",
    icon: "🏭",
    items: [
      { href: "/app/production", label: "Overview" },
      { href: "/app/documents/production-orders", label: "Production orders" }
    ]
  },
  {
    label: "Finance",
    icon: "💰",
    items: [
      { href: "/app/finance", label: "Dashboard" },
      { href: "/app/finance/invoices", label: "Invoices" },
      { href: "/app/finance/bills", label: "Bills" },
      { href: "/app/finance/ledger", label: "Ledger" },
      { href: "/app/finance/cash", label: "Cash flow" },
      { href: "/app/finance/payments", label: "Payments" },
      { href: "/app/finance/counterparties", label: "Counterparties" },
      { href: "/app/finance/accounts", label: "Chart of accounts" },
      { href: "/app/finance/reports", label: "Reports" }
    ]
  },
  {
    label: "Services",
    icon: "🛠️",
    items: [{ href: "/app/service-orders", label: "Service orders" }]
  },
  {
    label: "Settings",
    icon: "⚙️",
    items: [{ href: "/app/settings", label: "Settings" }]
  }
];

/**
 * Flat version, kept for components that prefer a simple list (header search,
 * RBAC filtering, etc). Derived from the groups above so they stay in sync.
 */
export const companyNavItems: NavItem[] = companyNavGroups.flatMap((g) => g.items);
