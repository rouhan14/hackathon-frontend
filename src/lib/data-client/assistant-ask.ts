import type {
  AskInput,
  AssistantAnswer,
  AssistantMessage,
  AssistantThread,
  AssistantToolCallTrace,
} from "./types";
import {
  getStoredThread,
  newThreadId,
  titleFromPrompt,
  upsertStoredThread,
} from "./assistant-thread-store";

/**
 * Shape returned by POST /assistant/brain (unified multi-app tool loop).
 * provider/model/rounds are optional for defensive parsing of partial payloads.
 */
export interface BackendAssistantAskResponse {
  kind?: "answer" | "no_connections" | "no_tools";
  answer: string;
  provider?: string;
  model?: string;
  toolCalls: AssistantToolCallTrace[];
  rounds?: number;
  availableConnections?: Array<{
    id: string;
    provider: string;
    workspaceName?: string | null;
    accountName?: string | null;
    status?: string;
  }>;
  promptTokens?: number;
  outputTokens?: number;
  runId?: string;
}

/**
 * Merge a user prompt + backend answer into a local thread (client-side history).
 * Pure mapping — used by the HTTP client and unit-tested without network I/O.
 */
export function mergeAskIntoThread(
  input: AskInput,
  backend: BackendAssistantAskResponse,
  now = new Date().toISOString(),
): AssistantAnswer {
  const existing =
    input.threadId && input.threadId !== "pending"
      ? getStoredThread(input.threadId)
      : null;

  const thread: AssistantThread = existing
    ? {
        ...existing,
        messages: [...existing.messages],
        updatedAt: now,
      }
    : {
        id: newThreadId(),
        title: titleFromPrompt(input.prompt),
        messages: [],
        createdAt: now,
        updatedAt: now,
      };

  const userMessage: AssistantMessage = {
    id: `msg-user-${thread.messages.length + 1}-${now}`,
    role: "user",
    content: input.prompt,
    createdAt: now,
  };

  const assistantMessage: AssistantMessage = {
    id: `msg-assistant-${thread.messages.length + 2}-${now}`,
    role: "assistant",
    content: backend.answer,
    createdAt: now,
    toolCalls: backend.toolCalls ?? [],
    model: backend.model,
    provider: backend.provider,
    availableConnections: backend.availableConnections,
    runId: backend.runId,
  };

  thread.messages.push(userMessage, assistantMessage);
  upsertStoredThread(thread);

  return {
    thread,
    message: assistantMessage,
    persisted: true,
  };
}

export function formatNestErrorBody(data: unknown, status: number): string {
  if (!data || typeof data !== "object") {
    return `Request failed (${status}).`;
  }
  const body = data as {
    message?: string | string[] | { message?: string };
    error?: string;
    code?: string;
  };

  let message: string | undefined;
  if (typeof body.message === "string") {
    message = body.message;
  } else if (Array.isArray(body.message)) {
    message = body.message.join(" ");
  } else if (body.message && typeof body.message === "object") {
    message =
      typeof body.message.message === "string"
        ? body.message.message
        : undefined;
  }

  if (!message && typeof body.error === "string") {
    message = body.error;
  }

  if (!message) {
    message = `Request failed (${status}).`;
  }

  if (body.code && !message.includes(body.code)) {
    return `${message} (${body.code})`;
  }
  return message;
}
