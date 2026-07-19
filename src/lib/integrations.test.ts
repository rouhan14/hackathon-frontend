import { beforeEach, describe, expect, it, vi } from "vitest";

const authMocks = vi.hoisted(() => ({
  authFetch: vi.fn(),
  clearToken: vi.fn(),
  setAuthNotice: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  ...authMocks,
  disconnectIntegration: vi.fn(),
  fetchMe: vi.fn(),
  request: vi.fn(),
}));

import { getClickUpTask, searchClickUp } from "./integrations";

function response(ok: boolean, status: number, data: unknown): Response {
  return { ok, status, json: vi.fn().mockResolvedValue(data) } as unknown as Response;
}

describe("ClickUp API helpers", () => {
  beforeEach(() => vi.clearAllMocks());

  it("trims the query, clamps the limit, and uses the normalized backend route", async () => {
    authMocks.authFetch.mockResolvedValue(response(true, 200, { tasks: [] }));

    await searchClickUp("connection / one", "  blocked tasks  ", 100);

    expect(authMocks.authFetch).toHaveBeenCalledWith(
      "/integrations/clickup/connection%20%2F%20one/search",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ query: "blocked tasks", limit: 25 }),
      }),
    );
  });

  it("surfaces rate limiting without retrying", async () => {
    authMocks.authFetch.mockResolvedValue(response(false, 429, {
      code: "CLICKUP_RATE_LIMITED",
      message: "Wait for the quota window.",
    }));

    await expect(searchClickUp("one", "blocked")).rejects.toMatchObject({
      code: "CLICKUP_RATE_LIMITED",
    });
    expect(authMocks.authFetch).toHaveBeenCalledTimes(1);
  });

  it("retrieves a task ID returned by search", async () => {
    authMocks.authFetch.mockResolvedValue(response(true, 200, {
      connectionId: "one",
      task: { id: "task/1", name: "Fix OAuth", assignees: [] },
    }));

    await expect(getClickUpTask("one", "task/1")).resolves.toMatchObject({ id: "task/1" });
    expect(authMocks.authFetch).toHaveBeenCalledWith(
      "/integrations/clickup/one/tasks/task%2F1",
      { method: "GET" },
    );
  });
});
