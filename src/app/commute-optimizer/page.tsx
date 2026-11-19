import React, { Suspense } from "react";
import type { Metadata } from "next";
import { resolveCommuteRoute } from "@/lib/commute/routing/service";
import { sampleRouteSpatialExposureAsync } from "@/lib/commute/spatial-exposure";
import { compareCommuteAlternatives } from "@/lib/commute/comparator";
import { generateCommuteActionAdvisories } from "@/lib/commute/recommendations";
import { CommuteOptimizerView } from "@/components/commute/CommuteOptimizerView";
import { getAirQualityReport } from "@/lib/aqi/service";

export const metadata: Metadata = {
  title: "Smart Commute Optimizer & Respiratory Exposure Dosimetry | SaansAI",
  description: "ICRP 66 human respiratory tract deposition modeling comparing inhaled particulate mass and carbon across 6 transit modes.",
};

export default async function CommuteOptimizerPage({
  searchParams,
}: {
  searchParams: Promise<{ scenario?: string; origin?: string; destination?: string }>;
}) {
  const resolved = await searchParams;
  const scenarioKey = resolved?.scenario;

  const defaultOrigin = resolved?.origin || "Connaught Place, New Delhi";
  const defaultDestination = resolved?.destination || "Cyber City, Gurugram";

  // Resolve road network
  const resolvedRoute = await resolveCommuteRoute(defaultOrigin, defaultDestination);

  // Fetch real-time live air quality at the route origin coordinates
  const originReport = await getAirQualityReport({
    lat: resolvedRoute.route.origin.lat,
    lon: resolvedRoute.route.origin.lon,
    scenario: scenarioKey,
  });
  const liveAmbientPM25 = originReport.pollutants["PM2.5"]?.value ?? 99;

  const spatialProfile = await sampleRouteSpatialExposureAsync(resolvedRoute.route, liveAmbientPM25, 8);
  const initialMatrix = compareCommuteAlternatives({
    route: resolvedRoute.route,
    spatialProfile,
    departureHour: 8,
    maskType: "NONE",
    objective: "lowest_exposure",
  });
  const initialAdvisories = generateCommuteActionAdvisories(initialMatrix);

  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-slate-500">
          Synthesizing real-world road network and respiratory dosimetry...
        </div>
      }
    >
      <CommuteOptimizerView
        initialMatrix={initialMatrix}
        initialAdvisories={initialAdvisories}
        initialScenarioKey={scenarioKey}
      />
    </Suspense>
  );
}
