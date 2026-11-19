import { TravelMode, MaskType, ActivityProfile, ScientificCitation } from "./types";

/**
 * Minute Ventilation Rates (V_E) by Physical Activity Intensity
 * Source: US EPA Exposure Factors Handbook (2011 Edition, EPA/600/R-09/052F), Table 6-1
 * Unit: m³/min and L/min
 */
export const MINUTE_VENTILATION_RATES: Record<ActivityProfile, { m3PerMin: number; lPerMin: number }> = {
  sedentary: { m3PerMin: 0.008, lPerMin: 8.0 },   // Resting, sitting in car/bus/metro/auto
  light: { m3PerMin: 0.014, lPerMin: 14.0 },       // Driving two-wheeler, relaxed standing
  moderate: { m3PerMin: 0.024, lPerMin: 24.0 },    // Brisk walking (4.5 - 5.5 km/h)
  intense: { m3PerMin: 0.036, lPerMin: 36.0 },     // Cycling (15 - 20 km/h)
};

/**
 * Respiratory Tract Particle Deposition Fractions (DF)
 * Source: International Commission on Radiological Protection (ICRP Publication 66, 1994)
 * Human Respiratory Tract Model for Radiological Protection
 */
export const DEPOSITION_FRACTIONS = {
  pm25: {
    nominal: 0.28,
    min: 0.21, // Physiological lower bound (nasal breathing, resting tidal volume)
    max: 0.35, // Physiological upper bound (oral breathing during elevated exertion)
  },
  pm10: {
    nominal: 0.65,
    min: 0.50,
    max: 0.78, // Significant extrathoracic/nasopharyngeal inertial impaction
  },
};

/**
 * In-Cabin Particle Penetration Factors (P_v) & Filtration Characteristics
 * Evaluates the fraction of outdoor street-level particulate matter infiltrating vehicle breathing zones.
 */
export const VEHICLE_CABIN_PROFILES: Record<
  TravelMode,
  {
    penetrationFactor: number;
    activityProfile: ActivityProfile;
    airExchangeRateH: number;      // ACH (h^-1)
    effectiveFiltrationRateH: number; // k_f (h^-1)
    averageSpeedKmH: number;
    farePerKmINR: number;
    baseFareINR: number;
    carbonGramsPerPKm: number;     // g CO2e / passenger-km
    label: string;
    category: "rail" | "road_enclosed" | "road_open" | "active";
    precautions: string;
  }
> = {
  metro_underground: {
    penetrationFactor: 0.22,
    activityProfile: "sedentary",
    airExchangeRateH: 6.0,
    effectiveFiltrationRateH: 12.0,
    averageSpeedKmH: 32,
    farePerKmINR: 2.5,
    baseFareINR: 10,
    carbonGramsPerPKm: 14,
    label: "Underground Metro (DMRC)",
    category: "rail",
    precautions: "Wear fit-tested N95 during station walk. Metro cabin HVAC provides multi-stage mechanical filtration.",
  },
  car_ac_recirc: {
    penetrationFactor: 0.30,
    activityProfile: "sedentary",
    airExchangeRateH: 1.5,
    effectiveFiltrationRateH: 8.0,
    averageSpeedKmH: 26,
    farePerKmINR: 14.0,
    baseFareINR: 50,
    carbonGramsPerPKm: 148,
    label: "Personal Car (AC Recirc)",
    category: "road_enclosed",
    precautions: "Keep AC set strictly to Recirculation mode. Fresh-air intake draws direct roadside exhaust into cabin.",
  },
  car_fresh_air: {
    penetrationFactor: 0.65,
    activityProfile: "sedentary",
    airExchangeRateH: 18.0,
    effectiveFiltrationRateH: 2.5,
    averageSpeedKmH: 26,
    farePerKmINR: 14.0,
    baseFareINR: 50,
    carbonGramsPerPKm: 148,
    label: "Personal Car (Fresh Air Intake)",
    category: "road_enclosed",
    precautions: "High outside air intake continuously pulls tailpipe combustion aerosols from traffic ahead.",
  },
  bus_electric_ac: {
    penetrationFactor: 0.55,
    activityProfile: "sedentary",
    airExchangeRateH: 10.0,
    effectiveFiltrationRateH: 6.0,
    averageSpeedKmH: 18,
    farePerKmINR: 1.2,
    baseFareINR: 10,
    carbonGramsPerPKm: 21,
    label: "Electric AC Bus (DTC)",
    category: "road_enclosed",
    precautions: "Keep windows closed. Sealed AC electric buses reduce roadside exhaust exposure by ~45%.",
  },
  auto_rickshaw: {
    penetrationFactor: 0.95,
    activityProfile: "sedentary",
    airExchangeRateH: 80.0,
    effectiveFiltrationRateH: 0.0,
    averageSpeedKmH: 22,
    farePerKmINR: 11.0,
    baseFareINR: 30,
    carbonGramsPerPKm: 38,
    label: "CNG Auto-Rickshaw",
    category: "road_open",
    precautions: "Side-curtains allow heavy turbulent tailpipe plume entry. Certified N95 respirator mandatory.",
  },
  two_wheeler: {
    penetrationFactor: 1.0,
    activityProfile: "light",
    airExchangeRateH: 120.0,
    effectiveFiltrationRateH: 0.0,
    averageSpeedKmH: 28,
    farePerKmINR: 3.5,
    baseFareINR: 15,
    carbonGramsPerPKm: 42,
    label: "Two-Wheeler (Motorcycle)",
    category: "road_open",
    precautions: "Direct exposure to roadway particulate matter and diesel exhaust plumes. N95 and eye protection critical.",
  },
  walking: {
    penetrationFactor: 1.0,
    activityProfile: "moderate",
    airExchangeRateH: 0.0,
    effectiveFiltrationRateH: 0.0,
    averageSpeedKmH: 4.8,
    farePerKmINR: 0.0,
    baseFareINR: 0,
    carbonGramsPerPKm: 0,
    label: "Walking (Pedestrian)",
    category: "active",
    precautions: "Elevated minute ventilation (24 L/min) multiplies inhaled dose during severe smog episodes. Strictly avoid along arterial roads.",
  },
  cycling: {
    penetrationFactor: 1.0,
    activityProfile: "intense",
    airExchangeRateH: 0.0,
    effectiveFiltrationRateH: 0.0,
    averageSpeedKmH: 14.0,
    farePerKmINR: 0.0,
    baseFareINR: 0,
    carbonGramsPerPKm: 0,
    label: "Cycling (Bicycle)",
    category: "active",
    precautions: "High-intensity respiration (36 L/min) delivers massive particulate dose directly into deep alveolar lung spaces.",
  },
};

