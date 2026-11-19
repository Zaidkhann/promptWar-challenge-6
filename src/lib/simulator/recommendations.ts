import {
  SimulationOutput,
  IndoorActionRecommendation,
  RoomConfiguration,
  OutdoorConditions,
} from "./types";

export interface GenerateRecommendationsOptions {
  simulation: SimulationOutput;
  room: RoomConfiguration;
  outdoor: OutdoorConditions;
}

/**
 * Generates explainable, deterministic indoor air quality improvement recommendations
 * grounded in mass-balance simulation evidence and official guidelines (CPCB, US EPA, WHO).
 */
export function generateIndoorRecommendations(
  options: GenerateRecommendationsOptions
): IndoorActionRecommendation[] {
  const { simulation, room, outdoor } = options;
  const recommendations: IndoorActionRecommendation[] = [];
  const metrics = simulation.metrics;
  const params = simulation.parameters;

  // 1. Critical Outdoor Ingress / Ventilation Check
  if (
    outdoor.pm25 > 60 &&
    (room.ventilationMode === "windows_open" || room.ventilationMode === "window_ajar")
  ) {
    recommendations.push({
      id: "rec_seal_windows_high_smog",
      title: "Seal Windows During Severe Outdoor Smog",
      category: "ventilation",
      priority: "critical",
      influencingFactor: "High outdoor particulate flux through open apertures",
      simulationEvidence: `Outdoor PM2.5 is ${outdoor.pm25} µg/m³ with air exchange at ${params.outdoorAirExchangeACH} ACH, resulting in indoor levels reaching ${metrics.peakPM25} µg/m³.`,
      actionRequired:
        "Close all external windows and balcony doors firmly. Transition to mechanical air purification rather than natural ventilation until ambient AQI improves.",
      expectedImpact:
        "Reduces particle ingress rate by 60%–75% by utilizing the building envelope's natural impaction resistance (P = 0.70).",
      remainingUncertainty:
        "Unsealed gaps around window frames and door sills can permit ongoing infiltration if not weatherstripped.",
      basis: "Statutory Guideline",
      citationSource: "CPCB Graded Response Action Plan (GRAP) & US EPA IAQ Guidance",
    });
  }

  // 2. Air Purifier Sizing & Capacity Assessment
  const cleanAirACH = params.roomVolumeM3 > 0 ? (params.purifierRemovalRate) : 0;

  if (!room.hasAirPurifier || room.purifierFanSpeed === "off") {
    recommendations.push({
      id: "rec_deploy_hepa_purifier",
      title: "Introduce Certified HEPA Air Cleaner",
      category: "purification",
      priority: outdoor.pm25 > 120 ? "critical" : "high",
      influencingFactor: "Absence of active indoor particle extraction",
      simulationEvidence: `Indoor PM2.5 remains elevated at ${metrics.finalPM25} µg/m³ (${metrics.whoGuidelineExceedancePercent}% of simulated duration above WHO 15 µg/m³ threshold).`,
      actionRequired: `Deploy an ANSI/AHAM certified HEPA air cleaner sized for at least ${Math.round(params.roomVolumeM3 * 4.5)} m³/h CADR (achieving ~4.5 clean air changes per hour for your ${params.roomVolumeM3} m³ space).`,
      expectedImpact:
        "Accelerates particulate half-life clearance from over 120 minutes down to 15–25 minutes.",
      remainingUncertainty:
        "Manufacturer CADR ratings assume unobstructed airflow; actual clearance may decrease by 10%–20% if placed behind curtains or large furniture.",
      basis: "Mass-Balance Simulation Model",
      citationSource: "ANSI/AHAM AC-1-2020 & US EPA Clean Air Delivery Standards",
    });
  } else if (cleanAirACH < 3.0) {
    recommendations.push({
      id: "rec_undersized_purifier",
      title: "Increase Purifier Fan Speed or Upgrade CADR",
      category: "purification",
      priority: "medium",
      influencingFactor: "Undersized air cleaning rate relative to room air volume",
      simulationEvidence: `Current effective CADR yields only ${Math.round(cleanAirACH * 10) / 10} clean air changes per hour (ACH). Recommended target for smog remediation is ≥ 4.0 ACH.`,
      actionRequired:
        "Switch the air cleaner from Low/Medium to High or Turbo mode during daytime hours, or consider pairing with a secondary unit in large open-plan spaces.",
      expectedImpact:
        "Increases effective particle extraction rate by 40%–75%, lowering indoor equilibrium levels.",
      remainingUncertainty:
        "Higher fan speeds produce greater acoustic noise (typically 45–58 dB), which may affect sleeping comfort.",
      basis: "Physical Building Physics",
      citationSource: "US EPA Guide to Air Cleaners in the Home",
    });
  }

  // 3. Indoor Combustion Source Containment
  if (room.indoorSource === "cooking_tadka") {
    recommendations.push({
      id: "rec_cooking_exhaust",
      title: "Activate Kitchen Exhaust & Close Partition Doors",
      category: "source_control",
      priority: "high",
      influencingFactor: "Intense transient aerosol emission from oil volatilization",
      simulationEvidence: `Cooking emitted an acute aerosol pulse causing PM2.5 to spike to ${metrics.peakPM25} µg/m³ indoors.`,
      actionRequired:
        "Always run an external ducted range hood or window exhaust fan on maximum during tempering/frying. Keep the kitchen door closed to prevent aerosol migration into bedrooms and living quarters.",
      expectedImpact:
        "Captures 60%–80% of fine oil droplets at source before dispersion throughout the residence.",
      remainingUncertainty:
        "Recirculating (ductless) range hoods with grease-only filters do not capture ultrafine combustion aerosols unless equipped with true HEPA.",
      basis: "Mass-Balance Simulation Model",
      citationSource: "CPCB Indoor Cooking Study & WHO Indoor Air Guidelines",
    });
  } else if (room.indoorSource === "incense_agarbatti" || room.indoorSource === "mosquito_coil") {
    recommendations.push({
      id: "rec_smoldering_source_substitution",
      title: "Substitute Smoldering Coils and Incense with Smokeless Alternatives",
      category: "source_control",
      priority: "high",
      influencingFactor: "Continuous sub-micron particle generation from smoldering biomass",
      simulationEvidence: `Smoldering combustion generated sustained particle emissions, contributing to a simulated peak of ${metrics.peakPM25} µg/m³.`,
      actionRequired:
        "Replace mosquito coils with physical window mesh barriers, plug-in liquid vaporizers, or bed nets. Replace smoldering agarbatti with flameless essential oil diffusers or perform rituals in outdoor verandas.",
      expectedImpact:
        "Completely eliminates an internal emission source of 450–650 µg/min PM2.5.",
      remainingUncertainty:
        "Liquid repellent vaporizers emit volatile organic compounds (VOCs) which, while eliminating particulate smoke, require adequate baseline ventilation.",
      basis: "Statutory Guideline",
      citationSource: "Liu et al. (2003) & US EPA Indoor PM Guidelines",
    });
  }

  // 4. Envelope Infiltration & Weatherstripping
  if (room.infiltrationLevel === "leaky_drafty" && outdoor.pm25 > 100) {
    recommendations.push({
      id: "rec_weatherstripping",
      title: "Apply Weatherstripping to Door and Window Frames",
      category: "sealing",
      priority: "medium",
      influencingFactor: "Elevated passive infiltration rate (2.1 ACH) across envelope gaps",
      simulationEvidence: `High building envelope leakage drives background particulate concentration up toward equilibrium with outdoor smog (${outdoor.pm25} µg/m³).`,
      actionRequired:
        "Install self-adhesive rubber foam weatherstrips along sliding window tracks and silicone draft-stoppers beneath external-facing doors.",
      expectedImpact:
        "Lowers passive air exchange from ~2.1 ACH down to 0.6–0.9 ACH, cutting outdoor smog infiltration by over 50%.",
      remainingUncertainty:
        "Reducing natural infiltration in crowded rooms without mechanical ventilation may increase indoor CO2 and moisture levels over extended occupancy.",
      basis: "Physical Building Physics",
      citationSource: "US EPA Improving Indoor Air Quality & ASHRAE 62.2",
    });
  }

  // 5. Precautionary Medical Disclaimer
  recommendations.push({
    id: "rec_precautionary_disclaimer",
    title: "Environmental Exposure Precaution",
    category: "maintenance",
    priority: "advisory",
    influencingFactor: "Respiratory risk minimization under winter smog",
    simulationEvidence: `Simulation reflects physical particle dynamics for a well-mixed room. Current outdoor baseline is ${outdoor.pm25} µg/m³.`,
    actionRequired:
      "Inspect HEPA pre-filters fortnightly to remove coarse lint, and replace primary HEPA cartridges every 6–12 months in polluted urban environments. Individuals with diagnosed respiratory conditions should follow physician-prescribed action plans.",
    expectedImpact: "Maintains rated CADR efficiency and prevents premature motor strain.",
    remainingUncertainty:
      "Physical simulation estimates ambient room concentration; individual personal inhalation depends on proximity to sources and breathing rate.",
    basis: "Statutory Guideline",
    citationSource: "CPCB/WHO Health Advisory Guidelines",
  });

  return recommendations;
}
