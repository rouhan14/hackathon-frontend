"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { getToken, getServerToken, subscribeToken } from "@/lib/auth";

type GuestGuardProps = {
  children: React.ReactNode;
  /** Where to send already-authenticated users. Defaults to the dashboard. */
  redirectTo?: string;
  /** Optional UI shown while redirecting an authenticated user. */
  fallback?: React.ReactNode;
};

/**
 * The inverse of AuthGuard: wraps guest-only pages (login, signup).
 *
 * Reads the stored token via useSyncExternalStore. If a token exists, the user
 * is already signed in, so they're redirected to `redirectTo` (default
 * "/dashboard") and see `fallback` in the meantime instead of the form.
 *
 *   <GuestGuard>
 *     <LoginForm />
 *   </GuestGuard>
 */
export default function GuestGuard({
  children,
  redirectTo = "/dashboard",
  fallback,
}: GuestGuardProps) {
  const router = useRouter();
  const token = useSyncExternalStore(
    subscribeToken,
    getToken,
    getServerToken
  );
  const isAuthed = token !== null;

  useEffect(() => {
    if (isAuthed) router.replace(redirectTo);
  }, [isAuthed, router, redirectTo]);

  if (isAuthed) {
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
