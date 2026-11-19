import {
  InfiltrationLevel,
  VentilationMode,
  IndoorSourceType,
  PurifierFanSpeed,
  ScientificCitation,
  RoomConfiguration,
} from "./types";

export const DEFAULT_ROOM_PROFILES: Record<string, RoomConfiguration> = {
  default_bedroom: {
    id: "default_bedroom",
    name: "Master Bedroom",
    roomType: "bedroom",
    dimensions: { lengthM: 4.2, widthM: 3.6, heightM: 2.9 },
    occupantsCount: 2,
    infiltrationLevel: "standard_indian_apartment",
    ventilationMode: "closed_windows",
    windowOpeningFraction: 0,
    hasAirPurifier: true,
    purifierCADR: 260,
    purifierFanSpeed: "medium",
    indoorSource: "none",
    indoorSourceStartMinute: 0,
    indoorSourceDurationMinutes: 0,
  },
  default_living_room: {
    id: "default_living_room",
    name: "Living & Dining Room",
    roomType: "living_room",
    dimensions: { lengthM: 6.5, widthM: 4.5, heightM: 2.9 },
    occupantsCount: 4,
    infiltrationLevel: "standard_indian_apartment",
    ventilationMode: "closed_windows",
    windowOpeningFraction: 0,
    hasAirPurifier: true,
    purifierCADR: 450,
    purifierFanSpeed: "medium",
    indoorSource: "incense_agarbatti",
    indoorSourceStartMinute: 30,
    indoorSourceDurationMinutes: 45,
  },
  default_kitchen: {
    id: "default_kitchen",
    name: "Enclosed Kitchen",
    roomType: "kitchen",
    dimensions: { lengthM: 3.2, widthM: 2.5, heightM: 2.8 },
    occupantsCount: 1,
    infiltrationLevel: "leaky_drafty",
    ventilationMode: "closed_windows",
    windowOpeningFraction: 0,
    hasAirPurifier: false,
    purifierCADR: 0,
    purifierFanSpeed: "off",
    indoorSource: "cooking_tadka",
    indoorSourceStartMinute: 15,
    indoorSourceDurationMinutes: 30,
  },
};

// ==========================================
// AIR EXCHANGE RATES (λ in ACH = h⁻¹)
// Reference: US EPA Exposure Factors Handbook & CPCB Indoor Guidelines
// ==========================================
export const AIR_EXCHANGE_RATES: Record<InfiltrationLevel, Record<VentilationMode, number>> = {
  tight_seal: {
    closed_windows: 0.35, // Tight weatherstripping
    window_ajar: 1.8,
    windows_open: 5.0,
    mechanical_filtered: 1.2, // Controlled HVAC with MERV/HEPA
    mechanical_unfiltered: 1.2,
  },
  standard_indian_apartment: {
    closed_windows: 0.95, // Typical urban Indian construction with frame gaps
    window_ajar: 2.8,
    windows_open: 6.5,
    mechanical_filtered: 1.5,
    mechanical_unfiltered: 1.5,
  },
  leaky_drafty: {
    closed_windows: 2.1, // Single pane, unsealed wooden frames, balcony gaps
    window_ajar: 4.2,
    windows_open: 8.5,
    mechanical_filtered: 2.0,
    mechanical_unfiltered: 2.0,
  },
};

// ==========================================
// PARTICULATE ENVELOPE PENETRATION FACTORS (P, dimensionless)
// Reference: Thatcher et al. (2002), Long et al. (2001)
// ==========================================
export const PENETRATION_FACTORS: Record<VentilationMode, { pm25: number; pm10: number }> = {
  closed_windows: { pm25: 0.70, pm10: 0.40 }, // Fine particles penetrate cracks more readily than coarse
  window_ajar: { pm25: 0.90, pm10: 0.75 },
  windows_open: { pm25: 1.00, pm10: 0.95 }, // Direct atmospheric opening
  mechanical_filtered: { pm25: 0.15, pm10: 0.05 }, // Filtered intake air
  mechanical_unfiltered: { pm25: 0.85, pm10: 0.70 },
};

