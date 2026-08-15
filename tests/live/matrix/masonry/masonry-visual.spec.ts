/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-masonry TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/masonry, `npm run test:matrix`) owns
 * structure truth: the `[part="base"]` container, `role="list"`, the listitem
 * roles, and the three custom properties the stylesheet consumes. It cannot own
 * anything else, because masonry IS a layout: `column-count`, `column-gap` and
 * `column-width` are the entire component, and happy-dom performs no layout —
 * every box reads 0 and no column ever forms.
 *
 * snice-masonry is a PURELY PRESENTATIONAL component — no data, no events, no
 * interaction — so per .ai/fuzzing.md its matrix is deliberately small. But
 * this is the tier that matters for it: every documented property is a CSS rule
 * and a browser is the only place any of them can be verified at all.
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   · `columns=N` really produces N columns — measured as N distinct item x
 *     positions, not as a computed `column-count` string;
 *   · `columns=0` really switches to auto, and the resulting column count is
 *     the one `minColumnWidth` implies for the stage width;
 *   · `gap` is the real horizontal distance between adjacent columns AND the
 *     real vertical distance between stacked items;
 *   · items never overlap each other and never overflow the container;
 *   · items flow top-to-bottom within a column (documented: "Items flow
 *     top-to-bottom, left-to-right within CSS columns");
 *   · `break-inside: avoid` is actually computed on the slotted items;
 *   · no item is occluded by the container or by another item.
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   A column that "has a width" can still be painted nowhere. The marquee
 *   captures decode the PNG inside the browser under test and assert that the
 *   gap between two columns really shows the page surface (i.e. the gap is a
 *   gap, not an overlap the box model merely claims), and that an item painted
 *   in the second column is really to the right of the first.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, sameColor } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/masonry/matrix.html';

interface Combo {
  id: string;
  columns: number;
  gap: string;
  minColumnWidth: string;
  items: number;
  /** Resolved `gap` in px, so a measurement can be judged without re-parsing. */
  gapPx: number;
  stageWidth: number;
}

/** 1rem is 16px at the fixture's default root font size. */
const GAPS: Array<{ value: string; px: number }> = [
  { value: '0px', px: 0 },
  { value: '0.5rem', px: 8 },
  { value: '1rem', px: 16 },
  { value: '2rem', px: 32 },
];

/**
 * The cross: columns (0, 1, 2, 3, 5) x gap (4) — 20 combos, with
 * `minColumnWidth` and the item count rotated across them so both are exercised
 * at every column count without multiplying the product. Sized to a component
 * with three properties and one container.
 */
function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  const widths = ['180px', '250px', '420px'];
  const counts = [3, 7, 12];
  let n = 0;
  for (const columns of [0, 1, 2, 3, 5]) {
    for (const gap of GAPS) {
      const minColumnWidth = widths[n % widths.length];
      const items = counts[n % counts.length];
      combos.push({
        id: `columns=${columns}/gap=${gap.value}/[min:${minColumnWidth},items:${items}]`,
        columns, gap: gap.value, gapPx: gap.px, minColumnWidth, items,
        stageWidth: 900,
      });
      n++;
    }
  }
  return combos;
}

let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(FIXTURE);
  await page.waitForFunction(() => document.documentElement.dataset.matrixReady === 'true');
});
test.afterAll(async () => { await page?.close(); });

/**
 * LAYER 1. One evaluate per combo, returning every violation at once so a
 * failing combo reports its whole story rather than one problem per re-run.
 */
