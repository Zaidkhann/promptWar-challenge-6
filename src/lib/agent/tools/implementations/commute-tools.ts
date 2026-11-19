import "server-only";
import { z } from "zod";
import { AgentTool } from "../types";
import {
  MaskType,
  OptimizationObjective,
  TravelMode,
  ActivityProfile,
} from "@/lib/commute/types";
import { resolveCommuteRoute } from "@/lib/commute/routing/service";
import { sampleRouteSpatialExposureAsync } from "@/lib/commute/spatial-exposure";
import { compareCommuteAlternatives } from "@/lib/commute/comparator";
import { calculateCommuteDosimetry } from "@/lib/commute/dosimetry";
import { calculateCommuteCarbonFootprint } from "@/lib/commute/carbon-engine";
import { generateCommuteActionAdvisories } from "@/lib/commute/recommendations";
import { SCIENTIFIC_CITATIONS } from "@/lib/commute/constants";

/**
 * TOOL 14: optimize_commute_route
 * Evaluates route alternatives and recommends the best option according to the selected objective.
 */
export const optimizeCommuteRouteTool: AgentTool = {
  name: "optimize_commute_route",
  description:
    "Evaluates available route alternatives and recommends optimal travel modes according to user optimization objectives (lowest_exposure, fastest, lowest_carbon, or balanced). Integrates real road geometries, spatial IDW pollution sampling, and respiratory dosimetry.",
  parameters: {
    type: "object",
    properties: {
      origin: {
        type: "string",
        description: "Origin location, transit hub, or address (e.g. 'Anand Vihar, Delhi', 'Indirapuram, Ghaziabad').",
      },
      destination: {
        type: "string",
        description: "Destination location, transit hub, or address (e.g. 'Connaught Place, New Delhi', 'Noida Sector 62').",
      },
      departureHour: {
        type: "number",
        description: "Hour of departure in 24-hour format (0-23, e.g. 8 for 08:00 AM). Incorporates Atmospheric Boundary Layer diurnal dynamics.",
      },
      objective: {
        type: "string",
        description: "Optimization objective: 'lowest_exposure', 'fastest', 'lowest_carbon', or 'balanced'. Defaults to 'lowest_exposure'.",
        enum: ["lowest_exposure", "fastest", "lowest_carbon", "balanced"],
      },
      maskType: {
        type: "string",
        description: "Optional in-use mask type: 'NONE', 'CLOTH', 'SURGICAL', or 'N95'. Defaults to 'NONE'.",
        enum: ["NONE", "CLOTH", "SURGICAL", "N95"],
      },
      ambientPM25: {
        type: "number",
        description: "Ambient baseline PM2.5 in µg/m³. If omitted, defaults to calibrated regional smog baseline (388 µg/m³ for Delhi NCR).",
      },
    },
    required: ["origin", "destination"],
  },
  argumentSchema: z.object({
    origin: z.string().min(1).max(200),
    destination: z.string().min(1).max(200),
    departureHour: z.number().int().min(0).max(23).optional(),
    objective: z.enum(["lowest_exposure", "fastest", "lowest_carbon", "balanced"]).optional(),
    maskType: z.enum(["NONE", "CLOTH", "SURGICAL", "N95"]).optional(),
    ambientPM25: z.number().positive().max(2000).optional(),
  }),
  execute: async (args: Record<string, unknown>) => {
    try {
      const origin = typeof args.origin === "string" ? args.origin : "Anand Vihar, Delhi";
      const destination = typeof args.destination === "string" ? args.destination : "Connaught Place, New Delhi";
      const departureHour = typeof args.departureHour === "number" ? Math.max(0, Math.min(23, args.departureHour)) : 8;
      const objective = (typeof args.objective === "string" ? args.objective : "lowest_exposure") as OptimizationObjective;
      const maskType = (typeof args.maskType === "string" ? args.maskType : "NONE") as MaskType;
      const ambientPM25 = typeof args.ambientPM25 === "number" ? Math.max(1, args.ambientPM25) : 388;

      // 1. Resolve route geometry
      const resolved = await resolveCommuteRoute(origin, destination);

      // 2. Sample spatial IDW pollution with real OpenAQ v3 observations
      const spatialProfile = await sampleRouteSpatialExposureAsync(resolved.route, ambientPM25, departureHour);

      // 3. Compare all 8 modal alternatives
      const matrix = compareCommuteAlternatives({
        route: resolved.route,
        spatialProfile,
        departureHour,
        maskType,
        objective,
      });

      // 4. Generate deterministic action advisories
      const advisories = generateCommuteActionAdvisories(matrix);

      return {
        success: true,
        routeSummary: {
          id: resolved.route.id,
          name: resolved.route.name,
          origin: resolved.originFormatted,
          destination: resolved.destinationFormatted,
          distanceKm: resolved.route.distanceKm,
          routingProvider: resolved.route.provider,
          waypointCount: resolved.route.geometry.length,
          spatialConfidence: spatialProfile.spatialConfidence,
          meanAmbientPM25: spatialProfile.meanPM25,
          peakHotspotPM25: spatialProfile.peakPM25,
          hotspotCount: spatialProfile.hotspotCount,
          hasLiveOpenAQData: spatialProfile.hasLiveOpenAQData,
          provenanceSummary: spatialProfile.provenanceSummary,
          liveStationsCount: spatialProfile.liveStationsCount,
        },
        optimizationObjective: objective,
        optimalChoice: {
          mode: matrix.optimalMode.mode,
          label: matrix.optimalMode.label,
          depositedDosePM25Ug: matrix.optimalMode.dosimetry.depositedDosePM25Ug,
          inhaledMassPM25Ug: matrix.optimalMode.dosimetry.inhaledMassPM25Ug,
          travelDurationMinutes: matrix.optimalMode.durationMinutes,
          carbonGramsCO2: matrix.optimalMode.carbonGrams,
          carbonAvoidedGramsCO2: matrix.optimalMode.carbonAvoidedVsCarGrams,
          costINR: matrix.optimalMode.estimatedCostINR,
          tag: matrix.optimalMode.tag,
          precautions: matrix.optimalMode.precautions,
        },
        modeComparison: matrix.modes.map((m) => ({
          mode: m.mode,
          label: m.label,
          depositedDosePM25Ug: m.dosimetry.depositedDosePM25Ug,
          inhaledMassPM25Ug: m.dosimetry.inhaledMassPM25Ug,
          durationMinutes: m.durationMinutes,
          carbonGramsCO2: m.carbonGrams,
          costINR: m.estimatedCostINR,
          isRecommended: m.isRecommended,
        })),
        summaryTakeaway: matrix.summaryTakeaway,
        actionAdvisories: advisories.map((a) => ({
          headline: a.headline,
          suggestedAction: a.suggestedAction,
          estimatedImpact: a.estimatedImpact,
          priority: a.priority,
        })),
        disclaimer:
          "Respiratory dosimetry models population exposure using EPA minute ventilation rates and ICRP 66 deposition fractions. Not an individual medical diagnostic.",
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Route optimization failed";
      return {
        success: false,
        error: errorMsg,
      };
    }
  },
};

/**
 * TOOL 15: calculate_commute_exposure
 * Calculates precise inhaled mass and deposited respiratory dose for a specific travel scenario.
 */
export const calculateCommuteExposureTool: AgentTool = {
  name: "calculate_commute_exposure",
  description:
    "Calculates scientifically documented inhaled particulate mass and ICRP 66 respiratory deposited dose for a specific commute mode, duration, exertion level, and mask scenario.",
  parameters: {
    type: "object",
    properties: {
      distanceKm: {
        type: "number",
        description: "Commute distance in kilometers.",
      },
      durationMinutes: {
        type: "number",
        description: "Total travel duration in minutes.",
      },
      mode: {
        type: "string",
        description:
          "Transit mode: 'metro_underground', 'car_ac_recirc', 'car_fresh_air', 'bus_electric_ac', 'auto_rickshaw', 'two_wheeler', 'walking', 'cycling'.",
        enum: [
          "metro_underground",
          "car_ac_recirc",
          "car_fresh_air",
          "bus_electric_ac",
          "auto_rickshaw",
          "two_wheeler",
          "walking",
          "cycling",
        ],
      },
      activityProfile: {
        type: "string",
        description: "Physical exertion level: 'sedentary', 'light', 'moderate', or 'intense'.",
        enum: ["sedentary", "light", "moderate", "intense"],
      },
      ambientPM25: {
        type: "number",
        description: "Ambient particulate concentration in µg/m³.",
      },
      ambientPM10: {
        type: "number",
        description: "Optional ambient PM10 concentration in µg/m³.",
      },
      maskType: {
        type: "string",
        description: "In-use mask: 'NONE', 'CLOTH', 'SURGICAL', or 'N95'. Defaults to 'NONE'.",
        enum: ["NONE", "CLOTH", "SURGICAL", "N95"],
      },
      cabinSetting: {
        type: "string",
        description: "Vehicle cabin setting: 'recirculation', 'fresh_air', or 'windows_open'.",
        enum: ["recirculation", "fresh_air", "windows_open"],
      },
    },
    required: ["distanceKm", "durationMinutes", "mode", "ambientPM25"],
  },
  argumentSchema: z.object({
    distanceKm: z.number().positive().max(300),
    durationMinutes: z.number().positive().max(720),
    mode: z.enum([
      "metro_underground",
      "car_ac_recirc",
      "car_fresh_air",
      "bus_electric_ac",
      "auto_rickshaw",
      "two_wheeler",
      "walking",
      "cycling",
    ]),
    activityProfile: z.enum(["sedentary", "light", "moderate", "intense"]).optional(),
    ambientPM25: z.number().nonnegative().max(2000),
    ambientPM10: z.number().nonnegative().max(3000).optional(),
    maskType: z.enum(["NONE", "CLOTH", "SURGICAL", "N95"]).optional(),
    cabinSetting: z.enum(["recirculation", "fresh_air", "windows_open"]).optional(),
  }),
  execute: async (args: Record<string, unknown>) => {
    try {
      const distanceKm = typeof args.distanceKm === "number" ? Math.max(0.1, args.distanceKm) : 10;
      const durationMinutes = typeof args.durationMinutes === "number" ? Math.max(1, args.durationMinutes) : 30;
      const mode = (typeof args.mode === "string" ? args.mode : "metro_underground") as TravelMode;
      const activityProfile = typeof args.activityProfile === "string" ? (args.activityProfile as ActivityProfile) : undefined;
      const ambientPM25 = typeof args.ambientPM25 === "number" ? Math.max(1, args.ambientPM25) : 388;
      const ambientPM10 = typeof args.ambientPM10 === "number" ? Math.max(1, args.ambientPM10) : ambientPM25 * 1.55;
      const maskType = (typeof args.maskType === "string" ? args.maskType : "NONE") as MaskType;

      const dosimetry = calculateCommuteDosimetry({
        distanceKm,
        durationMinutes,
        mode,
        activityProfile,
        ambientPM25,
        ambientPM10,
        maskType,
      });

      const carbonAnalysis = calculateCommuteCarbonFootprint(distanceKm);
      const carbonItem = carbonAnalysis.modeBreakdown.find((c) => c.mode === mode);

      return {
        success: true,
        inputs: {
          distanceKm,
          durationMinutes,
          mode,
          ambientPM25,
          ambientPM10,
          maskType,
        },
        dosimetryResults: {
          inhaledMassPM25Ug: dosimetry.inhaledMassPM25Ug,
          inhaledMassPM10Ug: dosimetry.inhaledMassPM10Ug,
          depositedDosePM25Ug: dosimetry.depositedDosePM25Ug,
          depositedDosePM10Ug: dosimetry.depositedDosePM10Ug,
          doseUncertaintyRangePM25Ug: dosimetry.doseRangePM25Ug,
          timeWeightedAveragePM25UgM3: dosimetry.timeWeightedAveragePM25,
          minuteVentilationRateM3Min: dosimetry.minuteVentilationM3Min,
          effectiveMaskFiltrationPercent: dosimetry.effectiveMaskFiltration,
          effectiveCabinPenetrationFactor: dosimetry.effectiveCabinPenetration,
          depositionFractionPM25: dosimetry.depositionFractionPM25,
        },
        carbonImpact: {
          totalCO2Grams: carbonItem ? carbonItem.totalCO2Grams : 0,
          carbonAvoidedVsCarGrams: carbonItem ? carbonItem.carbonAvoidedVsCarGrams : 0,
          emissionFactorGramsPerPKm: carbonItem ? carbonItem.emissionFactorGramsPerPKm : 0,
          occupancyAssumption: carbonItem?.occupancyAssumption || "Single occupant",
        },
        scientificFoundations: SCIENTIFIC_CITATIONS.map((c) => ({
          parameter: c.parameter,
          source: c.source,
          publication: c.publication,
          limitation: c.limitation,
        })),
        disclaimer:
          "Calculated values are comparative population exposure estimates. Not an individual medical or diagnostic health measurement.",
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Exposure calculation failed";
      return {
        success: false,
        error: errorMsg,
      };
    }
  },
};
