"use client";

import { AlertTriangle, Inbox, LockKeyhole, RefreshCw, WifiOff } from "lucide-react";
import { WorkOsClientError } from "@/lib/data-client/types";

export function LoadingSkeleton({ lines = 4 }: { lines?: number }) {
  return (
    <div className="surface-card animate-pulse space-y-4" role="status">
      <span className="sr-only">Loading</span>
      <div className="h-5 w-1/3 rounded bg-slate-200 dark:bg-slate-800" />
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className="h-12 rounded-xl bg-slate-100 dark:bg-slate-900"
        />
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="surface-card flex flex-col items-center px-6 py-12 text-center">
      <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
        <Inbox aria-hidden="true" size={21} />
      </div>
      <h2 className="text-base font-semibold text-slate-950 dark:text-white">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  const typed = error instanceof WorkOsClientError ? error : null;
  const Icon =
    typed?.code === "permission-required"
      ? LockKeyhole
      : typed?.code === "reauth-required"
        ? WifiOff
        : AlertTriangle;
  const title =
    typed?.code === "permission-required"
      ? "Permission required"
      : typed?.code === "reauth-required"
        ? "Reconnect a source"
        : typed?.code === "backend-unavailable"
          ? "Backend capability not available"
          : "We couldn’t load this view";
  return (
    <div className="surface-card flex flex-col items-start border-amber-200 bg-amber-50/50 p-6 dark:border-amber-900 dark:bg-amber-950/20">
      <Icon className="text-amber-700 dark:text-amber-300" aria-hidden="true" size={22} />
      <h2 className="mt-4 font-semibold text-slate-950 dark:text-white">{title}</h2>
      <p role="alert" className="mt-2 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">
        {error.message}
      </p>
      {onRetry && (typed?.retryable || !typed) && (
        <button className="button-secondary mt-5" type="button" onClick={onRetry}>
          <RefreshCw aria-hidden="true" size={15} /> Try again
        </button>
      )}
    </div>
  );
}

export function PartialWarning({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100" role="status">
      <AlertTriangle className="mt-0.5 shrink-0" aria-hidden="true" size={17} />
      <div>
        <p className="font-medium">{title}</p>
        <div className="mt-1 text-amber-800 dark:text-amber-200">{children}</div>
      </div>
    </div>
  );
}
