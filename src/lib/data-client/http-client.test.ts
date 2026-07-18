import { describe, expect, it } from "vitest";
import { normalizeIntegrationStatus } from "./http-client";

describe("normalizeIntegrationStatus", () => {
  it.each([
    ["ACTIVE", "connected"],
    ["PENDING", "connecting"],
    ["REAUTH_REQUIRED", "reauth-required"],
    ["DEGRADED", "permission-required"],
    ["REVOKED", "disconnected"],
    ["unknown", "error"],
  ])("maps %s to %s", (input, expected) => {
    expect(normalizeIntegrationStatus(input)).toBe(expected);
  });
});
