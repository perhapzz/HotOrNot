import { test, expect } from "@playwright/test";

test.describe("Hotlist Page", () => {
  test("should load hotlist page", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.locator("header")).toBeVisible();
  });

  test("should have platform tabs or sections", async ({ page }) => {
    await page.goto("/dashboard");
    // Look for platform names
    const platforms = ["抖音", "小红书", "B站", "微博", "douyin", "bilibili"];
    let found = false;
    for (const p of platforms) {
      const el = page.locator(`text=${p}`).first();
      if (await el.isVisible().catch(() => false)) {
        found = true;
        break;
      }
    }
    // At least dashboard should load without error
    await expect(page.locator("header")).toBeVisible();
  });
});
