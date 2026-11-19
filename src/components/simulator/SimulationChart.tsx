"use client";

import React, { useState } from "react";
import { SimulationTimePoint } from "@/lib/simulator/types";

interface SimulationChartProps {
  timePoints: SimulationTimePoint[];
  durationHours: number;
  onHoverPoint?: (point: SimulationTimePoint | null) => void;
}

export function SimulationChart({
  timePoints,
  durationHours,
  onHoverPoint,
}: SimulationChartProps) {
  const [activePoint, setActivePoint] = useState<SimulationTimePoint | null>(null);

  if (!timePoints || timePoints.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-slate-400 dark:text-slate-500 text-xs">
        No simulation data available. Run simulation to view time series.
      </div>
    );
  }

  // Determine Y-axis max scale
  const maxIndoor = Math.max(...timePoints.map((p) => p.indoorPM25), 10);
  const maxOutdoor = Math.max(...timePoints.map((p) => p.outdoorPM25), 10);
  const rawMax = Math.max(maxIndoor, maxOutdoor, 100);
  const yMax = Math.ceil(rawMax * 1.15); // Add headroom

  // Dimensions
  const svgWidth = 600;
  const svgHeight = 260;
  const padding = { top: 20, right: 30, bottom: 40, left: 50 };
  const chartWidth = svgWidth - padding.left - padding.right;
  const chartHeight = svgHeight - padding.top - padding.bottom;

  const totalMinutes = durationHours * 60;

  // Coordinate transforms
  const getX = (min: number) => padding.left + (min / totalMinutes) * chartWidth;
  const getY = (val: number) => padding.top + chartHeight - (val / yMax) * chartHeight;

  // Build SVG path strings
  const indoorPath = timePoints
    .map((p, i) => `${i === 0 ? "M" : "L"} ${getX(p.minute).toFixed(1)} ${getY(p.indoorPM25).toFixed(1)}`)
    .join(" ");

  // Fill area under curve
  const areaPath = `${indoorPath} L ${getX(timePoints[timePoints.length - 1].minute).toFixed(1)} ${getY(0).toFixed(1)} L ${getX(0).toFixed(1)} ${getY(0).toFixed(1)} Z`;

  // Outdoor reference line
  const outdoorPM25 = timePoints[0]?.outdoorPM25 ?? 0;
  const outdoorY = getY(outdoorPM25);

  // Standard guideline lines
  const whoY = getY(15);
  const cpcbY = getY(60);

  // Time grid ticks (e.g. hourly)
  const hourTicks = Array.from({ length: durationHours + 1 }, (_, i) => i);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const chartX = (mouseX / rect.width) * svgWidth - padding.left;
    const clampedX = Math.max(0, Math.min(chartWidth, chartX));
    const targetMinute = (clampedX / chartWidth) * totalMinutes;

    // Find closest time point
    let closest = timePoints[0];
    let minDiff = Math.abs(closest.minute - targetMinute);
    for (const p of timePoints) {
      const diff = Math.abs(p.minute - targetMinute);
      if (diff < minDiff) {
        minDiff = diff;
        closest = p;
      }
    }
    setActivePoint(closest);
    onHoverPoint?.(closest);
  };

  const handleMouseLeave = () => {
    setActivePoint(null);
    onHoverPoint?.(null);
  };

  return (
    <div className="relative space-y-2">
      {/* Chart Canvas */}
      <div className="relative w-full overflow-hidden bg-slate-50/60 dark:bg-[#0B1220] rounded-lg border border-slate-200 dark:border-slate-800 p-2">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto cursor-crosshair select-none"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          role="img"
          aria-label="Indoor particulate concentration over time line graph"
        >
          {/* Subtle Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((ratio) => {
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
                  x={padding.left - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="text-[9px] fill-slate-400 dark:fill-slate-500 font-mono"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Time X-Axis Ticks */}
          {hourTicks.map((h) => {
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
                  y={svgHeight - padding.bottom + 16}
                  textAnchor="middle"
                  className="text-[10px] fill-slate-500 dark:fill-slate-400 font-medium font-mono"
                >
                  {h}h
                </text>
              </g>
            );
          })}

          {/* WHO 24-hr Target Line (15 µg/m³) */}
          {whoY >= padding.top && whoY <= svgHeight - padding.bottom && (
            <g>
              <line
                x1={padding.left}
                y1={whoY}
                x2={svgWidth - padding.right}
                y2={whoY}
                stroke="#10b981"
                strokeWidth="1.2"
                strokeDasharray="4 3"
              />
              <text
                x={svgWidth - padding.right - 4}
                y={whoY - 3}
                textAnchor="end"
                className="text-[8px] fill-emerald-600 font-semibold"
              >
                WHO Target (15 µg/m³)
              </text>
            </g>
          )}

          {/* CPCB 24-hr Standard Line (60 µg/m³) */}
          {cpcbY >= padding.top && cpcbY <= svgHeight - padding.bottom && (
            <g>
              <line
                x1={padding.left}
                y1={cpcbY}
                x2={svgWidth - padding.right}
                y2={cpcbY}
                stroke="#f59e0b"
                strokeWidth="1.2"
                strokeDasharray="4 3"
              />
              <text
                x={svgWidth - padding.right - 4}
                y={cpcbY - 3}
                textAnchor="end"
                className="text-[8px] fill-amber-600 font-semibold"
              >
                CPCB Standard (60 µg/m³)
              </text>
            </g>
          )}

          {/* Outdoor Reference Line */}
          {outdoorY >= padding.top && outdoorY <= svgHeight - padding.bottom && (
            <g>
              <line
                x1={padding.left}
                y1={outdoorY}
                x2={svgWidth - padding.right}
                y2={outdoorY}
                stroke="#94a3b8"
                className="dark:stroke-slate-600"
                strokeWidth="1.5"
                strokeDasharray="6 3"
              />
              <text
                x={padding.left + 8}
                y={outdoorY - 4}
                className="text-[9px] fill-slate-500 dark:fill-slate-400 font-medium"
              >
                Outdoor Ambient: {outdoorPM25} µg/m³
              </text>
            </g>
          )}

          {/* Area under Indoor Curve */}
          <path d={areaPath} fill="url(#indoorGradient)" opacity="0.4" />

          {/* Indoor PM2.5 Curve Line */}
          <path
            d={indoorPath}
            fill="none"
            stroke="#0891b2"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Linear Gradient for Area Fill */}
          <defs>
            <linearGradient id="indoorGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0891b2" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#0891b2" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Active Hover Scrubbing Cursor */}
          {activePoint && (
            <g>
              <line
                x1={getX(activePoint.minute)}
                y1={padding.top}
                x2={getX(activePoint.minute)}
                y2={svgHeight - padding.bottom}
                stroke="#0891b2"
                strokeWidth="1.5"
                strokeDasharray="3 2"
              />
              <circle
                cx={getX(activePoint.minute)}
                cy={getY(activePoint.indoorPM25)}
                r="5"
                fill="#0891b2"
                stroke="#ffffff"
                strokeWidth="2"
              />
            </g>
          )}
        </svg>

        {/* Hover Floating Tooltip */}
        {activePoint && (
          <div
            className="absolute top-3 right-4 bg-slate-900/95 dark:bg-slate-950/95 text-white p-2.5 rounded-lg shadow-lg border border-slate-800 dark:border-slate-700 text-[11px] space-y-1 pointer-events-none backdrop-blur-xs z-10"
          >
            <div className="font-semibold text-slate-200 flex items-center justify-between gap-3 border-b border-slate-700 pb-1">
              <span>Time: {Math.floor(activePoint.minute / 60)}h {activePoint.minute % 60}m</span>
              <span className="text-[10px] text-cyan-400 font-mono">Minute {activePoint.minute}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Indoor PM2.5:</span>
              <span className="font-bold text-cyan-300">{activePoint.indoorPM25} µg/m³</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Outdoor Baseline:</span>
              <span className="text-slate-300">{activePoint.outdoorPM25} µg/m³</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Indoor/Outdoor:</span>
              <span className="text-slate-300">{(activePoint.indoorOutdoorRatioPM25 * 100).toFixed(0)}%</span>
            </div>
            {activePoint.isSourceActive && (
              <div className="text-amber-400 text-[10px] font-semibold mt-1 pt-1 border-t border-slate-800">
                ⚠ Indoor Emission Source Active
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 px-1">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-cyan-600 rounded-sm"></span>
            <span className="font-medium text-slate-700 dark:text-slate-200">Simulated Indoor PM2.5</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-slate-400 border-t border-dashed border-slate-400 dark:border-slate-500"></span>
            <span>Outdoor Baseline</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-emerald-500 border-t border-dashed border-emerald-500"></span>
            <span>WHO 24h Target (15)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-amber-500 border-t border-dashed border-amber-500"></span>
            <span>CPCB Standard (60)</span>
          </div>
        </div>
        <span className="text-[10px] text-slate-400 dark:text-slate-500">Hover or scrub to inspect time steps</span>
      </div>
    </div>
  );
}
