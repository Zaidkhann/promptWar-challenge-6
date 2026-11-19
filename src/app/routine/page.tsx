import React, { Suspense } from "react";
import { getAirQualityReport } from "@/lib/aqi/service";
import { evaluateRoutineRecommendations, DEFAULT_USER_PREFERENCES } from "@/lib/recommendations";
import { RoutineDashboard } from "@/components/routine/RoutineDashboard";

export default async function RoutinePage({
  searchParams,
}: {
  searchParams: Promise<{ scenario?: string; lat?: string; lon?: string; mode?: string }>;
}) {
  const resolvedParams = await searchParams;
  const isLive = resolvedParams?.scenario === "live" || resolvedParams?.mode === "live";
  const scenarioKey = isLive ? undefined : (resolvedParams?.scenario || "delhi-anand-vihar");

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
