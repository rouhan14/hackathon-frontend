"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";
import GuestGuard from "@/components/guest-guard";
import { signup } from "@/lib/auth";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <GuestGuard>
      <main className="min-h-screen bg-slate-50 px-5 py-10 dark:bg-slate-950 sm:px-8">
        <div className="mx-auto max-w-lg">
          <Link href="/" className="mb-9 flex items-center justify-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-white"><Sparkles size={17} /></span><span className="font-semibold">AI Work OS</span></Link>
          <div className="surface-card p-6 sm:p-8">
            <div className="mb-8"><p className="eyebrow">Get started</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">Create your account</h1><p className="mt-2 text-sm leading-6 text-slate-500">Set up your workspace, then connect your first trusted source.</p></div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
              <label><span className="field-label">Name</span><input id="name" type="text" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Ahmad Khan" className="field-input h-12" /></label>
              <label><span className="field-label">Email</span><input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="field-input h-12" /></label>
              <label><span className="field-label">Password</span><input id="password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" className="field-input h-12" /></label>
              <label><span className="field-label">Confirm password</span><input id="confirm" type="password" autoComplete="new-password" value={confirm} onChange={(event) => setConfirm(event.target.value)} placeholder="••••••••" className="field-input h-12" /></label>
              {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">{error}</p>}
              <button type="submit" disabled={loading} className="button-primary mt-1 h-12 w-full">{loading ? "Creating account…" : <>Create account <ArrowRight size={16} /></>}</button>
            </form>
            <p className="mt-7 text-center text-sm text-slate-500">Already have an account? <Link href="/" className="font-semibold text-indigo-700 hover:text-indigo-600 dark:text-indigo-200">Sign in</Link></p>
          </div>
        </div>
      </main>
    </GuestGuard>
  );
}
