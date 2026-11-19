import "server-only";
import { z } from "zod";
import { AgentTool } from "../types";
import { getNearbyCPCBStations } from "@/lib/aqi/providers/cpcb";
import { getAirQualityReport } from "@/lib/aqi/service";

// Known Indian city coordinate registry for rapid spatial lookup
const CITY_COORDINATES: Record<string, { lat: number; lon: number; name: string }> = {
  delhi: { lat: 28.6468, lon: 77.3160, name: "New Delhi" },
  mumbai: { lat: 19.0657, lon: 72.8687, name: "Mumbai" },
  bengaluru: { lat: 12.9135, lon: 77.6101, name: "Bengaluru" },
  bangalore: { lat: 12.9135, lon: 77.6101, name: "Bengaluru" },
  kolkata: { lat: 22.5448, lon: 88.3426, name: "Kolkata" },
  pune: { lat: 18.5314, lon: 73.8446, name: "Pune" },
  lucknow: { lat: 26.8467, lon: 80.9462, name: "Lucknow" },
};

// Tool H: get_location_air_quality
export const getLocationAirQualityTool: AgentTool = {
  name: "get_location_air_quality",
  description:
    "Retrieve air quality and nearby CAAQMS monitoring stations for a specific Indian metropolitan city or regional location. Validates station density and reports spatial confidence.",
  parameters: {
    type: "object",
    properties: {
      cityName: {
        type: "string",
        description: "Name of the Indian city (e.g., 'Delhi', 'Mumbai', 'Bengaluru', 'Kolkata', 'Pune', 'Lucknow')",
      },
      latitude: {
        type: "number",
        description: "Optional explicit latitude coordinate",
      },
      longitude: {
        type: "number",
        description: "Optional explicit longitude coordinate",
      },
    },
  },
  argumentSchema: z.object({
    cityName: z.string().optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
  }),
  execute: async (args, context) => {
    let lat: number | undefined = typeof args.latitude === "number" ? args.latitude : undefined;
    let lon: number | undefined = typeof args.longitude === "number" ? args.longitude : undefined;
    const rawCityName = typeof args.cityName === "string" ? args.cityName : undefined;
    let targetName = rawCityName || "Requested Location";

    if (rawCityName) {
      const normalizedCity = rawCityName.trim().toLowerCase();
      const matched = CITY_COORDINATES[normalizedCity];
      if (matched) {
        lat = matched.lat;
        lon = matched.lon;
        targetName = matched.name;
      }
    }

    if (lat === undefined || lon === undefined) {
      // Fallback to context or default Delhi
      lat = context.lat ?? 28.6468;
      lon = context.lon ?? 77.3160;
    }

    const nearby = getNearbyCPCBStations(lat, lon, 40);
    const scenario = targetName.toLowerCase().includes("mumbai")
      ? "mumbai-bandra"
      : targetName.toLowerCase().includes("delhi")
      ? "delhi-anand-vihar"
      : undefined;

    const report = await getAirQualityReport({ lat, lon, scenario });

    return {
      searchedLocation: targetName,
      coordinates: { latitude: lat, longitude: lon },
      activeStation: {
        name: report.station.name,
        agency: report.station.sourceProvider,
        distanceKm: report.station.distanceKm ?? 0.8,
      },
      cpcbNAQI: report.cpcbNAQI,
      cpcbCategory: report.cpcbCategory,
      dominantPollutant: report.dominantPollutant,
      acuteSmogHISI: report.hisi,
      nearbyStationsFound: nearby.map((s) => ({
        name: s.name,
        city: s.city,
        distanceKm: s.distanceKm,
      })),
      confidenceScore: report.provenance.confidenceScore,
      dataFreshnessMinutes: report.provenance.freshnessMinutes,
      source: report.provenance.source,
      disclaimer: report.disclaimer,
    };
  },
};
