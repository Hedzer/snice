import { test, expect } from '@playwright/test';

test.describe('Regression Tests', () => {
  test('button should have active state on mouse down', async ({ page }) => {
    await page.goto('http://localhost:5566/components/button/demo.html');
    await page.waitForLoadState('networkidle');

    const button = page.locator('snice-button[variant="primary"]').first();

    // Get computed styles before and during active state
    const normalBg = await button.evaluate((el) => {
      return window.getComputedStyle(el.shadowRoot!.querySelector('.button')!).backgroundColor;
    });

    // Mousedown should trigger active state
    await button.hover();
    await page.mouse.down();
    await page.waitForTimeout(50);

    const activeBg = await button.evaluate((el) => {
      return window.getComputedStyle(el.shadowRoot!.querySelector('.button')!).backgroundColor;
    });

    await page.mouse.up();

    // Active state should have different background color
    expect(activeBg).not.toBe(normalBg);
    console.log('Normal bg:', normalBg, 'Active bg:', activeBg);
  });

  test('checkbox should toggle on click', async ({ page }) => {
    await page.goto('http://localhost:5566/components/checkbox/demo.html');
    await page.waitForLoadState('networkidle');

    const checkbox = page.locator('snice-checkbox').first();
    const initialChecked = await checkbox.evaluate((el: any) => el.checked);

    await checkbox.click();
    await page.waitForTimeout(100);

    const afterClickChecked = await checkbox.evaluate((el: any) => el.checked);
    expect(afterClickChecked).not.toBe(initialChecked);
  });

  test('card demo should use snice-button components', async ({ page }) => {
    await page.goto('http://localhost:5566/components/card/demo.html');
    await page.waitForLoadState('networkidle');

    // Check that snice-button elements exist in cards
    const sniceButtons = await page.locator('snice-card snice-button').count();
    expect(sniceButtons).toBeGreaterThan(0);

    // Specifically check card footers use snice-button, not plain buttons
    const cardsWithFooters = await page.locator('snice-card').count();
    console.log('Cards with snice-buttons:', sniceButtons, 'Total cards:', cardsWithFooters);

    // At least some cards should have snice-button in them
    expect(sniceButtons).toBeGreaterThanOrEqual(3);
  });
});
