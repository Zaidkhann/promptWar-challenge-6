/**
 * SaansAI Commute & Exposure Dosimetry Module.
 * Exports multimodal route resolution, ICRP 66 dosimetry, carbon analysis, and scenario comparisons.
 */

export * from "./types";
export * from "./constants";
export { resolveCommuteRoute } from "./routing/service";
export { sampleRouteSpatialExposureAsync } from "./spatial-exposure";
export { calculateCommuteDosimetry } from "./dosimetry";
export { calculateCommuteCarbonFootprint } from "./carbon-engine";
export { compareCommuteAlternatives } from "./comparator";
export { generateCommuteActionAdvisories } from "./recommendations";
export { simulateVehicleCabinAirQuality } from "./cabin-model";
export { evaluateMaskProtection } from "./mask-model";
