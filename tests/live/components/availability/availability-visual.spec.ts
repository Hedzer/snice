import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/tests/live/fixtures/availability/visual.html';

test.describe('Snice Availability visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForFunction(() => !!customElements.get('snice-availability'));
    await page.waitForTimeout(200);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('time-slot rows tile uniformly and stay inside the grid', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const widgets = [...document.querySelectorAll('snice-availability')] as any[];
      if (widgets.length === 0) problems.push('no availability widgets');

      widgets.forEach((w, i) => {
        const grid = w.shadowRoot?.querySelector('.availability__grid');
        if (!grid) { problems.push(`avail[${i}]: no grid`); return; }
        const gridRect = grid.getBoundingClientRect();

        const headers = [...grid.querySelectorAll('.availability__day-header')] as HTMLElement[];
        if (headers.length !== 7) problems.push(`avail[${i}]: ${headers.length} day headers`);

        const rows = [...grid.querySelectorAll('.availability__row')] as HTMLElement[];
        const slotRows = rows.filter(r => r.querySelector('.availability__cell'));
        if (slotRows.length === 0) { problems.push(`avail[${i}]: no slot rows`); return; }

        slotRows.forEach((row, r) => {
          const cells = [...row.querySelectorAll('.availability__cell')] as HTMLElement[];
          if (cells.length !== 7) {
            problems.push(`avail[${i}] row ${r}: ${cells.length} cells`);
            return;
          }
          const rects = cells.map(c => c.getBoundingClientRect());
          const tops = rects.map(x => Math.round(x.top));
          const bottoms = rects.map(x => Math.round(x.bottom));
          if (Math.max(...tops) - Math.min(...tops) > 1) {
            problems.push(`avail[${i}] row ${r}: uneven cell tops ${tops.join(',')}`);
          }
          if (Math.max(...bottoms) - Math.min(...bottoms) > 1) {
            problems.push(`avail[${i}] row ${r}: uneven cell bottoms ${bottoms.join(',')}`);
          }
          // Cells must have real height and must not overhang the grid.
          if (rects[0].height < 4) {
            problems.push(`avail[${i}] row ${r}: cell height ${rects[0].height}`);
          }
          if (Math.round(rects[6].right) > Math.round(gridRect.right) + 1) {
            problems.push(`avail[${i}] row ${r}: last cell overhangs grid`);
          }
          // Consecutive rows abut: no gap, no overlap.
          if (r > 0) {
            const prev = slotRows[r - 1].querySelector('.availability__cell')!.getBoundingClientRect();
            if (Math.abs(Math.round(rects[0].top) - Math.round(prev.bottom)) > 1) {
              problems.push(`avail[${i}] row ${r}: seam ${Math.round(prev.bottom)} -> ${Math.round(rects[0].top)}`);
            }
          }
          // Each cell sits under its day header column.
          if (headers.length === 7) {
            rects.forEach((cr, c) => {
              const hr = headers[c].getBoundingClientRect();
              const dx = (cr.left + cr.width / 2) - (hr.left + hr.width / 2);
              if (Math.abs(dx) > 2) {
                problems.push(`avail[${i}] row ${r} col ${c}: misaligned with header by ${Math.round(dx)}px`);
              }
            });
          }
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('dragging a column paints contiguous active cells', async ({ page }) => {
    const target = page.locator('snice-availability:not([readonly])').first();
    const box = await target.evaluate((host: any) => {
      const cells = [...host.shadowRoot.querySelectorAll('.availability__cell')] as HTMLElement[];
      const first = cells[0].getBoundingClientRect();
      return { x: first.left + first.width / 2, y: first.top + first.height / 2 };
    });
    await page.mouse.move(box.x, box.y);
    await page.mouse.down();
    await page.mouse.up();
    await page.waitForTimeout(100);

    const active = await target.evaluate((host: any) => {
      const cell = host.shadowRoot.querySelector('.availability__cell--active') as HTMLElement | null;
      if (!cell) return null;
      const cr = cell.getBoundingClientRect();
      const gr = host.shadowRoot.querySelector('.availability__grid').getBoundingClientRect();
      return {
        w: cr.width, h: cr.height,
        inside: cr.left >= gr.left - 1 && cr.right <= gr.right + 1
          && cr.top >= gr.top - 1 && cr.bottom <= gr.bottom + 1
      };
    });
    expect(active).not.toBeNull();
    expect(active!.w).toBeGreaterThan(4);
    expect(active!.h).toBeGreaterThan(4);
    expect(active!.inside).toBe(true);
  });
});
