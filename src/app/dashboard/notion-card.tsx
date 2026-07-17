"use client";

import { useSyncExternalStore } from "react";
import IntegrationCard from "@/components/integration-card";
import {
  disconnectIntegration,
  getUser,
  startNotionOAuth,
  subscribeToken,
} from "@/lib/auth";

export default function NotionCard() {
  // Reactively read the cached user (refreshed from /auth/me by UserGreeting).
  const user = useSyncExternalStore(subscribeToken, getUser, () => null);
  const notion = user?.integrations?.find(
    (integration) => integration.provider === "notion"
  );

  return (
    <IntegrationCard
      name="Notion"
      description="Sync your pages and databases with Notion."
      icon={<span className="text-base font-bold">N</span>}
      connected={!!notion}
      onConnect={startNotionOAuth}
      onDisconnect={
        notion
          ? async () => {
              await disconnectIntegration(notion.id);
            }
          : undefined
      }
    />
  );
}
