/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-grid TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/grid, `npm run test:matrix`) owns RESOLUTION
 * truth: which (col, row) the collision resolver picks, what `getLayout()`
 * records, which events fire, what `setLayout()` restores. It reads the
 * component's `transform` STRING to do it, because happy-dom performs no
 * layout — and a transform string is not a position.
 *
 * That gap is the whole point of this component. `snice-grid` is a
 * "Grid-coordinate layout component"; everything it does is arithmetic that
 * ends in a painted box, and the arithmetic has four ways to be wrong that a
 * string comparison cannot see: the wrong reference frame (the docs' two
 * `origin-*` switches flip it), the wrong axis (`columnWidth` applied to `y`),
 * a gap counted once too often across a span, and a container that sizes
 * itself to the wrong cell count.
 *
 * ── Layer 1 (every combo): the painted box IS the coordinate ────────────────
 *   Every visible item's real, on-screen rectangle is recomputed from the
 *   documented formula — `col * (columnWidth + gap)` from the origin the
 *   `origin-*` switches name, sized `colspan * columnWidth + (colspan - 1) *
 *   gap` — and compared to what the browser actually laid out. Alongside it:
 *   items never overlap; `hidden` items paint nothing; the container sizes
 *   itself to `columns`/`rows` when those are fixed and to the occupied extent
 *   when they are not; and the documented `role="list"` survives onto the
 *   painted `base`.
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   Three. Layer 1 measured boxes; a box is not paint. Each fixture item
 *   carries a flat, unique fill, so probing a coordinate answers WHICH item
 *   the browser drew there — the one assertion that catches a grid whose
 *   geometry is perfect and whose stacking order, clipping or transform
 *   compositing is not.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, sameColor } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/grid/matrix.html';

interface ItemSpec {
  name: string;
  col: number;
  row: number;
  colspan?: number;
  rowspan?: number;
  hidden?: boolean;
}

/**
 * The item arrangements. Each is a different shape of the same question:
 * `simple` is the doc's own first example; `spanning` crosses both span axes
 * (where a gap is easiest to count wrong); `sparse` leaves holes, so a
 * container that sized itself to the item COUNT rather than the occupied
 * extent shows up; `dense` fills two full rows; `hidden` mixes a laid-out item
 * with one the docs say is removed from layout entirely.
 */
const LAYOUTS: Record<string, ItemSpec[]> = {
  simple: [
    { name: 'a', col: 0, row: 0 },
    { name: 'b', col: 1, row: 0 },
    { name: 'c', col: 2, row: 0 },
  ],
  spanning: [
    { name: 'a', col: 0, row: 0, colspan: 2 },
    { name: 'b', col: 2, row: 0, rowspan: 2 },
    { name: 'c', col: 0, row: 1, colspan: 2, rowspan: 2 },
  ],
  sparse: [
    { name: 'a', col: 0, row: 0 },
    { name: 'b', col: 3, row: 2 },
  ],
  dense: [
    { name: 'a', col: 0, row: 0 }, { name: 'b', col: 1, row: 0 },
    { name: 'c', col: 2, row: 0 }, { name: 'd', col: 3, row: 0 },
    { name: 'e', col: 0, row: 1 }, { name: 'f', col: 1, row: 1 },
    { name: 'g', col: 2, row: 1 }, { name: 'h', col: 3, row: 1 },
  ],
  hidden: [
    { name: 'a', col: 0, row: 0 },
    { name: 'b', col: 1, row: 0, hidden: true },
    { name: 'c', col: 2, row: 0 },
  ],
};

interface Combo {
  id: string;
  items: ItemSpec[];
  columnWidth: number;
  rowHeight: number;
  gap: string;
  originLeft: boolean;
  originTop: boolean;
  columns?: number;
  rows?: number;
}

function combo(over: Partial<Combo> & { id: string; items: ItemSpec[] }): Combo {
  return {
    // Deliberately NOT square, and deliberately not equal to the gap: a swapped
    // axis or a gap folded into a cell size cannot hide behind equal numbers.
    columnWidth: 100,
    rowHeight: 70,
    gap: '12px',
    originLeft: true,
    originTop: true,
    ...over,
  };
}

