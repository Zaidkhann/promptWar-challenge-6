import { CabinSetting, TravelMode } from "./types";
import { VEHICLE_CABIN_PROFILES } from "./constants";

export interface VehicleCabinState {
  mode: TravelMode;
  cabinSetting: CabinSetting;
  outsidePM25: number;
  durationMinutes: number;
  initialCabinPM25: number;
  internalSourceRateUgH?: number;
}

export interface VehicleCabinSimulationResult {
  steadyStatePM25: number;
  finalCabinPM25: number;
  timeWeightedAveragePM25: number;
  effectivePenetrationRatio: number;
  airExchangeRateACH: number;
  filtrationRateH: number;
  totalRemovalRateH: number;
  halfLifeMinutes: number;
  assumptions: string;
}

/**
 * Dynamic Vehicle Cabin Mass-Balance ODE Model
 * 
 * Governing Differential Equation:
 *   dC_cabin/dt = P_v * lambda_v * C_out(t) + S_cabin/V_cabin - (lambda_v + k_f + k_d) * C_cabin
 * 
 * Exact Analytical Piecewise Solution:
 *   C_ss = (P_v * lambda_v * C_out + S/V) / (lambda_v + k_f + k_d)
 *   C_cabin(t) = C_ss + (C_0 - C_ss) * exp(-K_total * t)
 *   TWA = C_ss + ((C_0 - C_ss) / (K_total * t)) * (1 - exp(-K_total * t))
 */
export function simulateVehicleCabinAirQuality(
  params: VehicleCabinState
): VehicleCabinSimulationResult {
  const {
    mode,
    cabinSetting,
    outsidePM25,
    durationMinutes,
    initialCabinPM25,
    internalSourceRateUgH = 0,
  } = params;

  // Base profile
  const baseProfile = VEHICLE_CABIN_PROFILES[mode] || VEHICLE_CABIN_PROFILES.car_ac_recirc;

  // Adjust parameters based on cabin setting (recirculation vs. fresh air vs. windows open)
  let lambda_v = baseProfile.airExchangeRateH; // Air exchange rate (h^-1)
  let k_f = baseProfile.effectiveFiltrationRateH; // Filtration rate (h^-1)
  let P_v = baseProfile.penetrationFactor;
  let cabinVolumeM3 = 3.0; // Standard 5-seater passenger car cabin volume
  const k_d = 0.25; // In-cabin surface deposition rate (h^-1)

  if (mode === "metro_underground") {
    cabinVolumeM3 = 220.0; // DMRC 8-coach train car volume
    lambda_v = 6.0;
    k_f = 12.0; // High-volume commercial HVAC filtration
    P_v = 0.22;
  } else if (mode === "bus_electric_ac") {
    cabinVolumeM3 = 65.0; // Standard 12m low-floor transit bus
    lambda_v = 10.0;
    k_f = 6.0;
    P_v = 0.55;
  } else if (mode.startsWith("car_")) {
    if (cabinSetting === "recirculation") {
      lambda_v = 1.5;
      k_f = 8.5; // High recirculation cycle through cabin pleated HEPA/dust filter
      P_v = 0.28;
    } else if (cabinSetting === "fresh_air") {
      lambda_v = 18.0;
      k_f = 2.5; // Single-pass filtration through dusty cowl intake
      P_v = 0.65;
    } else if (cabinSetting === "windows_open") {
      lambda_v = 55.0;
      k_f = 0.0;
      P_v = 0.96;
    }
  } else {
    // Open transit modes (auto, two-wheeler, walking, cycling)
    lambda_v = 100.0;
    k_f = 0.0;
    P_v = baseProfile.penetrationFactor;
    cabinVolumeM3 = 10.0;
  }

  const K_total = Math.max(0.01, lambda_v + k_f + k_d);
  const durationHours = Math.max(0.01, durationMinutes / 60);

  // Steady-state concentration
  const numerator = P_v * lambda_v * outsidePM25 + internalSourceRateUgH / cabinVolumeM3;
  const C_ss = numerator / K_total;

  // Exponential decay / accumulation
  const decayFactor = Math.exp(-K_total * durationHours);
  const C_final = C_ss + (initialCabinPM25 - C_ss) * decayFactor;

  // Time-Weighted Average (TWA)
  const twa = C_ss + ((initialCabinPM25 - C_ss) / (K_total * durationHours)) * (1 - decayFactor);

  const effectivePenetration = outsidePM25 > 0 ? Number((twa / outsidePM25).toFixed(3)) : P_v;
  const halfLifeMins = Number(((Math.LN2 / K_total) * 60).toFixed(1));

  let assumptions = `${baseProfile.label} cabin model: ACH=${lambda_v}/h, k_f=${k_f}/h, P_v=${P_v}. `;
  if (cabinSetting === "recirculation") {
    assumptions += "Recirculation mode active (retains in-cabin filtered air).";
  } else if (cabinSetting === "fresh_air") {
    assumptions += "Fresh-air mode active (pulls outside ambient exhaust into cabin).";
  } else if (cabinSetting === "windows_open") {
    assumptions += "Windows open (direct exterior air exchange).";
  }

  return {
    steadyStatePM25: Math.round(C_ss),
    finalCabinPM25: Math.round(C_final),
    timeWeightedAveragePM25: Math.round(twa),
    effectivePenetrationRatio: effectivePenetration,
    airExchangeRateACH: lambda_v,
    filtrationRateH: k_f,
    totalRemovalRateH: Number(K_total.toFixed(2)),
    halfLifeMinutes: halfLifeMins,
    assumptions,
  };
}
