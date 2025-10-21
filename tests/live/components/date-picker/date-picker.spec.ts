import { test, expect } from '@playwright/test';

const demoPath = 'http://localhost:5566/components/date-picker/demo.html';

test.describe('Snice Date Picker', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
  });

  test('should render date picker components', async ({ page }) => {
    const count = await page.locator('snice-date-picker').count();
    expect(count).toBeGreaterThan(0);
  });

  test('should have date pickers with labels', async ({ page }) => {
    const count = await page.locator('snice-date-picker[label]').count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display content', async ({ page }) => {
    const datePicker = page.locator('snice-date-picker').first();
    await expect(datePicker).toBeVisible();
  });
});
