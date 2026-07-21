import {
  disconnectIntegration,
  fetchMe,
  getUser,
  request,
  startNotionOAuth,
  startNotionMcpOAuth,
} from "@/lib/auth";
import {
  connectClickUp,
  connectJira,
  listIntegrations as listBackendIntegrations,
} from "@/lib/integrations";
import {
  formatNestErrorBody,
  mergeAskIntoThread,
  type BackendAssistantAskResponse,
} from "./assistant-ask";
import {
  getStoredThread,
  listStoredThreads,
} from "./assistant-thread-store";
import type {
  AskInput,
  ClientRequestOptions,
  Integration,
  IntegrationStatus,
  Source,
  WorkOsClient,
} from "./types";
import { WorkOsClientError } from "./types";

function unavailable(area: string): never {
  throw new WorkOsClientError(
    "backend-unavailable",
    `${area} is not available from the backend yet. Switch to mock mode for the frontend demo.`,
  );
}

function providerToSource(provider: string): Source {
  const normalized = provider.toLowerCase();
  if (normalized.includes("notion")) return "notion";
  if (normalized.includes("clickup")) return "clickup";
  if (normalized.includes("calendar")) return "calendar";
  if (normalized.includes("gmail")) return "gmail";
  if (normalized.includes("slack")) return "slack";
  return "jira";
}

export function normalizeIntegrationStatus(status: string): IntegrationStatus {
  switch (status.toUpperCase()) {
    case "ACTIVE":
      return "connected";
    case "PENDING":
      return "connecting";
    case "REAUTH_REQUIRED":
      return "reauth-required";
    case "DEGRADED":
      return "permission-required";
    case "REVOKED":
      return "disconnected";
    default:
      return "error";
  }
}

function mapAskHttpError(error: unknown): never {
  if (error instanceof WorkOsClientError) throw error;
  const message =
    error instanceof Error ? error.message : "The assistant could not answer.";

  if (/Unable to reach the server/i.test(message)) {
    throw new WorkOsClientError("backend-unavailable", message, true);
  }
  // Model / Bedrock failures (502 MODEL_AUTH_FAILED | MODEL_UPSTREAM_ERROR |
  // MODEL_RESPONSE_PARSE_ERROR, 503 MODEL_NOT_AVAILABLE, 504 MODEL_TIMEOUT) are
  // server/provider problems, never an app logout. Surface a friendly, retryable
  // message rather than the raw code.
  if (/BEDROCK|model provider|MODEL_[A-Z_]+/i.test(message)) {
    throw new WorkOsClientError(
      "backend-unavailable",
      "The assistant is temporarily unavailable. Please try again in a moment.",
      true,
    );
  }
  if (
    /Access token has expired|Invalid access token|Authentication token is missing|Unauthorized\./i.test(
      message,
    )
  ) {
    throw new WorkOsClientError("reauth-required", message);
  }
  throw new WorkOsClientError("unexpected", message, true);
}

