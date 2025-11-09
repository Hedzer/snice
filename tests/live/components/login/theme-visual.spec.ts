import { test, expect } from '@playwright/test';

const demoPath = 'http://localhost:5566/components/login/demo.html';

test.describe('Login Theme Visual Tests', () => {
  test('login inputs should match theme in light mode', async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');

    const login = page.locator('snice-login').first();
    await expect(login).toBeVisible();

    // Get input styling
    const usernameInput = login.locator('input[name="username"]');
    const bgColor = await usernameInput.evaluate(el =>
      window.getComputedStyle(el).backgroundColor
    );
    const borderColor = await usernameInput.evaluate(el =>
      window.getComputedStyle(el).borderColor
    );

    console.log('Login light mode background:', bgColor);
    console.log('Login light mode border:', borderColor);

    // Should match input theme - pure white background
    expect(bgColor).toBe('rgb(255, 255, 255)');

    // Border should match theme (gray-300)
    expect(borderColor).toContain('rgb(209, 213, 219)');

    // Take screenshot
    await login.screenshot({ path: 'test-results/login-light.png' });
  });

  test('login inputs should match theme in dark mode', async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');

    // Enable dark mode
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });

    await page.waitForTimeout(500);

    const login = page.locator('snice-login').first();
    await expect(login).toBeVisible();

    // Get input styling
    const usernameInput = login.locator('input[name="username"]');
    const bgColor = await usernameInput.evaluate(el =>
      window.getComputedStyle(el).backgroundColor
    );
    const borderColor = await usernameInput.evaluate(el =>
      window.getComputedStyle(el).borderColor
    );

    console.log('Login dark mode background:', bgColor);
    console.log('Login dark mode border:', borderColor);

    // Should match input theme - dark gray background
    expect(bgColor).toBe('rgb(38, 38, 38)');

    // Border should be visible in dark mode
    expect(borderColor).toContain('rgb(89, 89, 89)');

    // Take screenshot
    await login.screenshot({ path: 'test-results/login-dark.png' });
  });

  test('full login demo - light mode', async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');

    await page.screenshot({
      path: 'test-results/login-demo-light-full.png',
      fullPage: true
    });
  });

  test('full login demo - dark mode', async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');

    // Enable dark mode
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });

    await page.waitForTimeout(500);

    await page.screenshot({
      path: 'test-results/login-demo-dark-full.png',
      fullPage: true
    });
  });
});
