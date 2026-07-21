import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Link2,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { EvidenceList } from "@/components/shared/evidence-list";
import type { AssistantMessage } from "@/lib/data-client/types";
import { formatProviderLabel } from "@/lib/provider-format";
export function AssistantMessageView({
  message,
}: {
  message: AssistantMessage;
}) {
  const assistant = message.role === "assistant";
  const connections = message.availableConnections;
  const failedTools = (message.toolCalls ?? []).filter((call) => !call.ok);
  const okTools = (message.toolCalls ?? []).filter((call) => call.ok);

  return (
    <article className={`flex gap-3 ${assistant ? "" : "justify-end"}`}>
      {assistant && (
        <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200">
          <Bot size={17} />
        </span>
      )}
      <div
        className={`max-w-3xl ${assistant ? "min-w-0 flex-1" : "rounded-2xl rounded-tr-sm bg-indigo-600 px-4 py-3 text-white"}`}
      >
        {assistant ? (
          <div className="surface-card">
            <p className="eyebrow flex items-center gap-2">
              <Sparkles size={13} />
              Unified brain
              {(message.provider || message.model) && (
                <span className="font-normal normal-case tracking-normal text-slate-400">
                  ·{" "}
                  {[message.provider, message.model]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              )}
            </p>
            <p className="mt-3 whitespace-pre-wrap text-[15px] leading-7 text-slate-700 dark:text-slate-200">
              {message.content}
            </p>

            {connections && connections.length > 0 && (
              <section
                className="mt-4 flex flex-wrap items-center gap-2"
                aria-label="Connections used"
              >
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  <Link2 size={12} /> Apps
                </span>
                {connections.map((connection) => (
                  <span
                    key={connection.id}
                    className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                    title={
                      connection.workspaceName ??
                      connection.accountName ??
                      connection.id
                    }
                  >
                    {formatProviderLabel(connection.provider)}
                    {connection.workspaceName || connection.accountName
                      ? ` · ${connection.workspaceName ?? connection.accountName}`
                      : ""}
                  </span>
                ))}
              </section>
            )}

            {message.toolCalls && message.toolCalls.length > 0 && (
              <section
                className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60"
                aria-label="Tools used"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Tools used
                  <span className="ml-2 font-normal normal-case text-slate-400">
                    {okTools.length} ok
                    {failedTools.length > 0
                      ? ` · ${failedTools.length} failed`
                      : ""}
                  </span>
                </p>
                <ul className="mt-2 space-y-1.5">
                  {message.toolCalls.map((call, index) => (
                    <li
                      key={`${call.name}-${index}`}
                      className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300"
                    >
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 font-medium ${
                          call.ok
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                            : "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200"
                        }`}
                      >
                        {call.ok ? "ok" : "failed"}
                      </span>
                      <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[11px] dark:bg-slate-950">
                        {call.name}
                      </code>
                      {Object.keys(call.arguments ?? {}).length > 0 && (
                        <span
                          className="truncate text-slate-500"
                          title={JSON.stringify(call.arguments)}
                        >
                          {JSON.stringify(call.arguments)}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
                {message.runId && (
                  <p className="mt-2 font-mono text-[10px] text-slate-400">
                    run {message.runId}
                  </p>
                )}
              </section>
            )}

            {connections && connections.length === 0 && (
              <section
                className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
                aria-label="No connected apps"
              >
                No work apps are connected yet, so the brain has no live tools.{" "}
                <Link
                  href="/integrations"
                  className="font-semibold underline underline-offset-2"
                >
                  Connect Jira, Notion, or ClickUp
                </Link>{" "}
                to answer from your workspace.
              </section>
            )}

            <EvidenceList evidence={message.evidence ?? []} />
            {message.proposalIds && message.proposalIds.length > 0 && (
              <section
                className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-900 dark:bg-indigo-950/40"
                aria-label="Proposed actions"
              >
                <div className="flex items-start gap-3">
                  <ShieldCheck
                    className="mt-0.5 text-indigo-600 dark:text-indigo-300"
                    size={18}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-950 dark:text-white">
                      Proposed action
                    </p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      An external change is available for review. Nothing will
                      change until you approve it.
                    </p>
                    <Link
                      href="/approvals"
                      className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-indigo-700 dark:text-indigo-200"
                    >
                      Review proposal <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </section>
            )}
          </div>
        ) : (
          <p className="text-sm leading-6">{message.content}</p>
        )}
      </div>
      {!assistant && (
        <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <UserRound size={17} />
        </span>
      )}
    </article>
  );
}
