import "server-only";
import { z } from "zod";
import { AgentTool } from "../types";
import { runIndoorSimulation } from "@/lib/simulator/engine";
import { compareIndoorScenarios, PRESET_SCENARIO_COMPARISONS } from "@/lib/simulator/scenarios";
import { generateIndoorRecommendations } from "@/lib/simulator/recommendations";
import { getUserRooms, getRoomById, saveUserRoom } from "@/lib/simulator/room-store";
import { getOutdoorConditionsForSimulation } from "@/lib/simulator/data-adapter";
import { RoomConfiguration } from "@/lib/simulator/types";

// ==========================================
// TOOL A: simulate_indoor_air_quality
// ==========================================
export const simulateIndoorAirQualityTool: AgentTool = {
  name: "simulate_indoor_air_quality",
  description:
    "Simulate time-dependent indoor particulate matter (PM2.5 and PM10) concentrations using a physical mass-balance differential equation considering room dimensions, outdoor smog, ventilation, air purifier CADR, and indoor sources.",
  parameters: {
    type: "object",
    properties: {
      roomType: {
        type: "string",
        description: "Room category: 'bedroom', 'living_room', 'kitchen', 'classroom', or 'office'",
        enum: ["bedroom", "living_room", "kitchen", "classroom", "office"],
      },
      lengthMeters: {
        type: "number",
        description: "Room length in meters (default 4.0)",
      },
      widthMeters: {
        type: "number",
        description: "Room width in meters (default 3.5)",
      },
      heightMeters: {
        type: "number",
        description: "Room height in meters (default 3.0)",
      },
      ventilationMode: {
        type: "string",
        description: "Ventilation state: 'closed_windows', 'window_ajar', 'windows_open', 'mechanical_filtered'",
        enum: ["closed_windows", "window_ajar", "windows_open", "mechanical_filtered"],
      },
      hasAirPurifier: {
        type: "boolean",
        description: "Whether a HEPA air cleaner is active in the room",
      },
      purifierCADR: {
        type: "number",
        description: "Clean Air Delivery Rate (CADR) in m³/h (e.g. 250 - 500)",
      },
      purifierFanSpeed: {
        type: "string",
        description: "Operating speed: 'low', 'medium', 'high', 'turbo'",
        enum: ["off", "low", "medium", "high", "turbo"],
      },
      indoorSource: {
        type: "string",
        description: "Active indoor particle source: 'none', 'cooking_tadka', 'incense_agarbatti', 'mosquito_coil', 'candle', 'smoking'",
        enum: ["none", "cooking_tadka", "incense_agarbatti", "mosquito_coil", "candle", "smoking"],
      },
      indoorSourceDurationMinutes: {
        type: "number",
        description: "Duration of the indoor emission in minutes (default 30)",
      },
      durationHours: {
        type: "number",
        description: "Simulation period in hours (default 4)",
      },
      outdoorPM25: {
        type: "number",
        description: "Optional manual outdoor PM2.5 in µg/m³. If omitted, verified live station data is used.",
      },
    },
  },
  argumentSchema: z.object({
    roomType: z.enum(["bedroom", "living_room", "kitchen", "classroom", "office"]).optional(),
    lengthMeters: z.number().min(1.5).max(30).optional(),
    widthMeters: z.number().min(1.5).max(30).optional(),
    heightMeters: z.number().min(2.0).max(6.0).optional(),
    ventilationMode: z.enum(["closed_windows", "window_ajar", "windows_open", "mechanical_filtered"]).optional(),
    hasAirPurifier: z.boolean().optional(),
    purifierCADR: z.number().min(0).max(1500).optional(),
    purifierFanSpeed: z.enum(["off", "low", "medium", "high", "turbo"]).optional(),
    indoorSource: z.enum(["none", "cooking_tadka", "incense_agarbatti", "mosquito_coil", "candle", "smoking"]).optional(),
    indoorSourceDurationMinutes: z.number().min(0).max(360).optional(),
    durationHours: z.number().min(1).max(24).optional(),
    outdoorPM25: z.number().min(0).max(2000).optional(),
  }),
  execute: async (args, context) => {
    // 1. Gather outdoor conditions
    const outdoor = await getOutdoorConditionsForSimulation({
      lat: context.lat,
      lon: context.lon,
      scenario: context.scenario,
      manualPM25: typeof args.outdoorPM25 === "number" ? args.outdoorPM25 : undefined,
    });

    // 2. Build room configuration
    const roomConfig: RoomConfiguration = {
      name: "Simulated Space",
      roomType: (args.roomType as RoomConfiguration["roomType"]) || "bedroom",
      dimensions: {
        lengthM: typeof args.lengthMeters === "number" ? args.lengthMeters : 4.0,
        widthM: typeof args.widthMeters === "number" ? args.widthMeters : 3.5,
        heightM: typeof args.heightMeters === "number" ? args.heightMeters : 3.0,
      },
      occupantsCount: 2,
      infiltrationLevel: "standard_indian_apartment",
      ventilationMode: (args.ventilationMode as RoomConfiguration["ventilationMode"]) || "closed_windows",
      windowOpeningFraction: args.ventilationMode === "windows_open" ? 1.0 : args.ventilationMode === "window_ajar" ? 0.25 : 0,
      hasAirPurifier: typeof args.hasAirPurifier === "boolean" ? args.hasAirPurifier : true,
      purifierCADR: typeof args.purifierCADR === "number" ? args.purifierCADR : 260,
      purifierFanSpeed: (args.purifierFanSpeed as RoomConfiguration["purifierFanSpeed"]) || "medium",
      indoorSource: (args.indoorSource as RoomConfiguration["indoorSource"]) || "none",
      indoorSourceStartMinute: 15,
      indoorSourceDurationMinutes: typeof args.indoorSourceDurationMinutes === "number" ? args.indoorSourceDurationMinutes : 30,
    };

    const duration = typeof args.durationHours === "number" ? args.durationHours : 4;
    const simulation = runIndoorSimulation({
      room: roomConfig,
      outdoor,
      parameters: { durationHours: duration, timeStepMinutes: 2 },
    });

    const recommendations = generateIndoorRecommendations({
      simulation,
      room: roomConfig,
      outdoor,
    });

    return {
      simulationId: simulation.id,
      roomType: simulation.roomType,
      roomVolumeM3: simulation.parameters.roomVolumeM3,
      outdoorContext: {
        pm25: outdoor.pm25,
        source: outdoor.sourceName,
        isLive: outdoor.isLive,
        isManualAssumption: outdoor.isManualAssumption,
      },
      metrics: {
        initialPM25: simulation.metrics.initialPM25,
        peakPM25: simulation.metrics.peakPM25,
        finalPM25: simulation.metrics.finalPM25,
        averagePM25: simulation.metrics.averagePM25,
        percentChange: simulation.metrics.percentChangeFromInitial,
        whoGuidelineExceedancePercent: simulation.metrics.whoGuidelineExceedancePercent,
        halfLifeSettlingTimeMinutes: simulation.parameters.halfLifeSettlingTimeMinutes,
      },
      keyTimepoints: [
        simulation.timePoints[0],
        simulation.timePoints[Math.floor(simulation.timePoints.length / 2)],
        simulation.timePoints[simulation.timePoints.length - 1],
      ],
      recommendations: recommendations.map((r) => ({
        title: r.title,
        priority: r.priority,
        actionRequired: r.actionRequired,
        expectedImpact: r.expectedImpact,
        citation: r.citationSource,
      })),
      assumptions: simulation.assumptions,
      limitations: simulation.limitations,
    };
  },
};