/**
 * Mask Protective Filtration Efficiency Model
 * Differentiates theoretical filter media performance from actual facial seal bypass leakage.
 */
export const MASK_PROFILES: Record<
  MaskType,
  {
    nominalFiltration: number;
    fitLeakageFraction: number;
    effectiveProtectionFraction: number;
    label: string;
    notes: string;
  }
> = {
  NONE: {
    nominalFiltration: 0.0,
    fitLeakageFraction: 1.0,
    effectiveProtectionFraction: 0.0,
    label: "No Mask",
    notes: "100% ambient breathing zone exposure without particulate filtration.",
  },
  CLOTH: {
    nominalFiltration: 0.25,
    fitLeakageFraction: 0.35,
    effectiveProtectionFraction: 0.20,
    label: "Cloth Mask",
    notes: "Low filtration media and significant perimeter leakage provide minimal protection against sub-micron combustion aerosols.",
  },
  SURGICAL: {
    nominalFiltration: 0.65,
    fitLeakageFraction: 0.30,
    effectiveProtectionFraction: 0.45,
    label: "Surgical Mask",
    notes: "Adequate splash media but loose side-cheek gaps allow significant unfiltered particle bypass.",
  },
  N95: {
    nominalFiltration: 0.98,
    fitLeakageFraction: 0.05,
    effectiveProtectionFraction: 0.95,
    label: "N95 / FFP2 Respirator",
    notes: "Certified electrostatically charged meltblown filter with tight perimeter facial seal.",
  },
};

/**
 * Authoritative Scientific Citations
 */
export const SCIENTIFIC_CITATIONS: ScientificCitation[] = [
  {
    parameter: "Minute Ventilation Rates (V_E)",
    value: "8 - 36 L/min",
    unit: "L/min",
    source: "US EPA Exposure Factors Handbook",
    publication: "EPA/600/R-09/052F (2011 Edition), Table 6-1",
    limitation: "Represents population mean values; individual respiratory rates vary with age, body mass, and cardiovascular fitness.",
  },
  {
    parameter: "Respiratory Tract Particle Deposition (DF_2.5)",
    value: "0.28 ± 0.07",
    unit: "dimensionless",
    source: "ICRP Publication 66",
    publication: "Human Respiratory Tract Model for Radiological Protection (1994)",
    limitation: "Deposition fraction depends on aerosol aerodynamic mass median diameter (AMAD) and nasal vs. oral breathing partition.",
  },
  {
    parameter: "Vehicle In-Cabin Particle Penetration (P_v)",
    value: "0.22 - 0.95",
    unit: "dimensionless",
    source: "Environmental Science & Technology / Aerosol Science",
    publication: "Hudda et al. (2011), Zhu et al. (2007) In-Cabin Commuter Exposure Studies",
    limitation: "Varies depending on vehicle age, cabin filter cleanliness, window state, and fan recirculation settings.",
  },
  {
    parameter: "Urban Passenger Transport Carbon Factors",
    value: "0 - 148 g CO2e / p-km",
    unit: "g CO2e/p-km",
    source: "Central Electricity Authority (CEA) & ARAI India",
    publication: "CEA CO2 Baseline Database Version 19 & MoPNG National Transport Benchmarks",
    limitation: "Allocations assume average occupancy factors (DMRC high-density passenger loading vs. 1.2 passengers per private car).",
  },
];
