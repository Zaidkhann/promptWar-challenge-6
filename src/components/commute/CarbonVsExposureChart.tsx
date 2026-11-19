"use client";

import React from "react";
import { CommuteModeResult } from "@/lib/commute/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CarbonVsExposureChartProps {
  modes: CommuteModeResult[];
}

export function CarbonVsExposureChart({ modes }: CarbonVsExposureChartProps) {
  const maxCarbon = Math.max(10, ...modes.map((m) => m.carbonGrams));
  const maxDose = Math.max(10, ...modes.map((m) => m.dosimetry.depositedDosePM25Ug));

  const svgWidth = 600;
  const svgHeight = 280;
  const padding = 45;

  return (
    <Card className="border-slate-200 dark:border-slate-800 dark:bg-[#111827] shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
            Action Impact Trade-off: Carbon Footprint vs. Lung Dose
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            Multi-Objective Evaluation
          </Badge>
        </div>
        <CardDescription className="text-slate-500 dark:text-slate-400">
          Visual trade-off quadrant mapping passenger carbon emissions (g CO2e) against deposited lung dose (µg PM2.5). The bottom-left represents the optimal zone.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="overflow-x-auto">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto min-w-[480px] select-none"
            aria-label="Carbon vs Lung Dose Scatter Plot"
          >
            {/* Optimal Green Quadrant Zone (Bottom Left) */}
            <rect
              x={padding}
              y={svgHeight / 2}
              width={(svgWidth - 2 * padding) / 2}
              height={svgHeight / 2 - padding}
              fill="#ECFDF5"
              className="dark:opacity-20"
              opacity="0.75"
            />
            <text
              x={padding + 12}
              y={svgHeight - padding - 12}
              fill="#059669"
              fontSize="10"
              fontWeight="bold"
            >
              ★ Optimal Zone (Low Carbon & Low Dose)
            </text>

            {/* High Carbon Quadrant (Bottom Right) */}
            <rect
              x={padding + (svgWidth - 2 * padding) / 2}
              y={svgHeight / 2}
              width={(svgWidth - 2 * padding) / 2}
              height={svgHeight / 2 - padding}
              fill="#FFFBEB"
              className="dark:opacity-10"
              opacity="0.5"
            />

            {/* High Lung Burden Quadrant (Top Left) */}
            <rect
              x={padding}
              y={padding}
              width={(svgWidth - 2 * padding) / 2}
              height={svgHeight / 2 - padding}
              fill="#FEF2F2"
              className="dark:opacity-10"
              opacity="0.5"
            />

            {/* Axes */}
            <line
              x1={padding}
              y1={svgHeight - padding}
              x2={svgWidth - padding}
              y2={svgHeight - padding}
              stroke="#94A3B8"
              className="dark:stroke-slate-700"
              strokeWidth="1.5"
            />
            <line
              x1={padding}
              y1={padding}
              x2={padding}
              y2={svgHeight - padding}
              stroke="#94A3B8"
              className="dark:stroke-slate-700"
              strokeWidth="1.5"
            />

            {/* Axis Labels */}
            <text
              x={svgWidth / 2}
              y={svgHeight - 10}
              textAnchor="middle"
              fill="#64748B"
              fontSize="10"
              fontWeight="600"
            >
              Passenger Carbon Footprint (g CO2e) ➔
            </text>
            <text
              x={-svgHeight / 2}
              y={14}
              transform="rotate(-90)"
              textAnchor="middle"
              fill="#64748B"
              fontSize="10"
              fontWeight="600"
            >
              Deposited Lung Dose (µg PM2.5) ➔
            </text>

            {/* Mode Scatter Nodes */}
            {modes.map((item) => {
              const xRatio = item.carbonGrams / maxCarbon;
              const yRatio = item.dosimetry.depositedDosePM25Ug / maxDose;

              const cx = padding + xRatio * (svgWidth - 2 * padding - 30) + 15;
              const cy = svgHeight - padding - yRatio * (svgHeight - 2 * padding - 30) - 15;

              const isOptimal = item.isRecommended;

              return (
                <g key={item.mode} className="cursor-pointer group">
                  {isOptimal && (
                    <circle cx={cx} cy={cy} r="14" fill="#06B6D4" opacity="0.3" className="animate-pulse" />
                  )}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isOptimal ? "8" : "6"}
                    fill={isOptimal ? "#0891B2" : "#64748B"}
                    stroke="#FFFFFF"
                    strokeWidth="2"
                  />
                  <text
                    x={cx}
                    y={cy - 10}
                    textAnchor="middle"
                    fill="#1E293B"
                    className="dark:fill-slate-200"
                    fontSize="9"
                    fontWeight="700"
                  >
                    {item.label.split(" ")[0]}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Action Takeaway */}
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#1E293B]/60 p-3 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          <strong>Key Insight:</strong> <strong>Underground Metro (DMRC)</strong> and <strong>Electric AC Buses</strong> dominate the lower-left quadrant by offering multi-stage particle filtration with minimal per-capita emissions. Conversely, personal petrol vehicles incur heavy climate penalties, and active travel (walking/cycling) during severe smog incurs heavy respiratory penalties due to elevated ventilation.
        </div>
      </CardContent>
    </Card>
  );
}
