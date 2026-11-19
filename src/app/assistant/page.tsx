import React, { Suspense } from "react";
import { AgentChatInterface } from "@/components/assistant/AgentChatInterface";

export default async function AssistantPage({
  searchParams,
}: {
  searchParams: Promise<{ scenario?: string }>;
}) {
  const resolved = await searchParams;
  const scenarioKey = resolved?.scenario || "delhi-anand-vihar";

  return (
    <div className="space-y-4">
      <Suspense
        fallback={
          <div className="p-8 text-center text-xs text-slate-500">
            Initializing SaansAI Tool-Augmented Agent...
          </div>
        }
      >
        <AgentChatInterface initialScenario={scenarioKey} />
      </Suspense>
    </div>
  );
}
