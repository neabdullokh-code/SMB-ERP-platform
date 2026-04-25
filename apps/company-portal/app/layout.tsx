import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "SQB Business OS | Company Portal",
  description: "Tenant-scoped ERP portal for warehouse, production, services, and compliance."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "Inter, Arial, sans-serif", background: "#eef4f8" }}>{children}</body>
    </html>
  );
}
