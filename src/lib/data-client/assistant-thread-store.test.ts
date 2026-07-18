import { beforeEach, describe, expect, it } from "vitest";
import { setUser, type User } from "@/lib/auth";
import type { AssistantThread } from "./types";
import {
  getStoredThread,
  listStoredThreads,
  upsertStoredThread,
} from "./assistant-thread-store";

function user(id: string): User {
  return {
    id,
    email: `${id}@example.com`,
    name: id,
    createdAt: "2026-07-18T00:00:00.000Z",
    updatedAt: "2026-07-18T00:00:00.000Z",
  };
}

function thread(id: string): AssistantThread {
  return {
    id,
    title: id,
    messages: [],
    createdAt: "2026-07-18T00:00:00.000Z",
    updatedAt: "2026-07-18T00:00:00.000Z",
  };
}

describe("assistant thread storage ownership", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("keeps each account's conversations isolated on a shared browser", () => {
    setUser(user("user-a"));
    upsertStoredThread(thread("thread-a"));

    setUser(user("user-b"));
    expect(listStoredThreads()).toEqual([]);
    expect(getStoredThread("thread-a")).toBeNull();
    upsertStoredThread(thread("thread-b"));

    setUser(user("user-a"));
    expect(listStoredThreads().map((item) => item.id)).toEqual(["thread-a"]);
    expect(getStoredThread("thread-b")).toBeNull();
  });
});
