import "server-only";
import { z } from "zod";
import { AgentTool } from "../types";
import { fetchOpenMeteoWeather } from "@/lib/aqi/providers/open-meteo";

// Tool C: get_weather
export const getWeatherTool: AgentTool = {
  name: "get_weather",
  description:
    "Retrieve current atmospheric meteorological conditions, including ambient temperature, relative humidity, surface wind speed/vector, planetary boundary layer height, and thermal inversion risk.",
  parameters: {
    type: "object",
    properties: {
      latitude: {
        type: "number",
        description: "Latitude coordinate of target location",
      },
      longitude: {
        type: "number",
        description: "Longitude coordinate of target location",
      },
    },
  },
  argumentSchema: z.object({
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
  }),
  execute: async (args, context) => {
    const lat = (args.latitude as number | undefined) ?? context.lat ?? 28.6468;
    const lon = (args.longitude as number | undefined) ?? context.lon ?? 77.3160;

    const weather = await fetchOpenMeteoWeather(lat, lon);

    return {
      coordinates: { latitude: lat, longitude: lon },
      temperatureC: weather.temperatureC,
      relativeHumidityPercent: weather.relativeHumidityPercent,
      windSpeedKmh: weather.windSpeedKmh,
      windDirection: weather.windDirectionCardinal,
      planetaryBoundaryLayerMeters: Math.round(weather.boundaryLayerHeightMeters),
      thermalInversionActive: weather.isInversionActive,
      inversionRiskLevel: weather.inversionRisk,
      observedAt: weather.observedAt,
      provider: "Open-Meteo European Centre for Medium-Range Weather Forecasts (ECMWF) Model",
    };
  },
};
