import { test, expect } from '@playwright/test';

const demoPath = 'http://localhost:5566/components/input/demo.html';

test.describe('Snice Input', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
  });

  test('should render input components', async ({ page }) => {
    const count = await page.locator('snice-input').count();
    expect(count).toBeGreaterThan(0);
  });

  test('should have all input types', async ({ page }) => {
    expect(await page.locator('snice-input[type="email"]').count()).toBeGreaterThan(0);
    expect(await page.locator('snice-input[type="password"]').count()).toBeGreaterThan(0);
    expect(await page.locator('snice-input[type="number"]').count()).toBeGreaterThan(0);
    expect(await page.locator('snice-input[type="tel"]').count()).toBeGreaterThan(0);
    expect(await page.locator('snice-input[type="url"]').count()).toBeGreaterThan(0);
    expect(await page.locator('snice-input[type="search"]').count()).toBeGreaterThan(0);
  });

  test('should have all size types', async ({ page }) => {
    expect(await page.locator('snice-input[size="small"]').count()).toBeGreaterThan(0);
    expect(await page.locator('snice-input[size="medium"]').count()).toBeGreaterThan(0);
    expect(await page.locator('snice-input[size="large"]').count()).toBeGreaterThan(0);
  });

  test('should have all variant types', async ({ page }) => {
    expect(await page.locator('snice-input[variant="outlined"]').count()).toBeGreaterThan(0);
    expect(await page.locator('snice-input[variant="filled"]').count()).toBeGreaterThan(0);
    expect(await page.locator('snice-input[variant="underlined"]').count()).toBeGreaterThan(0);
  });

  test('should have inputs with labels', async ({ page }) => {
    const count = await page.locator('snice-input[label]').count();
    expect(count).toBeGreaterThan(0);
  });
});
