/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-calendar TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/calendar, `npm run test:matrix`) owns everything
 * that is not layout: the 42-day window, the weekday rotation, week numbers,
 * selection and disabling, navigation, the event lookup, the stripe model, and
 * the event payloads. It explicitly cannot own two of this component's
 * documented behaviours, because both are derived from a MEASURED box and
 * happy-dom measures nothing:
 *
 *   · the event-lane budget — "Visible lanes per week = how many fit the day
 *     cell's height … lanes = max(1, floor((cellHeight - 2.125rem - chip) /
 *     1.375rem))", with "chip = 1rem when the stack overflows";
 *   · the cell sizing that FEEDS that budget — `cell-sizing="square"` gives
 *     "100cqw / 7", `cell-sizing="stretch"` lets rows collapse to content, and
 *     a constrained host caps the rows at "their equal share of the room under
 *     the header".
 *
 * The doc names its own headless fallback ("falls back to 3 lanes"), which is
 * what the DOM tier asserts. This tier asserts the real formula.
 *
 * ── Layer 1 (every combo): geometry + the documented lane formula ───────────
 *   · the grid really is seven day columns (eight with week numbers) and six
 *     week rows, in that order, with the week-number column LEADING;
 *   · square cells really are as tall as the column is wide;
 *   · the visible lane count really is the one the documented formula predicts
 *     for the cell height the browser produced;
 *   · a stack deeper than the budget really collapses into a "+N more" chip
 *     carrying the right count, and the chip is inside its own day cell;
 *   · nothing overflows the host when the host is constrained — "all six weeks
 *     stay inside the box";
 *   · no day cell is occluded.
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   Event bars are absolutely-placed grid children stacked in lanes; "the bar
 *   has a box in lane 1" and "lane 1 is painted where the reader can see it"
 *   are different claims, and only pixels separate them.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, sameColor } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/calendar/matrix.html';

/** The fixture pins the root font size, so rem arithmetic is exact. */
const REM = 16;
/** The documented lane geometry, verbatim from the "Event-Lane Budget" block. */
const LANE_REM = 1.375;
const STACK_TOP_REM = 2.125;
const CHIP_REM = 1;

/**
 * The documented budget: `lanes = max(1, floor((cellHeight - 2.125rem - chip)
 * / 1.375rem))`, where `chip = 1rem when the stack overflows`.
 *
 * Applied exactly as written: work out how many lanes fit with no chip; if the
 * stack is deeper than that, the chip claims its strip and the budget is
 * recomputed with it.
 */
function documentedLanes(cellHeight: number, stackDepth: number): { visible: number; chip: boolean } {
  const fit = (reserve: number) =>
    Math.max(1, Math.floor((cellHeight / REM - STACK_TOP_REM - reserve) / LANE_REM));
  const withoutChip = fit(0);
  if (stackDepth <= withoutChip) return { visible: stackDepth, chip: false };
  return { visible: fit(CHIP_REM), chip: true };
}

/** June 2026 — starts on a Monday, so both `first-day-of-week` values differ. */
const MONTH = '2026-06-15';
const BUSY_DAY = '2026-06-10';

interface Combo {
  id: string;
  cellSizing: 'square' | 'stretch';
  showWeekNumbers: boolean;
  firstDayOfWeek: number;
  stageWidth: number;
  hostHeight?: number;
  uncapped: boolean;
  stackDepth: number;
  month: string;
  events: Array<{ id: string; title: string; start: string; end?: string; color?: string }>;
}

/** `n` single-day events on the same day, so the stack is exactly `n` deep. */
const stack = (n: number) => Array.from({ length: n }, (_, i) => ({
  id: `e${i}`, title: `Event ${i}`, start: BUSY_DAY, color: '#2563eb',
}));

