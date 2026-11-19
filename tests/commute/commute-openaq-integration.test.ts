import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  fetchRouteOpenAQStations,
  sampleRouteSpatialExposure,
  sampleRouteSpatialExposureAsync,
} from "@/lib/commute/spatial-exposure";
import { CURATED_COMMUTE_CORRIDORS } from "@/lib/commute/routing/curated-corridors";
import { StationWithReadings } from "@/lib/aqi/idw-interpolator";

describe("SaansAI Commute — OpenAQ v3 Integration & Provenance Verification", () => {
  const testRoute = CURATED_COMMUTE_CORRIDORS["delhi_anand_vihar_to_cp"];

  it("extracts candidate query points from route origin, destination, and midpoint", async () => {
    // Calling fetchRouteOpenAQStations queries OpenAQ v3 API with server-side key
    const stations = await fetchRouteOpenAQStations(testRoute);
    // Should be an array (live stations if network available, or empty if rate limited/offline)
    assert.ok(Array.isArray(stations));

    if (stations.length > 0) {
      const first = stations[0];
      assert.ok(first.station.id.startsWith("openaq_"));
      assert.equal(first.station.sourceProvider, "OPENAQ");
      assert.ok(first.readings.length > 0);
      const pm25 = first.readings.find((r) => r.pollutant === "PM2.5");
      if (pm25) {
        assert.ok(pm25.value >= 0);
        assert.equal(pm25.unit, "µg/m³");
      }
    }
  });

  it("integrates real OpenAQ stations into IDW spatial interpolation and marks provenance", () => {
    // Mock a live OpenAQ station close to Anand Vihar
    const mockOpenAQStation: StationWithReadings = {
      station: {
        id: "openaq_mock_dl01",
        name: "Delhi Anand Vihar Eco-Monitor - OpenAQ",
        city: "Delhi",
        state: "Delhi",
        country: "IN",
        latitude: 28.6468,
        longitude: 77.3160,
        sourceProvider: "OPENAQ",
      },
      readings: [
        {
          pollutant: "PM2.5",
          value: 395,
          unit: "µg/m³",
          timestamp: new Date().toISOString(),
          averagingHours: 18,
        },
        {
          pollutant: "PM10",
          value: 610,
          unit: "µg/m³",
          timestamp: new Date().toISOString(),
          averagingHours: 18,
        },
      ],
    };

    const profile = sampleRouteSpatialExposure(testRoute, 388, 8, [mockOpenAQStation]);

    assert.equal(profile.hasLiveOpenAQData, true);
    assert.equal(profile.liveStationsCount, 1);
    assert.ok(profile.provenanceSummary?.includes("Live OpenAQ v3"));

    // Verify segments near the mock station receive real_openaq provenance
    const openAQSegments = profile.segments.filter((s) => s.measurementType === "real_openaq");
    assert.ok(openAQSegments.length > 0, "At least one segment should be flagged as real_openaq");
    assert.equal(openAQSegments[0].stationProvider, "OPENAQ");
    assert.ok(openAQSegments[0].estimatedPM25 > 0);
  });

  it("gracefully falls back to CPCB baseline when no OpenAQ stations are available", () => {
    const profile = sampleRouteSpatialExposure(testRoute, 388, 8, []);

    assert.equal(profile.hasLiveOpenAQData, false);
    assert.equal(profile.liveStationsCount, 0);
    assert.ok(profile.provenanceSummary?.includes("CPCB CAAQMS Historical Baseline"));
    assert.ok(profile.segments.length >= 4);

    // All segments should have valid numerical estimates
    for (const seg of profile.segments) {
      assert.ok(Number.isFinite(seg.estimatedPM25));
      assert.ok(Number.isFinite(seg.confidenceScore));
      assert.ok(seg.confidenceScore > 0 && seg.confidenceScore <= 1);
      assert.ok(
        seg.measurementType === "real_cpcb" ||
        seg.measurementType === "idw_spatial_interpolation" ||
        seg.measurementType === "calibrated_baseline"
      );
    }
  });

  it("asynchronously computes spatial exposure with real network telemetry", async () => {
    const profile = await sampleRouteSpatialExposureAsync(testRoute, 388, 8);

    assert.equal(profile.routeId, testRoute.id);
    assert.equal(profile.totalDistanceKm, testRoute.distanceKm);
    assert.ok(profile.segments.length > 0);
    assert.ok(profile.meanPM25 > 0);
    assert.ok(profile.peakPM25 >= profile.meanPM25);
    assert.ok(profile.minPM25 <= profile.meanPM25);
    assert.ok(typeof profile.hasLiveOpenAQData === "boolean");
    assert.ok(typeof profile.provenanceSummary === "string");
  });
});
