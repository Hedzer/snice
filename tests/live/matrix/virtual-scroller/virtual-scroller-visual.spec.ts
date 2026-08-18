/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-virtual-scroller TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/virtual-scroller, `npm run
 * test:matrix`) owns the WINDOW arithmetic: coverage, buffer, thrift, spacer
 * extent and viewport offset, across 97 combos. It reaches those answers by
 * pinning `offsetHeight` and reading the component's own bookkeeping, because
 * happy-dom performs no layout and has no scrolling at all.
 *
 * That is the exact boundary this tier exists to cross. A virtual scroller is
 * a claim about what a *scroll port* shows, and only a browser has one:
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   · the component really produces a scroll port whose scrollable extent is
 *     the whole list (`total x itemHeight`) — that is what gives the scrollbar
 *     its size, and it is the user's only cue that 5 000 items exist;
 *   · every rendered row has a real, non-zero painted box of the documented
 *     height, rows are contiguous, and no two overlap;
 *   · the visible band of the port is completely covered by rendered rows —
 *     a virtual scroller with a hole in the viewport is the failure mode the
 *     whole design exists to avoid, and it is invisible without layout;
 *   · rows are painted where their index says they are, in page coordinates;
 *   · nothing occludes a row.
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   Rows that "have boxes in the viewport" can still be clipped away by the
 *   port's own `overflow`. The marquee capture decodes the PNG inside the
 *   browser under test and asserts the rows really painted.
 *
 * ── Findings ───────────────────────────────────────────────────────────────
 *   Two documented behaviours once failed against a real scroll port. Both
 *   findings (VISUAL-MATRIX-virtual-scroller-1 and -2) are FIXED: the
 *   component now scrolls the host (the real port) in `scrollToIndex()` and
 *   listens for `scroll` on the host. The assertions at the bottom of this
 *   file run unpinned at documented strength — a regression re-fails them.
 *   Neither is reachable from the DOM tier, because neither happy-dom nor the
 *   component's own bookkeeping has a scroll port.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/virtual-scroller/matrix.html';

interface Combo {
  id: string;
  itemHeight: number;
  bufferSize: number;
  total: number;
  viewportHeight: number;
}

/**
 * The cross: itemHeight (3) x bufferSize (3) x total (3) — 27 combos at a
 * fixed 400px viewport, which is the documented default height (`:host {
 * height: 25rem }`). The DOM tier already owns the exhaustive window
 * arithmetic; this tier takes one representative point per documented
 * dimension and spends its budget on the things layout decides.
 */
