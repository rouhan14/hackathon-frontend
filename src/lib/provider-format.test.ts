import { describe, expect, it } from "vitest";
import {
  formatProviderLabel,
  providerToSource,
  sourceToBackendProvider,
} from "./provider-format";

describe("provider formatting", () => {
  it("normalizes backend provider names once", () => {
    expect(providerToSource("GOOGLE_CALENDAR")).toBe("calendar");
    expect(formatProviderLabel("CLICKUP")).toBe("ClickUp");
  });

  it("maps UI source filters to the backend enum", () => {
    expect(sourceToBackendProvider("jira")).toBe("JIRA");
    expect(sourceToBackendProvider("notion")).toBe("NOTION");
  });
});
