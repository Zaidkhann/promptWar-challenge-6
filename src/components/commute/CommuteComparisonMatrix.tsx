"use client";

import React from "react";
import {
  Train,
  Car,
  Bus,
  Navigation,
  Bike,
  Footprints,
  TrendingDown,
  Sparkles,
} from "lucide-react";
import { CommuteModeResult, TravelMode } from "@/lib/commute/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CommuteComparisonMatrixProps {
  modes: CommuteModeResult[];
  distanceKm: number;
}

export function CommuteComparisonMatrix({ modes, distanceKm }: CommuteComparisonMatrixProps) {
  const getModeIcon = (mode: TravelMode) => {
    switch (mode) {
      case "metro_underground":
        return Train;
      case "car_ac_recirc":
      case "car_fresh_air":
        return Car;
      case "bus_electric_ac":
        return Bus;
      case "auto_rickshaw":
        return Navigation;
      case "two_wheeler":
        return Bike;
      case "walking":
      case "cycling":
        return Footprints;
      default:
        return Navigation;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Multi-Modal Action Comparison Matrix
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Side-by-side evaluation across {modes.length} travel alternatives over {distanceKm} km.
          </p>
        </div>
        <Badge variant="outline" className="text-xs self-start sm:self-auto font-mono">
          ICRP 66 Dosimetry + ARAI/CEA Carbon
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {modes.map((item) => {
          const Icon = getModeIcon(item.mode);
          const isOptimal = item.isRecommended;

          return (
            <Card
              key={item.mode}
              className={`flex flex-col justify-between transition-all ${
                isOptimal
                  ? "border-cyan-500 bg-cyan-50/20 ring-2 ring-cyan-500/20 dark:border-cyan-500/60 dark:bg-cyan-950/20 shadow-md"
                  : "border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:bg-[#111827] dark:hover:border-slate-700"
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                      isOptimal
                        ? "bg-cyan-600 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {isOptimal && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-cyan-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                        <Sparkles className="h-3 w-3" />
                        <span>Recommended Choice</span>
                      </span>
                    )}
                    <Badge variant={item.tagVariant} className="text-[10px]">
                      {item.tag}
                    </Badge>
                  </div>
                </div>

                <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-2 leading-snug">
                  {item.label}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-3.5 text-xs">
                {/* Deposited Lung Dose vs Carbon Footprint */}
                <div className="grid grid-cols-2 gap-2 text-center">
                  {/* Dosimetry */}
                  <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#1E293B]/60 p-2.5">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Deposited Dose</span>
                    <span className="text-lg font-black text-slate-950 dark:text-white mt-0.5 block">
                      {item.dosimetry.depositedDosePM25Ug} µg
                    </span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono block">
                      [{item.dosimetry.doseRangePM25Ug[0]} – {item.dosimetry.doseRangePM25Ug[1]} µg]
                    </span>
                  </div>

                  {/* Carbon */}
                  <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#1E293B]/60 p-2.5">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Carbon Emissions</span>
                    <span className="text-lg font-black text-slate-950 dark:text-white mt-0.5 block">
                      {item.carbonGrams} g
                    </span>
                    <span className="text-[9px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center justify-center gap-0.5">
                      <TrendingDown className="h-3 w-3" />
                      <span>-{item.carbonAvoidedVsCarGrams}g vs Car</span>
                    </span>
                  </div>
                </div>

                {/* Duration & Fare */}
                <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-2 text-slate-600 dark:text-slate-400 text-[11px]">
                  <div>
                    <span className="text-slate-400 uppercase text-[9px] block">Travel Duration</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{item.durationMinutes} mins</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 uppercase text-[9px] block">Estimated Cost</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">₹{item.estimatedCostINR}</span>
                  </div>
                </div>

                {/* Inhalation & Cabin Penetration Specs */}
                <div className="grid grid-cols-2 gap-1 rounded bg-slate-100/70 dark:bg-slate-800/60 p-2 text-[10px] text-slate-600 dark:text-slate-300">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Cabin Penetration:</span>{" "}
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {Math.round(item.cabinPenetrationFactor * 100)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Breathing Rate:</span>{" "}
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {item.minuteVentilationLMin} L/min
                    </span>
                  </div>
                </div>

                {/* Precautions */}
                <div className="rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1E293B]/40 p-2 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  {item.precautions}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
