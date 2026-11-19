"use client";

import React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { AlertTriangle, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function ScenarioSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentScenario = searchParams.get("scenario") || "delhi-anand-vihar";

  const handleScenarioChange = (scenarioId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("scenario", scenarioId);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
        <MapPin className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" aria-hidden="true" />
        <span className="hidden sm:inline">Scenario:</span>
      </span>
      <div
        role="radiogroup"
        aria-label="Select evaluation demonstration scenario"
        className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 dark:border-slate-800 dark:bg-slate-900"
      >
        <button
          type="button"
          role="radio"
          aria-checked={currentScenario === "delhi-anand-vihar"}
          onClick={() => handleScenarioChange("delhi-anand-vihar")}
          className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
            currentScenario === "delhi-anand-vihar"
              ? "bg-white text-slate-900 shadow-2xs font-semibold dark:bg-slate-800 dark:text-slate-100"
              : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          }`}
        >
          <span className="h-2 w-2 rounded-full bg-red-600" aria-hidden="true" />
          <span>Delhi (Severe 482)</span>
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={currentScenario === "mumbai-bandra"}
          onClick={() => handleScenarioChange("mumbai-bandra")}
          className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
            currentScenario === "mumbai-bandra"
              ? "bg-white text-slate-900 shadow-2xs font-semibold dark:bg-slate-800 dark:text-slate-100"
              : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          }`}
        >
          <span className="h-2 w-2 rounded-full bg-amber-500" aria-hidden="true" />
          <span>Mumbai (Mod 154)</span>
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={currentScenario === "live"}
          onClick={() => handleScenarioChange("live")}
          className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
            currentScenario === "live"
              ? "bg-white text-slate-900 shadow-2xs font-semibold dark:bg-slate-800 dark:text-slate-100"
              : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          }`}
        >
          <span className="h-2 w-2 rounded-full bg-cyan-600 animate-pulse" aria-hidden="true" />
          <span>Live Station Feed</span>
        </button>
      </div>
    </div>
  );
}

export function DemoBannerContent() {
  const searchParams = useSearchParams();
  const currentScenario = searchParams.get("scenario") || "delhi-anand-vihar";
  const isLive = currentScenario === "live";

  return (
    <aside
      aria-label="Environmental Intelligence Status Notice"
      className={`border-b px-4 py-1.5 text-xs transition-colors ${
        isLive
          ? "border-cyan-200/80 bg-cyan-50/70 text-cyan-950 dark:border-cyan-900/50 dark:bg-cyan-950/30 dark:text-cyan-200"
          : "border-amber-200/80 bg-amber-50/70 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200"
      }`}
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <Badge variant={isLive ? "default" : "demo"} className="shrink-0 text-[10px]">
            {isLive ? "Live Telemetry" : "Judging Scenario"}
          </Badge>
          <p className="flex items-center gap-1.5 text-[11px] font-medium text-slate-700 dark:text-slate-300">
            <AlertTriangle
              className={`h-3.5 w-3.5 shrink-0 ${isLive ? "text-cyan-600 dark:text-cyan-400" : "text-amber-600 dark:text-amber-400"}`}
              aria-hidden="true"
            />
            <span>
              {isLive ? (
                <>
                  <strong>Live Atmospheric Pipeline Active:</strong> Real-time Open-Meteo & OpenAQ v3 / CPCB CAAQMS normalization.
                </>
              ) : (
                <>
                  <strong>Reference Scenario Active:</strong> Deterministic CPCB-calibrated baseline data for standardized evaluation.
                </>
              )}
            </span>
          </p>
        </div>
        <ScenarioSwitcher />
      </div>
    </aside>
  );
}

export function DemoBanner() {
  return (
    <React.Suspense
      fallback={
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-1.5 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900">
          Initializing environmental telemetry...
        </div>
      }
    >
      <DemoBannerContent />
    </React.Suspense>
  );
}
