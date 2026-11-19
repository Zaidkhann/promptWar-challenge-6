"use client";

import React from "react";
import { CommuteModeResult } from "@/lib/commute/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DosimetryAnalyticsChartProps {
  modes: CommuteModeResult[];
}

export function DosimetryAnalyticsChart({ modes }: DosimetryAnalyticsChartProps) {
  const maxInhaled = Math.max(1, ...modes.map((m) => m.dosimetry.inhaledMassPM25Ug));

  return (
    <Card className="border-slate-200 dark:border-slate-800 dark:bg-[#111827] shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
            Respiratory Dosimetry: Inhaled Mass vs. Deposited Dose
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            D_inhaled = ∫ C(t) · V_E dt
          </Badge>
        </div>
        <CardDescription className="text-slate-500 dark:text-slate-400">
          Comparison of total inhaled particulate mass entering upper airways against the effective dose deposited in bronchial and alveolar tissue (ICRP 66 model).
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Visual Bar Breakdown */}
        <div className="space-y-3">
          {modes.map((item) => {
            const inhaledVal = item.dosimetry.inhaledMassPM25Ug;
            const depositedVal = item.dosimetry.depositedDosePM25Ug;
            const inhaledWidth = Math.max(4, Math.round((inhaledVal / maxInhaled) * 100));
            const depositedWidth = Math.max(2, Math.round((depositedVal / maxInhaled) * 100));

            return (
              <div key={item.mode} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{item.label}</span>
                  <div className="flex items-center gap-3 font-mono text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400">Inhaled: {inhaledVal} µg</span>
                    <span className="font-bold text-cyan-800 dark:text-cyan-400">Deposited: {depositedVal} µg</span>
                  </div>
                </div>

                {/* Overlaid Double Progress Bar */}
                <div className="relative h-4 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  {/* Total Inhaled Mass Bar (Lighter Cyan) */}
                  <div
                    className="absolute top-0 bottom-0 left-0 bg-cyan-200 dark:bg-cyan-900/60 transition-all duration-500"
                    style={{ width: `${inhaledWidth}%` }}
                  />
                  {/* Deposited Dose Bar (Darker Cyan) */}
                  <div
                    className="absolute top-0 bottom-0 left-0 bg-cyan-700 dark:bg-cyan-500 transition-all duration-500"
                    style={{ width: `${depositedWidth}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend & Scientific Guidance */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800 pt-3 text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-5 rounded bg-cyan-200 dark:bg-cyan-900/60" />
              <span>Inhaled Particulate Mass (Airway Entry)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-5 rounded bg-cyan-700 dark:bg-cyan-500" />
              <span>Deposited Respiratory Dose (ICRP 66 DF = 0.28)</span>
            </div>
          </div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">
            Higher exertion (walking/cycling) multiplies ventilation up to 36 L/min.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
