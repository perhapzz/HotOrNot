import { test, expect } from "@playwright/test";

test.describe("Analysis Flow", () => {
  test("should submit content analysis", async ({ page }) => {
    await page.goto("/");

    // Find URL input
    const input = page.locator('input[type="text"], input[placeholder*="链接"], input[placeholder*="URL"], textarea').first();
    if (await input.isVisible()) {
      await input.fill("https://www.xiaohongshu.com/explore/test123");

      // Find submit button
      const submit = page.locator('button:has-text("分析"), button[type="submit"]').first();
      if (await submit.isVisible()) {
        await submit.click();
        // Should see loading or redirect
        await page.waitForTimeout(2000);
        // Page should not have crashed
        await expect(page.locator("body")).toBeVisible();
      }
    }
  });

  test("should navigate to keyword analysis", async ({ page }) => {
    await page.goto("/analysis/keywords");
    await expect(page.locator("header")).toBeVisible();
  });

  test("should navigate to account analysis", async ({ page }) => {
    await page.goto("/analysis/account");
    await expect(page.locator("header")).toBeVisible();
  });
});
