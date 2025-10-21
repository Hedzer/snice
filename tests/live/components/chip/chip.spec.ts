import { test, expect } from '@playwright/test';

const demoPath = 'http://localhost:5566/components/chip/demo.html';

test.describe('Snice Chip', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
  });

  test('should render chip components', async ({ page }) => {
    const count = await page.locator('snice-chip').count();
    expect(count).toBeGreaterThan(0);
  });

  test('should have chips with labels', async ({ page }) => {
    const count = await page.locator('snice-chip[label]').count();
    expect(count).toBeGreaterThan(0);
  });

  test('should have all variant types', async ({ page }) => {
    expect(await page.locator('snice-chip[variant="default"]').count()).toBeGreaterThan(0);
    expect(await page.locator('snice-chip[variant="primary"]').count()).toBeGreaterThan(0);
    expect(await page.locator('snice-chip[variant="success"]').count()).toBeGreaterThan(0);
    expect(await page.locator('snice-chip[variant="warning"]').count()).toBeGreaterThan(0);
    expect(await page.locator('snice-chip[variant="error"]').count()).toBeGreaterThan(0);
  });

  test('should have selected chips', async ({ page }) => {
    const count = await page.locator('snice-chip[selected]').count();
    expect(count).toBeGreaterThan(0);
  });
});
