import { test, expect } from '@playwright/test';

// Adaptive visible-lane count. How many event stripes a week shows is derived
// from the height the day cell actually has — the square baseline
// (100cqw / 7), a height the host imposes, or the stretch floor — so a tall
// calendar fills its rows with bars instead of collapsing them into a
// "+N more" chip. Height math needs real layout, so this lives here rather
// than in the happy-dom suite.
//
// Lane geometry (mirrors snice-calendar.css): the stack starts 2.125rem below
// the top of the cell, each lane is 1.375rem, and the chip claims 1rem.
const LANE = 1.375 * 16;
const STACK_TOP = 2.125 * 16;
const CHIP = 1 * 16;

/**
 * Mounts a calendar whose week rows are exactly `rowPx` tall, by handing the
 * host the room its header, weekday strip and six week rows need.
 */
async function mountCalendar(
  page: import('@playwright/test').Page,
  options: { rowPx: number; events: number; cellSizing?: 'square' | 'stretch' },
) {
  return page.evaluate(async ({ rowPx, events, cellSizing }) => {
    document.querySelectorAll('.lane-harness').forEach(el => el.remove());
    const host = document.createElement('div');
    host.className = 'lane-harness';
    host.style.cssText = 'position: fixed; inset: 0 auto auto 0; width: 640px; background: #fff; z-index: 9999;';
    document.body.appendChild(host);

    const cal = document.createElement('snice-calendar') as any;
    cal.style.maxWidth = 'none';
    if (cellSizing) cal.setAttribute('cell-sizing', cellSizing);
    host.appendChild(cal);
    await cal.ready;

    const sr = cal.shadowRoot as ShadowRoot;
    const header = sr.querySelector('.calendar__header') as HTMLElement;
    const weekday = sr.querySelector('.calendar__weekday') as HTMLElement;
    if (rowPx > 0) {
      cal.style.height = `${header.getBoundingClientRect().height
        + weekday.getBoundingClientRect().height + 6 * rowPx}px`;
    }

    // All events on one mid-month day, so a single week row carries the stack.
    const day = new Date();
    day.setDate(10);
    cal.events = Array.from({ length: events }, (_, i) => ({
      id: i + 1, title: `Event ${i + 1}`, start: new Date(day),
    }));
    await new Promise(r => setTimeout(r, 300));
  }, options);
}

function readLanes(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const cal = document.querySelector('.lane-harness snice-calendar') as any;
    const sr = cal.shadowRoot as ShadowRoot;
    const bars = [...sr.querySelectorAll('.calendar__event-bar')] as HTMLElement[];
    const chip = sr.querySelector('.calendar__more') as HTMLElement | null;
    const cells = [...sr.querySelectorAll('.calendar__day')] as HTMLElement[];
    const row = Number(bars[0]?.style.gridRow ?? 2) - 2;
    const rowCells = cells.slice(row * 7, row * 7 + 7);
    const rowTop = Math.min(...rowCells.map(c => c.getBoundingClientRect().top));
    const rowBottom = Math.max(...rowCells.map(c => c.getBoundingClientRect().bottom));
    return {
      bars: bars.length,
      chip: chip?.textContent ?? null,
      rowHeight: rowBottom - rowTop,
      cellHeights: cells.map(c => Math.round(c.getBoundingClientRect().height)),
      spills: [...bars, ...(chip ? [chip] : [])].some(el => {
        const r = el.getBoundingClientRect();
        return r.top < rowTop - 1 || r.bottom > rowBottom + 1;
      }),
    };
  });
}

test.describe('Snice Calendar adaptive event lanes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/components/calendar/demo.html');
    await page.waitForFunction(() => !!customElements.get('snice-calendar'));
  });

  test('a cell with room for seven lanes shows seven bars, not three', async ({ page }) => {
    // 207px ≈ 12.9rem: seven 1.375rem lanes plus the chip's strip below the
    // 2.125rem day-number strip.
    await mountCalendar(page, { rowPx: 207, events: 8 });
    const lanes = await readLanes(page);

    expect(lanes.bars).toBe(7);
    expect(lanes.chip).toBe('+1 more');
    expect(lanes.spills).toBe(false);
  });

  test('the stack fills the cell: one more lane would not fit', async ({ page }) => {
    await mountCalendar(page, { rowPx: 207, events: 8 });
    const lanes = await readLanes(page);

    expect(STACK_TOP + lanes.bars * LANE + CHIP).toBeLessThanOrEqual(lanes.rowHeight + 1);
    expect(STACK_TOP + (lanes.bars + 1) * LANE + CHIP).toBeGreaterThan(lanes.rowHeight + 1);
  });

  test('no chip while another lane still fits', async ({ page }) => {
    await mountCalendar(page, { rowPx: 207, events: 5 });
    const lanes = await readLanes(page);

    expect(lanes.bars).toBe(5);
    expect(lanes.chip).toBeNull();
  });

  test('a short cell shows fewer lanes and moves the rest to the chip', async ({ page }) => {
    // 72px ≈ 4.5rem: the day-number strip, one lane, and the chip.
    await mountCalendar(page, { rowPx: 72, events: 8 });
    const lanes = await readLanes(page);

    expect(lanes.bars).toBe(1);
    expect(lanes.chip).toBe('+7 more');
    expect(lanes.spills).toBe(false);
  });

  test('lanes re-derive when the calendar is given more room', async ({ page }) => {
    await mountCalendar(page, { rowPx: 72, events: 8 });
    expect((await readLanes(page)).bars).toBe(1);

    await page.evaluate(async () => {
      const cal = document.querySelector('.lane-harness snice-calendar') as any;
      const sr = cal.shadowRoot as ShadowRoot;
      const header = (sr.querySelector('.calendar__header') as HTMLElement).getBoundingClientRect().height;
      const weekday = (sr.querySelector('.calendar__weekday') as HTMLElement).getBoundingClientRect().height;
      cal.style.height = `${header + weekday + 6 * 207}px`;
      await new Promise(r => setTimeout(r, 400));
    });

    const grown = await readLanes(page);
    expect(grown.bars).toBe(7);
    expect(grown.chip).toBe('+1 more');
  });

  test('a busy week never grows taller than the rest of the grid', async ({ page }) => {
    await mountCalendar(page, { rowPx: 207, events: 8 });
    const { cellHeights } = await readLanes(page);

    expect(Math.max(...cellHeights) - Math.min(...cellHeights)).toBeLessThanOrEqual(1);
  });

  test('cell-sizing="stretch" keeps growing to fit every lane', async ({ page }) => {
    // No height imposed: stretch rows collapse to content, so the stack has no
    // budget to run out of and nothing collapses into a chip.
    await mountCalendar(page, { rowPx: 0, events: 8, cellSizing: 'stretch' });
    const lanes = await readLanes(page);

    expect(lanes.bars).toBe(8);
    expect(lanes.chip).toBeNull();
    expect(lanes.spills).toBe(false);
  });
});
