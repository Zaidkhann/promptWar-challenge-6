"use client";

import React, { useState } from "react";
import { Table as TableIcon, Map as MapIcon } from "lucide-react";
import { ScenarioData } from "@/data/mock-scenarios";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface DashboardStationViewItem {
  id: string;
  name: string;
  agency: string;
  distanceKm: number;
  aqi?: number | null;
  category?: string | null;
  provenance: string;
}

interface DashboardViewToggleProps {
  locationName?: string;
  city?: string;
  stations?: DashboardStationViewItem[];
  scenario?: ScenarioData;
  getBadgeVariant?: (category: string) => "good" | "satisfactory" | "moderate" | "poor" | "very-poor" | "severe" | "default";
}

function resolveBadgeVariant(category?: string | null): "good" | "satisfactory" | "moderate" | "poor" | "very-poor" | "severe" | "default" {
  if (!category) return "default";
  switch (category.toLowerCase()) {
    case "good":
      return "good";
    case "satisfactory":
      return "satisfactory";
    case "moderate":
      return "moderate";
    case "poor":
      return "poor";
    case "very poor":
      return "very-poor";
    case "severe":
      return "severe";
    default:
      return "default";
  }
}

export function DashboardViewToggle({
  locationName,
  city,
  stations,
  scenario,
  getBadgeVariant = resolveBadgeVariant,
}: DashboardViewToggleProps) {
  const [viewMode, setViewMode] = useState<"map" | "list">("list");

  const displayLocation = locationName || scenario?.locationName || "Monitored Area";
  const displayCity = city || scenario?.city || "Delhi-NCR";

  // Build items array from either passed stations or scenario fallback
  const items: DashboardStationViewItem[] = stations && stations.length > 0
    ? stations
    : scenario
    ? [
        {
          id: scenario.stationId,
          name: scenario.stationName,
          agency: "CPCB / SPCB Continuous CAAQMS",
          distanceKm: 0.8,
          aqi: scenario.aqi,
          category: scenario.category,
          provenance: "Direct Sensor (Verified)",
        },
        {
          id: "DL004_MANDIR_MARG",
          name: "Mandir Marg Station",
          agency: "DPCC CAAQMS",
          distanceKm: 6.2,
          aqi: scenario.aqi - 28,
          category: "Very Poor",
          provenance: "Adjacent Continuous Feed",
        },
        {
          id: "DL007_RK_PURAM",
          name: "R.K. Puram Station",
          agency: "DPCC CAAQMS",
          distanceKm: 9.5,
          aqi: scenario.aqi - 45,
          category: "Very Poor",
          provenance: "Deterministic IDW Cell",
        },
      ]
    : [];

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Regional Continuous Monitoring Network</CardTitle>
            <CardDescription>
              Live CAAQMS telemetry stations within the metropolitan spatial grid.
            </CardDescription>
          </div>

          {/* Accessible Toggle Button */}
          <div
            role="group"
            aria-label="View format toggle"
            className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs font-medium dark:border-slate-800 dark:bg-slate-900"
          >
            <button
              type="button"
              onClick={() => setViewMode("map")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-all ${
                viewMode === "map"
                  ? "bg-white text-slate-900 shadow-2xs font-semibold dark:bg-slate-800 dark:text-slate-100"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              }`}
              aria-pressed={viewMode === "map"}
            >
              <MapIcon className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>View as Map</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-all ${
                viewMode === "list"
                  ? "bg-white text-slate-900 shadow-2xs font-semibold dark:bg-slate-800 dark:text-slate-100"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              }`}
              aria-pressed={viewMode === "list"}
            >
              <TableIcon className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>View as List</span>
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {viewMode === "map" ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-10 text-center text-slate-600 space-y-3 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
            <MapIcon className="h-9 w-9 text-cyan-600 dark:text-cyan-400" aria-hidden="true" />
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-200">Regional Monitoring Station Grid</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md">
                Active monitoring coordinates for {displayLocation} centered at [{displayCity}]. Switch to &quot;View as List&quot; for complete keyboard accessibility and screen-reader parsing.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setViewMode("list")}>
              Switch to Accessible Station List
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
                  <th scope="col" className="p-3">Station Name & ID</th>
                  <th scope="col" className="p-3">Agency</th>
                  <th scope="col" className="p-3">Distance</th>
                  <th scope="col" className="p-3">NAQI</th>
                  <th scope="col" className="p-3">Status</th>
                  <th scope="col" className="p-3">Data Provenance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((item, index) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors ${
                      index === 0 ? "font-medium" : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <td className="p-3 text-slate-900 dark:text-slate-100">
                      <div>{item.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{item.id}</div>
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">{item.agency}</td>
                    <td className="p-3 font-mono">{item.distanceKm.toFixed(1)} km</td>
                    <td className="p-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                      {item.aqi ?? "N/A"}
                    </td>
                    <td className="p-3">
                      {item.category ? (
                        <Badge variant={getBadgeVariant(item.category)}>{item.category}</Badge>
                      ) : (
                        <Badge variant="outline">Insufficient</Badge>
                      )}
                    </td>
                    <td className={`p-3 text-xs ${index === 0 ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-cyan-600 dark:text-cyan-400"}`}>
                      {item.provenance}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
