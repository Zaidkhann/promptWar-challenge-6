import "server-only";
import { z } from "zod";
import { AgentTool } from "../types";
import { getAirQualityReport } from "@/lib/aqi/service";

// Tool A: get_current_aqi
export const getCurrentAQITool: AgentTool = {
  name: "get_current_aqi",
  description:
    "Retrieve the latest validated Air Quality Index (NAQI) for a location or scenario, including statutory CPCB NAQI, acute Hourly Instantaneous Smog Indicator (HISI), dominant pollutant, and data provenance.",
  parameters: {
    type: "object",
    properties: {
      latitude: {
        type: "number",
        description: "Latitude coordinate of target location (e.g. 28.6468 for Delhi)",
      },
      longitude: {
        type: "number",
        description: "Longitude coordinate of target location (e.g. 77.3160 for Delhi)",
      },
      scenario: {
        type: "string",
        description: "Optional demonstration scenario ID ('delhi-anand-vihar' or 'mumbai-bandra')",
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

    return {
      station: {
        id: report.station.id,
        name: report.station.name,
        city: report.station.city,
        provider: report.station.sourceProvider,
      },
      cpcbNAQI: report.cpcbNAQI,
      cpcbCategory: report.cpcbCategory,
      dominantPollutant: report.dominantPollutant,
      isDataSufficient: report.isDataSufficient,
      dataSufficiencyNotes: report.dataSufficiencyNotes,
      acuteSmogPeakHISI: report.hisi,
      acuteSmogCategory: report.hisiCategory,
      atmosphericInversion: {
        boundaryLayerHeightMeters: Math.round(report.weather.boundaryLayerHeightMeters),
        isInversionActive: report.weather.isInversionActive,
        inversionRisk: report.weather.inversionRisk,
      },
      provenance: {
        type: report.provenance.type,
        source: report.provenance.source,
        badgeText: report.provenance.badgeText,
        freshnessMinutes: report.provenance.freshnessMinutes,
        confidenceScore: report.provenance.confidenceScore,
        isDemo: report.provenance.isDemo,
      },
      observedAt: report.calculatedAt,
      disclaimer: report.disclaimer,
    };
  },
};

// Tool B: get_pollutant_details
export const getPollutantDetailsTool: AgentTool = {
  name: "get_pollutant_details",
  description:
    "Retrieve detailed breakdown of monitored criteria pollutants (PM2.5, PM10, NO2, SO2, CO, O3, NH3, Pb), including concentrations, units, averaging periods, sub-indices, and CPCB benchmarks.",
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
    const pollutantList = Object.values(report.pollutants).filter(Boolean);

    return {
      station: report.station.name,
      observedAt: report.calculatedAt,
      pollutants: pollutantList.map((p) => ({
        code: p!.code,
        name: p!.name,
        concentration: p!.value,
        unit: p!.unit,
        subIndex: p!.subIndex,
        category: p!.category ?? "Insufficient Data",
        averagingPeriod: p!.averagingPeriod,
        isDataSufficient: p!.isDataSufficient,
        standardBenchmark: p!.standardBenchmark,
      })),
    };
  },
};
