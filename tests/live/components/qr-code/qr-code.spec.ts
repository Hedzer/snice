import { test, expect } from '@playwright/test';

const demoPath = 'http://localhost:5566/components/qr-code/demo.html';

test.describe('Snice QR Code', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
  });

  test('should render QR code components', async ({ page }) => {
    const count = await page.locator('snice-qr-code').count();
    expect(count).toBeGreaterThan(0);
  });

  test('should have value attribute', async ({ page }) => {
    const qrCode = page.locator('snice-qr-code').first();
    const value = await qrCode.getAttribute('value');
    expect(value).toBeTruthy();
  });

  test('should render SVG by default', async ({ page }) => {
    const svg = page.locator('snice-qr-code svg').first();
    expect(await svg.count()).toBe(1);
  });

  test('should have custom colors', async ({ page }) => {
    const coloredQR = page.locator('snice-qr-code[fg-color="#2196f3"]');
    expect(await coloredQR.count()).toBeGreaterThan(0);
  });

  test('should support different sizes', async ({ page }) => {
    const qrCodes = page.locator('snice-qr-code');
    const count = await qrCodes.count();
    expect(count).toBeGreaterThan(3);
  });

  test('should render custom QR code', async ({ page }) => {
    const customQR = page.locator('snice-qr-code#custom-qr');
    expect(await customQR.count()).toBe(1);
  });
});
