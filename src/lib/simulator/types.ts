import { z } from "zod";

// ==========================================
// ROOM GEOMETRY & SPACE TYPES
// ==========================================

export type RoomType = "bedroom" | "living_room" | "kitchen" | "classroom" | "office";

export type InfiltrationLevel = "tight_seal" | "standard_indian_apartment" | "leaky_drafty";

export type VentilationMode =
  | "closed_windows"
  | "window_ajar"
  | "windows_open"
  | "mechanical_filtered"
  | "mechanical_unfiltered";

export type IndoorSourceType =
  | "none"
  | "cooking_tadka"
  | "incense_agarbatti"
  | "mosquito_coil"
  | "candle"
  | "smoking";

export type PurifierFanSpeed = "off" | "low" | "medium" | "high" | "turbo";

export interface StoredRoom {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  config: RoomConfiguration;
}

// ==========================================
// ZOD SCHEMAS FOR VALIDATION
// ==========================================

export const RoomDimensionsSchema = z.object({
  lengthM: z.number().min(1.5, "Length must be at least 1.5m").max(30, "Length cannot exceed 30m"),
  widthM: z.number().min(1.5, "Width must be at least 1.5m").max(30, "Width cannot exceed 30m"),
  heightM: z.number().min(2.0, "Height must be at least 2.0m").max(6.0, "Height cannot exceed 6m"),
});

export const RoomConfigurationSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(50).default("My Room"),
  roomType: z.enum(["bedroom", "living_room", "kitchen", "classroom", "office"]).default("bedroom"),
  dimensions: RoomDimensionsSchema.default({ lengthM: 4.0, widthM: 3.5, heightM: 3.0 }),
  occupantsCount: z.number().int().min(1).max(100).default(2),
  infiltrationLevel: z.enum(["tight_seal", "standard_indian_apartment", "leaky_drafty"]).default("standard_indian_apartment"),
  ventilationMode: z.enum([
    "closed_windows",
    "window_ajar",
    "windows_open",
    "mechanical_filtered",
    "mechanical_unfiltered",
  ]).default("closed_windows"),
  windowOpeningFraction: z.number().min(0).max(1).default(0), // 0 = closed, 1 = fully open
  hasAirPurifier: z.boolean().default(false),
  purifierCADR: z.number().min(0).max(1500).default(250), // m³/h (Clean Air Delivery Rate)
  purifierFanSpeed: z.enum(["off", "low", "medium", "high", "turbo"]).default("medium"),
  indoorSource: z.enum([
    "none",
    "cooking_tadka",
    "incense_agarbatti",
    "mosquito_coil",
    "candle",
    "smoking",
  ]).default("none"),
  indoorSourceStartMinute: z.number().min(0).max(720).default(15), // when emission starts
  indoorSourceDurationMinutes: z.number().min(0).max(360).default(30), // how long emission lasts
  initialIndoorPM25: z.number().min(0).max(2000).optional(), // initial C(0) in µg/m³
  initialIndoorPM10: z.number().min(0).max(3000).optional(),
});

export type RoomConfiguration = z.infer<typeof RoomConfigurationSchema>;

export const OutdoorConditionsSchema = z.object({
  pm25: z.number().min(0).max(2000), // µg/m³
  pm10: z.number().min(0).max(3000).optional(),
  temperatureC: z.number().optional(),
  relativeHumidityPercent: z.number().optional(),
  isLive: z.boolean().default(false),
  isManualAssumption: z.boolean().default(false),
  sourceName: z.string().default("CAAQMS Station"),
  stationId: z.string().optional(),
  observedAt: z.string().optional(),
  confidenceScore: z.number().min(0).max(1).default(0.9),
  scenarioName: z.string().optional(),
});

export type OutdoorConditions = z.infer<typeof OutdoorConditionsSchema>;

export const SimulationParametersSchema = z.object({
  durationHours: z.number().min(1).max(24).default(4),
  timeStepMinutes: z.number().min(1).max(15).default(2),
});

export type SimulationParameters = z.infer<typeof SimulationParametersSchema>;

export const SingleSimulationRequestSchema = z.object({
  room: RoomConfigurationSchema,
  outdoor: OutdoorConditionsSchema,
  parameters: SimulationParametersSchema.default({ durationHours: 4, timeStepMinutes: 2 }),
});

export type SingleSimulationRequest = z.infer<typeof SingleSimulationRequestSchema>;

