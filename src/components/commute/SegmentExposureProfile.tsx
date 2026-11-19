"use client";

import React from "react";
import { SegmentExposurePoint } from "@/lib/commute/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame, Radio, Activity } from "lucide-react";

interface SegmentExposureProfileProps {
  segments: SegmentExposurePoint[];
  totalDistanceKm: number;
  hasLiveOpenAQData?: boolean;
  provenanceSummary?: string;
}

export function SegmentExposureProfile({
  segments,
  totalDistanceKm,
  hasLiveOpenAQData,
  provenanceSummary,
}: SegmentExposureProfileProps) {
  const getProvenanceBadge = (type?: string, provider?: string) => {
    if (type === "real_openaq" || provider === "OPENAQ") {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-sky-700 bg-sky-50 dark:text-sky-300 dark:bg-sky-950/50 px-2 py-0.5 rounded-full border border-sky-200 dark:border-sky-800">
          <Radio className="h-2.5 w-2.5 animate-pulse text-sky-500" />
          <span>Real OpenAQ v3</span>
        </span>
      );
    }
    if (type === "real_cpcb" || provider === "CPCB") {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
          <Activity className="h-2.5 w-2.5 text-emerald-500" />
          <span>Real CPCB Monitor</span>
        </span>
      );
    }
    if (type === "idw_spatial_interpolation") {
      return (
        <span className="inline-flex items-center text-[10px] font-medium text-slate-600 bg-slate-50 dark:text-slate-400 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
          IDW Spatial Estimate
        </span>
      );
    }
    return (
      <span className="inline-flex items-center text-[10px] font-medium text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/50 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
        Calibrated Baseline
      </span>
    );
  };

  return (
    <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
              Segment-Level Pollution Distribution & Provenance
            </CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400 mt-1">
              Inverse Distance Weighting (IDW) pollutant sampling along the {totalDistanceKm} km corridor, cross-referenced with CPCB CAAQMS and OpenAQ v3 telemetry.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {hasLiveOpenAQData && (
              <Badge variant="outline" className="text-xs bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800">
                <Radio className="h-3 w-3 mr-1 text-sky-500 animate-pulse" />
                Live OpenAQ Active
              </Badge>
            )}
            <Badge variant="outline" className="text-xs border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
              {segments.length} Waypoints Discretized
            </Badge>
          </div>
        </div>

        {provenanceSummary && (
          <div className="mt-2 text-[11px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
            <span className="font-semibold text-slate-700 dark:text-slate-200">Data Provenance: </span>
            <span>{provenanceSummary}</span>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-900 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Corridor Leg</th>
                <th className="px-3 py-2">Distance</th>
                <th className="px-3 py-2">Est. PM2.5</th>
                <th className="px-3 py-2">Est. PM10</th>
                <th className="px-3 py-2">Nearest Monitor</th>
                <th className="px-3 py-2">Provenance</th>
                <th className="px-3 py-2">Confidence</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {segments.map((seg) => (
                <tr key={seg.segmentIndex} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-3 py-2.5 font-mono text-slate-400 dark:text-slate-500">
                    {seg.segmentIndex + 1}
                  </td>
                  <td className="px-3 py-2.5 font-medium text-slate-800 dark:text-slate-200">
                    Leg {seg.segmentIndex + 1}
                  </td>
                  <td className="px-3 py-2.5">{seg.distanceKm} km</td>
                  <td className="px-3 py-2.5 font-mono font-bold text-slate-900 dark:text-slate-100">
                    {seg.estimatedPM25} µg/m³
                  </td>
                  <td className="px-3 py-2.5 font-mono text-slate-500 dark:text-slate-400">
                    {seg.estimatedPM10} µg/m³
                  </td>
                  <td className="px-3 py-2.5 text-slate-700 dark:text-slate-300">
                    {seg.nearestStationName.split(",")[0]} ({seg.nearestStationDistanceKm} km)
                  </td>
                  <td className="px-3 py-2.5">
                    {getProvenanceBadge(seg.measurementType, seg.stationProvider)}
                  </td>
                  <td className="px-3 py-2.5 font-mono">
                    {Math.round(seg.confidenceScore * 100)}%
                  </td>
                  <td className="px-3 py-2.5">
                    {seg.isHotspot ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 dark:text-rose-300 dark:bg-rose-950/50 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-900/60">
                        <Flame className="h-3 w-3" />
                        <span>Hotspot</span>
                      </span>
                    ) : (
                      <span className="text-emerald-700 dark:text-emerald-400 font-medium">Standard Flow</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
