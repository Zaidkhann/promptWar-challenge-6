import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { sampleRouteSpatialExposure } from "@/lib/commute/spatial-exposure";
import { calculateCommuteDosimetry } from "@/lib/commute/dosimetry";
import { resolveCommuteRoute } from "@/lib/commute/routing/service";
import { compareCommuteAlternatives } from "@/lib/commute/comparator";
import { CalculatedRoute } from "@/lib/commute/types";

describe("SaansAI Commute — Missing Data & Edge Case Robustness", () => {
  it("handles empty route geometry by generating a single fallback point without crashing", () => {
    const emptyRoute: CalculatedRoute = {
      id: "test_empty_route",
      name: "Empty Geometry Route",
      summary: "Route with no coordinate steps",
      origin: { lat: 28.64, lon: 77.31, name: "Origin" },
      destination: { lat: 28.63, lon: 77.21, name: "Destination" },
      distanceKm: 12.0,
      durationMinutes: 30,
      mode: "driving",
      geometry: [],
      segments: [],
      provider: "User_Assumption",
      isEstimated: true,
      trafficAware: false,
    };

    const profile = sampleRouteSpatialExposure(emptyRoute, 300, 8);
    assert.equal(profile.segments.length, 1);
    assert.equal(profile.segments[0].estimatedPM25 > 0, true);
    assert.equal(profile.segments[0].measurementType, "calibrated_baseline");
    assert.equal(profile.meanPM25, profile.segments[0].estimatedPM25);
    assert.equal(profile.spatialConfidence, 0.85);
  });

  it("handles single-point route geometry safely", () => {
    const singlePointRoute: CalculatedRoute = {
      id: "test_single_point",
      name: "Single Point Route",
      summary: "Route with 1 coordinate",
      origin: { lat: 28.64, lon: 77.31 },
      destination: { lat: 28.64, lon: 77.31 },
      distanceKm: 0.1,
      durationMinutes: 1,
      mode: "walking",
      geometry: [[28.64, 77.31]],
      segments: [],
      provider: "User_Assumption",
      isEstimated: true,
      trafficAware: false,
    };

    const profile = sampleRouteSpatialExposure(singlePointRoute, 250, 14);
    assert.equal(profile.segments.length, 1);
    assert.ok(Number.isFinite(profile.meanPM25));
  });

  it("handles unrecognized geocoding queries with graceful curated fallback", async () => {
    const result = await resolveCommuteRoute("completely_unknown_xyz_123", "nonexistent_loc_abc_999");
    assert.ok(result.route !== undefined);
    assert.ok(result.route.distanceKm > 0);
    assert.ok(result.warnings.length > 0);
    assert.ok(result.warnings[0].includes("Falling back"));
  });

  it("safely bounds dosimetry calculations when ambient PM2.5 is zero or extremely high", () => {
    // Zero pollution edge case
    const zeroDose = calculateCommuteDosimetry({
      distanceKm: 10,
      durationMinutes: 30,
      mode: "metro_underground",
      ambientPM25: 0,
      maskType: "NONE",
    });
    assert.equal(zeroDose.inhaledMassPM25Ug, 0);
    assert.equal(zeroDose.depositedDosePM25Ug, 0);
    assert.ok(Number.isFinite(zeroDose.timeWeightedAveragePM25));

    // Severe smog edge case (1500 µg/m³)
    const extremeDose = calculateCommuteDosimetry({
      distanceKm: 15,
      durationMinutes: 60,
      mode: "cycling",
      activityProfile: "intense",
      ambientPM25: 1500,
      maskType: "NONE",
    });
    assert.ok(extremeDose.inhaledMassPM25Ug > 1000);
    assert.ok(Number.isFinite(extremeDose.depositedDosePM25Ug));
    assert.ok(extremeDose.doseRangePM25Ug[0] < extremeDose.doseRangePM25Ug[1]);
  });

  it("handles multi-modal comparison with edge-case objectives and mask settings", () => {
    const testRoute: CalculatedRoute = {
      id: "test_compare_route",
      name: "Test Route",
      summary: "Comparison Test",
      origin: { lat: 28.64, lon: 77.31 },
      destination: { lat: 28.63, lon: 77.21 },
      distanceKm: 8.5,
      durationMinutes: 25,
      mode: "driving",
      geometry: [
        [28.64, 77.31],
        [28.635, 77.26],
        [28.63, 77.21],
      ],
      segments: [],
      provider: "Curated_Corridor",
      isEstimated: false,
      trafficAware: true,
    };

    const spatialProfile = sampleRouteSpatialExposure(testRoute, 350, 20);

    const matrix = compareCommuteAlternatives({
      route: testRoute,
      spatialProfile,
      departureHour: 20,
      maskType: "N95",
      objective: "lowest_carbon",
    });

    assert.equal(matrix.modes.length, 8);
    assert.ok(matrix.optimalMode !== undefined);
    assert.ok(matrix.actionRecommendations.length > 0);
    assert.ok(matrix.citations.length > 0);

    for (const m of matrix.modes) {
      assert.ok(Number.isFinite(m.durationMinutes));
      assert.ok(Number.isFinite(m.dosimetry.depositedDosePM25Ug));
      assert.ok(Number.isFinite(m.carbonGrams));
      assert.ok(Number.isFinite(m.score));
    }
  });
});