// ==========================================
// SIMULATION OUTPUT TYPES
// ==========================================

export interface SimulationTimePoint {
  minute: number;
  hour: number;
  indoorPM25: number; // µg/m³
  indoorPM10: number; // µg/m³
  outdoorPM25: number; // µg/m³
  outdoorPM10: number; // µg/m³
  indoorOutdoorRatioPM25: number; // C_in / C_out (0.0 to >1.0)
  isSourceActive: boolean;
  activePurifierCADR: number; // m³/h
  effectiveAirExchangeRateACH: number; // h⁻¹
  whoExceededPM25: boolean; // true if > 15 µg/m³
}

export interface InspectableModelParameters {
  roomVolumeM3: number;
  floorAreaM2: number;
  outdoorAirExchangeACH: number; // λ (h⁻¹)
  envelopePenetrationFactorPM25: number; // P (dimensionless)
  envelopePenetrationFactorPM10: number;
  particleDepositionRatePM25: number; // k_d (h⁻¹)
  particleDepositionRatePM10: number;
  purifierRemovalRate: number; // k_f = CADR / V (h⁻¹)
  effectiveTotalRemovalRatePM25: number; // λ + k_f + k_d (h⁻¹)
  sourceEmissionRateUgPerHourPM25: number; // S (µg/h)
  sourceEmissionRateUgPerHourPM10: number;
  steadyStateConcentrationPM25: number; // C_ss (µg/m³)
  halfLifeSettlingTimeMinutes: number; // t_50 = ln(2) / K_total * 60
}

export interface SimulationMetrics {
  initialPM25: number;
  peakPM25: number;
  finalPM25: number;
  averagePM25: number;
  initialPM10: number;
  peakPM10: number;
  finalPM10: number;
  averagePM10: number;
  percentChangeFromInitial: number; // ((final - initial) / initial) * 100
  who24HrGuidelineThreshold: number; // 15 µg/m³
  whoGuidelineExceedancePercent: number; // % of time above 15 µg/m³
  cpcbGoodThreshold: number; // 30 µg/m³
  hoursToCleanToGoodCategory: number | null; // time to reach < 30 µg/m³
  areaUnderCurveExposureUgHrM3: number; // Cumulative exposure dose
}

export interface ScientificCitation {
  parameter: string;
  value: string;
  citationTitle: string;
  sourceOrganization: "US EPA" | "WHO" | "CPCB" | "Peer-Reviewed Literature";
  url: string;
  accessDate: string;
  notes: string;
}

export interface SimulationOutput {
  id: string;
  calculatedAt: string;
  roomName: string;
  roomType: RoomType;
  durationHours: number;
  timeStepMinutes: number;
  timePoints: SimulationTimePoint[];
  metrics: SimulationMetrics;
  parameters: InspectableModelParameters;
  outdoorContext: OutdoorConditions;
  citations: ScientificCitation[];
  assumptions: string[];
  limitations: string[];
}

// ==========================================
// SCENARIO COMPARISON TYPES
// ==========================================

export interface ScenarioDefinition {
  id: string;
  label: string;
  description: string;
  roomOverrides: Partial<RoomConfiguration>;
}

export interface ScenarioResultComparison {
  scenarioId: string;
  label: string;
  description: string;
  output: SimulationOutput;
  peakPM25: number;
  finalPM25: number;
  averagePM25: number;
  deltaPeakPM25VsBaseline: number; // intervention - baseline
  deltaFinalPM25VsBaseline: number;
  percentExposureReductionVsBaseline: number; // ((AUC_base - AUC_int) / AUC_base) * 100
  timeToReachTargetMinutes: number | null;
}

export interface MultiScenarioComparisonOutput {
  id: string;
  calculatedAt: string;
  baselineScenarioId: string;
  scenarios: ScenarioResultComparison[];
  keyTakeaway: string;
  scientificCaveats: string[];
}

// ==========================================
// ACTION RECOMMENDATIONS TYPES
// ==========================================

export interface IndoorActionRecommendation {
  id: string;
  title: string;
  category: "purification" | "ventilation" | "source_control" | "sealing" | "maintenance";
  priority: "critical" | "high" | "medium" | "advisory";
  influencingFactor: string;
  simulationEvidence: string;
  actionRequired: string;
  expectedImpact: string;
  remainingUncertainty: string;
  basis: "Statutory Guideline" | "Mass-Balance Simulation Model" | "Physical Building Physics";
  citationSource: string;
}
