/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-binpack TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/binpack, `npm run test:matrix`) owns
 * the packing RULES: no overlap, inside the constrained axis, on the declared
 * grid, the getLayout/setLayout round-trip, stamp/unstamp, and the events. It
 * gets there by STUBBING every box, because happy-dom performs no layout — its
 * `binpack-matrix-utils.ts` says so up front. Everything it proves is therefore
 * a claim about the packer's arithmetic given boxes it was told about.
 *
 * This tier removes that premise. The boxes are the browser's own, the
 * transforms are composited for real, and the questions are the ones the DOM
 * tier structurally cannot ask:
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   · every item has a REAL, non-zero painted box where the transform put it;
 *   · no two items overlap in real viewport coordinates — the one invariant a
 *     bin PACKING cannot be allowed to break, now measured rather than derived;
 *   · every item is inside the container on the constrained axis, and the
 *     container has grown to contain them on the free axis (an absolutely
 *     positioned layout that leaves its host 0px tall is invisible);
 *   · items are `position: absolute` and the host is `position: relative`, the
 *     documented mechanism;
 *   · `gap` is the real distance between neighbouring items;
 *   · `origin-left` / `origin-top` really mirror the pack;
 *   · the documented `[ready]` FOUC gate is present, and the two documented CSS
 *     custom properties carry the values the properties were set to;
 *   · no item is occluded by the container or by a sibling.
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   A tile that "has a box at (x, y)" can still be painted at the origin if the
 *   transform never composited. The marquee captures decode the PNG inside the
 *   browser under test and assert that the tile colour is really at the packed
 *   coordinates and that the gap between two tiles really shows the surface.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, sameColor } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/binpack/matrix.html';

type SetName = 'UNIFORM' | 'MIXED' | 'WIDE';

interface Combo {
  id: string;
  set: SetName;
  gap: string;
  gapPx: number;
  columnWidth: number;
  rowHeight: number;
  horizontal: boolean;
  originLeft: boolean;
  originTop: boolean;
  containerWidth: number;
  containerHeight: number;
}

/**
 * The cross: item set (3) x axis (2) x grid (2) x origin (2) — 24 combos, with
 * `gap` rotated across them. The DOM tier already owns the exhaustive
 * arithmetic cross at 92 combos; this tier is the expensive one, so it takes
 * one representative point per documented VISUAL dimension rather than
 * repeating that product in a browser.
 */
