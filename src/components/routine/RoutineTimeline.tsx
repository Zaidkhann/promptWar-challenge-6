"use client";

import React from "react";
import {
  Clock,
  Sun,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Info,
} from "lucide-react";
import { DiurnalScheduleSlot } from "@/lib/recommendations/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface RoutineTimelineProps {
  schedule: DiurnalScheduleSlot[];
}

export function RoutineTimeline({ schedule }: RoutineTimelineProps) {
  const getSlotBadge = (status: DiurnalScheduleSlot["status"]) => {
    switch (status) {
      case "hazardous":
        return (
          <Badge className="bg-red-100 text-red-900 border-red-300 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800 font-bold uppercase text-[10px]">
            <ShieldAlert className="h-3 w-3 text-red-700 dark:text-red-400" />
            Hazardous Trapping
          </Badge>
        );
      case "caution":
        return (
          <Badge className="bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 font-semibold text-[10px]">
            <AlertTriangle className="h-3 w-3 text-amber-700 dark:text-amber-400" />
            Caution Required
          </Badge>
        );
      case "acceptable":
        return (
          <Badge className="bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800 font-medium text-[10px]">
            <Info className="h-3 w-3 text-blue-700 dark:text-blue-400" />
            Acceptable Window
          </Badge>
        );
      case "optimal":
        return (
          <Badge className="bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 font-bold text-[10px]">
            <CheckCircle2 className="h-3 w-3 text-emerald-700 dark:text-emerald-400" />
            Optimal Window
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Diurnal Exposure & Atmospheric Inversion Timeline
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Chronological breakdown of boundary layer mixing depths and optimal physical activity windows across the 24-hour cycle.
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-900">
          <Sun className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" aria-hidden="true" />
          <span>Solar Mixing Depth Peaks 12:00 – 15:30 IST</span>
        </div>
      </div>

      <div className="space-y-3.5">
        {schedule.map((slot, index) => (
          <Card
            key={index}
            className={`transition-all ${
              slot.isOptimalWindow
                ? "border-emerald-300 bg-emerald-50/20 ring-1 ring-emerald-300/60 shadow-xs dark:border-emerald-800/80 dark:bg-emerald-950/20 dark:ring-emerald-800/50"
                : slot.status === "hazardous"
                ? "border-slate-200 hover:border-red-200 bg-white dark:border-slate-800 dark:bg-[#111827] dark:hover:border-red-900/60"
                : "border-slate-200 bg-white dark:border-slate-800 dark:bg-[#111827]"
            }`}
          >
            <CardContent className="p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 rounded-md px-2.5 py-1">
                      <Clock className="h-3.5 w-3.5 text-cyan-700 dark:text-cyan-400" aria-hidden="true" />
                      {slot.timeRange}
                    </span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{slot.label}</span>
                    {getSlotBadge(slot.status)}
                    {slot.isOptimalWindow && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full">
                        <Sun className="h-3 w-3 text-emerald-700 dark:text-emerald-400" />
                        Safest Outdoor Period
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                    {slot.headlineAction}
                  </h3>

                  <div className="grid sm:grid-cols-2 gap-3 text-xs pt-1">
                    <div className="rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-[#1E293B]/60 p-2.5 space-y-0.5">
                      <span className="font-semibold text-slate-900 dark:text-slate-200 block text-[11px]">
                        Recommended Action:
                      </span>
                      <p className="text-slate-600 dark:text-slate-400">{slot.recommendedActivity}</p>
                    </div>

                    <div className="rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-[#1E293B]/60 p-2.5 space-y-0.5">
                      <span className="font-semibold text-slate-900 dark:text-slate-200 block text-[11px]">
                        Indoor Alternative / Strategy:
                      </span>
                      <p className="text-slate-600 dark:text-slate-400">{slot.indoorAlternative}</p>
                    </div>
                  </div>

                  {/* Atmospheric Physics Explanation */}
                  <div className="pt-2 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100/80 dark:border-slate-800">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Atmospheric Physics: </span>
                    <span>{slot.atmosphericPhysicsNote}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