function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  for (const itemHeight of [25, 50, 80]) {
    for (const bufferSize of [0, 5, 10]) {
      for (const total of [6, 200, 5000]) {
        combos.push({
          id: `h${itemHeight}/buf${bufferSize}/n${total}`,
          itemHeight, bufferSize, total, viewportHeight: 400,
        });
      }
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

    const hostBox = host.getBoundingClientRect();
    if (Math.abs(hostBox.height - combo.viewportHeight) > EPS) {
      say(`viewport is ${hostBox.height.toFixed(0)}px, the fixture asked for ${combo.viewportHeight}`);
    }

    const contentHeight = combo.total * combo.itemHeight;
    const scrollable = contentHeight > combo.viewportHeight + EPS;

    // ── The scroll port ───────────────────────────────────────────────────
    // The whole point of the spacer is that the scrollbar reflects the WHOLE
    // list, not the rendered window. Whichever element the component chooses
    // to overflow, its scrollable extent has to be the full list height.
    const ports = [
      { name: 'host', node: host },
      { name: 'base', node: base },
    ].filter(({ node }) => {
      const overflow = getComputedStyle(node).overflowY;
      return overflow === 'auto' || overflow === 'scroll';
    });

    if (scrollable && ports.length === 0) {
      say(`${combo.total} x ${combo.itemHeight}px does not fit in ${combo.viewportHeight}px`
        + ' but neither the host nor the base scrolls');
    }
    for (const { name, node } of ports) {
      if (scrollable) {
        if (Math.abs(node.scrollHeight - contentHeight) > EPS + 1) {
          say(`${name} scrollHeight is ${node.scrollHeight}, the list is ${contentHeight}px`
            + ' — the scrollbar misrepresents the list');
        }
      } else if (node.scrollHeight > combo.viewportHeight + EPS) {
        // A list that fits must not invent scrollable extent. (`scrollHeight`
        // never reports LESS than the client box, so the short-list claim is
        // the ceiling, not the equality above.)
        say(`${name} scrollHeight is ${node.scrollHeight} for a ${contentHeight}px list`
          + ` that fits in ${combo.viewportHeight}px`);
      }
    }

    // ── The rendered rows ─────────────────────────────────────────────────
    const rows = [...sr.querySelectorAll('.scroller__item')] as HTMLElement[];
    if (rows.length === 0) { say('no rows rendered'); return problems; }

    const indices = rows.map(row => Number(row.getAttribute('data-index')));
    for (let i = 1; i < indices.length; i++) {
      if (indices[i] !== indices[i - 1] + 1) {
        say(`rendered indices are not contiguous: ${indices[i - 1]} then ${indices[i]}`);
      }
    }

    const boxes = rows.map(row => row.getBoundingClientRect());
    boxes.forEach((box, i) => {
      if (box.width < 1) say(`row ${indices[i]} is ${box.width}px wide`);
      if (Math.abs(box.height - combo.itemHeight) > EPS) {
        say(`row ${indices[i]} is ${box.height.toFixed(1)}px tall,`
          + ` documented item-height ${combo.itemHeight}`);
      }
    });
    for (let i = 1; i < boxes.length; i++) {
      const gap = boxes[i].top - boxes[i - 1].bottom;
      if (Math.abs(gap) > EPS) {
        say(`rows ${indices[i - 1]}/${indices[i]} are ${gap.toFixed(1)}px apart —`
          + ' a virtualised list must be seamless');
      }
    }

    // ── Rows are painted where their index says ───────────────────────────
    // Row N's top must be N * itemHeight below the top of the scrollable
    // content. With the port at rest that is measurable directly against the
    // host box; it is the claim that makes the scrollbar position meaningful.
    const portNode = ports[0]?.node ?? host;
    const scrollTop = portNode.scrollTop;
    boxes.forEach((box, i) => {
      const want = hostBox.top - scrollTop + indices[i] * combo.itemHeight;
      if (Math.abs(box.top - want) > EPS) {
        say(`row ${indices[i]} is painted at y=${box.top.toFixed(1)},`
          + ` its index puts it at ${want.toFixed(1)}`);
      }
    });

    // ── The visible band has no holes ─────────────────────────────────────
    // Every pixel row of the port between its top and bottom must be covered
    // by some rendered row, unless the list itself ends first.
    const bandTop = hostBox.top;
    const bandBottom = Math.min(hostBox.bottom, hostBox.top - scrollTop + contentHeight);
    const covered = boxes
      .map(box => [Math.max(box.top, bandTop), Math.min(box.bottom, bandBottom)] as const)
      .filter(([top, bottom]) => bottom > top)
      .sort((a, b) => a[0] - b[0]);
    let cursor = bandTop;
    for (const [top, bottom] of covered) {
      if (top > cursor + EPS) {
        say(`the viewport has a ${(top - cursor).toFixed(1)}px hole at y=${cursor.toFixed(1)}`);
      }
      cursor = Math.max(cursor, bottom);
    }
    if (cursor < bandBottom - EPS) {
      say(`the viewport is uncovered below y=${cursor.toFixed(1)} (band ends ${bandBottom.toFixed(1)})`);
    }

    // ── Nothing occludes a visible row ────────────────────────────────────
    for (let i = 0; i < rows.length; i++) {
      const box = boxes[i];
      const y = box.top + box.height / 2;
      if (y < bandTop || y > bandBottom || y < 0 || y > window.innerHeight) continue;
      const x = box.left + Math.min(box.width / 2, 100);
      const hit = document.elementFromPoint(x, y);
      if (hit !== host) {
        say(`row ${indices[i]} hit-tests to <${hit?.tagName.toLowerCase() ?? 'nothing'}>`
          + ' outside the scroller');
        continue;
      }
      const inner = (sr as any).elementFromPoint(x, y) as Element | null;
      if (inner && !rows[i].contains(inner) && inner !== rows[i]) {
        say(`row ${indices[i]} is occluded by <${inner.tagName.toLowerCase()}`
          + `${inner.className ? `.${String(inner.className).split(' ')[0]}` : ''}>`);
      }
    }

    return problems;
  }, combo);
}

const combos = generateCombos();

