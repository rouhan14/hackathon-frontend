import { getUser } from "@/lib/auth";
import type { AssistantThread } from "./types";

const STORAGE_KEY_PREFIX = "ai-work-os-assistant-threads-v1";

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function storageKey(): string | null {
  const userId = getUser()?.id.trim();
  return userId ? `${STORAGE_KEY_PREFIX}:${encodeURIComponent(userId)}` : null;
}

function readAll(): AssistantThread[] {
  if (!canUseStorage()) return [];
  try {
    const key = storageKey();
    if (!key) return [];
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AssistantThread[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(threads: AssistantThread[]): void {
  if (!canUseStorage()) return;
  const key = storageKey();
  if (!key) return;
  window.localStorage.setItem(key, JSON.stringify(threads));
}

export function listStoredThreads(): AssistantThread[] {
  return readAll().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getStoredThread(id: string): AssistantThread | null {
  return readAll().find((thread) => thread.id === id) ?? null;
}

export function upsertStoredThread(thread: AssistantThread): void {
  const threads = readAll().filter((item) => item.id !== thread.id);
  threads.push(thread);
  writeAll(threads);
}

export function clearStoredThreads(): void {
  if (!canUseStorage()) return;
  const key = storageKey();
  if (!key) return;
  window.localStorage.removeItem(key);
}

export function titleFromPrompt(prompt: string): string {
  const trimmed = prompt.trim();
  return trimmed.length > 42 ? `${trimmed.slice(0, 39)}…` : trimmed;
}

export function newThreadId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `thread-${crypto.randomUUID()}`;
  }
  return `thread-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
