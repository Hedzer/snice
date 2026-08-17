/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-color-display TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/color-display, `npm run test:matrix`) owns
 * structure truth: which parts exist, what the label reads in each notation,
 * which size class the swatch carries. It cannot own visual truth, because
 * happy-dom performs no layout and paints nothing — every box reads 0.
 *
 * snice-color-display is PURELY PRESENTATIONAL, so per .ai/fuzzing.md its
 * visual matrix is deliberately MINIMAL — 27 layer-1 combos, not the table's
 * hundreds. It is also the tier that matters most for this component, because
 * the component's whole reason to exist is that a reader can SEE the colour:
 *
 *   · `swatch-size` produces no DOM difference a value assertion can grade —
 *     small, medium and large are three CSS rules over the same markup, and a
 *     browser is the only place they can be told apart or ordered;
 *   · the swatch's job is to paint EXACTLY the authored colour. A component
 *     that dropped the inline style, or let its border-radius eat the fill,
 *     still passes every DOM assertion.
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   · the host is the documented `inline-block` and the container an
 *     `inline-flex` row with its two children vertically centred;
 *   · the swatch is a real, square, non-zero box that grows strictly with
 *     `swatch-size`, and carries the documented `--snice-color-border` rule;
 *   · the swatch's computed background is EXACTLY the authored `value`,
 *     resolved through the browser's own colour parser;
 *   · the label sits to the RIGHT of the swatch, never overlapping it, in the
 *     documented monospace family and `--snice-color-text` colour;
 *   · hiding a block removes its box entirely — `show-swatch="false"` leaves
 *     the label starting at the container's own left edge;
 *   · neither block is occluded (elementFromPoint through the shadow root).
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   "The swatch has a background-color" and "the swatch paints that colour"
 *   are different claims. The marquee captures decode the PNG inside the
 *   browser under test and assert the swatch's centre pixel IS the authored
 *   colour, that two different values paint two different pixels, and that the
 *   label is readable against the page it sits on.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, contrast, sameColor, type RGB } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/color-display/matrix.html';

type SwatchSize = 'small' | 'medium' | 'large';
type Format = 'hex' | 'rgb' | 'hsl';
type Visibility = 'both' | 'swatch-only' | 'label-only';

interface Combo {
  id: string;
  value: string;
  format: Format;
  swatchSize: SwatchSize;
  visibility: Visibility;
  showSwatch: boolean;
  showLabel: boolean;
}

/**
 * The cross: swatch size (3) x visibility (3) x colour+notation (3) = 27.
 *
 * Colour and notation are paired rather than crossed because the notation only
 * changes the label's STRING, and the DOM matrix already grades every string;
 * what this tier needs from `format` is that a longer label still lays out
 * beside the swatch rather than under or through it.
 */
const PAIRS: Array<{ value: string; format: Format }> = [
  { value: '#3b82f6', format: 'hex' },
  { value: '#10b981', format: 'rgb' },
  { value: '#808080', format: 'hsl' },
];

