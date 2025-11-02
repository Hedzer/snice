import { test, expect } from '@playwright/test';

const demoPath = 'http://localhost:5566/components/qr-reader/demo.html';

test.describe('snice-qr-reader', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
  });

  test('should render QR reader component', async ({ page }) => {
    const reader = page.locator('snice-qr-reader').first();
    await expect(reader).toBeVisible();
  });

  test('should have start button initially', async ({ page }) => {
    const reader = page.locator('#reader1');
    await expect(reader).toBeVisible();

    // Check for start button in shadow DOM
    const startButton = reader.locator('button.start');
    await expect(startButton).toBeVisible();
  });

  test('should have controls', async ({ page }) => {
    const reader = page.locator('#reader1');
    const controls = reader.locator('.qr-reader-controls');
    await expect(controls).toBeVisible();
  });

  test('auto-start reader should initialize', async ({ page }) => {
    // Grant camera permissions if needed (this test will only work with mock camera or permissions granted)
    const reader = page.locator('#reader2');
    await expect(reader).toBeVisible();
  });

  test('manual-snap mode should show camera button', async ({ page }) => {
    const reader = page.locator('#reader4');
    await expect(reader).toBeVisible();

    // In manual snap mode, start button should have camera icon
    const startButton = reader.locator('button.start');
    await expect(startButton).toBeVisible();
  });

  test('pick-first mode should be available', async ({ page }) => {
    const reader = page.locator('#reader3');
    await expect(reader).toBeVisible();
  });

  test('should have switch camera button', async ({ page }) => {
    const reader = page.locator('#reader1');
    const switchButton = reader.locator('button.switch');
    await expect(switchButton).toBeVisible();
  });

  test('event log should be present', async ({ page }) => {
    const eventLog = page.locator('#event-log');
    await expect(eventLog).toBeVisible();
  });
});
