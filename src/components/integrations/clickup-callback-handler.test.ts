import { describe, expect, it } from "vitest";
import { clickUpCallbackNotice } from "./clickup-callback-handler";

describe("clickUpCallbackNotice", () => {
  it("describes a successful connection", () => {
    expect(clickUpCallbackNotice("connected")).toEqual({
      message: "ClickUp connected successfully.",
      tone: "success",
    });
  });

  it("explains unsupported read tools", () => {
    expect(clickUpCallbackNotice("unsupported")).toEqual({
      message: "ClickUp did not expose the required read tools. No connection was saved.",
      tone: "warning",
    });
  });

  it("provides a retry path for callback errors", () => {
    expect(clickUpCallbackNotice("error")?.message).toContain("try again");
  });
});