const ORIGINS = [
  { id: 'origin=top-left', originLeft: true, originTop: true },
  { id: 'origin=top-right', originLeft: false, originTop: true },
  { id: 'origin=bottom-left', originLeft: true, originTop: false },
  { id: 'origin=bottom-right', originLeft: false, originTop: false },
];

/**
 * 54 combos. Larger than a mid component's because this one IS geometry: the
 * product below is the component's whole contract, and every point of it is a
 * different set of coordinates rather than a different colour.
 */
const COMBOS: Combo[] = [
  // ── The core product: five arrangements × four origins × two gaps ─────────
  //    `0px` matters on its own: it is the case where "count the gaps in a
  //    span" and "don't" give the same answer, so a formula that gets spans
  //    wrong passes it — which is exactly why both gaps are crossed.
  ...Object.entries(LAYOUTS).flatMap(([name, items]) =>
    ORIGINS.flatMap(origin => ['12px', '0px'].map(gap => combo({
      id: `${name}/${origin.id}/gap=${gap}`,
      items,
      gap,
      originLeft: origin.originLeft,
      originTop: origin.originTop,
    })))),

  // ── Cell size: a rectangular cell in both aspect ratios, and a tiny one ───
  ...([[80, 80], [140, 40], [50, 120]] as const).flatMap(([cw, rh]) =>
    (['simple', 'spanning'] as const).map(name => combo({
      id: `${name}/cell=${cw}x${rh}`,
      items: LAYOUTS[name],
      columnWidth: cw,
      rowHeight: rh,
    }))),

  // ── Fixed track counts: the doc's "Fixed grid" example ────────────────────
  combo({ id: 'simple/columns=4', items: LAYOUTS.simple, columns: 4 }),
  combo({ id: 'simple/columns=4/rows=3', items: LAYOUTS.simple, columns: 4, rows: 3 }),
  combo({ id: 'sparse/columns=6/rows=4', items: LAYOUTS.sparse, columns: 6, rows: 4 }),
  combo({
    id: 'dense/columns=4/origin=bottom-right',
    items: LAYOUTS.dense,
    columns: 4,
    originLeft: false,
    originTop: false,
  }),
];

let page: Page;

test.beforeAll(async ({ browser }) => {
  // Tall: `dense` at a 120px row height plus a fixed four-row grid runs well
  // past a default viewport, and every claim below is measured on-screen.
  page = await browser.newPage({ viewport: { width: 1280, height: 1400 } });
  await page.goto(FIXTURE);
  await page.waitForFunction(() => document.documentElement.dataset.matrixReady === 'true');
});
test.afterAll(async () => { await page?.close(); });

/**
 * LAYER 1. One evaluate per combo, returning EVERY violation at once so a
 * failing combo reports its whole story rather than one problem per re-run.
 */
