/**
 * Frontend helpers for third-party integrations (Jira via backend OAuth).
 *
 * Security: never call Atlassian MCP URLs from the browser, and never store
 * Atlassian access tokens, authorization codes, or PKCE verifiers here.
 * Backend must redirect back to the dashboard after OAuth
 * (JIRA_POST_AUTH_REDIRECT, CORS_ORIGIN pointing at this app).
 */

import {
  authFetch,
  clearToken,
  disconnectIntegration,
  fetchMe,
  request,
  setAuthNotice,
} from "@/lib/auth";

export type IntegrationProvider =
  | "JIRA"
  | "NOTION"
  | "CLICKUP"
  | "GOOGLE_CALENDAR"
  | "GMAIL";

export type IntegrationStatus =
  | "PENDING"
  | "ACTIVE"
  | "DEGRADED"
  | "REAUTH_REQUIRED"
  | "REVOKED";

export interface IntegrationConnection {
  id: string;
  provider: IntegrationProvider | string;
  accountId: string;
  accountName: string | null;
  workspaceId: string | null;
  workspaceName: string | null;
  status: IntegrationStatus | string;
  grantedScopes: string[];
  lastSuccessfulSyncAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** MCP-style search envelope from POST /integrations/jira/:id/search. */
export interface JiraSearchResponse {
  connectionId: string;
  cloudId: string;
  result: {
    content?: Array<{ type?: string; text?: string; [key: string]: unknown }>;
    [key: string]: unknown;
  };
}

export interface ClickUpTask {
  id: string;
  name: string;
  status?: string;
  assignees: string[];
  priority?: string;
  dueDate?: string;
  updatedAt?: string;
  url?: string;
  listName?: string;
  workspaceName?: string;
}

export interface ClickUpSearchResponse {
  connectionId: string;
  query: string;
  taskCount: number;
  tasks: ClickUpTask[];
  empty: boolean;
  note?: string;
}

export type ClickUpErrorCode =
  | "CLICKUP_REAUTH_REQUIRED"
  | "CLICKUP_RATE_LIMITED";

export class ClickUpIntegrationError extends Error {
  constructor(
    public readonly code: ClickUpErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ClickUpIntegrationError";
  }
}

/** Thrown when Jira credentials need re-authorization (search 401). */
export class JiraReauthRequiredError extends Error {
  constructor(message = "Jira must be connected again") {
    super(message);
    this.name = "JiraReauthRequiredError";
  }
}

export function isJiraProvider(provider: string): boolean {
  return provider.toUpperCase() === "JIRA";
}

export function filterJiraConnections(
  connections: IntegrationConnection[]
): IntegrationConnection[] {
  return connections.filter((c) => isJiraProvider(c.provider));
}

/** Display label for a Jira site connection. */
export function jiraConnectionLabel(connection: IntegrationConnection): string {
  return (
    connection.workspaceName?.trim() ||
    connection.accountName?.trim() ||
    connection.workspaceId ||
    connection.accountId ||
    connection.id
  );
}

/**
 * Text blocks from an MCP result envelope for display only.
 * Payload shape is not a permanent domain model.
 */
export function extractJiraSearchTexts(response: JiraSearchResponse): string[] {
  const content = response.result?.content;
  if (!Array.isArray(content)) return [];
  return content
    .map((block) => (typeof block?.text === "string" ? block.text : null))
    .filter((t): t is string => t !== null && t.length > 0);
}

export async function listIntegrations(): Promise<IntegrationConnection[]> {
  const data = await request<
    IntegrationConnection[] | { connections?: IntegrationConnection[] }
  >("/integrations", { method: "GET" }, { authenticated: true });

  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.connections)) return data.connections;
  return [];
}

/**
 * Starts Jira OAuth: GET /auth/jira with the app JWT, then navigates only to
 * the returned authorizationUrl (never to the MCP endpoint).
 */
export async function connectJira(): Promise<void> {
  if (typeof window === "undefined") return;

  let res: Response;
  try {
    res = await authFetch("/auth/jira", { method: "GET" });
  } catch {
    throw new Error("Unable to reach the server. Please try again.");
  }

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // Non-JSON body.
  }

  if (!res.ok) {
    const message =
      (data as { message?: string; error?: string } | null)?.message ??
      (data as { error?: string } | null)?.error ??
      "Could not start Jira authorization";

    // Invalid app session — same behavior as other authenticated calls.
    if (res.status === 401) {
      setAuthNotice(message);
      clearToken();
    }

    throw new Error(message);
  }

  const authorizationUrl = (data as { authorizationUrl?: string } | null)
    ?.authorizationUrl;
  if (typeof authorizationUrl !== "string" || !authorizationUrl) {
    throw new Error("Could not start Jira authorization");
  }

  window.location.assign(authorizationUrl);
}

