import { test, expect } from '@playwright/test';

const demoPath = 'http://localhost:5566/components/input/demo.html';

test.describe('Input Theme Visual Tests', () => {
  test('should have visible date/time picker icons in light mode', async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');

    // Find date input
    const dateInput = page.locator('snice-input[type="date"]').first();
    await expect(dateInput).toBeVisible();

    // Take screenshot of date input section
    await dateInput.screenshot({ path: 'test-results/date-input-light.png' });

    // Check that the input has proper styling
    const inputElement = dateInput.locator('input');
    const bgColor = await inputElement.evaluate(el =>
      window.getComputedStyle(el).backgroundColor
    );

    // Should be white in light mode
    expect(bgColor).toBe('rgb(255, 255, 255)');

    // Check border is visible (not too light)
    const borderColor = await inputElement.evaluate(el =>
      window.getComputedStyle(el).borderColor
    );
    console.log('Light mode border color:', borderColor);
  });

  test('should have visible date/time picker icons in dark mode', async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');

    // Enable dark mode
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });

    await page.waitForTimeout(500);

    // Find date input
    const dateInput = page.locator('snice-input[type="date"]').first();
    await expect(dateInput).toBeVisible();

    // Take screenshot of date input section in dark mode
    await dateInput.screenshot({ path: 'test-results/date-input-dark.png' });

    // Check that the input has dark mode styling
    const inputElement = dateInput.locator('input');
    const bgColor = await inputElement.evaluate(el =>
      window.getComputedStyle(el).backgroundColor
    );

    // Should be dark gray in dark mode (hsl(0 0% 15%) = rgb(38, 38, 38))
    expect(bgColor).toBe('rgb(38, 38, 38)');

    // Check color-scheme is set to dark
    const colorScheme = await page.evaluate(() =>
      window.getComputedStyle(document.documentElement).colorScheme
    );
    expect(colorScheme).toContain('dark');
  });

  test('should have visible time picker icons in light mode', async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');

    // Find time input
    const timeInput = page.locator('snice-input[type="time"]').first();
    await expect(timeInput).toBeVisible();

    // Take screenshot
    await timeInput.screenshot({ path: 'test-results/time-input-light.png' });
  });

  test('should have visible time picker icons in dark mode', async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');

    // Enable dark mode
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });

    await page.waitForTimeout(500);

    // Find time input
    const timeInput = page.locator('snice-input[type="time"]').first();
    await expect(timeInput).toBeVisible();

    // Take screenshot in dark mode
    await timeInput.screenshot({ path: 'test-results/time-input-dark.png' });
  });

  test('should have proper input background contrast in light mode', async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');

    const regularInput = page.locator('snice-input[type="text"]').first();
    const inputElement = regularInput.locator('input');

    const bgColor = await inputElement.evaluate(el =>
      window.getComputedStyle(el).backgroundColor
    );
    const borderColor = await inputElement.evaluate(el =>
      window.getComputedStyle(el).borderColor
    );

    console.log('Light mode input background:', bgColor);
    console.log('Light mode input border:', borderColor);

    // Background should be pure white
    expect(bgColor).toBe('rgb(255, 255, 255)');

    // Border should be visible (gray-300 = rgb(209, 213, 219))
    expect(borderColor).toContain('rgb(209, 213, 219)');
  });

  test('should have proper input background contrast in dark mode', async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');

    // Enable dark mode
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });

    await page.waitForTimeout(500);

    const regularInput = page.locator('snice-input[type="text"]').first();
    const inputElement = regularInput.locator('input');

    const bgColor = await inputElement.evaluate(el =>
      window.getComputedStyle(el).backgroundColor
    );
    const borderColor = await inputElement.evaluate(el =>
      window.getComputedStyle(el).borderColor
    );

    console.log('Dark mode input background:', bgColor);
    console.log('Dark mode input border:', borderColor);

    // Background should be dark gray (hsl(0 0% 15%))
    expect(bgColor).toBe('rgb(38, 38, 38)');

    // Border should be visible in dark mode
    expect(borderColor).toContain('rgb(89, 89, 89)'); // hsl(0 0% 35%)
  });

  test('full page screenshot - light mode', async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');

    // Scroll to Date & Time section
    await page.evaluate(() => {
      const heading = Array.from(document.querySelectorAll('h2, h3'))
        .find(el => el.textContent?.includes('Date'));
      if (heading) heading.scrollIntoView({ behavior: 'smooth' });
    });

    await page.waitForTimeout(500);

    // Take full page screenshot
    await page.screenshot({
      path: 'test-results/input-demo-light-full.png',
      fullPage: true
    });
  });

  test('full page screenshot - dark mode', async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');

    // Enable dark mode
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });

    await page.waitForTimeout(500);

    // Scroll to Date & Time section
    await page.evaluate(() => {
      const heading = Array.from(document.querySelectorAll('h2, h3'))
        .find(el => el.textContent?.includes('Date'));
      if (heading) heading.scrollIntoView({ behavior: 'smooth' });
    });

    await page.waitForTimeout(500);

    // Take full page screenshot
    await page.screenshot({
      path: 'test-results/input-demo-dark-full.png',
      fullPage: true
    });
  });
});
