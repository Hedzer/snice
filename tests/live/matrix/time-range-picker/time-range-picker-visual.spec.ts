/**
 * snice-time-range-picker TRUE-VISUAL matrix.
 *
 * The DOM matrix (`tests/matrix/time-range-picker/`, 67 combos) owns the
 * arithmetic: which slots exist at each granularity, what each one is captioned,
 * which `value` selects which of them, and which events a gesture emits. It
 * cannot own anything below, because happy-dom performs no layout and resolves
 * no colours:
 *
 *   · "Vertically STACKED time slot picker" is a geometry claim. In happy-dom
 *     every slot is a 0x0 box at the same origin, so a picker that painted all
 *     288 of its slots on top of each other would pass the whole DOM tier.
 *   · The drag gesture resolves its intermediate moves with
 *     `shadowRoot.elementFromPoint`. The DOM tier has to substitute that call;
 *     here the browser answers it from real layout, which is the only place the
 *     documented "click-and-drag range selection" is really exercised.
 *   · `slot--selected`, `slot--disabled` and `slot--dragging` are documented
 *     states whose whole meaning is a painted difference.
 *   · `disabled` and `readonly` resolve to `pointer-events` and opacity rules,
 *     which is what makes them different from each other on screen.
 *
 * LAYER 1 — geometry / occlusion / computed style over
 *   {4 granularities} x {2 formats} = 8 combos, plus the measurements above.
 * LAYER 2 — one pinned screenshot: a selected slot really paints apart from an
 *   unselected one and from a blocked one.
 */
import { test, expect, type Page } from '@playwright/test';
import {
  openChartStage, mount, collectChartProblems, type ChartProbe,
} from '../chart-visual-support';
import { capture, contrast, sameColor } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/time-range-picker/matrix.html';

/**
 * A window per granularity, each sized to SIX slots. The shared probe requires
 * every mark to sit inside the surface, and the slots container is a scroll box
 * — so a column longer than its viewport would report the slots below the fold
 * as "escaping", which is what a scroll box is FOR. The 288-slot column gets
 * its own dedicated test below, where scrolling is the thing being asserted.
 */
const GRANULARITIES = [
  { granularity: 5, startTime: '08:00', endTime: '08:25' },
  { granularity: 15, startTime: '08:00', endTime: '09:15' },
  { granularity: 30, startTime: '08:00', endTime: '10:30' },
  { granularity: 60, startTime: '08:00', endTime: '13:00' },
] as const;
const FORMATS = ['24h', '12h'] as const;

/**
 * The picker's marks are its slots. `requireDistinctPositions` is the check
 * that matters most here: a vertical stack whose slots all share an origin is
 * exactly the regression happy-dom cannot see.
 */
const PROBE: ChartProbe = {
  surface: '[part~="slots"]',
  marks: '.slot',
  minMarks: 2,
  requireDistinctPositions: true,
  occlusion: true,
  text: '.slot-time',
  boxes: ['[part~="base"]', '[part~="header"]', '[part~="slots"]'],
};

/** Slot boxes and the classes they carry, read from the shadow tree. */
function slotBoxes(page: Page) {
  return page.evaluate(() => [...document.getElementById('subject')!
    .shadowRoot!.querySelectorAll('.slot')].map((node) => {
    const b = node.getBoundingClientRect();
    return {
      time: node.getAttribute('data-time'),
      className: node.className,
      left: b.left, top: b.top, right: b.right, bottom: b.bottom,
      width: b.width, height: b.height,
    };
  }));
}

