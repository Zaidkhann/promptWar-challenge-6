import "server-only";
import { z } from "zod";
import { AgentTool } from "../types";
import { getAirQualityReport } from "@/lib/aqi/service";
import { generateDiurnalSchedule } from "@/lib/recommendations/diurnal-schedule";
import { DEFAULT_USER_PREFERENCES } from "@/lib/recommendations/types";

// Tool D: get_air_quality_forecast
export const getAirQualityForecastTool: AgentTool = {
  name: "get_air_quality_forecast",
  description:
    "Retrieve diurnal atmospheric dispersion forecast windows for the 24-hour cycle based on planetary boundary layer mixing physics. Clearly separates diurnal forecasts from live sensor observations.",
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
        description: "Optional scenario identifier",
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
    const schedule = generateDiurnalSchedule(report, DEFAULT_USER_PREFERENCES);

    return {
      forecastType: "Diurnal Planetary Boundary Layer Dispersion Model",
      isForecast: true,
      stationReference: report.station.name,
      optimalWindowToday: "12:00 – 15:30 IST (Convective Solar Mixing)",
      diurnalSlots: schedule.map((s) => ({
        timeRange: s.timeRange,
        period: s.label,
        expectedStatus: s.status,
        actionGuidance: s.headlineAction,
        meteorologicalBasis: s.atmosphericPhysicsNote,
        isOptimalWindow: s.isOptimalWindow,
      })),
      multiDayForecastStatus:
        "Multi-day numerical chemical transport forecast (e.g. SAFAR-WRF 72-hour grid) is not currently connected as an automated REST endpoint. Values shown are diurnal atmospheric thermodynamic models.",
    };
  },
};