// ==========================================
// SURFACE DEPOSITION LOSS RATES (k_d in h⁻¹)
// Reference: Wallace et al. (2004), US EPA Particulate Matter Compendium
// ==========================================
export const DEPOSITION_RATES = {
  pm25: 0.24, // Typical indoor brownian + turbulent eddy deposition rate (0.15 - 0.30 h⁻¹)
  pm10: 1.05, // Gravitational settling dominates for coarse fractions (0.70 - 1.50 h⁻¹)
};

// ==========================================
// PURIFIER FAN SPEED CADR MULTIPLIERS
// ==========================================
export const FAN_SPEED_MULTIPLIERS: Record<PurifierFanSpeed, number> = {
  off: 0.0,
  low: 0.40, // ~40% rated high CADR (silent/sleep mode)
  medium: 0.70, // ~70% rated CADR
  high: 1.00, // 100% rated CADR (ANSI/AHAM AC-1 test condition)
  turbo: 1.25, // Overdrive/turbo boost
};

// ==========================================
// INDOOR SOURCE EMISSION RATES (S in µg/h and µg/min)
// Derived from measured Indian household studies & EPA Indoor Air Source characterization
// ==========================================
export const INDOOR_SOURCE_EMISSIONS: Record<
  IndoorSourceType,
  {
    name: string;
    emissionRatePM25UgPerMin: number;
    emissionRatePM10UgPerMin: number;
    description: string;
    citation: string;
  }
> = {
  none: {
    name: "No Indoor Source",
    emissionRatePM25UgPerMin: 0,
    emissionRatePM10UgPerMin: 0,
    description: "Quiet room with passive occupant metabolism only.",
    citation: "Baseline Mass Balance Standard",
  },
  cooking_tadka: {
    name: "Indian Cooking (Tadka / Deep Frying)",
    emissionRatePM25UgPerMin: 1500, // 90,000 µg/h PM2.5
    emissionRatePM10UgPerMin: 2200,
    description: "High-temperature mustard oil tempering with spices, releasing intense fine aerosol plumes.",
    citation: "Huboyo et al. (2011) & CPCB Indoor Cooking Characterization Study",
  },
  incense_agarbatti: {
    name: "Incense Burning (Agarbatti)",
    emissionRatePM25UgPerMin: 450, // 27,000 µg/h PM2.5
    emissionRatePM10UgPerMin: 550,
    description: "Smoldering scented charcoal/wood paste stick emitting continuous sub-micron carbonaceous particles.",
    citation: "Jetoma et al. (1998) & US EPA Indoor Air Quality PM Factsheet",
  },
  mosquito_coil: {
    name: "Mosquito Repellent Coil",
    emissionRatePM25UgPerMin: 650, // 39,000 µg/h PM2.5
    emissionRatePM10UgPerMin: 800,
    description: "Continuous pyrethroid-binder smoldering releasing fine particle smoke equivalent to 75-100 cigarettes.",
    citation: "Liu et al. (2003) Environmental Health Perspectives (EHP)",
  },
  candle: {
    name: "Scented Paraffin Candle",
    emissionRatePM25UgPerMin: 90, // 5,400 µg/h PM2.5
    emissionRatePM10UgPerMin: 110,
    description: "Wick combustion releasing elemental soot and volatile organics.",
    citation: "US EPA Indoor Air Quality Modeling Library",
  },
  smoking: {
    name: "Tobacco Cigarette Smoking",
    emissionRatePM25UgPerMin: 2000, // 120,000 µg/h PM2.5
    emissionRatePM10UgPerMin: 2400,
    description: "Active sidestream and mainstream cigarette smoke release.",
    citation: "Klepeis et al. (2003) & WHO Environmental Tobacco Smoke Guidelines",
  },
};