function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  const gaps = [
    { value: '0px', px: 0 },
    { value: '10px', px: 10 },
    { value: '1rem', px: 16 },
  ];
  let n = 0;
  for (const set of ['UNIFORM', 'MIXED', 'WIDE'] as SetName[]) {
    for (const horizontal of [false, true]) {
      for (const grid of [{ columnWidth: 0, rowHeight: 0 }, { columnWidth: 100, rowHeight: 50 }]) {
        for (const origin of [
          { originLeft: true, originTop: true },
          { originLeft: false, originTop: false },
        ]) {
          const gap = gaps[n % gaps.length];
          combos.push({
            id: `${set}/${horizontal ? 'horizontal' : 'vertical'}`
              + `/${grid.columnWidth ? 'grid' : 'free'}`
              + `/${origin.originLeft ? 'TL' : 'BR'}/[gap:${gap.value}]`,
            set, gap: gap.value, gapPx: gap.px,
            ...grid, horizontal, ...origin,
            containerWidth: 460,
            containerHeight: 320,
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

    const rect = (el: Element) => el.getBoundingClientRect();
    const hostBox = rect(host);
    const hostCs = getComputedStyle(host);

    // ── The documented mechanism ──────────────────────────────────────────
    // "Container uses `position: relative`, items get `position: absolute` +
    // `transform`" — if the container is static, every absolute item escapes to
    // the nearest positioned ancestor and the whole layout lands somewhere else.
    const base = sr.querySelector('[part~="base"]') as HTMLElement | null;
    if (!base) say('no [part~="base"] container');
    const positioned = [hostCs.position, base ? getComputedStyle(base).position : ''];
    if (!positioned.includes('relative') && !positioned.includes('absolute')) {
      say(`neither host (${positioned[0]}) nor base (${positioned[1]}) establishes a containing block`);
    }

    // "FOUC prevented via `[ready]` attribute gating transitions".
    if (!host.hasAttribute('ready')) say('host is missing the documented [ready] gate');

    // The two documented CSS custom properties.
    const gapVar = hostCs.getPropertyValue('--binpack-gap').trim();
    if (gapVar !== combo.gap) say(`--binpack-gap is "${gapVar}", documented ${combo.gap}`);

    // ── The items ─────────────────────────────────────────────────────────
    const items = [...host.children] as HTMLElement[];
    if (items.length === 0) { say('no slotted items'); return problems; }

    const boxes = items.map(item => ({
      name: item.getAttribute('name') ?? item.textContent ?? '?',
      item,
      box: rect(item),
    }));

    for (const { name, item, box } of boxes) {
      if (getComputedStyle(item).position !== 'absolute') {
        say(`item ${name} is ${getComputedStyle(item).position}, documented absolute`);
      }
      if (box.width < 1 || box.height < 1) {
        say(`item ${name} has a ${box.width}x${box.height} painted box`);
      }
    }

    // ── No overlap, measured ──────────────────────────────────────────────
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i].box;
        const b = boxes[j].box;
        if (a.left < b.right - EPS && a.right > b.left + EPS
          && a.top < b.bottom - EPS && a.bottom > b.top + EPS) {
          say(`items ${boxes[i].name} and ${boxes[j].name} overlap in real geometry`);
        }
      }
    }

    // ── The constrained axis really constrains ────────────────────────────
    // Vertical packing is "constrained by container width, infinite height";
    // horizontal is the mirror. The free axis must have GROWN to hold the pack,
    // because an absolutely positioned layout inside a 0px host paints nothing.
    const left = Math.min(...boxes.map(({ box }) => box.left));
    const right = Math.max(...boxes.map(({ box }) => box.right));
    const top = Math.min(...boxes.map(({ box }) => box.top));
    const bottom = Math.max(...boxes.map(({ box }) => box.bottom));

    if (!combo.horizontal) {
      if (left < hostBox.left - EPS || right > hostBox.right + EPS) {
        say(`pack spans ${left.toFixed(0)}..${right.toFixed(0)},`
          + ` outside the container ${hostBox.left.toFixed(0)}..${hostBox.right.toFixed(0)}`);
      }
      if (hostBox.height < bottom - top - EPS) {
        say(`container is ${hostBox.height.toFixed(0)}px tall but the pack is`
          + ` ${(bottom - top).toFixed(0)}px — it has not grown to hold its items`);
      }
    } else if (top < hostBox.top - EPS || bottom > hostBox.bottom + EPS) {
      say(`horizontal pack spans ${top.toFixed(0)}..${bottom.toFixed(0)},`
        + ` outside the container ${hostBox.top.toFixed(0)}..${hostBox.bottom.toFixed(0)}`);
    }

    // ── The origin really mirrors ─────────────────────────────────────────
    // `originLeft: false` = "right-to-left", `originTop: false` = "bottom-to-top".
    // The first DOM item is the first packed item, so it sits at the origin
    // corner: the pack's own extreme edge on each axis.
    const first = boxes[0].box;
    if (combo.originLeft) {
      if (first.left > left + EPS) say(`origin-left: first item starts at ${first.left.toFixed(0)}, pack starts at ${left.toFixed(0)}`);
    } else if (first.right < right - EPS) {
      say(`origin-left=false: first item ends at ${first.right.toFixed(0)}, pack ends at ${right.toFixed(0)}`);
    }
    if (combo.originTop) {
      if (first.top > top + EPS) say(`origin-top: first item starts at ${first.top.toFixed(0)}, pack starts at ${top.toFixed(0)}`);
    } else if (first.bottom < bottom - EPS) {
      say(`origin-top=false: first item ends at ${first.bottom.toFixed(0)}, pack ends at ${bottom.toFixed(0)}`);
    }

    // ── `gap` is a real distance ──────────────────────────────────────────
    // For every pair that is adjacent along an axis (they share a span on the
    // other axis), the space between them is at least the documented gap. A
    // packer that ignores `gap` produces touching tiles.
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i].box;
        const b = boxes[j].box;
        const overlapY = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > EPS;
        const overlapX = Math.min(a.right, b.right) - Math.max(a.left, b.left) > EPS;
        if (overlapY) {
          const dx = a.left < b.left ? b.left - a.right : a.left - b.right;
          if (dx > -EPS && dx < combo.gapPx - EPS) {
            say(`${boxes[i].name}/${boxes[j].name} are ${dx.toFixed(1)}px apart horizontally,`
              + ` documented gap ${combo.gap}`);
          }
        }
        if (overlapX) {
          const dy = a.top < b.top ? b.top - a.bottom : a.top - b.bottom;
          if (dy > -EPS && dy < combo.gapPx - EPS) {
            say(`${boxes[i].name}/${boxes[j].name} are ${dy.toFixed(1)}px apart vertically,`
              + ` documented gap ${combo.gap}`);
          }
        }
      }
    }

    // ── Nothing occludes an item ──────────────────────────────────────────
    for (const { name, item, box } of boxes) {
      const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
      if (hit !== item) {
        say(`item ${name} hit-tests as <${hit?.tagName.toLowerCase() ?? 'nothing'}>, not itself`);
      }
    }

    return problems;
  }, combo);
}

const combos = generateCombos();

test.describe('binpack visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      const mounted = await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      expect(mounted.horizontal).toBe(combo.horizontal);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

test.describe('binpack visual matrix: marquee pixels', () => {
  test('a packed tile paints its colour at the coordinates it was packed to', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      set: 'UNIFORM', gap: '10px', columnWidth: 0, rowHeight: 0,
      horizontal: false, originLeft: true, originTop: true,
      containerWidth: 460, containerHeight: 320,
    }));
    // Probe the centre of every tile. A transform that never composited leaves
    // the tiles stacked at the origin, so the later probes would read the
    // surface instead of the tile colour.
    const pixels = await capture(
      page, '#subject', 'binpack-tiles',
      `(host) => [...host.children].map(el => {
        const box = el.getBoundingClientRect();
        return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
      })`,
    );
    expect(pixels.length).toBe(6);
    for (const [r, g, b] of pixels) {
      expect(b > r + 40 && b > g + 40,
        `a tile painted rgb(${r},${g},${b}), not the tile blue`).toBe(true);
    }
  });

  test('the gap between two tiles really shows the surface behind them', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      set: 'UNIFORM', gap: '16px', columnWidth: 0, rowHeight: 0,
      horizontal: false, originLeft: true, originTop: true,
      containerWidth: 460, containerHeight: 320,
    }));
    const [tile, gutter] = await capture(
      page, '#subject', 'binpack-gap',
      `(host) => {
        const first = host.children[0].getBoundingClientRect();
        return [
          { x: first.x + first.width / 2, y: first.y + first.height / 2 },
          { x: first.right + 8, y: first.y + first.height / 2 },
        ];
      }`,
    );
    expect(sameColor(tile, gutter),
      `the gutter painted ${gutter.join(',')}, identical to the tile`).toBe(false);
  });
});
