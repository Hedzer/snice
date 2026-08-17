/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-qr-code TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/qr-code, `npm run test:matrix`) owns the
 * SVG-mode structure and the canvas-mode mounting contract: a canvas is what
 * `renderMode='canvas'` puts in the container, `toSVGString()` is empty
 * there and full in SVG mode, and the symbol-grid arithmetic holds. It
 * cannot own the component's subject at all, because a QR code IS pixels:
 * happy-dom's 2D context is null and its canvases stay blank whatever the
 * component does.
 *
 * ── Layer 1 (every combo): the documented size contract, as boxes ──────────
 *   · `size: number = 200` is the box the code is painted into: the canvas
 *     mode mounts exactly one canvas whose BITMAP is size x size and whose
 *     rendered box is size x size, wrapped by a host that is itself size x
 *     size;
 *   · the SVG mode mounts exactly one svg and no canvas, its viewBox is
 *     square (a QR symbol is square), and its rendered box is square;
 *   · the container paints the documented `--qr-bg` default (pure white);
 *   · the painted code is reachable by a pointer (nothing covers a QR).
 *
 * ── Layer 2 (a pinned handful): decode the pixels the browser painted ──────
 *   A QR that paints nothing is still a size x size canvas, so layer 1 can
 *   pass on a blank white bitmap. The marquee captures decode the paint:
 *     · a real QR is NON-UNIFORM — dark and light modules both present, in
 *       exactly the documented `fgColor` / `bgColor` literals;
 *     · the quiet zone is a quiet zone: the outer `margin` band of the box
 *       paints the light colour only (margin 4 and margin 12), the documented
 *       error-correction/quiet-zone contract a scanner relies on;
 *     · `dotStyle` still paints a code (dots leave light between them —
 *       that is the style, not a blank);
 *     · `centerText` really paints over the centre of the code, and the code
 *       still has both module colours underneath the overlay;
 *     · the SVG mode paints too — a `<use>` tree that never rendered would
 *       screenshot as an empty white box.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, luminance, sameColor, type RGB } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/qr-code/matrix.html';

const RENDER_MODES = ['canvas', 'svg'] as const;
const DOT_STYLES = ['square', 'rounded', 'dots'] as const;
type RenderMode = typeof RENDER_MODES[number];
type DotStyle = typeof DOT_STYLES[number];

interface Combo {
  id: string;
  renderMode: RenderMode;
  dotStyle: DotStyle;
  size: number;
}

const base = (over: Partial<Combo>): Combo => ({
  id: '', renderMode: 'canvas', dotStyle: 'square', size: 200, ...over,
});

/** renderMode (2) x dotStyle (3), plus the size axis as explicit combos. */
function combos(): Combo[] {
  return [
    ...RENDER_MODES.flatMap(renderMode => DOT_STYLES.map(dotStyle => base({
      id: `${renderMode}/${dotStyle}`,
      renderMode, dotStyle,
    }))),
    base({ id: 'canvas/size=120', size: 120 }),
    base({ id: 'canvas/size=280', size: 280 }),
  ];
}

let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(FIXTURE);
  await page.waitForFunction(() => document.documentElement.dataset.matrixReady === 'true');
});
test.afterAll(async () => { await page?.close(); });

/**
 * LAYER 1. One evaluate per combo, returning EVERY violation at once.
 */
