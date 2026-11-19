import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { geocodeLocation } from "@/lib/commute/routing/geocoding";
import { resolveCommuteRoute } from "@/lib/commute/routing/service";
import { sampleRouteSpatialExposure, getCommuteDiurnalFactor } from "@/lib/commute/spatial-exposure";

describe("SaansAI Commute Routing & Spatial Exposure Engine", () => {
  it("geocodes prominent Indian metropolitan hubs with high confidence", async () => {
    const anandVihar = await geocodeLocation("Anand Vihar, Delhi");
    assert.ok(anandVihar !== null);
    assert.equal(anandVihar.point.lat, 28.6468);
    assert.equal(anandVihar.point.lon, 77.3160);

    const cp = await geocodeLocation("Connaught Place, New Delhi");
    assert.ok(cp !== null);
    assert.equal(cp.point.lat, 28.6315);
    assert.equal(cp.point.lon, 77.2167);

    const bandra = await geocodeLocation("Bandra West, Mumbai");
    assert.ok(bandra !== null);
    assert.equal(bandra.point.lat, 19.0596);
  });

  it("resolves curated real-road corridors with authentic road curvatures", async () => {
    const resolved = await resolveCommuteRoute("Anand Vihar", "Connaught Place");
    assert.equal(resolved.source, "Curated_Corridor");
    assert.equal(resolved.route.distanceKm, 12.8);
    assert.ok(resolved.route.geometry.length >= 8);
    assert.ok(resolved.route.segments.length >= 2);
  });

  it("samples spatial IDW pollution and flags hotspots along the route", async () => {
    const resolved = await resolveCommuteRoute("Anand Vihar", "Connaught Place");
    const spatialProfile = sampleRouteSpatialExposure(resolved.route, 388, 8); // 8 AM morning rush

    assert.equal(spatialProfile.totalDistanceKm, 12.8);
    assert.ok(spatialProfile.segments.length >= 4);
    assert.ok(spatialProfile.meanPM25 > 0);
    assert.ok(spatialProfile.spatialConfidence >= 0.7);
    assert.ok(spatialProfile.sourceStations.length > 0);

    // Diurnal factor for 8 AM (morning inversion) should be >= 1.15
    const diurnal = getCommuteDiurnalFactor(8);
    assert.equal(diurnal.factor, 1.20);

    // Diurnal factor for 1 PM (afternoon solar window) should be 0.72
    const solarWindow = getCommuteDiurnalFactor(13);
    assert.equal(solarWindow.factor, 0.72);
  });
});
