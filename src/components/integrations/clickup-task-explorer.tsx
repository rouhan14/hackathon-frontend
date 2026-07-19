"use client";

import { useState, type FormEvent } from "react";
import { ExternalLink, LoaderCircle, RefreshCw, Search } from "lucide-react";
import {
  ClickUpIntegrationError,
  getClickUpTask,
  searchClickUp,
  type ClickUpTask,
} from "@/lib/integrations";

function taskMeta(task: ClickUpTask): string {
  return [task.status, task.priority, task.listName].filter(Boolean).join(" · ");
}

export function ClickUpTaskExplorer({
  connectionId,
  onReconnect,
}: {
  connectionId: string;
  onReconnect(): void;
}) {
  const [query, setQuery] = useState("");
  const [tasks, setTasks] = useState<ClickUpTask[]>([]);
  const [selected, setSelected] = useState<ClickUpTask | null>(null);
  const [searching, setSearching] = useState(false);
  const [loadingTaskId, setLoadingTaskId] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [searched, setSearched] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSearching(true);
    setError(null);
    setSelected(null);
    try {
      const result = await searchClickUp(connectionId, query, 10);
      setTasks(result.tasks);
      setSearched(true);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError : new Error("ClickUp search failed."));
    } finally {
      setSearching(false);
    }
  }

  async function openTask(taskId: string) {
    setLoadingTaskId(taskId);
    setError(null);
    try {
      setSelected(await getClickUpTask(connectionId, taskId));
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError : new Error("Could not load the ClickUp task."));
    } finally {
      setLoadingTaskId(null);
    }
  }

  const reconnectRequired =
    error instanceof ClickUpIntegrationError && error.code === "CLICKUP_REAUTH_REQUIRED";
  const rateLimited =
    error instanceof ClickUpIntegrationError && error.code === "CLICKUP_RATE_LIMITED";

  return (
    <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950 sm:p-6">
      <div>
        <p className="eyebrow">ClickUp task search</p>
        <h3 className="mt-1 font-semibold">Search authorized workspaces</h3>
        <p className="mt-1 text-sm text-slate-500">Results are normalized by AI Work OS; provider credentials and raw MCP payloads stay on the backend.</p>
      </div>
      <form className="mt-5 flex flex-col gap-3 sm:flex-row" onSubmit={submit}>
        <label className="sr-only" htmlFor="clickup-query">Search ClickUp tasks</label>
        <input
          id="clickup-query"
          className="field-input flex-1"
          value={query}
          maxLength={500}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="e.g. blocked tasks assigned to me"
        />
        <button className="button-primary shrink-0" type="submit" disabled={searching || !query.trim()}>
          {searching ? <LoaderCircle className="animate-spin" size={16} /> : <Search size={16} />}
          {searching ? "Searching…" : "Search tasks"}
        </button>
      </form>

      {error && (
        <div role="alert" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-100">
          <p>{rateLimited ? "ClickUp’s quota is currently exhausted. Wait for its quota window to reset; AI Work OS will not retry automatically." : error.message}</p>
          {reconnectRequired && <button type="button" className="button-secondary mt-3" onClick={onReconnect}><RefreshCw size={15} />Reconnect ClickUp</button>}
        </div>
      )}

      {searched && !error && tasks.length === 0 && <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-900">No ClickUp tasks matched this search in the authorized workspaces.</p>}
      {tasks.length > 0 && (
        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)]">
          <ol className="space-y-2">
            {tasks.map((task) => (
              <li key={task.id}>
                <button type="button" className={`focus-ring w-full rounded-xl border p-4 text-left transition ${selected?.id === task.id ? "border-indigo-400 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-950/40" : "border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700"}`} onClick={() => void openTask(task.id)} disabled={loadingTaskId !== null}>
                  <span className="flex items-start justify-between gap-3"><span className="font-medium text-slate-900 dark:text-white">{task.name}</span>{loadingTaskId === task.id && <LoaderCircle className="shrink-0 animate-spin" size={15} />}</span>
                  <span className="mt-1 block text-xs text-slate-500">{taskMeta(task) || `Task ${task.id}`}</span>
                </button>
              </li>
            ))}
          </ol>
          <div className="min-h-36 rounded-xl bg-slate-50 p-4 dark:bg-slate-900">
            {selected ? (
              <div>
                <p className="text-xs font-medium text-slate-500">Task {selected.id}</p>
                <h4 className="mt-1 font-semibold">{selected.name}</h4>
                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <div><dt className="text-xs text-slate-500">Status</dt><dd className="mt-1">{selected.status ?? "Not provided"}</dd></div>
                  <div><dt className="text-xs text-slate-500">Priority</dt><dd className="mt-1">{selected.priority ?? "Not provided"}</dd></div>
                  <div><dt className="text-xs text-slate-500">Assignees</dt><dd className="mt-1">{selected.assignees.join(", ") || "Unassigned"}</dd></div>
                  <div><dt className="text-xs text-slate-500">Due date</dt><dd className="mt-1">{selected.dueDate ? new Date(selected.dueDate).toLocaleString() : "Not provided"}</dd></div>
                </dl>
                {selected.url && <a className="button-secondary mt-4" href={selected.url} target="_blank" rel="noreferrer">Open in ClickUp <ExternalLink size={14} /></a>}
              </div>
            ) : <p className="text-sm text-slate-500">Choose a result to retrieve its current details from ClickUp.</p>}
          </div>
        </div>
      )}
    </section>
  );
}
