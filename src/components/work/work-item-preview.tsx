import Link from "next/link";
import { ArrowUpRight, CalendarClock } from "lucide-react";
import type { WorkItem } from "@/lib/data-client/types";
import { SourceBadge } from "@/components/shared/source-badge";

function formatDue(date?: string) {
  if (!date) return null;
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

export function WorkItemPreview({ item, compact = false }: { item: WorkItem; compact?: boolean }) {
  return (
    <Link href={`/work/${item.id}`} className="group block rounded-xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:hover:border-indigo-700">
      <div className="flex items-start justify-between gap-3">
        <SourceBadge source={item.source} />
        <ArrowUpRight className="text-slate-300 transition group-hover:text-indigo-500" size={16} aria-hidden="true" />
      </div>
      <p className="mt-3 font-medium leading-6 text-slate-950 dark:text-white">{item.title}</p>
      {!compact && item.description && (
        <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-500 dark:text-slate-400">{item.description}</p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span className="rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-800">{item.status}</span>
        {item.priority && <span className="capitalize">{item.priority} priority</span>}
        {item.dueAt && (
          <span className="inline-flex items-center gap-1"><CalendarClock size={13} aria-hidden="true" />{formatDue(item.dueAt)}</span>
        )}
      </div>
    </Link>
  );
}
