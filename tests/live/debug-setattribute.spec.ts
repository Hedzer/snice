import { test, expect } from '@playwright/test';

test('debug: setAttribute should update property and trigger render', async ({ page }) => {
  await page.goto('http://localhost:5566/.debug/test-attr.html');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(600);

  // Get element
  const el = page.locator('test-attr');

  // Check initial state
  const initialVariant = await el.evaluate((node: any) => node.variant);
  const initialHTML = await el.evaluate((node: any) => node.shadowRoot?.innerHTML);

  console.log('Initial variant:', initialVariant);
  console.log('Initial HTML:', initialHTML);

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

  console.log('After variant:', afterVariant);
  console.log('After HTML:', afterHTML);

  expect(afterVariant).toBe('circle');
  expect(afterHTML).toContain('variant-circle');
});
