import { test, expect } from '@playwright/test';

const demoPath = 'http://localhost:5566/components/metric-table/demo.html';

test.describe('Snice Metric Table', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
  });

  test('should render metric tables', async ({ page }) => {
    const count = await page.locator('snice-metric-table').count();
    expect(count).toBeGreaterThan(0);
  });

  test('binds the kebab-case sort-by attribute to the sortBy property', async ({ page }) => {
    await expect.poll(() =>
      page.locator('#mt-sort-desc').evaluate((el: any) => el.sortBy)
    ).toBe('value');
  });

  test('sorts rows descending when sort-by is authored with default direction', async ({ page }) => {
    await expect.poll(() =>
      page.locator('#mt-sort-desc').evaluate((el: any) =>
        Array.from(el.shadowRoot.querySelectorAll('.mt__row td:first-child')).map((td: any) => td.textContent.trim())
      )
    ).toEqual(['C', 'B', 'A']);
  });

  test('sorts rows ascending when sort-direction="asc" is authored', async ({ page }) => {
    await expect.poll(() =>
      page.locator('#mt-sort-asc').evaluate((el: any) =>
        Array.from(el.shadowRoot.querySelectorAll('.mt__row td:first-child')).map((td: any) => td.textContent.trim())
      )
    ).toEqual(['A', 'B', 'C']);
  });

  test('sorts via keyboard on a column header', async ({ page }) => {
    const header = page.locator('#mt-sort-desc').locator('.mt__header').nth(1);
    await header.focus();
    await page.keyboard.press('Enter');

    await expect.poll(() =>
      page.locator('#mt-sort-desc').evaluate((el: any) => el.sortDirection)
    ).toBe('asc');
  });
});
