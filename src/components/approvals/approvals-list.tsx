"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Check, Clock3, ShieldCheck, X } from "lucide-react";
import { useWorkOs } from "@/components/providers/work-os-provider";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EvidenceList } from "@/components/shared/evidence-list";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/shared/states";
import { SourceBadge } from "@/components/shared/source-badge";
import type { ActionProposal } from "@/lib/data-client/types";
import { useAsyncResource } from "@/lib/use-async-resource";

type Tab = "pending" | "approved" | "rejected" | "completed";

const tabs: Array<{ value: Tab; label: string }> = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "completed", label: "Completed" },
];

export function ApprovalsList() {
  const { client, version, refresh, notify, isMockMode } = useWorkOs();
  const [tab, setTab] = useState<Tab>("pending");
  const [decision, setDecision] = useState<{ proposal: ActionProposal; action: "approve" | "reject" } | null>(null);
  const [busy, setBusy] = useState(false);
  const load = useCallback((signal: AbortSignal) => client.listApprovals({ signal }), [client]);
  const resource = useAsyncResource(load, [version]);
  const proposals = useMemo(() => resource.status === "ready" ? resource.data.filter((item) => tab === "completed" ? item.status === "executed" : item.status === tab) : [], [resource, tab]);

  async function decide() {
    if (!decision) return;
    setBusy(true);
    try {
      const result = decision.action === "approve" ? await client.approveAction(decision.proposal.id) : await client.rejectAction(decision.proposal.id);
      notify(result.execution.status === "failed" ? result.execution.message ?? "Execution failed." : decision.action === "approve" ? "Proposal approved and simulated execution completed." : "Proposal rejected. No changes were made.", result.execution.status === "failed" ? "error" : "success");
      setDecision(null);
      refresh();
      setTab(decision.action === "approve" ? "completed" : "rejected");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not update proposal.", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="eyebrow">Human-in-the-loop</p><h2 className="page-title mt-2">Review proposed actions</h2><p className="page-description">Inspect the exact target, evidence, and field-level change before anything is approved.</p></div>{isMockMode && <span className="self-start rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200">Simulated execution</span>}</div>
      <div className="mt-7 flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-800" role="tablist" aria-label="Proposal status">{tabs.map((item) => <button key={item.value} type="button" role="tab" aria-selected={tab === item.value} onClick={() => setTab(item.value)} className={`border-b-2 px-4 py-3 text-sm font-medium ${tab === item.value ? "border-indigo-600 text-indigo-700 dark:text-indigo-200" : "border-transparent text-slate-500"}`}>{item.label}{resource.status === "ready" && item.value === "pending" && <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-800">{resource.data.filter((proposal) => proposal.status === "pending").length}</span>}</button>)}</div>
      <div className="mt-5 space-y-4">
        {resource.status === "loading" && <LoadingSkeleton lines={5} />}
        {resource.status === "error" && <ErrorState error={resource.error} onRetry={resource.retry} />}
        {resource.status === "ready" && proposals.length === 0 && <EmptyState title={`No ${tab} proposals`} description={tab === "pending" ? "You are all caught up. New AI-proposed write actions will appear here before execution." : "Proposals will appear here as their status changes."} />}
        {proposals.map((proposal) => (
          <article key={proposal.id} className="surface-card p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><div className="flex flex-wrap items-center gap-2"><SourceBadge source={proposal.source} /><span className="rounded-full bg-slate-100 px-2 py-1 text-xs capitalize dark:bg-slate-800">{proposal.status}</span></div><h3 className="mt-3 text-lg font-semibold text-slate-950 dark:text-white">{proposal.title}</h3><p className="mt-1 text-sm text-slate-500">Exact target: <span className="font-medium text-slate-700 dark:text-slate-200">{proposal.targetId}</span></p></div><span className="flex items-center gap-1 text-xs text-slate-500"><Clock3 size={13} />{new Date(proposal.createdAt).toLocaleString()}</span></div>
            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70"><p className="eyebrow">Exact proposed change</p><dl className="mt-3 space-y-3">{Object.entries(proposal.changes).map(([field, change]) => <div key={field} className="grid gap-2 text-sm sm:grid-cols-[8rem_1fr]"><dt className="font-medium capitalize">{field}</dt><dd className="flex flex-wrap items-center gap-2"><span className="rounded bg-red-50 px-2 py-1 text-red-700 line-through dark:bg-red-950 dark:text-red-200">{change.from === null ? "Not set" : String(change.from)}</span><ArrowUpRight className="rotate-45 text-slate-400" size={15} /><span className="rounded bg-emerald-50 px-2 py-1 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200">{String(change.to)}</span></dd></div>)}</dl></div>
            <div className="mt-5"><p className="eyebrow">Why this was proposed</p><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{proposal.explanation}</p></div>
            <EvidenceList evidence={proposal.evidence} />
            {proposal.execution.message && <div className={`mt-4 rounded-xl border px-4 py-3 text-sm ${proposal.execution.status === "failed" ? "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200" : "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"}`} role={proposal.execution.status === "failed" ? "alert" : "status"}>{proposal.execution.message}</div>}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5 dark:border-slate-800"><div>{proposal.workItemId && <Link href={`/work/${proposal.workItemId}`} className="inline-flex items-center gap-1 text-sm font-medium text-indigo-700 dark:text-indigo-200">Open target <ArrowUpRight size={14} /></Link>}</div>{proposal.status === "pending" && <div className="flex gap-3"><button type="button" className="button-secondary" onClick={() => setDecision({ proposal, action: "reject" })}><X size={16} />Reject</button><button type="button" className="button-primary" onClick={() => setDecision({ proposal, action: "approve" })}><ShieldCheck size={16} />Approve</button></div>}{proposal.status === "executed" && <span className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-300"><Check size={16} />Completed</span>}</div>
          </article>
        ))}
      </div>
      <ConfirmDialog open={decision !== null} title={decision?.action === "approve" ? "Approve this exact change?" : "Reject this proposal?"} description={decision?.action === "approve" ? "The proposal will move to execution. In mock mode this is a local simulation and no external provider will change." : "The proposal will be marked rejected and no change will be made."} confirmLabel={decision?.action === "approve" ? "Approve proposal" : "Reject proposal"} tone={decision?.action === "reject" ? "danger" : "primary"} busy={busy} onConfirm={() => void decide()} onClose={() => !busy && setDecision(null)} />
    </div>
  );
}
