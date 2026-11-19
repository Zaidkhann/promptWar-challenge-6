import "server-only";
import { Type } from "@google/genai";
import { AgentTool } from "./types";
import { getCurrentAQITool, getPollutantDetailsTool } from "./implementations/aqi-tool";
import { getWeatherTool } from "./implementations/weather-tool";
import { getAirQualityForecastTool } from "./implementations/forecast-tool";
import { getDailyRecommendationsTool } from "./implementations/routine-tool";
import { getUserPreferencesTool, updateUserPreferencesTool } from "./implementations/preferences-tool";
import { getLocationAirQualityTool } from "./implementations/location-tool";
import {
  simulateIndoorAirQualityTool,
  compareIndoorScenariosTool,
  explainSimulationResultsTool,
  getRoomConfigurationTool,
  saveRoomConfigurationTool,
} from "./implementations/simulator-tools";
import {
  optimizeCommuteRouteTool,
  calculateCommuteExposureTool,
} from "./implementations/commute-tools";

// Central Tool Registry holding verified implementations
export const REGISTERED_TOOLS: AgentTool[] = [
  getCurrentAQITool,
  getPollutantDetailsTool,
  getWeatherTool,
  getAirQualityForecastTool,
  getDailyRecommendationsTool,
  getUserPreferencesTool,
  updateUserPreferencesTool,
  getLocationAirQualityTool,
  simulateIndoorAirQualityTool,
  compareIndoorScenariosTool,
  explainSimulationResultsTool,
  getRoomConfigurationTool,
  saveRoomConfigurationTool,
  optimizeCommuteRouteTool,
  calculateCommuteExposureTool,
];

const toolMap = new Map<string, AgentTool>(
  REGISTERED_TOOLS.map((t) => [t.name, t])
);

export function getRegisteredTool(name: string): AgentTool | undefined {
  return toolMap.get(name);
}

export function getAllRegisteredTools(): AgentTool[] {
  return REGISTERED_TOOLS;
}

const typeMapping: Record<string, Type> = {
  string: Type.STRING,
  number: Type.NUMBER,
  boolean: Type.BOOLEAN,
  object: Type.OBJECT,
  array: Type.ARRAY,
};

/**
 * Transforms registered tools into the official @google/genai functionDeclaration format.
 */
export function getGeminiFunctionDeclarations() {
  return [
    {
      functionDeclarations: REGISTERED_TOOLS.map((tool) => ({
        name: tool.name,
        description: tool.description,
        parameters: {
          type: Type.OBJECT,
          properties: Object.fromEntries(
            Object.entries(tool.parameters.properties).map(([key, prop]) => [
              key,
              {
                type: typeMapping[prop.type.toLowerCase()] || Type.STRING,
                description: prop.description,
                ...(prop.enum ? { enum: prop.enum } : {}),
              },
            ])
          ),
          required: tool.parameters.required || [],
        },
      })),
    },
  ];
}
