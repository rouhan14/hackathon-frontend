"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { getToken, getServerToken, subscribeToken } from "@/lib/auth";

type AuthGuardProps = {
  children: React.ReactNode;
  /** Where to send unauthenticated users. Defaults to the login page. */
  redirectTo?: string;
  /** Optional UI shown while redirecting an unauthenticated user. */
  fallback?: React.ReactNode;
};

/**
 * Wraps any page/section that requires a logged-in user.
 *
 * Reads the stored token via useSyncExternalStore, so it stays in sync when the
 * user logs in or out — in this tab or another. Unauthenticated users are
 * redirected to `redirectTo` (default "/") and see `fallback` in the meantime,
 * so protected content never flashes on screen.
 *
 * Reuse it on any protected page:
 *   <AuthGuard>
 *     <YourProtectedPage />
 *   </AuthGuard>
 */
export default function AuthGuard({
  children,
  redirectTo = "/",
  fallback,
}: AuthGuardProps) {
  const router = useRouter();
  const token = useSyncExternalStore(
    subscribeToken,
    getToken,
    getServerToken
  );
  const isAuthed = token !== null;

  useEffect(() => {
    if (!isAuthed) router.replace(redirectTo);
  }, [isAuthed, router, redirectTo]);

  if (!isAuthed) {
    return (
      <>
        {fallback ?? (
          <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
          </div>
        )}
      </>
    );
  }

  return <>{children}</>;
}
