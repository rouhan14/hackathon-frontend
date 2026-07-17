"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  login,
  getAuthNotice,
  getServerAuthNotice,
  setAuthNotice,
  subscribeAuthNotice,
} from "@/lib/auth";
import GuestGuard from "@/components/guest-guard";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Reason the previous session ended (e.g. expired token), if any.
  const notice = useSyncExternalStore(
    subscribeAuthNotice,
    getAuthNotice,
    getServerAuthNotice
  );

  // Clear the notice when leaving the page so it only shows once.
  useEffect(() => {
    return () => setAuthNotice(null);
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setError("");
    setAuthNotice(null);
    setLoading(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <GuestGuard>
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16 dark:bg-black">
      <div className="w-full max-w-sm rounded-2xl border border-black/[.08] bg-white p-8 shadow-sm dark:border-white/[.12] dark:bg-zinc-950">
        <div className="mb-8 flex flex-col gap-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
            Welcome back
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Sign in to continue to your dashboard.
          </p>
        </div>

        {notice && (
          <div
            role="status"
            className="mb-5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400"
          >
            {notice} Please sign in again.
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
          <div className="flex flex-col gap-2">
            <label
              htmlFor="email"
              className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="h-11 rounded-lg border border-black/[.12] bg-transparent px-3 text-sm text-black outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-500 dark:border-white/[.16] dark:text-zinc-50"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="password"
              className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-11 rounded-lg border border-black/[.12] bg-transparent px-3 text-sm text-black outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-500 dark:border-white/[.16] dark:text-zinc-50"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 h-11 rounded-full bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-[#ccc]"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-500">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-medium text-zinc-900 dark:text-zinc-100"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
    </GuestGuard>
  );
}
