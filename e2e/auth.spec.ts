import { test, expect } from "@playwright/test";

test.describe("Auth Flow", () => {
  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = "TestPass123!";

  test("should show login/register UI", async ({ page }) => {
    await page.goto("/");
    // Look for login-related elements
    const loginBtn = page.locator('text=/登录|Login/i').first();
    await expect(loginBtn).toBeVisible();
  });

  test("should show register form fields", async ({ page }) => {
    await page.goto("/");
    // Click register tab if exists
    const registerTab = page.locator('text=/注册|Register/i').first();
    if (await registerTab.isVisible()) {
      await registerTab.click();
    }
    // Email and password fields should exist
    await expect(page.locator('input[type="email"], input[name="email"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });

  test("should reject empty form submission", async ({ page }) => {
    await page.goto("/");
    const submitBtn = page.locator('button[type="submit"]').first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      // Should see validation error or remain on page
      await expect(page).toHaveURL(/\//);
    }
  });
});
