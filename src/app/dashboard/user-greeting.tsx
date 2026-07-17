"use client";

import { useEffect } from "react";
import { useSyncExternalStore } from "react";
import { fetchMe, getUser, subscribeToken } from "@/lib/auth";

export default function UserGreeting() {
  // Reactive read of the cached user (instant paint if we already have one).
  const user = useSyncExternalStore(subscribeToken, getUser, () => null);

  // Refresh from GET /auth/me on mount; updates the store, which re-renders us.
  useEffect(() => {
    fetchMe().catch(() => {
      // A failed /auth/me (e.g. 401) clears the token; the AuthGuard redirects.
    });
  }, []);

  return (
    <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
      Welcome{user?.name ? `, ${user.name}` : ""} 🎉
    </h1>
  );
}