/** Starts hosted ClickUp MCP OAuth without exposing app or provider tokens. */
export async function connectClickUp(): Promise<void> {
  if (typeof window === "undefined") return;

  const data = await request<{ authorizationUrl?: string }>(
    "/auth/clickup",
    { method: "GET" },
    { authenticated: true },
  );
  if (typeof data.authorizationUrl !== "string" || !data.authorizationUrl) {
    throw new Error("Could not start ClickUp authorization");
  }
  window.location.assign(data.authorizationUrl);
}

async function clickUpRequest<T>(path: string, init: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await authFetch(path, init);
  } catch {
    throw new Error("Unable to reach the server. Please try again.");
  }

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    // The fallback below handles non-JSON errors.
  }

  if (!response.ok) {
    const body = data as
      | { code?: string; message?: string | { code?: string; message?: string }; error?: string }
      | null;
    const nested = body?.message && typeof body.message === "object" ? body.message : null;
    const code = body?.code ?? nested?.code;
    const message =
      (typeof body?.message === "string" ? body.message : nested?.message) ??
      body?.error ??
      `ClickUp request failed (${response.status}).`;

    if (code === "CLICKUP_REAUTH_REQUIRED" || code === "CLICKUP_RATE_LIMITED") {
      throw new ClickUpIntegrationError(code, message);
    }
    if (response.status === 401) {
      setAuthNotice(message);
      clearToken();
    }
    throw new Error(message);
  }

  return data as T;
}

export function searchClickUp(
  connectionId: string,
  query: string,
  limit = 10,
): Promise<ClickUpSearchResponse> {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) throw new Error("Enter a ClickUp task search.");
  const normalizedLimit = Math.min(25, Math.max(1, Math.floor(limit) || 10));
  return clickUpRequest<ClickUpSearchResponse>(
    `/integrations/clickup/${encodeURIComponent(connectionId)}/search`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: normalizedQuery, limit: normalizedLimit }),
    },
  );
}

export async function getClickUpTask(
  connectionId: string,
  taskId: string,
): Promise<ClickUpTask> {
  const data = await clickUpRequest<{ connectionId: string; task: ClickUpTask }>(
    `/integrations/clickup/${encodeURIComponent(connectionId)}/tasks/${encodeURIComponent(taskId)}`,
    { method: "GET" },
  );
  return data.task;
}

/**
 * Search issues with JQL for an owned connection.
 *
 * 401 handling is split by backend error code:
 * - `code: "JIRA_REAUTH_REQUIRED"` → reconnect Jira (app session stays)
 * - any other 401 → app JWT expired/invalid → clear session and return to login
 */
export async function searchJira(
  connectionId: string,
  jql: string,
  maxResults = 25
): Promise<JiraSearchResponse> {
  const clamped = Math.min(100, Math.max(1, Math.floor(maxResults) || 25));

  let res: Response;
  try {
    res = await authFetch(`/integrations/jira/${connectionId}/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jql, maxResults: clamped }),
    });
  } catch {
    throw new Error("Unable to reach the server. Please try again.");
  }

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // Non-JSON body.
  }

  if (res.status === 401) {
    const code = (data as { code?: string } | null)?.code;
    if (code === "JIRA_REAUTH_REQUIRED") {
      throw new JiraReauthRequiredError(
        (data as { message?: string } | null)?.message ??
          "Jira must be connected again"
      );
    }

    const message =
      (data as { message?: string; error?: string } | null)?.message ??
      (data as { error?: string } | null)?.error ??
      "The application session has expired";
    setAuthNotice(message);
    clearToken();
    throw new Error(message);
  }

  if (!res.ok) {
    const message =
      (data as { message?: string; error?: string } | null)?.message ??
      (data as { error?: string } | null)?.error ??
      "Jira search failed";
    throw new Error(message);
  }

  return data as JiraSearchResponse;
}

/**
 * Disconnect an integration and refresh both the integrations list source
 * and the cached user (for cards that still read /auth/me).
 */
export async function disconnectAndRefresh(connectionId: string) {
  const result = await disconnectIntegration(connectionId);
  return result;
}

/** Refresh user cache after OAuth callback success. */
export async function refreshAfterJiraConnect(): Promise<{
  connections: IntegrationConnection[];
}> {
  const [connections] = await Promise.all([
    listIntegrations().catch(() => [] as IntegrationConnection[]),
    fetchMe().catch(() => null),
  ]);
  return { connections };
}

export const refreshAfterClickUpConnect = refreshAfterJiraConnect;

export { disconnectIntegration };
