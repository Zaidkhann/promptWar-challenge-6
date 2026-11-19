import React, { Suspense } from "react";
import type { Metadata } from "next";
import { AgentChatInterface } from "@/components/assistant/AgentChatInterface";

export const metadata: Metadata = {
  title: "Autonomous GenAI Environmental Copilot | SaansAI",
  description: "Autonomous 15-tool Google Gemini agent delivering strictly grounded air quality insights with zero hallucinations.",
};

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
