import { test, expect } from '@playwright/test';

// A host that constrains the calendar's height must not lose the bottom of the
// month. The square baseline (100cqw / 7) sizes week rows from the column
// width, which is taller than an `aspect-ratio: 1` host can hold once the
// header and weekday strip take their share — the grid overflowed the host by
// ~85px and the components-page card's `overflow: hidden` chopped the last two
// weeks off.
//
// Contract asserted here: when the host hands down a definite height, the six
// week rows share what is left under the header instead of insisting on the
// square baseline, so the whole month stays inside the host. The lane budget
// follows the compressed row — events that no longer fit collapse into the
// "+N more" chip rather than being drawn outside their cell.

async function mount(
  page: import('@playwright/test').Page,
  hostStyle: string,
  events = true,
  attrs: Record<string, string> = {},
) {
  return page.evaluate(async ({ hostStyle, events, attrs }) => {
    document.querySelectorAll('.fit-harness').forEach(el => el.remove());
    const host = document.createElement('div');
    host.className = 'fit-harness';
    host.style.cssText =
      'position: fixed; inset: 0 auto auto 0; width: 520px; background: #fff; z-index: 9999;';
    document.body.appendChild(host);

    const cal = document.createElement('snice-calendar') as any;
    cal.setAttribute('highlight-today', '');
    for (const [name, value] of Object.entries(attrs)) cal.setAttribute(name, value);
    cal.style.cssText = hostStyle;
    host.appendChild(cal);
    await cal.ready;

    if (events) {
      const inDays = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return d; };
      cal.events = [
        { id: 1, title: 'Sprint Review', start: inDays(1), color: '#3b82f6' },
        { id: 2, title: 'Conference', start: inDays(3), end: inDays(9), color: '#22c55e' },
        { id: 3, title: 'Planning', start: inDays(4), color: '#f59e0b' },
        { id: 4, title: 'Demo Day', start: inDays(6), color: '#8b5cf6' },
      ];
    }
    await new Promise(r => setTimeout(r, 400));
  }, { hostStyle, events, attrs });
}

function readFit(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const cal = document.querySelector('.fit-harness snice-calendar') as any;
    const sr = cal.shadowRoot as ShadowRoot;
    const host = cal.getBoundingClientRect();
    const grid = (sr.querySelector('.calendar__grid') as HTMLElement).getBoundingClientRect();
    const cells = [...sr.querySelectorAll('.calendar__day')] as HTMLElement[];
    const bars = [...sr.querySelectorAll('.calendar__event-bar')] as HTMLElement[];
    const chips = [...sr.querySelectorAll('.calendar__more')] as HTMLElement[];

    const rowBox = (row: number) => {
      const rowCells = cells.slice(row * 7, row * 7 + 7);
      return {
        top: Math.min(...rowCells.map(c => c.getBoundingClientRect().top)),
        bottom: Math.max(...rowCells.map(c => c.getBoundingClientRect().bottom)),
      };
    };

    const spills = [...bars, ...chips].some(el => {
      const r = el.getBoundingClientRect();
      const row = Number((el.closest('.calendar__day') as HTMLElement)?.style.gridRow
        ?? el.style.gridRow) - 2;
      const box = rowBox(row);
      return r.top < box.top - 1 || r.bottom > box.bottom + 1;
    });

    // A cell that cannot shrink to its capped track overflows it and paints
    // over the week below. Nothing may ever produce that.
    let rowOverlap = 0;
    for (let row = 0; row < 5; row++) {
      rowOverlap = Math.max(rowOverlap, rowBox(row).bottom - rowBox(row + 1).top);
    }

    return {
      hostBottom: host.bottom,
      hostHeight: host.height,
      gridBottom: grid.bottom,
      lastRowBottom: rowBox(5).bottom,
      cellHeights: cells.map(c => Math.round(c.getBoundingClientRect().height)),
      bars: bars.length,
      chips: chips.map(c => c.textContent),
      cap: (sr.querySelector('.calendar__grid') as HTMLElement)
        .style.getPropertyValue('--calendar-row-cap'),
      rowOverlap,
      spills,
    };
  });
}