async function visualProblems(combo: Combo): Promise<string[]> {
  return page.evaluate((combo) => {
    const problems: string[] = [];
    const say = (m: string) => problems.push(m);
    const EPS = 0.6;
    const round = (n: number) => n.toFixed(1);

    const host = document.getElementById('subject') as HTMLElement | null;
    if (!host) { say('nothing mounted'); return problems; }
    const sr = host.shadowRoot;
    if (!sr) { say('no shadow root'); return problems; }

    const container = sr.querySelector('[part~="base"]') as HTMLElement | null;
    if (!container) { say('no part="base" painted'); return problems; }
    const containerStyle = getComputedStyle(container);

    // "--qr-bg - Container background (hsl(0 0% 100%))" — the documented
    // default, resolved.
    if (containerStyle.backgroundColor !== 'rgb(255, 255, 255)') {
      say(`container background "${containerStyle.backgroundColor}",`
        + ' expected the documented --qr-bg default of pure white');
    }

    const canvas = sr.querySelector('canvas') as HTMLCanvasElement | null;
    const svg = sr.querySelector('svg') as SVGSVGElement | null;

    if (combo.renderMode === 'canvas') {
      if (!canvas) { say('canvas mode painted no canvas'); return problems; }
      if (svg) say('canvas mode also painted an svg');

      // The documented size contract, at the bitmap and at the box.
      if (canvas.width !== combo.size || canvas.height !== combo.size) {
        say(`canvas bitmap is ${canvas.width}x${canvas.height},`
          + ` expected the documented size of ${combo.size}x${combo.size}`);
      }
      const box = canvas.getBoundingClientRect();
      if (Math.abs(box.width - combo.size) > EPS || Math.abs(box.height - combo.size) > EPS) {
        say(`canvas renders at ${round(box.width)}x${round(box.height)},`
          + ` expected ${combo.size}x${combo.size}`);
      }
      const hostBox = host.getBoundingClientRect();
      if (Math.abs(hostBox.width - combo.size) > EPS || Math.abs(hostBox.height - combo.size) > EPS) {
        say(`the host renders at ${round(hostBox.width)}x${round(hostBox.height)},`
          + ` expected it to wrap the ${combo.size}px code`);
      }

      // A QR exists to be scanned: nothing may paint over it.
      const hit = document.elementFromPoint(
        hostBox.left + hostBox.width / 2, hostBox.top + hostBox.height / 2);
      if (hit !== host) {
        say(`the code's centre hit-test finds <${hit?.tagName.toLowerCase() ?? 'nothing'}>,`
          + ' not the QR');
      }
    } else {
      if (!svg) { say('svg mode painted no svg'); return problems; }
      if (canvas) say('svg mode also painted a canvas');

      // A QR symbol is square: the viewBox is the module grid plus the
      // margin ring, both square.
      const vb = (svg.getAttribute('viewBox') ?? '').split(/\s+/).map(Number);
      if (vb.length !== 4 || Number.isNaN(vb[2]) || vb[2] !== vb[3]) {
        say(`viewBox "${svg.getAttribute('viewBox')}" is not square`);
      }
      const box = svg.getBoundingClientRect();
      if (box.width <= 0 || box.height <= 0) {
        say(`the svg renders at ${round(box.width)}x${round(box.height)}`);
      } else if (Math.abs(box.width - box.height) > EPS) {
        say(`the svg renders ${round(box.width)}x${round(box.height)} — a QR is square`);
      }
    }

    return problems;
  }, combo as any);
}