async function visualProblems(combo: Combo): Promise<string[]> {
  return page.evaluate((combo) => {
    const problems: string[] = [];
    const say = (m: string) => problems.push(m);
    const EPS = 1.5;

    const host = document.getElementById('subject') as HTMLElement | null;
    if (!host) { say('nothing mounted'); return problems; }
    const sr = host.shadowRoot;
    if (!sr) { say('no shadow root'); return problems; }

    const base = sr.querySelector('[part~="base"]') as HTMLElement | null;
    if (!base) { say('no [part~="base"] container'); return problems; }

    const rect = (el: Element) => el.getBoundingClientRect();
    const hostBox = rect(host);
    const baseBox = rect(base);
    const baseCs = getComputedStyle(base);

    if (getComputedStyle(host).visibility !== 'visible') say('host is not visible');
    if (baseBox.width < 1) say(`container is ${baseBox.width}px wide`);

    // ── The documented column count reaches the layout engine ──────────────
    // `columns = 0` is the documented auto mode; anything else is that exact
    // number of columns. `column-count` is read as a computed value because
    // that is the property the docs name; the geometric check below is what
    // proves the value was honoured rather than merely accepted.
    const wantCount = combo.columns === 0 ? 'auto' : String(combo.columns);
    if (baseCs.columnCount !== wantCount) {
      say(`column-count computed "${baseCs.columnCount}", documented ${wantCount}`);
    }
    if (combo.columns === 0) {
      const wantWidth = parseFloat(combo.minColumnWidth);
      const gotWidth = parseFloat(baseCs.columnWidth);
      if (!Number.isFinite(gotWidth) || Math.abs(gotWidth - wantWidth) > EPS) {
        say(`auto mode column-width "${baseCs.columnWidth}", documented ${combo.minColumnWidth}`);
      }
    }

    // ── `gap` is the real column gap ───────────────────────────────────────
    const gotGap = parseFloat(baseCs.columnGap);
    if (!Number.isFinite(gotGap) || Math.abs(gotGap - combo.gapPx) > EPS) {
      say(`column-gap computed "${baseCs.columnGap}", documented ${combo.gap} (${combo.gapPx}px)`);
    }

    // ── The items ─────────────────────────────────────────────────────────
    const items = [...host.children] as HTMLElement[];
    if (items.length !== combo.items) {
      say(`${items.length} slotted items, expected ${combo.items}`);
      return problems;
    }
    const boxes = items.map(item => ({ item, box: rect(item) }));

    for (const { item, box } of boxes) {
      const cs = getComputedStyle(item);
      // Documented: "`break-inside: avoid` keeps an item from splitting across
      // columns". A masonry that lets an item split is not a masonry.
      if (cs.breakInside !== 'avoid') {
        say(`item "${item.textContent}" has break-inside "${cs.breakInside}", documented avoid`);
      }
      if (box.width < 1 || box.height < 1) {
        say(`item "${item.textContent}" has a ${box.width}x${box.height} box`);
      }
      if (box.left < baseBox.left - EPS || box.right > baseBox.right + EPS) {
        say(`item "${item.textContent}" overflows the container horizontally`
          + ` (${box.left.toFixed(0)}..${box.right.toFixed(0)}`
          + ` vs ${baseBox.left.toFixed(0)}..${baseBox.right.toFixed(0)})`);
      }
    }

    // ── Items never overlap ───────────────────────────────────────────────
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i].box;
        const b = boxes[j].box;
        const overlaps = a.left < b.right - EPS && a.right > b.left + EPS
          && a.top < b.bottom - EPS && a.bottom > b.top + EPS;
        if (overlaps) {
          say(`items ${i} and ${j} overlap`);
        }
      }
    }

    // ── The columns really exist ──────────────────────────────────────────
    // A column is an x position shared by a run of items.
    //
    // The claim is deliberately two-sided rather than an exact count. CSS
    // multicol BALANCES: it distributes content by height, so a handful of
    // items may legitimately leave the last column empty, and that is the
    // documented layout model ("masonry layout using CSS columns"), not a
    // defect. What the docs DO pin is the ceiling — `columns` is the column
    // count, so nothing may produce more than that — and, once there is
    // genuinely enough content to go round (two items per column), every
    // column has to be used or the property did nothing.
    const xs = [...new Set(boxes.map(({ box }) => Math.round(box.left)))].sort((a, b) => a - b);
    const admitted = Math.max(1, Math.floor(
      (baseBox.width + combo.gapPx) / (parseFloat(combo.minColumnWidth) + combo.gapPx),
    ));
    const cap = combo.columns > 0 ? combo.columns : admitted;
    const mode = combo.columns > 0
      ? `columns=${combo.columns}`
      : `auto mode (${combo.minColumnWidth} in ${baseBox.width.toFixed(0)}px admits ${admitted})`;

    if (xs.length < 1) {
      say('no item occupies any column');
    } else if (xs.length > cap) {
      say(`items occupy ${xs.length} columns (x = ${xs.join(',')}), more than ${mode} allows`);
    } else if (combo.items >= 2 * cap && xs.length !== cap) {
      say(`${combo.items} items filled only ${xs.length} of the ${cap} columns ${mode} declares`
        + ` (x = ${xs.join(',')})`);
    }

    // ── Adjacent columns are exactly `gap` apart ──────────────────────────
    for (let i = 1; i < xs.length; i++) {
      const columnWidth = Math.max(...boxes
        .filter(({ box }) => Math.round(box.left) === xs[i - 1])
        .map(({ box }) => box.width));
      const measured = xs[i] - (xs[i - 1] + columnWidth);
      if (Math.abs(measured - combo.gapPx) > EPS + 1) {
        say(`columns ${i - 1}->${i} are ${measured.toFixed(1)}px apart,`
          + ` documented gap ${combo.gap} (${combo.gapPx}px)`);
      }
    }

    // ── Items flow top-to-bottom within a column ──────────────────────────
    // Documented: "Items flow top-to-bottom, left-to-right within CSS columns".
    // So within one column, DOM order must be top-to-bottom, and the vertical
    // distance between stacked neighbours is the documented gap.
    for (const x of xs) {
      const column = boxes.filter(({ box }) => Math.round(box.left) === x);
      for (let i = 1; i < column.length; i++) {
        const above = column[i - 1].box;
        const below = column[i].box;
        if (below.top < above.bottom - EPS) {
          say(`column @${x}: "${column[i].item.textContent}" is not below`
            + ` "${column[i - 1].item.textContent}"`);
        }
        const measured = below.top - above.bottom;
        if (Math.abs(measured - combo.gapPx) > EPS + 1) {
          say(`column @${x}: "${column[i - 1].item.textContent}" ->`
            + ` "${column[i].item.textContent}" vertical gap ${measured.toFixed(1)}px,`
            + ` documented ${combo.gapPx}px`);
        }
      }
    }

    // ── Nothing occludes an item ──────────────────────────────────────────
    // `elementFromPoint` only answers for points inside the viewport, and a
    // single-column stack of twelve cards is taller than any viewport. Items
    // below the fold are skipped rather than reported: "off screen" is a fact
    // about the fixture's page, not about the component.
    for (const { item, box } of boxes) {
      const x = box.left + box.width / 2;
      const y = box.top + box.height / 2;
      if (y < 0 || y > window.innerHeight || x < 0 || x > window.innerWidth) continue;
      const outer = document.elementFromPoint(x, y);
      if (outer !== item) {
        say(`item "${item.textContent}" hit-tests as`
          + ` <${outer?.tagName.toLowerCase() ?? 'nothing'}>, not itself`);
      }
    }

    return problems;
  }, combo);
}

