import { z } from "zod";

export type MessageRole = "user" | "assistant" | "system" | "tool";

export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

export interface ToolResult {
  toolCallId: string;
  name: string;
  result: unknown;
  isError?: boolean;
}

export interface AgentMessage {
  id: string;
  role: MessageRole;
  content: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  timestamp: string; // ISO 8601
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  messages: AgentMessage[];
}

export type AgentStreamEvent =
  | { type: "status"; message: string }
  | { type: "tool_start"; tool: string; args: Record<string, unknown> }
  | { type: "tool_end"; tool: string; resultSummary: string }
  | { type: "text_delta"; delta: string }
  | { type: "done"; conversationId: string; messageId: string; totalToolCalls: number }
  | { type: "error"; error: string; code?: string };

// API Validation Schemas
export const ChatRequestSchema = z.object({
  message: z.string().trim().min(1, "Message cannot be empty").max(2000, "Message exceeds 2000 characters limit"),
  conversationId: z.string().uuid().optional(),
  userId: z.string().optional().default("default_user"),
  scenario: z.enum(["delhi-anand-vihar", "mumbai-bandra", "live"]).optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lon: z.coerce.number().min(-180).max(180).optional(),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;

export interface AgentContext {
  userId: string;
  conversationId: string;
  scenario?: string;
  lat?: number;
  lon?: number;
  userPreferences?: Record<string, unknown>;
}