test.describe('qr-code visual matrix: layer 1 — the documented size contract', () => {
  for (const combo of combos()) {
    test(combo.id, async () => {
      const mounted = await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      expect(mounted.renderMode, `property reflection for ${combo.id}`).toBe(combo.renderMode);
      expect(mounted.dotStyle, `property reflection for ${combo.id}`).toBe(combo.dotStyle);
      expect(mounted.size, `property reflection for ${combo.id}`).toBe(combo.size);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

test.describe('qr-code visual matrix: the size and value are reactive geometry', () => {
  test('a later setSize() rebuilds the box, and a new value repaints it', async () => {
    await page.evaluate(() => (window as any).matrix.mount({ size: 160 }));
    await page.evaluate(() => (window as any).matrix.setSize(240));
    const geometry = await page.evaluate(() => {
      const canvas = document.getElementById('subject')!.shadowRoot!
        .querySelector('canvas')!;
      return { bitmap: canvas.width, box: canvas.getBoundingClientRect().width };
    });
    expect(geometry.bitmap, 'the bitmap did not follow the new size').toBe(240);
    expect(geometry.box, 'the rendered box did not follow the new size').toBeCloseTo(240, 0);

    // A different payload encodes different modules; read straight from the
    // canvas context (computed paint, not a screenshot) and require the
    // bitmap to have changed.
    const repainted = await page.evaluate(async () => {
      const canvas = () => document.getElementById('subject')!.shadowRoot!
        .querySelector('canvas') as HTMLCanvasElement;
      const before = canvas().toDataURL();
      await (window as any).matrix.setValue('https://example.com/different');
      const after = canvas().toDataURL();
      return { changed: before !== after, value: (window as any).matrix.el.value };
    });
    expect(repainted.value).toBe('https://example.com/different');
    expect(repainted.changed, 'a new value painted an identical bitmap').toBe(true);
  });
});

// ── LAYER 2: decode the painted pixels ──────────────────────────────────────
//
// Grid probes sample the code's interior (inside the margin band); band
// probes walk the outer ring of edges. `capture` reads each 1x1 through the
// browser that painted it.

/** A grid of points over the code's interior, clear of the quiet band. */
const GRID_PROBE = (margin: number) => `(host) => {
  const canvas = host.shadowRoot.querySelector('canvas') || host.shadowRoot.querySelector('svg');
  const box = canvas.getBoundingClientRect();
  const from = ${margin} + 2, to = box.width - ${margin} - 2, steps = 16;
  const points = [];
  for (let r = 0; r <= steps; r++) {
    for (let c = 0; c <= steps; c++) {
      points.push({ x: box.x + from + ((to - from) * c) / steps, y: box.y + from + ((to - from) * r) / steps });
    }
  }
  return points;
}`;

/** Points along all four edges, all within `depth` px of the border. */
const BAND_PROBE = (depth: number) => `(host) => {
  const canvas = host.shadowRoot.querySelector('canvas') || host.shadowRoot.querySelector('svg');
  const box = canvas.getBoundingClientRect();
  const offsets = [];
  for (let o = 1; o < ${depth}; o += 2) offsets.push(o);
  const points = [];
  for (const o of offsets) {
    points.push({ x: box.x + box.width / 2, y: box.y + o });
    points.push({ x: box.x + box.width / 2, y: box.y + box.height - o });
    points.push({ x: box.x + o, y: box.y + box.height / 2 });
    points.push({ x: box.x + box.width - o, y: box.y + box.height / 2 });
  }
  return points;
}`;

/** The most frequent colour among samples — the mode is the solid module. */
function mode(pixels: RGB[]): RGB {
  const counts = new Map<string, number>();
  for (const p of pixels) counts.set(p.join(','), (counts.get(p.join(',')) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0]
    .split(',').map(Number) as RGB;
}

/**
 * The two module colours: the two most frequent distinct samples, ordered
 * dark-first by luminance. The statistical mode alone cannot name the dark
 * colour — a real QR's light modules (plus the quiet band's edge samples)
 * usually OUTNUMBER the dark ones, so the mode resolves to the light
 * literal. A blank bitmap yields one colour: dark === light, and the
 * literal assertions below fail it.
 */
function moduleColours(pixels: RGB[]): { dark: RGB; light: RGB } {
  const counts = new Map<string, number>();
  for (const p of pixels) counts.set(p.join(','), (counts.get(p.join(',')) ?? 0) + 1);
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2)
    .map(([k]) => k.split(',').map(Number) as RGB);
  if (top.length < 2) return { dark: top[0], light: top[0] };
  return luminance(top[0]) <= luminance(top[1])
    ? { dark: top[0], light: top[1] }
    : { dark: top[1], light: top[0] };
}

test.describe('qr-code visual matrix: marquee pixels', () => {
  test('a default QR paints a real code: both module colours, exactly the documented literals', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      value: 'https://example.com', // the doc's own example payload
    }));
    const grid = await capture(page, '#subject', 'qr-default-grid', GRID_PROBE(4));
    const { dark, light } = moduleColours(grid as RGB[]);
    expect(dark, `the dark module colour is ${dark.join(',')},`
      + ' expected the documented fgColor default #000000').toEqual([0, 0, 0]);
    expect(light, `the light module colour is ${light.join(',')},`
      + ' expected the documented bgColor default #ffffff').toEqual([255, 255, 255]);
    const darkCount = grid.filter(p => sameColor(p, dark)).length;
    const lightCount = grid.filter(p => sameColor(p, light)).length;
    // A real QR interleaves both; a blank or solid bitmap is not a code.
    expect(darkCount / grid.length, 'dark module share of the samples').toBeGreaterThan(0.1);
    expect(lightCount / grid.length, 'light module share of the samples').toBeGreaterThan(0.1);

    const band = await capture(page, '#subject', 'qr-default-band', BAND_PROBE(4));
    for (const p of band) {
      expect(sameColor(p as RGB, [255, 255, 255]),
        `the quiet zone painted ${p.join(',')} — a scanner keys off this band`).toBe(true);
    }
  });

  test('the quiet zone scales with margin — a 12px ring stays pure background', async () => {
    await page.evaluate(() => (window as any).matrix.mount({ margin: 12 }));
    const band = await capture(page, '#subject', 'qr-margin-12-band', BAND_PROBE(12));
    for (const p of band) {
      expect(sameColor(p as RGB, [255, 255, 255]),
        `inside the 12px quiet ring the paint was ${p.join(',')}`).toBe(true);
    }
    const grid = await capture(page, '#subject', 'qr-margin-12-grid', GRID_PROBE(12));
    const white = grid.filter(p => sameColor(p as RGB, [255, 255, 255])).length;
    expect(grid.length - white,
      'the code interior is entirely white — nothing was painted').toBeGreaterThan(20);
  });

  test('custom fg/bg colours paint as the documented literals they are', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      fgColor: '#2196f3', // the doc's own custom-colour example
      bgColor: '#ffff00',
    }));
    const grid = await capture(page, '#subject', 'qr-custom-colours', GRID_PROBE(4));
    const { dark, light } = moduleColours(grid as RGB[]);
    expect(dark, `the dark module colour is ${dark.join(',')}, expected #2196f3`)
      .toEqual([33, 150, 243]);
    expect(light, `the light module colour is ${light.join(',')}, expected #ffff00`)
      .toEqual([255, 255, 0]);

    const band = await capture(page, '#subject', 'qr-custom-band', BAND_PROBE(4));
    for (const p of band) {
      expect(sameColor(p as RGB, [255, 255, 0]),
        `the quiet zone painted ${p.join(',')} instead of the custom bg`).toBe(true);
    }
  });

  test('dotStyle=dots still paints a code — circles, not a blank', async () => {
    await page.evaluate(() => (window as any).matrix.mount({ dotStyle: 'dots' }));
    const grid = await capture(page, '#subject', 'qr-dots', GRID_PROBE(4));
    // Dots are circles of radius module/2.2, so most samples landing on dark
    // modules read as blended greys, and "the" dark module colour cannot be
    // read off the top-two sample frequencies the way square modules allow:
    // WebKit runs this tier at deviceScaleFactor 2, whose compositor upscale
    // softens every dot edge until the second-most-frequent sample is an
    // antialias grey (254) rather than the black the code plainly paints.
    // Assert the literals on the samples' EXTREMES — the darkest sample must
    // be the documented fgColor default, the lightest its bgColor — and judge
    // the blank-canvas question by how many samples are not the light
    // literal. A blank bitmap fails all three exactly as hard.
    const darkest = (grid as RGB[]).reduce((a, p) => luminance(p) < luminance(a) ? p : a);
    const lightest = (grid as RGB[]).reduce((a, p) => luminance(p) > luminance(a) ? p : a);
    expect(darkest, `the darkest sample is ${darkest.join(',')}, expected the documented #000000 fg`).toEqual([0, 0, 0]);
    expect(lightest, `the lightest sample is ${lightest.join(',')}, expected the documented #ffffff bg`).toEqual([255, 255, 255]);
    const onCode = (grid as RGB[]).filter(p => !sameColor(p, lightest)).length;
    expect(onCode / grid.length,
      'dots leave light BETWEEN them; a sample share this low is a blank canvas')
      .toBeGreaterThan(0.1);
    expect((grid.length - onCode) / grid.length,
      'a dots code still has light background between the dots').toBeGreaterThan(0.1);
  });

  test('centerText paints over the code, and the code survives it', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      errorCorrectionLevel: 'H', // the documented overlay pairing
    }));
    const plain = await capture(
      page, '#subject', 'qr-center-plain',
      `(host) => {
        const canvas = host.shadowRoot.querySelector('canvas');
        const box = canvas.getBoundingClientRect();
        const points = [];
        for (let r = -2; r <= 2; r++) {
          for (let c = -2; c <= 2; c++) {
            points.push({ x: box.x + box.width / 2 + c * 8, y: box.y + box.height / 2 + r * 8 });
          }
        }
        return points;
      }`,
    );
    await page.evaluate(() => (window as any).matrix.mount({
      errorCorrectionLevel: 'H', centerText: 'SCAN',
    }));
    const withText = await capture(
      page, '#subject', 'qr-center-text',
      `(host) => {
        const canvas = host.shadowRoot.querySelector('canvas');
        const box = canvas.getBoundingClientRect();
        const points = [];
        for (let r = -2; r <= 2; r++) {
          for (let c = -2; c <= 2; c++) {
            points.push({ x: box.x + box.width / 2 + c * 8, y: box.y + box.height / 2 + r * 8 });
          }
        }
        return points;
      }`,
    );
    const differs = withText.some((p, i) => !sameColor(p as RGB, plain[i] as RGB));
    expect(differs,
      'the centre of the code is pixel-identical with and without centerText'
        + ' — the overlay painted nothing').toBe(true);

    // Error correction exists so the code under the overlay stays a code. The
    // two module literals are asserted on the samples' extremes rather than
    // their frequencies: whether the statistical mode is the light or the
    // dark literal depends on sampling phase and (on WebKit, which runs this
    // tier at deviceScaleFactor 2) on the compositor's upscale softening —
    // neither of which is anything the component painted.
    const grid = await capture(page, '#subject', 'qr-center-grid', GRID_PROBE(4));
    const darkest = (grid as RGB[]).reduce((a, p) => luminance(p) < luminance(a) ? p : a);
    const lightest = (grid as RGB[]).reduce((a, p) => luminance(p) > luminance(a) ? p : a);
    expect(sameColor(darkest, [0, 0, 0]), `the darkest sample is ${darkest.join(',')}`).toBe(true);
    expect(sameColor(lightest, [255, 255, 255]), `the lightest sample is ${lightest.join(',')}`).toBe(true);
  });

  test('the SVG mode paints a real code too', async () => {
    await page.evaluate(() => (window as any).matrix.mount({ renderMode: 'svg' }));
    const grid = await capture(page, '#subject', 'qr-svg-grid', GRID_PROBE(4));
    const { dark } = moduleColours(grid as RGB[]);
    expect(dark, `the dark module colour is ${dark.join(',')}`).toEqual([0, 0, 0]);
    const darkCount = grid.filter(p => sameColor(p, dark)).length;
    expect(darkCount / grid.length,
      'the svg painted no dark modules — an empty white box').toBeGreaterThan(0.1);

    const band = await capture(page, '#subject', 'qr-svg-band', BAND_PROBE(4));
    for (const p of band) {
      expect(sameColor(p as RGB, [255, 255, 255]),
        `the svg quiet zone painted ${p.join(',')}`).toBe(true);
    }
  });
});
