import { test, expect } from '@playwright/test';

const demoPath = 'http://localhost:5566/components/avatar/demo.html';

test.describe('Snice Avatar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
  });

  test('should render avatar components', async ({ page }) => {
    const count = await page.locator('snice-avatar').count();
    expect(count).toBeGreaterThan(0);
  });

  test('should have avatars with images', async ({ page }) => {
    const count = await page.locator('snice-avatar[src]').count();
    expect(count).toBeGreaterThan(0);
  });

  test('should have avatars with names for initials', async ({ page }) => {
    const count = await page.locator('snice-avatar[name]').count();
    expect(count).toBeGreaterThan(0);
  });

  test('should have avatars without src or name', async ({ page }) => {
    const count = await page.locator('snice-avatar:not([src]):not([name])').count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display content', async ({ page }) => {
    const avatar = page.locator('snice-avatar').first();
    await expect(avatar).toBeVisible();
  });
});