test.describe('snice-time-range-picker visual matrix (layer 1)', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => { page = await openChartStage(browser, FIXTURE); });
  test.afterAll(async () => { await page?.close(); });

  for (const window of GRANULARITIES) {
    for (const format of FORMATS) {
      const id = `gran=${window.granularity}/${format}`;
      test(id, async () => {
        await mount(page, { ...window, format });
        expect(await collectChartProblems(page, PROBE), id).toEqual([]);
        expect(await page.evaluate(() => document.getElementById('subject')!
          .shadowRoot!.querySelectorAll('.slot').length), id).toBe(6);
      });
    }
  }

  test('the slots really stack vertically, in time order', async () => {
    // "Vertically stacked time slot picker" — the component's own first
    // sentence, and a pure layout fact.
    const problems: string[] = [];
    for (const window of GRANULARITIES) {
      const granularity = window.granularity;
      await mount(page, window);
      const boxes = await slotBoxes(page);
      for (let i = 1; i < boxes.length; i++) {
        const prev = boxes[i - 1];
        const cur = boxes[i];
        if (!(cur.top >= prev.bottom - 1.5)) {
          problems.push(`gran=${granularity}: slot ${i} (${cur.time}) overlaps the one above it`);
        }
        if (Math.abs(cur.left - prev.left) > 1.5 || Math.abs(cur.width - prev.width) > 1.5) {
          problems.push(`gran=${granularity}: slot ${i} (${cur.time}) is not aligned with its column`);
        }
      }
    }
    expect(problems).toEqual([]);
  });

  test('a full day of five-minute slots scrolls inside its own container', async () => {
    // 288 slots is the widest documented column. It has to overflow SOMEWHERE;
    // the only acceptable somewhere is the slots container's own scroll box —
    // the page itself must not grow a scrollbar.
    await mount(page, { granularity: 5, startTime: '00:00', endTime: '23:59' });
    const measured = await page.evaluate(() => {
      const host = document.getElementById('subject')!;
      const container = host.shadowRoot!.querySelector('[part~="slots"]') as HTMLElement;
      return {
        slots: host.shadowRoot!.querySelectorAll('.slot').length,
        scrolls: container.scrollHeight > container.clientHeight,
        overflowY: getComputedStyle(container).overflowY,
        pageScrolls: document.documentElement.scrollHeight > document.documentElement.clientHeight + 4,
      };
    });
    expect(measured.slots).toBe(288);
    expect(measured.scrolls, 'the 288-slot column does not overflow its own container').toBe(true);
    expect(['auto', 'scroll'], `the slots container is overflow-y: ${measured.overflowY}`)
      .toContain(measured.overflowY);
  });

  test('a real pointer drag selects the span it crossed', async () => {
    // The gesture the component is named for, driven end to end by the
    // browser's own hit testing rather than the DOM tier's substitute.
    await mount(page, { granularity: 60, startTime: '08:00', endTime: '12:00' });
    const result = await page.evaluate(() => (window as any).matrix.dragSlots(1, 3));
    expect(result.ranges).toEqual([{ start: '09:00', end: '11:00' }]);
    expect(JSON.parse(result.value)).toEqual([{ start: '09:00', end: '11:00' }]);
  });

  test('a drag in progress highlights exactly the slots under it', async () => {
    // `.slot--dragging` is a live preview of the range about to be selected,
    // and it exists only while the pointer is down — which is precisely the
    // moment the DOM tier cannot observe with real coordinates.
    await mount(page, { granularity: 60, startTime: '08:00', endTime: '12:00' });
    const highlighted = await page.evaluate(() => (window as any).matrix.beginDrag(1, 3));
    const painted = await page.evaluate(() => {
      const sr = document.getElementById('subject')!.shadowRoot!;
      const bg = (node: Element) => getComputedStyle(node).backgroundColor;
      return {
        dragging: [...sr.querySelectorAll('.slot--dragging')].map(bg),
        untouched: bg(sr.querySelector('.slot:not(.slot--dragging)')!),
      };
    });
    await page.evaluate(() => (window as any).matrix.endDrag());

    expect(highlighted, 'the drag highlighted the wrong number of slots').toBe(3);
    expect(painted.dragging.filter(colour => colour === painted.untouched),
      'a slot under the pointer is painted like an untouched one').toEqual([]);
  });

  test('selected, blocked and plain slots paint three different backgrounds', async () => {
    // `.slot--selected` and `.slot--disabled` are the two states the doc gives
    // a slot, and the DOM tier can only see their class names.
    await mount(page, {
      granularity: 60,
      startTime: '08:00',
      endTime: '12:00',
      value: JSON.stringify([{ start: '09:00', end: '09:00' }]),
      disabledRanges: JSON.stringify([{ start: '11:00', end: '11:00' }]),
    });
    const colours = await page.evaluate(() => {
      const sr = document.getElementById('subject')!.shadowRoot!;
      const bg = (selector: string) => {
        const node = sr.querySelector(selector);
        return node ? getComputedStyle(node).backgroundColor : null;
      };
      return {
        selected: bg('.slot--selected'),
        blocked: bg('.slot--disabled'),
        plain: bg('.slot:not(.slot--selected):not(.slot--disabled)'),
      };
    });

    expect(colours.selected, 'no selected slot rendered').toBeTruthy();
    expect(colours.blocked, 'no blocked slot rendered').toBeTruthy();
    expect(colours.selected, 'a selected slot paints like a plain one').not.toBe(colours.plain);
    expect(colours.blocked, 'a blocked slot paints like a plain one').not.toBe(colours.plain);
    expect(colours.selected, 'selected and blocked slots share a colour').not.toBe(colours.blocked);
  });

  test('disabled takes the whole column out of the pointer\'s reach', async () => {
    // `:host([disabled])` resolves to `pointer-events: none` plus a dimmed
    // host; a hit test is the browser's own answer to "can the user aim here".
    await mount(page, { granularity: 60 });
    const live = await probeReach(page);
    await mount(page, { granularity: 60, disabled: true });
    const off = await probeReach(page);

    expect(live.hits, 'a live picker does not hit-test to its own slots').toBe(live.count);
    expect(off.hits, 'a disabled picker still hit-tests to its slots').toBe(0);
    expect(Number(off.opacity), 'a disabled picker is painted at full strength')
      .toBeLessThan(Number(live.opacity));
  });

  test('readonly refuses the gesture without dimming the picker', async () => {
    // `readonly` and `disabled` are documented as SEPARATE switches, and the
    // difference is exactly this: a readonly picker still looks live and still
    // hit-tests to its slots — it simply does not change when you drag it.
    // `disabled` (asserted above) goes dim and stops answering the pointer.
    await mount(page, {
      granularity: 60,
      startTime: '08:00',
      endTime: '12:00',
      readonly: true,
      value: JSON.stringify([{ start: '09:00', end: '09:00' }]),
    });

    const before = await page.evaluate(() => ({
      opacity: Number(getComputedStyle(document.getElementById('subject')!).opacity),
      selected: document.getElementById('subject')!.shadowRoot!
        .querySelectorAll('.slot--selected').length,
      pointerEvents: getComputedStyle(document.getElementById('subject')!).pointerEvents,
    }));
    const dragged = await page.evaluate(() => (window as any).matrix.dragSlots(2, 4));

    expect(before.opacity, 'readonly dimmed the picker the way disabled does').toBe(1);
    expect(before.pointerEvents, 'readonly took the picker out of the pointer\'s reach')
      .not.toBe('none');
    expect(before.selected, 'a readonly picker stopped showing its own selection').toBe(1);
    expect(dragged.ranges, 'a drag changed a readonly picker\'s selection')
      .toEqual([{ start: '09:00', end: '09:00' }]);
  });

  test('a blocked slot cannot be reached by the pointer', async () => {
    await mount(page, {
      granularity: 60,
      disabledRanges: JSON.stringify([{ start: '10:00', end: '10:00' }]),
    });
    const cursor = await page.evaluate(() => {
      const sr = document.getElementById('subject')!.shadowRoot!;
      const blocked = sr.querySelector('.slot--disabled') as HTMLElement;
      return { cursor: getComputedStyle(blocked).cursor, tabIndex: blocked.getAttribute('tabindex') };
    });
    expect(cursor.tabIndex).toBe('-1');
    expect(['not-allowed', 'default'], `a blocked slot shows the ${cursor.cursor} cursor`)
      .toContain(cursor.cursor);
  });

  test('the header stays legible while the column scrolls under it', async () => {
    // The header carries the selected-value display; a 288-slot column that
    // scrolled OVER it would hide the only readout the picker has.
    await mount(page, {
      granularity: 5, startTime: '00:00', endTime: '23:59',
      value: JSON.stringify([{ start: '09:00', end: '09:05' }]),
    });
    const layout = await page.evaluate(() => {
      const sr = document.getElementById('subject')!.shadowRoot!;
      const header = sr.querySelector('[part~="header"]')!.getBoundingClientRect();
      const slots = sr.querySelector('[part~="slots"]')!.getBoundingClientRect();
      const point = { x: header.left + header.width / 2, y: header.top + header.height / 2 };
      const hit = (sr as any).elementFromPoint(point.x, point.y) as Element | null;
      const headerEl = sr.querySelector('[part~="header"]')!;
      return {
        headerAbove: header.bottom <= slots.top + 1.5,
        headerVisible: hit === headerEl || headerEl.contains(hit),
        value: sr.querySelector('.header-value')!.textContent!.trim(),
      };
    });
    expect(layout.headerAbove, 'the header is not above the slot column').toBe(true);
    expect(layout.headerVisible, 'something paints over the header').toBe(true);
    expect(layout.value).toBe('09:00 - 09:10');
  });
});