/**
 * The cross: cell-sizing (2) x show-week-numbers (2) x stage width (3) x stack
 * depth (3) = 36 combos, with `first-day-of-week` and the host height rotated
 * across them. Sized to a complex component whose DOM matrix already carries
 * ~300 combos — this tier only has to cover what a browser adds.
 */
function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  const heights = [undefined, 640, undefined, 420];
  let n = 0;
  for (const cellSizing of ['square', 'stretch'] as const) {
    for (const showWeekNumbers of [false, true]) {
      for (const stageWidth of [420, 600, 900]) {
        for (const stackDepth of [1, 4, 9]) {
          const firstDayOfWeek = n % 2;
          const hostHeight = heights[n % heights.length];
          combos.push({
            id: `cell=${cellSizing}/week-numbers=${showWeekNumbers}/width=${stageWidth}`
              + `/stack=${stackDepth}/[first=${firstDayOfWeek},height=${hostHeight ?? 'auto'}]`,
            cellSizing, showWeekNumbers, firstDayOfWeek, stageWidth, hostHeight,
            uncapped: true, stackDepth, month: MONTH, events: stack(stackDepth),
          });
          n++;
        }
      }
    }
  }
  return combos;
}

let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  await page.goto(FIXTURE);
  await page.waitForFunction(() => document.documentElement.dataset.matrixReady === 'true');
});
test.afterAll(async () => { await page?.close(); });

