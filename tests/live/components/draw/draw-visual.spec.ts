import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/components/draw/demo.html';

test.describe('Snice Draw visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForFunction(() =>
      !!(document.getElementById('draw') as any)?.shadowRoot?.querySelector('canvas'));
    await page.waitForTimeout(300);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('canvas fills its host with no letterboxing', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const draws = [...document.querySelectorAll('snice-draw')] as any[];
      if (draws.length === 0) problems.push('no draw components');
      draws.forEach((d, i) => {
        const canvas = d.shadowRoot?.querySelector('canvas') as HTMLCanvasElement | null;
        const container = d.shadowRoot?.querySelector('.draw-container') as HTMLElement | null;
        if (!canvas || !container) { problems.push(`draw[${i}]: missing canvas/container`); return; }
        const hr = d.getBoundingClientRect();
        const cr = canvas.getBoundingClientRect();
        if (cr.width < 40 || cr.height < 40) {
          problems.push(`draw[${i}]: canvas ${Math.round(cr.width)}x${Math.round(cr.height)}`);
          return;
        }
        if (Math.abs(cr.width - hr.width) > 1 || Math.abs(cr.height - hr.height) > 1) {
          problems.push(`draw[${i}]: canvas ${Math.round(cr.width)}x${Math.round(cr.height)}`
            + ` != host ${Math.round(hr.width)}x${Math.round(hr.height)}`);
        }
        // Backing store must track the CSS box, or every stroke lands offset.
        const dpr = window.devicePixelRatio || 1;
        if (Math.abs(canvas.width - cr.width * dpr) > 1
            || Math.abs(canvas.height - cr.height * dpr) > 1) {
          problems.push(`draw[${i}]: backing store ${canvas.width}x${canvas.height}`
            + ` != css ${Math.round(cr.width)}x${Math.round(cr.height)} @${dpr}x`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('ink lands under the pointer path, not offset from it', async ({ page }) => {
    const box = await page.evaluate(() => {
      const c = (document.getElementById('draw') as any).shadowRoot.querySelector('canvas');
      const r = c.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    });

    // Drag a horizontal line across the middle 50% of the canvas.
    const x0 = box.x + box.w * 0.25;
    const x1 = box.x + box.w * 0.75;
    const y = box.y + box.h * 0.5;
    await page.mouse.move(x0, y);
    await page.mouse.down();
    for (let i = 1; i <= 10; i++) await page.mouse.move(x0 + (x1 - x0) * i / 10, y);
    await page.mouse.up();
    await page.waitForTimeout(400);

    const ink = await page.evaluate(() => {
      const canvas = (document.getElementById('draw') as any)
        .shadowRoot.querySelector('canvas') as HTMLCanvasElement;
      const ctx = canvas.getContext('2d')!;
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const bg = [data[0], data[1], data[2], data[3]];
      let minX = Infinity, minY = Infinity, maxX = -1, maxY = -1, count = 0;
      for (let py = 0; py < canvas.height; py++) {
        for (let px = 0; px < canvas.width; px++) {
          const i = (py * canvas.width + px) * 4;
          const delta = Math.abs(data[i] - bg[0]) + Math.abs(data[i + 1] - bg[1])
            + Math.abs(data[i + 2] - bg[2]) + Math.abs(data[i + 3] - bg[3]);
          if (delta <= 30) continue;
          count++;
          if (px < minX) minX = px;
          if (px > maxX) maxX = px;
          if (py < minY) minY = py;
          if (py > maxY) maxY = py;
        }
      }
      const rect = canvas.getBoundingClientRect();
      const sx = rect.width / canvas.width;
      const sy = rect.height / canvas.height;
      return count === 0 ? null : {
        count,
        left: rect.left + minX * sx,
        right: rect.left + maxX * sx,
        top: rect.top + minY * sy,
        bottom: rect.top + maxY * sy
      };
    });

    expect(ink, 'the drag painted no pixels at all').not.toBeNull();
    // The painted bounding box must sit on the pointer path, within a stroke width.
    const tol = 8;
    expect(Math.abs(ink!.left - x0)).toBeLessThanOrEqual(tol);
    expect(Math.abs(ink!.right - x1)).toBeLessThanOrEqual(tol);
    expect(Math.abs(ink!.top - y)).toBeLessThanOrEqual(tol);
    expect(Math.abs(ink!.bottom - y)).toBeLessThanOrEqual(tol);
  });
});
