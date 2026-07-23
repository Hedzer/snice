import { test, expect } from '@playwright/test';

test('setAttribute updates the property and triggers render', async ({ page }) => {
  await page.goto('/tests/live/fixtures/property-attribute-render.html');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(600);

  // Get element
  const el = page.locator('test-attr');

  // Check initial state
  const initialVariant = await el.evaluate((node: any) => node.variant);
  const initialHTML = await el.evaluate((node: any) => node.shadowRoot?.innerHTML);

  expect(initialVariant).toBe('default');
  expect(initialHTML).toContain('variant-default');

  // Set attribute
  await el.evaluate((node: HTMLElement) => {
    node.setAttribute('variant', 'circle');
  });

  await page.waitForTimeout(100);

  // Check after setAttribute
  const afterVariant = await el.evaluate((node: any) => node.variant);
  const afterHTML = await el.evaluate((node: any) => node.shadowRoot?.innerHTML);

  expect(afterVariant).toBe('circle');
  expect(afterHTML).toContain('variant-circle');
});
