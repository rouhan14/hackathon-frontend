"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useWorkOs } from "@/components/providers/work-os-provider";
import { refreshAfterClickUpConnect } from "@/lib/integrations";

export function clickUpCallbackNotice(
  status: string | null,
): { message: string; tone: "success" | "warning" | "error" } | null {
  if (status === "connected") {
    return { message: "ClickUp connected successfully.", tone: "success" };
  }
  if (status === "unsupported") {
    return {
      message: "ClickUp did not expose the required read tools. No connection was saved.",
      tone: "warning",
    };
  }
  if (status === "error") {
    return {
      message: "Could not connect ClickUp. Open Integrations to try again.",
      tone: "error",
    };
  }
  return null;
}

export default function ClickUpCallbackHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isMockMode, notify, refresh } = useWorkOs();
  const handled = useRef(false);

  useEffect(() => {
    const notice = clickUpCallbackNotice(searchParams.get("clickup"));
    if (handled.current || !notice) return;
    handled.current = true;
    notify(notice.message, notice.tone);
    if (!isMockMode) void refreshAfterClickUpConnect().finally(refresh);
    else refresh();

    const url = new URL(window.location.href);
    url.searchParams.delete("clickup");
    const next = `${url.pathname}${url.search}`;
    window.history.replaceState({}, "", next);
    router.replace(next, { scroll: false });
  }, [isMockMode, notify, refresh, router, searchParams]);

  return null;
}
