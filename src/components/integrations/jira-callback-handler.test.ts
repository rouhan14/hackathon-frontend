import { describe, expect, it } from "vitest";
import { jiraCallbackNotice } from "./jira-callback-handler";

describe("jiraCallbackNotice", () => {
  it("describes a successful multi-site connection", () => {
    expect(jiraCallbackNotice("connected", "2")).toEqual({
      message: "Jira connected successfully. Connected 2 sites.",
      tone: "success",
    });
  });

  it("preserves the existing connection for no-sites", () => {
    expect(jiraCallbackNotice("no-sites", null)?.message).toContain(
      "existing connection remains active",
    );
  });

  it("provides a known retry path for errors", () => {
    expect(jiraCallbackNotice("error", null)).toEqual({
      message: "Could not connect Jira. Open Integrations to try again.",
      tone: "error",
    });
  });
});
