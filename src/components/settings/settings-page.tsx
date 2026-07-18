"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Building2, Clock3, Database, MonitorCog, Power, RotateCcw, Save, Shield, UserRound } from "lucide-react";
import { clearToken } from "@/lib/auth";
import { useWorkOs } from "@/components/providers/work-os-provider";
import { applyTheme } from "@/components/providers/theme-provider";
import { ErrorState, LoadingSkeleton } from "@/components/shared/states";
import { getMockScenario, resetMockState, setMockScenario } from "@/lib/data-client/mock-client";
import type { MockScenario, UserSettings } from "@/lib/data-client/types";
import { useAsyncResource } from "@/lib/use-async-resource";

const scenarios: Array<{ value: MockScenario; label: string }> = [
  { value: "first-time", label: "First-time onboarding" },
  { value: "returning", label: "Returning user" },
  { value: "partial", label: "Partial / stale data" },
  { value: "permission-required", label: "Permission required" },
  { value: "reauth-required", label: "Reauthentication required" },
  { value: "recoverable-error", label: "Recoverable error" },
  { value: "unexpected-error", label: "Unexpected error" },
];

function Section({ icon: Icon, title, description, children }: { icon: typeof UserRound; title: string; description: string; children: React.ReactNode }) {
  return <section className="surface-card"><div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200"><Icon size={18} /></span><div><h3 className="font-semibold">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-500">{description}</p></div></div><div className="mt-6">{children}</div></section>;
}

function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange(checked: boolean): void; label: string; description: string }) {
  return <label className="flex cursor-pointer items-start justify-between gap-5 py-3"><span><span className="block text-sm font-medium">{label}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span></span><input type="checkbox" className="peer sr-only" checked={checked} onChange={(event) => onChange(event.target.checked)} /><span className="relative mt-1 h-6 w-11 shrink-0 rounded-full bg-slate-200 transition peer-checked:bg-indigo-600 peer-focus-visible:ring-4 peer-focus-visible:ring-indigo-200 after:absolute after:left-1 after:top-1 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-5 dark:bg-slate-700" aria-hidden="true" /></label>;
}

