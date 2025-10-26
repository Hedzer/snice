import { test, expect } from '@playwright/test';

const demoPath = 'http://localhost:5566/components/camera/demo.html';

test.describe('Snice Camera', () => {
  test.beforeEach(async ({ page }) => {
    // Grant camera permissions
    await page.context().grantPermissions(['camera']);
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
  });

  test('should render camera component', async ({ page }) => {
    const camera = page.locator('snice-camera#main-camera');
    expect(await camera.count()).toBe(1);
  });

  test('should have video element', async ({ page }) => {
    const video = page.locator('snice-camera video');
    expect(await video.count()).toBe(1);
  });

  test('should have controls', async ({ page }) => {
    const controls = page.locator('snice-camera .camera-controls');
    expect(await controls.count()).toBe(1);
  });

  test('should have resolution selector', async ({ page }) => {
    const resolutionSelect = page.locator('select#resolution-select');
    expect(await resolutionSelect.count()).toBe(1);

    const options = await resolutionSelect.locator('option').count();
    expect(options).toBeGreaterThan(1);
  });

  test('should have facing mode selector', async ({ page }) => {
    const facingSelect = page.locator('select#facing-select');
    expect(await facingSelect.count()).toBe(1);
  });

  test('should have mirror checkbox', async ({ page }) => {
    const mirrorCheck = page.locator('input#mirror-check');
    expect(await mirrorCheck.count()).toBe(1);
    expect(await mirrorCheck.isChecked()).toBe(true);
  });
});