function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  for (const swatchSize of ['small', 'medium', 'large'] as SwatchSize[]) {
    for (const visibility of ['both', 'swatch-only', 'label-only'] as Visibility[]) {
      for (const pair of PAIRS) {
        combos.push({
          id: `${pair.value}/${pair.format}/${swatchSize}/${visibility}`,
          value: pair.value,
          format: pair.format,
          swatchSize,
          visibility,
          showSwatch: visibility !== 'label-only',
          showLabel: visibility !== 'swatch-only',
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

/**
 * LAYER 1. One evaluate per combo, returning every violation at once so a
 * failing combo reports its whole story rather than one problem per re-run.
 */
async function visualProblems(combo: Combo): Promise<string[]> {
  return page.evaluate((combo) => {
    const problems: string[] = [];
    const say = (m: string) => problems.push(m);
    const EPS = 1.5;
    const matrix = (window as any).matrix;

    const host = document.getElementById('subject') as HTMLElement | null;
    if (!host) { say('nothing mounted'); return problems; }
    const sr = host.shadowRoot;
    if (!sr) { say('no shadow root'); return problems; }

    const rect = (el: Element) => el.getBoundingClientRect();
    const partNamed = (name: string) =>
      [...sr.querySelectorAll('[part]')].find(node =>
        (node.getAttribute('part') ?? '').split(/\s+/).includes(name)) as HTMLElement | undefined;

    const hostCs = getComputedStyle(host);
    if (hostCs.display !== 'inline-block') {
      say(`host computed display "${hostCs.display}", expected "inline-block"`);
    }
    if (hostCs.visibility !== 'visible') say(`host visibility "${hostCs.visibility}"`);

    const container = partNamed('container');
    if (!container) { say('no part="container" rendered'); return problems; }
    const containerBox = rect(container);
    const containerCs = getComputedStyle(container);
    if (containerCs.display !== 'inline-flex') {
      say(`container display "${containerCs.display}", expected "inline-flex"`);
    }
    if (containerCs.alignItems !== 'center') {
      say(`container align-items "${containerCs.alignItems}", expected "center"`);
    }
    if (containerBox.height <= 0) say(`container renders at height ${containerBox.height}`);

    const swatch = partNamed('swatch');
    const label = partNamed('label');

    // ── The blocks the flags promise, and no others ─────────────────────────
    if (combo.showSwatch && !swatch) say('show-swatch is true but no part="swatch" was painted');
    if (!combo.showSwatch && swatch) say('show-swatch is false but a swatch was painted');
    if (combo.showLabel && !label) say('show-label is true but no part="label" was painted');
    if (!combo.showLabel && label) say('show-label is false but a label was painted');

    let swatchBox: DOMRect | null = null;
    if (combo.showSwatch && swatch) {
      swatchBox = rect(swatch);
      const swatchCs = getComputedStyle(swatch);
      if (swatchBox.width <= 0 || swatchBox.height <= 0) {
        say(`swatch renders at ${swatchBox.width}x${swatchBox.height}`);
      }
      if (Math.abs(swatchBox.width - swatchBox.height) > 1) {
        say(`swatch is not square: ${swatchBox.width.toFixed(1)}x${swatchBox.height.toFixed(1)}`);
      }

      // The documented paint: the swatch shows EXACTLY the authored colour.
      // Both sides are resolved by the browser's own parser, so `#3b82f6` and
      // `rgb(59, 130, 246)` compare equal rather than differing on spelling.
      const wanted = matrix.resolve(combo.value);
      if (swatchCs.backgroundColor !== wanted) {
        say(`swatch painted "${swatchCs.backgroundColor}", expected value "${combo.value}" = "${wanted}"`);
      }

      // The documented border token, and a rule wide enough to see.
      const border = matrix.token('--snice-color-border');
      if (parseFloat(swatchCs.borderTopWidth) <= 0) {
        say(`swatch has no border (border-top-width ${swatchCs.borderTopWidth})`);
      }
      if (swatchCs.borderTopColor !== border) {
        say(`swatch border "${swatchCs.borderTopColor}", expected --snice-color-border "${border}"`);
      }

      // A swatch that rounded itself away would have no fill left to read.
      if (parseFloat(swatchCs.borderTopLeftRadius) > swatchBox.width / 2 + 1) {
        say(`swatch border-radius ${swatchCs.borderTopLeftRadius} exceeds a`
          + ` ${swatchBox.width.toFixed(0)}px box`);
      }

      // The swatch never overflows the container it is laid out in.
      if (swatchBox.left < containerBox.left - EPS || swatchBox.right > containerBox.right + EPS) {
        say(`swatch (${swatchBox.left.toFixed(0)}…${swatchBox.right.toFixed(0)}) overflows the`
          + ` container (${containerBox.left.toFixed(0)}…${containerBox.right.toFixed(0)})`);
      }
    }

    if (combo.showLabel && label) {
      const labelBox = rect(label);
      const labelCs = getComputedStyle(label);
      if (labelBox.width <= 0 || labelBox.height <= 0) {
        say(`label renders at ${labelBox.width}x${labelBox.height}`);
      }
      if (parseFloat(labelCs.fontSize) < 8) say(`label font-size ${labelCs.fontSize}`);

      const text = matrix.token('--snice-color-text');
      if (labelCs.color !== text) {
        say(`label painted "${labelCs.color}", expected --snice-color-text "${text}"`);
      }
      // The documented monospace family — the label is a machine-readable
      // colour value, and the stylesheet says so.
      if (!/mono|courier/i.test(labelCs.fontFamily)) {
        say(`label font-family "${labelCs.fontFamily}" is not the documented monospace family`);
      }

      if (swatchBox) {
        // The documented order: swatch, then label, side by side.
        if (labelBox.left < swatchBox.right - EPS) {
          say(`label (left ${labelBox.left.toFixed(1)}) overlaps the swatch`
            + ` (right ${swatchBox.right.toFixed(1)})`);
        }
        // Centred on the same line, not stacked.
        const swatchMid = swatchBox.top + swatchBox.height / 2;
        const labelMid = labelBox.top + labelBox.height / 2;
        if (Math.abs(swatchMid - labelMid) > 2) {
          say(`swatch centre ${swatchMid.toFixed(1)} and label centre ${labelMid.toFixed(1)}`
            + ' are not on the same line');
        }
      } else {
        // With no swatch, the label starts at the container's own left edge —
        // a hidden block must take its GAP with it, not leave a hole.
        if (labelBox.left > containerBox.left + EPS) {
          say(`label starts ${(labelBox.left - containerBox.left).toFixed(1)}px inside the`
            + ' container although no swatch is painted');
        }
      }

      // ── Occlusion: nothing may paint over the label text ─────────────────
      const x = labelBox.left + Math.min(labelBox.width / 2, 12);
      const y = labelBox.top + labelBox.height / 2;
      const outer = document.elementFromPoint(x, y);
      if (outer !== host) {
        say(`label hit-test found <${outer?.tagName.toLowerCase() ?? 'nothing'}>,`
          + ' not the color-display');
      } else {
        const hit = (sr as any).elementFromPoint(x, y) as Element | null;
        if (hit !== label && !label.contains(hit as Node)) {
          say(`label is occluded by <${hit?.tagName.toLowerCase() ?? 'nothing'}>`);
        }
      }
    }

    return problems;
  }, combo);
}

const combos = generateCombos();

test.describe('color-display visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      const mounted = await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      expect(mounted.value).toBe(combo.value);
      expect(mounted.swatchSize).toBe(combo.swatchSize);
      // A non-default axis assigned as a PROPERTY must reach the attribute,
      // because `:host([swatch-size=…])` and consumer CSS see nothing else.
      // `medium`/`hex` are the documented defaults and defaults do not reflect.
      expect(mounted.reflectedSize).toBe(combo.swatchSize === 'medium' ? null : combo.swatchSize);
      expect(mounted.reflectedFormat).toBe(combo.format === 'hex' ? null : combo.format);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

/**
 * The size axis is an ORDERING claim, and no single combo can make it. Measured
 * once, across the three documented sizes, on one colour.
 */
test.describe('color-display visual matrix: the size axis is an ordering', () => {
  test('small < medium < large, each a square with a real box', async () => {
    const boxes: Record<string, { width: number; height: number }> = {};
    for (const swatchSize of ['small', 'medium', 'large'] as SwatchSize[]) {
      await page.evaluate(size => (window as any).matrix.mount({
        value: '#3b82f6', format: 'hex', swatchSize: size, showSwatch: true, showLabel: true,
      }), swatchSize);
      boxes[swatchSize] = await page.evaluate(() => {
        const host = document.getElementById('subject') as HTMLElement;
        const swatch = host.shadowRoot!.querySelector('[part~="swatch"]')!;
        const box = swatch.getBoundingClientRect();
        return { width: box.width, height: box.height };
      });
    }
    for (const [size, box] of Object.entries(boxes)) {
      expect(box.width, `${size} swatch width`).toBeGreaterThan(0);
      expect(Math.abs(box.width - box.height), `${size} swatch squareness`).toBeLessThanOrEqual(1);
    }
    expect(boxes.small.width, 'small < medium').toBeLessThan(boxes.medium.width);
    expect(boxes.medium.width, 'medium < large').toBeLessThan(boxes.large.width);
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────
//
// Small on purpose. A screenshot is two orders of magnitude more expensive than
// an evaluate, and layer 1 already measured the model the browser built. These
// exist because "the swatch has a background-color" and "the swatch shows this
// colour" are different claims, and only pixels can tell them apart.

test.describe('color-display visual matrix: marquee pixels', () => {
  test('the swatch paints exactly the authored colour', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      value: '#3b82f6', format: 'hex', swatchSize: 'large', showSwatch: true, showLabel: true,
    }));
    const [centre] = await capture(
      page, '#subject', 'color-display-swatch',
      `(host) => {
        const swatch = host.shadowRoot.querySelector('[part~="swatch"]');
        const b = swatch.getBoundingClientRect();
        return [{ x: b.x + b.width / 2, y: b.y + b.height / 2 }];
      }`,
    );
    // #3b82f6 = (59, 130, 246). A component that dropped the inline style would
    // paint the page surface here, not this triplet.
    expect(centre, `swatch centre painted ${centre.join(',')}`).toEqual([59, 130, 246]);
  });

  test('two different values paint two different swatches', async () => {
    const painted: RGB[] = [];
    for (const value of ['#ef4444', '#10b981']) {
      await page.evaluate(v => (window as any).matrix.mount({
        value: v, format: 'hex', swatchSize: 'large', showSwatch: true, showLabel: true,
      }), value);
      const [centre] = await capture(
        page, '#subject', `color-display-${value.slice(1)}`,
        `(host) => {
          const swatch = host.shadowRoot.querySelector('[part~="swatch"]');
          const b = swatch.getBoundingClientRect();
          return [{ x: b.x + b.width / 2, y: b.y + b.height / 2 }];
        }`,
      );
      painted.push(centre);
    }
    expect(sameColor(painted[0], painted[1]),
      `both values painted ${painted[0].join(',')}`).toBe(false);
  });

  test('the label is readable on the page it sits on', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      value: '#3b82f6', format: 'rgb', swatchSize: 'medium', showSwatch: false, showLabel: true,
    }));
    // Probe a run of points across the label's own line plus one point on the
    // page beside it. A label painted in the page's colour reads flat here.
    const pixels = await capture(
      page, 'body', 'color-display-label',
      `() => {
        const host = document.getElementById('subject');
        const label = host.shadowRoot.querySelector('[part~="label"]');
        const b = label.getBoundingClientRect();
        const points = [];
        for (let i = 1; i <= 14; i++) {
          points.push({ x: b.x + (b.width * i) / 16, y: b.y + b.height / 2 });
        }
        points.push({ x: b.x + b.width + 60, y: b.y + b.height / 2 });
        return points;
      }`,
    );
    const background = pixels[pixels.length - 1] as RGB;
    const glyphs = pixels.slice(0, -1) as RGB[];
    expect(glyphs.some(p => !sameColor(p, background)),
      `every probed label pixel equals the page ${background.join(',')}`).toBe(true);
    const best = Math.max(...glyphs.map(p => contrast(p, background)));
    // A monospace colour value is body copy on a plain surface; 3:1 is a
    // deliberately low bar for an antialiased glyph edge, but "antialiased" is
    // not "invisible".
    expect(best, `best label-vs-page contrast is ${best.toFixed(2)}:1`).toBeGreaterThan(3);
  });
});
