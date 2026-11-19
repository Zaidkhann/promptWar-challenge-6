import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { evaluateFamilySmogDefenseRule } from "@/lib/recommendations/rules/family-smog-defense-rule";
import { evaluateVentilationRule } from "@/lib/recommendations/rules/ventilation-rule";
import { evaluateOutdoorActivityRule } from "@/lib/recommendations/rules/outdoor-exercise-rule";
import { NormalizedAirQualityReport } from "@/lib/aqi/types";
import { UserPreferences, DEFAULT_USER_PREFERENCES } from "@/lib/recommendations/types";

function createMockReport(overrides?: Partial<NormalizedAirQualityReport>): NormalizedAirQualityReport {
  return {
    station: {
      id: "DL001_TEST",
      name: "Anand Vihar Test Station",
      city: "New Delhi",
      state: "Delhi",
      country: "IN",
      latitude: 28.6468,
      longitude: 77.316,
      sourceProvider: "CPCB",
      distanceKm: 0.5,
    },
    calculatedAt: new Date().toISOString(),
    cpcbNAQI: 420,
    cpcbCategory: "Severe",
    dominantPollutant: "PM2.5",
    isDataSufficient: true,
    dataSufficiencyNotes: "16-hr data satisfied",
    hisi: 450,
    hisiCategory: "Severe",
    pollutants: {
      "PM2.5": {
        code: "PM2.5",
        name: "Fine Particulate Matter",
        value: 388,
        unit: "µg/m³",
        rawUnit: "µg/m³",
        subIndex: 420,
        category: "Severe",
        averagingPeriod: "24-hr",
        validHoursCount: 18,
        isDataSufficient: true,
        standardBenchmark: "CPCB: 60 µg/m³",
        observedAt: new Date().toISOString(),
        qualityScore: 1.0,
      },
      PM10: {
        code: "PM10",
        name: "Coarse Particulate Matter",
        value: 480,
        unit: "µg/m³",
        rawUnit: "µg/m³",
        subIndex: 410,
        category: "Severe",
        averagingPeriod: "24-hr",
        validHoursCount: 18,
        isDataSufficient: true,
        standardBenchmark: "CPCB: 100 µg/m³",
        observedAt: new Date().toISOString(),
        qualityScore: 1.0,
      },
      NO2: undefined,
      SO2: undefined,
      CO: undefined,
      O3: undefined,
      NH3: undefined,
      Pb: undefined,
    },
    weather: {
      temperatureC: 15.0,
      relativeHumidityPercent: 85,
      windSpeedKmh: 2.0,
      windDirectionDegrees: 315,
      windDirectionCardinal: "NW",
      boundaryLayerHeightMeters: 180,
      isInversionActive: true,
      inversionRisk: "High",
      observedAt: new Date().toISOString(),
    },
    provenance: {
      type: "OFFICIAL_CAAQMS",
      badgeText: "Official CPCB Live Telemetry",
      source: "CPCB CAAQMS Network",
      freshnessMinutes: 12,
      confidenceScore: 0.95,
      isInterpolated: false,
      isDemo: false,
    },
    disclaimer: "Official normalized telemetry",
    ...overrides,
  };
}

