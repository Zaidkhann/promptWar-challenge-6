"use client";

import React from "react";
import { ScenarioResultComparison } from "@/lib/simulator/types";

interface ScenarioComparisonChartProps {
  scenarios: ScenarioResultComparison[];
  durationHours: number;
}

export function ScenarioComparisonChart({
  scenarios,
  durationHours,
}: ScenarioComparisonChartProps) {
  if (!scenarios || scenarios.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-slate-400 dark:text-slate-500 text-xs">
        Select a scenario comparison preset to view side-by-side curves.
      </div>
    );
  }

  // Color palette for scenarios
  const colorMap = [
    { stroke: "#64748b", fill: "rgba(100, 116, 139, 0.1)", label: "Baseline" }, // Slate
    { stroke: "#0891b2", fill: "rgba(8, 145, 178, 0.1)", label: "Intervention A" }, // Cyan
    { stroke: "#10b981", fill: "rgba(16, 185, 129, 0.1)", label: "Intervention B" }, // Emerald
    { stroke: "#8b5cf6", fill: "rgba(139, 92, 246, 0.1)", label: "Intervention C" }, // Purple
  ];

  // Global Y scale max
  let maxY = 50;
  for (const s of scenarios) {
    for (const tp of s.output.timePoints) {
      if (tp.indoorPM25 > maxY) maxY = tp.indoorPM25;
      if (tp.outdoorPM25 > maxY) maxY = tp.outdoorPM25;
    }
  }
  const yMax = Math.ceil(maxY * 1.15);

  const svgWidth = 600;
  const svgHeight = 250;
  const padding = { top: 20, right: 25, bottom: 35, left: 45 };
  const chartWidth = svgWidth - padding.left - padding.right;
  const chartHeight = svgHeight - padding.top - padding.bottom;
  const totalMinutes = durationHours * 60;

  const getX = (min: number) => padding.left + (min / totalMinutes) * chartWidth;
  const getY = (val: number) => padding.top + chartHeight - (val / yMax) * chartHeight;

  return (
    <div className="space-y-4">
      {/* Comparative Multi-Curve Chart */}
      <div className="bg-slate-50/70 dark:bg-[#0B1220] border border-slate-200 dark:border-slate-800 rounded-lg p-2 overflow-hidden">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto select-none"
          role="img"
          aria-label="Comparative scenario multi-line graph"
        >
          {/* Y-axis grid */}
          {[0, 0.33, 0.66, 1.0].map((ratio) => {
            const val = Math.round(yMax * ratio);
            const y = getY(val);
            return (
              <g key={ratio}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={svgWidth - padding.right}
                  y2={y}
                  stroke="#e2e8f0"
                  className="dark:stroke-slate-800"
                  strokeDasharray="2 2"
                />
                <text
                  x={padding.left - 6}
                  y={y + 3}
                  textAnchor="end"
                  className="text-[9px] fill-slate-400 dark:fill-slate-500 font-mono"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Time X Ticks */}
          {Array.from({ length: durationHours + 1 }, (_, h) => {
            const x = getX(h * 60);
            return (
              <g key={h}>
                <line
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={svgHeight - padding.bottom}
                  stroke="#f1f5f9"
                  className="dark:stroke-slate-800/60"
                />
                <text
                  x={x}
                  y={svgHeight - padding.bottom + 14}
                  textAnchor="middle"
                  className="text-[9px] fill-slate-500 dark:fill-slate-400 font-mono"
                >
                  {h}h
                </text>
              </g>
            );
          })}

          {/* WHO Target Reference Line */}
          <line
            x1={padding.left}
            y1={getY(15)}
            x2={svgWidth - padding.right}
            y2={getY(15)}
            stroke="#10b981"
            strokeWidth="1"
            strokeDasharray="4 2"
            opacity="0.8"
          />

          {/* Draw each scenario's curve */}
          {scenarios.map((sc, idx) => {
            const color = colorMap[idx % colorMap.length];
            const pathStr = sc.output.timePoints
              .map(
                (p, i) =>
                  `${i === 0 ? "M" : "L"} ${getX(p.minute).toFixed(1)} ${getY(
                    p.indoorPM25
                  ).toFixed(1)}`
              )
              .join(" ");

            return (
              <g key={sc.scenarioId}>
                <path
                  d={pathStr}
                  fill="none"
                  stroke={color.stroke}
                  strokeWidth={idx === 0 ? "2" : "2.5"}
                  strokeDasharray={idx === 0 ? "4 2" : undefined}
                />
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-[11px] pt-2 px-1 border-t border-slate-200 dark:border-slate-800">
          {scenarios.map((sc, idx) => {
            const color = colorMap[idx % colorMap.length];
            return (
              <div key={sc.scenarioId} className="flex items-center gap-1.5">
                <span
                  className="w-3 h-1 rounded-sm"
                  style={{ backgroundColor: color.stroke }}
                ></span>
                <span className="font-medium text-slate-700 dark:text-slate-300">{sc.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Comparative Metrics Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827]">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-[#1E293B] text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="py-2 px-3">Scenario</th>
              <th className="py-2 px-3">Peak PM2.5</th>
              <th className="py-2 px-3">Final PM2.5</th>
              <th className="py-2 px-3">Mean Exposure</th>
              <th className="py-2 px-3">Exposure Delta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
            {scenarios.map((sc, idx) => {
              const isBase = idx === 0;
              const isReduction = sc.percentExposureReductionVsBaseline > 0;
              return (
                <tr key={sc.scenarioId} className={isBase ? "bg-slate-50/50 dark:bg-slate-900/40" : "hover:bg-slate-50/30 dark:hover:bg-slate-800/40"}>
                  <td className="py-2.5 px-3 font-sans font-medium text-slate-800 dark:text-slate-200">
                    {sc.label}
                  </td>
                  <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">{sc.peakPM25} µg/m³</td>
                  <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">{sc.finalPM25} µg/m³</td>
                  <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">{sc.averagePM25} µg/m³</td>
                  <td className="py-2.5 px-3">
                    {isBase ? (
                      <span className="text-slate-400 dark:text-slate-500 font-sans text-[11px]">Baseline</span>
                    ) : (
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold font-sans ${
                          isReduction
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                        }`}
                      >
                        {isReduction ? "▼ " : "▲ "}
                        {Math.abs(sc.percentExposureReductionVsBaseline)}%
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
