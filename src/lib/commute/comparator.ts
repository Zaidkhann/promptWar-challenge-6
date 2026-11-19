import {
  CalculatedRoute,
  CommuteComparisonMatrix,
  CommuteModeResult,
  MaskType,
  OptimizationObjective,
  TravelMode,
  RouteSpatialProfile,
} from "./types";
import {
  VEHICLE_CABIN_PROFILES,
  SCIENTIFIC_CITATIONS,
} from "./constants";
import { calculateCommuteDosimetry } from "./dosimetry";
import { calculateCommuteCarbonFootprint } from "./carbon-engine";

export interface CompareCommuteAlternativesParams {
  route: CalculatedRoute;
  spatialProfile: RouteSpatialProfile;
  departureHour?: number;
  maskType?: MaskType;
  objective?: OptimizationObjective;
}

/**
 * Multi-Modal Route Comparison Lab
 * Evaluates all 8 modal alternatives against route geometry and spatial air quality.
 */
export function compareCommuteAlternatives(
  params: CompareCommuteAlternativesParams
): CommuteComparisonMatrix {
  const {
    route,
    spatialProfile,
    departureHour = 8,
    maskType = "NONE",
    objective = "lowest_exposure",
  } = params;

  const distanceKm = route.distanceKm;
  const modes = Object.keys(VEHICLE_CABIN_PROFILES) as TravelMode[];
  const carbonAnalysis = calculateCommuteCarbonFootprint(distanceKm);

  const modeResults: CommuteModeResult[] = modes.map((m) => {
    const profile = VEHICLE_CABIN_PROFILES[m];

    // Compute mode duration based on realistic average speed in Indian urban traffic
    const durationMinutes = Math.max(
      2,
      Math.round((distanceKm / Math.max(1, profile.averageSpeedKmH)) * 60)
    );

    // Compute fare
    const estimatedCostINR = Math.round(profile.baseFareINR + profile.farePerKmINR * distanceKm);

    // Compute dosimetry
    const dosimetry = calculateCommuteDosimetry({
      segments: spatialProfile.segments,
      distanceKm,
      durationMinutes,
      mode: m,
      activityProfile: profile.activityProfile,
      ambientPM25: spatialProfile.meanPM25,
      ambientPM10: spatialProfile.meanPM10,
      maskType,
    });

    // Compute carbon
    const carbonItem = carbonAnalysis.modeBreakdown.find((c) => c.mode === m);
    const carbonGrams = carbonItem ? carbonItem.totalCO2Grams : 0;
    const carbonAvoided = carbonItem ? carbonItem.carbonAvoidedVsCarGrams : 0;

    // Determine visual tag variant
    let tag = profile.label;
    let tagVariant: CommuteModeResult["tagVariant"] = "default";

    if (m === "metro_underground") {
      tag = "Safest Respiratory Shield";
      tagVariant = "good";
    } else if (m === "bus_electric_ac") {
      tag = "Eco Transit Balance";
      tagVariant = "satisfactory";
    } else if (m === "car_ac_recirc") {
      tag = "Clean In-Cabin / High Carbon";
      tagVariant = "moderate";
    } else if (m === "car_fresh_air") {
      tag = "High Exhaust Infiltration";
      tagVariant = "poor";
    } else if (m === "auto_rickshaw") {
      tag = "Heavy Roadway Smog";
      tagVariant = "very-poor";
    } else if (m === "two_wheeler") {
      tag = "Direct Exhaust Exposure";
      tagVariant = "severe";
    } else if (m === "walking") {
      tag = "High Inhaled Dose (Elevated Respiration)";
      tagVariant = "severe";
    } else if (m === "cycling") {
      tag = "Massive Lung Burden (Heavy Breathing)";
      tagVariant = "severe";
    }

    // Scoring function for ranking (Lower is better)
    let score = 0;
    const doseNorm = dosimetry.depositedDosePM25Ug;
    const timeNorm = durationMinutes;
    const carbonNorm = carbonGrams;

    if (objective === "lowest_exposure") {
      score = doseNorm * 1.0 + timeNorm * 0.1;
    } else if (objective === "fastest") {
      score = timeNorm * 1.0 + doseNorm * 0.05;
    } else if (objective === "lowest_carbon") {
      score = carbonNorm * 1.0 + doseNorm * 0.1;
    } else {
      // Balanced
      score = doseNorm * 0.4 + timeNorm * 0.3 + (carbonNorm / 10) * 0.3;
    }

    return {
      mode: m,
      label: profile.label,
      category: profile.category,
      distanceKm,
      durationMinutes,
      estimatedCostINR,
      dosimetry,
      carbonGrams,
      carbonAvoidedVsCarGrams: carbonAvoided,
      cabinPenetrationFactor: profile.penetrationFactor,
      minuteVentilationLMin: profile.activityProfile === "intense" ? 36 : profile.activityProfile === "moderate" ? 24 : profile.activityProfile === "light" ? 14 : 8,
      tag,
      tagVariant,
      precautions: profile.precautions,
      isRecommended: false,
      score: Number(score.toFixed(1)),
    };
  });

  // Sort by score ascending (lowest score is best)
  modeResults.sort((a, b) => a.score - b.score);
  modeResults[0].isRecommended = true;
  const optimalMode = modeResults[0];

  // Action Recommendations
  const actionRecommendations: string[] = [];

  const autoMode = modeResults.find((m) => m.mode === "auto_rickshaw");
  const metroMode = modeResults.find((m) => m.mode === "metro_underground");
  const carRecirc = modeResults.find((m) => m.mode === "car_ac_recirc");
  const carFresh = modeResults.find((m) => m.mode === "car_fresh_air");

  if (metroMode && autoMode) {
    const doseDelta = autoMode.dosimetry.depositedDosePM25Ug - metroMode.dosimetry.depositedDosePM25Ug;
    const percentRed = Math.round((doseDelta / autoMode.dosimetry.depositedDosePM25Ug) * 100);
    actionRecommendations.push(
      `Switching from Auto-Rickshaw to Metro slashes deposited lung dose by ${percentRed}% (${doseDelta.toFixed(0)} µg PM2.5 avoided) while avoiding ${metroMode.carbonAvoidedVsCarGrams}g of CO2e.`
    );
  }

  if (carRecirc && carFresh) {
    const freshDelta = carFresh.dosimetry.depositedDosePM25Ug - carRecirc.dosimetry.depositedDosePM25Ug;
    actionRecommendations.push(
      `Setting Car AC strictly to Recirculation prevents ${freshDelta.toFixed(0)} µg of exhaust infiltration compared to Fresh Air intake.`
    );
  }

  if (maskType === "NONE") {
    actionRecommendations.push(
      "Donning a certified N95 respirator reduces inhaled particulate dose by an additional 95% across all outdoor and transit walk legs."
    );
  }

  let summaryTakeaway = "";
  if (optimalMode.mode === "metro_underground") {
    summaryTakeaway = `Underground Metro delivers the optimal compromise: multi-stage HVAC mechanical filtration limits fine particulate penetration to 22%, saving lung tissue from severe roadway exhaust while slashing urban carbon emissions.`;
  } else if (optimalMode.mode === "car_ac_recirc") {
    summaryTakeaway = `Personal Car with AC Recirculation provides low particulate penetration (30%) but incurs a severe carbon footprint of ${optimalMode.carbonGrams}g CO2e.`;
  } else {
    summaryTakeaway = `${optimalMode.label} identified as optimal option under selected '${objective}' objective.`;
  }

  return {
    route,
    departureHour,
    maskType,
    ambientBaselinePM25: spatialProfile.meanPM25,
    ambientBaselinePM10: spatialProfile.meanPM10,
    spatialProfile,
    modes: modeResults,
    optimalMode,
    summaryTakeaway,
    actionRecommendations,
    citations: SCIENTIFIC_CITATIONS,
  };
}
