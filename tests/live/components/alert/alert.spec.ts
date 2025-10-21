import { test, expect } from '@playwright/test';

const demoPath = 'http://localhost:5566/components/alert/demo.html';

test.describe('Snice Alert', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);

    // Check attributes BEFORE waitForLoadState
    const variantsBefore = await page.evaluate(() => {
      const alerts = Array.from(document.querySelectorAll('snice-alert'));
      return alerts.slice(0, 5).map((el, i) => `${i}: ${el.getAttribute('variant')}`);
    });
    console.log('Variants BEFORE waitForLoadState:', variantsBefore);

    await page.waitForLoadState('networkidle');

    // Check attributes AFTER waitForLoadState
    const variantsAfter = await page.evaluate(() => {
      const alerts = Array.from(document.querySelectorAll('snice-alert'));
      return alerts.slice(0, 5).map((el, i) => `${i}: ${el.getAttribute('variant')}`);
    });
    console.log('Variants AFTER waitForLoadState:', variantsAfter);
  });

  test('should render alert components', async ({ page }) => {
    const alerts = await page.locator('snice-alert').count();
    expect(alerts).toBeGreaterThan(0);
  });

  test('should have all variant types', async ({ page }) => {
    // Debug: check actual attributes on elements
    const alerts = await page.locator('snice-alert').all();
    console.log(`Found ${alerts.length} alerts total`);

    for (let i = 0; i < Math.min(alerts.length, 5); i++) {
      const variant = await alerts[i].getAttribute('variant');
      console.log(`Alert ${i}: variant="${variant}"`);
    }

    const infoCount = await page.locator('snice-alert[variant="info"]').count();
    const successCount = await page.locator('snice-alert[variant="success"]').count();
    console.log(`Info alerts: ${infoCount}, Success alerts: ${successCount}`);

    expect(await page.locator('snice-alert[variant="info"]').count()).toBeGreaterThan(0);
    expect(await page.locator('snice-alert[variant="success"]').count()).toBeGreaterThan(0);
    expect(await page.locator('snice-alert[variant="warning"]').count()).toBeGreaterThan(0);
    expect(await page.locator('snice-alert[variant="error"]').count()).toBeGreaterThan(0);
  });

  test('should have all size types', async ({ page }) => {
    expect(await page.locator('snice-alert[size="small"]').count()).toBeGreaterThan(0);
    expect(await page.locator('snice-alert[size="medium"]').count()).toBeGreaterThan(0);
    expect(await page.locator('snice-alert[size="large"]').count()).toBeGreaterThan(0);
  });

  test('should have alerts with titles', async ({ page }) => {
    const count = await page.locator('snice-alert[title]').count();
    expect(count).toBeGreaterThan(0);
  });

  test('should have dismissible alerts', async ({ page }) => {
    const count = await page.locator('snice-alert[dismissible]').count();
    expect(count).toBeGreaterThan(0);
  });

  test('should have alerts with icons', async ({ page }) => {
    const count = await page.locator('snice-alert[icon]').count();
    expect(count).toBeGreaterThan(0);
  });
});
