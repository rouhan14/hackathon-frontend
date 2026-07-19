import { getUser } from "@/lib/auth";
import {
  baseActivities,
  baseApprovals,
  baseThreads,
  defaultSettings,
  jiraEvidence,
  MOCK_NOW,
  returningIntegrations,
  workItems,
} from "@/lib/mocks/fixtures";
import type {
  ActionProposal,
  AskInput,
  AssistantAnswer,
  AssistantMessage,
  AssistantThread,
  ClientRequestOptions,
  DashboardData,
  Integration,
  MockScenario,
  Source,
  UserSettings,
  WorkFilters,
  WorkItem,
  WorkOsClient,
} from "./types";
import { WorkOsClientError } from "./types";

const STORAGE_KEY = "ai-work-os-mock-state-v1";
const EVENT_NAME = "ai-work-os-mock-change";
const privateThreads = new Map<string, AssistantThread>();
let nextPrivateThreadNumber = 1;

interface MockState {
  scenario: MockScenario;
  integrations: Integration[];
  approvals: ActionProposal[];
  threads: AssistantThread[];
  settings: UserSettings;
  nextThreadNumber: number;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function initialState(scenario: MockScenario = "first-time"): MockState {
  const isFirstTime = scenario === "first-time";
  return {
    scenario,
    integrations: isFirstTime ? [] : clone(returningIntegrations),
    approvals: isFirstTime ? [] : clone(baseApprovals),
    threads: isFirstTime ? [] : clone(baseThreads),
    settings: clone(defaultSettings),
    nextThreadNumber: 1,
  };
}

function loadState(): MockState {
  if (typeof window === "undefined") return initialState();
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) return initialState();
  try {
    const state = {
      ...initialState(),
      ...(JSON.parse(stored) as Partial<MockState>),
    };
    if (state.scenario === "first-time") {
      state.integrations = [];
      state.approvals = [];
      state.threads = [];
    }
    return state;
  } catch {
    return initialState();
  }
}

function saveState(state: MockState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new Event(EVENT_NAME));
}

function updateState(update: (state: MockState) => void): MockState {
  const state = loadState();
  update(state);
  saveState(state);
  return state;
}

function delay(options?: ClientRequestOptions, duration = 420): Promise<void> {
  return new Promise((resolve, reject) => {
    if (options?.signal?.aborted) {
      reject(new DOMException("The request was stopped.", "AbortError"));
      return;
    }
    const timer = window.setTimeout(resolve, duration);
    options?.signal?.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timer);
        reject(new DOMException("The request was stopped.", "AbortError"));
      },
      { once: true },
    );
  });
}

function throwForScenario(scenario: MockScenario, area: string): void {
  if (scenario === "permission-required") {
    throw new WorkOsClientError(
      "permission-required",
      `Permission is required before ${area} can be loaded.`,
    );
  }
  if (scenario === "reauth-required") {
    throw new WorkOsClientError(
      "reauth-required",
      `Reconnect Jira to refresh ${area}.`,
    );
  }
  if (scenario === "recoverable-error") {
    throw new WorkOsClientError(
      "recoverable",
      `We could not load ${area}. Check your connection and try again.`,
      true,
    );
  }
  if (scenario === "unexpected-error") {
    throw new WorkOsClientError(
      "unexpected",
      `Something unexpected happened while loading ${area}.`,
      true,
    );
  }
}

function connectedSources(state: MockState) {
  return new Set(
    state.integrations
      .filter((integration) => integration.status === "connected")
      .map((integration) => integration.provider),
  );
}

function visibleWork(state: MockState): WorkItem[] {
  if (state.integrations.length === 0) return [];
  const sources = connectedSources(state);
  const permitted = workItems.filter(
    (item) =>
      sources.has(item.source) || item.source === "calendar" || item.source === "gmail",
  );
  return state.scenario === "partial"
    ? permitted.filter((item) => item.source !== "notion")
    : permitted;
}

function matchesFilters(item: WorkItem, filters?: WorkFilters): boolean {
  if (!filters) return true;
  if (filters.type && filters.type !== "all" && item.type !== filters.type) return false;
  if (filters.source && filters.source !== "all" && item.source !== filters.source)
    return false;
  if (filters.status && item.status.toLowerCase() !== filters.status.toLowerCase())
    return false;
  if (
    filters.priority &&
    filters.priority !== "all" &&
    item.priority !== filters.priority
  )
    return false;
  if (filters.assignee && item.assignee?.name !== filters.assignee) return false;
  if (filters.project && item.project !== filters.project) return false;
  if (filters.due === "overdue" && (!item.dueAt || item.dueAt >= MOCK_NOW)) return false;
  if (
    filters.due === "today" &&
    (!item.dueAt || item.dueAt.slice(0, 10) !== MOCK_NOW.slice(0, 10))
  )
    return false;
  if (filters.due === "upcoming" && (!item.dueAt || item.dueAt <= MOCK_NOW)) return false;
  return true;
}

