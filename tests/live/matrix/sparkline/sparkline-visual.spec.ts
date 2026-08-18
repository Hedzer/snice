/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-sparkline TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/sparkline, `npm run test:matrix`) owns the mark
 * census and the data ordering: which parts exist for a property vector, how
 * many of each, and whether the marks ENCODE the series. It deliberately stops
 * short of geometry, because happy-dom performs no layout — an `<svg>` there
 * has no box, `getBBox` does not exist, and nothing is painted.
 *
 * The sparkline is a PURELY PRESENTATIONAL component: no events, no requests,
 * no interaction, and its entire documented surface is "which marks are drawn,
 * how big, and in what colour". So the visual tier is where most of its
 * contract actually lives:
 *
 *   · `width` / `height` — documented as numbers with defaults 100 x 30. Only
 *     a browser can say the chart really occupies that box.
 *   · `strokeWidth` — a number that must reach the painted stroke.
 *   · `color` — five documented values, each a different CSS custom property.
 *     "They are five different classes" is a DOM fact; "they paint five
 *     different colours" is not.
 *   · `customColor` — documented to OVERRIDE `color`. A precedence claim
 *     between two stylesheet rules, invisible without computed style.
 *   · `showArea` / `showDots` / `smooth` / `type` — each adds or reshapes a
 *     mark, and every mark must stay inside the declared viewport rather than
 *     being clipped away at the edges.
 *
 * ── Layer 1 (every combo): geometry + computed style ────────────────────────
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *
 * The fixture disables the entry animations (the line unrolls over 900ms, the
 * area fades in, dots pop on staggered delays), so every measurement is of the
 * final state the docs describe rather than of a frame nobody ships.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, contrast, sameColor } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/sparkline/matrix.html';

const TYPES = ['line', 'bar', 'area'] as const;
const COLORS = ['primary', 'success', 'warning', 'danger', 'muted'] as const;
const DATASETS = ['rising', 'falling', 'flat', 'negative', 'long', 'pair', 'single'] as const;

interface Combo {
  id: string;
  type: typeof TYPES[number];
  color: typeof COLORS[number];
  dataset: typeof DATASETS[number];
  showDots: boolean;
  showArea: boolean;
  smooth: boolean;
  width: number;
  height: number;
  strokeWidth: number;
  customColor?: string;
}

/**
 * The cross: 3 types x 5 colours x all 8 vectors of the three mark switches
 * (`showDots`, `showArea`, `smooth`) = 120 combos, with the dataset and the
 * box rotated across the product so every series shape and both a default and
 * a resized box are covered without multiplying the count again.
 *
 * A sparkline combo is a mount plus one evaluate against a page that is
 * already open, so 120 of them is a couple of seconds — the whole reason this
 * tier can afford the full product rather than a sample.
 */
