/**
 * SaansAI Air Quality (AQI) Module.
 * Exports statutory CPCB NAQI calculators, OpenAQ/Open-Meteo providers, and normalizers.
 */

export * from "./types";
export { getAirQualityReport } from "./service";
export {
  calculateCompositeCPCB_NAQI,
  calculateHISI,
  getAQICategory,
} from "./cpcb-calculator";
export {
  normalizePollutantReadings,
  calculateConfidenceScore,
} from "./normalizer";
export { interpolateSpatialAQI } from "./idw-interpolator";
export { getNearbyCPCBStations, calculateHaversineDistanceKm } from "./providers/cpcb";
export { fetchOpenAQData } from "./providers/openaq";
export { fetchOpenMeteoWeather, fetchOpenMeteoAirQuality } from "./providers/open-meteo";