export function SettingsPage() {
  const { client, isMockMode, version, refresh, user, notify } = useWorkOs();
  const router = useRouter();
  const [draft, setDraft] = useState<UserSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [scenario, setScenario] = useState<MockScenario>("first-time");
  const load = useCallback((signal: AbortSignal) => client.getSettings({ signal }), [client]);
  const resource = useAsyncResource(load, [version]);

  useEffect(() => {
    if (isMockMode) queueMicrotask(() => setScenario(getMockScenario()));
  }, [isMockMode, version]);

  const settings = draft ?? (resource.status === "ready" ? resource.data : null);

  async function save() {
    if (!settings) return;
    setSaving(true);
    try {
      const updated = await client.updateSettings(settings);
      setDraft(updated);
      applyTheme(updated.appearance);
      notify("Preferences saved.", "success");
      refresh();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not save preferences.", "error");
    } finally { setSaving(false); }
  }

  function signOut() { clearToken(); router.replace("/"); }

  if (resource.status === "loading") return <LoadingSkeleton lines={8} />;
  if (resource.status === "error") return <div><div className="mb-6"><p className="eyebrow">Personal settings</p><h2 className="page-title mt-2">Shape your workspace</h2></div><ErrorState error={resource.error} onRetry={resource.retry} /></div>;
  if (!settings) return null;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="eyebrow">Personal settings</p><h2 className="page-title mt-2">Shape your workspace</h2><p className="page-description">Manage your profile, daily rhythm, notifications, appearance, and privacy.</p></div><button type="button" className="button-primary self-start" onClick={() => void save()} disabled={saving}><Save size={15} />{saving ? "Saving…" : "Save changes"}</button></div>
      <div className="mt-7 grid gap-5">
        <Section icon={UserRound} title="Profile" description="Your account identity comes from the existing authentication service."><div className="grid gap-4 sm:grid-cols-2"><label><span className="field-label">Name</span><input className="field-input bg-slate-50 dark:bg-slate-900" value={user?.name ?? ""} readOnly /></label><label><span className="field-label">Email</span><input className="field-input bg-slate-50 dark:bg-slate-900" value={user?.email ?? ""} readOnly /></label></div></Section>
        <Section icon={Building2} title="Organization" description="The workspace name shown across AI Work OS."><label><span className="field-label">Organization name</span><input className="field-input max-w-lg" value={settings.organization} onChange={(event) => setDraft({ ...settings, organization: event.target.value })} /></label></Section>
        <div className="grid gap-5 lg:grid-cols-2">
          <Section icon={Clock3} title="Daily brief" description="Choose when and where your working day starts."><div className="grid gap-4 sm:grid-cols-2"><label><span className="field-label">Time zone</span><select className="field-select" value={settings.timeZone} onChange={(event) => setDraft({ ...settings, timeZone: event.target.value })}><option value="Asia/Karachi">Asia/Karachi</option><option value="UTC">UTC</option><option value="America/New_York">America/New York</option><option value="Europe/London">Europe/London</option></select></label><label><span className="field-label">Brief time</span><input type="time" className="field-input" value={settings.dailyBriefTime} onChange={(event) => setDraft({ ...settings, dailyBriefTime: event.target.value })} /></label></div></Section>
          <Section icon={MonitorCog} title="Appearance" description="Use a light, dark, or system-matched interface."><fieldset><legend className="sr-only">Appearance</legend><div className="grid grid-cols-3 gap-2">{(["light", "dark", "system"] as const).map((appearance) => <label key={appearance} className={`cursor-pointer rounded-xl border p-3 text-center text-sm font-medium capitalize ${settings.appearance === appearance ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200" : "border-slate-200 dark:border-slate-800"}`}><input type="radio" name="appearance" value={appearance} checked={settings.appearance === appearance} onChange={() => { setDraft({ ...settings, appearance }); applyTheme(appearance); }} className="sr-only" />{appearance}</label>)}</div></fieldset></Section>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <Section icon={Bell} title="Notifications" description="Control operational reminders and proposal alerts."><div className="divide-y divide-slate-100 dark:divide-slate-800"><Toggle checked={settings.emailNotifications} onChange={(emailNotifications) => setDraft({ ...settings, emailNotifications })} label="Daily brief email" description="Receive your daily work summary by email." /><Toggle checked={settings.approvalNotifications} onChange={(approvalNotifications) => setDraft({ ...settings, approvalNotifications })} label="Approval alerts" description="Notify me when a proposed write action needs review." /></div></Section>
          <Section icon={Shield} title="Data and privacy" description="Choose whether this browser keeps local conversation history."><Toggle checked={settings.allowLocalHistory} onChange={(allowLocalHistory) => setDraft({ ...settings, allowLocalHistory })} label="Store local history" description="Keep mock conversations and decisions in this browser. Provider credentials are never stored here." /></Section>
        </div>
        {process.env.NODE_ENV !== "production" && isMockMode && <Section icon={Database} title="Development scenarios" description="Switch the entire frontend among deterministic loading, empty, partial, permission, reauthentication, and error states."><div className="flex flex-col gap-3 sm:flex-row"><label className="flex-1"><span className="field-label">Mock scenario</span><select className="field-select" value={scenario} onChange={(event) => { const next = event.target.value as MockScenario; setMockScenario(next); setScenario(next); refresh(); notify(`Mock scenario changed to ${scenarios.find((item) => item.value === next)?.label}.`, "info"); }}>{scenarios.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><button type="button" className="button-secondary self-end" onClick={() => { resetMockState(); setScenario("first-time"); refresh(); notify("Mock state reset to first-time onboarding.", "success"); }}><RotateCcw size={15} />Reset mock state</button></div></Section>}
        <section className="surface-card flex flex-col justify-between gap-4 border-red-100 sm:flex-row sm:items-center dark:border-red-950"><div><h3 className="font-semibold">Sign out</h3><p className="mt-1 text-sm text-slate-500">End this application session on the current browser.</p></div><button type="button" className="button-danger shrink-0" onClick={signOut}><Power size={15} />Sign out</button></section>
      </div>
    </div>
  );
}
