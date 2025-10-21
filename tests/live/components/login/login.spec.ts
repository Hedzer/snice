import { test, expect } from '@playwright/test';

const demoPath = 'http://localhost:5566/components/login/demo.html';

test.describe('Snice Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
  });

  test('should render login components', async ({ page }) => {
    const count = await page.locator('snice-login').count();
    expect(count).toBeGreaterThan(0);
  });

  test('should have login with title', async ({ page }) => {
    const count = await page.locator('snice-login[title]').count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display content', async ({ page }) => {
    const login = page.locator('snice-login').first();
    await expect(login).toBeVisible();
  });
});
