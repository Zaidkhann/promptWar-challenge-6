import React, { Suspense } from "react";
import { resolveCommuteRoute } from "@/lib/commute/routing/service";
import { sampleRouteSpatialExposureAsync } from "@/lib/commute/spatial-exposure";
import { compareCommuteAlternatives } from "@/lib/commute/comparator";
import { generateCommuteActionAdvisories } from "@/lib/commute/recommendations";
import { CommuteOptimizerView } from "@/components/commute/CommuteOptimizerView";

export default async function CommuteOptimizerPage({
  searchParams,
}: {
  searchParams: Promise<{ scenario?: string }>;
}) {
  const resolved = await searchParams;
  const scenarioKey = resolved?.scenario || "delhi-anand-vihar";

  const isMumbai = scenarioKey === "mumbai-bandra";
  const defaultOrigin = isMumbai ? "Bandra West, Mumbai" : "Anand Vihar, Delhi";
  const defaultDestination = isMumbai ? "Nariman Point, Mumbai" : "Connaught Place, New Delhi";
  const ambientPM25 = isMumbai ? 42 : 388;

  // Compute server-side baseline with real OpenAQ v3 observations
  const resolvedRoute = await resolveCommuteRoute(defaultOrigin, defaultDestination);
  const spatialProfile = await sampleRouteSpatialExposureAsync(resolvedRoute.route, ambientPM25, 8);
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
