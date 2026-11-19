import { MaskType } from "./types";
import { MASK_PROFILES } from "./constants";

export interface MaskEvaluationResult {
  maskType: MaskType;
  label: string;
  nominalMediaFiltrationPercent: number;
  faceSealLeakagePercent: number;
  effectiveProtectionPercent: number;
  breathingZoneConcentrationRatio: number; // Fraction entering breathing zone (1 - eta_eff)
  scientificCaveat: string;
}

/**
 * Mask Scenario Filtration & Inward Leakage Model
 * Evaluates the actual particle penetration into the human breathing zone,
 * explicitly accounting for perimeter face-seal leakage vs. laboratory media rating.
 */
export function evaluateMaskProtection(maskType: MaskType): MaskEvaluationResult {
  const profile = MASK_PROFILES[maskType] || MASK_PROFILES.NONE;

  const nominalPercent = Math.round(profile.nominalFiltration * 100);
  const leakagePercent = Math.round(profile.fitLeakageFraction * 100);
  const effectiveProtectionPercent = Math.round(profile.effectiveProtectionFraction * 100);
  const breathingRatio = Number((1 - profile.effectiveProtectionFraction).toFixed(3));

  let caveat = "";
  if (maskType === "NONE") {
    caveat = "Zero respiratory protection; 100% of inhaled ambient aerosols enter upper and lower airways.";
  } else if (maskType === "CLOTH") {
    caveat = "Theoretical scenario: Standard woven cotton filters large droplets (>5µm) but allows ~80% of hazardous sub-micron combustion particles (PM2.5) to bypass the weave.";
  } else if (maskType === "SURGICAL") {
    caveat = "Theoretical scenario: While meltblown surgical material has ~65% electro-trapping capability, loose perimeter cheek gaps allow substantial unfiltered bypass during normal inhalation.";
  } else if (maskType === "N95") {
    caveat = "Gold standard: Certified NIOSH N95 / FFP2 respirators achieve ≥95% particulate filtration only when fit-tested with an airtight nasal bridge and perimeter facial seal. Facial hair breaks the seal.";
  }

  return {
    maskType,
    label: profile.label,
    nominalMediaFiltrationPercent: nominalPercent,
    faceSealLeakagePercent: leakagePercent,
    effectiveProtectionPercent,
    breathingZoneConcentrationRatio: breathingRatio,
    scientificCaveat: caveat,
  };
}