test.describe('Snice Calendar in a height-constrained host', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/components/calendar/demo.html');
    await page.waitForFunction(() => !!customElements.get('snice-calendar'));
  });

  test('an aspect-ratio:1 host keeps the whole month inside its box', async ({ page }) => {
    await mount(page, 'min-width: 360px; width: 360px; aspect-ratio: 1');
    const fit = await readFit(page);

    expect(fit.hostHeight).toBeCloseTo(360, 0);
    expect(fit.gridBottom).toBeLessThanOrEqual(fit.hostBottom + 1);
    expect(fit.lastRowBottom).toBeLessThanOrEqual(fit.hostBottom + 1);
  });

  test('an empty aspect-ratio:1 host also fits its six week rows', async ({ page }) => {
    await mount(page, 'min-width: 360px; width: 360px; aspect-ratio: 1', false);
    const fit = await readFit(page);

    expect(fit.gridBottom).toBeLessThanOrEqual(fit.hostBottom + 1);
  });

  test('compressed rows stay uniform and nothing is drawn outside its row', async ({ page }) => {
    await mount(page, 'min-width: 360px; width: 360px; aspect-ratio: 1');
    const fit = await readFit(page);

    expect(Math.max(...fit.cellHeights) - Math.min(...fit.cellHeights)).toBeLessThanOrEqual(1);
    expect(fit.spills).toBe(false);
  });

  test('an unconstrained host still gets square, uncompressed cells', async ({ page }) => {
    await mount(page, 'width: 360px');
    const fit = await readFit(page);

    // 360 / 7 ≈ 51: the square baseline is untouched when nothing constrains
    // the height, and the busy week keeps its lane reservation.
    expect(Math.min(...fit.cellHeights)).toBeGreaterThanOrEqual(50);
    expect(fit.bars).toBeGreaterThan(0);
    expect(fit.spills).toBe(false);
  });

  test('a generous height still grows the lane budget', async ({ page }) => {
    await mount(page, 'width: 420px; height: 900px');
    const fit = await readFit(page);

    expect(fit.gridBottom).toBeLessThanOrEqual(fit.hostBottom + 1);
    expect(fit.chips).toEqual([]);
    expect(fit.spills).toBe(false);
  });

  // The cap lands as a definite `grid-template-rows` track, so any cell that
  // cannot shrink to it stops fitting its own row and paints over the next
  // week. These pin the three places where that could happen.

  test('a max-height host is constrained too, not just a definite height', async ({ page }) => {
    // `.calendar`'s `height: 100%` resolves to auto against a max-height'd
    // host, so the container reports the height it WANTED. Measuring only the
    // container missed this and let the month hang out of its own box.
    await mount(page, 'width: 360px; max-height: 300px');
    const fit = await readFit(page);

    expect(fit.gridBottom).toBeLessThanOrEqual(fit.hostBottom + 1);
    expect(fit.rowOverlap).toBeLessThanOrEqual(1);
  });

  test('a host too short for even the cell padding overflows rather than overlapping', async ({ page }) => {
    // A week row can never be shorter than its own padding and rules, so below
    // that floor there is no height left to buy. The grid overflows the way it
    // always did instead of stacking week over week.
    await mount(page, 'width: 360px; height: 150px');
    const fit = await readFit(page);

    expect(fit.rowOverlap).toBeLessThanOrEqual(1);
    expect(Math.max(...fit.cellHeights) - Math.min(...fit.cellHeights))
      .toBeLessThanOrEqual(1);
  });

  for (const view of ['week', 'day'] as const) {
    test(`view="${view}" keeps its own row minimum and is never capped`, async ({ page }) => {
      // These views set much taller `min-height`s at higher specificity than
      // the cap's `min()`. Capping their tracks would detach every cell from
      // its row. They keep the uncapped behaviour instead.
      await mount(page, 'width: 360px; height: 320px', true, { view });
      const fit = await readFit(page);

      expect(fit.cap).toBe('');
      expect(fit.rowOverlap).toBeLessThanOrEqual(1);
    });
  }

  test('the cap settles instead of oscillating as the host crosses the boundary', async ({ page }) => {
    await mount(page, 'width: 360px; height: 900px');
    await page.evaluate(() => {
      const cal = document.querySelector('.fit-harness snice-calendar') as any;
      const grid = cal.shadowRoot.querySelector('.calendar__grid') as HTMLElement;
      const seen: string[] = [];
      new MutationObserver(() => {
        const v = grid.style.getPropertyValue('--calendar-row-cap') || '(none)';
        if (seen[seen.length - 1] !== v) seen.push(v);
      }).observe(grid, { attributes: true, attributeFilter: ['style'] });
      (window as any).__capLog = seen;
    });

    for (const height of [900, 400, 320, 280, 320, 400, 900]) {
      await page.evaluate((h) => {
        (document.querySelector('.fit-harness snice-calendar') as HTMLElement)
          .style.height = `${h}px`;
      }, height);
      await page.waitForTimeout(400);
      const fit = await readFit(page);
      expect(fit.lastRowBottom, `overflow at ${height}px`)
        .toBeLessThanOrEqual(fit.hostBottom + 1.5);
      expect(fit.rowOverlap, `overlap at ${height}px`).toBeLessThanOrEqual(1);
    }

    const fit = await readFit(page);
    // Back where it started: the cap is released, not left latched on.
    expect(fit.cap).toBe('');
    // One publish per distinct height it settled at, and no churn on top.
    const log = await page.evaluate(() => (window as any).__capLog as string[]);
    expect(log.length, `cap churn: ${JSON.stringify(log)}`).toBeLessThanOrEqual(8);
  });
});