function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  let n = 0;
  for (const type of TYPES) {
    for (const color of COLORS) {
      for (let bits = 0; bits < 8; bits++) {
        const showDots = !!(bits & 1);
        const showArea = !!(bits & 2);
        const smooth = !!(bits & 4);
        const flags = [showDots && 'dots', showArea && 'area', smooth && 'smooth']
          .filter(Boolean).join(',');
        const dataset = DATASETS[n % DATASETS.length];
        const resized = n % 3 === 1;
        combos.push({
          id: `${type}/${color}/[${flags || 'plain'}]/${dataset}${resized ? '/150x40' : ''}`,
          type, color, dataset, showDots, showArea, smooth,
          width: resized ? 150 : 100,
          height: resized ? 40 : 30,
          strokeWidth: n % 5 === 2 ? 4 : 2,
        });
        n++;
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
// a waiver that stops reproducing fails on its own.

interface Waiver {
  id: string;
  applies: (combo: Combo) => boolean;
  matches: RegExp;
}

// MATRIX-sparkline-2 (fixed): a ONE-POINT series used to compute its x as
// `index / (data.length - 1)` — 0/0 — so every x was NaN and the dot painted
// half outside the chart's own box. The single point is centred now, the dot
// lands whole inside the box, and the waiver that excused the escape was
// deleted — an empty list is what "no known defects" looks like.
const WAIVERS: Waiver[] = [];

/**
 * LAYER 1. One evaluate per combo, returning every violation at once so a
 * failing combo reports its whole story rather than one problem per re-run.
 */
async function visualProblems(combo: Combo): Promise<string[]> {
  return page.evaluate((combo) => {
    const problems: string[] = [];
    const say = (m: string) => problems.push(m);
    const EPS = 1.0;

    const host = document.getElementById('subject') as HTMLElement | null;
    if (!host) { say('nothing mounted'); return problems; }
    const sr = host.shadowRoot;
    if (!sr) { say('no shadow root'); return problems; }

    const rect = (el: Element) => el.getBoundingClientRect();
    const singlePoint = combo.dataset === 'single';
    const svg = sr.querySelector('[part~="svg"]') as SVGSVGElement | null;
    if (!svg) { say('no part="svg"'); return problems; }

    // ── The declared box ────────────────────────────────────────────────────
    const svgBox = rect(svg);
    if (Math.abs(svgBox.width - combo.width) > EPS) {
      say(`the svg is ${svgBox.width.toFixed(1)}px wide, declared width=${combo.width}`);
    }
    if (Math.abs(svgBox.height - combo.height) > EPS) {
      say(`the svg is ${svgBox.height.toFixed(1)}px tall, declared height=${combo.height}`);
    }
    if (svg.getAttribute('viewBox') !== `0 0 ${combo.width} ${combo.height}`) {
      say(`viewBox "${svg.getAttribute('viewBox')}" does not match the declared box`);
    }
    // Decorative, but announced: the docs pin role="img" plus a label.
    if (svg.getAttribute('role') !== 'img') say(`svg role "${svg.getAttribute('role')}"`);
    if (!svg.getAttribute('aria-label')) say('the svg carries no aria-label');

    const container = sr.querySelector('[part~="container"]') as HTMLElement | null;
    if (!container) say('no part="container"');

    // ── Every mark stays inside the viewport ────────────────────────────────
    const marks = [...svg.querySelectorAll('[part]')] as SVGGraphicsElement[];
    if (marks.length === 0) { say('the svg contains no marks at all'); return problems; }
    for (const mark of marks) {
      const name = mark.getAttribute('part');
      const box = rect(mark);
      if (box.width <= 0 && box.height <= 0) {
        // A ONE-POINT series is the exception: a line through a single vertex
        // has no extent in either axis, so a zero box is geometry, not a
        // defect. The docs say nothing about what a single-value sparkline
        // should look like, so nothing is claimed about it here — the
        // dedicated test below records the behaviour instead.
        //
        // A zero-HEIGHT bar is the second exception: the auto min/max maps the
        // series minimum to height 0, which the DOM tier pins as the contract
        // (`h >= 0`, tests/matrix/sparkline/sparkline-utils.ts). The layout
        // box of such a rect is engine-specific — Chromium reports (x, y, w, 0)
        // while Firefox and WebKit report all zeros at the viewport origin —
        // so the box is noise and the bar is judged on its attributes. Only
        // its width claim survives here: a zero-width bar is invisible in
        // every engine.
        const zeroHeightBar = (name ?? '').split(' ').includes('bar')
          && parseFloat(mark.getAttribute('height') ?? '') === 0;
        if (!singlePoint && !zeroHeightBar) say(`the ${name} mark renders at ${box.width}x${box.height}`);
        if (zeroHeightBar && parseFloat(mark.getAttribute('width') ?? '0') <= 0) {
          say(`a zero-height bar also has width="${mark.getAttribute('width')}"`);
        }
        continue;
      }
      if (box.left < svgBox.left - EPS || box.right > svgBox.right + EPS) {
        say(`a ${name} mark escapes the chart horizontally`
          + ` (${box.left.toFixed(1)}..${box.right.toFixed(1)} in`
          + ` ${svgBox.left.toFixed(1)}..${svgBox.right.toFixed(1)})`);
      }
      if (box.top < svgBox.top - EPS || box.bottom > svgBox.bottom + EPS) {
        say(`a ${name} mark escapes the chart vertically`);
      }
      const cs = getComputedStyle(mark);
      if (cs.visibility !== 'visible') say(`a ${name} mark has visibility "${cs.visibility}"`);
      if (cs.display === 'none') say(`a ${name} mark has display:none`);
    }

    // ── Bars: side by side, disjoint, ascending ─────────────────────────────
    const bars = [...svg.querySelectorAll('[part~="bar"]')] as SVGGraphicsElement[];
    if (combo.type === 'bar') {
      if (bars.length === 0) { say('type="bar" drew no bars'); }
      // Ordering and width are read from the rect's own x/width attributes —
      // the same source the DOM tier asserts — because the LAYOUT box of a
      // zero-height (series-minimum) bar is engine-specific: Firefox/WebKit
      // report it as an all-zero rect at the viewport origin, which would
      // read as "out of order" and "zero width" although the attributes every
      // engine paints from are identical to Chromium's. Every bar with a real
      // box was already checked for viewport containment and visibility in
      // the marks loop above.
      const rects = bars.map(b => ({
        x: parseFloat(b.getAttribute('x') ?? 'NaN'),
        width: parseFloat(b.getAttribute('width') ?? 'NaN'),
      }));
      for (let i = 1; i < rects.length; i++) {
        if (rects[i].x < rects[i - 1].x + rects[i - 1].width - EPS) {
          say(`bars ${i - 1}/${i} overlap horizontally`);
        }
        if (rects[i].x < rects[i - 1].x) {
          say(`bar ${i} is left of bar ${i - 1} — the series is drawn out of order`);
        }
      }
      // A bar chart whose bars all have the same width is what the docs mean
      // by a bar chart; a zero-width bar is invisible.
      for (const [i, r] of rects.entries()) {
        if (r.width <= 0) say(`bar ${i} has zero width`);
      }
    } else if (bars.length > 0) {
      say(`type="${combo.type}" drew ${bars.length} bars`);
    }

    // ── Line / area / dots: the marks the type and switches promise ─────────
    const line = svg.querySelector('[part~="line"]') as SVGGraphicsElement | null;
    const area = svg.querySelector('[part~="area"]') as SVGGraphicsElement | null;
    const dots = [...svg.querySelectorAll('[part~="dot"]')] as SVGGraphicsElement[];

    if (combo.type !== 'bar') {
      if (!line) say(`type="${combo.type}" drew no line`);
      if (line) {
        // `strokeWidth` is a documented number; it has to reach the paint.
        const width = parseFloat(getComputedStyle(line).strokeWidth);
        if (Math.abs(width - combo.strokeWidth) > 0.01) {
          say(`stroke-width painted ${width}, declared strokeWidth=${combo.strokeWidth}`);
        }
        // A line with no stroke colour is an invisible line.
        const stroke = getComputedStyle(line).stroke;
        if (stroke === 'none' || stroke === 'rgba(0, 0, 0, 0)') {
          say(`the line's stroke is "${stroke}" — nothing would be painted`);
        }
      }
      const wantsArea = combo.type === 'area' || combo.showArea;
      if (wantsArea && !area) say('an area fill was asked for and none was drawn');
      if (!wantsArea && area) say('an area fill was drawn without type="area" or show-area');
      if (area) {
        const fill = getComputedStyle(area).fill;
        if (fill === 'none' || fill === 'rgba(0, 0, 0, 0)') {
          say(`the area's fill is "${fill}" — nothing would be painted`);
        }
      }
    }

    if (combo.showDots && combo.type !== 'bar') {
      if (dots.length === 0) say('show-dots drew no dots');
      for (const [i, dot] of dots.entries()) {
        const r = parseFloat((dot as any).getAttribute('r') ?? '0');
        if (r <= 0) say(`dot ${i} has radius ${r}`);
      }
    } else if (dots.length > 0 && !combo.showDots) {
      say(`${dots.length} dots were drawn without show-dots`);
    }

    // ── customColor overrides color ────────────────────────────────────────
    if (combo.customColor) {
      const painted = combo.type === 'bar'
        ? (bars[0] ? getComputedStyle(bars[0]).fill : null)
        : (line ? getComputedStyle(line).stroke : null);
      if (!painted) {
        say('customColor combo has no mark to read a colour from');
      } else if (painted === 'none' || painted === 'rgba(0, 0, 0, 0)') {
        say(`customColor painted "${painted}"`);
      }
    }

    return problems;
  }, combo);
}

const combos = generateCombos();

test.describe('sparkline visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      const mounted = await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      if (combo.type === 'bar') {
        expect(mounted.bars, `combo ${combo.id} drew no bars`).toBeGreaterThan(0);
      } else {
        expect(mounted.hasLine, `combo ${combo.id} drew no line`).toBe(true);
      }
      const problems = await visualProblems(combo);
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

test.describe('sparkline visual matrix: the empty and degenerate series', () => {
  test('data=[] renders an empty chart at its declared box and no marks', async () => {
    const mounted = await page.evaluate(() => (window as any).matrix.mount({
      dataset: 'empty', type: 'line', color: 'primary',
    }));
    expect(mounted.bars).toBe(0);
    expect(mounted.dots).toBe(0);
    const box = await page.evaluate(() => {
      const svg = document.getElementById('subject')!.shadowRoot!
        .querySelector('[part~="svg"]')!;
      return {
        rect: svg.getBoundingClientRect().toJSON(),
        label: svg.getAttribute('aria-label'),
      };
    });
    expect(box.rect.width).toBeCloseTo(100, 0);
    expect(box.rect.height).toBeCloseTo(30, 0);
    expect(box.label, 'an empty sparkline is still announced').toBeTruthy();
  });

  test('a one-point series draws its line at the box it declares, with no extent', async () => {
    // Recorded, not claimed: the docs describe no rendering for a single
    // value, and a line through one vertex has nowhere to go. This test exists
    // so the behaviour is pinned — if a future version starts drawing a dot or
    // a flat rule for one point, this is where that shows up.
    await page.evaluate(() => (window as any).matrix.mount({
      dataset: 'single', type: 'line', color: 'primary',
    }));
    const shape = await page.evaluate(() => {
      const sr = document.getElementById('subject')!.shadowRoot!;
      const svg = sr.querySelector('[part~="svg"]')!;
      const line = sr.querySelector('[part~="line"]');
      // The degenerate line is judged on its OWN geometry attribute — the
      // DOM tier's convention (tests/matrix/sparkline/sparkline-utils.ts) —
      // because the LAYOUT box of a zero-extent mark is engine-specific:
      // Chromium reports the geometry box (0x0) while Firefox reports the
      // stroke extents (~strokeWidth wide), so a getBoundingClientRect width
      // is noise about the engine, not a fact about what was drawn. One
      // vertex in the attribute cannot span horizontally in ANY engine.
      const points = (line?.getAttribute('points') ?? '').trim();
      const vertices = points ? points.split(/\s+/) : [];
      const [x, y] = (vertices[0] ?? '').split(',').map(Number);
      return {
        svg: svg.getBoundingClientRect().toJSON(),
        hasLine: !!line,
        vertexCount: vertices.length,
        x, y,
      };
    });
    expect(shape.svg.width, 'the declared box survives a degenerate series').toBeCloseTo(100, 0);
    expect(shape.svg.height).toBeCloseTo(30, 0);
    expect(shape.hasLine, 'a one-point series still emits a line mark').toBe(true);
    expect(shape.vertexCount,
      'a line through one vertex has no horizontal extent').toBe(1);
    expect(Number.isFinite(shape.x) && Number.isFinite(shape.y),
      `the one-point vertex is "${shape.x},${shape.y}", not a place`).toBe(true);
    expect(shape.x, 'the single vertex is drawn inside the box the svg declares')
      .toBeGreaterThanOrEqual(0);
    expect(shape.x).toBeLessThanOrEqual(100);
    expect(shape.y).toBeGreaterThanOrEqual(0);
    expect(shape.y).toBeLessThanOrEqual(30);
  });

  test('a flat series still paints a line inside the box', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      dataset: 'flat', type: 'line', color: 'primary', showDots: true,
    }));
    expect(await visualProblems({
      id: 'flat', type: 'line', color: 'primary', dataset: 'flat',
      showDots: true, showArea: false, smooth: false,
      width: 100, height: 30, strokeWidth: 2,
    })).toEqual([]);
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────

test.describe('sparkline visual matrix: marquee pixels', () => {
  test('the line is really painted, in ink the surface does not share', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      dataset: 'rising', type: 'line', color: 'primary', strokeWidth: 3,
      width: 200, height: 60,
    }));
    // Scan the column above/below the first vertex: a stroke that is drawn but
    // transparent, or drawn off-box, leaves the whole column reading surface.
    const scan = await capture(
      page, '#subject', 'sparkline-line',
      `(host) => {
        const svg = host.shadowRoot.querySelector('[part~="svg"]');
        const b = svg.getBoundingClientRect();
        const points = [];
        for (let y = Math.round(b.top) + 1; y < Math.round(b.bottom) - 1; y++) {
          points.push({ x: b.left + b.width / 2, y });
        }
        points.push({ x: b.left + 1, y: b.top + 1 });
        return points;
      }`,
    );
    const corner = scan[scan.length - 1];
    const column = scan.slice(0, -1);
    const inked = column.filter(px => !sameColor(px, corner));
    expect(inked.length,
      `the whole column through the chart painted ${corner.join(',')} — no line was drawn`)
      .toBeGreaterThan(0);
    const best = inked.map(px => contrast(px, corner)).reduce((hi, v) => Math.max(hi, v), 0);
    expect(best, `the line's best contrast against the chart background is ${best.toFixed(2)}:1`)
      .toBeGreaterThan(1.5);
  });

  test('the five documented colours paint five distinguishable bar charts', async () => {
    const painted: string[] = [];
    for (const color of COLORS) {
      await page.evaluate(c => (window as any).matrix.mount({
        dataset: 'rising', type: 'bar', color: c, width: 200, height: 60,
      }), color);
      const [px] = await capture(
        page, '#subject', `sparkline-color-${color}`,
        `(host) => {
          const bars = [...host.shadowRoot.querySelectorAll('[part~="bar"]')];
          const b = bars[bars.length - 1].getBoundingClientRect();
          return [{ x: b.x + b.width / 2, y: b.bottom - 3 }];
        }`,
      );
      painted.push(px.join(','));
    }
    expect(new Set(painted).size,
      `the five documented colours painted ${new Set(painted).size} distinct fills`
      + ` (${painted.join(' | ')})`).toBe(COLORS.length);
  });

  test('customColor really overrides the color enumeration', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      dataset: 'rising', type: 'bar', color: 'success', customColor: '#9333ea',
      width: 200, height: 60,
    }));
    const [custom] = await capture(
      page, '#subject', 'sparkline-custom-color',
      `(host) => {
        const bars = [...host.shadowRoot.querySelectorAll('[part~="bar"]')];
        const b = bars[bars.length - 1].getBoundingClientRect();
        return [{ x: b.x + b.width / 2, y: b.bottom - 3 }];
      }`,
    );
    await page.evaluate(() => (window as any).matrix.mount({
      dataset: 'rising', type: 'bar', color: 'success', width: 200, height: 60,
    }));
    const [enumerated] = await capture(
      page, '#subject', 'sparkline-enum-color',
      `(host) => {
        const bars = [...host.shadowRoot.querySelectorAll('[part~="bar"]')];
        const b = bars[bars.length - 1].getBoundingClientRect();
        return [{ x: b.x + b.width / 2, y: b.bottom - 3 }];
      }`,
    );
    expect(sameColor(custom, enumerated),
      `custom-color="#9333ea" painted ${custom.join(',')}, the same as color="success"`
      + ' — the documented override did not win').toBe(false);
    // #9333ea is rgb(147, 51, 234); the painted pixel must be that ink, not a
    // blend of it with something else.
    expect(custom, `custom-color painted ${custom.join(',')}, not #9333ea`)
      .toEqual([147, 51, 234]);
  });

  test('show-area paints a fill under the line that the plain line does not', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      dataset: 'rising', type: 'line', color: 'primary', showArea: true,
      width: 200, height: 60,
    }));
    // Scan the lower half of a column under the series rather than pinning one
    // y: the fill stops at the chart's internal stroke padding, and the exact
    // inset is implementation the docs do not describe. The claim under test is
    // "the region under the line is inked at all", so the two charts are
    // compared column against column.
    const probe = `(host) => {
      const svg = host.shadowRoot.querySelector('[part~="svg"]');
      const b = svg.getBoundingClientRect();
      const points = [];
      for (let y = Math.round(b.top + b.height / 2); y < Math.round(b.bottom) - 1; y++) {
        points.push({ x: b.left + b.width * 0.8, y });
      }
      return points;
    }`;
    const filled = await capture(page, '#subject', 'sparkline-area', probe);
    await page.evaluate(() => (window as any).matrix.mount({
      dataset: 'rising', type: 'line', color: 'primary', width: 200, height: 60,
    }));
    const bare = await capture(page, '#subject', 'sparkline-no-area', probe);
    const differing = filled.filter((px, i) => !sameColor(px, bare[i]));
    expect(differing.length,
      `every pixel under the line painted the same with and without show-area`
      + ` (${bare[0].join(',')}) — the area fill is missing`).toBeGreaterThan(0);
  });

  test('show-dots paints a mark at a vertex the plain line leaves bare', async () => {
    // A dot is drawn as a surface-filled circle with a coloured STROKE (see
    // `.sparkline__dot { fill: var(--snice-color-surface) }`), so its centre is
    // deliberately the same colour as the background. The ring is the mark, and
    // the ring is what is probed — scanning across the dot's box so a
    // sub-pixel ring is not missed.
    const probe = `(host) => {
      const svg = host.shadowRoot.querySelector('[part~="svg"]');
      const dot = svg.querySelector('[part~="dot"]');
      const b = (dot ?? svg).getBoundingClientRect();
      const points = [];
      for (let x = Math.round(b.left); x <= Math.round(b.right); x++) {
        points.push({ x, y: b.y + b.height / 2 });
      }
      return points;
    }`;
    await page.evaluate(() => (window as any).matrix.mount({
      dataset: 'rising', type: 'line', color: 'danger', showDots: true,
      strokeWidth: 4, width: 200, height: 60,
    }));
    const dotScan = await capture(page, '#subject', 'sparkline-dots', probe);
    const [surfacePx] = await capture(
      page, '#subject', 'sparkline-dots-surface',
      `(host) => {
        const svg = host.shadowRoot.querySelector('[part~="svg"]');
        const b = svg.getBoundingClientRect();
        return [{ x: b.left + 2, y: b.top + 2 }];
      }`,
    );
    const ring = dotScan.filter(px => !sameColor(px, surfacePx));
    expect(ring.length,
      `every pixel across the dot painted ${surfacePx.join(',')}, the same as the empty`
      + ' corner — show-dots drew nothing').toBeGreaterThan(0);
  });
});
