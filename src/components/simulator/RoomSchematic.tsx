"use client";

import React from "react";
import {
  VentilationMode,
  InfiltrationLevel,
  IndoorSourceType,
  PurifierFanSpeed,
} from "@/lib/simulator/types";

interface RoomSchematicProps {
  roomType: string;
  lengthM: number;
  widthM: number;
  heightM: number;
  volumeM3: number;
  ventilationMode: VentilationMode;
  infiltrationLevel: InfiltrationLevel;
  hasAirPurifier: boolean;
  purifierCADR: number;
  purifierFanSpeed: PurifierFanSpeed;
  indoorSource: IndoorSourceType;
  currentPM25: number;
}

export function RoomSchematic({
  roomType,
  lengthM,
  widthM,
  heightM,
  volumeM3,
  ventilationMode,
  hasAirPurifier,
  purifierCADR,
  purifierFanSpeed,
  indoorSource,
  currentPM25,
}: RoomSchematicProps) {
  // Color coding based on particulate concentration
  const getAirQualityColor = (pm25: number) => {
    if (pm25 <= 15) return { bg: "bg-emerald-50 dark:bg-emerald-950/20", stroke: "#10b981", label: "Clean (WHO)", badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300" };
    if (pm25 <= 30) return { bg: "bg-teal-50 dark:bg-teal-950/20", stroke: "#14b8a6", label: "Good (CPCB)", badge: "bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300" };
    if (pm25 <= 60) return { bg: "bg-amber-50 dark:bg-amber-950/20", stroke: "#f59e0b", label: "Moderate", badge: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300" };
    if (pm25 <= 120) return { bg: "bg-orange-50 dark:bg-orange-950/20", stroke: "#f97316", label: "Poor", badge: "bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300" };
    if (pm25 <= 250) return { bg: "bg-rose-50 dark:bg-rose-950/20", stroke: "#f43f5e", label: "Very Poor", badge: "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300" };
    return { bg: "bg-purple-50 dark:bg-purple-950/20", stroke: "#881337", label: "Severe Smog", badge: "bg-purple-100 text-purple-900 dark:bg-purple-950/60 dark:text-purple-300" };
  };

  const aq = getAirQualityColor(currentPM25);

  return (
    <div className={`relative rounded-xl border border-slate-200 dark:border-slate-800 ${aq.bg} p-4 transition-colors duration-500 overflow-hidden`}>
      {/* Top Banner with Geometry & Status */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
            {roomType.replace("_", " ")}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            {lengthM}m × {widthM}m × {heightM}m ({volumeM3} m³)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${aq.badge}`}>
            {currentPM25} µg/m³ PM2.5 · {aq.label}
          </span>
        </div>
      </div>

      {/* Isometric 2D Architectural Room Diagram */}
      <div className="relative w-full h-56 bg-white/70 dark:bg-[#111827]/80 backdrop-blur-xs rounded-lg border border-slate-200/80 dark:border-slate-800 p-3 flex items-center justify-center">
        <svg
          viewBox="0 0 500 240"
          className="w-full h-full max-h-52 select-none"
          role="img"
          aria-label={`Schematic of ${roomType} showing dimensions and ventilation`}
        >
          {/* Room Floor Plane */}
          <polygon
            points="60,160 250,220 440,160 250,100"
            className="fill-slate-50 dark:fill-slate-800 stroke-slate-300 dark:stroke-slate-700"
            strokeWidth="2"
          />

          {/* Left Back Wall */}
          <polygon
            points="60,160 60,60 250,20 250,100"
            className="fill-slate-100 dark:fill-slate-800/80 stroke-slate-300 dark:stroke-slate-700"
            strokeWidth="1.5"
          />

          {/* Right Back Wall */}
          <polygon
            points="250,100 250,20 440,60 440,160"
            className="fill-slate-200 dark:fill-slate-900 stroke-slate-300 dark:stroke-slate-700"
            strokeWidth="1.5"
          />

          {/* Left Wall Window */}
          <polygon
            points="100,120 100,80 180,60 180,95"
            fill={ventilationMode === "windows_open" ? "#bae6fd" : "#e0f2fe"}
            stroke={ventilationMode === "windows_open" ? "#0284c7" : "#38bdf8"}
            strokeWidth="2"
          />
          <text x="140" y="85" textAnchor="middle" className="text-[10px] fill-slate-700 dark:fill-slate-200 font-medium">
            {ventilationMode === "windows_open"
              ? "Window Open (100%)"
              : ventilationMode === "window_ajar"
              ? "Window Ajar"
              : "Window Closed"}
          </text>

          {/* Ingress Wind Arrows if Window Open */}
          {(ventilationMode === "windows_open" || ventilationMode === "window_ajar") && (
            <g stroke="#0284c7" strokeWidth="2" fill="none">
              <path d="M 60,90 Q 110,95 140,120" strokeDasharray="4 2" />
              <path d="M 70,110 Q 120,115 150,135" strokeDasharray="4 2" />
              <text x="75" y="75" className="text-[9px] fill-sky-800 font-semibold">
                Outdoor Infiltration
              </text>
            </g>
          )}

          {/* Air Purifier in Room */}
          {hasAirPurifier && purifierFanSpeed !== "off" ? (
            <g transform="translate(290, 130)">
              {/* Purifier base */}
              <rect x="-15" y="-30" width="30" height="45" rx="5" fill="#0891b2" stroke="#0e7490" strokeWidth="1.5" />
              {/* Clean air vortex rings */}
              <ellipse cx="0" cy="-35" rx="16" ry="6" fill="none" stroke="#22d3ee" strokeWidth="2" opacity="0.9" />
              <ellipse cx="0" cy="-45" rx="22" ry="8" fill="none" stroke="#67e8f9" strokeWidth="1.5" opacity="0.7" />
              <ellipse cx="0" cy="-55" rx="28" ry="10" fill="none" stroke="#a5f3fc" strokeWidth="1" opacity="0.5" />
              <text x="0" y="-62" textAnchor="middle" className="text-[9px] fill-cyan-900 font-bold">
                HEPA ({purifierCADR} m³/h)
              </text>
              <text x="0" y="-5" textAnchor="middle" className="text-[8px] fill-white font-medium">
                {purifierFanSpeed.toUpperCase()}
              </text>
            </g>
          ) : (
            <g transform="translate(290, 150)">
              <rect x="-12" y="-15" width="24" height="25" rx="3" fill="#cbd5e1" stroke="#94a3b8" />
              <text x="0" y="20" textAnchor="middle" className="text-[8px] fill-slate-500">
                No Purifier Active
              </text>
            </g>
          )}

          {/* Indoor Particle Emission Source */}
          {indoorSource !== "none" && (
            <g transform="translate(180, 160)">
              {/* Emission burner/table */}
              <circle cx="0" cy="0" r="10" fill="#f97316" opacity="0.8" />
              {/* Plume smoke lines */}
              <path d="M 0,-10 Q -8,-25 0,-40 T 5,-55" fill="none" stroke="#ea580c" strokeWidth="2" strokeDasharray="3 2" />
              <path d="M 3,-10 Q 10,-25 5,-40 T -2,-55" fill="none" stroke="#f97316" strokeWidth="1.5" strokeDasharray="3 2" />
              <text x="0" y="16" textAnchor="middle" className="text-[9px] fill-orange-950 font-bold">
                {indoorSource === "cooking_tadka"
                  ? "Tadka Cooking"
                  : indoorSource === "incense_agarbatti"
                  ? "Agarbatti Smoke"
                  : indoorSource === "mosquito_coil"
                  ? "Mosquito Coil"
                  : "Emission Source"}
              </text>
            </g>
          )}

          {/* Room Center Concentration Particle Cloud (visual density indicator) */}
          <circle cx="250" cy="140" r="45" fill={aq.stroke} opacity="0.12" />
          <circle cx="250" cy="140" r="25" fill={aq.stroke} opacity="0.18" />
          <text x="250" y="143" textAnchor="middle" className="text-[12px] font-bold fill-slate-800 dark:fill-slate-100">
            {currentPM25} µg/m³
          </text>
          <text x="250" y="156" textAnchor="middle" className="text-[8px] fill-slate-600 dark:fill-slate-400">
            Uniform Mixed Chamber
          </text>
        </svg>
      </div>

      {/* Legend / Status Badges */}
      <div className="mt-3 flex flex-wrap items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 gap-2 border-t border-slate-200/60 dark:border-slate-800 pt-2">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
          <span>Purifier: {hasAirPurifier ? `${purifierCADR} CADR (${purifierFanSpeed})` : "Disabled"}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-sky-500"></span>
          <span>Ventilation: {ventilationMode.replace("_", " ")}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-block w-2.5 h-2.5 rounded-full ${indoorSource !== "none" ? "bg-orange-500" : "bg-emerald-500"}`}></span>
          <span>Source: {indoorSource !== "none" ? indoorSource.replace("_", " ") : "None"}</span>
        </div>
      </div>
    </div>
  );
}
