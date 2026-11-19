import React, { Suspense } from "react";
import { IndoorSanctuaryView } from "@/components/simulator/IndoorSanctuaryView";

interface PageProps {
  searchParams: Promise<{ scenario?: string; room?: string }>;
}

export default async function IndoorSanctuaryPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const scenarioKey = params.scenario || "delhi-anand-vihar";

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <Suspense
        fallback={
          <div className="h-96 flex items-center justify-center text-slate-400 text-xs">
            Loading Indoor Air Quality Sanctuary Simulator...
          </div>
        }
      >
        <IndoorSanctuaryView initialScenarioKey={scenarioKey} />
      </Suspense>
    </div>
  );
}
