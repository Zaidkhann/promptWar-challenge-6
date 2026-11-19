"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme, Theme } from "./ThemeProvider";

interface ThemeSwitcherProps {
  className?: string;
}

export function ThemeSwitcher({ className = "" }: ThemeSwitcherProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const options: Array<{ value: Theme; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { value: "light", label: "Light theme", icon: Sun },
    { value: "dark", label: "Dark theme", icon: Moon },
    { value: "system", label: "System theme", icon: Monitor },
  ];

  // Placeholder while mounting to prevent hydration layout shift
  if (!mounted) {
    return (
      <div className={`inline-flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5 dark:border-slate-800 dark:bg-slate-900 ${className}`}>
        <div className="h-7 w-7 rounded-md p-1" />
        <div className="h-7 w-7 rounded-md p-1" />
        <div className="h-7 w-7 rounded-md p-1" />
      </div>
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label="Color theme selector"
      className={`inline-flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5 dark:border-slate-800 dark:bg-slate-900 ${className}`}
    >
      {options.map((opt) => {
        const Icon = opt.icon;
        const isSelected = theme === opt.value;

        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={opt.label}
            title={opt.label}
            onClick={() => setTheme(opt.value)}
            className={`flex h-7 w-7 items-center justify-center rounded-md text-xs transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500 ${
              isSelected
                ? "bg-white text-cyan-600 shadow-2xs font-semibold dark:bg-slate-800 dark:text-cyan-400"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            }`}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