// ==========================================
// TOOL B: compare_indoor_scenarios
// ==========================================
export const compareIndoorScenariosTool: AgentTool = {
  name: "compare_indoor_scenarios",
  description:
    "Compare multiple indoor scenarios side-by-side from identical baseline starting conditions (e.g. Purifier ON vs. OFF, Windows Closed vs. Open, Cooking with vs. without exhaust).",
  parameters: {
    type: "object",
    properties: {
      presetKey: {
        type: "string",
        description: "Preset comparison scenario: 'winter_smog_defense', 'ventilation_dilemma', or 'indoor_cooking_surge'",
        enum: ["winter_smog_defense", "ventilation_dilemma", "indoor_cooking_surge"],
      },
      roomType: {
        type: "string",
        description: "Room type for the baseline room",
        enum: ["bedroom", "living_room", "kitchen", "classroom", "office"],
      },
      outdoorPM25: {
        type: "number",
        description: "Outdoor PM2.5 in µg/m³. Uses live station data if omitted.",
      },
    },
  },
  argumentSchema: z.object({
    presetKey: z.enum(["winter_smog_defense", "ventilation_dilemma", "indoor_cooking_surge"]).optional(),
    roomType: z.enum(["bedroom", "living_room", "kitchen", "classroom", "office"]).optional(),
    outdoorPM25: z.number().min(0).max(2000).optional(),
  }),
  execute: async (args, context) => {
    const outdoor = await getOutdoorConditionsForSimulation({
      lat: context.lat,
      lon: context.lon,
      scenario: context.scenario,
      manualPM25: typeof args.outdoorPM25 === "number" ? args.outdoorPM25 : undefined,
    });

    const presetKey =
      typeof args.presetKey === "string" && args.presetKey in PRESET_SCENARIO_COMPARISONS
        ? (args.presetKey as keyof typeof PRESET_SCENARIO_COMPARISONS)
        : "winter_smog_defense";

    const baselineRoom: RoomConfiguration = {
      name: "Comparative Room",
      roomType: (args.roomType as RoomConfiguration["roomType"]) || "bedroom",
      dimensions: { lengthM: 4.2, widthM: 3.6, heightM: 2.9 },
      occupantsCount: 2,
      infiltrationLevel: "standard_indian_apartment",
      ventilationMode: "closed_windows",
      windowOpeningFraction: 0,
      hasAirPurifier: true,
      purifierCADR: 280,
      purifierFanSpeed: "medium",
      indoorSource: presetKey === "indoor_cooking_surge" ? "cooking_tadka" : "none",
      indoorSourceStartMinute: 15,
      indoorSourceDurationMinutes: 30,
    };

    const scenarios = PRESET_SCENARIO_COMPARISONS[presetKey].generateScenarios(baselineRoom);
    const comparison = compareIndoorScenarios({
      baselineRoom,
      outdoor,
      alternativeScenarios: scenarios,
    });

    return {
      presetTitle: PRESET_SCENARIO_COMPARISONS[presetKey].title,
      presetDescription: PRESET_SCENARIO_COMPARISONS[presetKey].description,
      outdoorPM25: outdoor.pm25,
      keyTakeaway: comparison.keyTakeaway,
      scenarios: comparison.scenarios.map((s) => ({
        label: s.label,
        peakPM25: s.peakPM25,
        finalPM25: s.finalPM25,
        averagePM25: s.averagePM25,
        deltaFinalVsBaseline: s.deltaFinalPM25VsBaseline,
        percentExposureReductionVsBaseline: s.percentExposureReductionVsBaseline,
      })),
      scientificCaveats: comparison.scientificCaveats,
    };
  },
};

