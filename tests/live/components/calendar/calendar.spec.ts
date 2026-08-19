import { test, expect } from '@playwright/test';

const demoPath = 'http://localhost:5566/tests/live/fixtures/calendar/visual.html';

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

        // Rows must be square: cell height equals the column width (within a
        // border-rounding tolerance). Event lanes are budgeted against that
        // height instead of growing past it, so a week carrying stripes is
        // square too — only a cell too short for even one lane keeps the
        // reservation that makes its row grow. cell-sizing="stretch" and
        // calendars the page gives a height of their own opt out.
        rows.forEach((row, w) => {
          if (cal.cellSizing === 'stretch' || cal.style.height) return;
          if (row.some(c => c.style.getPropertyValue('--calendar-week-lanes'))) return;
          const r = row[0].getBoundingClientRect();
          if (Math.abs(r.height - r.width) > 2) {
            problems.push(`cal[${calIdx}] week ${w}: not square (${Math.round(r.width)}x${Math.round(r.height)})`);
          }
        });

        // The lane budget must be spent: no day collapses events into a
        // "+N more" chip while its row still has room for another lane.
        // Lane geometry mirrors snice-calendar.css (rem values × 16).
        const laneStack = (lanes: number, chip: boolean) =>
          (2.125 + lanes * 1.375 + (chip ? 1 : 0)) * 16;
        rows.forEach((row, w) => {
          const chips = row.filter(c => c.querySelector('.calendar__more'));
          if (chips.length === 0) return;
          const shown = new Set([...grid.querySelectorAll('.calendar__event-bar')]
            .filter((b: any) => parseInt(b.style.gridRow, 10) - 2 === w)
            .map((b: any) => b.getAttribute('data-lane'))).size;
          const rowHeight = row[0].getBoundingClientRect().height;
          if (shown > 0 && laneStack(shown + 1, true) <= rowHeight + 1) {
            problems.push(`cal[${calIdx}] week ${w}: ${shown} lanes shown but `
              + `${Math.round(rowHeight)}px of row fits another`);
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
