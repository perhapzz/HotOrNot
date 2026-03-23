import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("should load and show main elements", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/HotOrNot/);
    // Header should be visible
    await expect(page.locator("header")).toBeVisible();
  });

  test("should have analysis input area", async ({ page }) => {
    await page.goto("/");
    // Look for input/textarea for URL analysis
    const input = page.locator('input[type="text"], textarea').first();
    await expect(input).toBeVisible();
  });
});
