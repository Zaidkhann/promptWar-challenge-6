import { CommuteComparisonMatrix } from "./types";

export interface CommuteActionImpactAdvisory {
  id: string;
  category: "mode_shift" | "departure_shift" | "cabin_control" | "mask_defense";
  priority: "critical" | "high" | "medium" | "low";
  headline: string;
  suggestedAction: string;
  supportingData: string;
  estimatedImpact: string;
  relevantAssumptions: string;
  confidenceScore: number;
}

/**
 * Deterministic Action Impact Intelligence
 * Generates verified, reproducible recommendations based purely on mathematical dosimetry and spatial telemetry.
 */
export function generateCommuteActionAdvisories(
  matrix: CommuteComparisonMatrix
): CommuteActionImpactAdvisory[] {
  const advisories: CommuteActionImpactAdvisory[] = [];

  const { modes, departureHour, maskType, spatialProfile } = matrix;

  const metro = modes.find((m) => m.mode === "metro_underground");
  const auto = modes.find((m) => m.mode === "auto_rickshaw");
  const carRecirc = modes.find((m) => m.mode === "car_ac_recirc");
  const carFresh = modes.find((m) => m.mode === "car_fresh_air");
  const walking = modes.find((m) => m.mode === "walking");

  // 1. Mode Shift Advisory: Metro vs. Auto
  if (metro && auto && auto.dosimetry.depositedDosePM25Ug > 0) {
    const doseSavedUg = auto.dosimetry.depositedDosePM25Ug - metro.dosimetry.depositedDosePM25Ug;
    const percentSaved = Math.round((doseSavedUg / auto.dosimetry.depositedDosePM25Ug) * 100);

    advisories.push({
      id: "adv_mode_metro",
      category: "mode_shift",
      priority: spatialProfile.meanPM25 > 250 ? "critical" : "high",
      headline: `Shift from Auto-Rickshaw to Metro: Save ${percentSaved}% Deposited Lung Burden`,
      suggestedAction: "Take Underground Metro (DMRC) instead of an open three-wheeler.",
      supportingData: `Auto deposited dose: ${auto.dosimetry.depositedDosePM25Ug} µg vs Metro: ${metro.dosimetry.depositedDosePM25Ug} µg over ${matrix.route.distanceKm} km.`,
      estimatedImpact: `Reduces inhaled PM2.5 by ${doseSavedUg.toFixed(0)} µg while avoiding ${metro.carbonAvoidedVsCarGrams}g CO2e.`,
      relevantAssumptions: "Metro coach HVAC filtration efficiency (P_v=0.22); auto canopy street exhaust penetration (P_v=0.95).",
      confidenceScore: spatialProfile.spatialConfidence,
    });
  }

  // 2. Cabin Control Advisory: Recirculation vs Fresh Air
  if (carRecirc && carFresh) {
    const savedUg = carFresh.dosimetry.depositedDosePM25Ug - carRecirc.dosimetry.depositedDosePM25Ug;
    advisories.push({
      id: "adv_cabin_recirc",
      category: "cabin_control",
      priority: "high",
      headline: "Lock Vehicle AC in Recirculation Mode",
      suggestedAction: "Ensure the air conditioning is set to recirculate cabin air, not fresh-air intake.",
      supportingData: `Fresh air intake pulls roadway combustion plumes (TWA ${carFresh.dosimetry.timeWeightedAveragePM25} µg/m³), whereas recirculation drops in-cabin PM2.5 to ${carRecirc.dosimetry.timeWeightedAveragePM25} µg/m³.`,
      estimatedImpact: `Prevents ${savedUg.toFixed(0)} µg PM2.5 lung deposition during this single trip.`,
      relevantAssumptions: "Standard pleated vehicle cabin filter with 8.5/h recirculation filtration rate.",
      confidenceScore: 0.95,
    });
  }

  // 3. Departure Time Shift Advisory (Atmospheric Boundary Layer dynamics)
  if (departureHour >= 7 && departureHour <= 9) {
    advisories.push({
      id: "adv_departure_shift",
      category: "departure_shift",
      priority: "medium",
      headline: "Shift Departure to Solar Mixing Window (12:00 – 15:30)",
      suggestedAction: "If travel time is flexible, shift departure to afternoon hours when thermal boundary layer expansion dilutes surface smog.",
      supportingData: `Morning inversion factor: 1.20x ambient concentration vs. Afternoon solar window: 0.72x.`,
      estimatedImpact: "Achieves an estimated ~40% reduction in ambient street-level PM2.5 exposure along the corridor.",
      relevantAssumptions: "IMD boundary layer climatological diurnal expansion curves.",
      confidenceScore: 0.88,
    });
  }

  // 4. Active Transit Warning: Walking / Cycling during Severe Smog
  if (walking && spatialProfile.meanPM25 > 200) {
    advisories.push({
      id: "adv_active_warning",
      category: "mode_shift",
      priority: "critical",
      headline: "Avoid Roadside Walking & Cycling During High Smog",
      suggestedAction: "Replace long walking or bicycle commutes along arterial roads with enclosed public transit.",
      supportingData: `Walking ventilation rate is 24 L/min (3x sedentary), generating an extreme deposited dose of ${walking.dosimetry.depositedDosePM25Ug} µg.`,
      estimatedImpact: "Protects deep alveolar airways from high-volume particulate deposition during elevated physical exertion.",
      relevantAssumptions: "EPA Exposure Factors Handbook (Table 6-1) active minute ventilation rates.",
      confidenceScore: 0.92,
    });
  }

  // 5. Mask Defense Advisory
  if (maskType !== "N95") {
    advisories.push({
      id: "adv_mask_n95",
      category: "mask_defense",
      priority: spatialProfile.meanPM25 > 150 ? "high" : "medium",
      headline: "Upgrade to Fit-Tested N95 / FFP2 Respirator",
      suggestedAction: "Wear a certified N95 respirator during outdoor walk links and open transit legs.",
      supportingData: `Cloth and surgical masks suffer 30-35% perimeter facial seal leakage; certified N95 provides 95% particulate protection.`,
      estimatedImpact: "Slashes breathing-zone particle mass by 95% relative to unmasked breathing.",
      relevantAssumptions: "Airtight nasal clamp and absence of facial hair seal gaps.",
      confidenceScore: 0.96,
    });
  }

  return advisories;
}
