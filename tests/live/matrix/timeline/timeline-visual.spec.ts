/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-timeline TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/timeline, `npm run test:matrix`) owns structure
 * truth: which parts exist for which item fields, which classes carry
 * `orientation` / `position` / `variant`, and the DOM ORDER `reverse`
 * produces. It cannot own visual truth, because happy-dom performs no layout —
 * every box reads 0 and nothing is painted.
 *
 * The timeline is an almost entirely PRESENTATIONAL component: it has no
 * events, no requests and no interaction. Nearly all of its documented
 * behaviour is therefore CSS, and the claims below are reachable ONLY here:
 *
 *   · `orientation` — 'vertical' stacks items down the page, 'horizontal' lays
 *     them out across it. Two opposite geometric claims that only layout can
 *     tell apart.
 *   · `position` — 'left' puts the marker left of the content, 'right' puts it
 *     right, 'alternate' flips side per item. All three are `position:
 *     absolute` offsets: pure paint.
 *   · `reverse` — documented as showing the newest event first. The DOM tier
 *     proves the ARRAY is walked backwards; only a browser can say which item
 *     the reader's eye reaches first, which is the actual claim.
 *   · the connector line between markers (`::before`), which has no DOM node
 *     at all, and its documented absence after the last item.
 *   · per-item `variant` — five marker tints, a claim about colour.
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, contrast, sameColor } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/timeline/matrix.html';

const ORIENTATIONS = ['vertical', 'horizontal'] as const;
const POSITIONS = ['left', 'right', 'alternate'] as const;
const ITEM_SETS = ['doc', 'bare', 'variants'] as const;

interface Combo {
  id: string;
  orientation: typeof ORIENTATIONS[number];
  position: typeof POSITIONS[number];
  reverse: boolean;
  items: typeof ITEM_SETS[number];
}

/**
 * The full product of the component's four properties: 2 x 3 x 2 x 3 = 36
 * combos. The timeline has no other surface, so nothing is sampled away.
 */