async function visualProblems(combo: Combo): Promise<string[]> {
  return page.evaluate(({ combo, geometry }) => {
    const problems: string[] = [];
    const say = (m: string) => problems.push(m);
    const EPS = 1.5;

    const host = document.getElementById('subject') as HTMLElement | null;
    if (!host) { say('nothing mounted'); return problems; }
    const sr = host.shadowRoot;
    if (!sr) { say('no shadow root'); return problems; }

    const tokens = (node: Element) => (node.getAttribute('part') ?? '').split(/\s+/);
    const byPart = (name: string) =>
      [...sr.querySelectorAll('[part]')].filter(node => tokens(node).includes(name)) as HTMLElement[];

    const base = byPart('base')[0];
    const grid = byPart('grid')[0];
    const header = byPart('header')[0];
    if (!base || !grid || !header) { say('a documented container part is missing'); return problems; }

    const cells = [...sr.querySelectorAll('.calendar__day')] as HTMLElement[];
    if (cells.length !== 42) { say(`${cells.length} day cells, documented 42`); return problems; }

    const hostBox = host.getBoundingClientRect();
    const gridBox = grid.getBoundingClientRect();
    const boxes = cells.map(cell => cell.getBoundingClientRect());

    if (getComputedStyle(host).visibility !== 'visible') say('host is not visible');
    if (gridBox.width < 1 || gridBox.height < 1) {
      say(`grid box is ${gridBox.width}x${gridBox.height}`);
      return problems;
    }

    // ── Seven columns, six rows, in reading order ─────────────────────────
    const xs = [...new Set(boxes.map(b => Math.round(b.left)))].sort((a, b) => a - b);
    const ys = [...new Set(boxes.map(b => Math.round(b.top)))].sort((a, b) => a - b);
    if (xs.length !== 7) say(`day cells occupy ${xs.length} columns, documented 7`);
    if (ys.length !== 6) say(`day cells occupy ${ys.length} week rows, documented 6`);
    boxes.forEach((box, i) => {
      const wantColumn = xs[i % 7];
      const wantRow = ys[Math.floor(i / 7)];
      if (Math.abs(Math.round(box.left) - wantColumn) > EPS) {
        say(`cell ${i} is in the wrong column`);
      }
      if (Math.abs(Math.round(box.top) - wantRow) > EPS) {
        say(`cell ${i} is in the wrong week row`);
      }
    });

    // ── The week-number column LEADS ──────────────────────────────────────
    const weekNumbers = byPart('week-number');
    if (combo.showWeekNumbers) {
      if (weekNumbers.length !== 6) {
        say(`${weekNumbers.length} week-number cells, documented one per week row`);
      } else {
        for (const cell of weekNumbers) {
          const box = cell.getBoundingClientRect();
          if (box.right > xs[0] + EPS) {
            say(`a week-number cell ends at ${box.right.toFixed(1)},`
              + ` not left of the first day column at ${xs[0]} — the column is documented as leading`);
          }
          if (box.width < 1) say('a week-number cell has no width');
        }
      }
    } else if (weekNumbers.length) {
      say(`${weekNumbers.length} week-number cells without show-week-numbers`);
    }

    // ── Square cells really are square ────────────────────────────────────
    // Documented: `cell-sizing="square"` (default) makes the cell "as tall as
    // the column is wide" — `100cqw / 7`. A row that had to grow for its lane
    // reservation is the documented exception ("the busy row still grows"), so
    // only the rows with no events are held to it.
    const busyRows = new Set(
      cells.map((cell, i) => (cell.querySelector('.calendar__event-bar')
        || cell.querySelector('.calendar__more') ? Math.floor(i / 7) : -1))
        .filter(row => row >= 0));
    // Event bars are grid children of the grid, not of the cell, so the busy
    // row is found from the stripes' own grid-row instead.
    for (const bar of sr.querySelectorAll('.calendar__event-bar')) {
      const row = Number((bar as HTMLElement).style.gridRow);
      if (Number.isFinite(row)) busyRows.add(row - 2);
    }

    if (combo.cellSizing === 'square' && !combo.hostHeight) {
      boxes.forEach((box, i) => {
        if (busyRows.has(Math.floor(i / 7))) return;
        if (Math.abs(box.height - box.width) > 2) {
          say(`cell ${i} is ${box.width.toFixed(1)}x${box.height.toFixed(1)} —`
            + ' cell-sizing="square" is documented as "cells as tall as the column is wide"');
        }
      });
    }

    // ── The documented lane budget ────────────────────────────────────────
    // Measured on a cell of the busy row, which is the height the budget is
    // documented to be derived from.
    const busyIndex = cells.findIndex((_, i) => busyRows.has(Math.floor(i / 7)));
    if (busyIndex >= 0) {
      const cellHeight = boxes[busyIndex].height;
      const bars = [...sr.querySelectorAll('.calendar__event-bar')];
      const chips = [...sr.querySelectorAll('.calendar__more')];
      const columnWidth = boxes[busyIndex].width;

      // Which of the doc's three sizing regimes this combo is in decides which
      // claim can be made. They are all documented; they are not the same claim.
      //
      //   'unbudgeted' — "`cell-sizing="stretch"` with no imposed height: no
      //     budget — rows collapse to content and every lane is shown, no chip";
      //   'capped'     — a constrained host, where the doc explicitly admits
      //     zero lanes: "a row too short for even one lane shows the chip
      //     alone". The formula is an upper bound there, not an equality;
      //   'exact'      — an unconstrained square calendar, where the row can
      //     always grow into its reservation and the formula holds as written.
      const mode = combo.cellSizing === 'stretch' && !combo.hostHeight
        ? 'unbudgeted'
        : (combo.hostHeight ? 'capped' : 'exact');

      if (mode === 'unbudgeted') {
        // The regime is defined by the cell COLLAPSING, so that is what is
        // checked first — a "stretch" cell still sized by its column width is
        // not in this regime at all, and saying so names the cause rather than
        // the symptom.
        if (Math.abs(cellHeight - columnWidth) < 2) {
          say(`cell-sizing="stretch" with no imposed height produced a`
            + ` ${cellHeight.toFixed(2)}px cell in a ${columnWidth.toFixed(2)}px column —`
            + ' the cell is still square, so the row did not collapse to its content');
        }
        if (bars.length !== combo.stackDepth) {
          say(`stretch with no imposed height drew ${bars.length} bars of ${combo.stackDepth};`
            + ' the doc says every lane is shown');
        }
        if (chips.length) say('stretch with no imposed height showed a "+N more" chip');
      } else {
        const budget = geometry.find(g =>
          Math.abs(g.cellHeight - cellHeight) < 0.5 && g.stackDepth === combo.stackDepth);
        if (!budget) {
          say(`no documented budget computed for a ${cellHeight.toFixed(2)}px cell`);
        } else {
          const drawn = bars.length;
          if (mode === 'exact' ? drawn !== budget.visible : drawn > budget.visible) {
            say(`${drawn} bars drawn; the documented budget for a`
              + ` ${cellHeight.toFixed(2)}px cell (${(cellHeight / 16).toFixed(3)}rem)`
              + ` and a ${combo.stackDepth}-deep stack is`
              + `${mode === 'capped' ? ' at most' : ''} ${budget.visible}`);
          }
          // Whatever the budget turned out to be, no event may simply vanish:
          // "deeper stacks collapse to a per-day '+N more' chip", so the drawn
          // bars plus the chip's count are the whole stack.
          const hidden = combo.stackDepth - drawn;
          if (hidden > 0) {
            if (chips.length !== 1) {
              say(`${hidden} events hidden but ${chips.length} "+N more" chips`);
            } else if (chips[0].textContent !== `+${hidden} more`) {
              say(`chip reads "${chips[0].textContent}", documented "+${hidden} more"`);
            } else if (!cells.some(cell => cell.contains(chips[0]))) {
              say('the chip is not inside a day cell');
            }
          } else if (chips.length) {
            say('a chip appeared with nothing hidden behind it');
          }
        }
      }

      // Whatever the budget, a drawn bar is inside the week row it belongs to.
      for (const bar of bars) {
        const box = (bar as HTMLElement).getBoundingClientRect();
        const row = Number((bar as HTMLElement).style.gridRow) - 2;
        const rowTop = ys[row];
        const rowBottom = row + 1 < ys.length ? ys[row + 1] : gridBox.bottom;
        if (box.top < rowTop - EPS || box.bottom > rowBottom + EPS) {
          say(`an event bar (${box.top.toFixed(1)}..${box.bottom.toFixed(1)}) spills out of`
            + ` its week row (${rowTop}..${rowBottom.toFixed(1)})`);
        }
        if (box.width < 1 || box.height < 1) say('an event bar has no box');
      }
    }

    // ── A constrained host keeps all six weeks inside it ──────────────────
    // Documented: "the rows are capped at their equal share of the room under
    // the header, so all six weeks stay inside the box".
    if (combo.hostHeight) {
      if (gridBox.bottom > hostBox.bottom + 2) {
        say(`the grid ends at ${gridBox.bottom.toFixed(1)} but the host box ends at`
          + ` ${hostBox.bottom.toFixed(1)} — the documented cap did not hold`);
      }
    }

    // ── Nothing occludes a day cell ───────────────────────────────────────
    for (let i = 0; i < cells.length; i += 7) {
      const box = boxes[i];
      const x = box.left + box.width / 2;
      const y = box.top + 6;
      if (y < 0 || y > window.innerHeight || x < 0 || x > window.innerWidth) continue;
      const hit = document.elementFromPoint(x, y);
      if (hit !== host && !host.contains(hit)) {
        say(`day cell ${i} hit-tests as <${hit?.tagName.toLowerCase() ?? 'nothing'}>`);
      }
    }

    return problems;
  }, { combo, geometry: await budgetTable(combo) });
}