const combos = generateCombos();

test.describe('masonry visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      const mounted = await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      expect(mounted.columns).toBe(combo.columns);
      expect(mounted.items).toBe(combo.items);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────
//
// Small on purpose. A screenshot is two orders of magnitude more expensive than
// an evaluate, and layer 1 already measured the model the browser built. These
// two exist because "the boxes do not overlap" and "there is visible space
// between the columns" are different claims, and only pixels can separate them.

test.describe('masonry visual matrix: marquee pixels', () => {
  test('the gap between two columns really shows the surface behind it', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      columns: 2, gap: '2rem', minColumnWidth: '250px', items: 6, stageWidth: 900,
    }));
    // Probe the middle of the first card, and the middle of the gutter beside
    // it. A "gap" whose pixels are the card colour is not a gap.
    const [card, gutter] = await capture(
      page, '#subject', 'masonry-gap',
      `(host) => {
        const items = [...host.children];
        const first = items[0].getBoundingClientRect();
        return [
          { x: first.x + first.width / 2, y: first.y + first.height / 2 },
          { x: first.right + 16, y: first.y + first.height / 2 },
        ];
      }`,
    );
    expect(sameColor(card, gutter),
      `gutter painted ${gutter.join(',')}, identical to the card ${card.join(',')}`).toBe(false);
  });

  test('the second column is painted to the right of the first', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      columns: 3, gap: '1rem', minColumnWidth: '250px', items: 9, stageWidth: 900,
    }));
    // The card colour is a known, saturated blue. Probing the centre of a card
    // in each of the three columns must find that colour three times — proving
    // content was painted in all three, not merely allocated a box in them.
    const pixels = await capture(
      page, '#subject', 'masonry-columns',
      `(host) => {
        const boxes = [...host.children].map(el => el.getBoundingClientRect());
        const xs = [...new Set(boxes.map(b => Math.round(b.left)))].sort((a, b) => a - b);
        return xs.map(x => {
          const box = boxes.find(b => Math.round(b.left) === x);
          return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
        });
      }`,
    );
    expect(pixels.length, 'three columns should have been probed').toBe(3);
    for (const [r, g, b] of pixels) {
      expect(b > r + 40 && b > g + 40,
        `a column painted rgb(${r},${g},${b}), not the card's blue`).toBe(true);
    }
  });
});
