import { test, expect } from '@playwright/test';

const demoPath = process.env.CALENDAR_SHOWCASE_URL
  || 'http://localhost:5566/components/calendar/demo.html';

/**
 * Showcase-level guards for the parts of the calendar page that only real
 * layout can express: the `show-week-numbers` column has to occupy a column
 * of its own (never overlapping the day grid), and the "multiple colored
 * events on same date" section has to actually show every event — it is the
 * only thing that section claims.
 */
test.describe('Calendar showcase — week numbers and same-day stacks', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForFunction(() =>
      [...document.querySelectorAll('snice-calendar')]
        .every(cal => !!(cal as any).shadowRoot?.querySelector('.calendar__day')));
    // Let event stripes and lane reservations settle.
    await page.waitForTimeout(300);
  });

  test('show-week-numbers paints a real column left of the day grid', async ({ page }) => {
    const geometry = await page.evaluate(() => {
      const cal = document.querySelector('snice-calendar[show-week-numbers]') as any;
      if (!cal) return { error: 'no show-week-numbers calendar on the page' };
      const sr = cal.shadowRoot as ShadowRoot;
      const numbers = [...sr.querySelectorAll(
        '.calendar__week-number:not(.calendar__week-number--header)')] as HTMLElement[];
      const days = [...sr.querySelectorAll('.calendar__day')] as HTMLElement[];
      return {
        error: null,
        labels: numbers.map(n => n.textContent!.trim()),
        widths: numbers.map(n => Math.round(n.getBoundingClientRect().width)),
        // Each number must sit fully left of its week's first day cell, and
        // share that row's vertical band.
        rows: numbers.map((n, week) => {
          const cell = days[week * 7].getBoundingClientRect();
          const rect = n.getBoundingClientRect();
          return {
            clearsDayCell: Math.round(rect.right) <= Math.round(cell.left) + 1,
            sharesTop: Math.abs(rect.top - cell.top) <= 1,
            sharesBottom: Math.abs(rect.bottom - cell.bottom) <= 1,
          };
        }),
      };
    });

    expect(geometry.error).toBeNull();
    expect(geometry.labels).toHaveLength(6);
    expect(geometry.labels.every(l => /^\d+$/.test(l))).toBe(true);
    expect(geometry.widths.every(w => w > 20)).toBe(true);
    for (const row of geometry.rows!) {
      expect(row.clearsDayCell).toBe(true);
      expect(row.sharesTop).toBe(true);
      expect(row.sharesBottom).toBe(true);
    }
  });

  test('the multi-colored section shows all three events, with no "+N more"', async ({ page }) => {
    const section = await page.evaluate(() => {
      const cal = document.getElementById('cal-multi-events') as any;
      if (!cal) return { error: 'no #cal-multi-events on the page' };
      const sr = cal.shadowRoot as ShadowRoot;
      const bars = [...sr.querySelectorAll('.calendar__event-bar')] as HTMLElement[];
      return {
        error: null,
        eventCount: cal.events.length,
        titles: bars.map(b => b.textContent!.trim()),
        colors: [...new Set(bars.map(b => getComputedStyle(b).backgroundColor))],
        lanes: bars.map(b => b.getAttribute('data-lane')),
        moreChips: sr.querySelectorAll('.calendar__more').length,
        // Every bar must be inside the grid it belongs to.
        contained: bars.every(b => {
          const grid = sr.querySelector('.calendar__grid')!.getBoundingClientRect();
          const r = b.getBoundingClientRect();
          return r.top >= grid.top - 1 && r.bottom <= grid.bottom + 1 && r.height > 0;
        }),
      };
    });

    expect(section.error).toBeNull();
    expect(section.eventCount).toBe(3);
    expect(section.titles!.sort()).toEqual(['Event A', 'Event B', 'Event C']);
    expect(section.lanes!.sort()).toEqual(['0', '1', '2']);
    // The point of the section: three distinct colors, all painted.
    expect(section.colors!).toHaveLength(3);
    expect(section.moreChips).toBe(0);
    expect(section.contained).toBe(true);
  });

  test('the locale section renders the ja-JP calendar it advertises', async ({ page }) => {
    const weekdays = await page.evaluate(() => {
      const cal = document.querySelector('snice-calendar[locale="ja-JP"]') as any;
      if (!cal) return null;
      return [...cal.shadowRoot.querySelectorAll('.calendar__weekday')]
        .map((el: any) => el.textContent.trim());
    });

    expect(weekdays).not.toBeNull();
    expect(weekdays).toHaveLength(7);
    // Japanese short weekday names, Sunday first.
    expect(weekdays!.join('')).toMatch(/[日月火水木金土]/);
  });

  test('highlight-today="false" leaves today unpainted next to the default', async ({ page }) => {
    const pair = await page.evaluate(() => {
      const read = (cal: any) => {
        const sr = cal.shadowRoot as ShadowRoot;
        const cells = [...sr.querySelectorAll('.calendar__day')] as HTMLElement[];
        const today = cells.find(c => c.classList.contains('calendar__day--today'));
        return {
          todayCells: cells.filter(c => c.classList.contains('calendar__day--today')).length,
          selectedCells: cells.filter(c => c.classList.contains('calendar__day--selected')).length,
          todayBg: today ? getComputedStyle(today).backgroundColor : null,
          plainBg: getComputedStyle(cells[cells.length - 1]).backgroundColor,
        };
      };
      const on = document.querySelector('snice-calendar[highlight-today=""]')
        ?? document.querySelector('snice-calendar[highlight-today]:not([highlight-today="false"])');
      const off = document.querySelector('snice-calendar[highlight-today="false"]');
      if (!on || !off) return null;
      return { on: read(on), off: read(off) };
    });

    expect(pair).not.toBeNull();
    // Default: exactly one today cell, painted differently from a plain cell.
    expect(pair!.on.todayCells).toBe(1);
    expect(pair!.on.todayBg).not.toBe(pair!.on.plainBg);
    // Off: nothing marks today — and no default selection paints over it.
    expect(pair!.off.todayCells).toBe(0);
    expect(pair!.off.selectedCells).toBe(0);
  });
});
