"use client";

import { useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

export function AskBox({ disabled = false, hint }: { disabled?: boolean; hint?: string }) {
  const [question, setQuestion] = useState("");
  const router = useRouter();
  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!question.trim() || disabled) return;
    window.sessionStorage.setItem("ai-work-os-draft-question", question.trim());
    router.push("/assistant");
  }
  return (
    <form onSubmit={submit} className="relative rounded-2xl border border-indigo-200 bg-white p-2 shadow-[0_12px_40px_-24px_rgba(79,70,229,.55)] dark:border-indigo-900 dark:bg-slate-950">
      <div className="flex items-center gap-2">
        <Sparkles className="ml-3 shrink-0 text-indigo-500" size={20} aria-hidden="true" />
        <label htmlFor="dashboard-question" className="sr-only">Ask anything about your work</label>
        <input
          id="dashboard-question"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          disabled={disabled}
          placeholder="Ask anything about your work…"
          className="h-12 min-w-0 flex-1 bg-transparent px-2 text-[15px] text-slate-950 placeholder:text-slate-400 disabled:cursor-not-allowed dark:text-white"
        />
        <button type="submit" disabled={disabled || !question.trim()} className="button-primary h-10 min-h-10 px-4" aria-label="Ask">
          <span className="hidden sm:inline">Ask</span><ArrowRight size={16} aria-hidden="true" />
        </button>
      </div>
      <div className="flex items-center justify-between border-t border-slate-100 px-3 py-2 text-xs text-slate-500 dark:border-slate-800">
        <span>{hint ?? "All connected sources"}</span>
        <span>Jira · Notion · Calendar</span>
      </div>
    </form>
  );
}
