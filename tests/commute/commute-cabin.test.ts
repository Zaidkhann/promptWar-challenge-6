import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { simulateVehicleCabinAirQuality } from "@/lib/commute/cabin-model";

describe("SaansAI Dynamic Vehicle Cabin Mass-Balance ODE Model", () => {
  it("proves in-cabin particulate reduction under AC Recirculation vs Fresh Air", () => {
    const ambientPM25 = 400; // Severe ambient smog
    const durationMins = 45;

    // Recirculation mode
    const recirc = simulateVehicleCabinAirQuality({
      mode: "car_ac_recirc",
      cabinSetting: "recirculation",
      outsidePM25: ambientPM25,
      durationMinutes: durationMins,
      initialCabinPM25: 150,
    });

    // Fresh Air mode
    const freshAir = simulateVehicleCabinAirQuality({
      mode: "car_fresh_air",
      cabinSetting: "fresh_air",
      outsidePM25: ambientPM25,
      durationMinutes: durationMins,
      initialCabinPM25: 150,
    });

    // Windows Open mode
    const openWin = simulateVehicleCabinAirQuality({
      mode: "car_fresh_air",
      cabinSetting: "windows_open",
      outsidePM25: ambientPM25,
      durationMinutes: durationMins,
      initialCabinPM25: 150,
    });

    // Recirculation maintains significantly cleaner in-cabin air
    assert.ok(recirc.finalCabinPM25 < freshAir.finalCabinPM25);
    assert.ok(freshAir.finalCabinPM25 < openWin.finalCabinPM25);
    assert.ok(recirc.timeWeightedAveragePM25 < 100);
    assert.ok(openWin.timeWeightedAveragePM25 > 350);
  });

  it("verifies Metro high-capacity HVAC multi-stage filtration", () => {
    const metro = simulateVehicleCabinAirQuality({
      mode: "metro_underground",
      cabinSetting: "recirculation",
      outsidePM25: 388,
      durationMinutes: 40,
      initialCabinPM25: 100,
    });

    // High filtration rate (k_f = 12 h^-1)
    assert.equal(metro.filtrationRateH, 12);
    assert.ok(metro.halfLifeMinutes < 3); // Fast clearance half-life under 3 mins
    assert.ok(metro.effectivePenetrationRatio <= 0.25);
  });
});
