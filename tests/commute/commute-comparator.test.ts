import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolveCommuteRoute } from "@/lib/commute/routing/service";
import { sampleRouteSpatialExposure } from "@/lib/commute/spatial-exposure";
import { compareCommuteAlternatives } from "@/lib/commute/comparator";
import { calculateCommuteCarbonFootprint } from "@/lib/commute/carbon-engine";
import { generateCommuteActionAdvisories } from "@/lib/commute/recommendations";

describe("SaansAI Multi-Modal Route Comparison & Action Advisories", () => {
  it("evaluates all 8 modal transit alternatives and scores optimal choice", async () => {
    const resolved = await resolveCommuteRoute("Anand Vihar", "Connaught Place");
    const spatialProfile = sampleRouteSpatialExposure(resolved.route, 388, 8);

    const matrix = compareCommuteAlternatives({
      route: resolved.route,
      spatialProfile,
      departureHour: 8,
      maskType: "NONE",
      objective: "lowest_exposure",
    });

    assert.equal(matrix.modes.length, 8);
    assert.ok(matrix.optimalMode !== undefined);
    assert.equal(matrix.optimalMode.mode, "metro_underground");
    assert.ok(matrix.actionRecommendations.length > 0);
  });

  it("calculates transit carbon emissions based on CEA & ARAI factors", () => {
    const distKm = 10;
    const carbon = calculateCommuteCarbonFootprint(distKm);

    assert.equal(carbon.baselineCarGrams, 1480); // 148 g/km * 10 km
    const metro = carbon.modeBreakdown.find((m) => m.mode === "metro_underground");
    assert.ok(metro !== undefined);
    assert.equal(metro.totalCO2Grams, 140); // 14 g/km * 10 km
    assert.equal(metro.carbonAvoidedVsCarGrams, 1340); // 1480 - 140
  });

  it("generates deterministic action advisories with traceable quantitative evidence", async () => {
    const resolved = await resolveCommuteRoute("Anand Vihar", "Connaught Place");
    const spatialProfile = sampleRouteSpatialExposure(resolved.route, 388, 8);
    const matrix = compareCommuteAlternatives({
      route: resolved.route,
      spatialProfile,
      departureHour: 8,
      maskType: "NONE",
      objective: "lowest_exposure",
    });

    const advisories = generateCommuteActionAdvisories(matrix);
    assert.ok(advisories.length >= 3);

    const modeShift = advisories.find((a) => a.category === "mode_shift");
    assert.ok(modeShift !== undefined);
    assert.ok(modeShift.headline.includes("Metro"));
    assert.ok(modeShift.supportingData.length > 0);
  });
});