/** Can a pointer reach the slots, and how brightly is the host painted? */
async function probeReach(page: Page): Promise<{ hits: number; count: number; opacity: string }> {
  return page.evaluate(() => {
    const host = document.getElementById('subject')!;
    const sr = host.shadowRoot! as any;
    const slots = [...sr.querySelectorAll('.slot')] as HTMLElement[];
    let hits = 0;
    for (const slot of slots) {
      const b = slot.getBoundingClientRect();
      const found = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
      if (found === host) hits++;
    }
    return { hits, count: slots.length, opacity: getComputedStyle(host).opacity };
  });
}

// ── LAYER 2: real pixels, one pinned combo ──────────────────────────────────

test.describe('snice-time-range-picker visual matrix (layer 2: painted pixels)', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => { page = await openChartStage(browser, FIXTURE); });
  test.afterAll(async () => { await page?.close(); });

  test('a selected slot really paints apart from a plain and a blocked one', async () => {
    // Three computed colours that "differ" can still differ by a luminance
    // point, which is a picker nobody can read. Only the painted pixels answer
    // it, and the same capture proves the states are told apart at a glance.
    await mount(page, {
      granularity: 60,
      startTime: '08:00',
      endTime: '12:00',
      value: JSON.stringify([{ start: '09:00', end: '09:00' }]),
      disabledRanges: JSON.stringify([{ start: '11:00', end: '11:00' }]),
    });

    const PROBES = `(host) => {
      const sr = host.shadowRoot;
      const point = (selector) => {
        const b = sr.querySelector(selector).getBoundingClientRect();
        return { x: b.right - 8, y: b.top + b.height / 2 };
      };
      return [
        point('.slot--selected'),
        point('.slot--disabled'),
        point('.slot:not(.slot--selected):not(.slot--disabled)'),
      ];
    }`;

    const [selected, blocked, plain] = await capture(page, '#subject', 'picker-slot-states', PROBES);

    expect(sameColor(selected, plain), 'a selected slot paints like a plain one').toBe(false);
    expect(sameColor(blocked, plain), 'a blocked slot paints like a plain one').toBe(false);
    expect(sameColor(selected, blocked), 'selected and blocked slots paint the same').toBe(false);
    expect(contrast(selected, plain), 'the selected tint is not distinguishable from a plain slot')
      .toBeGreaterThan(1.1);
  });
});
