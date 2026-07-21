import type {
  ActionProposal,
  ActivityItem,
  AssistantThread,
  Integration,
  UserSettings,
  WorkItem,
} from "@/lib/data-client/types";

export const MOCK_NOW = "2026-07-18T09:00:00.000Z";

export const workItems: WorkItem[] = [
  {
    id: "work-jira-14",
    source: "jira",
    sourceId: "KAN-14",
    title: "Fix Jira OAuth callback handling",
    description:
      "Preserve connected, error, and no-sites outcomes while moving integration management out of the dashboard.",
    type: "issue",
    status: "In progress",
    priority: "high",
    assignee: { id: "person-ahmad", name: "Ahmad" },
    project: "AI Work OS",
    dueAt: "2026-07-18T17:00:00.000Z",
    updatedAt: "2026-07-18T07:45:00.000Z",
    sourceUrl: "https://example.atlassian.net/browse/KAN-14",
    relatedIds: ["work-notion-notes"],
  },
  {
    id: "work-jira-21",
    source: "jira",
    sourceId: "KAN-21",
    title: "Resolve permissions for product workspace",
    description:
      "The delivery team cannot view the Product workspace, blocking the launch checklist review.",
    type: "issue",
    status: "Blocked",
    priority: "urgent",
    assignee: { id: "person-sara", name: "Sara Khan" },
    project: "Launch readiness",
    dueAt: "2026-07-17T17:00:00.000Z",
    updatedAt: "2026-07-18T06:20:00.000Z",
    sourceUrl: "https://example.atlassian.net/browse/KAN-21",
  },
  {
    id: "work-jira-28",
    source: "jira",
    sourceId: "KAN-28",
    title: "Confirm launch analytics owners",
    description: "Two launch metrics still need named owners before Monday.",
    type: "follow-up",
    status: "Open",
    priority: "medium",
    assignee: { id: "person-ahmad", name: "Ahmad" },
    project: "Launch readiness",
    dueAt: "2026-07-19T12:00:00.000Z",
    updatedAt: "2026-07-18T05:10:00.000Z",
    sourceUrl: "https://example.atlassian.net/browse/KAN-28",
  },
  {
    id: "work-notion-notes",
    source: "notion",
    sourceId: "page-integration-notes",
    title: "Jira integration notes",
    description:
      "Design notes covering multi-site OAuth, safe callback states, and source evidence presentation.",
    type: "document",
    status: "Draft",
    assignee: { id: "person-ahmad", name: "Ahmad" },
    project: "AI Work OS",
    updatedAt: "2026-07-17T15:30:00.000Z",
    sourceUrl: "https://www.notion.so/example/integration-notes",
    relatedIds: ["work-jira-14"],
  },
  {
    id: "work-calendar-sync",
    source: "calendar",
    sourceId: "event-product-sync",
    title: "Product and engineering sync",
    description: "Weekly review of launch risks, decisions, and ownership.",
    type: "meeting",
    status: "Scheduled",
    assignee: { id: "person-sara", name: "Sara Khan" },
    project: "AI Work OS",
    dueAt: "2026-07-18T10:00:00.000Z",
    updatedAt: "2026-07-17T14:00:00.000Z",
  },
  {
    id: "work-gmail-design",
    source: "gmail",
    sourceId: "mail-design-approval",
    title: "Reply to design approval thread",
    description: "The design team is waiting for confirmation on the mobile shell.",
    type: "follow-up",
    status: "Waiting",
    priority: "medium",
    assignee: { id: "person-ahmad", name: "Ahmad" },
    project: "AI Work OS",
    dueAt: "2026-07-18T13:00:00.000Z",
    updatedAt: "2026-07-18T04:40:00.000Z",
  },
];

