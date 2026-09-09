import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import { AXProvider } from "@/lib/ax-client";

export const metadata: Metadata = {
  title: "Ringo ToDo — Multi-Tenant Task Management for High-Velocity Teams",
  description: "A fast, multi-tenant task and project management system with Kanban boards, list views, calendars, roadmaps, and personal focus planners.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body>
        <AXProvider>
          <AppProvider>{children}</AppProvider>
        </AXProvider>
      </body>
    </html>
  );
}
