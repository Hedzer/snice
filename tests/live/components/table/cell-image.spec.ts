import { test, expect } from '@playwright/test';

const demoPath = 'http://localhost:5566/components/table/demo.html';

test.describe('Snice Cell Image', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
  });

  test('should change variant when attribute is updated', async ({ page }) => {
    const cellImage = page.locator('snice-cell-image').first();

    // Set initial variant to rounded
    await cellImage.evaluate((el: any) => {
      el.variant = 'rounded';
    });

    await page.waitForTimeout(50);

    // Get initial classes
    const initialClasses = await cellImage.evaluate((el) => {
      const img = el.shadowRoot?.querySelector('img');
      return img?.className || '';
    });

    expect(initialClasses).toContain('image--rounded');

    // Change variant to square
    await cellImage.evaluate((el: any) => {
      el.variant = 'square';
    });

    // Wait for re-render
    await page.waitForTimeout(50);

    // Check classes changed
    const updatedClasses = await cellImage.evaluate((el) => {
      const img = el.shadowRoot?.querySelector('img');
      return img?.className || '';
    });

    expect(updatedClasses).toContain('image--square');
    expect(updatedClasses).not.toContain('image--rounded');
  });

  test('should change size when attribute is updated', async ({ page }) => {
    const cellImage = page.locator('snice-cell-image').first();

    // Set initial size to small
    await cellImage.evaluate((el: any) => {
      el.size = 'small';
    });

    await page.waitForTimeout(50);

    const initialClasses = await cellImage.evaluate((el) => {
      const img = el.shadowRoot?.querySelector('img');
      return img?.className || '';
    });

    expect(initialClasses).toContain('image--small');

    // Change size to large
    await cellImage.evaluate((el: any) => {
      el.size = 'large';
    });

    // Wait for re-render
    await page.waitForTimeout(50);

    // Check classes changed
    const classes = await cellImage.evaluate((el) => {
      const img = el.shadowRoot?.querySelector('img');
      return img?.className || '';
    });

    expect(classes).toContain('image--large');
    expect(classes).not.toContain('image--small');
  });

  test('should react to setAttribute for variant', async ({ page }) => {
    const cellImage = page.locator('snice-cell-image').first();

    // Set via setAttribute
    await cellImage.evaluate((el: HTMLElement) => {
      el.setAttribute('variant', 'square');
    });

    await page.waitForTimeout(50);

    const classes = await cellImage.evaluate((el) => {
      const img = el.shadowRoot?.querySelector('img');
      return img?.className || '';
    });

    expect(classes).toContain('image--square');
  });

  test('should react to setAttribute for size', async ({ page }) => {
    const cellImage = page.locator('snice-cell-image').first();

    // Set via setAttribute
    await cellImage.evaluate((el: HTMLElement) => {
      el.setAttribute('size', 'large');
    });

    await page.waitForTimeout(50);

    const classes = await cellImage.evaluate((el) => {
      const img = el.shadowRoot?.querySelector('img');
      return img?.className || '';
    });

    expect(classes).toContain('image--large');
  });
});
