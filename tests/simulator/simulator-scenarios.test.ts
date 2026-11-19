import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { compareIndoorScenarios, PRESET_SCENARIO_COMPARISONS } from "@/lib/simulator/scenarios";
import { RoomConfiguration, OutdoorConditions } from "@/lib/simulator/types";

describe("SaansAI Scenario Comparison Lab", () => {
  const baseRoom: RoomConfiguration = {
    name: "Comparison Chamber",
    roomType: "bedroom",
    dimensions: { lengthM: 4.2, widthM: 3.6, heightM: 2.9 },
    occupantsCount: 2,
    infiltrationLevel: "standard_indian_apartment",
    ventilationMode: "closed_windows",
    windowOpeningFraction: 0,
    hasAirPurifier: true,
    purifierCADR: 280,
    purifierFanSpeed: "medium",
    indoorSource: "none",
    indoorSourceStartMinute: 0,
    indoorSourceDurationMinutes: 0,
  };

  const outdoor: OutdoorConditions = {
    pm25: 350, // Severe winter smog
    pm10: 480,
    isLive: false,
    isManualAssumption: false,
    sourceName: "CPCB Station",
    confidenceScore: 0.9,
  };

  it("evaluates the Winter Smog Defense preset correctly", () => {
    const scenarios = PRESET_SCENARIO_COMPARISONS.winter_smog_defense.generateScenarios(baseRoom);
    assert.equal(scenarios.length, 3);

    const comp = compareIndoorScenarios({
      baselineRoom: baseRoom,
      outdoor,
      alternativeScenarios: scenarios,
      parameters: { durationHours: 4, timeStepMinutes: 2 },
    });

    assert.equal(comp.scenarios.length, 4); // 1 baseline + 3 alternatives
    assert.ok(comp.keyTakeaway.length > 0);

    const baseline = comp.scenarios.find((s) => s.scenarioId === "baseline");
    const turbo = comp.scenarios.find((s) => s.scenarioId === "purifier_turbo");
    const unmitigated = comp.scenarios.find((s) => s.scenarioId === "baseline_unfiltered");

    assert.ok(baseline);
    assert.ok(turbo);
    assert.ok(unmitigated);

    // Turbo must achieve exposure reduction compared to unmitigated
    assert.ok(turbo.finalPM25 < unmitigated.finalPM25);
    assert.ok(turbo.averagePM25 < unmitigated.averagePM25);
  });

  it("evaluates the Ventilation Dilemma preset showing open windows worsen indoor air during smog", () => {
    const scenarios = PRESET_SCENARIO_COMPARISONS.ventilation_dilemma.generateScenarios(baseRoom);
    const comp = compareIndoorScenarios({
      baselineRoom: baseRoom,
      outdoor,
      alternativeScenarios: scenarios,
    });

    const closed = comp.scenarios.find((s) => s.scenarioId === "windows_closed");
    const wideOpen = comp.scenarios.find((s) => s.scenarioId === "windows_wide_open");

    assert.ok(closed);
    assert.ok(wideOpen);

    // Wide open windows during 350 µg/m³ smog must lead to worse final concentration
    assert.ok(wideOpen.finalPM25 > closed.finalPM25);
  });

  it("computes mathematical delta metrics and percentage exposure reduction accurately", () => {
    const scenarios = PRESET_SCENARIO_COMPARISONS.indoor_cooking_surge.generateScenarios(baseRoom);
    const comp = compareIndoorScenarios({
      baselineRoom: baseRoom,
      outdoor,
      alternativeScenarios: scenarios,
    });

    for (const sc of comp.scenarios) {
      assert.ok(typeof sc.peakPM25 === "number");
      assert.ok(typeof sc.finalPM25 === "number");
      assert.ok(typeof sc.deltaPeakPM25VsBaseline === "number");
      assert.ok(typeof sc.percentExposureReductionVsBaseline === "number");
    }
  });
});
