import { describe, expect, it } from "vitest";
import { isAppSessionUnauthorized } from "./auth";

describe("isAppSessionUnauthorized", () => {
  it("does not treat model/Bedrock failures as session logout", () => {
    expect(
      isAppSessionUnauthorized(
        "MODEL_AUTH_FAILED",
        "Model provider authentication failed.",
      ),
    ).toBe(false);
    expect(
      isAppSessionUnauthorized(
        undefined,
        "Check BEDROCK_API_KEY is a Bedrock API key",
      ),
    ).toBe(false);
  });

  it("treats JWT guard failures as session logout", () => {
    expect(
      isAppSessionUnauthorized(undefined, "Access token has expired."),
    ).toBe(true);
    expect(isAppSessionUnauthorized(undefined, "Invalid access token.")).toBe(
      true,
    );
  });

  it("does not treat Jira reauth codes as app logout", () => {
    expect(
      isAppSessionUnauthorized(
        "JIRA_REAUTH_REQUIRED",
        "The Jira connection must be authorized again.",
      ),
    ).toBe(false);
  });
});