describe("SaansAI Specialized Recommendation Rules Suite", () => {
  const severeReport = createMockReport();

  const poorReport = createMockReport({
    cpcbNAQI: 260,
    cpcbCategory: "Poor",
    hisi: 260,
    hisiCategory: "Poor",
    pollutants: {
      ...severeReport.pollutants,
      "PM2.5": {
        ...severeReport.pollutants["PM2.5"]!,
        value: 120,
        subIndex: 260,
        category: "Poor",
      },
    },
    weather: {
      ...severeReport.weather,
      boundaryLayerHeightMeters: 450,
      isInversionActive: false,
      inversionRisk: "Medium",
    },
  });

  const moderateReport = createMockReport({
    cpcbNAQI: 145,
    cpcbCategory: "Moderate",
    hisi: 145,
    hisiCategory: "Moderate",
    pollutants: {
      ...severeReport.pollutants,
      "PM2.5": {
        ...severeReport.pollutants["PM2.5"]!,
        value: 45,
        subIndex: 145,
        category: "Moderate",
      },
    },
    weather: {
      ...severeReport.weather,
      boundaryLayerHeightMeters: 850,
      isInversionActive: false,
      inversionRisk: "Low",
    },
  });

  describe("evaluateFamilySmogDefenseRule", () => {
    it("returns protective protocol for school children during severe smog", () => {
      const prefs: UserPreferences = {
        ...DEFAULT_USER_PREFERENCES,
        household: {
          homeType: "sealed_apartment",
          hasAirPurifier: true,
          hasKitchenExhaust: true,
          cookingFuel: "lpg_gas",
          neighborhoodType: "residential_suburb",
          familyMembers: ["school_children", "healthy_adults"],
        },
      };

      const rec = evaluateFamilySmogDefenseRule(severeReport, prefs, 8, "live");
      assert.ok(rec);
      assert.strictEqual(rec?.category, "family_defense");
      assert.strictEqual(rec?.targetAudience, "children");
      assert.strictEqual(rec?.priority, "critical");
    });

    it("returns senior citizen respiratory advisory during severe smog", () => {
      const prefs: UserPreferences = {
        ...DEFAULT_USER_PREFERENCES,
        household: {
          homeType: "sealed_apartment",
          hasAirPurifier: true,
          hasKitchenExhaust: true,
          cookingFuel: "lpg_gas",
          neighborhoodType: "residential_suburb",
          familyMembers: ["elderly_seniors"],
        },
      };

      const rec = evaluateFamilySmogDefenseRule(severeReport, prefs, 7, "live");
      assert.ok(rec);
      assert.strictEqual(rec?.targetAudience, "seniors");
    });

    it("returns null when household contains only healthy adults and standard sensitivity", () => {
      const prefs: UserPreferences = {
        ...DEFAULT_USER_PREFERENCES,
        sensitivity: "standard",
        household: {
          homeType: "sealed_apartment",
          hasAirPurifier: true,
          hasKitchenExhaust: true,
          cookingFuel: "lpg_gas",
          neighborhoodType: "residential_suburb",
          familyMembers: ["healthy_adults"],
        },
      };

      const rec = evaluateFamilySmogDefenseRule(severeReport, prefs, 12, "live");
      assert.strictEqual(rec, null);
    });
  });

  describe("evaluateVentilationRule", () => {
    it("recommends keeping windows sealed during inversion layer trapping", () => {
      const rec = evaluateVentilationRule(severeReport, DEFAULT_USER_PREFERENCES, 8, "live");
      assert.ok(rec);
      assert.strictEqual(rec?.category, "ventilation");
      assert.strictEqual(rec?.id, "rec_ventilation_sealed");
      assert.strictEqual(rec?.priority, "high");
    });

    it("evaluates ventilation when ambient air is moderate and boundary layer is high", () => {
      const rec = evaluateVentilationRule(moderateReport, DEFAULT_USER_PREFERENCES, 13, "live");
      assert.ok(rec);
      assert.strictEqual(rec?.category, "ventilation");
    });
  });

  describe("evaluateOutdoorActivityRule", () => {
    it("recommends indoor relocation and critical priority during severe smog", () => {
      const rec = evaluateOutdoorActivityRule(severeReport, DEFAULT_USER_PREFERENCES, 7, "live");
      assert.ok(rec);
      assert.strictEqual(rec?.category, "activity_window");
      assert.strictEqual(rec?.priority, "critical");
      assert.strictEqual(rec?.id, "rec_outdoor_activity_severe");
    });

    it("recommends midday solar window shift when air is poor", () => {
      const rec = evaluateOutdoorActivityRule(poorReport, DEFAULT_USER_PREFERENCES, 8, "live");
      assert.ok(rec);
      assert.strictEqual(rec?.category, "activity_window");
      assert.strictEqual(rec?.id, "rec_outdoor_activity_poor");
    });

    it("advises sensitive cohorts when air is moderate", () => {
      const prefs: UserPreferences = {
        ...DEFAULT_USER_PREFERENCES,
        sensitivity: "respiratory_sensitivity",
      };
      const rec = evaluateOutdoorActivityRule(moderateReport, prefs, 11, "live");
      assert.ok(rec);
      assert.strictEqual(rec?.category, "activity_window");
      assert.strictEqual(rec?.id, "rec_outdoor_activity_moderate_sensitive");
    });
  });
});
