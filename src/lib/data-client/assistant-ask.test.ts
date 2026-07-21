import { beforeEach, describe, expect, it, vi } from "vitest";
import { setUser, type User } from "@/lib/auth";
import { formatNestErrorBody, mergeAskIntoThread } from "./assistant-ask";
import { clearStoredThreads, getStoredThread } from "./assistant-thread-store";

const testUser: User = {
  id: "user-1",
  email: "user-1@example.com",
  name: "Test User",
  createdAt: "2026-07-18T00:00:00.000Z",
  updatedAt: "2026-07-18T00:00:00.000Z",
};

describe("mergeAskIntoThread", () => {
  beforeEach(() => {
    window.localStorage.clear();
    setUser(testUser);
    clearStoredThreads();
  });

  it("creates a new local thread from a backend ask response", () => {
    const answer = mergeAskIntoThread(
      { prompt: "What open bugs do I have?" },
      {
        answer: "You have 2 open bugs.",
        provider: "bedrock",
        model: "google.gemma-3-4b-it",
        toolCalls: [
          {
            name: "jira_search",
            arguments: { jql: "type = Bug", connectionId: "c1" },
            ok: true,
          },
        ],
        rounds: 2,
      },
      "2026-07-18T12:00:00.000Z",
    );

    expect(answer.persisted).toBe(true);
    expect(answer.thread.title).toContain("open bugs");
    expect(answer.thread.messages).toHaveLength(2);
    expect(answer.thread.messages[0]?.role).toBe("user");
    expect(answer.thread.messages[0]?.content).toBe(
      "What open bugs do I have?",
    );
    expect(answer.message.role).toBe("assistant");
    expect(answer.message.content).toBe("You have 2 open bugs.");
    expect(answer.message.toolCalls).toEqual([
      {
        name: "jira_search",
        arguments: { jql: "type = Bug", connectionId: "c1" },
        ok: true,
      },
    ]);
    expect(answer.message.model).toBe("google.gemma-3-4b-it");
    expect(getStoredThread(answer.thread.id)?.messages).toHaveLength(2);
  });

  it("appends to an existing thread when threadId is provided", () => {
    const first = mergeAskIntoThread(
      { prompt: "Hello" },
      {
        answer: "Hi.",
        provider: "bedrock",
        model: "m",
        toolCalls: [],
        rounds: 1,
      },
      "2026-07-18T12:00:00.000Z",
    );

    const second = mergeAskIntoThread(
      { prompt: "And blockers?", threadId: first.thread.id },
      {
        answer: "None.",
        provider: "bedrock",
        model: "m",
        toolCalls: [],
        rounds: 1,
      },
      "2026-07-18T12:01:00.000Z",
    );

    expect(second.thread.id).toBe(first.thread.id);
    expect(second.thread.messages).toHaveLength(4);
    expect(getStoredThread(first.thread.id)?.messages).toHaveLength(4);
  });
});

describe("formatNestErrorBody", () => {
  it("reads string messages", () => {
    expect(formatNestErrorBody({ message: "No." }, 400)).toBe("No.");
  });

  it("joins array messages", () => {
    expect(formatNestErrorBody({ message: ["a", "b"] }, 400)).toBe("a b");
  });

  it("includes code when present", () => {
    expect(
      formatNestErrorBody(
        { message: "Model failed", code: "MODEL_AUTH_FAILED" },
        401,
      ),
    ).toMatch(/MODEL_AUTH_FAILED/);
  });
});

describe("httpWorkOsClient.askAssistant integration mapping", () => {
  beforeEach(() => {
    window.localStorage.clear();
    setUser(testUser);
    clearStoredThreads();
    vi.restoreAllMocks();
  });

  it("posts message to the unified /assistant/brain endpoint (All sources) and returns a merged thread", async () => {
    vi.resetModules();
    vi.doMock("@/lib/auth", () => ({
      disconnectIntegration: vi.fn(),
      fetchMe: vi.fn(),
      getUser: vi.fn().mockReturnValue(testUser),
      startNotionOAuth: vi.fn(),
      request: vi.fn().mockResolvedValue({
        answer: "Live answer from Gemma",
        provider: "bedrock",
        model: "google.gemma-3-4b-it",
        toolCalls: [{ name: "jira_search", arguments: { jql: "x" }, ok: true }],
        rounds: 2,
      }),
    }));
    vi.doMock("@/lib/integrations", () => ({
      connectJira: vi.fn(),
      listIntegrations: vi.fn().mockResolvedValue([]),
    }));

    const { httpWorkOsClient } = await import("./http-client");
    const { request } = await import("@/lib/auth");

    const answer = await httpWorkOsClient.askAssistant({
      prompt: "What is blocked?",
    });

    expect(request).toHaveBeenCalledWith(
      "/assistant/brain",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ message: "What is blocked?" }),
      }),
      { authenticated: true },
    );
    expect(answer.message.content).toBe("Live answer from Gemma");
    expect(answer.message.toolCalls?.[0]?.name).toBe("jira_search");
    expect(answer.persisted).toBe(true);
    expect(answer.thread.messages).toHaveLength(2);
  });

  it("posts a server-enforced source filter without rewriting the prompt", async () => {
    vi.resetModules();
    vi.doMock("@/lib/auth", () => ({
      disconnectIntegration: vi.fn(),
      fetchMe: vi.fn(),
      getUser: vi.fn().mockReturnValue(testUser),
      startNotionOAuth: vi.fn(),
      request: vi.fn().mockResolvedValue({
        answer: "Focused on Jira.",
        provider: "groq",
        model: "test",
        toolCalls: [],
        rounds: 1,
        availableConnections: [],
      }),
    }));
    vi.doMock("@/lib/integrations", () => ({
      connectJira: vi.fn(),
      listIntegrations: vi.fn().mockResolvedValue([]),
    }));

    const { httpWorkOsClient } = await import("./http-client");
    const { request } = await import("@/lib/auth");

    await httpWorkOsClient.askAssistant({
      prompt: "What is blocked?",
      sources: ["jira"],
    });

    expect(request).toHaveBeenCalledWith(
      "/assistant/brain",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          message: "What is blocked?",
          sources: ["JIRA"],
        }),
      }),
      { authenticated: true },
    );
    const body = JSON.parse(
      (request as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1]
        .body as string,
    ) as { message: string; sources: string[] };
    expect(body).toEqual({
      message: "What is blocked?",
      sources: ["JIRA"],
    });
  });
});
