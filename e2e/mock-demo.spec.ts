import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

async function signIn(page: Page) {
  await page.route("http://localhost:5000/auth/login", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        token: "demo-application-token",
        user: {
          id: "user-ahmad",
          name: "Ahmad",
          email: "ahmad@example.com",
          createdAt: "2026-07-01T00:00:00.000Z",
          updatedAt: "2026-07-18T00:00:00.000Z",
        },
      }),
    });
  });
  await page.goto("/");
  await page.getByLabel("Email").fill("ahmad@example.com");
  await page.getByLabel("Password").fill("demo-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
});

test("completes the mock work-to-approval journey", async ({ page }) => {
  await signIn(page);
  await expect(page.getByText("Bring your work into one place")).toBeVisible();
  await page.getByRole("button", { name: "Connect Jira" }).click();
  await expect(page.getByText("Top priorities")).toBeVisible();

  await page.getByLabel("Ask anything about your work").fill("What is blocked?");
  await page.getByRole("button", { name: "Ask" }).click();
  await expect(page).toHaveURL(/\/assistant/);
  await page.getByLabel("Message AI Work OS").press("Enter");
  await expect(page.getByText("One urgent issue is blocked", { exact: false })).toBeVisible();
  await page.getByRole("link", { name: /KAN-21/ }).click();
  await expect(page).toHaveURL(/\/work\/work-jira-21/);
  await expect(page.getByRole("heading", { name: "Resolve permissions for product workspace" })).toBeVisible();

  const mobileNavigation = page.getByRole("button", { name: "Open navigation" });
  if (await mobileNavigation.isVisible()) {
    await mobileNavigation.click();
    await page
      .locator('[role="dialog"] nav[aria-label="Primary"] a[href="/approvals"]')
      .click();
  } else {
    await page.locator('aside nav[aria-label="Primary"] a[href="/approvals"]').click();
  }
  const proposal = page.getByRole("article").filter({ hasText: "Add blocker note to KAN-21" });
  await proposal.getByRole("button", { name: "Approve" }).click();
  await page.getByRole("button", { name: "Approve proposal" }).click();
  await expect(page.getByText("Simulated update completed", { exact: false })).toBeVisible();
});

test("has no automatically detectable critical accessibility violations", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.startsWith("mobile"), "Desktop smoke is sufficient for the axe pass.");
  await signIn(page);
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => violation.impact === "critical")).toEqual([]);
});
