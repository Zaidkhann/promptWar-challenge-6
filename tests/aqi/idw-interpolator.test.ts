import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { interpolateSpatialAQI, StationWithReadings } from "@/lib/aqi/idw-interpolator";

describe("Spatial IDW Interpolator (p = 2)", () => {
  // Approximate latitude/longitude offsets:
  // 1 degree latitude ≈ 111 km, so 0.01 deg ≈ 1.11 km
  const baseLat = 28.6000;
  const baseLon = 77.2000;

  it("calculates exact mathematical IDW value with p = 2 inverse distance weighting", () => {
    // We create two stations with known approximate distances:
    // Station A: offset ~2 km
    // Station B: offset ~4 km
    // Target is at (baseLat, baseLon)
    // To ensure exact mathematical test, let's pass stations at known coordinate deltas
    // lat delta 0.018 ~ 2.0 km, lat delta 0.036 ~ 4.0 km
    const stationA: StationWithReadings = {
      station: {
        id: "STA_A",
        name: "Station Alpha",
        city: "Delhi",
        state: "Delhi",
        country: "IN",
        latitude: baseLat + 0.018,
        longitude: baseLon,
        sourceProvider: "CPCB",
      },
      readings: [
        { pollutant: "PM2.5", value: 100, unit: "µg/m³", timestamp: new Date().toISOString() },
        { pollutant: "PM10", value: 200, unit: "µg/m³", timestamp: new Date().toISOString() },
      ],
    };

    const stationB: StationWithReadings = {
      station: {
        id: "STA_B",
        name: "Station Beta",
        city: "Delhi",
        state: "Delhi",
        country: "IN",
        latitude: baseLat + 0.036,
        longitude: baseLon,
        sourceProvider: "CPCB",
      },
      readings: [
        { pollutant: "PM2.5", value: 200, unit: "µg/m³", timestamp: new Date().toISOString() },
        { pollutant: "PM10", value: 400, unit: "µg/m³", timestamp: new Date().toISOString() },
      ],
    };

    const result = interpolateSpatialAQI(baseLat, baseLon, [stationA, stationB], 30, 2);
    assert.ok(result);
    assert.equal(result.usedStationsCount, 2);

    const pm25 = result.interpolatedReadings.find((r) => r.pollutant === "PM2.5");
    assert.ok(pm25);

    // Because Station A is closer (~2.0 km vs ~4.0 km), Station A has (4/2)^2 = 4x higher weight!
    // Expected value = (4 * 100 + 1 * 200) / 5 = 600 / 5 = 120.0
    assert.equal(pm25.value, 120.0);
  });

  it("snaps directly to station readings when target is < 100 meters away", () => {
    const stationClose: StationWithReadings = {
      station: {
        id: "STA_EXACT",
        name: "Collocated Station",
        city: "Delhi",
        state: "Delhi",
        country: "IN",
        latitude: baseLat + 0.0001, // ~11 meters away
        longitude: baseLon,
        sourceProvider: "CPCB",
      },
      readings: [
        { pollutant: "PM2.5", value: 312, unit: "µg/m³", timestamp: new Date().toISOString() },
      ],
    };

    const result = interpolateSpatialAQI(baseLat, baseLon, [stationClose], 30, 3);
    assert.ok(result);
    assert.equal(result.usedStationsCount, 1);
    assert.ok(result.averageDistanceKm < 0.1);
    assert.equal(result.interpolatedReadings[0].value, 312);
  });

  it("returns null when all candidate stations are outside maximum radius (> 30 km)", () => {
    const stationFar: StationWithReadings = {
      station: {
        id: "STA_FAR",
        name: "Far Away Station",
        city: "Jaipur",
        state: "Rajasthan",
        country: "IN",
        latitude: baseLat + 2.5, // ~270 km away
        longitude: baseLon,
        sourceProvider: "CPCB",
      },
      readings: [
        { pollutant: "PM2.5", value: 150, unit: "µg/m³", timestamp: new Date().toISOString() },
      ],
    };

    const result = interpolateSpatialAQI(baseLat, baseLon, [stationFar], 30, 3);
    assert.equal(result, null);
  });
});