// ==========================================
// TOOL C: explain_simulation_results
// ==========================================
export const explainSimulationResultsTool: AgentTool = {
  name: "explain_simulation_results",
  description:
    "Provide plain-language scientific explanations for indoor simulation outcomes, detailing the role of air exchange, particle infiltration, CADR filtration, and deposition kinetics.",
  parameters: {
    type: "object",
    properties: {
      initialPM25: {
        type: "number",
        description: "Starting indoor concentration in µg/m³",
      },
      finalPM25: {
        type: "number",
        description: "Final indoor concentration in µg/m³",
      },
      peakPM25: {
        type: "number",
        description: "Peak indoor concentration in µg/m³",
      },
      outdoorPM25: {
        type: "number",
        description: "Outdoor ambient concentration in µg/m³",
      },
      hasAirPurifier: {
        type: "boolean",
        description: "Whether filtration was enabled",
      },
      indoorSource: {
        type: "string",
        description: "Source scenario modeled",
      },
    },
    required: ["finalPM25", "outdoorPM25"],
  },
  argumentSchema: z.object({
    initialPM25: z.number().optional(),
    finalPM25: z.number(),
    peakPM25: z.number().optional(),
    outdoorPM25: z.number(),
    hasAirPurifier: z.boolean().optional(),
    indoorSource: z.string().optional(),
  }),
  execute: async (args) => {
    const finalPM25 = typeof args.finalPM25 === "number" ? args.finalPM25 : 0;
    const outdoorPM25 = typeof args.outdoorPM25 === "number" ? args.outdoorPM25 : 100;
    const ioRatio = outdoorPM25 > 0 ? Math.round((finalPM25 / outdoorPM25) * 100) / 100 : 0;
    const isCleanerThanOutdoor = finalPM25 < outdoorPM25;

    return {
      indoorOutdoorRatio: ioRatio,
      protectionState: isCleanerThanOutdoor
        ? `Indoor space attenuates outdoor pollution by ${Math.round((1 - ioRatio) * 100)}%.`
        : "Indoor air is worse than outdoor air due to unmitigated internal particle generation.",
      governingMechanisms: [
        "Infiltration (P * λ * C_out): Fine PM2.5 penetrates building cracks at a factor of ~0.70.",
        "Deposition (k_d * C): Natural settling on floors and walls removes ~24% of suspended PM2.5 per hour.",
        args.hasAirPurifier
          ? "HEPA Filtration (k_f * C): Clean Air Delivery Rate actively extracts sub-micron aerosols."
          : "Absence of Mechanical Filtration: Passive settling alone requires 2-3 hours to clear spikes.",
      ],
      whoGuidelineComparison: {
        whoTargetPM25: "15 µg/m³ (24-hour mean)",
        currentFinalPM25: `${finalPM25} µg/m³`,
        status: finalPM25 <= 15 ? "MEETS_WHO_TARGET" : "EXCEEDS_WHO_TARGET",
      },
      practicalAdvice: isCleanerThanOutdoor
        ? "Maintain closed windows while outdoor AQI remains severe. Check HEPA filters regularly."
        : "Immediately vent indoor sources with an exhaust hood or introduce HEPA air cleaning.",
    };
  },
};

