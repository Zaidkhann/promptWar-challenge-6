"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Wind,
  LayoutDashboard,
  CalendarClock,
  Home,
  Navigation,
  BotMessageSquare,
  Menu,
  X,
  ShieldCheck,
} from "lucide-react";
import { SkipLink } from "@/components/common/SkipLink";
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    name: "Overview",
    href: "/",
    icon: Wind,
    description: "Platform summary & scientific pillars",
  },
  {
    name: "Command Center",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Statutory CPCB NAQI & boundary layer telemetry",
  },
  {
    name: "Daily Routine",
    href: "/routine",
    icon: CalendarClock,
    description: "Diurnal inversion schedule & safe activity windows",
  },
  {
    name: "Indoor Sanctuary",
    href: "/indoor-sanctuary",
    icon: Home,
    description: "Physical room mass-balance ODE settling simulator",
  },
  {
    name: "Action Impact",
    href: "/commute-optimizer",
    icon: Navigation,
    description: "Multi-modal route exposure & ICRP 66 dosimetry",
  },
  {
    name: "AI Assistant",
    href: "/assistant",
    icon: BotMessageSquare,
    description: "15-tool autonomous environmental reasoning copilot",
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Handle escape key to close mobile menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  const activeNavItem = NAV_ITEMS.find((item) => item.href === pathname) || NAV_ITEMS[0];

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900 dark:bg-[#0B1220] dark:text-slate-100 transition-colors duration-200">
      <SkipLink target="#main-content" />

      {/* Main Sticky Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/90 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-[#111827]/95 transition-colors">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo & Product Brand */}
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
              aria-label="SaansAI Home"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-600 text-white shadow-2xs dark:bg-cyan-500 dark:text-slate-950 font-bold">
                <Wind className="h-4.5 w-4.5" aria-hidden="true" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-base font-bold tracking-tight text-slate-950 dark:text-white leading-none">
                  Saans<span className="text-cyan-600 dark:text-cyan-400">AI</span>
                </span>
                <span className="hidden sm:inline-block text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  साँस
                </span>
              </div>
            </Link>

            {/* Subtle Separator & Current Section Breadcrumb (Desktop) */}
            <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 border-l border-slate-200 dark:border-slate-800 pl-4">
              <span>/</span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {activeNavItem.name}
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav
            aria-label="Primary Navigation"
            className="hidden md:flex items-center space-x-1"
          >
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all ${
                    isActive
                      ? "bg-slate-100 text-slate-950 font-semibold border border-slate-200/90 shadow-2xs dark:bg-slate-800 dark:text-white dark:border-slate-700"
                      : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon
                    className={`h-3.5 w-3.5 ${
                      isActive ? "text-cyan-600 dark:text-cyan-400" : "text-slate-400 dark:text-slate-500"
                    }`}
                    aria-hidden="true"
                  />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Header Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Regulatory Engine Chip */}
            <div className="hidden xl:flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              <span>CPCB NAQI Certified</span>
            </div>

            {/* Theme Switcher */}
            <ThemeSwitcher />

            {/* Mobile Navigation Drawer Button */}
            <button
              type="button"
              className="md:hidden flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation"
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            >
              {mobileMenuOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div
            id="mobile-navigation"
            className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg dark:border-slate-800 dark:bg-[#111827] animate-in fade-in-50"
          >
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between rounded-lg p-2.5 text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-slate-100 text-slate-900 font-semibold border border-slate-200 dark:bg-slate-800 dark:text-white dark:border-slate-700"
                      : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/60"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 ${isActive ? "text-cyan-600 dark:text-cyan-400" : "text-slate-400 dark:text-slate-500"}`} />
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{item.name}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">{item.description}</div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main id="main-content" className="flex-1" tabIndex={-1}>
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>

      {/* Accessible Footer */}
      <footer className="border-t border-slate-200/90 bg-white py-6 text-xs text-slate-500 dark:border-slate-800 dark:bg-[#111827] dark:text-slate-400 transition-colors" role="contentinfo">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 dark:text-slate-100">SaansAI</span>
            <span>— Google Developers Prompt War Challenge 6</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600 dark:text-slate-400">
            <span>CPCB NAQI Standards (16-Hr Rule)</span>
            <span>•</span>
            <span>ICRP 66 Dosimetry</span>
            <span>•</span>
            <span>Mass-Balance ODE Physics</span>
            <span>•</span>
            <span>CEA Grid Benchmark</span>
          </div>
          <div className="text-center sm:text-right text-[11px] text-slate-400 dark:text-slate-500">
            For lifestyle exposure mitigation. Non-diagnostic.
          </div>
        </div>
      </footer>
    </div>
  );
}
