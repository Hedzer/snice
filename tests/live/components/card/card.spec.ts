import { test, expect } from '@playwright/test';

const demoPath = 'http://localhost:5566/components/card/demo.html';

test.describe('Snice Card', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
  });

  test('should render card components', async ({ page }) => {
    const count = await page.locator('snice-card').count();
    expect(count).toBeGreaterThan(0);
  });

  test('should have all variant types', async ({ page }) => {
    expect(await page.locator('snice-card[variant="elevated"]').count()).toBeGreaterThan(0);
    expect(await page.locator('snice-card[variant="bordered"]').count()).toBeGreaterThan(0);
    expect(await page.locator('snice-card[variant="flat"]').count()).toBeGreaterThan(0);
  });

  test('should have clickable cards', async ({ page }) => {
    const count = await page.locator('snice-card[clickable]').count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display content', async ({ page }) => {
    const card = page.locator('snice-card').first();
    await expect(card).toBeVisible();
  });
});