// ==========================================
// TRACEABLE SCIENTIFIC CITATIONS
// ==========================================
export const SCIENTIFIC_CITATIONS: ScientificCitation[] = [
  {
    parameter: "Particle Penetration (P = 0.70)",
    value: "0.70 for PM2.5 through standard building cracks",
    citationTitle: "A review of the effects of outdoor particle infiltration on indoor air quality",
    sourceOrganization: "Peer-Reviewed Literature",
    url: "https://www.sciencedirect.com/science/article/pii/S0360132304000305",
    accessDate: "2026-11-18",
    notes: "Envelope penetration factor accounts for coarse particle impaction in cracks while fine PM2.5 enters readily.",
  },
  {
    parameter: "Particle Deposition Rate (k_d = 0.24 h⁻¹)",
    value: "0.24 h⁻¹ for PM2.5 indoors",
    citationTitle: "Deposition of particulate matter in residential indoor environments (Thatcher et al., 2002)",
    sourceOrganization: "US EPA",
    url: "https://www.epa.gov/indoor-air-quality-iaq/indoor-particulate-matter",
    accessDate: "2026-11-18",
    notes: "Reflects natural gravitational settling, thermophoresis, and electrostatic surface attraction for sub-2.5µm aerosols.",
  },
  {
    parameter: "Air Purifier Clean Air Delivery Rate (CADR)",
    value: "k_f = CADR / Volume (h⁻¹)",
    citationTitle: "ANSI/AHAM AC-1-2020: Method for Measuring Performance of Portable Household Electric Room Air Cleaners",
    sourceOrganization: "US EPA",
    url: "https://www.epa.gov/indoor-air-quality-iaq/air-cleaners-and-air-filters-home",
    accessDate: "2026-11-18",
    notes: "CADR is certified air volume stripped of 99.97% particles per hour. Clean Air ACH is calculated as CADR (m³/h) / Room Volume (m³).",
  },
  {
    parameter: "WHO 24-Hour PM2.5 Guideline (15 µg/m³)",
    value: "15 µg/m³ 24-hour mean",
    citationTitle: "WHO Global Air Quality Guidelines: Particulate Matter (PM2.5 and PM10), Ozone, Nitrogen Dioxide, Sulfur Dioxide and Carbon Monoxide",
    sourceOrganization: "WHO",
    url: "https://www.who.int/teams/environment-climate-change-and-health/air-quality-energy-and-health",
    accessDate: "2026-11-18",
    notes: "Guideline level for protection of human respiratory and cardiovascular health against prolonged particulate exposure.",
  },
  {
    parameter: "CPCB National Ambient Air Quality Standard (60 µg/m³)",
    value: "60 µg/m³ 24-hour standard",
    citationTitle: "National Ambient Air Quality Standards (NAAQS) Notification",
    sourceOrganization: "CPCB",
    url: "https://cpcb.nic.in/air-quality-standards/",
    accessDate: "2026-11-18",
    notes: "Statutory 24-hour threshold for ambient PM2.5 in industrial, residential, rural, and other areas in India.",
  },
];

// ==========================================
// MODEL LIMITATIONS & ASSUMPTIONS DISCLOSURES
// ==========================================
export const SIMULATION_ASSUMPTIONS: string[] = [
  "Well-Mixed Room Hypothesis: Concentration is assumed uniform throughout the indoor air volume at any given time point.",
  "Single-Zone Model: Internal partition doors and multi-room pressure gradients are not modeled in this single-chamber mass balance.",
  "Constant Outdoor Air Exchange during interval: Infiltration is assumed steady over the user-defined ventilation mode.",
  "HEPA Filter Efficiency: Clean Air Delivery Rate (CADR) operates according to standard ANSI/AHAM AC-1 specifications without air bypass leakage.",
  "Linear Superposition: Indoor particulate mass is conserved; chemical transformations and secondary aerosol nucleation are neglected.",
];

export const SIMULATION_LIMITATIONS: string[] = [
  "This model is a physical simulator for educational planning and does not replace calibrated indoor laboratory sensor telemetry.",
  "Building envelope permeability varies across seasons, wind speeds, and temperature differentials (stack effect).",
  "Cooking emissions vary widely based on oil temperature, seasoning, and kitchen exhaust hood capture efficiency.",
  "Does not provide individual medical diagnoses or guarantee total elimination of acute respiratory risk during Severe winter smog.",
];
