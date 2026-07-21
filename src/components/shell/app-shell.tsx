"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Bot,
  CheckSquare,
  ChevronDown,
  CircleUserRound,
  LayoutDashboard,
  Menu,
  Plus,
  Power,
  Settings,
  Sparkles,
  Unplug,
  X,
} from "lucide-react";
import { clearToken } from "@/lib/auth";
import { useWorkOs } from "@/components/providers/work-os-provider";
import JiraCallbackHandler from "@/components/integrations/jira-callback-handler";
import ClickUpCallbackHandler from "@/components/integrations/clickup-callback-handler";
import NotionMcpCallbackHandler from "@/components/integrations/notion-mcp-callback-handler";

const navigation = [
  { href: "/dashboard", label: "Today", icon: LayoutDashboard },
  { href: "/assistant", label: "Ask AI", icon: Bot },
  { href: "/work", label: "Work", icon: CheckSquare },
  { href: "/approvals", label: "Approvals", icon: Sparkles },
  { href: "/integrations", label: "Integrations", icon: Unplug },
];

const titles: Record<string, string> = {
  dashboard: "Today",
  assistant: "Ask AI",
  work: "Work",
  approvals: "Approvals",
  integrations: "Integrations",
  settings: "Settings",
};

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { pendingApprovalCount, integrationNeedsAttention } = useWorkOs();
  return (
    <nav aria-label="Primary" className="mt-6 flex flex-col gap-1">
      {navigation.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`sidebar-link ${active ? "sidebar-link-active" : ""}`}
          >
            <Icon aria-hidden="true" size={18} />
            <span>{item.label}</span>
            {item.href === "/approvals" && pendingApprovalCount > 0 && (
              <span className="ml-auto rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200">
                {pendingApprovalCount}
              </span>
            )}
            {item.href === "/integrations" && integrationNeedsAttention && (
              <span className="ml-auto text-amber-600" aria-label="Connection needs attention">!</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useWorkOs();
  return (
    <div className="flex h-full flex-col">
      <Link href="/dashboard" onClick={onNavigate} className="flex items-center gap-2 px-2 text-slate-950 dark:text-white">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-indigo-600 text-white shadow-sm">
          <Sparkles size={17} aria-hidden="true" />
        </span>
        <span className="font-semibold tracking-tight">AI Work OS</span>
      </Link>
      <Link href="/assistant" onClick={onNavigate} className="button-primary mt-6 w-full justify-center">
        <Plus size={16} aria-hidden="true" /> Ask AI
      </Link>
      <NavLinks onNavigate={onNavigate} />
      <div className="mt-auto border-t border-slate-200 pt-4 dark:border-slate-800">
        <Link href="/settings" onClick={onNavigate} className="sidebar-link">
          <Settings size={18} aria-hidden="true" /> Settings
        </Link>
        <div className="mt-2 flex items-center gap-3 rounded-xl px-3 py-2">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200">
            {user?.name?.charAt(0).toUpperCase() ?? "A"}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{user?.name ?? "Your profile"}</p>
            <p className="truncate text-xs text-slate-500">{user?.email ?? "Loading…"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isMockMode, pendingApprovalCount, user } = useWorkOs();
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const segment = pathname.split("/")[1] || "dashboard";

  useEffect(() => {
    if (mobileOpen) closeButtonRef.current?.focus();
  }, [mobileOpen]);

  function signOut() {
    clearToken();
    router.replace("/");
  }

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-slate-900 dark:text-slate-100">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 bg-[var(--sidebar)] p-5 dark:border-slate-800 lg:block">
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu" onKeyDown={(event) => event.key === "Escape" && setMobileOpen(false)}>
          <button className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />
          <aside className="relative h-full w-[min(84vw,20rem)] bg-[var(--sidebar)] p-5 shadow-2xl">
            <button ref={closeButtonRef} type="button" className="focus-ring absolute right-4 top-4 rounded-lg p-2" onClick={() => setMobileOpen(false)} aria-label="Close navigation">
              <X size={20} />
            </button>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center border-b border-slate-200 bg-[color:var(--header)] px-4 backdrop-blur-xl dark:border-slate-800 sm:px-6">
          <button type="button" className="focus-ring -ml-2 mr-3 rounded-lg p-2 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
            <Menu size={21} />
          </button>
          <div>
            <h1 className="font-semibold tracking-tight text-slate-950 dark:text-white">{titles[segment] ?? "AI Work OS"}</h1>
            {isMockMode && <p className="hidden text-[11px] font-medium text-indigo-600 dark:text-indigo-300 sm:block">Demo data</p>}
          </div>
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <Link href="/approvals" className="focus-ring relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label={`${pendingApprovalCount} pending approvals`}>
              <Bell size={19} />
              {pendingApprovalCount > 0 && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-indigo-600 ring-2 ring-white dark:ring-slate-950" />}
            </Link>
            <details className="group relative">
              <summary className="focus-ring flex cursor-pointer list-none items-center gap-2 rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200">{user?.name?.charAt(0).toUpperCase() ?? <CircleUserRound size={18} />}</span>
                <ChevronDown className="hidden text-slate-400 sm:block" size={14} />
              </summary>
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-950">
                <div className="px-3 py-2">
                  <p className="truncate text-sm font-medium">{user?.name ?? "Profile"}</p>
                  <p className="truncate text-xs text-slate-500">{user?.email}</p>
                </div>
                <Link href="/settings" className="sidebar-link"><Settings size={16} /> Settings</Link>
                <button type="button" className="sidebar-link w-full" onClick={signOut}><Power size={16} /> Sign out</button>
              </div>
            </details>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 sm:py-8 xl:px-10">{children}</main>
      </div>
      <Suspense fallback={null}>
        <JiraCallbackHandler />
        <ClickUpCallbackHandler />
        <NotionMcpCallbackHandler />
      </Suspense>
    </div>
  );
}
