import { TravelMode } from "./types";
import { VEHICLE_CABIN_PROFILES } from "./constants";

export interface ModeCarbonResult {
  mode: TravelMode;
  label: string;
  totalCO2Grams: number;
  carbonAvoidedVsCarGrams: number;
  emissionFactorGramsPerPKm: number;
  occupancyAssumption: string;
  gridOrFuelSource: string;
}

export interface CommuteCarbonAnalysis {
  distanceKm: number;
  baselineCarGrams: number;
  modeBreakdown: ModeCarbonResult[];
  mostEcoFriendlyMode: TravelMode;
  maxCarbonAvoidedGrams: number;
}

/**
 * Environmental Impact and Carbon Analysis Engine
 * Calculates passenger-normalized lifecycle transit carbon emissions across modal alternatives.
 * 
 * Traceable Sources:
 * - Central Electricity Authority (CEA) CO2 Baseline Database for Indian Power Sector (Version 19)
 * - Automotive Research Association of India (ARAI) BS-VI Vehicle Emission Factors
 * - Delhi Metro Rail Corporation (DMRC) Annual Environmental Sustainability Report
 */
export function calculateCommuteCarbonFootprint(distanceKm: number): CommuteCarbonAnalysis {
  const modes = Object.keys(VEHICLE_CABIN_PROFILES) as TravelMode[];

  const carProfile = VEHICLE_CABIN_PROFILES.car_ac_recirc;
  const baselineCarGrams = Math.round(carProfile.carbonGramsPerPKm * distanceKm);

  const modeBreakdown: ModeCarbonResult[] = modes.map((m) => {
    const profile = VEHICLE_CABIN_PROFILES[m];
    const totalCO2 = Math.round(profile.carbonGramsPerPKm * distanceKm);
    const avoided = Math.max(0, baselineCarGrams - totalCO2);

    let occupancy = "1.2 passengers average (urban single commuter)";
    let fuelSource = "BS-VI Petrol Internal Combustion";

    if (m === "metro_underground") {
      occupancy = "High-density DMRC metro train (~1800 passengers capacity)";
      fuelSource = "Northern Regional Grid electricity with regenerative braking recovery";
    } else if (m === "bus_electric_ac") {
      occupancy = "35 passengers average (DTC 12m low-floor electric bus)";
      fuelSource = "Grid electricity charged via depot infrastructure";
    } else if (m === "auto_rickshaw") {
      occupancy = "1.5 passengers average";
      fuelSource = "Compressed Natural Gas (CNG)";
    } else if (m === "two_wheeler") {
      occupancy = "1.0 rider";
      fuelSource = "100-125cc 4-stroke BS-VI petrol engine";
    } else if (m === "walking" || m === "cycling") {
      occupancy = "1.0 individual";
      fuelSource = "Human metabolic energy (Zero direct transport emissions)";
    }

    return {
      mode: m,
      label: profile.label,
      totalCO2Grams: totalCO2,
      carbonAvoidedVsCarGrams: avoided,
      emissionFactorGramsPerPKm: profile.carbonGramsPerPKm,
      occupancyAssumption: occupancy,
      gridOrFuelSource: fuelSource,
    };
  });

  // Find lowest positive or zero carbon mode
  const sorted = [...modeBreakdown].sort((a, b) => a.totalCO2Grams - b.totalCO2Grams);
  const mostEcoFriendly = sorted[0].mode;
  const maxAvoided = Math.max(...modeBreakdown.map((m) => m.carbonAvoidedVsCarGrams));

  return {
    distanceKm,
    baselineCarGrams,
    modeBreakdown,
    mostEcoFriendlyMode: mostEcoFriendly,
    maxCarbonAvoidedGrams: maxAvoided,
  };
}
