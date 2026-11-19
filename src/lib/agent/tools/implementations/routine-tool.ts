import "server-only";
import { z } from "zod";
import { AgentTool } from "../types";
import { getAirQualityReport } from "@/lib/aqi/service";
import { evaluateRoutineRecommendations } from "@/lib/recommendations/engine";
import { DEFAULT_USER_PREFERENCES, UserPreferences } from "@/lib/recommendations/types";

// Tool E: get_daily_recommendations
export const getDailyRecommendationsTool: AgentTool = {
  name: "get_daily_recommendations",
  description:
    "Retrieve deterministic, evidence-based daily lifestyle recommendations (outdoor activity windows, indoor ventilation, commute mitigation, and cohort precautions) derived strictly from CPCB NAQI Guidelines and ICRP 66 dosimetry.",
  parameters: {
    type: "object",
    properties: {
      latitude: {
        type: "number",
        description: "Latitude coordinate",
      },
      longitude: {
        type: "number",
        description: "Longitude coordinate",
      },
      scenario: {
        type: "string",
        description: "Demonstration scenario ID ('delhi-anand-vihar' or 'mumbai-bandra')",
        enum: ["delhi-anand-vihar", "mumbai-bandra", "live"],
      },
    },
  },
  argumentSchema: z.object({
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    scenario: z.enum(["delhi-anand-vihar", "mumbai-bandra", "live"]).optional(),
  }),
  execute: async (args, context) => {
    const lat = (args.latitude as number | undefined) ?? context.lat ?? 28.6468;
    const lon = (args.longitude as number | undefined) ?? context.lon ?? 77.3160;
    const scenario = (args.scenario as string | undefined) ?? context.scenario;

    const report = await getAirQualityReport({ lat, lon, scenario });
    const userPrefs = (context.userPreferences as UserPreferences) ?? DEFAULT_USER_PREFERENCES;

    const evalResult = evaluateRoutineRecommendations({
      aqiReport: report,
      preferences: userPrefs,
      currentHour: new Date().getHours(),
    });

    return {
      status: evalResult.status,
      aqi: evalResult.aqiSummary.aqi,
      category: evalResult.aqiSummary.category,
      dominantPollutant: evalResult.aqiSummary.dominantPollutant,
      stationName: evalResult.aqiSummary.stationName,
      recommendations: evalResult.recommendations.map((r) => ({
        id: r.id,
        title: r.title,
        priority: r.priority,
        category: r.category,
        action: r.actionSummary,
        explanation: r.explanation,
        supportingEvidence: r.supportingDataText,
        sourceCitation: r.source,
        indoorAlternative: r.indoorAlternative,
      })),
      disclaimer: "Non-medical lifestyle exposure mitigation guidance.",
    };
  },
};