export const returningIntegrations: Integration[] = [
  {
    id: "integration-clickup-main",
    provider: "clickup",
    name: "ClickUp",
    status: "connected",
    accountName: "ClickUp",
    workspaceName: "Authorized ClickUp workspaces",
    grantedCapabilities: ["Search tasks", "Read task details"],
    lastSuccessfulActivity: "2026-07-18T08:45:00.000Z",
  },
  {
    id: "integration-jira-main",
    provider: "jira",
    name: "Jira",
    status: "connected",
    accountName: "ahmad@example.com",
    workspaceName: "Product delivery",
    grantedCapabilities: ["Read issues", "Search projects", "Propose updates"],
    lastSuccessfulActivity: "2026-07-18T08:42:00.000Z",
    supportsMultipleSites: true,
  },
  {
    id: "integration-notion-main",
    provider: "notion",
    name: "Notion",
    status: "connected",
    accountName: "Ahmad",
    workspaceName: "AI Work OS",
    grantedCapabilities: ["Read pages", "Search workspace"],
    lastSuccessfulActivity: "2026-07-18T08:37:00.000Z",
    isMcp: false,
  },
];

export const baseActivities: ActivityItem[] = [
  {
    id: "activity-1",
    description: "KAN-14 moved to In progress",
    source: "jira",
    occurredAt: "2026-07-18T07:45:00.000Z",
    workItemId: "work-jira-14",
  },
  {
    id: "activity-2",
    description: "Jira integration notes were updated",
    source: "notion",
    occurredAt: "2026-07-17T15:30:00.000Z",
    workItemId: "work-notion-notes",
  },
  {
    id: "activity-3",
    description: "Product sync agenda was revised",
    source: "calendar",
    occurredAt: "2026-07-17T14:00:00.000Z",
    workItemId: "work-calendar-sync",
  },
];

const jiraEvidence = {
  id: "evidence-jira-21",
  source: "jira" as const,
  title: "KAN-21 · Resolve permissions for product workspace",
  excerpt: "Status: Blocked. Delivery team access is still pending.",
  sourceUrl: "https://example.atlassian.net/browse/KAN-21",
  workItemId: "work-jira-21",
  observedAt: "2026-07-18T08:42:00.000Z",
};

export const baseApprovals: ActionProposal[] = [
  {
    id: "proposal-jira-14",
    source: "jira",
    targetId: "KAN-14",
    workItemId: "work-jira-14",
    title: "Update Jira issue KAN-14",
    explanation: "You selected this issue as your current priority.",
    evidence: [
      {
        id: "evidence-jira-14",
        source: "jira",
        title: "KAN-14 · Fix Jira OAuth callback handling",
        excerpt: "Priority: High. Due today. Assigned to Ahmad.",
        sourceUrl: "https://example.atlassian.net/browse/KAN-14",
        workItemId: "work-jira-14",
        observedAt: "2026-07-18T08:42:00.000Z",
      },
    ],
    changes: { status: { from: "To Do", to: "In Progress" } },
    status: "pending",
    createdAt: "2026-07-18T08:10:00.000Z",
    execution: { status: "idle" },
  },
  {
    id: "proposal-jira-21",
    source: "jira",
    targetId: "KAN-21",
    workItemId: "work-jira-21",
    title: "Add blocker note to KAN-21",
    explanation: "The missing workspace permission is blocking launch review.",
    evidence: [jiraEvidence],
    changes: {
      comment: {
        from: null,
        to: "Blocked by Product workspace access. Awaiting owner response.",
      },
    },
    status: "pending",
    createdAt: "2026-07-18T07:50:00.000Z",
    execution: { status: "idle" },
  },
];

export const baseThreads: AssistantThread[] = [
  {
    id: "thread-daily-focus",
    title: "Today’s focus",
    createdAt: "2026-07-18T07:30:00.000Z",
    updatedAt: "2026-07-18T07:31:00.000Z",
    messages: [
      {
        id: "message-focus-user",
        role: "user",
        content: "What should I work on today?",
        createdAt: "2026-07-18T07:30:00.000Z",
      },
      {
        id: "message-focus-assistant",
        role: "assistant",
        content:
          "Start with the Jira OAuth callback work, then unblock workspace access before the product sync. I inferred this order from due dates, priority, and blocker status.",
        createdAt: "2026-07-18T07:31:00.000Z",
        evidence: [jiraEvidence],
        proposalIds: ["proposal-jira-14"],
      },
    ],
  },
];

export const defaultSettings: UserSettings = {
  organization: "AI Work OS",
  timeZone: "Asia/Karachi",
  dailyBriefTime: "09:00",
  emailNotifications: true,
  approvalNotifications: true,
  appearance: "system",
  allowLocalHistory: true,
};

export { jiraEvidence };
