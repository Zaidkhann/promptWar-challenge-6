import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { ThemeProvider, ThemeScript } from "@/components/theme/ThemeProvider";

export const metadata: Metadata = {
  title: "SaansAI — Urban Air Quality Companion",
  description:
    "Intelligent GenAI-powered air quality companion helping families and communities navigate severe winter smog with low-emission routines, indoor air solutions, and sustainable alternatives.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="antialiased bg-[#F8FAFC] text-slate-900 dark:bg-[#0B1220] dark:text-slate-100 min-h-screen selection:bg-cyan-500/20 selection:text-cyan-700 dark:selection:bg-cyan-400/25 dark:selection:text-cyan-300">
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
