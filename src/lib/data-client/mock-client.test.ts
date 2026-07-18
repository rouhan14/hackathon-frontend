import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockWorkOsClient, resetMockState, setMockScenario } from "./mock-client";

describe("mockWorkOsClient", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetMockState();
    vi.useFakeTimers();
  });

  it("moves from first-time onboarding to a connected dashboard", async () => {
    const emptyPromise = mockWorkOsClient.getDashboard();
    await vi.runAllTimersAsync();
    const emptyDashboard = await emptyPromise;
    expect(emptyDashboard.connectedSourceCount).toBe(0);
    expect(emptyDashboard.pendingApprovalCount).toBe(0);

    const emptyApprovalsPromise = mockWorkOsClient.listApprovals();
    const emptyThreadsPromise = mockWorkOsClient.listThreads();
    await vi.runAllTimersAsync();
    await expect(emptyApprovalsPromise).resolves.toEqual([]);
    await expect(emptyThreadsPromise).resolves.toEqual([]);

    const connectPromise = mockWorkOsClient.connectIntegration("jira");
    await vi.runAllTimersAsync();
    await connectPromise;
    const readyPromise = mockWorkOsClient.getDashboard();
    await vi.runAllTimersAsync();
    const dashboard = await readyPromise;
    expect(dashboard.connectedSourceCount).toBe(1);
    expect(dashboard.blockers[0]?.sourceId).toBe("KAN-21");
  });

  it("returns deterministic blocked-work evidence and a proposal", async () => {
    setMockScenario("returning");
    const answerPromise = mockWorkOsClient.askAssistant({ prompt: "What is blocked?" });
    await vi.runAllTimersAsync();
    const answer = await answerPromise;
    expect(answer.message.content).toContain("blocked");
    expect(answer.message.evidence?.[0].workItemId).toBe("work-jira-21");
    expect(answer.message.proposalIds).toContain("proposal-jira-21");
  });

  it("never returns evidence outside the connected source filter", async () => {
    setMockScenario("returning");
    const answerPromise = mockWorkOsClient.askAssistant({
      prompt: "What is blocked?",
      sources: ["notion"],
    });
    await vi.runAllTimersAsync();
    const answer = await answerPromise;
    expect(answer.message.evidence).toEqual([]);
    expect(answer.message.proposalIds).toBeUndefined();
    expect(answer.message.content).toContain("selected connected sources");
  });

  it("does not persist conversations when local history is disabled", async () => {
    setMockScenario("returning");
    const settingsPromise = mockWorkOsClient.updateSettings({
      allowLocalHistory: false,
    });
    await vi.runAllTimersAsync();
    await settingsPromise;

    const answerPromise = mockWorkOsClient.askAssistant({
      prompt: "Private workplace question",
    });
    await vi.runAllTimersAsync();
    const answer = await answerPromise;
    expect(answer.persisted).toBe(false);

    const threadsPromise = mockWorkOsClient.listThreads();
    await vi.runAllTimersAsync();
    await expect(threadsPromise).resolves.toEqual([]);
    expect(window.localStorage.getItem("ai-work-os-mock-state-v1")).not.toContain(
      "Private workplace question",
    );
  });

  it("persists approval execution locally", async () => {
    setMockScenario("returning");
    const approvalPromise = mockWorkOsClient.approveAction("proposal-jira-14");
    await vi.runAllTimersAsync();
    expect((await approvalPromise).status).toBe("executed");
    const listPromise = mockWorkOsClient.listApprovals();
    await vi.runAllTimersAsync();
    expect((await listPromise).find((item) => item.id === "proposal-jira-14")?.execution.status).toBe("succeeded");
  });

  it("surfaces typed permission, reauth, and recoverable states", async () => {
    for (const [scenario, code] of [
      ["permission-required", "permission-required"],
      ["reauth-required", "reauth-required"],
      ["recoverable-error", "recoverable"],
    ] as const) {
      setMockScenario(scenario);
      const assertion = expect(mockWorkOsClient.listWorkItems()).rejects.toMatchObject({ code });
      await vi.runAllTimersAsync();
      await assertion;
    }
  });
});