function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  for (const orientation of ORIENTATIONS) {
    for (const position of POSITIONS) {
      for (const reverse of [false, true]) {
        for (const items of ITEM_SETS) {
          combos.push({
            id: `${orientation}/${position}/${reverse ? 'reverse' : 'forward'}/items=${items}`,
            orientation, position, reverse, items,
          });
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

// ── Known component defects ─────────────────────────────────────────────────
//
// Same contract as tests/live/matrix/matrix-harness.ts: a waiver names the
// EXACT message it excuses, everything else the combo reports still fails, and
// a waiver that stops reproducing fails on its own so a fixed component cannot
// leave a permanent lie behind in the suite.

interface Waiver {
  id: string;
  applies: (combo: Combo) => boolean;
  matches: RegExp;
}

const WAIVERS: Waiver[] = [
  {
    // VISUAL-MATRIX-timeline-1. `reverse` is documented as "newest first", and the
    // component implements it TWICE: `render()` reverses the items array, and
    // the stylesheet adds `flex-direction: column-reverse` (vertical) /
    // `row-reverse` (horizontal) via `.timeline--reverse`. The two cancel, so
    // a reversed timeline paints in exactly the same visual order as an
    // unreversed one — the switch is a no-op on screen.
    //
    // Minimal repro: mount the doc's three-event example twice, once with
    // `reverse`, and read the on-screen top-to-bottom titles. Both read
    // Created, Review, Launch.
    //
    // Reported, not fixed — see render() in
    // packages/components/src/timeline/snice-timeline.ts and the
    // `.timeline--reverse` rules in snice-timeline.css.
    id: 'VISUAL-MATRIX-timeline-1',
    applies: c => c.reverse,
    matches: /^reverse painted the items in source order \(.*\) — the newest event is not first$/,
  },
];

/**
 * LAYER 1. One evaluate per combo, returning every violation at once so a
 * failing combo reports its whole story rather than one problem per re-run.
 */
async function visualProblems(combo: Combo, sourceTitles: string[]): Promise<string[]> {
  return page.evaluate(({ combo, sourceTitles }) => {
    const problems: string[] = [];
    const say = (m: string) => problems.push(m);
    const EPS = 1.0;

    const host = document.getElementById('subject') as HTMLElement | null;
    if (!host) { say('nothing mounted'); return problems; }
    const sr = host.shadowRoot;
    if (!sr) { say('no shadow root'); return problems; }

    const rect = (el: Element) => el.getBoundingClientRect();
    const hostBox = rect(host);
    const hostCs = getComputedStyle(host);
    if (hostCs.display !== 'block') say(`host display "${hostCs.display}", expected "block"`);
    if (hostCs.visibility !== 'visible') say(`host visibility "${hostCs.visibility}"`);

    const container = sr.querySelector('[part~="container"]') as HTMLElement | null;
    if (!container) { say('no part="container"'); return problems; }
    const containerBox = rect(container);
    if (containerBox.width <= 0 || containerBox.height <= 0) {
      say(`the container renders at ${containerBox.width}x${containerBox.height}`);
      return problems;
    }

    const items = [...sr.querySelectorAll('[part~="item"]')] as HTMLElement[];
    if (items.length === 0) { say('no items rendered'); return problems; }

    const boxes = items.map(rect);
    for (const [i, box] of boxes.entries()) {
      if (box.width <= 0 || box.height <= 0) say(`item[${i}] renders at ${box.width}x${box.height}`);
    }

    // ── orientation: two opposite geometric claims ──────────────────────────
    if (combo.orientation === 'vertical') {
      for (let i = 1; i < boxes.length; i++) {
        const a = boxes[i - 1];
        const b = boxes[i];
        if (b.top < a.top - EPS && b.bottom < a.top + EPS) continue; // visual order handled below
        if (Math.abs(b.left - a.left) > 200) {
          say(`vertical items ${i - 1}/${i} are ${Math.abs(b.left - a.left).toFixed(0)}px apart`
            + ' horizontally — they were laid out side by side');
        }
      }
      // Stacked, therefore vertically disjoint whichever way the flow runs.
      const ordered = [...boxes].sort((a, b) => a.top - b.top);
      for (let i = 1; i < ordered.length; i++) {
        if (ordered[i].top < ordered[i - 1].bottom - EPS) {
          say(`vertical items overlap: one ends at ${ordered[i - 1].bottom.toFixed(1)},`
            + ` the next starts at ${ordered[i].top.toFixed(1)}`);
        }
      }
    } else {
      const ordered = [...boxes].sort((a, b) => a.left - b.left);
      for (let i = 1; i < ordered.length; i++) {
        if (ordered[i].left < ordered[i - 1].right - EPS) {
          say(`horizontal items overlap: one ends at ${ordered[i - 1].right.toFixed(1)},`
            + ` the next starts at ${ordered[i].left.toFixed(1)}`);
        }
      }
      // `min-width: 200px` per item is what makes a horizontal timeline
      // readable; a column-stacked fallback would break the whole claim.
      const sameColumn = boxes.every(b => Math.abs(b.left - boxes[0].left) < EPS);
      if (boxes.length > 1 && sameColumn) {
        say('horizontal timeline stacked its items in one column');
      }
    }

    // ── reverse: the ON-SCREEN order, which is the documented claim ─────────
    const visual = items
      .map((item, i) => ({ i, box: boxes[i] }))
      .sort((a, b) => (combo.orientation === 'vertical'
        ? a.box.top - b.box.top
        : a.box.left - b.box.left))
      .map(entry => (items[entry.i].querySelector('[part~="title"]')?.textContent ?? '').trim());
    // The documented claim, stated against the CALLER's array: `reverse` shows
    // the newest event first, so the on-screen order is the source order
    // back-to-front. Nothing here is derived from what the component rendered.
    const expectedVisual = combo.reverse ? [...sourceTitles].reverse() : sourceTitles;
    if (visual.join('|') !== expectedVisual.join('|')) {
      if (combo.reverse) {
        say(`reverse painted the items in source order (${visual.join(', ')})`
          + ' — the newest event is not first');
      } else {
        say(`the items painted as ${visual.join(', ')}, not in source order`
          + ` (${expectedVisual.join(', ')})`);
      }
    }

    // ── position: where the marker sits relative to its content ────────────
    for (const [i, item] of items.entries()) {
      const marker = item.querySelector('[part~="marker"]') as HTMLElement | null;
      const content = item.querySelector('[part~="content"]') as HTMLElement | null;
      if (!marker) { say(`item[${i}] has no part="marker"`); continue; }
      if (!content) { say(`item[${i}] has no part="content"`); continue; }
      const m = rect(marker);
      const c = rect(content);
      if (m.width <= 0 || m.height <= 0) {
        say(`item[${i}] marker renders at ${m.width}x${m.height}`);
        continue;
      }
      // A round marker: the stylesheet asks for a 1.5rem circle.
      if (Math.abs(m.width - m.height) > EPS) {
        say(`item[${i}] marker is ${m.width.toFixed(1)}x${m.height.toFixed(1)} — not a circle`);
      }
      if (getComputedStyle(marker).borderRadius === '0px') {
        say(`item[${i}] marker has no border-radius`);
      }
      // The marker must never sit ON the text. Judged against the painted
      // title rather than the content BOX, which is deliberately padded so the
      // marker can occupy part of it.
      const t = item.querySelector('[part~="title"]')?.getBoundingClientRect();
      if (t) {
        const overlapsX = m.left < t.right - EPS && m.right > t.left + EPS;
        const overlapsY = m.top < t.bottom - EPS && m.bottom > t.top + EPS;
        if (overlapsX && overlapsY) say(`item[${i}] marker overlaps its own title`);
      }

      if (combo.orientation === 'vertical') {
        const onLeft = m.right <= c.left + EPS;
        const onRight = m.left >= c.right - EPS;
        if (combo.position === 'left' && !onLeft) {
          say(`item[${i}] position="left" put the marker at x=${m.left.toFixed(0)},`
            + ` content at x=${c.left.toFixed(0)}`);
        }
        if (combo.position === 'right' && !onRight) {
          say(`item[${i}] position="right" did not put the marker right of the content`);
        }
        if (combo.position === 'alternate' && !onLeft && !onRight) {
          say(`item[${i}] position="alternate" put the marker neither left nor right`);
        }
      } else {
        // Horizontal: the marker crowns the item's text. The content BOX
        // starts at the item's top edge and pads itself down past the marker,
        // so the meaningful comparison is against the painted title, not the
        // padding the marker is meant to sit in.
        const titleBox = item.querySelector('[part~="title"]')?.getBoundingClientRect();
        if (titleBox && m.bottom > titleBox.top + EPS) {
          say(`item[${i}] horizontal marker (bottom ${m.bottom.toFixed(0)}) is not above`
            + ` its title (top ${titleBox.top.toFixed(0)})`);
        }
      }
    }

    // ── alternate really alternates ────────────────────────────────────────
    if (combo.position === 'alternate' && combo.orientation === 'vertical' && items.length > 1) {
      const sides = items.map((item) => {
        const m = rect(item.querySelector('[part~="marker"]')!);
        const c = rect(item.querySelector('[part~="content"]')!);
        return m.right <= c.left + EPS ? 'left' : 'right';
      });
      if (new Set(sides).size < 2) {
        say(`position="alternate" put every marker on the ${sides[0]}`);
      }
      for (let i = 1; i < sides.length; i++) {
        if (sides[i] === sides[i - 1]) {
          say(`position="alternate": items ${i - 1} and ${i} are both on the ${sides[i]}`);
        }
      }
    }

    // ── the connector line: a ::before with no DOM node ────────────────────
    for (const [i, item] of items.entries()) {
      const before = getComputedStyle(item, '::before');
      const isLast = i === items.length - 1;
      const drawn = before.content !== 'none' && before.display !== 'none';
      if (!isLast && !drawn) {
        say(`item[${i}] draws no connector to the next event`);
      }
      if (isLast && drawn) {
        say('the LAST item still draws a connector — the timeline ends in a stray line');
      }
    }

    // ── the text is legible ────────────────────────────────────────────────
    for (const [i, item] of items.entries()) {
      const title = item.querySelector('[part~="title"]') as HTMLElement | null;
      if (!title) { say(`item[${i}] has no part="title"`); continue; }
      const box = rect(title);
      if (box.width <= 0 || box.height <= 0) {
        say(`item[${i}] title renders at ${box.width}x${box.height}`);
        continue;
      }
      const cs = getComputedStyle(title);
      if (parseFloat(cs.fontSize) < 9) say(`item[${i}] title font-size ${cs.fontSize}`);
      if (cs.visibility !== 'visible') say(`item[${i}] title visibility "${cs.visibility}"`);

      // Nothing paints over the title. A horizontal timeline is a real
      // `overflow-x: auto` scroller, so items past its right edge are legally
      // off-screen and are not probed — that is scrolling, not occlusion.
      const x = box.left + 4;
      const y = box.top + box.height / 2;
      const inView = x > containerBox.left + 1 && x < Math.min(containerBox.right, window.innerWidth) - 1
        && y > containerBox.top + 1 && y < Math.min(containerBox.bottom, window.innerHeight) - 1;
      if (inView) {
        const outer = document.elementFromPoint(x, y);
        if (outer !== host) {
          say(`item[${i}] title hit-test found`
            + ` <${outer?.tagName.toLowerCase() ?? 'nothing'}>, not the timeline`);
        }
      }
    }

    // ── every item stays inside the host's own box ─────────────────────────
    if (combo.orientation === 'vertical') {
      for (const [i, box] of boxes.entries()) {
        if (box.left < hostBox.left - EPS || box.right > hostBox.right + EPS) {
          say(`item[${i}] escapes the host horizontally`);
        }
      }
    }

    return problems;
  }, { combo, sourceTitles });
}

const combos = generateCombos();

test.describe('timeline visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      const mounted = await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      expect(mounted.items, `combo ${combo.id} mounted no items`).toBeGreaterThan(0);

      const problems = await visualProblems(combo, mounted.sourceTitles);
      const waivers = WAIVERS.filter(w => w.applies(combo));
      const excused = (problem: string) => waivers.some(w => w.matches.test(problem));

      expect(problems.filter(p => !excused(p)), `combo ${combo.id}`).toEqual([]);
      for (const waiver of waivers) {
        expect(
          problems.some(p => waiver.matches.test(p)),
          `combo ${combo.id}: ${waiver.id} no longer reproduces — delete its waiver`,
        ).toBe(true);
      }
    });
  }
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────

test.describe('timeline visual matrix: marquee pixels', () => {
  test('the connector line is really painted between two markers', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      orientation: 'vertical', position: 'left', items: 'doc',
    }));
    // The claim is "there is a line joining consecutive events", not "the line
    // is at x+12", so the probe scans the full width of the marker band midway
    // between markers 0 and 1 and asks whether ANY of it is inked. Pinning one
    // x would make this a test of the stylesheet's centring arithmetic, which
    // the docs say nothing about. The last point is bare surface, 60px right of
    // the band, and is the reference every scan point is compared against.
    const scan = await capture(
      page, '#subject', 'timeline-connector',
      `(host) => {
        const items = [...host.shadowRoot.querySelectorAll('[part~="item"]')];
        const a = items[0].querySelector('[part~="marker"]').getBoundingClientRect();
        const b = items[1].querySelector('[part~="marker"]').getBoundingClientRect();
        const y = (a.bottom + b.top) / 2;
        const points = [];
        for (let x = Math.round(a.left); x <= Math.round(a.right); x++) points.push({ x, y });
        points.push({ x: a.right + 60, y });
        return points;
      }`,
    );
    const surface = scan[scan.length - 1];
    const band = scan.slice(0, -1);
    const inked = band.filter(px => !sameColor(px, surface));
    expect(inked.length,
      `every pixel across the marker band between events 0 and 1 painted`
      + ` ${surface.join(',')} — the connector line is missing`).toBeGreaterThan(0);
    const strongest = inked
      .map(px => contrast(px, surface))
      .reduce((hi, value) => Math.max(hi, value), 0);
    expect(strongest,
      `the connector's best contrast against the surface is ${strongest.toFixed(3)}:1`)
      .toBeGreaterThan(1.02);
  });

  test('nothing is painted below the last marker', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      orientation: 'vertical', position: 'left', items: 'doc',
    }));
    // The reference for "bare surface" is taken at the FAR RIGHT of the same
    // row, well past the item's short description text. A point 60px right of
    // the marker still lands inside the content's glyph band, and which pixels
    // there are glyph and which are surface depends on the engine's font
    // metrics — a reference that reads a glyph makes this probe a fact about
    // the font, not about the timeline.
    const [belowLast, surface] = await capture(
      page, '#subject', 'timeline-last-item',
      `(host) => {
        const hostBox = host.getBoundingClientRect();
        const items = [...host.shadowRoot.querySelectorAll('[part~="item"]')];
        const last = items[items.length - 1];
        const m = last.querySelector('[part~="marker"]').getBoundingClientRect();
        const box = last.getBoundingClientRect();
        const y = Math.min(box.bottom - 1, m.bottom + 8);
        return [
          { x: m.x + m.width / 2, y },
          { x: hostBox.right - 10, y },
        ];
      }`,
    );
    expect(sameColor(belowLast, surface),
      `the last item painted ${belowLast.join(',')} below its marker where the surface is`
      + ` ${surface.join(',')} — the timeline ends in a stray line`).toBe(true);
  });

  test('the five variants paint five distinguishable markers', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      orientation: 'vertical', position: 'left', items: 'variants',
    }));
    const pixels = await capture(
      page, '#subject', 'timeline-variants',
      `(host) => [...host.shadowRoot.querySelectorAll('[part~="marker"]')].map(m => {
        const b = m.getBoundingClientRect();
        // The marker's own border ring: variant colour lives there for every
        // variant, including 'default' whose fill matches the surface.
        return { x: b.x + 1, y: b.y + b.height / 2 };
      })`,
    );
    expect(pixels).toHaveLength(5);
    const unique = new Set(pixels.map(p => p.join(',')));
    expect(unique.size,
      `the five variant markers painted ${unique.size} distinct border colours`
      + ` (${[...unique].join(' | ')})`).toBe(5);
  });

  test('a marker circle is visible against the surface', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      orientation: 'vertical', position: 'left', items: 'doc',
    }));
    const [ring, surface] = await capture(
      page, '#subject', 'timeline-marker',
      `(host) => {
        const m = host.shadowRoot.querySelector('[part~="marker"]').getBoundingClientRect();
        return [
          { x: m.x + 1, y: m.y + m.height / 2 },
          { x: m.right + 40, y: m.y + m.height / 2 },
        ];
      }`,
    );
    expect(contrast(ring, surface),
      `the marker ring (${ring.join(',')}) sits at`
      + ` ${contrast(ring, surface).toFixed(2)}:1 against the surface (${surface.join(',')})`)
      .toBeGreaterThan(1.2);
  });
});
