"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import GuestGuard from "@/components/guest-guard";
import {
  getAuthNotice,
  getServerAuthNotice,
  login,
  setAuthNotice,
  subscribeAuthNotice,
} from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const notice = useSyncExternalStore(
    subscribeAuthNotice,
    getAuthNotice,
    getServerAuthNotice,
  );

  useEffect(() => () => setAuthNotice(null), []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <GuestGuard>
      <main className="grid min-h-screen bg-slate-50 dark:bg-slate-950 lg:grid-cols-[1.05fr_.95fr]">
        <section className="relative hidden overflow-hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-indigo-500/25 blur-3xl" />
          <div className="relative flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-500"><Sparkles size={19} /></span><span className="text-lg font-semibold">AI Work OS</span></div>
          <div className="relative max-w-xl"><p className="text-xs font-semibold uppercase tracking-[.18em] text-indigo-300">Your work, understood</p><h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight">One calm place to find priorities, evidence, and the next safe action.</h1><p className="mt-5 max-w-lg text-base leading-8 text-slate-300">Bring tasks, issues, documents, meetings, and follow-ups into a single source-aware workplace assistant.</p><div className="mt-8 flex items-center gap-2 text-sm text-slate-300"><ShieldCheck size={17} className="text-emerald-300" />External changes always require your approval.</div></div>
          <p className="relative text-xs text-slate-500">AI Work OS · Frontend MVP</p>
        </section>
        <section className="flex items-center justify-center px-5 py-12 sm:px-10">
          <div className="w-full max-w-md">
            <Link href="/" className="mb-9 flex items-center gap-2 lg:hidden"><span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-white"><Sparkles size={17} /></span><span className="font-semibold">AI Work OS</span></Link>
            <div className="mb-8"><p className="eyebrow">Welcome back</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">Sign in to your workspace</h1><p className="mt-2 text-sm leading-6 text-slate-500">Continue to today’s priorities, sources, and proposals.</p></div>
            {notice && <div role="status" className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">{notice} Please sign in again.</div>}
            <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
              <label><span className="field-label">Email</span><input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="field-input h-12" /></label>
              <label><span className="field-label">Password</span><input id="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" className="field-input h-12" /></label>
              {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">{error}</p>}
              <button type="submit" disabled={loading} className="button-primary mt-1 h-12 w-full">{loading ? "Signing in…" : <>Sign in <ArrowRight size={16} /></>}</button>
            </form>
            <p className="mt-7 text-center text-sm text-slate-500">Don&apos;t have an account? <Link href="/signup" className="font-semibold text-indigo-700 hover:text-indigo-600 dark:text-indigo-200">Sign up</Link></p>
          </div>
        </section>
      </main>
    </GuestGuard>
  );
}
