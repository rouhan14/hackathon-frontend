"use client";

import { useRouter } from "next/navigation";
import { clearToken } from "@/lib/auth";

export default function SignOutButton() {
  const router = useRouter();

  function handleSignOut() {
    clearToken();
    router.push("/");
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="rounded-full border border-black/[.12] px-4 py-2 text-sm font-medium text-zinc-800 transition-colors hover:bg-black/[.04] dark:border-white/[.16] dark:text-zinc-200 dark:hover:bg-white/[.06]"
    >
      Sign out
    </button>
  );
}
