import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/components/grid/demo.html';

test.describe('Snice Grid visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
    // Stagger/transition animations run up to 0.6s + 50ms per item.
    await page.waitForTimeout(1500);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('items land exactly on their column-width/row-height cell, spans included', async ({ page }) => {
    const result = await page.evaluate(() => {
      const problems: string[] = [];
      const grids = [...document.querySelectorAll('snice-grid')] as any[];
      if (!grids.length) problems.push('no snice-grid on page');

      grids.forEach((grid, g) => {
        const cw = parseFloat(grid.getAttribute('column-width') || '80');
        const rh = parseFloat(grid.getAttribute('row-height') || '80');
        const gap = parseFloat(grid.getAttribute('gap') || '8');
        const gr = grid.getBoundingClientRect();
        const originX = gr.left + grid.clientLeft;
        const originY = gr.top + grid.clientTop;

        const items = [...grid.children] as HTMLElement[];
        items.forEach((item, i) => {
          const col = parseInt(item.getAttribute('grid-col') || '0', 10);
          const row = parseInt(item.getAttribute('grid-row') || '0', 10);
          const cs = parseInt(item.getAttribute('grid-colspan') || '1', 10);
          const rs = parseInt(item.getAttribute('grid-rowspan') || '1', 10);
          const r = item.getBoundingClientRect();
          if (r.width === 0 && r.height === 0) return;

          const expX = originX + col * (cw + gap);
          const expY = originY + row * (rh + gap);
          const expW = cs * cw + (cs - 1) * gap;
          const expH = rs * rh + (rs - 1) * gap;
          const tag = `grid[${g}] item[${i}] "${(item.textContent || '').trim().slice(0, 8)}"`;

          if (Math.abs(r.left - expX) > 1.5 || Math.abs(r.top - expY) > 1.5) {
            problems.push(`${tag}: at (${Math.round(r.left - originX)},${Math.round(r.top - originY)})`
              + ` expected (${Math.round(expX - originX)},${Math.round(expY - originY)})`);
          }
          if (Math.abs(r.width - expW) > 1.5 || Math.abs(r.height - expH) > 1.5) {
            problems.push(`${tag}: ${Math.round(r.width)}x${Math.round(r.height)}`
              + ` expected ${expW}x${expH}`);
          }
        });
      });
      return problems;
    });
    expect(result).toEqual([]);
  });

  test('resolved layouts never overlap and the grid box contains every item', async ({ page }) => {
    const result = await page.evaluate(() => {
      const problems: string[] = [];
      ([...document.querySelectorAll('snice-grid')] as any[]).forEach((grid, g) => {
        const gr = grid.getBoundingClientRect();
        const items = ([...grid.children] as HTMLElement[])
          .filter(el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; });

        items.forEach((el, i) => {
          const r = el.getBoundingClientRect();
          if (r.right > gr.right + 1 || r.bottom > gr.bottom + 1
              || r.left < gr.left - 1 || r.top < gr.top - 1) {
            problems.push(`grid[${g}] item[${i}]: escapes the grid box`);
          }
        });

        for (let a = 0; a < items.length; a++) {
          for (let b = a + 1; b < items.length; b++) {
            const ra = items[a].getBoundingClientRect();
            const rb = items[b].getBoundingClientRect();
            const overlapX = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left);
            const overlapY = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
            if (overlapX > 1 && overlapY > 1) {
              problems.push(`grid[${g}] items ${a}/${b} overlap by`
                + ` ${Math.round(overlapX)}x${Math.round(overlapY)}px`);
            }
          }
        }
      });
      return problems;
    });
    expect(result).toEqual([]);
  });
});