/**
 * The documented budget for every cell height the browser might produce, so the
 * page-side evaluate can look one up instead of re-implementing the formula
 * inside a string. Computed here, from the doc, in whole-pixel steps.
 */
async function budgetTable(combo: Combo): Promise<Array<{ cellHeight: number; stackDepth: number; visible: number; chip: boolean }>> {
  const table: Array<{ cellHeight: number; stackDepth: number; visible: number; chip: boolean }> = [];
  for (let h = 0; h <= 400; h += 0.25) {
    const { visible, chip } = documentedLanes(h, combo.stackDepth);
    table.push({ cellHeight: h, stackDepth: combo.stackDepth, visible, chip });
  }
  return table;
}

const combos = generateCombos();

/**
 * MATRIX-calendar-3
 *
 * Combo:    `cell-sizing="stretch"` + `show-week-numbers`, host height auto —
 *           any stage width, any stack depth.
 * Expected: the doc's stretch regime: "`cell-sizing="stretch"` with no imposed
 *           height: no budget — rows collapse to content and every lane is
 *           shown, no chip". `show-week-numbers` is documented as adding a
 *           column and nothing else — "adds a leading week-number column" — and
 *           the stylesheet's own comment for that rule says the square baseline
 *           only "discounts it so cells stay square", which is a statement
 *           about the SQUARE mode.
 * Actual:   the day cells keep the square column-width height, so the stretch
 *           mode never happens and the lane budget applies after all. Measured:
 *           a 900px calendar gives 123.42px cells (exactly the day column
 *           width) and collapses a 9-deep stack to 3 bars plus "+6 more"; at
 *           600px the cells are 80.56px and the SAME stack shows 1 bar plus
 *           "+8 more". Without `show-week-numbers` the identical combo
 *           collapses to 48px cells and draws all nine.
 *
 *           Cause: `.calendar--week-numbers .calendar__day` (two classes)
 *           re-imposes `max(calc((100cqw - <week col>) / 7), 3rem, …)` and
 *           outranks `.calendar__day--stretch` (one class) on specificity, so
 *           the stretch minimum is unreachable whenever the week-number column
 *           is on. The two documented properties are independent in the docs
 *           and mutually exclusive in the stylesheet.
 */
