"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Circle,
  Clock3,
  FileText,
  Sparkles,
  Tickets,
} from "lucide-react";
import { useWorkOs } from "@/components/providers/work-os-provider";
import { AskBox } from "@/components/assistant/ask-box";
import { ErrorState, LoadingSkeleton, PartialWarning } from "@/components/shared/states";
import { SourceBadge } from "@/components/shared/source-badge";
import { WorkItemPreview } from "@/components/work/work-item-preview";
import { useAsyncResource } from "@/lib/use-async-resource";

export default function DashboardPage() {
  const { client, user, version, refresh, isMockMode, notify } = useWorkOs();
  const [connecting, setConnecting] = useState<"jira" | "notion" | null>(null);
  const load = useCallback((signal: AbortSignal) => client.getDashboard({ signal }), [client]);
  const dashboard = useAsyncResource(load, [version]);

  async function connect(provider: "jira" | "notion") {
    setConnecting(provider);
    try {
      await client.connectIntegration(provider);
      notify(
        isMockMode
          ? `${provider === "jira" ? "Jira" : "Notion"} demo source connected. No external account was changed.`
          : `Opening ${provider === "jira" ? "Jira" : "Notion"} authorization.`,
        "success",
      );
      refresh();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not connect source.", "error");
    } finally {
      setConnecting(null);
    }
  }

  if (dashboard.status === "loading") return <LoadingSkeleton lines={6} />;
  if (dashboard.status === "error") return <ErrorState error={dashboard.error} onRetry={dashboard.retry} />;
  const data = dashboard.data;
  const firstTime = data.connectedSourceCount === 0;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const today = new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric" }).format(new Date());

  if (firstTime) {
    return (
      <div className="mx-auto max-w-5xl">
        <p className="eyebrow">Today</p>
        <h2 className="page-title mt-2">{greeting}, {user?.name?.split(" ")[0] ?? "there"}</h2>
        <section className="mt-7 overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-white via-white to-indigo-50 p-6 shadow-sm dark:border-indigo-950 dark:from-slate-950 dark:via-slate-950 dark:to-indigo-950/40 sm:p-9">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_.8fr] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200"><Sparkles size={14} /> Your workspace is ready</span>
              <h3 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-3xl">Bring your work into one place</h3>
              <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-300">Connect at least one workplace tool so AI Work OS can find tasks, documents, blockers, decisions, and follow-ups.</p>
              {isMockMode && <p className="mt-3 text-xs font-medium text-indigo-600 dark:text-indigo-300">Demo mode simulates connections locally. No OAuth flow or provider account is used.</p>}
              <div className="mt-6 flex flex-wrap gap-3">
                <button type="button" className="button-primary" disabled={connecting !== null} onClick={() => connect("jira")}><Tickets size={16} />{connecting === "jira" ? "Connecting…" : "Connect Jira"}</button>
                <button type="button" className="button-secondary" disabled={connecting !== null} onClick={() => connect("notion")}><FileText size={16} />{connecting === "notion" ? "Connecting…" : "Connect Notion"}</button>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 dark:border-slate-800 dark:bg-slate-950/70">
              <p className="text-sm font-semibold">Setup progress</p>
              <ol className="mt-4 space-y-4 text-sm">
                <li className="flex items-center gap-3"><span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-100 text-emerald-700"><Check size={14} /></span>Account created</li>
                <li className="flex items-center gap-3 text-slate-500"><Circle size={22} className="text-slate-300" />Connect your first source</li>
                <li className="flex items-center gap-3 text-slate-500"><Circle size={22} className="text-slate-300" />Ask your first question</li>
              </ol>
            </div>
          </div>
        </section>
        <div className="mt-7"><AskBox disabled hint="Connect a source to ask about your work" /></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">{today}</p>
          <h2 className="page-title mt-2">{greeting}, {user?.name?.split(" ")[0] ?? "there"}</h2>
          <p className="page-description flex items-center gap-2"><Clock3 size={14} />{data.freshnessLabel}</p>
        </div>
        <Link href="/work" className="button-secondary self-start">View all work <ArrowRight size={15} /></Link>
      </div>
      <AskBox />
      {data.warnings.map((warning) => <PartialWarning key={warning.source} title={warning.title}>{warning.message}</PartialWarning>)}

      <section>
        <div className="mb-4 flex items-center justify-between"><div><p className="eyebrow">Daily brief</p><h3 className="mt-1 text-lg font-semibold">What needs your attention</h3></div><span className="text-xs text-slate-500">Generated at {new Date(data.generatedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span></div>
        <div className="grid gap-4 xl:grid-cols-2">
          <div className="surface-card"><div className="mb-4 flex items-center justify-between"><h4 className="font-semibold">Top priorities</h4><span className="rounded-full bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200">{data.priorities.length}</span></div><div className="grid gap-3">{data.priorities.map((item) => <WorkItemPreview key={item.id} item={item} compact />)}</div></div>
          <div className="surface-card"><div className="mb-4 flex items-center justify-between"><h4 className="font-semibold">Blockers & follow-ups</h4><span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-200">{data.blockers.length + data.followUps.length}</span></div><div className="grid gap-3">{[...data.blockers, ...data.followUps].slice(0, 3).map((item) => <WorkItemPreview key={item.id} item={item} compact />)}</div></div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_.8fr]">
        <section className="surface-card"><div className="mb-4 flex items-center justify-between"><h3 className="font-semibold">Upcoming</h3><Link href="/work" className="text-sm font-medium text-indigo-600">Open work</Link></div><div className="grid gap-3 sm:grid-cols-2">{data.upcoming.slice(0, 4).map((item) => <WorkItemPreview key={item.id} item={item} compact />)}</div></section>
        <section className="surface-card"><div className="mb-4 flex items-center justify-between"><h3 className="font-semibold">Recent activity</h3><SourceBadge source="jira" /></div><ol className="space-y-4">{data.recentActivity.map((activity) => <li key={activity.id} className="flex gap-3 text-sm"><span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-indigo-400" /><div><p className="text-slate-700 dark:text-slate-200">{activity.description}</p><p className="mt-1 text-xs text-slate-500">{new Date(activity.occurredAt).toLocaleString()}</p></div></li>)}</ol></section>
      </div>
    </div>
  );
}
