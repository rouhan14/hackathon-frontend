import { disconnectIntegration, fetchMe, getUser, startNotionOAuth } from "@/lib/auth";
import {
  connectJira,
  listIntegrations as listBackendIntegrations,
} from "@/lib/integrations";
import type {
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
    return rows.map<Integration>((row) => ({
      id: row.id,
      provider: providerToSource(row.provider),
      name: providerToSource(row.provider) === "notion" ? "Notion" : "Jira",
      status: normalizeIntegrationStatus(String(row.status)),
      accountName: row.accountName ?? undefined,
      workspaceName: row.workspaceName ?? undefined,
      grantedCapabilities: row.grantedScopes,
      lastSuccessfulActivity: row.lastSuccessfulSyncAt ?? undefined,
      supportsMultipleSites: providerToSource(row.provider) === "jira",
    }));
  },
  async connectIntegration(provider) {
    if (provider === "jira") return connectJira();
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
    return unavailable("Conversation history");
  },
  async getThread() {
    return unavailable("Conversation history");
  },
  async askAssistant() {
    return unavailable("The workplace assistant");
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
