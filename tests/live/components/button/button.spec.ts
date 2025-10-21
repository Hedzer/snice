import { test, expect } from '@playwright/test';

const demoPath = 'http://localhost:5566/components/button/demo.html';

test.describe('Snice Button', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
  });

  test('should render button components', async ({ page }) => {
    const count = await page.locator('snice-button').count();
    expect(count).toBeGreaterThan(0);
  });

  test('should have all variant types', async ({ page }) => {
    expect(await page.locator('snice-button[variant="default"]').count()).toBeGreaterThan(0);
    expect(await page.locator('snice-button[variant="primary"]').count()).toBeGreaterThan(0);
    expect(await page.locator('snice-button[variant="success"]').count()).toBeGreaterThan(0);
    expect(await page.locator('snice-button[variant="warning"]').count()).toBeGreaterThan(0);
  });

  test('should display text content', async ({ page }) => {
    const button = page.locator('snice-button').first();
    const text = await button.textContent();
    expect(text?.trim().length).toBeGreaterThan(0);
  });
});
