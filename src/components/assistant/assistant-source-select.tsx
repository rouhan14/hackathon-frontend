import type { Source } from "@/lib/data-client/types";

const OPTIONS: Array<{ value: Source | "all"; label: string }> = [
  { value: "all", label: "All connected apps" },
  { value: "jira", label: "Jira only" },
  { value: "notion", label: "Notion only" },
  { value: "clickup", label: "ClickUp only" },
];

export function AssistantSourceSelect({
  value,
  onChange,
}: {
  value: Source | "all";
  onChange: (value: Source | "all") => void;
}) {
  return (
    <label className="min-w-44">
      <span className="sr-only">Limit this question to one source</span>
      <select
        className="field-select"
        value={value}
        onChange={(event) => onChange(event.target.value as Source | "all")}
        title="Only tools from the selected app are available for this request"
      >
        {OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
