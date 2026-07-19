import {
  CalendarDays,
  FileText,
  Mail,
  MessageSquare,
  ListChecks,
  Tickets,
} from "lucide-react";
import type { Source } from "@/lib/data-client/types";

const labels: Record<Source, string> = {
  jira: "Jira",
  notion: "Notion",
  clickup: "ClickUp",
  calendar: "Calendar",
  gmail: "Gmail",
  slack: "Slack",
};

const icons = {
  jira: Tickets,
  notion: FileText,
  clickup: ListChecks,
  calendar: CalendarDays,
  gmail: Mail,
  slack: MessageSquare,
};

export function SourceBadge({ source }: { source: Source }) {
  const Icon = icons[source];
  return (
    <span className={`source-badge source-${source}`}>
      <Icon aria-hidden="true" size={13} strokeWidth={2} />
      {labels[source]}
    </span>
  );
}
