export type Source = "jira" | "notion" | "calendar" | "gmail" | "slack";

export type IntegrationStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "no-sites"
  | "permission-required"
  | "reauth-required"
  | "error";

export type MockScenario =
  | "first-time"
  | "returning"
  | "partial"
  | "permission-required"
  | "reauth-required"
  | "recoverable-error"
  | "unexpected-error";

export type ClientErrorCode =
  | "permission-required"
  | "reauth-required"
  | "recoverable"
  | "backend-unavailable"
  | "unexpected";

export class WorkOsClientError extends Error {
  constructor(
    public readonly code: ClientErrorCode,
    message: string,
    public readonly retryable = false,
  ) {
    super(message);
    this.name = "WorkOsClientError";
  }
}

export interface ClientRequestOptions {
  signal?: AbortSignal;
}

export interface WorkUser {
  id: string;
  name: string;
  email: string;
  organization: string;
  avatarUrl?: string;
}

export interface Person {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface WorkItem {
  id: string;
  source: Source;
  sourceId: string;
  title: string;
  description?: string;
  type: "task" | "issue" | "meeting" | "document" | "follow-up";
  status: string;
  priority?: "low" | "medium" | "high" | "urgent";
  assignee?: Person;
  project?: string;
  dueAt?: string;
  updatedAt: string;
  sourceUrl?: string;
  relatedIds?: string[];
}

export interface Evidence {
  id: string;
  source: Source;
  title: string;
  excerpt: string;
  sourceUrl?: string;
  workItemId?: string;
  observedAt: string;
}

export interface SourceWarning {
  source: Source;
  title: string;
  message: string;
  code: "stale" | "permission" | "unavailable";
}

export interface Integration {
  id: string;
  provider: Source;
  name: string;
  status: IntegrationStatus;
  accountName?: string;
  workspaceName?: string;
  grantedCapabilities: string[];
  lastSuccessfulActivity?: string;
  warning?: string;
  supportsMultipleSites?: boolean;
}

export interface ActivityItem {
  id: string;
  description: string;
  source: Source;
  occurredAt: string;
  workItemId?: string;
}

export interface DashboardData {
  generatedAt: string;
  freshnessLabel: string;
  priorities: WorkItem[];
  blockers: WorkItem[];
  followUps: WorkItem[];
  upcoming: WorkItem[];
  recentActivity: ActivityItem[];
  pendingApprovalCount: number;
  connectedSourceCount: number;
  warnings: SourceWarning[];
}

export interface WorkFilters {
  type?: WorkItem["type"] | "all";
  source?: Source | "all";
  status?: string;
  priority?: WorkItem["priority"] | "all";
  assignee?: string;
  project?: string;
  due?: "all" | "today" | "overdue" | "upcoming";
}

export interface AssistantToolCallTrace {
  name: string;
  arguments: Record<string, unknown>;
  ok: boolean;
}

export interface AssistantMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  evidence?: Evidence[];
  proposalIds?: string[];
  /** Tools the backend executed while answering (live mode). */
  toolCalls?: AssistantToolCallTrace[];
  model?: string;
  provider?: string;
}

export interface AssistantThread {
  id: string;
  title: string;
  messages: AssistantMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface AskInput {
  prompt: string;
  threadId?: string;
  sources?: Source[];
}

export interface AssistantAnswer {
  thread: AssistantThread;
  message: AssistantMessage;
  persisted: boolean;
}

export interface ExecutionResult {
  status: "idle" | "running" | "succeeded" | "failed";
  message?: string;
  completedAt?: string;
}

export interface ActionProposal {
  id: string;
  source: Source;
  targetId: string;
  workItemId?: string;
  title: string;
  explanation: string;
  evidence: Evidence[];
  changes: Record<string, { from: unknown; to: unknown }>;
  status: "pending" | "approved" | "rejected" | "executed";
  createdAt: string;
  execution: ExecutionResult;
}

export interface UserSettings {
  organization: string;
  timeZone: string;
  dailyBriefTime: string;
  emailNotifications: boolean;
  approvalNotifications: boolean;
  appearance: "light" | "dark" | "system";
  allowLocalHistory: boolean;
}

export interface WorkOsClient {
  getCurrentUser(options?: ClientRequestOptions): Promise<WorkUser>;
  getDashboard(options?: ClientRequestOptions): Promise<DashboardData>;
  listIntegrations(options?: ClientRequestOptions): Promise<Integration[]>;
  connectIntegration(
    provider: "jira" | "notion",
    options?: ClientRequestOptions,
  ): Promise<void>;
  disconnectIntegration(id: string, options?: ClientRequestOptions): Promise<void>;
  listWorkItems(
    filters?: WorkFilters,
    options?: ClientRequestOptions,
  ): Promise<WorkItem[]>;
  getWorkItem(id: string, options?: ClientRequestOptions): Promise<WorkItem>;
  listThreads(options?: ClientRequestOptions): Promise<AssistantThread[]>;
  getThread(id: string, options?: ClientRequestOptions): Promise<AssistantThread>;
  askAssistant(
    input: AskInput,
    options?: ClientRequestOptions,
  ): Promise<AssistantAnswer>;
  listApprovals(options?: ClientRequestOptions): Promise<ActionProposal[]>;
  approveAction(id: string, options?: ClientRequestOptions): Promise<ActionProposal>;
  rejectAction(id: string, options?: ClientRequestOptions): Promise<ActionProposal>;
  getSettings(options?: ClientRequestOptions): Promise<UserSettings>;
  updateSettings(
    patch: Partial<UserSettings>,
    options?: ClientRequestOptions,
  ): Promise<UserSettings>;
}
