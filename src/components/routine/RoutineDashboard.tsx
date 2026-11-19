"use client";

import React, { useState } from "react";
import {
  RefreshCw,
  Sun,
  ShieldCheck,
  AlertTriangle,
  Info,
  SlidersHorizontal,
} from "lucide-react";
import {
  RoutineEvaluationResult,
  UserPreferences,
  evaluateRoutineRecommendations,
} from "@/lib/recommendations";
import { NormalizedAirQualityReport } from "@/lib/aqi/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RoutineTimeline } from "./RoutineTimeline";
import { RecommendationCard } from "./RecommendationCard";
import { RoutinePreferencesForm } from "./RoutinePreferencesForm";

interface RoutineDashboardProps {
  initialResult: RoutineEvaluationResult;
  initialReport: NormalizedAirQualityReport;
  scenarioKey?: string;
}

export function RoutineDashboard({
  initialResult,
  initialReport,
  scenarioKey,
}: RoutineDashboardProps) {
  const [report, setReport] = useState<NormalizedAirQualityReport>(initialReport);
  const [preferences, setPreferences] = useState<UserPreferences>(initialResult.userPreferences);
  const [result, setResult] = useState<RoutineEvaluationResult>(initialResult);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);

  const handleUpdatePreferences = (newPrefs: UserPreferences) => {
    setPreferences(newPrefs);
    const newResult = evaluateRoutineRecommendations({
      aqiReport: report,
      preferences: newPrefs,
      currentHour: new Date().getHours(),
    });
    setResult(newResult);
    setIsPreferencesOpen(false);
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      const url = scenarioKey
        ? `/api/aqi/live?scenario=${encodeURIComponent(scenarioKey)}`
        : `/api/aqi/live?lat=${report.station.latitude}&lon=${report.station.longitude}`;

      const res = await fetch(url);
      if (res.ok) {
        const freshReport: NormalizedAirQualityReport = await res.json();
        setReport(freshReport);
        const freshResult = evaluateRoutineRecommendations({
          aqiReport: freshReport,
          preferences,
          currentHour: new Date().getHours(),
        });
        setResult(freshResult);
      }
    } catch (err) {
      console.warn("Failed to refresh live telemetry:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const aqiSummary = result.aqiSummary;
  const isSevere = aqiSummary.category === "Severe";

  const getAQIBadgeVariant = (category: string) => {
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
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Personalized Daily Routine Synthesizer
            </h1>
            <Badge variant={aqiSummary.dataMode === "live" ? "default" : "demo"}>
              {aqiSummary.dataMode === "live"
                ? "Live Telemetry"
                : aqiSummary.dataMode === "forecast"
                ? "Diurnal Forecast"
                : "Judging Scenario"}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Deterministic daily lifestyle scheduler optimizing physical exertion and ventilation around atmospheric thermal inversion boundaries.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsPreferencesOpen(!isPreferencesOpen)}
            className="text-xs flex items-center gap-1.5"
            aria-label="Toggle user preferences panel"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-cyan-700 dark:text-cyan-400" />
            <span>Customize Preferences</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="text-xs flex items-center gap-1.5"
            aria-label="Refresh environmental telemetry"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-cyan-700 dark:text-cyan-400 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>{isRefreshing ? "Refreshing..." : "Refresh Air Data"}</span>
          </Button>
        </div>
      </div>

      {/* Stale / Expired / Insufficient Data Warning Banner */}
      {result.status !== "SUCCESS" && (
        <aside
          aria-label="Environmental Data Integrity Alert"
          className={`rounded-xl border p-4 text-xs ${
            result.status === "EXPIRED_DATA"
              ? "border-red-300 bg-red-50 text-red-950 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
              : result.status === "STALE_DATA"
              ? "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
              : "border-slate-300 bg-slate-50 text-slate-800 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300"
          }`}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle
              className={`h-5 w-5 shrink-0 mt-0.5 ${
                result.status === "EXPIRED_DATA"
                  ? "text-red-700 dark:text-red-400"
                  : "text-amber-700 dark:text-amber-400"
              }`}
            />
            <div>
              <div className="font-bold">
                {result.status === "EXPIRED_DATA"
                  ? "Expired Observation Notice (> 3 Hours Old)"
                  : result.status === "STALE_DATA"
                  ? "Stale Telemetry Advisory (1 – 3 Hours Old)"
                  : "Insufficient Particulate Data"}
              </div>
              <p className="mt-1 leading-relaxed">{result.statusMessage}</p>
            </div>
          </div>
        </aside>
      )}

      {/* Interactive Preferences Panel */}
      <RoutinePreferencesForm
        preferences={preferences}
        onUpdatePreferences={handleUpdatePreferences}
        isOpen={isPreferencesOpen}
        onToggle={() => setIsPreferencesOpen(!isPreferencesOpen)}
      />

      {/* Air Quality & Inversion Context Card */}
      <Card className="border-slate-200 dark:border-slate-800 dark:bg-[#111827]">
        <CardContent className="p-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Metric 1: Current NAQI */}
            <div className="rounded-xl border border-slate-200/80 bg-slate-50 dark:border-slate-800 dark:bg-[#1E293B]/60 p-4 space-y-1">
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Official CPCB NAQI
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-950 dark:text-white">
                  {aqiSummary.aqi ?? "N/A"}
                </span>
                <Badge variant={getAQIBadgeVariant(aqiSummary.category)}>
                  {aqiSummary.category}
                </Badge>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Dominant: {aqiSummary.dominantPollutant ?? "Particulates"}
              </div>
            </div>

            {/* Metric 2: Acute 1-hr HISI */}
            <div className="rounded-xl border border-slate-200/80 bg-slate-50 dark:border-slate-800 dark:bg-[#1E293B]/60 p-4 space-y-1">
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Acute 1-Hr Smog Peak (HISI)
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-950 dark:text-white">
                  {aqiSummary.hisi}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">Peak Indicator</span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                1-hour moving particulate spike
              </div>
            </div>

            {/* Metric 3: Boundary Layer */}
            <div className="rounded-xl border border-slate-200/80 bg-slate-50 dark:border-slate-800 dark:bg-[#1E293B]/60 p-4 space-y-1">
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Thermal Inversion Layer
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-950 dark:text-white">
                  {Math.round(aqiSummary.boundaryLayerMeters)} m
                </span>
              </div>
              <div className="text-[11px]">
                {aqiSummary.isInversionActive ? (
                  <span className="font-semibold text-rose-700 dark:text-rose-400">Active Inversion Trap</span>
                ) : (
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400">Open Mixing Depth</span>
                )}
              </div>
            </div>

            {/* Metric 4: Provenance & Freshness */}
            <div className="rounded-xl border border-slate-200/80 bg-slate-50 dark:border-slate-800 dark:bg-[#1E293B]/60 p-4 space-y-1">
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Station Provenance</span>
              </div>
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                {aqiSummary.stationName}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Data Freshness: {result.dataFreshnessMinutes} mins ago
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Solar Boundary Layer Breakdown Window (Highlight Card) */}
      <Card
        className={`border-l-4 ${
          isSevere
            ? "border-l-amber-500 bg-amber-50/30 dark:bg-amber-950/20 border-slate-200 dark:border-slate-800"
            : "border-l-cyan-600 bg-cyan-50/30 dark:bg-cyan-950/20 border-slate-200 dark:border-slate-800"
        }`}
      >
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-900 dark:text-amber-300">
                  <Sun className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Optimal Activity & Ventilation Window Today: 12:00 – 15:30 IST
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                Solar insolation breaks nocturnal thermal stratification, lifting the boundary layer and diluting surface particulate density. Plan essential outdoor errands, groceries, or brief 20-minute cross-ventilation during this window.
              </p>
            </div>

            <div className="shrink-0 flex flex-col items-start sm:items-end text-xs">
              <span className="font-bold text-slate-900 dark:text-slate-100">Avoid Peak Hours:</span>
              <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                06:00 – 09:30 IST & 17:30 – 20:30 IST
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chronological Diurnal Timeline Component */}
      <RoutineTimeline schedule={result.schedule} />

      {/* Prioritized Recommendation Action Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Personalized Actionable Advisories ({result.recommendations.length})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Deterministic guidelines prioritized by exposure severity and tailored to your preferences.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono">
            <span>Ordered by Criticality</span>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {result.recommendations.map((rec) => (
            <RecommendationCard key={rec.id} recommendation={rec} />
          ))}
        </div>
      </div>

      {/* Statutory Health Protective Disclaimer */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#111827] p-4 text-xs text-slate-500 dark:text-slate-400 space-y-1">
        <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
          <Info className="h-4 w-4 text-cyan-700 dark:text-cyan-400 shrink-0" aria-hidden="true" />
          <span>Statutory Health & Precautionary Notice:</span>
        </div>
        <p className="leading-relaxed">
          SaansAI routine recommendations are deterministic lifestyle exposure mitigation guidelines derived from statutory CPCB NAQI advisories, WHO Air Quality Guidelines, and planetary boundary layer meteorological physics. They do not constitute formal medical diagnosis, clinical treatment plans, or individual medical prescriptions. Consult a qualified medical practitioner for personalized pulmonary or cardiovascular care.
        </p>
      </div>
    </div>
  );
}
