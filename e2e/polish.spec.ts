import { test, expect } from "@playwright/test";

test.describe("Settings page", () => {
  test("displays settings tabs", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.locator("text=设置")).toBeVisible();
  });
});

test.describe("Achievements page", () => {
  test("shows achievement wall", async ({ page }) => {
    await page.goto("/achievements");
    await expect(page.locator("text=成就墙")).toBeVisible();
  });
});

test.describe("API Docs page", () => {
  test("shows API documentation", async ({ page }) => {
    await page.goto("/developer/docs");
    await expect(page.locator("text=API 文档")).toBeVisible();
  });

  test("can expand endpoint details", async ({ page }) => {
    await page.goto("/developer/docs");
    // Click the first endpoint
    await page.locator("button").filter({ hasText: "/api/v1/" }).first().click();
    // Should show params section
    await expect(page.locator("text=代码示例").first()).toBeVisible();
  });
});

test.describe("Accessibility", () => {
  test("has skip-to-content link", async ({ page }) => {
    await page.goto("/");
    const skipLink = page.locator("a.skip-link");
    await expect(skipLink).toBeAttached();
  });

  test("main content has id for skip nav", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#main-content")).toBeAttached();
  });
});
