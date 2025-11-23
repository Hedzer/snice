import { test, expect } from '@playwright/test';

test.describe('Website Component Rendering', () => {
  test.beforeAll(async () => {
    // Server should already be running on port 8000
  });

  test('components render in browser', async ({ page }) => {
    await page.goto('http://localhost:52891');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check that snice-button components rendered (should have shadow DOM)
    const buttons = await page.locator('snice-button').all();
    expect(buttons.length).toBeGreaterThan(0);

    // Check first button has shadow root content
    const firstButton = page.locator('snice-button').first();
    const shadowContent = await firstButton.evaluate((el) => {
      return el.shadowRoot?.innerHTML || '';
    });
    expect(shadowContent.length).toBeGreaterThan(0);
    expect(shadowContent).toContain('button');

    // Check badge rendered
    const badge = page.locator('snice-badge').first();
    const badgeShadow = await badge.evaluate((el) => el.shadowRoot?.innerHTML || '');
    expect(badgeShadow.length).toBeGreaterThan(0);

    // Check alert rendered
    const alert = page.locator('snice-alert').first();
    const alertShadow = await alert.evaluate((el) => el.shadowRoot?.innerHTML || '');
    expect(alertShadow.length).toBeGreaterThan(0);

    // Check spinner rendered
    const spinner = page.locator('snice-spinner').first();
    const spinnerShadow = await spinner.evaluate((el) => el.shadowRoot?.innerHTML || '');
    expect(spinnerShadow.length).toBeGreaterThan(0);

    // Check input rendered
    const input = page.locator('snice-input').first();
    const inputShadow = await input.evaluate((el) => el.shadowRoot?.innerHTML || '');
    expect(inputShadow.length).toBeGreaterThan(0);
  });

  test('theme toggle works', async ({ page }) => {
    await page.goto('http://localhost:52891');
    await page.waitForLoadState('networkidle');

    // Click theme toggle
    await page.click('.theme-toggle');

    // Check theme changed
    const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(theme).toBe('dark');

    // Toggle back
    await page.click('.theme-toggle');
    const themeLight = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(themeLight).toBe('light');
  });

  test('modal opens', async ({ page }) => {
    await page.goto('http://localhost:52891');
    await page.waitForLoadState('networkidle');

    // Find and click the "Open Modal" button
    const openModalBtn = page.locator('snice-button:has-text("Open Modal")');
    await openModalBtn.click();

    // Check modal is open
    const modal = page.locator('snice-modal#demo-modal');
    const isOpen = await modal.evaluate((el: any) => el.open);
    expect(isOpen).toBe(true);
  });
});
