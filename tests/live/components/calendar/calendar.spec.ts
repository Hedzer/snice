import { test, expect } from '@playwright/test';

const demoPath = 'http://localhost:5566/components/calendar/demo.html';

// Geometry regression guard: event-lane sizing must never make cells in a
// week row diverge in height, leave gaps between rows, or let cells/bars
// overhang the grid. Runs against EVERY calendar on the full showcase, so
// each configured variant (events, popovers, no-day-select, locales, ...)
// is covered.
test.describe('Snice Calendar grid geometry', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
    // Let event stripes and lane reservations render.
    await page.waitForTimeout(200);
  });

  test('should render calendars', async ({ page }) => {
    expect(await page.locator('snice-calendar').count()).toBeGreaterThan(0);
  });

  test('week rows tile uniformly: equal cell heights, no gaps, no overlap, no overhang', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const calendars = [...document.querySelectorAll('snice-calendar')] as any[];
      calendars.forEach((cal, calIdx) => {
        const grid = cal.shadowRoot?.querySelector('.calendar__grid');
        if (!grid) { problems.push(`cal[${calIdx}]: no grid`); return; }
        const gridRect = grid.getBoundingClientRect();
        const cells = [...grid.querySelectorAll('.calendar__day')] as HTMLElement[];
        if (cells.length !== 42) { problems.push(`cal[${calIdx}]: ${cells.length} cells`); return; }

        const rows: HTMLElement[][] = [];
        for (let w = 0; w < 6; w++) rows.push(cells.slice(w * 7, w * 7 + 7));

        rows.forEach((row, w) => {
          const rects = row.map(c => c.getBoundingClientRect());
          const tops = rects.map(r => Math.round(r.top));
          const bottoms = rects.map(r => Math.round(r.bottom));
          // All cells in a week row must share top AND bottom edges.
          if (Math.max(...tops) - Math.min(...tops) > 1) {
            problems.push(`cal[${calIdx}] week ${w}: uneven cell tops ${tops.join(',')}`);
          }
          if (Math.max(...bottoms) - Math.min(...bottoms) > 1) {
            problems.push(`cal[${calIdx}] week ${w}: uneven cell bottoms ${bottoms.join(',')}`);
          }
          // No cell may overhang the grid to the right.
          const gridRight = Math.round(gridRect.right);
          rects.forEach((r, i) => {
            if (Math.round(r.right) > gridRight + 1) {
              problems.push(`cal[${calIdx}] week ${w} cell ${i}: right ${Math.round(r.right)} > grid ${gridRight}`);
            }
          });
          // Consecutive rows must abut: no gap, no overlap.
          if (w > 0) {
            const prevBottom = Math.round(rows[w - 1][0].getBoundingClientRect().bottom);
            const thisTop = Math.round(rects[0].top);
            if (Math.abs(thisTop - prevBottom) > 1) {
              problems.push(`cal[${calIdx}] week ${w}: row seam ${prevBottom} -> ${thisTop}`);
            }
          }
        });

        // Every event bar must sit fully inside its own week row's box.
        const bars = [...grid.querySelectorAll('.calendar__event-bar')] as HTMLElement[];
        bars.forEach(bar => {
          const rowIdx = parseInt(bar.style.gridRow, 10) - 2;
          const row = rows[rowIdx];
          if (!row) { problems.push(`cal[${calIdx}] bar row ${rowIdx}: missing`); return; }
          const rowTop = Math.min(...row.map(c => c.getBoundingClientRect().top));
          const rowBottom = Math.max(...row.map(c => c.getBoundingClientRect().bottom));
          const br = bar.getBoundingClientRect();
          if (br.top < rowTop - 1 || br.bottom > rowBottom + 1 || br.right > gridRect.right + 1) {
            problems.push(`cal[${calIdx}] bar "${bar.textContent}" week ${rowIdx}: spills its row`);
          }
        });
      });
      return problems;
    });

    expect(failures).toEqual([]);
  });
});