async function visualProblems(combo: Combo): Promise<string[]> {
  return page.evaluate((combo) => {
    const problems: string[] = [];
    const say = (m: string) => problems.push(m);
    // Half a pixel: every number here is integer arithmetic on integer inputs,
    // so anything larger would be hiding a real error.
    const EPS = 0.5;
    const round = (n: number) => n.toFixed(1);

    const host = document.getElementById('subject') as HTMLElement | null;
    if (!host) { say('nothing mounted'); return problems; }
    const sr = host.shadowRoot;
    if (!sr) { say('no shadow root'); return problems; }

    const rect = (el: Element) => el.getBoundingClientRect();
    const base = [...sr.querySelectorAll('[part]')].find(node =>
      (node.getAttribute('part') ?? '').split(/\s+/).includes('base')) as HTMLElement | undefined;
    if (!base) { say('no part="base" painted'); return problems; }

    // "Inner container has `role=\"list\"`" — the one accessibility fact the
    // docs pin on this component, and it must survive into the painted tree.
    if (base.getAttribute('role') !== 'list') {
      say(`part="base" role="${base.getAttribute('role')}", expected "list"`);
    }
    // "Container uses `position: relative`, items get `position: absolute`" —
    // if the container is static, every item's translate is measured from some
    // ancestor instead and the whole grid slides.
    if (getComputedStyle(base).position !== 'relative') {
      say(`part="base" is position: ${getComputedStyle(base).position}, expected relative`);
    }

    const gap = (window as any).matrix.gapPixels() as number;
    const cw = combo.columnWidth;
    const rh = combo.rowHeight;
    const hostBox = rect(host);
    const hostStyle = getComputedStyle(host);
    const contentLeft = hostBox.left + parseFloat(hostStyle.borderLeftWidth)
      + parseFloat(hostStyle.paddingLeft);
    const contentTop = hostBox.top + parseFloat(hostStyle.borderTopWidth)
      + parseFloat(hostStyle.paddingTop);

    const all = [...host.children] as HTMLElement[];
    const visible = all.filter(item => !item.hasAttribute('hidden'));

    // ── `hidden` items are removed from layout, and paint nothing ────────────
    for (const item of all) {
      if (!item.hasAttribute('hidden')) continue;
      const r = rect(item);
      if (getComputedStyle(item).display !== 'none') {
        say(`hidden item "${item.getAttribute('name')}" is display:`
          + ` ${getComputedStyle(item).display}, expected none`);
      }
      if (r.width !== 0 || r.height !== 0) {
        say(`hidden item "${item.getAttribute('name')}" still occupies`
          + ` ${round(r.width)}x${round(r.height)}`);
      }
    }

    // ── THE FORMULA. Every visible item's painted box, from the docs ─────────
    //
    // Coordinates come from each item's OWN `grid-col` / `grid-row`, which the
    // component rewrites when collision resolution moves something. Which
    // coordinate the resolver picks is the DOM tier's question; this tier asks
    // only whether the box the browser painted is the box those coordinates
    // describe.
    const boxes: Array<{ name: string; r: DOMRect }> = [];
    for (const item of visible) {
      const name = item.getAttribute('name') ?? '?';
      const col = Number(item.getAttribute('grid-col') ?? 0);
      const row = Number(item.getAttribute('grid-row') ?? 0);
      const colspan = Number(item.getAttribute('grid-colspan') ?? 1);
      const rowspan = Number(item.getAttribute('grid-rowspan') ?? 1);

      // "Items sized automatically from columnWidth/rowHeight + colspan/rowspan"
      const wantWidth = colspan * cw + (colspan - 1) * gap;
      const wantHeight = rowspan * rh + (rowspan - 1) * gap;
      const x = col * (cw + gap);
      const y = row * (rh + gap);

      // The `origin-*` switches choose which corner (col 0, row 0) means.
      // Right-to-left and bottom-to-top are measured against the component's
      // own content box, which is the frame a reader sees.
      const wantLeft = combo.originLeft
        ? contentLeft + x
        : contentLeft + host.clientWidth - x - wantWidth;
      const wantTop = combo.originTop
        ? contentTop + y
        : contentTop + host.clientHeight - y - wantHeight;

      const r = rect(item);
      boxes.push({ name, r });
      if (Math.abs(r.width - wantWidth) > EPS || Math.abs(r.height - wantHeight) > EPS) {
        say(`item "${name}" (span ${colspan}x${rowspan}) is`
          + ` ${round(r.width)}x${round(r.height)}, expected`
          + ` ${round(wantWidth)}x${round(wantHeight)}`);
      }
      if (Math.abs(r.left - wantLeft) > EPS) {
        say(`item "${name}" at col ${col} paints its left edge at ${round(r.left)},`
          + ` expected ${round(wantLeft)}`);
      }
      if (Math.abs(r.top - wantTop) > EPS) {
        say(`item "${name}" at row ${row} paints its top edge at ${round(r.top)},`
          + ` expected ${round(wantTop)}`);
      }
    }

    // ── No two placed items may share a pixel ────────────────────────────────
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i].r;
        const b = boxes[j].r;
        if (a.left < b.right - EPS && b.left < a.right - EPS
          && a.top < b.bottom - EPS && b.top < a.bottom - EPS) {
          say(`items "${boxes[i].name}" and "${boxes[j].name}" overlap`);
        }
      }
    }

    // ── The container sizes itself to the tracks it has ──────────────────────
    //
    // With `columns`/`rows` set, to exactly that many tracks (the doc's "Fixed
    // grid"); without them, to the occupied extent. A container that sizes to
    // the item COUNT instead is the bug this catches, and `sparse` is the combo
    // that exposes it.
    const cols = combo.columns
      ?? visible.reduce((max, item) => Math.max(max,
        Number(item.getAttribute('grid-col') ?? 0)
        + Number(item.getAttribute('grid-colspan') ?? 1)), 0);
    const rows = combo.rows
      ?? visible.reduce((max, item) => Math.max(max,
        Number(item.getAttribute('grid-row') ?? 0)
        + Number(item.getAttribute('grid-rowspan') ?? 1)), 0);
    const baseBox = rect(base);
    const wantContainerWidth = cols > 0 ? cols * cw + (cols - 1) * gap : 0;
    const wantContainerHeight = rows > 0 ? rows * rh + (rows - 1) * gap : 0;
    if (wantContainerWidth > 0 && Math.abs(baseBox.width - wantContainerWidth) > EPS) {
      say(`the container is ${round(baseBox.width)}px wide for ${cols} columns,`
        + ` expected ${round(wantContainerWidth)}px`);
    }
    if (wantContainerHeight > 0 && Math.abs(baseBox.height - wantContainerHeight) > EPS) {
      say(`the container is ${round(baseBox.height)}px tall for ${rows} rows,`
        + ` expected ${round(wantContainerHeight)}px`);
    }

    return problems;
  }, combo as any);
}

