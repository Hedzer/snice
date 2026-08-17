/**
 * snice-heatmap TRUE-VISUAL matrix.
 *
 * The DOM matrix (`tests/matrix/heatmap/`, 41 combos) owns the calendar: which
 * day each cell stands for, what it announces, which event a click emits, and
 * what the tooltip says. Almost nothing else about this component is visible to
 * it, because a heatmap IS its colours and its grid:
 *
 *   · `colorScheme: 'green'|'blue'|'purple'|'orange'|'red'` has NO DOM effect
 *     whatsoever — the schemes differ only in `:host([color-scheme=…])` rules,
 *     so a component that shipped one palette five times would pass the whole
 *     DOM tier.
 *   · `cellSize` / `cellGap` are documented IN PIXELS. In happy-dom they are two
 *     custom properties on a host with no layout; here they are boxes.
 *   · The five intensity levels are a ramp, and a ramp that is not monotonic —
 *     or that puts two levels on the same colour — is unreadable while being
 *     perfectly valid DOM.
 *   · The tooltip is positioned with viewport coordinates and `translate`, which
 *     is the one thing that cannot be checked without a viewport.
 *
 * LAYER 1 — geometry / occlusion / computed style over
 *   {5 colour schemes} + {3 cell sizes x 2 gaps} = 11 combos, plus the
 *   measurements above.
 * LAYER 2 — two pinned screenshots: the green ramp really paints five distinct
 *   intensities, and the documented `purple` scheme really is the blue one.
 */
import { test, expect, type Page } from '@playwright/test';
import {
  openChartStage, mount, collectChartProblems, type ChartProbe,
} from '../chart-visual-support';
import { capture, contrast, sameColor, type RGB } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/heatmap/matrix.html';

const SCHEMES = ['green', 'blue', 'purple', 'orange', 'red'] as const;
const CELL_SIZES = [8, 12, 20] as const;
const CELL_GAPS = [0, 6] as const;

/**
 * The heatmap's marks are its cells. `requireDistinctPositions` is the check
 * that matters most: a calendar grid whose cells all share an origin is exactly
 * the collapse happy-dom cannot see.
 */
const PROBE: ChartProbe = {
  surface: '[part~="grid"]',
  marks: '.heatmap__cell',
  minMarks: 14,
  requireDistinctPositions: true,
  occlusion: true,
  boxes: ['[part~="base"]', '[part~="grid-area"]', '[part~="grid"]'],
};

/** Cell boxes, read from the shadow tree. */
function cellBoxes(page: Page) {
  return page.evaluate(() => [...document.getElementById('subject')!
    .shadowRoot!.querySelectorAll('.heatmap__cell')].map((node) => {
    const b = node.getBoundingClientRect();
    return { left: b.left, top: b.top, width: b.width, height: b.height };
  }));
}

