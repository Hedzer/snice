import { test, expect } from '@playwright/test';

test.describe('QR Worker Test', () => {
  test.beforeEach(async ({ page }) => {
    // Capture console messages
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

    await page.goto('http://localhost:5566/.debug/test-qr-worker.html');
  });

  test('should load and communicate with worker', async ({ page }) => {
    // Wait for test to complete
    await page.waitForTimeout(4000);

    // Check log for messages
    const log = await page.locator('#log').textContent();
    console.log('Test log:', log);

    // Check that worker was created and responded
    expect(log).toContain('Creating worker');
    expect(log).toContain('Sending image data to worker');
  });

  test('should handle image data without errors', async ({ page }) => {
    // Wait for test to complete
    await page.waitForTimeout(4000);

    const log = await page.locator('#log').textContent();

    // Check no errors occurred
    expect(log).not.toContain('✗ Worker error');
    expect(log).toContain('Test Summary');
  });

  test('should draw test pattern on canvas', async ({ page }) => {
    // Check canvas was drawn
    const canvas = page.locator('#qrCanvas');
    await expect(canvas).toBeVisible();

    // Verify canvas has content (not blank)
    const hasContent = await canvas.evaluate((el: HTMLCanvasElement) => {
      const ctx = el.getContext('2d');
      if (!ctx) return false;
      const imageData = ctx.getImageData(0, 0, el.width, el.height);
      // Check if there are any black pixels
      for (let i = 0; i < imageData.data.length; i += 4) {
        if (imageData.data[i] === 0) return true; // Found black pixel
      }
      return false;
    });

    expect(hasContent).toBe(true);
  });
});