// ==========================================
// TOOL D: get_room_configuration
// ==========================================
export const getRoomConfigurationTool: AgentTool = {
  name: "get_room_configuration",
  description: "Retrieve authenticated user's saved room configurations (dimensions, volume, purifier status, infiltration).",
  parameters: {
    type: "object",
    properties: {
      roomId: {
        type: "string",
        description: "Optional specific room ID. If omitted, all saved rooms for the user are returned.",
      },
    },
  },
  argumentSchema: z.object({
    roomId: z.string().optional(),
  }),
  execute: async (args, context) => {
    const userId = context.userId;
    const rawRoomId = typeof args.roomId === "string" ? args.roomId : undefined;

    if (rawRoomId) {
      const room = getRoomById(userId, rawRoomId);
      if (!room) {
        return {
          error: "ROOM_NOT_FOUND",
          message: `Room with ID '${rawRoomId}' does not exist or is unauthorized.`,
        };
      }
      return {
        room: room.config,
        roomVolumeM3: Math.round(
          room.config.dimensions.lengthM * room.config.dimensions.widthM * room.config.dimensions.heightM * 10
        ) / 10,
      };
    }

    const rooms = getUserRooms(userId);
    return {
      userId,
      roomsCount: rooms.length,
      rooms: rooms.map((r) => ({
        id: r.id,
        name: r.config.name,
        roomType: r.config.roomType,
        dimensions: r.config.dimensions,
        hasAirPurifier: r.config.hasAirPurifier,
        purifierCADR: r.config.purifierCADR,
      })),
    };
  },
};

