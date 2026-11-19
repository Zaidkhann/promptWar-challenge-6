import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  evaluateRoutineRecommendations,
  DEFAULT_USER_PREFERENCES,
  UserPreferences,
} from "@/lib/recommendations";
import { NormalizedAirQualityReport } from "@/lib/aqi/types";

function createMockReport(overrides?: Partial<NormalizedAirQualityReport>): NormalizedAirQualityReport {
  return {
    station: {
      id: "DL001_TEST",
      name: "Anand Vihar Test Station",
      city: "New Delhi",
      state: "Delhi",
      country: "IN",
      latitude: 28.6468,
      longitude: 77.3160,
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
        value: 320,
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
        value: 450,
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

describe("SaansAI Deterministic Routine Recommendation Engine", () => {
  describe("Data Freshness & Integrity", () => {
    it("flags expired data when live station feed is older than 180 minutes", () => {
      const expiredReport = createMockReport({
        provenance: {
          type: "OPENAQ_V3",
          badgeText: "OpenAQ Stale",
          source: "OpenAQ Feed",
          freshnessMinutes: 240, // 4 hours old
          confidenceScore: 0.5,
          isInterpolated: false,
          isDemo: false,
        },
      });

      const result = evaluateRoutineRecommendations({
        aqiReport: expiredReport,
        preferences: DEFAULT_USER_PREFERENCES,
      });

      assert.equal(result.status, "EXPIRED_DATA");
      assert.equal(result.isDataFresh, false);
      assert.match(result.statusMessage, /older than 3 hours/i);
    });

    it("flags stale data when live station feed is between 60 and 180 minutes old", () => {
      const staleReport = createMockReport({
        provenance: {
          type: "OPENAQ_V3",
          badgeText: "OpenAQ Stale",
          source: "OpenAQ Feed",
          freshnessMinutes: 95,
          confidenceScore: 0.7,
          isInterpolated: false,
          isDemo: false,
        },
      });

      const result = evaluateRoutineRecommendations({
        aqiReport: staleReport,
        preferences: DEFAULT_USER_PREFERENCES,
      });

      assert.equal(result.status, "STALE_DATA");
      assert.equal(result.isDataFresh, false);
      assert.match(result.statusMessage, /stale/i);
    });

    it("marks fresh data as SUCCESS when under 60 minutes", () => {
      const freshReport = createMockReport();
      const result = evaluateRoutineRecommendations({
        aqiReport: freshReport,
        preferences: DEFAULT_USER_PREFERENCES,
      });

      assert.equal(result.status, "SUCCESS");
      assert.equal(result.isDataFresh, true);
    });

    it("distinguishes forecast data from real-time observation", () => {
      const liveReport = createMockReport();
      const liveResult = evaluateRoutineRecommendations({
        aqiReport: liveReport,
        preferences: DEFAULT_USER_PREFERENCES,
        isForecast: false,
      });
      assert.equal(liveResult.aqiSummary.dataMode, "live");

      const forecastResult = evaluateRoutineRecommendations({
        aqiReport: liveReport,
        preferences: DEFAULT_USER_PREFERENCES,
        isForecast: true,
      });
      assert.equal(forecastResult.aqiSummary.dataMode, "forecast");
      assert.equal(forecastResult.recommendations[0]?.dataMode, "forecast");
    });

    it("handles missing particulate telemetry as INSUFFICIENT_DATA", () => {
      const brokenReport = createMockReport({
        cpcbNAQI: null,
        hisi: 0,
        pollutants: {
          "PM2.5": undefined,
          PM10: undefined,
          NO2: undefined,
          SO2: undefined,
          CO: undefined,
          O3: undefined,
          NH3: undefined,
          Pb: undefined,
        },
      });

      const result = evaluateRoutineRecommendations({
        aqiReport: brokenReport,
        preferences: DEFAULT_USER_PREFERENCES,
      });

      assert.equal(result.status, "INSUFFICIENT_DATA");
      assert.equal(result.isDataFresh, false);
      assert.match(result.statusMessage, /require valid particulate measurements/i);
      assert.equal(result.recommendations.length, 1);
      assert.equal(result.recommendations[0].id, "rec_insufficient_data_advisory");
    });
  });

  describe("User Preferences & Validation", () => {
    it("falls back gracefully to DEFAULT_USER_PREFERENCES when given invalid preference options", () => {
      const report = createMockReport();
      const result = evaluateRoutineRecommendations({
        aqiReport: report,
        // @ts-expect-error Testing invalid preference injection
        preferences: { preferredTime: "invalid_midnight", commuteMode: "spaceship" },
      });

      assert.equal(result.userPreferences.preferredTime, "morning");
      assert.equal(result.userPreferences.commuteMode, "public_transit");
    });

    it("customizes commute recommendations based on user commute mode", () => {
      const report = createMockReport();

      // Active commuter: cycling
      const cyclistPref: UserPreferences = {
        ...DEFAULT_USER_PREFERENCES,
        commuteMode: "cycling",
      };
      const cyclistResult = evaluateRoutineRecommendations({
        aqiReport: report,
        preferences: cyclistPref,
      });

      const commuteRec = cyclistResult.recommendations.find((r) => r.category === "commute");
      assert.ok(commuteRec);
      assert.equal(commuteRec.priority, "critical");
      assert.match(commuteRec.title, /Shift Active Commute/i);
      assert.match(commuteRec.explanation, /ultrafine black carbon/i);

      // Car commuter
      const driverPref: UserPreferences = {
        ...DEFAULT_USER_PREFERENCES,
        commuteMode: "car_cab",
      };
      const driverResult = evaluateRoutineRecommendations({
        aqiReport: report,
        preferences: driverPref,
      });

      const driverCommuteRec = driverResult.recommendations.find((r) => r.category === "commute");
      assert.ok(driverCommuteRec);
      assert.match(driverCommuteRec.title, /Internal Recirculation/i);
    });

    it("activates stricter cohort-specific advisory when sensitivity is enabled", () => {
      const moderateReport = createMockReport({
        cpcbNAQI: 160,
        cpcbCategory: "Moderate",
        hisi: 170,
        weather: {
          temperatureC: 22,
          relativeHumidityPercent: 60,
          windSpeedKmh: 4.5,
          windDirectionDegrees: 280,
          windDirectionCardinal: "W",
          boundaryLayerHeightMeters: 550,
          isInversionActive: false,
          inversionRisk: "Low",
          observedAt: new Date().toISOString(),
        },
      });

      // Standard user: no cohort alert
      const standardResult = evaluateRoutineRecommendations({
        aqiReport: moderateReport,
        preferences: { ...DEFAULT_USER_PREFERENCES, sensitivity: "standard" },
      });
      const standardCohort = standardResult.recommendations.find((r) => r.id === "rec_sensitive_cohort_protection");
      assert.equal(standardCohort, undefined);

      // Vulnerable household: alert generated with high priority
      const vulnerableResult = evaluateRoutineRecommendations({
        aqiReport: moderateReport,
        preferences: { ...DEFAULT_USER_PREFERENCES, sensitivity: "vulnerable_household" },
      });
      const vulnerableCohort = vulnerableResult.recommendations.find((r) => r.id === "rec_sensitive_cohort_protection");
      assert.ok(vulnerableCohort);
      assert.match(vulnerableCohort.title, /Vulnerable Household Care/i);
    });
  });

  describe("Recommendation Prioritization & Explainability", () => {
    it("strictly orders recommendations by priority: critical > high > medium > low", () => {
      const report = createMockReport();
      const result = evaluateRoutineRecommendations({
        aqiReport: report,
        preferences: {
          preferredTime: "morning",
          locationType: "outdoor_preferred",
          commuteMode: "walking",
          activityType: "outdoor_exercise",
          sensitivity: "respiratory_sensitivity",
        },
      });

      const priorities = result.recommendations.map((r) => r.priority);
      const priorityWeights = { critical: 4, high: 3, medium: 2, low: 1 };

      for (let i = 0; i < priorities.length - 1; i++) {
        assert.ok(
          priorityWeights[priorities[i]] >= priorityWeights[priorities[i + 1]],
          `Priority at ${i} (${priorities[i]}) must be >= priority at ${i + 1} (${priorities[i + 1]})`
        );
      }
    });

    it("includes required explainability fields and official citations in every recommendation", () => {
      const report = createMockReport();
      const result = evaluateRoutineRecommendations({
        aqiReport: report,
        preferences: DEFAULT_USER_PREFERENCES,
      });

      for (const rec of result.recommendations) {
        assert.ok(rec.title.length > 5, "Must have informative title");
        assert.ok(rec.explanation.length > 20, "Must have detailed explanation");
        assert.ok(rec.supportingDataText.length > 5, "Must have supporting data text");
        assert.ok(rec.source.length > 5, "Must have official source citation");
        assert.ok(rec.observedAt, "Must have observation timestamp");
        assert.ok(rec.dataMode, "Must have dataMode");
      }
    });
  });

  describe("Diurnal Timeline & Pure Determinism", () => {
    it("generates a complete 5-slot diurnal day timeline", () => {
      const report = createMockReport();
      const result = evaluateRoutineRecommendations({
        aqiReport: report,
        preferences: DEFAULT_USER_PREFERENCES,
      });

      assert.equal(result.schedule.length, 5);
      assert.equal(result.schedule[0].timeRange, "06:00 – 09:30 IST");
      assert.equal(result.schedule[2].isOptimalWindow, true); // Solar mixing window
      assert.equal(result.schedule[2].label, "Peak Solar Window (Maximum Boundary Layer Mixing)");
    });

    it("produces identical deterministic output for identical inputs (pure functional behavior)", () => {
      const report = createMockReport();
      const pref: UserPreferences = {
        preferredTime: "midday",
        locationType: "indoor_preferred",
        commuteMode: "two_wheeler",
        activityType: "studying_deskwork",
        sensitivity: "standard",
      };

      const result1 = evaluateRoutineRecommendations({ aqiReport: report, preferences: pref, currentHour: 14 });
      const result2 = evaluateRoutineRecommendations({ aqiReport: report, preferences: pref, currentHour: 14 });

      // Compare recommendation IDs, titles, and priorities
      assert.deepEqual(
        result1.recommendations.map((r) => ({ id: r.id, priority: r.priority })),
        result2.recommendations.map((r) => ({ id: r.id, priority: r.priority }))
      );
      assert.equal(result1.schedule.length, result2.schedule.length);
      assert.equal(result1.status, result2.status);
    });
  });
});
