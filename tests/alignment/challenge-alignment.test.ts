import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { evaluateRoutineRecommendations } from "@/lib/recommendations/engine";
import { PRACTICAL_INDOOR_HACKS } from "@/lib/simulator/indoor-hacks";
import { compareCommuteAlternatives } from "@/lib/commute/comparator";
import { CURATED_COMMUTE_CORRIDORS } from "@/lib/commute/routing/curated-corridors";
import { sampleRouteSpatialExposure } from "@/lib/commute/spatial-exposure";
import { getAllRegisteredTools } from "@/lib/agent/tools/registry";
import { NormalizedAirQualityReport } from "@/lib/aqi/types";

describe("PromptWar Challenge 6 — Alignment Verification Suite", () => {
  const mockReport: NormalizedAirQualityReport = {
    station: {
      id: "DL001_ANAND_VIHAR",
      name: "Anand Vihar, Delhi - DPCC",
      city: "Delhi",
      state: "Delhi",
      country: "IN",
      latitude: 28.6468,
      longitude: 77.3160,
      sourceProvider: "CPCB",
    },
    calculatedAt: new Date().toISOString(),
    cpcbNAQI: 442,
    cpcbCategory: "Severe",
    dominantPollutant: "PM2.5",
    isDataSufficient: true,
    dataSufficiencyNotes: "16-hr data satisfied",
    hisi: 442,
    hisiCategory: "Severe",
    pollutants: {
      "PM2.5": {
        code: "PM2.5",
        name: "Fine Particulate Matter",
        value: 388,
        unit: "µg/m³",
        rawUnit: "µg/m³",
        subIndex: 442,
        category: "Severe",
        averagingPeriod: "24-hr",
        validHoursCount: 18,
        isDataSufficient: true,
        standardBenchmark: "CPCB: 60 µg/m³",
        observedAt: new Date().toISOString(),
        qualityScore: 1.0,
      },
      "PM10": {
        code: "PM10",
        name: "Respirable Particulate",
        value: 540,
        unit: "µg/m³",
        rawUnit: "µg/m³",
        subIndex: 442,
        category: "Severe",
        averagingPeriod: "24-hr",
        validHoursCount: 18,
        isDataSufficient: true,
        standardBenchmark: "CPCB: 100 µg/m³",
        observedAt: new Date().toISOString(),
        qualityScore: 1.0,
      },
      "NO2": {
        code: "NO2",
        name: "Nitrogen Dioxide",
        value: 95,
        unit: "µg/m³",
        rawUnit: "µg/m³",
        subIndex: 118,
        category: "Moderate",
        averagingPeriod: "24-hr",
        validHoursCount: 18,
        isDataSufficient: true,
        standardBenchmark: "CPCB: 80 µg/m³",
        observedAt: new Date().toISOString(),
        qualityScore: 1.0,
      },
      SO2: undefined,
      CO: undefined,
      O3: undefined,
      NH3: undefined,
      Pb: undefined,
    },
    weather: {
      temperatureC: 16.5,
      relativeHumidityPercent: 82,
      windSpeedKmh: 4.2,
      windDirectionDegrees: 310,
      windDirectionCardinal: "NW",
      boundaryLayerHeightMeters: 190,
      isInversionActive: true,
      inversionRisk: "High",
      observedAt: new Date().toISOString(),
    },
    provenance: {
      type: "OFFICIAL_CAAQMS",
      badgeText: "Continuous Regional CAAQMS",
      source: "CPCB CAAQMS Network",
      freshnessMinutes: 12,
      confidenceScore: 0.95,
      isInterpolated: false,
      isDemo: false,
    },
    disclaimer: "Official statutory baseline",
  };

  it("Requirement 1: GenAI Assistant hosts all 15 official tools with strict data grounding", () => {
    const tools = getAllRegisteredTools();
    assert.equal(tools.length, 15);
    const toolNames = tools.map((t) => t.name);
    assert.ok(toolNames.includes("get_current_aqi"));
    assert.ok(toolNames.includes("get_daily_recommendations"));
    assert.ok(toolNames.includes("simulate_indoor_air_quality"));
    assert.ok(toolNames.includes("optimize_commute_route"));
    assert.ok(toolNames.includes("calculate_commute_exposure"));
  });

  it("Requirement 2: Generates family-specific guidance for school children and senior citizens", () => {
    const familyResult = evaluateRoutineRecommendations({
      aqiReport: mockReport,
      preferences: {
        household: {
          familyMembers: ["school_children", "elderly_seniors"],
          homeType: "sealed_apartment",
          hasAirPurifier: false,
          hasKitchenExhaust: true,
          cookingFuel: "lpg_gas",
          neighborhoodType: "residential_suburb",
        },
      },
    });

    assert.equal(familyResult.status, "SUCCESS");
    const recs = familyResult.recommendations;
    const childRec = recs.find((r) => r.targetAudience === "children" || r.category === "family_defense");
    assert.ok(childRec !== undefined, "Should generate a dedicated children school smog advisory");
    assert.ok(childRec.title.includes("School Children") || childRec.title.includes("Family"));
  });

  it("Requirement 3: Suggests low-emission daily routines and explains direct impact with quantified metrics", () => {
    const routineResult = evaluateRoutineRecommendations({
      aqiReport: mockReport,
      preferences: {
        commuteMode: "car_cab",
        household: {
          familyMembers: ["healthy_adults"],
          cookingFuel: "lpg_gas",
          homeType: "sealed_apartment",
          hasAirPurifier: true,
          hasKitchenExhaust: true,
          neighborhoodType: "residential_suburb",
        },
      },
    });

    const lowEmissionRec = routineResult.recommendations.find((r) => r.category === "low_emission_action");
    assert.ok(lowEmissionRec !== undefined, "Should generate a low-emission routine recommendation");
    assert.ok(lowEmissionRec.directImpact !== undefined, "Must include direct impact explanation");

    const impact = lowEmissionRec.directImpact!;
    assert.ok(impact.whatToChange.length > 0);
    assert.ok(impact.whyRelevant.length > 0);
    assert.ok(impact.expectedBenefit.length > 0);
    assert.ok(impact.calculationMethodology.length > 0);
    assert.ok(impact.assumptionsAndLimitations.length > 0);
    assert.ok(impact.quantifiedMetrics?.emissionsAvoidedGCO2e !== undefined);
  });

  it("Requirement 4: Provides 6 practical, low-cost indoor hacks with cost and reduction metrics", () => {
    assert.equal(PRACTICAL_INDOOR_HACKS.length, 6);

    for (const hack of PRACTICAL_INDOOR_HACKS) {
      assert.ok(hack.title.length > 0);
      assert.ok(hack.instructions.length >= 2);
      assert.ok(hack.expectedPM25ReductionPercent >= 30);
      assert.ok(hack.estimatedCostINR <= 1500);
      assert.ok(typeof hack.whyItWorks === "string");
      assert.ok(typeof hack.calculationMethodology === "string");
      assert.ok(typeof hack.provenance === "string");
    }

    // Verify wet mopping zero-cost hack
    const wetMopping = PRACTICAL_INDOOR_HACKS.find((h) => h.id === "hack_wet_mopping");
    assert.ok(wetMopping !== undefined);
    assert.equal(wetMopping.estimatedCostINR, 0);

    // Verify DIY Box Fan hack
    const boxFan = PRACTICAL_INDOOR_HACKS.find((h) => h.id === "hack_diy_box_fan_filter");
    assert.ok(boxFan !== undefined);
    assert.ok(boxFan.estimatedCostINR < 1500);
  });

  it("Requirement 5: Compares sustainable alternatives with quantified respiratory dosimetry and carbon", () => {
    const route = CURATED_COMMUTE_CORRIDORS["delhi_anand_vihar_to_cp"];
    const spatial = sampleRouteSpatialExposure(route, 388, 8);

    const matrix = compareCommuteAlternatives({
      route,
      spatialProfile: spatial,
      departureHour: 8,
      maskType: "NONE",
      objective: "lowest_exposure",
    });

    assert.equal(matrix.modes.length, 8);
    const metro = matrix.modes.find((m) => m.mode === "metro_underground");
    const carRecirc = matrix.modes.find((m) => m.mode === "car_ac_recirc");
    const auto = matrix.modes.find((m) => m.mode === "auto_rickshaw");

    assert.ok(metro !== undefined && carRecirc !== undefined && auto !== undefined);
    // Metro should have lower deposited lung dose than open auto-rickshaw
    assert.ok(metro.dosimetry.depositedDosePM25Ug < auto.dosimetry.depositedDosePM25Ug);
    // Metro should avoid carbon compared to private car
    assert.ok(metro.carbonAvoidedVsCarGrams > 1000);
  });
});
