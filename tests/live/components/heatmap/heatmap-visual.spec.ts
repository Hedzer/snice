import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/components/heatmap/demo.html';

test.describe('Snice Heatmap visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForFunction(() =>
      (document.querySelectorAll('snice-heatmap')[0] as any)
        ?.shadowRoot?.querySelectorAll('.heatmap__cell').length > 0);
    await page.waitForTimeout(200);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('cells are square and tile on a cell-size + cell-gap pitch', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const maps = [...document.querySelectorAll('snice-heatmap')] as any[];
      if (maps.length === 0) problems.push('no heatmaps');

      maps.forEach((map, i) => {
        const grid = map.shadowRoot?.querySelector('.heatmap__grid') as HTMLElement | null;
        if (!grid) { problems.push(`heatmap[${i}]: no grid`); return; }
        const cells = [...grid.querySelectorAll('.heatmap__cell')] as HTMLElement[];
        if (cells.length === 0) return; // empty-data variant

        const size = Number(map.getAttribute('cell-size') ?? 12);
        const gap = Number(map.getAttribute('cell-gap') ?? 3);
        const gr = grid.getBoundingClientRect();

        // Cells flow down columns of 7 (one week per column).
        const c0 = cells[0].getBoundingClientRect();
        if (Math.abs(c0.width - size) > 0.5 || Math.abs(c0.height - size) > 0.5) {
          problems.push(`heatmap[${i}]: cell ${c0.width}x${c0.height}, expected ${size}`);
          return;
        }
        if (cells.length > 1) {
          const c1 = cells[1].getBoundingClientRect();
          if (Math.abs((c1.top - c0.top) - (size + gap)) > 0.5) {
            problems.push(`heatmap[${i}]: row pitch ${c1.top - c0.top}, expected ${size + gap}`);
          }
        }
        if (cells.length > 7) {
          const c7 = cells[7].getBoundingClientRect();
          if (Math.abs((c7.left - c0.left) - (size + gap)) > 0.5) {
            problems.push(`heatmap[${i}]: column pitch ${c7.left - c0.left}, expected ${size + gap}`);
          }
          if (Math.abs(c7.top - c0.top) > 0.5) {
            problems.push(`heatmap[${i}]: next week does not start on the first row`);
          }
        }
        // Every cell stays inside the grid box.
        cells.forEach((cell, c) => {
          const r = cell.getBoundingClientRect();
          if (r.left < gr.left - 0.5 || r.right > gr.right + 0.5
              || r.top < gr.top - 0.5 || r.bottom > gr.bottom + 0.5) {
            problems.push(`heatmap[${i}] cell ${c}: escapes the grid`);
          }
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  // BUG: `.heatmap__tooltip` is `position: fixed` and is given raw viewport
  // coordinates (`left: rect.left + width/2`, `top: rect.top - 8`), but `:host`
  // sets `contain: layout style`. Layout containment — not just paint
  // containment, as the CSS comment assumes — establishes a containing block for
  // fixed-position descendants, so those viewport coordinates are resolved
  // against the host box instead. The bubble renders offset by the host's page
  // position: measured here at ~49px right of and ~290px below the hovered cell
  // (inline style says left:274px/top:358px, it paints at 242px/632px).
  test.fixme('hover tooltip anchors above the hovered cell and stays on screen', async ({ page }) => {
    const map = page.locator('snice-heatmap[show-tooltip]').first();
    await map.scrollIntoViewIfNeeded();
    await page.waitForTimeout(100);
    const cell = await map.evaluate((host: any) => {
      const cells = [...host.shadowRoot.querySelectorAll('.heatmap__cell')] as HTMLElement[];
      const target = cells[Math.floor(cells.length / 2)];
      const r = target.getBoundingClientRect();
      return { cx: r.left + r.width / 2, top: r.top, bottom: r.bottom };
    });
    await page.mouse.move(cell.cx, (cell.top + cell.bottom) / 2);
    await page.waitForTimeout(200);

    const tip = await map.evaluate((host: any) => {
      const t = host.shadowRoot.querySelector('.heatmap__tooltip') as HTMLElement | null;
      if (!t) return null;
      const r = t.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height, bottom: r.bottom,
        cx: r.left + r.width / 2, text: (t.textContent || '').trim(),
        vw: window.innerWidth, vh: window.innerHeight };
    });

    expect(tip, 'no tooltip appeared on hover').not.toBeNull();
    expect(tip!.text.length).toBeGreaterThan(0);
    // Sane bubble: readable size, horizontally centred on the cell, sitting
    // above it, and fully within the viewport.
    expect(tip!.w).toBeGreaterThan(20);
    expect(tip!.h).toBeGreaterThan(12);
    expect(tip!.h).toBeLessThan(80);
    expect(Math.abs(tip!.cx - cell.cx)).toBeLessThanOrEqual(2);
    expect(tip!.bottom).toBeLessThanOrEqual(cell.top + 2);
    expect(tip!.x).toBeGreaterThanOrEqual(0);
    expect(tip!.x + tip!.w).toBeLessThanOrEqual(tip!.vw);
  });
});