test.describe('virtual-scroller visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      const mounted = await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      expect(mounted.total).toBe(combo.total);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

// ── FINDINGS ────────────────────────────────────────────────────────────────
//
// Both of these were documented behaviours that a real scroll port refuted,
// invisible to the DOM tier: happy-dom has no scrolling, so the component's own
// `cachedScrollTop` bookkeeping was the only thing there was to check, and that
// bookkeeping was exactly what was wrong.
//
// (fixed) The component now scrolls the host (the real port) in
// `scrollToIndex()` and listens for `scroll` on the host; both findings are
// closed and the assertions below run unpinned. They stay at documented
// strength — a regression re-fails them.

test.describe('virtual-scroller visual matrix: findings', () => {
  /**
   * VISUAL-MATRIX-virtual-scroller-1 (fixed) — `scrollToIndex()` did not scroll.
   *
   * docs/ai/components/virtual-scroller.md: "scrollToIndex(index) - Scroll to
   * item at index", with `scroller.scrollToIndex(500)` as the documented call.
   *
   * The stylesheet put `overflow: auto` on `:host`, so the HOST was the scroll
   * port, but `scrollToIndex()` assigned `this.scrollerElement.scrollTop` — a
   * no-op on `.scroller`, which has no overflow of its own. The rendered WINDOW
   * moved while the port stood still. Fixed: `scrollToIndex()` now also assigns
   * the host's `scrollTop` (and per-item heights are prefix-summed).
   */
  test('VISUAL-MATRIX-virtual-scroller-1: scrollToIndex(500) puts row 500 in view', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      itemHeight: 50, bufferSize: 5, total: 1000, viewportHeight: 400,
    }));
    await page.evaluate(() => (window as any).matrix.scrollToIndex(500));

    const seen = await page.evaluate(() => {
      const host = document.getElementById('subject') as HTMLElement;
      const hostBox = host.getBoundingClientRect();
      const row = host.shadowRoot!.querySelector('[data-index="500"]') as HTMLElement | null;
      if (!row) return { rendered: false, offset: NaN, scrollTop: host.scrollTop };
      const box = row.getBoundingClientRect();
      return {
        rendered: true,
        offset: box.top - hostBox.top,
        scrollTop: host.scrollTop,
      };
    });

    expect(seen.rendered, 'row 500 was not rendered at all').toBe(true);
    // "Scroll to item at index" means the item is at the top of the port.
    expect(Math.abs(seen.offset),
      `row 500 is ${seen.offset.toFixed(0)}px from the top of the viewport`
      + ` (scrollTop ${seen.scrollTop})`).toBeLessThan(2);
  });

  /**
   * VISUAL-MATRIX-virtual-scroller-2 (fixed) — a user scroll never updated the
   * window.
   *
   * docs/ai/components/virtual-scroller.md: "Efficiently renders large lists by
   * only displaying visible items." The window is therefore a function of the
   * scroll position, and the user is the primary thing that changes it.
   *
   * The component bound `@scroll` on `.scroller`, but the element the browser
   * scrolls is `:host` (the one with `overflow: auto`), and `scroll` does not
   * bubble. Fixed: the host itself now carries the listener.
   */
  test('VISUAL-MATRIX-virtual-scroller-2: scrolling the port updates the window', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      itemHeight: 50, bufferSize: 5, total: 1000, viewportHeight: 400,
    }));
    // 100 rows down: entirely outside the initial window, and well inside the
    // list, so nothing here depends on clamping at either end.
    await page.evaluate(() => (window as any).matrix.userScrollTo(100 * 50));

    const seen = await page.evaluate(() => {
      const host = document.getElementById('subject') as any;
      return {
        scrollTop: host.scrollTop,
        range: host.getVisibleRange(),
        rendered: [...host.shadowRoot.querySelectorAll('.scroller__item')]
          .map((row: any) => Number(row.getAttribute('data-index'))),
      };
    });

    expect(seen.scrollTop, 'the port did not move').toBe(5000);
    // Rows 100..107 fill a 400px viewport at 50px each; every one of them must
    // now be in the DOM.
    for (const index of [100, 104, 107]) {
      expect(seen.rendered.includes(index),
        `row ${index} is visible at scrollTop ${seen.scrollTop} but was not rendered`
        + ` (window ${seen.range.start}..${seen.range.end})`).toBe(true);
    }
  });
});

test.describe('virtual-scroller visual matrix: marquee pixels', () => {
  test('the rendered rows really paint inside the port', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      itemHeight: 50, bufferSize: 5, total: 5000, viewportHeight: 400,
    }));
    // The renderer alternates a blue row and a green row. Probing the centre of
    // the first four rows must find that alternation: a port that clipped its
    // content away, or a row whose box exists but paints nothing, would read
    // the page surface instead.
    const pixels = await capture(
      page, '#subject', 'virtual-scroller-rows',
      `(host) => {
        const rows = [...host.shadowRoot.querySelectorAll('.scroller__item')].slice(0, 4);
        return rows.map(row => {
          const box = row.getBoundingClientRect();
          return { x: box.x + 40, y: box.y + box.height / 2 };
        });
      }`,
    );
    expect(pixels.length).toBe(4);
    pixels.forEach(([r, g, b], i) => {
      if (i % 2 === 0) {
        expect(b > r + 40 && b > g + 40, `row ${i} painted rgb(${r},${g},${b}), not blue`).toBe(true);
      } else {
        expect(g > r + 40 && g > b + 40, `row ${i} painted rgb(${r},${g},${b}), not green`).toBe(true);
      }
    });
  });
});
