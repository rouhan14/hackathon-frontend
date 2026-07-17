"use client";

import { useState } from "react";

type IntegrationCardProps = {
  name: string;
  description: string;
  icon?: React.ReactNode;
  onConnect?: () => void;
  /** Called when disconnecting a connected integration. May be async. */
  onDisconnect?: () => void | Promise<void>;
  /** Force the "connected" state, e.g. when the account already has it linked. */
  connected?: boolean;
};

type Status = "idle" | "connecting" | "disconnecting";

export default function IntegrationCard({
  name,
  description,
  icon,
  onConnect,
  onDisconnect,
  connected: connectedProp = false,
}: IntegrationCardProps) {
  const [status, setStatus] = useState<Status>("idle");
  // Local fallback for demo cards with no real connect handler.
  const [localConnected, setLocalConnected] = useState(false);

  const connected = connectedProp || localConnected;
  const busy = status !== "idle";

  async function handleClick() {
    if (busy) return;

    if (connected) {
      if (!onDisconnect) {
        setLocalConnected(false);
        return;
      }
      setStatus("disconnecting");
      try {
        await onDisconnect();
      } finally {
        setStatus("idle");
      }
      return;
    }

    setStatus("connecting");
    if (onConnect) {
      onConnect();
      return; // Expected to navigate away (OAuth redirect).
    }
    // Placeholder — no OAuth flow wired up for this integration.
    setTimeout(() => {
      setLocalConnected(true);
      setStatus("idle");
    }, 800);
  }

  const label =
    status === "disconnecting"
      ? "Disconnecting…"
      : status === "connecting"
        ? "Connecting…"
        : connected
          ? "Disconnect"
          : "Connect";

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-black/[.08] bg-white p-5 dark:border-white/[.12] dark:bg-zinc-950">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-sm font-semibold text-black dark:bg-zinc-800 dark:text-zinc-50">
          {icon ?? name.charAt(0)}
        </div>
        <span className="font-medium text-black dark:text-zinc-50">{name}</span>
      </div>

      <p className="flex-1 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
        {description}
      </p>

      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        aria-live="polite"
        className={
          connected
            ? "h-10 rounded-full border border-red-600/30 bg-red-600/10 px-4 text-sm font-medium text-red-600 transition-colors hover:bg-red-600/20 disabled:cursor-not-allowed disabled:opacity-60 dark:text-red-400"
            : "h-10 rounded-full bg-foreground px-4 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-[#ccc]"
        }
      >
        {label}
      </button>
    </div>
  );
}
