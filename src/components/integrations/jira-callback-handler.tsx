"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { refreshAfterJiraConnect } from "@/lib/integrations";
import { useWorkOs } from "@/components/providers/work-os-provider";

export function jiraCallbackNotice(
  status: string | null,
  count: string | null,
): { message: string; tone: "success" | "warning" | "error" } | null {
  if (status === "connected") {
    return {
      message: `Jira connected successfully.${count && Number(count) > 0 ? ` Connected ${count} site${count === "1" ? "" : "s"}.` : ""}`,
      tone: "success",
    };
  }
  if (status === "no-sites") {
    return {
      message:
        "No additional Jira site was authorized. Your existing connection remains active.",
      tone: "warning",
    };
  }
  if (status === "error") {
    return {
      message: "Could not connect Jira. Open Integrations to try again.",
      tone: "error",
    };
  }
  return null;
}

export default function JiraCallbackHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isMockMode, notify, refresh } = useWorkOs();
  const handled = useRef(false);

  useEffect(() => {
    const status = searchParams.get("jira");
    const notice = jiraCallbackNotice(status, searchParams.get("jiraSites"));
    if (handled.current || !notice) return;
    handled.current = true;
    notify(notice.message, notice.tone);
    if (status === "connected") {
      if (!isMockMode) void refreshAfterJiraConnect().finally(refresh);
      else refresh();
    }
    const url = new URL(window.location.href);
    url.searchParams.delete("jira");
    url.searchParams.delete("jiraSites");
    const next = `${url.pathname}${url.search ? url.search : ""}`;
    window.history.replaceState({}, "", next);
    router.replace(next, { scroll: false });
  }, [isMockMode, notify, refresh, router, searchParams]);

  return null;
}
