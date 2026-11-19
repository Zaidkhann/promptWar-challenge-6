import {
  UserPreferencesSchema,
  DEFAULT_USER_PREFERENCES,
  RoutineEvaluationInput,
  RoutineEvaluationResult,
  Recommendation,
  RecommendationPriority,
} from "./types";
import { evaluateOutdoorActivityRule } from "./rules/outdoor-exercise-rule";
import { evaluateVentilationRule } from "./rules/ventilation-rule";
import { evaluateCommuteProtectionRule } from "./rules/commute-protection-rule";
import { evaluateSensitiveCohortRule } from "./rules/sensitive-cohort-rule";
import { evaluateSmogAlertRule } from "./rules/smog-alert-rule";
import { evaluateFamilySmogDefenseRule } from "./rules/family-smog-defense-rule";
import { evaluateLowEmissionRoutineRule } from "./rules/low-emission-routine-rule";
import { generateDiurnalSchedule } from "./diurnal-schedule";

const PRIORITY_WEIGHTS: Record<RecommendationPriority, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

/**
 * Main Deterministic Recommendation Engine.
 * Evaluates verified AQI telemetry, atmospheric weather, and user preferences.
 * Does not use probabilistic LLM calls for recommendation logic or scientific calculations.
 */
export function evaluateRoutineRecommendations(
  input: RoutineEvaluationInput
): RoutineEvaluationResult {
  const { aqiReport, preferences, currentHour = new Date().getHours(), isForecast = false } = input;

  // 1. Validate Preferences with Zod & Fallbacks
  const parsedPref = UserPreferencesSchema.safeParse(preferences ?? {});
  const validPreferences = parsedPref.success ? parsedPref.data : DEFAULT_USER_PREFERENCES;

  // 2. Determine Data Mode & Freshness
  const isDemo = aqiReport.provenance.isDemo;
  const dataMode: "live" | "forecast" | "calibrated_baseline" | "demonstration" = isForecast
    ? "forecast"
    : isDemo
    ? "demonstration"
    : aqiReport.provenance.type === "OPENAQ_V3" || aqiReport.provenance.type === "OFFICIAL_CAAQMS"
    ? "live"
    : "calibrated_baseline";

  const freshnessMinutes = aqiReport.provenance.freshnessMinutes;

  // 3. Check for Expired / Stale Data (> 180 mins for live observations)
  let status: RoutineEvaluationResult["status"] = "SUCCESS";
  let statusMessage = "Routine recommendations generated successfully from verified telemetry.";

  if (!isDemo && freshnessMinutes > 180) {
    status = "EXPIRED_DATA";
    statusMessage =
      "Station telemetry is older than 3 hours (expired). Atmospheric boundary conditions may have changed significantly. Displaying safe precautionary baseline.";
  } else if (!isDemo && freshnessMinutes > 60) {
    status = "STALE_DATA";
    statusMessage =
      "Station telemetry is between 1 and 3 hours old (stale). Check for recent local weather shifts before prolonged outdoor exertion.";
  }

  // 4. Check for Missing Particulate Data
  const hasParticulate =
    Boolean(aqiReport.pollutants["PM2.5"]) || Boolean(aqiReport.pollutants["PM10"]);

  if (!hasParticulate && aqiReport.cpcbNAQI === null && aqiReport.hisi === 0) {
    status = "INSUFFICIENT_DATA";
    statusMessage =
      "Statutory CPCB NAQI and routine generation require valid particulate measurements (PM2.5 or PM10). Station feed currently lacks particulate telemetry.";
    return {
      status,
      statusMessage,
      isDataFresh: false,
      dataFreshnessMinutes: freshnessMinutes,
      aqiSummary: {
        aqi: null,
        category: "Insufficient Data",
        dominantPollutant: null,
        stationName: aqiReport.station.name,
        hisi: 0,
        boundaryLayerMeters: aqiReport.weather.boundaryLayerHeightMeters,
        isInversionActive: aqiReport.weather.isInversionActive,
        provenanceText: aqiReport.provenance.badgeText,
        dataMode,
        observedAt: aqiReport.calculatedAt,
      },
      recommendations: [
        {
          id: "rec_insufficient_data_advisory",
          title: "Insufficient Particulate Data: Exercise Standard Precaution",
          category: "precaution",
          priority: "medium",
          actionSummary: "Live monitoring station is not transmitting PM2.5 or PM10 particulate readings.",
          explanation:
            "Statutory routine calculations cannot be reliably completed without particulate observations. Maintain general winter smog precautions until data feed reconnects.",
          supportingData: {
            aqi: null,
            aqiCategory: "Insufficient Data",
            dominantPollutant: null,
            boundaryLayerMeters: aqiReport.weather.boundaryLayerHeightMeters,
            windSpeedKmh: aqiReport.weather.windSpeedKmh,
          },
          supportingDataText: "PM2.5 and PM10 telemetry missing.",
          source: "CPCB 2014 Data Sufficiency Requirements",
          observedAt: aqiReport.calculatedAt,
          dataFreshnessMinutes: freshnessMinutes,
          dataMode,
          confidenceScore: 0.3,
          matchedPreferences: [],
        },
      ],
      schedule: generateDiurnalSchedule(aqiReport, validPreferences),
      userPreferences: validPreferences,
      evaluatedAt: new Date().toISOString(),
    };
  }

  // 5. Evaluate Typed Rule Modules (including Family Defense & Low-Emission Actions)
  const ruleOutputs: (Recommendation | null)[] = [
    evaluateSmogAlertRule(aqiReport, validPreferences, currentHour, dataMode),
    evaluateOutdoorActivityRule(aqiReport, validPreferences, currentHour, dataMode),
    evaluateVentilationRule(aqiReport, validPreferences, currentHour, dataMode),
    evaluateCommuteProtectionRule(aqiReport, validPreferences, currentHour, dataMode),
    evaluateSensitiveCohortRule(aqiReport, validPreferences, currentHour, dataMode),
    evaluateFamilySmogDefenseRule(aqiReport, validPreferences, currentHour, dataMode),
    evaluateLowEmissionRoutineRule(aqiReport, validPreferences, currentHour, dataMode),
  ];

  // 6. Filter and Deterministically Sort Recommendations by Priority
  const recommendations: Recommendation[] = ruleOutputs
    .filter((r): r is Recommendation => r !== null)
    .sort((a, b) => {
      const weightDiff = PRIORITY_WEIGHTS[b.priority] - PRIORITY_WEIGHTS[a.priority];
      if (weightDiff !== 0) return weightDiff;
      // Deterministic tie-breaker by ID
      return a.id.localeCompare(b.id);
    });

  // 7. Generate Diurnal 5-Slot Schedule
  const schedule = generateDiurnalSchedule(aqiReport, validPreferences);

  return {
    status,
    statusMessage,
    isDataFresh: status === "SUCCESS",
    dataFreshnessMinutes: freshnessMinutes,
    aqiSummary: {
      aqi: aqiReport.cpcbNAQI,
      category: aqiReport.cpcbCategory,
      dominantPollutant: aqiReport.dominantPollutant,
      stationName: aqiReport.station.name,
      hisi: aqiReport.hisi,
      boundaryLayerMeters: aqiReport.weather.boundaryLayerHeightMeters,
      isInversionActive: aqiReport.weather.isInversionActive,
      provenanceText: aqiReport.provenance.badgeText,
      dataMode,
      observedAt: aqiReport.calculatedAt,
    },
    recommendations,
    schedule,
    userPreferences: validPreferences,
    evaluatedAt: new Date().toISOString(),
  };
}
