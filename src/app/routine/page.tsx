import React, { Suspense } from "react";
import type { Metadata } from "next";
import { getAirQualityReport } from "@/lib/aqi/service";
import { evaluateRoutineRecommendations, DEFAULT_USER_PREFERENCES } from "@/lib/recommendations";
import { RoutineDashboard } from "@/components/routine/RoutineDashboard";

export const metadata: Metadata = {
  title: "Personalized Daily Smog Routine & Diurnal Timeline | SaansAI",
  description: "Diurnal atmospheric boundary layer modeling, safe activity windows, and cohort-specific lifestyle recommendations.",
};

export default async function RoutinePage({
  searchParams,
}: {
  searchParams: Promise<{ scenario?: string; lat?: string; lon?: string; city?: string }>;
}) {
  const resolvedParams = await searchParams;
  const scenarioKey = (resolvedParams?.scenario && resolvedParams.scenario !== "live")
    ? resolvedParams.scenario
    : undefined;

  const report = await getAirQualityReport({
    lat: resolvedParams?.lat ? parseFloat(resolvedParams.lat) : undefined,
    lon: resolvedParams?.lon ? parseFloat(resolvedParams.lon) : undefined,
    scenario: scenarioKey,
  });

  const initialResult = evaluateRoutineRecommendations({
    aqiReport: report,
    preferences: DEFAULT_USER_PREFERENCES,
    currentHour: new Date().getHours(),
  });

  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-500 text-xs">
          Synthesizing personalized diurnal routine...
        </div>
      }
    >
      <RoutineDashboard
        initialReport={report}
        initialResult={initialResult}
        scenarioKey={scenarioKey}
      />
    </Suspense>
  );
}
