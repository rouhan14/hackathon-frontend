"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bot,
  CircleStop,
  History,
  Search,
  Sparkles,
} from "lucide-react";
import { useWorkOs } from "@/components/providers/work-os-provider";
import { AssistantMessageView } from "./assistant-message";
import { AssistantSourceSelect } from "./assistant-source-select";
import { ASSISTANT_STARTERS } from "./assistant-starters";
import { ErrorState, LoadingSkeleton } from "@/components/shared/states";
import type { AssistantThread, Source } from "@/lib/data-client/types";
import { useAsyncResource } from "@/lib/use-async-resource";

export function AssistantWorkspace({ threadId }: { threadId?: string }) {
  const { client, version, refresh, notify } = useWorkOs();
  const router = useRouter();
  const [thread, setThread] = useState<AssistantThread | null>(null);
  const [prompt, setPrompt] = useState("");
  const [source, setSource] = useState<Source | "all">("all");
  const [sending, setSending] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadHistory = useCallback(
    (signal: AbortSignal) => client.listThreads({ signal }),
    [client],
  );
  const history = useAsyncResource(loadHistory, [version]);
  const loadThread = useCallback(
    (signal: AbortSignal) => {
      if (!threadId) return Promise.resolve(null);
      return client.getThread(threadId, { signal });
    },
    [client, threadId],
  );
  const threadResource = useAsyncResource(loadThread, [threadId, version]);

  useEffect(() => {
    if (threadId) return;
    const draft = window.sessionStorage.getItem("ai-work-os-draft-question");
    if (draft) {
      queueMicrotask(() => setPrompt(draft));
      window.sessionStorage.removeItem("ai-work-os-draft-question");
    }
  }, [threadId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [thread?.messages.length, sending]);

  const displayThread =
    thread ?? (threadResource.status === "ready" ? threadResource.data : null);
  const messages = displayThread?.messages ?? [];
  const filteredHistory = useMemo(
    () => (history.status === "ready" ? history.data.slice(0, 8) : []),
    [history],
  );

  async function submit(value = prompt) {
    const nextPrompt = value.trim();
    if (!nextPrompt || sending) return;
    const optimistic: AssistantThread = displayThread ?? {
      id: "pending",
      title: nextPrompt,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };
    setThread({
      ...optimistic,
      messages: [
        ...optimistic.messages,
        {
          id: `optimistic-${optimistic.messages.length + 1}`,
          role: "user",
          content: nextPrompt,
          createdAt: new Date().toISOString(),
        },
      ],
    });
    setPrompt("");
    setSending(true);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const answer = await client.askAssistant(
        {
          prompt: nextPrompt,
          threadId:
            displayThread && displayThread.id !== "pending"
              ? displayThread.id
              : threadId,
          sources: source === "all" ? undefined : [source],
        },
        { signal: controller.signal },
      );
      setThread(answer.thread);
      if (answer.persisted) {
        refresh();
        if (!threadId) router.replace(`/assistant/${answer.thread.id}`);
      }
    } catch (error) {
      if (controller.signal.aborted) notify("Response stopped.", "info");
      else
        notify(
          error instanceof Error
            ? error.message
            : "The assistant could not answer.",
          "error",
        );
      if (threadId)
        void client
          .getThread(threadId)
          .then(setThread)
          .catch(() => setThread(null));
      else setThread(null);
    } finally {
      setSending(false);
      abortRef.current = null;
    }
  }

  if (threadId && threadResource.status === "loading")
    return <LoadingSkeleton lines={5} />;
  if (threadId && threadResource.status === "error")
    return (
      <ErrorState error={threadResource.error} onRetry={threadResource.retry} />
    );

  return (
    <div className="grid min-h-[calc(100vh-8.5rem)] gap-5 xl:grid-cols-[15rem_minmax(0,1fr)]">
      <aside className="hidden rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950 xl:block">
        <Link href="/assistant" className="button-secondary w-full">
          <Sparkles size={15} />
          New conversation
        </Link>
        <p className="eyebrow mb-2 mt-6 px-2">Recent</p>
        {history.status === "loading" && (
          <p className="px-2 text-xs text-slate-500">Loading history…</p>
        )}
        {history.status === "error" && (
          <p className="px-2 text-xs leading-5 text-amber-700">
            {history.error.message}
          </p>
        )}
        <nav className="space-y-1" aria-label="Conversation history">
          {filteredHistory.map((item) => (
            <Link
              key={item.id}
              href={`/assistant/${item.id}`}
              className={`block rounded-lg px-3 py-2 text-sm ${
                item.id === threadId
                  ? "bg-indigo-50 font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200"
                  : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
              }`}
            >
              <span className="line-clamp-2">{item.title}</span>
            </Link>
          ))}
        </nav>
      </aside>

      <section className="flex min-w-0 flex-col">
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <p className="eyebrow flex items-center gap-2">
              <History size={13} />
              Unified brain
            </p>
            <h2 className="page-title mt-2">
              {displayThread?.title ?? "What can I help you find?"}
            </h2>
            <p className="page-description">
              One assistant across Jira, Notion, and ClickUp. Tool calls and
              connected apps stay visible with every answer.
            </p>
          </div>
          <AssistantSourceSelect value={source} onChange={setSource} />
        </div>

        <div className="flex-1 space-y-6">
          {messages.length === 0 ? (
            <div className="surface-card py-8 sm:py-12">
              <div className="mx-auto max-w-2xl text-center">
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200">
                  <Search size={21} />
                </span>
                <h3 className="mt-4 text-lg font-semibold">
                  Ask across your workplace
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  The brain can search and act in connected apps in one request
                  — for example read Notion, then create Jira issues.
                </p>
              </div>
              <div className="mx-auto mt-7 grid max-w-3xl gap-2 sm:grid-cols-2">
                {ASSISTANT_STARTERS.map((starter) => (
                  <button
                    key={starter}
                    type="button"
                    onClick={() => void submit(starter)}
                    className="rounded-xl border border-slate-200 p-3 text-left text-sm text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50/50 dark:border-slate-800 dark:text-slate-200 dark:hover:border-indigo-800 dark:hover:bg-indigo-950/30"
                  >
                    {starter}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <AssistantMessageView key={message.id} message={message} />
            ))
          )}
          {sending && (
            <div
              className="flex items-center gap-3 text-sm text-slate-500"
              role="status"
            >
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-indigo-100 text-indigo-700">
                <Bot size={17} />
              </span>
              <span className="flex gap-1">
                <i className="h-2 w-2 animate-bounce rounded-full bg-indigo-400" />
                <i className="h-2 w-2 animate-bounce rounded-full bg-indigo-400 [animation-delay:120ms]" />
                <i className="h-2 w-2 animate-bounce rounded-full bg-indigo-400 [animation-delay:240ms]" />
              </span>
              Calling the brain across connected apps…
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
          className="sticky bottom-3 mt-6 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-950"
        >
          <label htmlFor="assistant-prompt" className="sr-only">
            Message AI Work OS brain
          </label>
          <textarea
            id="assistant-prompt"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void submit();
              }
            }}
            placeholder="Ask about Jira issues, Notion pages, ClickUp tasks…"
            maxLength={4000}
            className="field-textarea min-h-20 border-0 bg-transparent"
          />
          <div className="flex items-center justify-between border-t border-slate-100 px-2 pt-2 dark:border-slate-800">
            <p className="text-xs text-slate-500">
              Enter to send · Shift+Enter for a new line
              {source !== "all" ? ` · ${source} only` : ""}
            </p>
            {sending ? (
              <button
                type="button"
                onClick={() => abortRef.current?.abort()}
                className="button-secondary"
              >
                <CircleStop size={16} />
                Stop
              </button>
            ) : (
              <button
                type="submit"
                disabled={!prompt.trim()}
                className="button-primary"
              >
                Send <ArrowRight size={16} />
              </button>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}
