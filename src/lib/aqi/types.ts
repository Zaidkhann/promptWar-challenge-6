import { z } from "zod";

export type PollutantCode = "PM2.5" | "PM10" | "NO2" | "SO2" | "CO" | "O3" | "NH3" | "Pb";

export type AQICategory =
  | "Good"
  | "Satisfactory"
  | "Moderate"
  | "Poor"
  | "Very Poor"
  | "Severe"
  | "Insufficient Data";

export type DataProvenanceType =
  | "OFFICIAL_CAAQMS"
  | "OPENAQ_V3"
  | "SPATIAL_INTERPOLATION"
  | "HISTORICAL_BASELINE"
  | "DEMO_SCENARIO";

export interface RawPollutantReading {
  pollutant: PollutantCode;
  value: number;
  unit: string;
  timestamp: string; // ISO 8601
  averagingHours?: number;
}

export interface PollutantDetail {
  code: PollutantCode;
  name: string;
  value: number;
  unit: "µg/m³" | "mg/m³";
  rawUnit: string;
  subIndex: number | null;
  category: AQICategory | null;
  averagingPeriod: string;
  validHoursCount: number;
  isDataSufficient: boolean;
  standardBenchmark: string;
  observedAt: string;
  qualityScore: number;
}

export interface AtmosphericWeather {
  temperatureC: number;
  relativeHumidityPercent: number;
  windSpeedKmh: number;
  windDirectionDegrees: number;
  windDirectionCardinal: string;
  boundaryLayerHeightMeters: number;
  isInversionActive: boolean;
  inversionRisk: "Low" | "Medium" | "High";
  observedAt: string;
}

export interface MonitoringStation {
  id: string;
  name: string;
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  sourceProvider: "CPCB" | "OPENAQ" | "LOCAL_CALIBRATED";
  distanceKm?: number;
}

export interface NormalizedAirQualityReport {
  station: MonitoringStation;
  calculatedAt: string;
  cpcbNAQI: number | null;
  cpcbCategory: AQICategory;
  dominantPollutant: PollutantCode | null;
  isDataSufficient: boolean;
  dataSufficiencyNotes: string;
  hisi: number; // Hourly Instantaneous Smog Indicator
  hisiCategory: AQICategory;
  pollutants: Record<PollutantCode, PollutantDetail | undefined>;
  weather: AtmosphericWeather;
  provenance: {
    type: DataProvenanceType;
    badgeText: string;
    source: string;
    freshnessMinutes: number;
    confidenceScore: number;
    isInterpolated: boolean;
    isDemo: boolean;
  };
  disclaimer: string;
}

// Zod Schemas for API validation
export const CoordinatesQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90).optional(),
  lon: z.coerce.number().min(-180).max(180).optional(),
  stationId: z.string().optional(),
  scenario: z.enum(["delhi-anand-vihar", "mumbai-bandra", "live"]).optional(),
  radiusKm: z.coerce.number().min(1).max(100).default(30).optional(),
});

export type CoordinatesQuery = z.infer<typeof CoordinatesQuerySchema>;

export const StationsQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90).optional(),
  lon: z.coerce.number().min(-180).max(180).optional(),
  radiusKm: z.coerce.number().min(1).max(500).default(50).optional(),
});

export type StationsQuery = z.infer<typeof StationsQuerySchema>;