function answerForPrompt(prompt: string, allowedSources: ReadonlySet<Source>): {
  content: string;
  evidence: AssistantMessage["evidence"];
  proposalIds?: string[];
} {
  const normalized = prompt.toLowerCase();
  let answer: {
    content: string;
    evidence: AssistantMessage["evidence"];
    proposalIds?: string[];
  };
  if (normalized.includes("block")) {
    answer = {
      content:
        "One urgent issue is blocked: Product workspace access is preventing the delivery team from reviewing the launch checklist. I inferred its urgency from the overdue date and urgent priority.",
      evidence: [jiraEvidence],
      proposalIds: ["proposal-jira-21"],
    };
  } else if (normalized.includes("overdue")) {
    answer = {
      content:
        "KAN-21 is overdue and still blocked. Confirm an access owner before the next launch review.",
      evidence: [jiraEvidence],
      proposalIds: ["proposal-jira-21"],
    };
  } else if (normalized.includes("integration") || normalized.includes("notes")) {
    answer = {
      content:
        "The integration notes emphasize preserving explicit OAuth outcomes, supporting multiple Jira sites, and keeping generated guidance separate from provider evidence.",
      evidence: [
        {
          id: "evidence-notion-notes",
          source: "notion",
          title: "Jira integration notes",
          excerpt: "Treat connected, error, and no-sites as distinct callback outcomes.",
          sourceUrl: "https://www.notion.so/example/integration-notes",
          workItemId: "work-notion-notes",
          observedAt: "2026-07-18T08:37:00.000Z",
        },
      ],
    };
  } else {
    answer = {
      content:
        "Focus first on the high-priority Jira OAuth work, then resolve the workspace-access blocker before the product sync. This ordering is an AI recommendation based on due dates, priority, and status.",
      evidence: [
        {
          id: "evidence-jira-14-answer",
          source: "jira",
          title: "KAN-14 · Fix Jira OAuth callback handling",
          excerpt: "Priority: High. Due today. Status: In progress.",
          sourceUrl: "https://example.atlassian.net/browse/KAN-14",
          workItemId: "work-jira-14",
          observedAt: "2026-07-18T08:42:00.000Z",
        },
        jiraEvidence,
      ],
      proposalIds: ["proposal-jira-14"],
    };
  }

  const evidence = (answer.evidence ?? []).filter((item) =>
    allowedSources.has(item.source),
  );
  if (evidence.length === 0) {
    return {
      content:
        "I could not find source-backed evidence for that question in the selected connected sources. Try another source or broaden the filter.",
      evidence: [],
    };
  }

  return {
    ...answer,
    evidence,
    proposalIds: answer.proposalIds?.filter((id) => {
      const proposal = baseApprovals.find((item) => item.id === id);
      return Boolean(proposal && allowedSources.has(proposal.source));
    }),
  };
}

function addAssistantExchange(
  thread: AssistantThread,
  prompt: string,
  answer: ReturnType<typeof answerForPrompt>,
  now: string,
): AssistantMessage {
  thread.messages.push({
    id: `message-${thread.id}-user-${thread.messages.length + 1}`,
    role: "user",
    content: prompt,
    createdAt: now,
  });
  const message: AssistantMessage = {
    id: `message-${thread.id}-assistant-${thread.messages.length + 1}`,
    role: "assistant",
    content: answer.content,
    createdAt: now,
    evidence: clone(answer.evidence ?? []),
    proposalIds: answer.proposalIds,
  };
  thread.messages.push(message);
  thread.updatedAt = now;
  return message;
}

