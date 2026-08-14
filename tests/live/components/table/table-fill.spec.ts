import { test, expect } from '@playwright/test';

const fixture = 'http://localhost:5566/tests/live/fixtures/table/fill.html';

// A table given an explicit height must feel like it occupies all of it:
// the empty space below the last row stays inside the visual grid — column
// separators continue to the bottom edge — instead of the borders cutting
// off where the rows end.
test.describe('Snice Table height fill', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(fixture);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(300);
  });

  test('sized table with few rows extends the grid to the bottom edge', async ({ page }) => {
    const geo = await page.evaluate(() => {
      const t = document.getElementById('sized') as any; // 3 rows in a 14rem box
      const sr = t.shadowRoot;
      const frame = sr.querySelector('.table-frame');
      const fill = sr.querySelector('tbody tr.table-fill-row');
      if (!fill) return { fill: false };
      const frameRect = frame.getBoundingClientRect();
      const fillRect = fill.getBoundingClientRect();
      const ths = [...sr.querySelectorAll('thead th')] as HTMLElement[];
      const tds = [...fill.querySelectorAll('td')] as HTMLElement[];
      return {
        fill: true,
        gapToBottom: Math.round(frameRect.bottom - fillRect.bottom),
        fillHeight: Math.round(fillRect.height),
        cellCount: { th: ths.length, td: tds.length },
        // Column separators continue: fill cells share the header's boundaries.
        misaligned: tds.filter((td, i) => ths[i]
          && Math.abs(td.getBoundingClientRect().right - ths[i].getBoundingClientRect().right) > 1).length,
        aria: { role: fill.getAttribute('role'), rowindex: fill.getAttribute('aria-rowindex') },
      };
    });

    expect(geo.fill).toBe(true);
    expect(geo.fillHeight).toBeGreaterThan(10);
    expect(Math.abs(geo.gapToBottom)).toBeLessThanOrEqual(2);
    expect(geo.cellCount.td).toBe(geo.cellCount.th);
    expect(geo.misaligned).toBe(0);
    // Inert for assistive tech and row numbering.
    expect(geo.aria.role).toBeNull();
    expect(geo.aria.rowindex).toBeNull();
  });

  test('overflowing table gets no fill row', async ({ page }) => {
    const hasFill = await page.evaluate(() => {
      const t = document.getElementById('overflow') as any; // 30 rows in a 10rem box
      return !!t.shadowRoot.querySelector('tbody tr.table-fill-row');
    });
    expect(hasFill).toBe(false);
  });

  test('the fill area is inert — no hover affordance, no row events', async ({ page }) => {
    const result = await page.evaluate(() => {
      const t = document.getElementById('sized') as any;
      const fill = t.shadowRoot.querySelector('tbody tr.table-fill-row');
      if (!fill) return { fill: false };
      const events: string[] = [];
      ['row-click', 'selection-change', 'cell-edit-start'].forEach(name =>
        t.addEventListener(name, () => events.push(name)));
      const rect = fill.getBoundingClientRect();
      const target = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
      return {
        fill: true,
        pointerEvents: getComputedStyle(fill).pointerEvents,
        events,
      };
    });
    expect(result.fill).toBe(true);
    expect(result.pointerEvents).toBe('none');
    expect(result.events).toEqual([]);
  });
});
