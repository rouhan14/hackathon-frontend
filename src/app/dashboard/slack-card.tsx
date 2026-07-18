"use client";

import { useSyncExternalStore } from "react";
import IntegrationCard from "@/components/integration-card";
import {
  disconnectIntegration,
  getUser,
  startSlackOAuth,
  subscribeToken,
} from "@/lib/auth";

export default function SlackCard() {
  const user = useSyncExternalStore(subscribeToken, getUser, () => null);
  const slack = user?.integrations?.find(
    (integration) => integration.provider === "SLACK"
  );

  return (
    <IntegrationCard
      name="Slack"
      description="Connect your workspace and keep Slack activity in sync."
      icon={<span className="text-base font-bold">S</span>}
      connected={!!slack}
      onConnect={startSlackOAuth}
      onDisconnect={
        slack
          ? async () => {
              await disconnectIntegration(slack.id);
            }
          : undefined
      }
    />
  );
}