test.describe('snice-heatmap visual matrix (layer 1)', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => { page = await openChartStage(browser, FIXTURE); });
  test.afterAll(async () => { await page?.close(); });

  for (const colorScheme of SCHEMES) {
    test(`color-scheme=${colorScheme}`, async () => {
      await mount(page, { weeks: 4, colorScheme });
      expect(await collectChartProblems(page, PROBE), colorScheme).toEqual([]);
    });
  }

  for (const cellSize of CELL_SIZES) {
    for (const cellGap of CELL_GAPS) {
      const id = `cell-size=${cellSize}/cell-gap=${cellGap}`;
      test(id, async () => {
        await mount(page, { weeks: 4, cellSize, cellGap });
        expect(await collectChartProblems(page, PROBE), id).toEqual([]);
      });
    }
  }

  test('cellSize is really the cell\'s size in pixels', async () => {
    // `cellSize: number = 12  // attr: cell-size, px`. A number of pixels is a
    // claim only a layout can settle; in happy-dom it is a string on a host.
    const problems: string[] = [];
    for (const cellSize of CELL_SIZES) {
      await mount(page, { weeks: 4, cellSize, cellGap: 3 });
      const boxes = await cellBoxes(page);
      const wrong = boxes.filter(box => Math.abs(box.width - cellSize) > 1
        || Math.abs(box.height - cellSize) > 1);
      if (wrong.length) {
        problems.push(`cell-size=${cellSize}: ${wrong.length} cells rendered at `
          + `${wrong[0].width}x${wrong[0].height}`);
      }
    }
    expect(problems).toEqual([]);
  });

  test('cellGap is really the gap between the cells in pixels', async () => {
    // `cellGap: number = 3  // attr: cell-gap, px`. Measured between two cells
    // of the same column, which is where the grid's row gap lives.
    const problems: string[] = [];
    for (const cellGap of [0, 3, 6] as const) {
      await mount(page, { weeks: 4, cellSize: 12, cellGap });
      const measured = await page.evaluate(() => {
        const cells = [...document.getElementById('subject')!
          .shadowRoot!.querySelectorAll('.heatmap__cell')];
        const first = cells[0].getBoundingClientRect();
        const below = cells[1].getBoundingClientRect();
        return below.top - first.bottom;
      });
      if (Math.abs(measured - cellGap) > 1) {
        problems.push(`cell-gap=${cellGap}: measured ${measured.toFixed(2)}px between rows`);
      }
    }
    expect(problems).toEqual([]);
  });

  test('the cells lay out as a calendar grid: seven rows, weeks across', async () => {
    // "GitHub-style calendar heatmap" — a week is a COLUMN of seven days. A
    // grid that ran the other way, or that wrapped, would still carry the right
    // aria-labels in the right order.
    await mount(page, { weeks: 4, cellSize: 12, cellGap: 3 });
    const boxes = await cellBoxes(page);
    const columns = new Set(boxes.map(box => Math.round(box.left)));
    const rows = new Set(boxes.map(box => Math.round(box.top)));

    expect(rows.size, 'the calendar does not have seven day rows').toBe(7);
    expect(columns.size, 'the calendar does not lay its weeks out in columns')
      .toBeGreaterThanOrEqual(4);

    // Consecutive cells run DOWN a column, one day at a time.
    for (let i = 1; i < 7; i++) {
      expect(Math.round(boxes[i].left), `cell ${i} left its own week column`)
        .toBe(Math.round(boxes[0].left));
      expect(boxes[i].top, `cell ${i} is not below cell ${i - 1}`)
        .toBeGreaterThan(boxes[i - 1].top);
    }
  });

  test('the five intensity levels are five different colours, in order', async () => {
    // The level→colour ramp is what a heatmap IS. Two levels resolving to one
    // colour, or a ramp that runs backwards, produces a chart that cannot be
    // read — and neither is visible to any DOM assertion.
    const problems: string[] = [];
    for (const colorScheme of SCHEMES) {
      await mount(page, { weeks: 4, colorScheme });
      const colours = await page.evaluate(() => (window as any).matrix.levelColours());
      const present = Object.entries(colours).filter(([, colour]) => colour !== null);
      if (present.length < 5) {
        problems.push(`${colorScheme}: only ${present.length} of the five levels rendered`);
        continue;
      }
      const unique = new Set(present.map(([, colour]) => colour));
      if (unique.size !== 5) {
        problems.push(`${colorScheme}: the five levels resolve to ${unique.size} colours`);
      }
    }
    expect(problems).toEqual([]);
  });

  test('a hover really raises the tooltip, over the grid and out of the pointer\'s way', async () => {
    // The tooltip is positioned from viewport coordinates and pulled up with a
    // transform; whether it lands anywhere near the cell — and whether it sits
    // ABOVE the grid rather than under it — is only knowable here.
    await mount(page, { weeks: 4 });
    const shown = await page.evaluate(() => (window as any).matrix.hover(20));
    expect(shown, 'hovering a cell raised no tooltip').not.toBeNull();

    const placed = await page.evaluate(() => {
      const sr = document.getElementById('subject')!.shadowRoot!;
      const tip = sr.querySelector('[part~="tooltip"]')!.getBoundingClientRect();
      const cell = sr.querySelectorAll('.heatmap__cell')[20].getBoundingClientRect();
      const point = { x: tip.left + tip.width / 2, y: tip.top + tip.height / 2 };
      const hit = (sr as any).elementFromPoint(point.x, point.y) as Element | null;
      const tipEl = sr.querySelector('[part~="tooltip"]')! as HTMLElement;
      const cs = getComputedStyle(tipEl);
      return {
        width: tip.width,
        height: tip.height,
        // A tooltip is a hover surface, so it must NOT take the pointer: the
        // cell underneath has to stay hovered while it is up. `position: fixed`
        // plus a stacking order above the grid is what puts it on top, and
        // `pointer-events: none` is what keeps the hover alive.
        transparentToPointer: cs.pointerEvents === 'none' && hit !== tipEl,
        positioned: cs.position === 'fixed' || cs.position === 'absolute',
        stacked: Number(cs.zIndex) > 0,
        nearCell: Math.abs((tip.left + tip.right) / 2 - (cell.left + cell.right) / 2) < 200,
        above: tip.bottom <= cell.top + 2,
      };
    });
    await page.evaluate(() => (window as any).matrix.unhover(20));

    expect(placed.width, 'the tooltip rendered with no width').toBeGreaterThan(0);
    expect(placed.height, 'the tooltip rendered with no height').toBeGreaterThan(0);
    expect(placed.positioned, 'the tooltip is laid out in the flow instead of over the grid')
      .toBe(true);
    expect(placed.stacked, 'the tooltip is not stacked above the grid').toBe(true);
    expect(placed.transparentToPointer,
      'the tooltip swallows the pointer, so the cell it describes stops being hovered')
      .toBe(true);
    expect(placed.nearCell, 'the tooltip landed nowhere near the cell it describes').toBe(true);
  });

  /**
   * MATRIX-heatmap-3 — the tooltip is placed relative to the host, not the
   * viewport, so it lands over the cell it is describing.
   *
   * `docs/ai/components/heatmap.md` promises a "Tooltip on hover with date and
   * value" and gives it its own part. The component positions it from VIEWPORT
   * coordinates — `left: rect.left + width/2`, `top: rect.top - 8`, with
   * `position: fixed` and `translate(-50%, -100%)` — which is correct only
   * while the host is not a containing block for fixed descendants. The host
   * carries `contain: layout style`, and layout containment makes an element a
   * containing block for absolutely AND fixed positioned descendants, so those
   * viewport coordinates are resolved against the host's own border box
   * instead. (The stylesheet's own comment says only `contain: paint` has that
   * effect; `layout` has it too.)
   *
   * The consequence scales with the page: the tooltip is displaced by exactly
   * the host's position, so a heatmap 24px from the corner is 24px out and a
   * heatmap 600px down the page puts its tooltip 600px below the cursor.
   *
   * Policy (.ai/fuzzing.md): the assertion stays correct and the combo is
   * pinned, so the day the containment is fixed this suite fails and the
   * finding can be closed.
   */
  test('MATRIX-heatmap-3: the tooltip sits directly above the cell it describes', async () => {
    test.fail();
    await mount(page, { weeks: 4 });
    await page.evaluate(() => (window as any).matrix.hover(20));
    const placed = await page.evaluate(() => {
      const host = document.getElementById('subject')!;
      const sr = host.shadowRoot!;
      const tip = sr.querySelector('[part~="tooltip"]')!.getBoundingClientRect();
      const cell = sr.querySelectorAll('.heatmap__cell')[20].getBoundingClientRect();
      const hostBox = host.getBoundingClientRect();
      return {
        gap: cell.top - tip.bottom,
        driftX: (tip.left + tip.right) / 2 - (cell.left + cell.right) / 2,
        driftY: tip.bottom - (cell.top - 8),
        hostLeft: hostBox.left,
        hostTop: hostBox.top,
      };
    });
    await page.evaluate(() => (window as any).matrix.unhover(20));

    // The displacement IS the host's own page position, which is the signature
    // of the containing-block bug rather than of a rounding error.
    expect(Math.abs(placed.driftY - placed.hostTop) < 2
      && Math.abs(placed.driftX - placed.hostLeft) < 2,
    `the tooltip is displaced by the host's origin (${placed.driftX.toFixed(1)}, `
    + `${placed.driftY.toFixed(1)}) rather than placed in the viewport`).toBe(false);
    expect(placed.gap, 'the tooltip overlaps the cell it describes').toBeGreaterThanOrEqual(0);
  });

  test('show-labels="false" gives the grid the space the labels held', async () => {
    // `showLabels` is documented as a switch, and the visible consequence of
    // turning it off is that the grid moves — which no DOM assertion can see.
    await mount(page, { weeks: 4, cellSize: 12, cellGap: 3 });
    const withLabels = await page.evaluate(() => document.getElementById('subject')!
      .shadowRoot!.querySelector('[part~="grid"]')!.getBoundingClientRect().left);
    await mount(page, { weeks: 4, cellSize: 12, cellGap: 3, showLabels: false });
    const without = await page.evaluate(() => document.getElementById('subject')!
      .shadowRoot!.querySelector('[part~="grid"]')!.getBoundingClientRect().left);

    expect(without, 'removing the day labels did not move the grid left')
      .toBeLessThan(withLabels);
  });

  test('every cell is reachable by the pointer', async () => {
    // "Cells are focusable buttons" — a button nothing can hit is not one. The
    // month-label row sitting over the first week is the regression this
    // catches.
    await mount(page, { weeks: 4, cellSize: 12, cellGap: 3 });
    const unreachable = await page.evaluate(() => {
      const sr = document.getElementById('subject')!.shadowRoot! as any;
      const cells = [...sr.querySelectorAll('.heatmap__cell')] as HTMLElement[];
      return cells.filter((cell) => {
        const b = cell.getBoundingClientRect();
        const hit = sr.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
        return hit !== cell;
      }).length;
    });
    expect(unreachable).toBe(0);
  });
});

