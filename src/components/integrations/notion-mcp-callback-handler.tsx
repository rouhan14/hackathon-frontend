"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useWorkOs } from "@/components/providers/work-os-provider";

export function notionMcpCallbackNotice(
  status: string | null,
  errorMsg: string | null,
): { message: string; tone: "success" | "warning" | "error" } | null {
  if (status === "connected") {
    return {
      message: "Notion AI Assistant connected successfully.",
      tone: "success",
    };
  }
  if (status === "error") {
    return {
      message: errorMsg 
        ? `Could not connect Notion AI Assistant: ${errorMsg}` 
        : "Could not connect Notion AI Assistant. Open Integrations to try again.",
      tone: "error",
    };
  }
  return null;
}

export default function NotionMcpCallbackHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isMockMode, notify, refresh } = useWorkOs();
  const handled = useRef(false);

  useEffect(() => {
    const status = searchParams.get("notion_mcp");
    const type = searchParams.get("type");
    const errorMsg = searchParams.get("error");
    
    // Only handle if this is a Notion MCP callback (type=mcp)
    if (type !== "mcp") return;
    
    const notice = notionMcpCallbackNotice(status, errorMsg);
    if (handled.current || !notice) return;
    handled.current = true;
    notify(notice.message, notice.tone);
    if (status === "connected") {
      refresh();
    }
    const url = new URL(window.location.href);
    url.searchParams.delete("notion_mcp");
    url.searchParams.delete("type");
    url.searchParams.delete("error");
    const next = `${url.pathname}${url.search ? url.search : ""}`;
    window.history.replaceState({}, "", next);
    router.replace(next, { scroll: false });
  }, [isMockMode, notify, refresh, router, searchParams]);

  return null;
}
