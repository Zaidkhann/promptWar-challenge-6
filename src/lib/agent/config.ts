import "server-only";
import { env } from "@/lib/env";

export const AGENT_CONFIG = {
  maxIterations: 5,
  overallDeadlineMs: 25000,
  toolTimeoutMs: 5000,
  maxContextMessages: 12,
  primaryModel: env.GEMINI_MODEL,
  fallbackModel: env.GEMINI_FALLBACK_MODEL,
  temperature: 0.2,
  topP: 0.8,
  apiKey: env.GEMINI_API_KEY,
};

export function isGeminiConfigured(): boolean {
  return Boolean(AGENT_CONFIG.apiKey && AGENT_CONFIG.apiKey.trim().length > 10);
}