// ── LAYER 2: real pixels, two pinned combos ─────────────────────────────────

test.describe('snice-heatmap visual matrix (layer 2: painted pixels)', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => { page = await openChartStage(browser, FIXTURE); });
  test.afterAll(async () => { await page?.close(); });

  /** Probe the centre of one cell at each of the five intensity levels. */
  const LEVEL_POINTS = `(host) => {
    const sr = host.shadowRoot;
    const points = [];
    for (let level = 0; level <= 4; level++) {
      const cell = sr.querySelector('.heatmap__cell--level-' + level);
      const b = cell.getBoundingClientRect();
      points.push({ x: b.left + b.width / 2, y: b.top + b.height / 2 });
    }
    return points;
  }`;

  test('the default ramp really paints five separable intensities', async () => {
    // Five computed colours that "differ" can still differ by a luminance
    // point, which is a heatmap nobody can read. Only the painted pixels
    // answer it.
    await mount(page, { weeks: 4, colorScheme: 'green', cellSize: 20, cellGap: 3 });
    const levels = await capture(page, '#subject', 'heatmap-ramp-green', LEVEL_POINTS);

    for (let i = 1; i < levels.length; i++) {
      expect(sameColor(levels[i], levels[i - 1]),
        `levels ${i - 1} and ${i} paint the same colour`).toBe(false);
    }
    expect(contrast(levels[0], levels[4]),
      'the faintest and the strongest level are barely distinguishable')
      .toBeGreaterThan(1.5);
  });

  /**
   * MATRIX-heatmap-2 — `color-scheme="purple"` paints the blue ramp.
   *
   * `docs/ai/components/heatmap.md` offers five schemes:
   * `colorScheme: 'green'|'blue'|'purple'|'orange'|'red' = 'green'`. That is a
   * promise that choosing one of them changes the colour on screen. The
   * stylesheet defines `--heatmap-purple-1…4` from `--snice-color-blue-100`,
   * `-400`, `-600`, `-800` — the same family the `blue` scheme uses — and the
   * two schemes' level 1 is defined from the IDENTICAL token, so it paints the
   * identical pixel. A page using `blue` and `purple` to tell two heatmaps
   * apart gets two blue heatmaps.
   *
   * Policy (.ai/fuzzing.md): the assertion stays correct and the combo is
   * pinned, so the day the palette is fixed this suite fails and the finding
   * can be closed.
   */
  test('MATRIX-heatmap-2: the purple scheme paints a different ramp from the blue one', async () => {
    test.fail();
    await mount(page, { weeks: 4, colorScheme: 'blue', cellSize: 20, cellGap: 3 });
    const blue = await capture(page, '#subject', 'heatmap-ramp-blue', LEVEL_POINTS);
    await mount(page, { weeks: 4, colorScheme: 'purple', cellSize: 20, cellGap: 3 });
    const purple = await capture(page, '#subject', 'heatmap-ramp-purple', LEVEL_POINTS);

    const shared = blue.filter((colour: RGB, i: number) => sameColor(colour, purple[i]));
    expect(shared.length,
      `${shared.length} of the five purple levels paint the identical blue pixel`)
      .toBe(0);
  });
});
