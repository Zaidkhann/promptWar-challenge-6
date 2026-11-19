"use client";

import React from "react";
import {
  ShieldAlert,
  AlertTriangle,
  Info,
  CheckCircle2,
  BookOpen,
  Home,
  Clock,
  Sparkles,
} from "lucide-react";
import { Recommendation } from "@/lib/recommendations/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface RecommendationCardProps {
  recommendation: Recommendation;
}

export function RecommendationCard({ recommendation }: RecommendationCardProps) {
  const getPriorityBadge = (priority: Recommendation["priority"]) => {
    switch (priority) {
      case "critical":
        return (
          <Badge className="bg-red-100 text-red-950 border-red-300 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800 font-bold uppercase text-[10px]">
            <ShieldAlert className="h-3 w-3 text-red-700 dark:text-red-400" />
            Critical Action
          </Badge>
        );
      case "high":
        return (
          <Badge className="bg-orange-100 text-orange-950 border-orange-300 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800 font-semibold uppercase text-[10px]">
            <AlertTriangle className="h-3 w-3 text-orange-700 dark:text-orange-400" />
            High Priority
          </Badge>
        );
      case "medium":
        return (
          <Badge className="bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 font-medium text-[10px]">
            <Info className="h-3 w-3 text-amber-700 dark:text-amber-400" />
            Advisory
          </Badge>
        );
      case "low":
        return (
          <Badge className="bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 font-medium text-[10px]">
            <CheckCircle2 className="h-3 w-3 text-emerald-700 dark:text-emerald-400" />
            Recommended
          </Badge>
        );
    }
  };

  const getBorderColor = (priority: Recommendation["priority"]) => {
    switch (priority) {
      case "critical":
        return "border-red-300 bg-red-50/20 dark:border-red-900/60 dark:bg-red-950/20";
      case "high":
        return "border-orange-200 bg-orange-50/15 dark:border-orange-900/60 dark:bg-orange-950/20";
      case "medium":
        return "border-amber-200 bg-amber-50/10 dark:border-amber-900/60 dark:bg-amber-950/20";
      case "low":
        return "border-slate-200 bg-white dark:border-slate-800 dark:bg-[#111827]";
    }
  };

  return (
    <Card className={`transition-all hover:shadow-xs ${getBorderColor(recommendation.priority)}`}>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {getPriorityBadge(recommendation.priority)}
            <Badge variant="outline" className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">
              {recommendation.category.replace("_", " ")}
            </Badge>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            {recommendation.dataMode === "live" ? (
              <span className="inline-flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-pulse" />
                Live Telemetry
              </span>
            ) : recommendation.dataMode === "forecast" ? (
              <span className="inline-flex items-center gap-1 font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                <Clock className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                Diurnal Forecast
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 font-medium text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900">
                Calibrated Model
              </span>
            )}
          </div>
        </div>

        <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 mt-2">
          {recommendation.title}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3.5 text-xs">
        {/* Action Summary Callout */}
        <div className="rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#1E293B] p-3 font-medium text-slate-900 dark:text-slate-100 shadow-2xs">
          {recommendation.actionSummary}
        </div>

        {/* Detailed Explanation */}
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
          {recommendation.explanation}
        </p>

        {/* Direct Impact & Quantified Benefit Box (Section 3 Requirement) */}
        {recommendation.directImpact && (
          <div className="rounded-xl border border-cyan-200 dark:border-cyan-900/60 bg-cyan-50/40 dark:bg-cyan-950/20 p-3.5 space-y-2.5 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-1.5 pb-2 border-b border-cyan-200/60 dark:border-cyan-900/40">
              <span className="font-bold text-cyan-900 dark:text-cyan-300 flex items-center gap-1.5 text-xs">
                <Sparkles className="h-3.5 w-3.5 text-cyan-700 dark:text-cyan-400" />
                <span>Direct Impact & Quantified Benefit:</span>
              </span>

              {/* Quantified Metric Badges */}
              <div className="flex flex-wrap gap-1.5">
                {recommendation.directImpact.quantifiedMetrics?.exposureReductionPercent !== undefined && (
                  <Badge className="bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 text-[10px] font-bold">
                    -{recommendation.directImpact.quantifiedMetrics.exposureReductionPercent}% Exposure
                  </Badge>
                )}
                {recommendation.directImpact.quantifiedMetrics?.inhaledDoseAvoidedUg !== undefined && (
                  <Badge className="bg-sky-100 text-sky-950 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800 text-[10px] font-bold">
                    -{recommendation.directImpact.quantifiedMetrics.inhaledDoseAvoidedUg} µg PM2.5 Inhaled
                  </Badge>
                )}
                {recommendation.directImpact.quantifiedMetrics?.emissionsAvoidedGCO2e !== undefined && (
                  <Badge className="bg-teal-100 text-teal-950 border-teal-300 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800 text-[10px] font-bold">
                    -{recommendation.directImpact.quantifiedMetrics.emissionsAvoidedGCO2e}g CO2e Avoided
                  </Badge>
                )}
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 text-[11px]">
              <div>
                <span className="font-semibold text-slate-700 dark:text-slate-300 block">What to change:</span>
                <span className="text-slate-600 dark:text-slate-400">{recommendation.directImpact.whatToChange}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-700 dark:text-slate-300 block">Expected Benefit:</span>
                <span className="text-slate-600 dark:text-slate-400">{recommendation.directImpact.expectedBenefit}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-cyan-100 dark:border-cyan-900/40 text-[10px] text-slate-500 dark:text-slate-400 space-y-1">
              <div>
                <strong className="text-slate-600 dark:text-slate-300">How calculated:</strong> {recommendation.directImpact.calculationMethodology}
              </div>
              <div>
                <strong className="text-slate-600 dark:text-slate-300">Assumptions & Limitations:</strong> {recommendation.directImpact.assumptionsAndLimitations}
              </div>
              <div className="text-[9px] italic text-slate-400 dark:text-slate-500">
                * Quantified values represent deterministic physiological models (EPA minute ventilation & ICRP 66) rather than individual clinical readings.
              </div>
            </div>
          </div>
        )}

        {/* Indoor Alternative Callout (if available) */}
        {recommendation.indoorAlternative && (
          <div className="rounded-lg border border-cyan-200 dark:border-cyan-900/60 bg-cyan-50/60 dark:bg-cyan-950/30 p-3 space-y-1 text-cyan-950 dark:text-cyan-200">
            <div className="flex items-center gap-1.5 font-bold text-cyan-900 dark:text-cyan-300">
              <Home className="h-4 w-4 text-cyan-700 dark:text-cyan-400 shrink-0" aria-hidden="true" />
              <span>Recommended Indoor Alternative:</span>
            </div>
            <div className="font-semibold text-slate-900 dark:text-slate-100 text-[11px]">
              {recommendation.indoorAlternative.title}
            </div>
            <p className="text-slate-700 dark:text-slate-300 text-[11px]">
              {recommendation.indoorAlternative.description}
            </p>
          </div>
        )}

        {/* Supporting Evidence & Scientific Provenance */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1 font-mono text-slate-600 dark:text-slate-300">
            <span className="font-semibold">Evidence:</span>
            <span>{recommendation.supportingDataText}</span>
          </div>

          <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
            <BookOpen className="h-3.5 w-3.5 text-cyan-700 dark:text-cyan-400 shrink-0" aria-hidden="true" />
            <span className="italic">{recommendation.source}</span>
          </div>
        </div>

        {/* Matched User Preferences Pills */}
        {recommendation.matchedPreferences.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px] text-slate-400 dark:text-slate-500">
            <Sparkles className="h-3 w-3 text-cyan-600 dark:text-cyan-400 shrink-0" />
            <span>Tuned for:</span>
            {recommendation.matchedPreferences.map((pref, idx) => (
              <span
                key={idx}
                className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700"
              >
                {pref}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