export const mockWorkOsClient: WorkOsClient = {
  async getCurrentUser(options) {
    await delay(options, 320);
    const user = getUser();
    return {
      id: user?.id ?? "user-ahmad",
      name: user?.name ?? "Ahmad",
      email: user?.email ?? "ahmad@example.com",
      organization: loadState().settings.organization,
    };
  },

  async getDashboard(options) {
    await delay(options, 480);
    const state = loadState();
    throwForScenario(state.scenario, "Today’s brief");
    const items = visibleWork(state);
    const data: DashboardData = {
      generatedAt: MOCK_NOW,
      freshnessLabel: state.scenario === "partial" ? "Jira fresh · Notion unavailable" : "Updated 18 minutes ago",
      priorities: items.filter((item) => item.priority === "high" || item.priority === "urgent").slice(0, 3),
      blockers: items.filter((item) => item.status.toLowerCase().includes("block")),
      followUps: items.filter((item) => item.type === "follow-up"),
      upcoming: items.filter((item) => item.type === "meeting" || Boolean(item.dueAt)).slice(0, 4),
      recentActivity: state.integrations.length ? clone(baseActivities) : [],
      pendingApprovalCount: state.approvals.filter((item) => item.status === "pending").length,
      connectedSourceCount: state.integrations.filter((item) => item.status === "connected").length,
      warnings:
        state.scenario === "partial"
          ? [
              {
                source: "notion",
                title: "Notion data is temporarily unavailable",
                message: "Jira results are current. Notion content was omitted from this brief.",
                code: "unavailable",
              },
            ]
          : [],
    };
    return data;
  },

  async listIntegrations(options) {
    await delay(options, 360);
    const state = loadState();
    if (state.scenario === "permission-required" && state.integrations[0]) {
      state.integrations[0].status = "permission-required";
      state.integrations[0].warning = "Jira project browse permission is unavailable.";
    }
    if (state.scenario === "reauth-required" && state.integrations[0]) {
      state.integrations[0].status = "reauth-required";
      state.integrations[0].warning = "The Jira authorization has expired.";
    }
    if (state.scenario === "recoverable-error") {
      throwForScenario(state.scenario, "integrations");
    }
    return clone(state.integrations);
  },

  async connectIntegration(provider, options) {
    await delay(options, 650);
    updateState((state) => {
      const wasFirstTime = state.scenario === "first-time";
      
      // Handle Notion MCP separately from Notion REST
      if (provider === "notion-mcp") {
        const exists = state.integrations.some((item) => item.provider === "notion" && item.isMcp);
        if (!exists) {
          state.integrations.push({
            id: `integration-notion-mcp-${Date.now()}`,
            provider: "notion",
            name: "Notion AI Assistant",
            status: "connected",
            accountName: "Demo Workspace",
            workspaceName: "AI Work OS Demo",
            grantedCapabilities: ["AI Search", "Context Retrieval"],
            lastSuccessfulActivity: new Date().toISOString(),
            isMcp: true,
          });
        }
      } else {
        const exists = state.integrations.some((item) => item.provider === provider && !item.isMcp);
        if (!exists) {
          const fixture = returningIntegrations.find((item) => item.provider === provider);
          if (fixture) {
            const integration = clone(fixture);
            if (provider === "notion") {
              integration.isMcp = false;
            }
            state.integrations.push(integration);
          }
        }
      }
      
      state.scenario = "returning";
      if (wasFirstTime) {
        state.approvals = clone(
          baseApprovals.filter((proposal) => proposal.source === provider || (provider === "notion-mcp" && proposal.source === "notion")),
        );
      }
    });
  },

  async disconnectIntegration(id, options) {
    await delay(options, 540);
    updateState((state) => {
      state.integrations = state.integrations.filter((item) => item.id !== id);
      if (state.integrations.length === 0) {
        state.scenario = "first-time";
        state.approvals = [];
        state.threads = [];
      }
    });
  },

  async listWorkItems(filters, options) {
    await delay(options, 440);
    const state = loadState();
    throwForScenario(state.scenario, "work items");
    return clone(visibleWork(state).filter((item) => matchesFilters(item, filters)));
  },

  async getWorkItem(id, options) {
    await delay(options, 380);
    const state = loadState();
    throwForScenario(state.scenario, "this work item");
    const item = visibleWork(state).find((candidate) => candidate.id === id);
    if (!item) throw new WorkOsClientError("unexpected", "Work item not found.");
    return clone(item);
  },

  async listThreads(options) {
    await delay(options, 330);
    const state = loadState();
    throwForScenario(state.scenario, "conversation history");
    return clone([...state.threads].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
  },

  async getThread(id, options) {
    await delay(options, 320);
    const state = loadState();
    throwForScenario(state.scenario, "this conversation");
    const thread = state.threads.find((candidate) => candidate.id === id);
    if (!thread) throw new WorkOsClientError("unexpected", "Conversation not found.");
    return clone(thread);
  },

  async askAssistant(input: AskInput, options?: ClientRequestOptions) {
    await delay(options, 780);
    const state = loadState();
    throwForScenario(state.scenario, "the assistant response");
    if (state.integrations.length === 0) {
      throw new WorkOsClientError(
        "permission-required",
        "Connect at least one source before asking about your workplace.",
      );
    }
    const connected = connectedSources(state);
    const requested = input.sources ? new Set(input.sources) : connected;
    const allowedSources = new Set(
      [...connected].filter((source) => requested.has(source)),
    );
    const answer = answerForPrompt(input.prompt, allowedSources);
    const now = new Date().toISOString();
    if (!state.settings.allowLocalHistory) {
      let thread = input.threadId ? privateThreads.get(input.threadId) : undefined;
      if (!thread) {
        thread = {
          id: `thread-private-${nextPrivateThreadNumber++}`,
          title:
            input.prompt.length > 42
              ? `${input.prompt.slice(0, 39)}…`
              : input.prompt,
          messages: [],
          createdAt: now,
          updatedAt: now,
        };
        privateThreads.set(thread.id, thread);
      }
      const message = addAssistantExchange(thread, input.prompt, answer, now);
      return {
        thread: clone(thread),
        message: clone(message),
        persisted: false,
      };
    }

    let result!: AssistantAnswer;
    updateState((next) => {
      let thread = input.threadId
        ? next.threads.find((candidate) => candidate.id === input.threadId)
        : undefined;
      if (!thread) {
        const id = `thread-local-${next.nextThreadNumber++}`;
        thread = {
          id,
          title: input.prompt.length > 42 ? `${input.prompt.slice(0, 39)}…` : input.prompt,
          messages: [],
          createdAt: now,
          updatedAt: now,
        };
        next.threads.push(thread);
      }
      const message = addAssistantExchange(thread, input.prompt, answer, now);
      result = {
        thread: clone(thread),
        message: clone(message),
        persisted: true,
      };
    });
    return result;
  },

  async listApprovals(options) {
    await delay(options, 390);
    const state = loadState();
    if (state.scenario === "permission-required" || state.scenario === "reauth-required") {
      throwForScenario(state.scenario, "approval proposals");
    }
    return clone(state.approvals);
  },

  async approveAction(id, options) {
    await delay(options, 620);
    let result!: ActionProposal;
    updateState((state) => {
      const proposal = state.approvals.find((item) => item.id === id);
      if (!proposal) throw new WorkOsClientError("unexpected", "Proposal not found.");
      proposal.status = "approved";
      if (state.scenario === "recoverable-error") {
        proposal.execution = {
          status: "failed",
          message: "The simulated provider rejected the update. No external data changed.",
          completedAt: new Date().toISOString(),
        };
      } else {
        proposal.status = "executed";
        proposal.execution = {
          status: "succeeded",
          message: "Simulated update completed. No external provider was changed.",
          completedAt: new Date().toISOString(),
        };
      }
      result = clone(proposal);
    });
    return result;
  },

  async rejectAction(id, options) {
    await delay(options, 520);
    let result!: ActionProposal;
    updateState((state) => {
      const proposal = state.approvals.find((item) => item.id === id);
      if (!proposal) throw new WorkOsClientError("unexpected", "Proposal not found.");
      proposal.status = "rejected";
      proposal.execution = { status: "idle", message: "Proposal rejected. No changes were made." };
      result = clone(proposal);
    });
    return result;
  },

  async getSettings(options) {
    await delay(options, 300);
    return clone(loadState().settings);
  },

  async updateSettings(patch, options) {
    await delay(options, 360);
    const state = updateState((next) => {
      next.settings = { ...next.settings, ...patch };
      if (patch.allowLocalHistory === false) {
        next.threads = [];
        next.nextThreadNumber = 1;
      }
    });
    if (patch.allowLocalHistory !== undefined) {
      privateThreads.clear();
      nextPrivateThreadNumber = 1;
    }
    return clone(state.settings);
  },
};

export function getMockScenario(): MockScenario {
  return loadState().scenario;
}

export function setMockScenario(scenario: MockScenario): void {
  const currentSettings = loadState().settings;
  saveState({ ...initialState(scenario), settings: currentSettings });
  privateThreads.clear();
  nextPrivateThreadNumber = 1;
}

export function resetMockState(): void {
  saveState(initialState());
  privateThreads.clear();
  nextPrivateThreadNumber = 1;
}

export function subscribeMockState(callback: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(EVENT_NAME, callback);
  return () => window.removeEventListener(EVENT_NAME, callback);
}