export const httpWorkOsClient: WorkOsClient = {
  async getCurrentUser() {
    const cached = getUser();
    const user = cached ?? (await fetchMe());
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      organization: "AI Work OS",
    };
  },
  async getDashboard() {
    return unavailable("Today’s brief");
  },
  async listIntegrations() {
    const rows = await listBackendIntegrations();
    return rows.map<Integration>((row) => {
      const source = providerToSource(row.provider);
      const isMcp = row.provider.toUpperCase().includes("MCP") || row.provider.toUpperCase().includes("NOTION_MCP");

      return {
        id: row.id,
        provider: source,
        name:
          source === "notion" && isMcp
            ? "Notion AI Assistant"
            : source === "notion"
              ? "Notion"
              : source === "clickup"
                ? "ClickUp"
                : "Jira",
        status: normalizeIntegrationStatus(String(row.status)),
        accountName: row.accountName ?? undefined,
        workspaceName: row.workspaceName ?? undefined,
        grantedCapabilities: row.grantedScopes,
        lastSuccessfulActivity: row.lastSuccessfulSyncAt ?? undefined,
        supportsMultipleSites: source === "jira",
        isMcp: source === "notion" ? isMcp : undefined,
      };
    });
  },
  async connectIntegration(provider) {
    if (provider === "jira") return connectJira();
    if (provider === "clickup") return connectClickUp();
    if (provider === "notion-mcp") return startNotionMcpOAuth();
    startNotionOAuth();
  },
  async disconnectIntegration(id) {
    await disconnectIntegration(id);
  },
  async listWorkItems() {
    return unavailable("Unified work");
  },
  async getWorkItem() {
    return unavailable("Work-item details");
  },
  async listThreads() {
    // Backend does not persist conversation history yet — use local store filled by ask.
    return listStoredThreads();
  },
  async getThread(id) {
    const thread = getStoredThread(id);
    if (!thread) {
      throw new WorkOsClientError("unexpected", "Conversation not found.");
    }
    return thread;
  },
  async askAssistant(input: AskInput, options?: ClientRequestOptions) {
    // The assistant endpoints require message length 1–4000. Validate up front
    // so an over-long prompt fails fast instead of round-tripping to a 400.
    const trimmedPrompt = input.prompt.trim();
    if (trimmedPrompt.length === 0) {
      throw new WorkOsClientError("unexpected", "Enter a question to ask the assistant.");
    }
    if (trimmedPrompt.length > 4000) {
      throw new WorkOsClientError(
        "unexpected",
        "Message is too long (max 4000 characters). Please shorten it and try again.",
      );
    }
    try {
      // Endpoint routing:
      //  - No source filter ("All sources" tab) → unified /assistant/brain,
      //    which chains tools across Jira, Notion, and ClickUp in one request.
      //  - A single Notion/Jira source → focused /assistant/chat.
      //  - Anything else → /assistant/ask.
      const isSingleSource = input.sources?.length === 1;
      const selectedSource = input.sources?.[0];
      const usesBrainEndpoint = !input.sources || input.sources.length === 0;
      const usesChatEndpoint = isSingleSource && (selectedSource === "notion" || selectedSource === "jira");
      const endpoint = usesBrainEndpoint
        ? "/assistant/brain"
        : usesChatEndpoint
          ? "/assistant/chat"
          : "/assistant/ask";

      const backend = await request<BackendAssistantAskResponse>(
        endpoint,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: input.prompt }),
          signal: options?.signal,
        },
        { authenticated: true },
      );

      // Handle the different response format from /assistant/chat
      if (usesChatEndpoint) {
        // /assistant/chat returns { message: "response" }
        const chatResponse = backend as unknown as { message: string };
        if (!chatResponse || typeof chatResponse.message !== "string") {
          throw new WorkOsClientError(
            "unexpected",
            "The assistant returned an unexpected response shape.",
          );
        }
        
        // Convert to the expected format
        return mergeAskIntoThread(input, {
          answer: chatResponse.message,
          toolCalls: [],
        });
      }

      // Handle the standard /assistant/brain and /assistant/ask response shape.
      if (!backend || typeof backend.answer !== "string") {
        throw new WorkOsClientError(
          "unexpected",
          "The assistant returned an unexpected response shape.",
        );
      }

      return mergeAskIntoThread(input, {
        ...backend,
        toolCalls: Array.isArray(backend.toolCalls) ? backend.toolCalls : [],
      });
    } catch (error) {
      if (options?.signal?.aborted) throw error;
      // request() already throws Error with a message; normalize Nest-ish bodies if present
      if (error instanceof Error && error.message.startsWith("{")) {
        try {
          const parsed = JSON.parse(error.message) as unknown;
          throw new WorkOsClientError(
            "unexpected",
            formatNestErrorBody(parsed, 500),
            true,
          );
        } catch (inner) {
          if (inner instanceof WorkOsClientError) throw inner;
        }
      }
      mapAskHttpError(error);
    }
  },
  async listApprovals() {
    return unavailable("Approval proposals");
  },
  async approveAction() {
    return unavailable("Approval execution");
  },
  async rejectAction() {
    return unavailable("Approval execution");
  },
  async getSettings() {
    return unavailable("Saved preferences");
  },
  async updateSettings() {
    return unavailable("Saved preferences");
  },
};