// ==========================================
// TOOL E: save_room_configuration (Safety Gate)
// ==========================================
export const saveRoomConfigurationTool: AgentTool = {
  name: "save_room_configuration",
  description:
    "Save or update a room configuration profile. SAFETY GATE: Requires explicit user confirmation (isConfirmed=true). When isConfirmed=false, returns a structured proposal for user confirmation.",
  parameters: {
    type: "object",
    properties: {
      isConfirmed: {
        type: "boolean",
        description:
          "Mandatory confirmation flag. If false, returns a confirmation proposal without saving. If true, commits changes to the database.",
      },
      roomId: {
        type: "string",
        description: "Optional ID to update existing room, or omit to create new",
      },
      name: {
        type: "string",
        description: "Room label (e.g. 'Master Bedroom')",
      },
      roomType: {
        type: "string",
        description: "Category: 'bedroom', 'living_room', 'kitchen', 'classroom', 'office'",
        enum: ["bedroom", "living_room", "kitchen", "classroom", "office"],
      },
      lengthMeters: {
        type: "number",
        description: "Room length in meters",
      },
      widthMeters: {
        type: "number",
        description: "Room width in meters",
      },
      heightMeters: {
        type: "number",
        description: "Room height in meters",
      },
      hasAirPurifier: {
        type: "boolean",
        description: "Whether purifier is present",
      },
      purifierCADR: {
        type: "number",
        description: "CADR in m³/h",
      },
    },
    required: ["isConfirmed", "name"],
  },
  argumentSchema: z.object({
    isConfirmed: z.boolean(),
    roomId: z.string().optional(),
    name: z.string().min(1).max(50),
    roomType: z.enum(["bedroom", "living_room", "kitchen", "classroom", "office"]).optional(),
    lengthMeters: z.number().min(1.5).max(30).optional(),
    widthMeters: z.number().min(1.5).max(30).optional(),
    heightMeters: z.number().min(2.0).max(6.0).optional(),
    hasAirPurifier: z.boolean().optional(),
    purifierCADR: z.number().min(0).max(1500).optional(),
  }),
  execute: async (args, context) => {
    const userId = context.userId;
    const rawRoomId = typeof args.roomId === "string" ? args.roomId : undefined;
    const rawName = typeof args.name === "string" ? args.name : "My Room";
    const hasAirPurifier = typeof args.hasAirPurifier === "boolean" ? args.hasAirPurifier : false;

    const proposedConfig: Partial<RoomConfiguration> = {
      id: rawRoomId,
      name: rawName,
      roomType: (args.roomType as RoomConfiguration["roomType"]) || "bedroom",
      dimensions: {
        lengthM: typeof args.lengthMeters === "number" ? args.lengthMeters : 4.0,
        widthM: typeof args.widthMeters === "number" ? args.widthMeters : 3.5,
        heightM: typeof args.heightMeters === "number" ? args.heightMeters : 3.0,
      },
      hasAirPurifier,
      purifierCADR: typeof args.purifierCADR === "number" ? args.purifierCADR : 0,
    };

    // SAFETY GATE CHECK: If isConfirmed is false, do not mutate database!
    if (!args.isConfirmed) {
      return {
        status: "CONFIRMATION_REQUIRED",
        message:
          "The proposed room configuration requires explicit user confirmation before saving to database.",
        proposedConfig,
        actionRequired: "Ask user: 'Would you like me to save these room dimensions and purifier settings for your profile?'",
      };
    }

    // Safety gate passed: commit to store
    const saved = saveUserRoom(userId, proposedConfig);

    return {
      status: "SUCCESSFULLY_SAVED",
      message: `Room configuration '${saved.config.name}' has been successfully saved.`,
      room: saved.config,
    };
  },
};
