import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | "default"
    | "secondary"
    | "outline"
    | "demo"
    | "good"
    | "satisfactory"
    | "moderate"
    | "poor"
    | "very-poor"
    | "severe";
}

export function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  const variantStyles = {
    default: "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700",
    secondary: "bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800",
    outline: "border-slate-300 text-slate-700 bg-transparent dark:border-slate-700 dark:text-slate-300",
    demo: "bg-amber-50 text-amber-900 border-amber-300 font-semibold tracking-wide uppercase text-[10px] dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
    // CPCB NAQI standard categories with accessible contrast
    good: "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
    satisfactory: "bg-lime-50 text-lime-800 border-lime-300 dark:bg-lime-950/60 dark:text-lime-300 dark:border-lime-800",
    moderate: "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
    poor: "bg-orange-50 text-orange-800 border-orange-300 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800",
    "very-poor": "bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800",
    severe: "bg-red-100 text-red-950 border-red-300 font-bold dark:bg-red-950/80 dark:text-red-200 dark:border-red-800",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
