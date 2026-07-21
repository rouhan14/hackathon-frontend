import type { Source } from "./data-client/types";

const SOURCE_LABELS: Record<Source, string> = {
  jira: "Jira",
  notion: "Notion",
  clickup: "ClickUp",
  calendar: "Calendar",
  gmail: "Gmail",
  slack: "Slack",
};

const BACKEND_PROVIDERS: Record<Source, string> = {
  jira: "JIRA",
  notion: "NOTION",
  clickup: "CLICKUP",
  calendar: "GOOGLE_CALENDAR",
  gmail: "GMAIL",
  slack: "SLACK",
};

export function providerToSource(provider: string): Source {
  const normalized = provider.toLowerCase();
  if (normalized.includes("notion")) return "notion";
  if (normalized.includes("clickup")) return "clickup";
  if (normalized.includes("calendar")) return "calendar";
  if (normalized.includes("gmail")) return "gmail";
  if (normalized.includes("slack")) return "slack";
  return "jira";
}

export function formatProviderLabel(provider: string): string {
  return SOURCE_LABELS[providerToSource(provider)] ?? provider;
}

export function sourceToBackendProvider(source: Source): string {
  return BACKEND_PROVIDERS[source];
}
