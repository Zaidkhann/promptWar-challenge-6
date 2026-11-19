"use client";

import React, { useState, useCallback } from "react";
import {
  Map,
  BarChart3,
  Leaf,
  BookOpen,
  Info,
} from "lucide-react";
import {
  CommuteComparisonMatrix as MatrixType,
  MaskType,
  OptimizationObjective,
} from "@/lib/commute/types";
import { CommuteActionImpactAdvisory } from "@/lib/commute/recommendations";
import { RoutePlanner } from "./RoutePlanner";
import { InteractiveRouteMap } from "./InteractiveRouteMap";
import { CommuteComparisonMatrix } from "./CommuteComparisonMatrix";
import { DosimetryAnalyticsChart } from "./DosimetryAnalyticsChart";
import { CarbonVsExposureChart } from "./CarbonVsExposureChart";
import { SegmentExposureProfile } from "./SegmentExposureProfile";
import { ActionImpactBanner } from "./ActionImpactBanner";
import { Badge } from "@/components/ui/badge";

interface CommuteOptimizerViewProps {
  initialMatrix: MatrixType;
  initialAdvisories: CommuteActionImpactAdvisory[];
  initialScenarioKey?: string;
}

export function CommuteOptimizerView({
  initialMatrix,
  initialAdvisories,
  initialScenarioKey = "delhi-anand-vihar",
}: CommuteOptimizerViewProps) {
  const [matrix, setMatrix] = useState<MatrixType>(initialMatrix);
  const [advisories, setAdvisories] = useState<CommuteActionImpactAdvisory[]>(initialAdvisories);
  const [origin, setOrigin] = useState(initialMatrix.route.origin.name || "Anand Vihar, Delhi");
  const [destination, setDestination] = useState(initialMatrix.route.destination.name || "Connaught Place, New Delhi");
  const [departureHour, setDepartureHour] = useState(initialMatrix.departureHour);
  const [maskType, setMaskType] = useState<MaskType>(initialMatrix.maskType);
  const [objective, setObjective] = useState<OptimizationObjective>("lowest_exposure");
  const [activeTab, setActiveTab] = useState<"overview" | "analytics" | "carbon" | "citations">("overview");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSelectCorridor = (newOrigin: string, newDest: string) => {
    setOrigin(newOrigin);
    setDestination(newDest);
    runAnalysis(newOrigin, newDest, departureHour, maskType, objective);
  };

  const runAnalysis = useCallback(
    async (
      orig: string,
      dest: string,
      hour: number,
      mask: MaskType,
      obj: OptimizationObjective
    ) => {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const res = await fetch("/api/commute/exposure", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            origin: orig,
            destination: dest,
            departureHour: hour,
            maskType: mask,
            objective: obj,
            ambientPM25: initialScenarioKey === "mumbai-bandra" ? 42 : 388,
          }),
        });

        const data = await res.json();
        if (data.success && data.data?.matrix) {
          setMatrix(data.data.matrix);
          setAdvisories(data.data.advisories || []);
        } else {
          setErrorMsg(data.error || "Failed to analyze commute route.");
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Network error during route analysis.";
        setErrorMsg(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [initialScenarioKey]
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Smart Commute Optimizer & Exposure Dosimetry
            </h1>
            <Badge variant="demo">Deterministic Physics + AI</Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-world road geometry, spatial IDW pollution sampling, and ICRP 66 respiratory dosimetry across 8 transit alternatives.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-xs">
            Corridor: {matrix.route.distanceKm} km | {matrix.route.provider}
          </Badge>
        </div>
      </div>

      {/* Route Planner Form */}
      <RoutePlanner
        origin={origin}
        setOrigin={setOrigin}
        destination={destination}
        setDestination={setDestination}
        departureHour={departureHour}
        setDepartureHour={setDepartureHour}
        maskType={maskType}
        setMaskType={setMaskType}
        objective={objective}
        setObjective={setObjective}
        onSelectCorridor={handleSelectCorridor}
        onAnalyze={() => runAnalysis(origin, destination, departureHour, maskType, objective)}
        isLoading={isLoading}
      />

      {errorMsg && (
        <div className="rounded-lg border border-rose-300 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 p-4 text-xs text-rose-800 dark:text-rose-300">
          <strong>Routing Warning:</strong> {errorMsg}
        </div>
      )}

      {/* Top Action Impact Highlight Card */}
      <ActionImpactBanner matrix={matrix} advisories={advisories} />

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <div role="tablist" aria-label="Commute route analysis perspectives" className="flex space-x-6">
          <button
            type="button"
            role="tab"
            id="tab-commute-overview"
            aria-selected={activeTab === "overview"}
            aria-controls="panel-commute-overview"
            onClick={() => setActiveTab("overview")}
            className={`pb-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
              activeTab === "overview"
                ? "border-cyan-600 text-cyan-800 dark:text-cyan-400 dark:border-cyan-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <Map className="h-4 w-4" aria-hidden="true" />
            <span>Route Map & Modal Comparison</span>
          </button>

          <button
            type="button"
            role="tab"
            id="tab-commute-analytics"
            aria-selected={activeTab === "analytics"}
            aria-controls="panel-commute-analytics"
            onClick={() => setActiveTab("analytics")}
            className={`pb-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
              activeTab === "analytics"
                ? "border-cyan-600 text-cyan-800 dark:text-cyan-400 dark:border-cyan-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <BarChart3 className="h-4 w-4" aria-hidden="true" />
            <span>Dosimetry Analytics</span>
          </button>

          <button
            type="button"
            role="tab"
            id="tab-commute-carbon"
            aria-selected={activeTab === "carbon"}
            aria-controls="panel-commute-carbon"
            onClick={() => setActiveTab("carbon")}
            className={`pb-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
              activeTab === "carbon"
                ? "border-cyan-600 text-cyan-800 dark:text-cyan-400 dark:border-cyan-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <Leaf className="h-4 w-4" aria-hidden="true" />
            <span>Carbon vs. Exposure Tradeoff</span>
          </button>

          <button
            type="button"
            role="tab"
            id="tab-commute-citations"
            aria-selected={activeTab === "citations"}
            aria-controls="panel-commute-citations"
            onClick={() => setActiveTab("citations")}
            className={`pb-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
              activeTab === "citations"
                ? "border-cyan-600 text-cyan-800 dark:text-cyan-400 dark:border-cyan-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            <span>Waypoints & Scientific Foundations</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Overview (Map + 8-Mode Cards) */}
      {activeTab === "overview" && (
        <div id="panel-commute-overview" role="tabpanel" aria-labelledby="tab-commute-overview" className="space-y-6">
          <InteractiveRouteMap
            geometry={matrix.route.geometry}
            segments={matrix.spatialProfile.segments}
            origin={matrix.route.origin}
            destination={matrix.route.destination}
          />

          <CommuteComparisonMatrix
            modes={matrix.modes}
            distanceKm={matrix.route.distanceKm}
          />
        </div>
      )}

      {/* Tab 2: Dosimetry Analytics */}
      {activeTab === "analytics" && (
        <div id="panel-commute-analytics" role="tabpanel" aria-labelledby="tab-commute-analytics" className="space-y-6">
          <DosimetryAnalyticsChart modes={matrix.modes} />

          <SegmentExposureProfile
            segments={matrix.spatialProfile.segments}
            totalDistanceKm={matrix.route.distanceKm}
            hasLiveOpenAQData={matrix.spatialProfile.hasLiveOpenAQData}
            provenanceSummary={matrix.spatialProfile.provenanceSummary}
          />
        </div>
      )}

      {/* Tab 3: Carbon vs Exposure Tradeoff */}
      {activeTab === "carbon" && (
        <div id="panel-commute-carbon" role="tabpanel" aria-labelledby="tab-commute-carbon" className="space-y-6">
          <CarbonVsExposureChart modes={matrix.modes} />
        </div>
      )}

      {/* Tab 4: Waypoints & Citations */}
      {activeTab === "citations" && (
        <div id="panel-commute-citations" role="tabpanel" aria-labelledby="tab-commute-citations" className="space-y-6">
          <SegmentExposureProfile
            segments={matrix.spatialProfile.segments}
            totalDistanceKm={matrix.route.distanceKm}
            hasLiveOpenAQData={matrix.spatialProfile.hasLiveOpenAQData}
            provenanceSummary={matrix.spatialProfile.provenanceSummary}
          />

          {/* Citations Card */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Authoritative Scientific Citations & Model Assumptions
            </h4>
            <div className="grid gap-3 sm:grid-cols-2">
              {matrix.citations.map((cite, idx) => (
                <div key={idx} className="rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#1E293B]/60 p-3 text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-900 dark:text-slate-100">
                    <span>{cite.parameter}</span>
                    <span className="text-cyan-700 dark:text-cyan-400 font-mono">{cite.value}</span>
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-300">
                    <strong>Source:</strong> {cite.source} ({cite.publication})
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 italic">
                    <strong>Limitation:</strong> {cite.limitation}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Scientific Transparency Disclaimer */}
      <aside
        aria-label="Dosimetry Disclaimer"
        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4 text-xs text-slate-500 dark:text-slate-400 space-y-1 shadow-2xs"
      >
        <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
          <Info className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
          <span>Scientific Inhaled Mass vs. Deposited Dosimetry Formulation:</span>
        </div>
        <p className="leading-relaxed">
          {"Inhaled mass is calculated continuously as D = ∫ C_breathing(t) · V_E(t) dt over journey segments. Deposited respiratory tract dose is derived using the International Commission on Radiological Protection (ICRP Publication 66) human respiratory tract model with an aggregate fine-particle deposition fraction (DF_2.5 = 0.28 ± 0.07). Parameter intervals represent physiological ventilation bounds (8 - 36 L/min) and vehicle in-cabin penetration factors. These results represent comparative environmental exposure estimates, not clinical diagnostic measurements."}
        </p>
      </aside>
    </div>
  );
}
