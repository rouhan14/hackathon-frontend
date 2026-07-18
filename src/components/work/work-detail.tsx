"use client";

import { useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, CalendarClock, Link2, ShieldCheck, UserRound } from "lucide-react";
import { useWorkOs } from "@/components/providers/work-os-provider";
import { ErrorState, LoadingSkeleton } from "@/components/shared/states";
import { SourceBadge } from "@/components/shared/source-badge";
import { useAsyncResource } from "@/lib/use-async-resource";

export function WorkDetail({ id }: { id: string }) {
  const { client, version } = useWorkOs();
  const load = useCallback((signal: AbortSignal) => client.getWorkItem(id, { signal }), [client, id]);
  const resource = useAsyncResource(load, [id, version]);
  if (resource.status === "loading") return <LoadingSkeleton lines={6} />;
  if (resource.status === "error") return <ErrorState error={resource.error} onRetry={resource.retry} />;
  const item = resource.data;
  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/work" className="button-ghost -ml-3"><ArrowLeft size={16} />Back to work</Link>
      <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <article className="surface-card p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-3"><SourceBadge source={item.source} /><span className="text-xs font-semibold text-slate-500">{item.sourceId}</span><span className="rounded-full bg-slate-100 px-2 py-1 text-xs dark:bg-slate-800">{item.status}</span></div>
          <h2 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-3xl">{item.title}</h2>
          <p className="mt-4 text-[15px] leading-7 text-slate-600 dark:text-slate-300">{item.description ?? "No description was provided by the source."}</p>
          <section className="mt-8 border-t border-slate-200 pt-6 dark:border-slate-800"><p className="eyebrow">Source evidence</p><div className="evidence-card mt-3"><div className="flex items-center gap-2"><SourceBadge source={item.source} /><span className="text-sm font-medium">Observed source state</span></div><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Status is “{item.status}” and this item was last observed on {new Date(item.updatedAt).toLocaleString()}.</p></div></section>
          <section className="mt-8 rounded-2xl border border-indigo-200 bg-indigo-50 p-5 dark:border-indigo-900 dark:bg-indigo-950/30"><div className="flex gap-3"><ShieldCheck className="mt-0.5 text-indigo-600 dark:text-indigo-300" size={20} /><div><h3 className="font-semibold">Actions require approval</h3><p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">AI Work OS can propose changes to this item, but nothing is written to a provider without review.</p><Link href="/approvals" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-indigo-700 dark:text-indigo-200">Review proposals <ArrowUpRight size={14} /></Link></div></div></section>
        </article>
        <aside className="surface-card h-fit space-y-5">
          <div><p className="eyebrow">Details</p><dl className="mt-4 space-y-4 text-sm"><div><dt className="text-xs text-slate-500">Owner</dt><dd className="mt-1 flex items-center gap-2 font-medium"><UserRound size={15} />{item.assignee?.name ?? "Unassigned"}</dd></div><div><dt className="text-xs text-slate-500">Priority</dt><dd className="mt-1 capitalize">{item.priority ?? "Not set"}</dd></div><div><dt className="text-xs text-slate-500">Project</dt><dd className="mt-1">{item.project ?? "Not set"}</dd></div><div><dt className="text-xs text-slate-500">Due</dt><dd className="mt-1 flex items-center gap-2"><CalendarClock size={15} />{item.dueAt ? new Date(item.dueAt).toLocaleString() : "No due date"}</dd></div></dl></div>
          {item.sourceUrl && <a className="button-secondary w-full" href={item.sourceUrl} target="_blank" rel="noreferrer"><Link2 size={15} />Open in {item.source === "jira" ? "Jira" : "source"}<ArrowUpRight size={14} /></a>}
        </aside>
      </div>
    </div>
  );
}
