"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signup } from "@/lib/auth";
import GuestGuard from "@/components/guest-guard";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!name || !email || !password || !confirm) {
      setError("Please fill in all fields.");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      await signup(name, email, password);
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
            Create your account
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Sign up to get started with your dashboard.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
          <div className="flex flex-col gap-2">
            <label
              htmlFor="name"
              className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
            >
              Name
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
              className="h-11 rounded-lg border border-black/[.12] bg-transparent px-3 text-sm text-black outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-500 dark:border-white/[.16] dark:text-zinc-50"
            />
          </div>

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
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-11 rounded-lg border border-black/[.12] bg-transparent px-3 text-sm text-black outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-500 dark:border-white/[.16] dark:text-zinc-50"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="confirm"
              className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
            >
              Confirm password
            </label>
            <input
              id="confirm"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
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
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-500">
          Already have an account?{" "}
          <Link
            href="/"
            className="font-medium text-zinc-900 dark:text-zinc-100"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
    </GuestGuard>
  );
}
