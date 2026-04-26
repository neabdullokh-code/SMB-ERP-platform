import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "SQB Business OS | Bank Portal",
  description: "Centralized bank monitoring portal for the multi-tenant ERP platform."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "Inter, Arial, sans-serif", background: "#0b1220" }}>{children}</body>
    </html>
  );
}