test.describe('grid visual matrix: layer 1', () => {
  for (const combo of COMBOS) {
    test(combo.id, async () => {
      const mounted = await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      expect(mounted.items, `item count for ${combo.id}`).toBe(combo.items.length);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

test.describe('grid visual matrix: cross-combo geometry', () => {
  test('fit() moves an item to real screen coordinates and reflows the rest', async () => {
    // `fit(element, col, row)` is documented as "Position specific item at grid
    // coordinates, reflow others". Only a browser can say whether the reflow
    // landed: in happy-dom every box is zero and "reflowed" is unobservable.
    await page.evaluate(() => (window as any).matrix.mount({
      items: [
        { name: 'a', col: 0, row: 0 }, { name: 'b', col: 1, row: 0 },
        { name: 'c', col: 2, row: 0 },
      ],
      columnWidth: 100, rowHeight: 70, gap: '12px',
    }));
    await page.evaluate(() => (window as any).matrix.fit('c', 0, 0));
    const boxes = await page.evaluate(() => {
      const host = document.getElementById('subject')!;
      return [...host.children].map(item => ({
        name: item.getAttribute('name'),
        left: Math.round(item.getBoundingClientRect().left),
        top: Math.round(item.getBoundingClientRect().top),
      }));
    });
    const c = boxes.find(b => b.name === 'c')!;
    const a = boxes.find(b => b.name === 'a')!;
    const origin = Math.min(...boxes.map(b => b.left));
    expect(c.left, 'fit() did not move "c" to column 0').toBe(origin);
    expect(a.left, '"a" was not displaced out of the column fit() claimed')
      .not.toBe(origin);
    const lefts = boxes.map(b => b.left);
    expect(new Set(lefts).size, 'two items ended up in the same column').toBe(3);
  });

  /**
   * ── FINDING MATRIX-grid-3 ────────────────────────────────────────────────
   *
   * `setLayout(layout)` is documented as "Apply saved layout (reorder,
   * reposition, hide/show)" — one application of one layout. In a real browser
   * it never finishes.
   *
   * `setLayout()` stores the layout in `pendingLayout` and calls
   * `applyPendingLayout()`, which reorders the light-DOM children with
   * `appendChild`. Those mutations fire `slotchange`, whose handler checks
   * `pendingLayout` — still set, because nothing ever clears it — and applies
   * the whole layout again, appending again, firing `slotchange` again. The
   * recursion runs on the microtask queue and wedges the tab.
   *
   * The DOM matrix cannot see this: happy-dom dispatches no `slotchange` for a
   * programmatic reparent, so there the second pass never happens and
   * `setLayout()` returns cleanly. It is a browser-only defect, which is
   * exactly what this tier exists for.
   *
   * The assertion below is the CORRECT one — the arrangement the docs promise —
   * and it stays. `test.fail()` records the divergence; the fixture's append
   * budget is what keeps the page alive long enough to report it.
   */
  test.fail('MATRIX-grid-3: setLayout() restores the painted arrangement, hidden items included',
    async () => {
      await page.evaluate(() => (window as any).matrix.mount({
        items: [
          { name: 'a', col: 0, row: 0 }, { name: 'b', col: 1, row: 0 },
          { name: 'c', col: 2, row: 0 },
        ],
        columnWidth: 100, rowHeight: 70, gap: '12px',
      }));
      const applied = await page.evaluate(() => (window as any).matrix.setLayout({
        a: { col: 2, row: 1, order: 0 },
        b: { col: 0, row: 0, colspan: 2, order: 1 },
        c: { col: 0, row: 1, order: 2, hidden: true },
      }));

      // Three items, reordered once: three appends. Anything more is the
      // slotchange re-entry, and the budget being exhausted means it was
      // unbounded.
      expect(applied.appends,
        `setLayout() appended ${applied.appends} times for a three-item grid`
        + `${applied.appends > applied.budget ? ' — it never terminates' : ''}`)
        .toBe(3);

      const boxes = await page.evaluate(() => {
        const host = document.getElementById('subject')!;
        return [...host.children].map(item => {
          const r = item.getBoundingClientRect();
          return {
            name: item.getAttribute('name'),
            width: Math.round(r.width),
            height: Math.round(r.height),
            left: Math.round(r.left),
            top: Math.round(r.top),
          };
        });
      });
      const b = boxes.find(x => x.name === 'b')!;
      const c = boxes.find(x => x.name === 'c')!;
      const a = boxes.find(x => x.name === 'a')!;
      expect(b.width, 'the restored colspan=2 did not widen "b"').toBe(2 * 100 + 12);
      expect(c.width, 'the restored hidden item still paints').toBe(0);
      expect(a.top, '"a" did not move down to row 1').toBeGreaterThan(b.top);
    });

  test('stagger delays the items without changing where they land', async () => {
    // `stagger` is "ms delay between each item transition". The delay is
    // invisible to the DOM tier and, once everything has settled, must have
    // left the final geometry untouched — a stagger that also shifted a
    // position would be a layout bug wearing an animation's clothes.
    const measure = async (stagger: number) => {
      await page.evaluate(s => (window as any).matrix.mount({
        items: [
          { name: 'a', col: 0, row: 0 }, { name: 'b', col: 1, row: 0 },
          { name: 'c', col: 2, row: 0 }, { name: 'd', col: 3, row: 0 },
        ],
        columnWidth: 100, rowHeight: 70, gap: '12px',
        stagger: s, transitionDuration: '0.2s', settleMs: 900,
      }), stagger);
      return page.evaluate(() => [...document.getElementById('subject')!.children]
        .map(item => Math.round(item.getBoundingClientRect().left)));
    };
    expect(await measure(60), 'a staggered grid settled somewhere else')
      .toEqual(await measure(0));
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────

test.describe('grid visual matrix: marquee pixels', () => {
  test('every item is painted at the coordinate it was measured at', async () => {
    // The fixture gives item i a flat, unique fill. Probing each item's own
    // centre and matching the pixel against that table proves the browser drew
    // the right tile in the right cell — a grid whose boxes are all correct and
    // whose transforms composited in the wrong order passes layer 1 and fails
    // here.
    await page.evaluate(() => (window as any).matrix.mount({
      items: [
        { name: 'a', col: 0, row: 0 }, { name: 'b', col: 2, row: 0 },
        { name: 'c', col: 0, row: 1, colspan: 2 }, { name: 'd', col: 2, row: 1 },
      ],
      columnWidth: 100, rowHeight: 70, gap: '12px',
    }));
    const colors = await page.evaluate(() => (window as any).matrix.COLORS as number[][]);
    const pixels = await capture(
      page, '#stage', 'grid-item-identity',
      // Probed near the tile's top-left corner rather than its centre: the
      // fixture centres a label in each tile, and a glyph's antialiasing would
      // be measured instead of the fill.
      `() => [...document.getElementById('subject').children].map(item => {
        const box = item.getBoundingClientRect();
        return { x: box.x + 8, y: box.y + 8 };
      })`,
    );
    pixels.forEach((pixel, i) => {
      expect(pixel, `item ${i} painted ${pixel.join(',')} at its own centre,`
        + ` not its own fill ${colors[i].join(',')}`)
        .toEqual(colors[i]);
    });
  });

  test('the gap between two items is empty page, not spill from either', async () => {
    // A gap counted into an item's width, or a transform half a cell off, both
    // survive a box measurement that used the same wrong number twice. The gap
    // itself cannot: it must paint the page's own ground.
    await page.evaluate(() => (window as any).matrix.mount({
      items: [{ name: 'a', col: 0, row: 0 }, { name: 'b', col: 1, row: 0 }],
      columnWidth: 100, rowHeight: 70, gap: '20px',
    }));
    const [left, gapPixel, right, ground] = await capture(
      page, '#stage', 'grid-gap',
      // The ground reference is taken INSIDE the captured stage, to the right
      // of every occupied track — the stage is 900px wide and this grid claims
      // only two 100px columns, so that strip is page and nothing else. A probe
      // at the stage's own origin would land on the first tile.
      `() => {
        const [a, b] = [...document.getElementById('subject').children];
        const stage = document.getElementById('stage').getBoundingClientRect();
        const ra = a.getBoundingClientRect();
        const rb = b.getBoundingClientRect();
        const y = ra.y + ra.height / 2;
        return [
          { x: ra.x + 8, y },
          { x: (ra.right + rb.left) / 2, y },
          { x: rb.x + 8, y },
          { x: stage.right - 20, y },
        ];
      }`,
    );
    expect(sameColor(gapPixel, left),
      `the 20px gap painted ${gapPixel.join(',')} — the same as the item to its left`)
      .toBe(false);
    expect(sameColor(gapPixel, right),
      `the 20px gap painted ${gapPixel.join(',')} — the same as the item to its right`)
      .toBe(false);
    expect(gapPixel,
      `the gap painted ${gapPixel.join(',')} rather than the page's`
      + ` own ${ground.join(',')}`).toEqual(ground);
  });

  test('a hidden item leaves no paint in the cell it would have taken', async () => {
    // "`hidden` -- hides item from layout". Layer 1 already saw a zero box, but
    // a zero box with `overflow: visible` content still paints. The cell must
    // read as page.
    await page.evaluate(() => (window as any).matrix.mount({
      items: [
        { name: 'a', col: 0, row: 0 },
        { name: 'b', col: 1, row: 0, hidden: true },
        { name: 'c', col: 2, row: 0 },
      ],
      columnWidth: 100, rowHeight: 70, gap: '12px',
    }));
    const [emptyCell, ground, placed] = await capture(
      page, '#stage', 'grid-hidden-cell',
      `() => {
        const host = document.getElementById('subject');
        const stage = document.getElementById('stage').getBoundingClientRect();
        const a = host.querySelector('[name="a"]').getBoundingClientRect();
        const y = a.y + a.height / 2;
        return [
          // Where "b" would have been: one full cell to the right of "a".
          { x: a.x + a.width + 12 + a.width / 2, y },
          // Ground: inside the captured stage, past every occupied track.
          { x: stage.right - 20, y },
          // Reference: "a" itself, proving the capture is aligned at all.
          { x: a.x + 8, y: a.y + 8 },
        ];
      }`,
    );
    expect(emptyCell,
      `the hidden item's cell painted ${emptyCell.join(',')}, not the page's`
      + ` ${ground.join(',')}`).toEqual(ground);
    expect(sameColor(placed, ground),
      'the reference probe on a placed item also read as page — the capture is'
      + ' not aligned with the grid').toBe(false);
  });
});
