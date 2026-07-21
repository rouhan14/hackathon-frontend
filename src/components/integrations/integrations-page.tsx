"use client";

import { useCallback, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  Clock3,
  FileText,
  ListChecks,
  Plus,
  RefreshCw,
  ShieldCheck,
  Tickets,
  Unplug,
} from "lucide-react";
import { useWorkOs } from "@/components/providers/work-os-provider";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ClickUpTaskExplorer } from "@/components/integrations/clickup-task-explorer";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/shared/states";
import type { Integration } from "@/lib/data-client/types";
import { useAsyncResource } from "@/lib/use-async-resource";

const statusLabels: Record<Integration["status"], string> = {
  disconnected: "Disconnected",
  connecting: "Connecting",
  connected: "Connected",
  "no-sites": "No additional sites",
  "permission-required": "Permission required",
  "reauth-required": "Reconnect required",
  error: "Connection error",
};

type ConnectableProvider = "jira" | "notion" | "clickup";

function providerName(provider: ConnectableProvider): string {
  if (provider === "clickup") return "ClickUp";
  return provider === "jira" ? "Jira" : "Notion";
}

function IntegrationCard({ integration, onConnect, onDisconnect, busy }: { integration: Integration; onConnect(): void; onDisconnect(): void; busy: boolean }) {
  const connected = integration.status === "connected";
  const warning = ["permission-required", "reauth-required", "error", "no-sites"].includes(integration.status);
  const Icon = integration.provider === "jira" ? Tickets : integration.provider === "clickup" ? ListChecks : FileText;

  // Determine description based on provider
  let description = "";
  if (integration.provider === "jira") {
    description = "Bring Jira issues, projects, blockers, and safe update proposals into your work view.";
  } else if (integration.provider === "clickup") {
    description = "Search tasks and retrieve current task details from the workspaces selected during ClickUp consent.";
  } else if (integration.provider === "notion") {
    description = "Search trusted workspace pages and databases alongside your operational work.";
  }

  return (
    <article className="surface-card flex flex-col p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><span className={`grid h-11 w-11 place-items-center rounded-xl ${integration.provider === "jira" ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-200" : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-white"}`}><Icon size={21} /></span><div><h3 className="font-semibold text-slate-950 dark:text-white">{integration.name}</h3><p className={`mt-0.5 flex items-center gap-1 text-xs font-medium ${warning ? "text-amber-700 dark:text-amber-300" : connected ? "text-emerald-700 dark:text-emerald-300" : "text-slate-500"}`}>{warning ? <AlertTriangle size={13} /> : connected ? <Check size={13} /> : <Unplug size={13} />}{statusLabels[integration.status]}</p></div></div></div>
      <p className="mt-5 text-sm leading-6 text-slate-500">{description}</p>
      {(integration.accountName || integration.workspaceName) && <dl className="mt-5 grid gap-3 rounded-xl bg-slate-50 p-4 text-sm dark:bg-slate-900"><div><dt className="text-xs text-slate-500">Account</dt><dd className="mt-1 font-medium">{integration.accountName ?? "Connected account"}</dd></div><div><dt className="text-xs text-slate-500">Workspace / site</dt><dd className="mt-1 font-medium">{integration.workspaceName ?? "Default workspace"}</dd></div></dl>}
      {integration.warning && <div role="alert" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-100">{integration.warning}</div>}
      {connected && <div className="mt-5"><p className="eyebrow">Granted capabilities</p><ul className="mt-3 flex flex-wrap gap-2">{integration.grantedCapabilities.map((capability) => <li key={capability} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300"><ShieldCheck size={12} />{capability}</li>)}</ul>{integration.lastSuccessfulActivity && <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-500"><Clock3 size={13} />Last activity {new Date(integration.lastSuccessfulActivity).toLocaleString()}</p>}</div>}
      <div className="mt-auto flex flex-wrap gap-3 pt-6">{connected ? <button type="button" className="button-danger flex-1" disabled={busy} onClick={onDisconnect}><Unplug size={15} />Disconnect</button> : <button type="button" className="button-primary flex-1" disabled={busy} onClick={onConnect}>{integration.status === "reauth-required" ? <RefreshCw size={15} /> : <Plus size={15} />}{integration.status === "reauth-required" ? "Reconnect" : busy ? "Connecting…" : `Connect ${integration.name}`}</button>}</div>
    </article>
  );
}

export function IntegrationsPage() {
  const { client, isMockMode, version, refresh, notify } = useWorkOs();
  const [busyProvider, setBusyProvider] = useState<ConnectableProvider | null>(null);
  const [disconnecting, setDisconnecting] = useState<Integration | null>(null);
  const [disconnectBusy, setDisconnectBusy] = useState(false);
  const load = useCallback((signal: AbortSignal) => client.listIntegrations({ signal }), [client]);
  const resource = useAsyncResource(load, [version]);
  const cards = useMemo(() => {
    if (resource.status !== "ready") return [];
    const rows = [...resource.data];
    // Add Jira if not present
    if (!rows.some((row) => row.provider === "jira")) {
      rows.push({
        id: `disconnected-jira`,
        provider: "jira",
        name: "Jira",
        status: "disconnected",
        grantedCapabilities: [],
        supportsMultipleSites: true,
      });
    }

    // Add ClickUp if not present
    if (!rows.some((row) => row.provider === "clickup")) {
      rows.push({
        id: `disconnected-clickup`,
        provider: "clickup",
        name: "ClickUp",
        status: "disconnected",
        grantedCapabilities: [],
      });
    }

    // Add Notion if not present
    if (!rows.some((row) => row.provider === "notion")) {
      rows.push({
        id: `disconnected-notion`,
        provider: "notion",
        name: "Notion",
        status: "disconnected",
        grantedCapabilities: [],
      });
    }

    return rows;
  }, [resource]);

  async function connect(provider: ConnectableProvider) {
    setBusyProvider(provider);
    try {
      await client.connectIntegration(provider);
      if (isMockMode) notify(`${providerName(provider)} connected in demo mode. No external account changed.`, "success");
      refresh();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not start connection.", "error");
    } finally {
      setBusyProvider(null);
    }
  }

  async function disconnect() {
    if (!disconnecting) return;
    setDisconnectBusy(true);
    try {
      await client.disconnectIntegration(disconnecting.id);
      notify(`${disconnecting.name} disconnected${isMockMode ? " from local demo state" : ""}.`, "success");
      setDisconnecting(null);
      refresh();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not disconnect.", "error");
    } finally {
      setDisconnectBusy(false);
    }
  }

  function getConnectProvider(integration: Integration): ConnectableProvider {
    if (integration.provider === "jira") return "jira";
    if (integration.provider === "clickup") return "clickup";
    return "notion";
  }

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="eyebrow">Connected sources</p><h2 className="page-title mt-2">Bring trusted work into one place</h2><p className="page-description">Manage provider accounts, authorized sites, capabilities, and connection health.</p></div>{isMockMode && <div className="max-w-sm rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-xs leading-5 text-indigo-800 dark:border-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-100"><strong>Demo data:</strong> Connect and disconnect actions are local simulations. They never open OAuth or change an external account.</div>}</div>
      <div className="mt-7">
        {resource.status === "loading" && <div className="grid gap-4 lg:grid-cols-2"><LoadingSkeleton lines={4} /><LoadingSkeleton lines={4} /></div>}
        {resource.status === "error" && <ErrorState error={resource.error} onRetry={resource.retry} />}
        {resource.status === "ready" && cards.length === 0 && <EmptyState title="No workplace providers available" description="Provider cards will appear when a connection is supported." />}
        {resource.status === "ready" && <div className="grid gap-4 lg:grid-cols-2">{cards.map((integration) => <IntegrationCard key={integration.id} integration={integration} busy={busyProvider === getConnectProvider(integration)} onConnect={() => void connect(getConnectProvider(integration))} onDisconnect={() => setDisconnecting(integration)} />)}</div>}
      </div>
      {resource.status === "ready" && !isMockMode && cards.filter((item) => item.provider === "clickup" && item.status === "connected").map((item) => <ClickUpTaskExplorer key={item.id} connectionId={item.id} onReconnect={() => void connect("clickup")} />)}
      {resource.status === "ready" && cards.some((item) => item.provider === "jira" && item.status === "connected") && <section className="mt-5 flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950 sm:flex-row sm:items-center"><div><h3 className="font-semibold">Need another Jira site?</h3><p className="mt-1 text-sm text-slate-500">Authorize an additional site without removing the existing connection.</p></div><button type="button" className="button-secondary shrink-0" disabled={busyProvider !== null} onClick={() => void connect("jira")}><Plus size={15} />Connect another site</button></section>}
      <ConfirmDialog open={disconnecting !== null} title={`Disconnect ${disconnecting?.name ?? "provider"}?`} description="This removes the selected connection from AI Work OS. Other provider sites stay connected." confirmLabel="Disconnect" tone="danger" busy={disconnectBusy} onConfirm={() => void disconnect()} onClose={() => !disconnectBusy && setDisconnecting(null)} />
    </div>
  );
}