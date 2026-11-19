import * as React from "react";
import { cn } from "@/lib/utils";

export interface MetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  unit?: string;
  description?: string;
  badge?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
}

export function MetricCard({
  className,
  label,
  value,
  unit,
  description,
  badge,
  icon: Icon,
  trend,
  ...props
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs transition-all duration-200 hover:border-slate-300 dark:border-slate-800 dark:bg-[#111827] dark:hover:border-slate-700",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label}
        </span>
        <div className="flex items-center gap-1.5">
          {badge}
          {Icon && (
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <Icon className="h-3.5 w-3.5" />
            </div>
          )}
        </div>
      </div>

      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-mono">
          {value}
        </span>
        {unit && (
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {unit}
          </span>
        )}
      </div>

      {(description || trend) && (
        <div className="mt-1.5 flex items-center justify-between gap-2 text-xs">
          {description && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal line-clamp-1">
              {description}
            </p>
          )}
          {trend && (
            <span
              className={cn(
                "inline-flex shrink-0 items-center text-[10px] font-semibold",
                trend.isPositive
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              )}
            >
              {trend.value}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
