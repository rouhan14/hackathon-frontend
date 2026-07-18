"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { isMockMode, workOsClient } from "@/lib/data-client/client";
import { subscribeMockState } from "@/lib/data-client/mock-client";
import type { WorkUser } from "@/lib/data-client/types";

type ToastTone = "success" | "warning" | "error" | "info";

interface ToastMessage {
  id: number;
  tone: ToastTone;
  message: string;
}

interface WorkOsContextValue {
  client: typeof workOsClient;
  isMockMode: boolean;
  version: number;
  refresh(): void;
  user: WorkUser | null;
  pendingApprovalCount: number;
  integrationNeedsAttention: boolean;
  notify(message: string, tone?: ToastTone): void;
}

const WorkOsContext = createContext<WorkOsContextValue | null>(null);

export function WorkOsProvider({ children }: { children: React.ReactNode }) {
  const [version, setVersion] = useState(0);
  const [user, setUser] = useState<WorkUser | null>(null);
  const [pendingApprovalCount, setPendingApprovalCount] = useState(0);
  const [integrationNeedsAttention, setIntegrationNeedsAttention] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const refresh = useCallback(() => setVersion((value) => value + 1), []);
  const notify = useCallback((message: string, tone: ToastTone = "info") => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, message, tone }]);
    window.setTimeout(
      () => setToasts((current) => current.filter((toast) => toast.id !== id)),
      5200,
    );
  }, []);

  useEffect(() => {
    if (!isMockMode) return;
    return subscribeMockState(refresh);
  }, [refresh]);

  useEffect(() => {
    let cancelled = false;
    void Promise.allSettled([
      workOsClient.getCurrentUser(),
      workOsClient.listApprovals(),
      workOsClient.listIntegrations(),
    ]).then(([userResult, approvalResult, integrationResult]) => {
      if (cancelled) return;
      if (userResult.status === "fulfilled") setUser(userResult.value);
      if (approvalResult.status === "fulfilled") {
        setPendingApprovalCount(
          approvalResult.value.filter((item) => item.status === "pending").length,
        );
      }
      if (integrationResult.status === "fulfilled") {
        setIntegrationNeedsAttention(
          integrationResult.value.some((item) =>
            ["permission-required", "reauth-required", "error"].includes(item.status),
          ),
        );
      }
    });
    return () => {
      cancelled = true;
    };
  }, [version]);

  const value = useMemo<WorkOsContextValue>(
    () => ({
      client: workOsClient,
      isMockMode,
      version,
      refresh,
      user,
      pendingApprovalCount,
      integrationNeedsAttention,
      notify,
    }),
    [integrationNeedsAttention, notify, pendingApprovalCount, refresh, user, version],
  );

  return (
    <WorkOsContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[100] flex flex-col items-center gap-2"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.tone === "error" ? "alert" : "status"}
            className={`pointer-events-auto max-w-lg rounded-xl border px-4 py-3 text-sm shadow-xl backdrop-blur ${
              toast.tone === "success"
                ? "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100"
                : toast.tone === "warning"
                  ? "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100"
                  : toast.tone === "error"
                    ? "border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100"
                    : "border-slate-200 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </WorkOsContext.Provider>
  );
}

export function useWorkOs() {
  const context = useContext(WorkOsContext);
  if (!context) throw new Error("useWorkOs must be used inside WorkOsProvider");
  return context;
}
