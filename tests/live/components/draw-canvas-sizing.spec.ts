import { test, expect } from '@playwright/test';

const demoPath = 'http://localhost:5566/components/draw/demo.html';

test.describe('Draw Canvas Sizing', () => {
  test('canvas should fill host element and match container size', async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(() => {
      const drawEl = document.getElementById('draw') as any;
      if (!drawEl?.shadowRoot) {
        throw new Error('Draw element or shadow root not found');
      }

      const canvas = drawEl.shadowRoot.querySelector('canvas');
      const container = drawEl.shadowRoot.querySelector('.draw-container');

      if (!canvas || !container) {
        throw new Error('Canvas or container not found');
      }

      const canvasRect = canvas.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const hostRect = drawEl.getBoundingClientRect();

      return {
        canvas: {
          bufferWidth: canvas.width,
          bufferHeight: canvas.height,
          displayWidth: canvasRect.width,
          displayHeight: canvasRect.height,
        },
        container: {
          width: containerRect.width,
          height: containerRect.height,
        },
        host: {
          width: hostRect.width,
          height: hostRect.height,
        }
      };
    });

    // Canvas should fill the container
    expect(result.canvas.displayWidth).toBe(result.container.width);
    expect(result.canvas.displayHeight).toBe(result.container.height);

    // Container should match host element
    expect(result.container.width).toBe(result.host.width);
    expect(result.container.height).toBe(result.host.height);

    // Buffer should be at least as large as display (may be scaled by DPR)
    expect(result.canvas.bufferWidth).toBeGreaterThanOrEqual(result.canvas.displayWidth);
    expect(result.canvas.bufferHeight).toBeGreaterThanOrEqual(result.canvas.displayHeight);
  });

  test('drawing should work across entire canvas surface including right edge', async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');

    // Draw a horizontal line from left to right edge
    const canvasRect = await page.evaluate(() => {
      const drawEl = document.getElementById('draw') as any;
      const canvas = drawEl?.shadowRoot?.querySelector('canvas');
      return canvas?.getBoundingClientRect();
    });

    if (!canvasRect) {
      throw new Error('Canvas not found');
    }

    // Draw from x=100 to x=750 (near right edge)
    const startX = canvasRect.left + 100;
    const endX = canvasRect.left + 750;
    const y = canvasRect.top + 300;

    await page.mouse.move(startX, y);
    await page.mouse.down();
    await page.mouse.move(endX, y, { steps: 20 });
    await page.mouse.up();

    await page.waitForTimeout(100);

    // Check that pixels exist at the right edge of the canvas
    const pixelData = await page.evaluate(() => {
      const drawEl = document.getElementById('draw') as any;
      const canvas = drawEl?.shadowRoot?.querySelector('canvas') as HTMLCanvasElement;
      const ctx = canvas.getContext('2d');

      if (!ctx) return { error: 'No context' };

      // Sample pixels near the right edge
      const samples = [];
      for (let x of [700, 720, 740, 760, 780]) {
        const imageData = ctx.getImageData(x, 300, 1, 1);
        const alpha = imageData.data[3];
        samples.push({ x, hasContent: alpha > 0 });
      }

      return { samples };
    });

    // At least some pixels near the right edge should have content
    const contentCount = pixelData.samples.filter(s => s.hasContent).length;
    expect(contentCount).toBeGreaterThan(0);
  });
});
