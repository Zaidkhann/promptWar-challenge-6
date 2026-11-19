import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { generateIndoorRecommendations } from "@/lib/simulator/recommendations";
import { runIndoorSimulation } from "@/lib/simulator/engine";
import { RoomConfiguration, OutdoorConditions } from "@/lib/simulator/types";

describe("SaansAI Indoor Simulation Recommendations Suite", () => {
  const baseOutdoor: OutdoorConditions = {
    pm25: 280,
    pm10: 400,
    isLive: true,
    isManualAssumption: false,
    sourceName: "CPCB Mandir Marg",
    confidenceScore: 0.95,
  };

  it("generates window sealing recommendation when windows are open during severe smog", () => {
    const room: RoomConfiguration = {
      name: "Living Room Open",
      roomType: "living_room",
      dimensions: { lengthM: 5, widthM: 4, heightM: 3 },
      occupantsCount: 2,
      infiltrationLevel: "standard_indian_apartment",
      ventilationMode: "windows_open",
      windowOpeningFraction: 1,
      hasAirPurifier: false,
      purifierCADR: 0,
      purifierFanSpeed: "off",
      indoorSource: "none",
      indoorSourceStartMinute: 0,
      indoorSourceDurationMinutes: 0,
    };

    const simulation = runIndoorSimulation({ room, outdoor: baseOutdoor });
    const recs = generateIndoorRecommendations({ simulation, room, outdoor: baseOutdoor });

    const sealRec = recs.find((r) => r.id === "rec_seal_windows_high_smog");
    assert.ok(sealRec, "Must recommend sealing windows");
    assert.strictEqual(sealRec?.priority, "critical");
    assert.strictEqual(sealRec?.category, "ventilation");
  });

  it("recommends HEPA purifier deployment when room lacks air cleaner", () => {
    const room: RoomConfiguration = {
      name: "Bedroom Unfiltered",
      roomType: "bedroom",
      dimensions: { lengthM: 4, widthM: 3.5, heightM: 2.8 },
      occupantsCount: 1,
      infiltrationLevel: "standard_indian_apartment",
      ventilationMode: "closed_windows",
      windowOpeningFraction: 0,
      hasAirPurifier: false,
      purifierCADR: 0,
      purifierFanSpeed: "off",
      indoorSource: "none",
      indoorSourceStartMinute: 0,
      indoorSourceDurationMinutes: 0,
    };

    const simulation = runIndoorSimulation({ room, outdoor: baseOutdoor });
    const recs = generateIndoorRecommendations({ simulation, room, outdoor: baseOutdoor });

    const hepaRec = recs.find((r) => r.id === "rec_deploy_hepa_purifier");
    assert.ok(hepaRec, "Must recommend deploying HEPA air purifier");
    assert.strictEqual(hepaRec?.category, "purification");
  });

  it("recommends upgrading fan speed or CADR when existing purifier is undersized (< 3 ACH)", () => {
    const room: RoomConfiguration = {
      name: "Large Hall Undersized CADR",
      roomType: "living_room",
      dimensions: { lengthM: 8, widthM: 6, heightM: 3 }, // 144 m³
      occupantsCount: 3,
      infiltrationLevel: "standard_indian_apartment",
      ventilationMode: "closed_windows",
      windowOpeningFraction: 0,
      hasAirPurifier: true,
      purifierCADR: 100, // 100 / 144 = 0.69 ACH (< 3.0)
      purifierFanSpeed: "low",
      indoorSource: "none",
      indoorSourceStartMinute: 0,
      indoorSourceDurationMinutes: 0,
    };

    const simulation = runIndoorSimulation({ room, outdoor: baseOutdoor });
    const recs = generateIndoorRecommendations({ simulation, room, outdoor: baseOutdoor });

    const upgradeRec = recs.find((r) => r.id === "rec_undersized_purifier");
    assert.ok(upgradeRec, "Must recommend increasing fan speed / CADR");
  });

  it("recommends kitchen exhaust and door sealing when Indian cooking tadka is detected", () => {
    const room: RoomConfiguration = {
      name: "Kitchen",
      roomType: "kitchen",
      dimensions: { lengthM: 3, widthM: 2.5, heightM: 2.8 },
      occupantsCount: 1,
      infiltrationLevel: "standard_indian_apartment",
      ventilationMode: "closed_windows",
      windowOpeningFraction: 0,
      hasAirPurifier: false,
      purifierCADR: 0,
      purifierFanSpeed: "off",
      indoorSource: "cooking_tadka",
      indoorSourceStartMinute: 10,
      indoorSourceDurationMinutes: 20,
    };

    const simulation = runIndoorSimulation({ room, outdoor: baseOutdoor });
    const recs = generateIndoorRecommendations({ simulation, room, outdoor: baseOutdoor });

    const cookRec = recs.find((r) => r.id === "rec_cooking_exhaust");
    assert.ok(cookRec, "Must recommend kitchen exhaust capture");
    assert.strictEqual(cookRec?.category, "source_control");
  });

  it("recommends flameless alternatives when agarbatti or mosquito coil is burning", () => {
    const room: RoomConfiguration = {
      name: "Prayer Room",
      roomType: "bedroom",
      dimensions: { lengthM: 3, widthM: 3, heightM: 2.8 },
      occupantsCount: 1,
      infiltrationLevel: "standard_indian_apartment",
      ventilationMode: "closed_windows",
      windowOpeningFraction: 0,
      hasAirPurifier: true,
      purifierCADR: 350,
      purifierFanSpeed: "medium",
      indoorSource: "incense_agarbatti",
      indoorSourceStartMinute: 10,
      indoorSourceDurationMinutes: 30,
    };

    const simulation = runIndoorSimulation({ room, outdoor: baseOutdoor });
    const recs = generateIndoorRecommendations({ simulation, room, outdoor: baseOutdoor });

    const incenseRec = recs.find((r) => r.id === "rec_smoldering_source_substitution");
    assert.ok(incenseRec, "Must recommend substituting smoldering source");
  });

  it("recommends weatherstripping when room envelope is leaky drafty under severe ambient smog", () => {
    const room: RoomConfiguration = {
      name: "Drafty Apartment",
      roomType: "living_room",
      dimensions: { lengthM: 5, widthM: 4, heightM: 3 },
      occupantsCount: 2,
      infiltrationLevel: "leaky_drafty",
      ventilationMode: "closed_windows",
      windowOpeningFraction: 0,
      hasAirPurifier: true,
      purifierCADR: 350,
      purifierFanSpeed: "high",
      indoorSource: "none",
      indoorSourceStartMinute: 0,
      indoorSourceDurationMinutes: 0,
    };

    const simulation = runIndoorSimulation({ room, outdoor: baseOutdoor });
    const recs = generateIndoorRecommendations({ simulation, room, outdoor: baseOutdoor });

    const weatherstripRec = recs.find((r) => r.id === "rec_weatherstripping");
    assert.ok(weatherstripRec, "Must recommend weatherstripping door/window seals");
  });

  it("always includes non-diagnostic environmental exposure precaution disclaimer", () => {
    const room: RoomConfiguration = {
      name: "Default Room",
      roomType: "bedroom",
      dimensions: { lengthM: 4, widthM: 3.5, heightM: 3 },
      occupantsCount: 1,
      infiltrationLevel: "tight_seal",
      ventilationMode: "closed_windows",
      windowOpeningFraction: 0,
      hasAirPurifier: true,
      purifierCADR: 450,
      purifierFanSpeed: "high",
      indoorSource: "none",
      indoorSourceStartMinute: 0,
      indoorSourceDurationMinutes: 0,
    };

    const simulation = runIndoorSimulation({ room, outdoor: baseOutdoor });
    const recs = generateIndoorRecommendations({ simulation, room, outdoor: baseOutdoor });

    const disclaimer = recs.find((r) => r.id === "rec_precautionary_disclaimer");
    assert.ok(disclaimer, "Must include statutory health advisory disclaimer");
    assert.strictEqual(disclaimer?.priority, "advisory");
  });
});
