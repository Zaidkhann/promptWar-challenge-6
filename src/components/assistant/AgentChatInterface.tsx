"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Send,
  Plus,
  Trash2,
  Sparkles,
  User,
  Copy,
  Check,
  RotateCcw,
  Info,
  SlidersHorizontal,
  BotMessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MarkdownMessage } from "./MarkdownMessage";
import { apiUrl } from "@/lib/api-client";

export interface ToolCallUI {
  tool: string;
  args?: Record<string, unknown>;
  summary?: string;
}

export interface ChatMessageUI {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolCalls?: ToolCallUI[];
  timestamp: string;
}

export interface ConversationSummaryUI {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

interface AgentChatInterfaceProps {
  initialScenario?: string;
  userId?: string;
}

export function AgentChatInterface({
  initialScenario = "delhi-anand-vihar",
  userId = "default_user",
}: AgentChatInterfaceProps) {
  const [conversations, setConversations] = useState<ConversationSummaryUI[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageUI[]>([]);
  const [inputQuery, setInputQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeToolStatus, setActiveToolStatus] = useState<string | null>(null);
  const [activeTools, setActiveTools] = useState<ToolCallUI[]>([]);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const selectConversation = useCallback(async (convId: string) => {
    setCurrentConversationId(convId);
    setSidebarOpen(false);
    try {
      const res = await fetch(apiUrl(`/api/conversations/${convId}?userId=${encodeURIComponent(userId)}`));
      if (res.ok) {
        const data = await res.json();
        const conv = data.conversation;
        if (conv) {
          interface RawMsg {
            id: string;
            role: "user" | "assistant" | "system";
            content: string;
            timestamp: number | string;
            toolCalls?: Array<{ name: string; args?: unknown }>;
          }
          setMessages(
            conv.messages.map((m: RawMsg) => ({
              id: m.id,
              role: m.role,
              content: m.content,
              timestamp: new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              toolCalls: m.toolCalls?.map((tc: { name: string }) => ({
                tool: tc.name,
                summary: "Executed",
              })),
            }))
          );
        }
      }
    } catch (err) {
      console.warn("Failed to fetch conversation messages:", err);
    }
  }, [userId]);

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch(apiUrl(`/api/conversations?userId=${encodeURIComponent(userId)}`));
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
        if (data.conversations?.length > 0 && !currentConversationId) {
          selectConversation(data.conversations[0].id);
        }
      }
    } catch (err) {
      console.warn("Failed to load conversations:", err);
    }
  }, [userId, currentConversationId, selectConversation]);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Scroll to bottom on message updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeToolStatus]);

  const handleNewConversation = () => {
    setCurrentConversationId(null);
    setMessages([]);
    setActiveTools([]);
    setActiveToolStatus(null);
    setSidebarOpen(false);
    inputRef.current?.focus();
  };

  const handleDeleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(apiUrl(`/api/conversations/${convId}?userId=${encodeURIComponent(userId)}`), {
        method: "DELETE",
      });
      if (res.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== convId));
        if (currentConversationId === convId) {
          handleNewConversation();
        }
      }
    } catch (err) {
      console.warn("Failed to delete conversation:", err);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || isLoading) return;

    setInputQuery("");
    setIsLoading(true);
    setActiveTools([]);
    setActiveToolStatus("Understanding request and selecting tools...");

    const userMessageId = `user_${Date.now()}`;
    const userMsg: ChatMessageUI = {
      id: userMessageId,
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);

    const assistantMessageId = `asst_${Date.now()}`;
    let accumulatedText = "";
    const executedToolsList: ToolCallUI[] = [];

    try {
      const res = await fetch(apiUrl("/api/chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          conversationId: currentConversationId || undefined,
          userId,
          scenario: initialScenario,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData?.message || `HTTP ${res.status}`);
      }

      const convHeader = res.headers.get("X-SaansAI-Conversation-Id");
      if (convHeader && !currentConversationId) {
        setCurrentConversationId(convHeader);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("Response body is not readable.");
      }

      let done = false;
      let buffer = "";

      while (!done) {
        const { value, done: streamDone } = await reader.read();
        done = streamDone;

        if (value) {
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith("data: ")) {
              try {
                const event = JSON.parse(trimmed.slice(6));

                if (event.type === "status") {
                  setActiveToolStatus(event.message);
                } else if (event.type === "tool_start") {
                  setActiveToolStatus(`Calling ${event.tool}...`);
                  const toolItem: ToolCallUI = { tool: event.tool, args: event.args };
                  executedToolsList.push(toolItem);
                  setActiveTools([...executedToolsList]);
                } else if (event.type === "tool_end") {
                  const existing = executedToolsList.find((t) => t.tool === event.tool);
                  if (existing) existing.summary = event.resultSummary;
                  setActiveTools([...executedToolsList]);
                  setActiveToolStatus(null);
                } else if (event.type === "text_delta") {
                  accumulatedText += event.delta;
                  setMessages((prev) => {
                    const withoutCurrent = prev.filter((m) => m.id !== assistantMessageId);
                    return [
                      ...withoutCurrent,
                      {
                        id: assistantMessageId,
                        role: "assistant",
                        content: accumulatedText,
                        toolCalls: executedToolsList,
                        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                      },
                    ];
                  });
                } else if (event.type === "error") {
                  accumulatedText += `\n\n**Error:** ${event.error}`;
                  setMessages((prev) => {
                    const withoutCurrent = prev.filter((m) => m.id !== assistantMessageId);
                    return [
                      ...withoutCurrent,
                      {
                        id: assistantMessageId,
                        role: "assistant",
                        content: accumulatedText,
                        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                      },
                    ];
                  });
                } else if (event.type === "done") {
                  loadConversations();
                }
              } catch (e) {
                console.warn("Failed to parse SSE line:", trimmed, e);
              }
            }
          }
        }
      }
    } catch (err: unknown) {
      console.error("Chat error:", err);
      const errMsg = err instanceof Error ? err.message : "Could not complete the inquiry. Please check your connection.";
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMessageId,
          role: "assistant",
          content: `**Request Failed:** ${errMsg}`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
      setActiveToolStatus(null);
    }
  };

  const suggestedPrompts = [
    "Our family has school children and elderly grandparents in Delhi. What daily routine and commute schedule should we follow during this severe smog?",
    "What practical low-cost indoor hacks can protect our home without buying an expensive air purifier?",
    "Compare my commute exposure: driving an AC car vs taking the underground Metro from Anand Vihar to Connaught Place.",
    "What community actions can our resident society (RWA) take to prevent localized smoke and protect families?",
  ];

  return (
    <div className="flex h-[calc(100vh-14rem)] min-h-[580px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-2xs overflow-hidden">
      {/* Conversation Sidebar (Collapsible on mobile) */}
      <aside
        className={`w-64 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B1220] flex flex-col transition-all ${
          sidebarOpen ? "block absolute inset-y-0 left-0 z-30 shadow-xl" : "hidden md:flex"
        }`}
      >
        <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleNewConversation}
            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white text-xs flex items-center justify-center gap-1.5 shadow-2xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Conversation</span>
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1 text-xs">
          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Recent Inquiries
          </div>
          {conversations.length === 0 ? (
            <div className="p-3 text-center text-slate-400 dark:text-slate-500 italic text-[11px]">
              No previous conversations.
            </div>
          ) : (
            conversations.map((c) => (
              <div
                key={c.id}
                onClick={() => selectConversation(c.id)}
                className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                  currentConversationId === c.id
                    ? "bg-cyan-100/70 text-cyan-950 font-semibold dark:bg-cyan-950/60 dark:text-cyan-200"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-[#1E293B] dark:hover:text-slate-200"
                }`}
              >
                <div className="truncate text-xs pr-2">{c.title}</div>
                <button
                  type="button"
                  aria-label="Delete conversation"
                  onClick={(e) => handleDeleteConversation(c.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-600 text-slate-400 dark:text-slate-500 dark:hover:text-red-400 transition-opacity"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Main Chat Stage */}
      <div className="flex flex-1 flex-col overflow-hidden bg-white dark:bg-[#111827]">
        {/* Chat Header */}
        <div className="h-13 border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between bg-white/80 dark:bg-[#111827]/80 backdrop-blur-xs">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden text-xs p-1 h-8"
              aria-label="Toggle conversations list"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <BotMessageSquare className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
              <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate max-w-[220px] sm:max-w-md">
                SaansAI Agentic Assistant
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <Badge variant="outline" className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              Model: Gemini 2.5 Flash
            </Badge>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleNewConversation}
              className="text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 h-7"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset
            </Button>
          </div>
        </div>

        {/* Message Stream Viewport */}
        <div
          role="log"
          aria-live="polite"
          aria-label="Conversation messages"
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4"
        >
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center p-6 space-y-4 max-w-lg mx-auto">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-400 shadow-2xs">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  Tool-Augmented Clean Air Intelligence
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md">
                  Ask questions about current CPCB air telemetry, morning inversion trapping, outdoor activity safety, or personalized routine adjustments.
                </p>
              </div>

              {/* Suggested Prompts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full pt-2">
                {suggestedPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(prompt)}
                    className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-[#1E293B]/60 hover:bg-slate-100 dark:hover:bg-[#1E293B] hover:border-slate-300 dark:hover:border-slate-700 text-left text-xs text-slate-700 dark:text-slate-300 transition-all font-medium shadow-2xs"
                  >
                    &quot;{prompt}&quot;
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 text-xs leading-relaxed ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="flex h-7 w-7 shrink-0 select-none items-center justify-center rounded-lg bg-cyan-600 text-white font-bold shadow-2xs mt-0.5">
                    S
                  </div>
                )}

                <div
                  className={`relative rounded-xl p-3.5 max-w-[85%] sm:max-w-[75%] space-y-2 ${
                    msg.role === "user"
                      ? "bg-slate-900 dark:bg-cyan-950/70 text-white border border-transparent dark:border-cyan-800/60"
                      : "bg-slate-50/90 dark:bg-[#1E293B]/80 text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-slate-800"
                  }`}
                >
                  {/* Tool Execution History Pills */}
                  {msg.toolCalls && msg.toolCalls.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pb-1 border-b border-slate-200/60 dark:border-slate-700/60 text-[10px]">
                      <span className="text-slate-400 dark:text-slate-500 font-semibold">Grounded in:</span>
                      {msg.toolCalls.map((tc, idx) => (
                        <span
                          key={idx}
                          className="bg-cyan-50 dark:bg-cyan-950/60 text-cyan-900 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 px-1.5 py-0.5 rounded font-mono"
                        >
                          ✔ {tc.tool}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Message Content */}
                  {msg.role === "user" ? (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <MarkdownMessage content={msg.content} />
                  )}

                  {/* Message Footer: Timestamp and Copy Button */}
                  <div className="flex items-center justify-between gap-2 pt-1 text-[10px] opacity-70">
                    <span>{msg.timestamp}</span>
                    {msg.role === "assistant" && (
                      <button
                        type="button"
                        aria-label="Copy message"
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="hover:text-slate-900 dark:hover:text-slate-100 text-slate-500 dark:text-slate-400 transition-colors p-0.5 rounded"
                      >
                        {copiedMessageId === msg.id ? (
                          <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {msg.role === "user" && (
                  <div className="flex h-7 w-7 shrink-0 select-none items-center justify-center rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-2xs mt-0.5">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))
          )}

          {/* Active Tool Execution Pill during generation */}
          {isLoading && (
            <div
              role="status"
              aria-live="polite"
              className="flex items-center gap-2 p-3 rounded-lg border border-cyan-200 dark:border-cyan-900 bg-cyan-50/70 dark:bg-cyan-950/40 text-xs text-cyan-950 dark:text-cyan-300 animate-pulse"
            >
              <Sparkles className="h-4 w-4 text-cyan-700 dark:text-cyan-400 animate-spin" aria-hidden="true" />
              <span className="font-semibold">{activeToolStatus || "Synthesizing grounded response..."}</span>
              {activeTools.length > 0 && (
                <div className="flex items-center gap-1 ml-auto text-[10px]">
                  {activeTools.map((t, idx) => (
                    <span key={idx} className="bg-white dark:bg-[#111827] px-1.5 py-0.5 rounded border border-cyan-200 dark:border-cyan-800 font-mono">
                      {t.tool}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Bar */}
        <div className="border-t border-slate-200 dark:border-slate-800 p-3 sm:p-4 bg-white dark:bg-[#111827]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-end gap-2"
          >
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                aria-label="Ask SaansAI a question about air quality, winter smog routines, or indoor hacks"
                placeholder="Ask SaansAI about AQI, exercise windows, or daily routines... (Enter to send)"
                rows={1}
                disabled={isLoading}
                className="w-full resize-none rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B1220] px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:border-cyan-600 focus:bg-white dark:focus:border-cyan-500 dark:focus:bg-[#0B1220] focus:outline-none focus:ring-1 focus:ring-cyan-600 transition-all max-h-32 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading || !inputQuery.trim()}
              size="sm"
              aria-label="Send message to SaansAI"
              className="bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl h-9.5 px-4 flex items-center justify-center shrink-0"
            >
              <Send className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </form>

          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 text-center flex items-center justify-center gap-1">
            <Info className="h-3 w-3 shrink-0" />
            <span>
              SaansAI uses verified CPCB & Open-Meteo telemetry. Not a substitute for professional clinical medical advice.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
