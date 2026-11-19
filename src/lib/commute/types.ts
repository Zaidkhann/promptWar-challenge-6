import { z } from "zod";

export const TravelModeEnum = z.enum([
  "metro_underground",
  "car_ac_recirc",
  "car_fresh_air",
  "bus_electric_ac",
  "auto_rickshaw",
  "two_wheeler",
  "walking",
  "cycling",
]);
export type TravelMode = z.infer<typeof TravelModeEnum>;

export const ActivityProfileEnum = z.enum([
  "sedentary",
  "light",
  "moderate",
  "intense",
]);
export type ActivityProfile = z.infer<typeof ActivityProfileEnum>;

export const MaskTypeEnum = z.enum([
  "NONE",
  "CLOTH",
  "SURGICAL",
  "N95",
]);
export type MaskType = z.infer<typeof MaskTypeEnum>;

export const OptimizationObjectiveEnum = z.enum([
  "lowest_exposure",
  "fastest",
  "lowest_carbon",
  "balanced",
]);
export type OptimizationObjective = z.infer<typeof OptimizationObjectiveEnum>;

export const CabinSettingEnum = z.enum([
  "recirculation",
  "fresh_air",
  "windows_open",
]);
export type CabinSetting = z.infer<typeof CabinSettingEnum>;

// Request Schemas
export const RouteCalculationRequestSchema = z.object({
  origin: z.string().min(2, "Origin must be at least 2 characters").max(200),
  destination: z.string().min(2, "Destination must be at least 2 characters").max(200),
  departureHour: z.number().int().min(0).max(23).default(8),
  preferredMode: TravelModeEnum.optional().default("metro_underground"),
  objective: OptimizationObjectiveEnum.default("lowest_exposure"),
});
export type RouteCalculationRequest = z.infer<typeof RouteCalculationRequestSchema>;

export const ExposureCalculationRequestSchema = z.object({
  distanceKm: z.number().positive().max(300),
  durationMinutes: z.number().positive().max(720),
  mode: TravelModeEnum.default("metro_underground"),
  activityProfile: ActivityProfileEnum.default("sedentary"),
  ambientPM25: z.number().nonnegative().max(2000),
  ambientPM10: z.number().nonnegative().max(3000).optional(),
  maskType: MaskTypeEnum.default("N95"),
  cabinSetting: CabinSettingEnum.optional().default("recirculation"),
  departureHour: z.number().int().min(0).max(23).default(8),
});
export type ExposureCalculationRequest = z.infer<typeof ExposureCalculationRequestSchema>;

// Domain Interfaces
export interface RoutePoint {
  lat: number;
  lon: number;
  name?: string;
}

export interface RouteSegment {
  index: number;
  start: RoutePoint;
  end: RoutePoint;
  distanceMeters: number;
  durationSeconds: number;
  instruction?: string;
  roadName?: string;
}

export interface CalculatedRoute {
  id: string;
  name: string;
  summary: string;
  origin: RoutePoint;
  destination: RoutePoint;
  distanceKm: number;
  durationMinutes: number;
  mode: string;
  geometry: Array<[number, number]>; // [lat, lon]
  segments: RouteSegment[];
  provider: "OSRM" | "Curated_Corridor" | "User_Assumption";
  isEstimated: boolean;
  trafficAware: boolean;
}

export type ExposureMeasurementType =
  | "real_openaq"
  | "real_cpcb"
  | "idw_spatial_interpolation"
  | "calibrated_baseline";

export interface SegmentExposurePoint {
  segmentIndex: number;
  start: RoutePoint;
  end: RoutePoint;
  distanceKm: number;
  durationMinutes: number;
  estimatedPM25: number;
  estimatedPM10: number;
  nearestStationName: string;
  nearestStationDistanceKm: number;
  confidenceScore: number;
  diurnalDispersionFactor: number;
  isHotspot: boolean;
  measurementType?: ExposureMeasurementType;
  stationProvider?: "OPENAQ" | "CPCB" | "SYNTHESIZED";
}

export interface RouteSpatialProfile {
  routeId: string;
  segments: SegmentExposurePoint[];
  totalDistanceKm: number;
  totalDurationMinutes: number;
  meanPM25: number;
  meanPM10: number;
  peakPM25: number;
  minPM25: number;
  spatialConfidence: number;
  dataCoveragePercent: number;
  sourceStations: string[];
  hotspotCount: number;
  hasLiveOpenAQData?: boolean;
  provenanceSummary?: string;
  liveStationsCount?: number;
}

export interface DosimetryResult {
  inhaledMassPM25Ug: number;
  inhaledMassPM10Ug: number;
  depositedDosePM25Ug: number;
  depositedDosePM10Ug: number;
  doseRangePM25Ug: [number, number]; // [min, max] biological uncertainty bounds
  timeWeightedAveragePM25: number;
  timeWeightedAveragePM10: number;
  minuteVentilationM3Min: number;
  effectiveMaskFiltration: number;
  effectiveCabinPenetration: number;
  depositionFractionPM25: number;
  depositionFractionPM10: number;
  durationMinutes: number;
}

export interface CommuteModeResult {
  mode: TravelMode;
  label: string;
  category: "rail" | "road_enclosed" | "road_open" | "active";
  distanceKm: number;
  durationMinutes: number;
  estimatedCostINR: number;
  dosimetry: DosimetryResult;
  carbonGrams: number;
  carbonAvoidedVsCarGrams: number;
  cabinPenetrationFactor: number;
  minuteVentilationLMin: number;
  tag: string;
  tagVariant: "good" | "satisfactory" | "moderate" | "poor" | "very-poor" | "severe" | "default";
  precautions: string;
  isRecommended: boolean;
  score: number; // Combined ranking score based on objective
}

export interface ScientificCitation {
  parameter: string;
  value: string;
  unit: string;
  source: string;
  publication: string;
  limitation: string;
}

export interface CommuteComparisonMatrix {
  route: CalculatedRoute;
  departureHour: number;
  maskType: MaskType;
  ambientBaselinePM25: number;
  ambientBaselinePM10: number;
  spatialProfile: RouteSpatialProfile;
  modes: CommuteModeResult[];
  optimalMode: CommuteModeResult;
  summaryTakeaway: string;
  actionRecommendations: string[];
  citations: ScientificCitation[];
}
