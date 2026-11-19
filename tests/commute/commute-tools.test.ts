import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { executeToolCall } from "@/lib/agent/tools/executor";
import { getAllRegisteredTools } from "@/lib/agent/tools/registry";
import { AgentContext } from "@/lib/agent/types";

describe("SaansAI Commute Agent Tools (Tool 14 & Tool 15)", () => {
  const mockContext: AgentContext = {
    userId: "test_user_commute",
    conversationId: "conv_commute_123",
    lat: 28.6468,
    lon: 77.3160,
    scenario: "delhi-anand-vihar",
  };

  it("registers exactly 15 core agent tools including Tool 14 and Tool 15", () => {
    const tools = getAllRegisteredTools();
    assert.equal(tools.length, 15);

    const names = tools.map((t) => t.name);
    assert.ok(names.includes("optimize_commute_route"));
    assert.ok(names.includes("calculate_commute_exposure"));
  });

  describe("TOOL 14: optimize_commute_route", () => {
    it("executes optimize_commute_route and returns optimal choice and modal comparison", async () => {
      const res = await executeToolCall(
        "optimize_commute_route",
        "call_14_test",
        {
          origin: "Anand Vihar, Delhi",
          destination: "Connaught Place, New Delhi",
          departureHour: 8,
          objective: "lowest_exposure",
          maskType: "NONE",
        },
        mockContext
      );

      assert.equal(res.isError, false);
      const data = res.result as Record<string, unknown>;
      assert.equal(data.success, true);
      assert.ok(data.routeSummary !== undefined);
      assert.ok(data.optimalChoice !== undefined);
      assert.ok(Array.isArray(data.modeComparison));
      assert.ok(Array.isArray(data.actionAdvisories));
    });
  });

  describe("TOOL 15: calculate_commute_exposure", () => {
    it("executes calculate_commute_exposure and returns validated dosimetry and carbon metrics", async () => {
      const res = await executeToolCall(
        "calculate_commute_exposure",
        "call_15_test",
        {
          distanceKm: 12.8,
          durationMinutes: 34,
          mode: "metro_underground",
          ambientPM25: 388,
          maskType: "N95",
        },
        mockContext
      );

      assert.equal(res.isError, false);
      const data = res.result as Record<string, unknown>;
      assert.equal(data.success, true);

      const dosimetry = data.dosimetryResults as Record<string, unknown>;
      assert.ok(typeof dosimetry.inhaledMassPM25Ug === "number");
      assert.ok(typeof dosimetry.depositedDosePM25Ug === "number");
      assert.equal(dosimetry.effectiveMaskFiltrationPercent, 95);

      const carbon = data.carbonImpact as Record<string, unknown>;
      assert.ok(typeof carbon.totalCO2Grams === "number");
      assert.ok(Array.isArray(data.scientificFoundations));
    });
  });
});
