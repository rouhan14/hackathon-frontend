"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Filter, Search, SlidersHorizontal } from "lucide-react";
import { useWorkOs } from "@/components/providers/work-os-provider";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/shared/states";
import { SourceBadge } from "@/components/shared/source-badge";
import type { Source, WorkFilters } from "@/lib/data-client/types";
import { useAsyncResource } from "@/lib/use-async-resource";

const typeTabs: Array<{ label: string; value: WorkFilters["type"] }> = [
  { label: "All", value: "all" },
  { label: "Tasks", value: "task" },
  { label: "Issues", value: "issue" },
  { label: "Meetings", value: "meeting" },
  { label: "Documents", value: "document" },
  { label: "Follow-ups", value: "follow-up" },
];

function formatDate(value?: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

export function WorkList() {
  const { client, version } = useWorkOs();
  const [filters, setFilters] = useState<WorkFilters>({ type: "all", source: "all", priority: "all", due: "all" });
  const [query, setQuery] = useState("");
  const load = useCallback((signal: AbortSignal) => client.listWorkItems(filters, { signal }), [client, filters]);
  const resource = useAsyncResource(load, [filters, version]);
  const filtered = useMemo(() => resource.status === "ready" ? resource.data.filter((item) => `${item.title} ${item.description ?? ""} ${item.sourceId}`.toLowerCase().includes(query.toLowerCase())) : [], [query, resource]);

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div><p className="eyebrow">Unified work</p><h2 className="page-title mt-2">Everything that needs attention</h2><p className="page-description">Tasks, issues, meetings, documents, and follow-ups normalized across connected sources.</p></div>
        <label className="relative w-full lg:w-72"><span className="sr-only">Search work</span><Search className="absolute left-3 top-3 text-slate-400" size={17} /><input className="field-input pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search work…" /></label>
      </div>

      <div className="mt-6 overflow-x-auto border-b border-slate-200 dark:border-slate-800" role="tablist" aria-label="Work type">
        <div className="flex min-w-max gap-1">{typeTabs.map((tab) => <button key={tab.value} type="button" role="tab" aria-selected={filters.type === tab.value} onClick={() => setFilters((current) => ({ ...current, type: tab.value }))} className={`border-b-2 px-3 py-3 text-sm font-medium ${filters.type === tab.value ? "border-indigo-600 text-indigo-700 dark:text-indigo-200" : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"}`}>{tab.label}</button>)}</div>
      </div>

      <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950" aria-label="Work filters">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold"><SlidersHorizontal size={16} />Filters</div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <label><span className="sr-only">Source</span><select className="field-select" value={filters.source} onChange={(event) => setFilters((current) => ({ ...current, source: event.target.value as Source | "all" }))}><option value="all">All sources</option><option value="jira">Jira</option><option value="notion">Notion</option><option value="calendar">Calendar</option><option value="gmail">Gmail</option></select></label>
          <label><span className="sr-only">Priority</span><select className="field-select" value={filters.priority} onChange={(event) => setFilters((current) => ({ ...current, priority: event.target.value as WorkFilters["priority"] }))}><option value="all">All priorities</option><option value="urgent">Urgent</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></label>
          <label><span className="sr-only">Due date</span><select className="field-select" value={filters.due} onChange={(event) => setFilters((current) => ({ ...current, due: event.target.value as WorkFilters["due"] }))}><option value="all">Any due date</option><option value="today">Due today</option><option value="overdue">Overdue</option><option value="upcoming">Upcoming</option></select></label>
          <label><span className="sr-only">Status</span><select className="field-select" value={filters.status ?? ""} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value || undefined }))}><option value="">All statuses</option><option>In progress</option><option>Blocked</option><option>Open</option><option>Draft</option><option>Scheduled</option><option>Waiting</option></select></label>
          <button type="button" className="button-secondary" onClick={() => { setFilters({ type: "all", source: "all", priority: "all", due: "all" }); setQuery(""); }}><Filter size={15} />Clear filters</button>
        </div>
      </section>

      <div className="mt-5">
        {resource.status === "loading" && <LoadingSkeleton lines={6} />}
        {resource.status === "error" && <ErrorState error={resource.error} onRetry={resource.retry} />}
        {resource.status === "ready" && filtered.length === 0 && <EmptyState title="No work matches these filters" description="Clear one or more filters, or connect another source to broaden your workplace view." />}
        {resource.status === "ready" && filtered.length > 0 && (
          <>
            <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 md:block">
              <table className="w-full border-collapse text-left text-sm"><thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-900"><tr><th className="px-5 py-3">Item</th><th className="px-4 py-3">Source</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Priority</th><th className="px-4 py-3">Due</th><th className="w-10"><span className="sr-only">Open</span></th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{filtered.map((item) => <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/60"><td className="px-5 py-4"><Link href={`/work/${item.id}`} className="font-medium text-slate-950 hover:text-indigo-700 dark:text-white dark:hover:text-indigo-200">{item.title}</Link><p className="mt-1 text-xs text-slate-500">{item.sourceId} · {item.project}</p></td><td className="px-4 py-4"><SourceBadge source={item.source} /></td><td className="px-4 py-4"><span className="rounded-full bg-slate-100 px-2 py-1 text-xs dark:bg-slate-800">{item.status}</span></td><td className="px-4 py-4 capitalize text-slate-600 dark:text-slate-300">{item.priority ?? "—"}</td><td className="px-4 py-4 text-slate-600 dark:text-slate-300">{formatDate(item.dueAt)}</td><td className="pr-4"><Link href={`/work/${item.id}`} aria-label={`Open ${item.title}`} className="text-slate-400 hover:text-indigo-600"><ArrowUpRight size={16} /></Link></td></tr>)}</tbody></table>
            </div>
            <div className="grid gap-3 md:hidden">{filtered.map((item) => <Link key={item.id} href={`/work/${item.id}`} className="surface-card block"><div className="flex items-start justify-between gap-3"><SourceBadge source={item.source} /><ArrowUpRight size={16} className="text-slate-400" /></div><h3 className="mt-3 font-medium">{item.title}</h3><p className="mt-1 text-xs text-slate-500">{item.sourceId} · {item.project}</p><div className="mt-4 flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-800">{item.status}</span>{item.priority && <span className="capitalize text-slate-500">{item.priority}</span>}<span className="text-slate-500">{formatDate(item.dueAt)}</span></div></Link>)}</div>
          </>
        )}
      </div>
    </div>
  );
}
