import { test, expect } from '@playwright/test';

const demoPath = 'http://localhost:5566/components/badge/demo.html';

test.describe('Snice Badge', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
  });

  test('should render badge components', async ({ page }) => {
    const count = await page.locator('snice-badge').count();
    expect(count).toBeGreaterThan(0);
  });

  test('should have badges with count', async ({ page }) => {
    const count = await page.locator('snice-badge[count]').count();
    expect(count).toBeGreaterThan(0);
  });

  test('should have all variant types', async ({ page }) => {
    expect(await page.locator('snice-badge[variant="primary"]').count()).toBeGreaterThan(0);
    expect(await page.locator('snice-badge[variant="success"]').count()).toBeGreaterThan(0);
    expect(await page.locator('snice-badge[variant="warning"]').count()).toBeGreaterThan(0);
    expect(await page.locator('snice-badge[variant="error"]').count()).toBeGreaterThan(0);
  });
});