const isStretchWeekNumberFinding = (combo: Combo) =>
  combo.cellSizing === 'stretch' && combo.showWeekNumbers && !combo.hostHeight;

/**
 * FINDING VISUAL-MATRIX-calendar-1 — the two tight-budget stretch combos
 * overflow a 420px host by 6px in Firefox only. `renderEventStripes` calls
 * `syncRowCap()` with every `--calendar-week-lanes` reservation cleared, so
 * the cap is computed for the lane-less grid; the lanes are set right after,
 * the busy week's row grows past the share the cap never took from it, and
 * `cap` stays unset because the lane-less grid fit the room. Firefox's
 * weekday header measures 3px taller than Chromium's (font metrics), which
 * is what turns the same ordering into a visible overflow there. Component
 * bug (`syncRowCap` must re-run after the lane budget, or measure with the
 * lanes it is about to set) — reported, not fixed; the assertions stay and
 * the pin must fail and be deleted the day the ordering is fixed.
 */
const isTightBudgetFinding = (combo: Combo) =>
  combo.cellSizing === 'stretch' && !combo.showWeekNumbers
  && combo.hostHeight === 420 && combo.firstDayOfWeek === 1;

test.describe('calendar visual matrix: layer 1', () => {
  for (const combo of combos) {
    const finding = isStretchWeekNumberFinding(combo);
    const tightBudget = isTightBudgetFinding(combo);
    test(`${finding ? 'MATRIX-calendar-3: ' : ''}${tightBudget ? 'VISUAL-MATRIX-calendar-1: ' : ''}${combo.id}`, async ({ browserName }) => {
      if (finding) test.fail();
      test.fail(browserName === 'firefox' && tightBudget,
        'lane budget lands after the row cap measure — see VISUAL-MATRIX-calendar-1');
      const mounted = await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      expect(mounted.cellSizing).toBe(combo.cellSizing);
      expect(mounted.displayed).toEqual({ month: 5, year: 2026 });
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

test.describe('calendar visual matrix: cell-sizing="stretch" collapses its rows', () => {
  // The finding above, isolated from the lane budget it knocks over: the same
  // calendar, the same width, with and without the week-number column.
  const cellHeight = async (showWeekNumbers: boolean) => {
    await page.evaluate(c => (window as any).matrix.mount(c), {
      cellSizing: 'stretch', showWeekNumbers, firstDayOfWeek: 0, stageWidth: 900,
      uncapped: true, month: MONTH, events: stack(1),
    } as any);
    return page.evaluate(() => {
      const box = document.getElementById('subject')!.shadowRoot!
        .querySelector('.calendar__day')!.getBoundingClientRect();
      return { height: +box.height.toFixed(2), width: +box.width.toFixed(2) };
    });
  };

  test('without week numbers the row collapses to its content', async () => {
    const cell = await cellHeight(false);
    expect(cell.height, `a stretch cell is ${cell.height}px in a ${cell.width}px column`)
      .toBeLessThan(cell.width - 2);
  });

  test('MATRIX-calendar-3: with week numbers the row still collapses', async () => {
    test.fail();
    const cell = await cellHeight(true);
    expect(cell.height, `a stretch cell is ${cell.height}px in a ${cell.width}px column`)
      .toBeLessThan(cell.width - 2);
  });
});

test.describe('calendar visual matrix: the lane budget grows with the room', () => {
  // The doc's own worked example: "Same events, more visible lanes:
  // calendar.style.height = '40rem'". A taller host must show strictly more
  // lanes than a short one, for the same events.
  test('a taller host shows more lanes for the same events', async () => {
    const laneCount = async (hostHeight: number) => {
      await page.evaluate(c => (window as any).matrix.mount(c), {
        cellSizing: 'square', showWeekNumbers: false, firstDayOfWeek: 0, stageWidth: 600,
        hostHeight, uncapped: true, month: MONTH, events: stack(9),
      } as any);
      return page.evaluate(() => {
        const sr = document.getElementById('subject')!.shadowRoot!;
        return sr.querySelectorAll('.calendar__event-bar').length;
      });
    };

    const short = await laneCount(360);
    const tall = await laneCount(900);
    expect(tall, `360px host showed ${short} lanes, 900px host showed ${tall}`)
      .toBeGreaterThan(short);
  });

  test('a wider square calendar shows more lanes than a narrow one', async () => {
    // Documented: "`cell-sizing="square"` (default): `100cqw / 7` — the column
    // width; wider calendar -> taller cells -> more lanes."
    const laneCount = async (stageWidth: number) => {
      await page.evaluate(c => (window as any).matrix.mount(c), {
        cellSizing: 'square', showWeekNumbers: false, firstDayOfWeek: 0, stageWidth,
        uncapped: true, month: MONTH, events: stack(9),
      } as any);
      return page.evaluate(() => {
        const sr = document.getElementById('subject')!.shadowRoot!;
        return sr.querySelectorAll('.calendar__event-bar').length;
      });
    };

    const narrow = await laneCount(360);
    const wide = await laneCount(1000);
    expect(wide, `360px wide showed ${narrow} lanes, 1000px wide showed ${wide}`)
      .toBeGreaterThan(narrow);
  });
});

test.describe('calendar visual matrix: the "+N more" panel', () => {
  test('the chip opens a dialog anchored inside the calendar', async () => {
    await page.evaluate(c => (window as any).matrix.mount(c), {
      cellSizing: 'square', showWeekNumbers: false, firstDayOfWeek: 0, stageWidth: 500,
      uncapped: true, month: MONTH, events: stack(12),
    } as any);

    expect(await page.evaluate(() => (window as any).matrix.clickMoreChip()),
      'no "+N more" chip to click').toBe(true);
    await page.waitForTimeout(80);

    const panel = await page.evaluate(() => {
      const host = document.getElementById('subject')!;
      const sr = host.shadowRoot!;
      const node = [...sr.querySelectorAll('[part]')]
        .find(n => (n.getAttribute('part') ?? '').split(/\s+/).includes('event-popover')) as HTMLElement;
      if (!node || node.hidden) return null;
      const box = node.getBoundingClientRect();
      const base = [...sr.querySelectorAll('[part]')]
        .find(n => (n.getAttribute('part') ?? '').split(/\s+/).includes('base'))!.getBoundingClientRect();
      return {
        role: node.getAttribute('role'),
        width: box.width, height: box.height,
        insideBase: box.left >= base.left - 1 && box.right <= base.right + 1,
        overlayOpen: host.hasAttribute('overlay-open'),
        items: sr.querySelectorAll('.calendar__more-item').length,
      };
    });

    expect(panel, 'the built-in day panel did not open').not.toBeNull();
    expect(panel!.role).toBe('dialog');
    expect(panel!.width, 'the panel has no width').toBeGreaterThan(1);
    expect(panel!.height, 'the panel has no height').toBeGreaterThan(1);
    // Documented: "position: absolute inside ::part(base), NOT viewport-fixed".
    expect(panel!.insideBase, 'the panel is not clamped inside the calendar').toBe(true);
    // Documented: "while an overlay shows the host carries a read-only
    // `overlay-open` attribute".
    expect(panel!.overlayOpen).toBe(true);
    expect(panel!.items, 'the panel lists nothing').toBeGreaterThan(0);
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────

test.describe('calendar visual matrix: marquee pixels', () => {
  test('an event bar is really painted in its day cell', async () => {
    await page.evaluate(c => (window as any).matrix.mount(c), {
      cellSizing: 'square', showWeekNumbers: false, firstDayOfWeek: 0, stageWidth: 900,
      uncapped: true, month: MONTH,
      events: [{ id: 'a', title: 'Launch', start: BUSY_DAY, color: '#2563eb' }],
    } as any);

    const [bar, emptyCell] = await capture(
      page, '#subject', 'calendar-event-bar',
      `(host) => {
        const sr = host.shadowRoot;
        const box = sr.querySelector('.calendar__event-bar').getBoundingClientRect();
        const cells = [...sr.querySelectorAll('.calendar__day')];
        const blank = cells[cells.length - 1].getBoundingClientRect();
        return [
          { x: box.x + box.width / 2, y: box.y + box.height / 2 },
          { x: blank.x + blank.width / 2, y: blank.y + blank.height / 2 },
        ];
      }`,
    );
    // The event's colour is a saturated blue; an empty cell is the surface.
    expect(bar[2] > bar[0] + 40, `the bar painted rgb(${bar.join(',')}), not its blue`).toBe(true);
    expect(sameColor(bar, emptyCell), 'the bar and an empty cell painted the same colour')
      .toBe(false);
  });

  test('a ranged stripe is painted continuously across the days it covers', async () => {
    await page.evaluate(c => (window as any).matrix.mount(c), {
      cellSizing: 'square', showWeekNumbers: false, firstDayOfWeek: 0, stageWidth: 900,
      uncapped: true, month: MONTH,
      events: [{ id: 'r', title: 'Conf', start: '2026-06-08', end: '2026-06-12', color: '#2563eb' }],
    } as any);

    // Probe the stripe at five points across its span. A stripe drawn as five
    // separate chips with gaps between them would miss the gutters.
    const pixels = await capture(
      page, '#subject', 'calendar-ranged-stripe',
      `(host) => {
        const box = host.shadowRoot.querySelector('.calendar__event-bar').getBoundingClientRect();
        return [0.1, 0.3, 0.5, 0.7, 0.9].map(t => ({
          x: box.x + box.width * t, y: box.y + box.height / 2,
        }));
      }`,
    );
    for (const [r, g, b] of pixels) {
      expect(b > r + 30 && b > g + 30,
        `a point along the stripe painted rgb(${r},${g},${b}), not the event colour`).toBe(true);
    }
  });
});
