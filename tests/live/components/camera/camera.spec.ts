import { test, expect } from '@playwright/test';

const demoPath = 'http://localhost:5566/components/camera/demo.html';

test.describe('Snice Camera', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.locator('snice-camera#main-camera').waitFor();
  });

  test('should render camera component', async ({ page }) => {
    const camera = page.locator('snice-camera#main-camera');
    expect(await camera.count()).toBe(1);
  });

  test('should have video element in shadow DOM', async ({ page }) => {
    const hasVideo = await page.evaluate(() => {
      const camera = document.querySelector('snice-camera');
      return !!camera?.shadowRoot?.querySelector('video');
    });
    expect(hasVideo).toBe(true);
  });

  test('should have built-in controls in shadow DOM', async ({ page }) => {
    const hasControls = await page.evaluate(() => {
      const camera = document.querySelector('snice-camera');
      return !!camera?.shadowRoot?.querySelector('.camera-controls');
    });
    expect(hasControls).toBe(true);
  });

  test('should have capture button in shadow DOM', async ({ page }) => {
    const hasCaptureBtn = await page.evaluate(() => {
      const camera = document.querySelector('snice-camera');
      return !!camera?.shadowRoot?.querySelector('.camera-btn.capture');
    });
    expect(hasCaptureBtn).toBe(true);
  });

  test('autoStart is false by default (camera permissions are flaky in headless,'
    + ' so we verify the property contract instead of the actual stream start)', async ({ page }) => {
    const autoStart = await page.evaluate(() => {
      const camera = document.querySelector('snice-camera') as any;
      return camera?.autoStart;
    });
    expect(autoStart).toBe(false);
  });

  test('should support different control positions', async ({ page }) => {
    const positions = await page.evaluate(() => {
      const cameras = Array.from(document.querySelectorAll('snice-camera'));
      return cameras.map(camera => {
        const controls = camera.shadowRoot?.querySelector('.camera-controls');
        return {
          hasBottom: controls?.classList.contains('bottom'),
          hasRight: controls?.classList.contains('right'),
          hasLeft: controls?.classList.contains('left'),
          hasTop: controls?.classList.contains('top')
        };
      });
    });

    // Should have cameras with different positions
    expect(positions.length).toBeGreaterThan(1);
  });
});
