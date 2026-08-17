/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-gauge TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/gauge, `npm run test:matrix`) owns the
 * arithmetic: the dash offset for a value in a range, the ARIA triple, which
 * parts exist. It cannot own visual truth, because happy-dom performs no layout
 * and no SVG geometry — `getTotalLength()` does not exist there, so "the arc is
 * 75% painted" is a number nobody has checked against a drawn path.
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   · the gauge, its svg, its track and its fill all have real boxes;
 *   · the PAINTED fraction of the arc — measured from the browser's own
 *     `getTotalLength()` against the resolved dash offset — is the documented
 *     `(value - min) / (max - min)`, clamped into the range;
 *   · `thickness` is the stroke width of both arcs, in user units;
 *   · `variant` resolves to a fill stroke that differs from the track, and the
 *     documented variants are mutually distinguishable;
 *   · `size` is a real scale (small < medium < large) and the documented
 *     default renders at the medium size;
 *   · the value text sits inside the chart and is never occluded by the arc it
 *     is drawn over; the label sits below the chart.
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   A stroke with a correct colour and a correct dash offset can still paint
 *   nothing. The marquee captures decode the PNG inside the browser under test
 *   and assert the arc's ink is really on the page, in the variant's colour,
 *   and that an empty gauge really leaves the arc unpainted.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, contrast, sameColor } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/gauge/matrix.html';

type Variant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
type Size = 'small' | 'medium' | 'large';

interface Combo {
  id: string;
  value: number;
  min: number;
  max: number;
  label: string;
  variant: Variant;
  size: Size;
  showValue: boolean;
  thickness: number;
}

const VARIANTS: Variant[] = ['default', 'primary', 'success', 'warning', 'error', 'info'];
const SIZES: Size[] = ['small', 'medium', 'large'];

/** Documented fill fraction: the value's place in its range, clamped. */
function expectedFraction(c: Pick<Combo, 'value' | 'min' | 'max'>): number {
  const range = c.max - c.min;
  if (range <= 0) return 0;
  return (Math.max(c.min, Math.min(c.max, c.value)) - c.min) / range;
}

/**
 * The cross: variant x size x value-shape — 24 combos covering the empty, part,
 * full and out-of-range readings of every variant at every size — with the
 * custom range, the label, `showValue` and `thickness` rotated across them.
 * Mid-range, per .ai/fuzzing.md: the gauge is one SVG with two paths.
 */
function generateCombos(): Combo[] {
  const READINGS: Array<Pick<Combo, 'value' | 'min' | 'max'>> = [
    { value: 0, min: 0, max: 100 },
    { value: 42, min: 0, max: 100 },
    { value: 100, min: 0, max: 100 },
    { value: 180, min: 0, max: 300 },
  ];
  const combos: Combo[] = [];
  let n = 0;
  for (const variant of VARIANTS) {
    for (const size of SIZES) {
      const reading = READINGS[n % READINGS.length];
      combos.push({
        id: `${variant}/${size}/value:${reading.value} of ${reading.min}..${reading.max}`
          + `/[${n % 3 === 0 ? 'labelled,' : ''}${n % 5 === 4 ? 'no-value,' : ''}`
          + `thickness:${n % 4 === 1 ? 12 : 8}]`,
        ...reading,
        label: n % 3 === 0 ? 'CPU Usage' : '',
        variant, size,
        showValue: n % 5 !== 4,
        thickness: n % 4 === 1 ? 12 : 8,
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
async function visualProblems(combo: Combo, fraction: number): Promise<string[]> {
  return page.evaluate(({ combo, fraction }) => {
    const problems: string[] = [];
    const say = (m: string) => problems.push(m);
    const EPS = 1.5;

    const host = document.getElementById('subject') as HTMLElement | null;
    if (!host) { say('nothing mounted'); return problems; }
    const sr = host.shadowRoot;
    if (!sr) { say('no shadow root'); return problems; }

    const rect = (el: Element) => el.getBoundingClientRect();
    const partsNamed = (name: string) =>
      [...sr.querySelectorAll('[part]')].filter(node =>
        (node.getAttribute('part') ?? '').split(/\s+/).includes(name)) as HTMLElement[];

    const base = partsNamed('base')[0];
    if (!base) { say('no part="base" rendered'); return problems; }
    const baseBox = rect(base);
    if (baseBox.width <= 0 || baseBox.height <= 0) {
      say(`the gauge renders at ${baseBox.width}x${baseBox.height}`);
      return problems;
    }

    const svg = sr.querySelector('svg') as SVGSVGElement | null;
    const track = sr.querySelector('.gauge__track') as SVGPathElement | null;
    const fill = sr.querySelector('.gauge__fill') as SVGPathElement | null;
    if (!svg || !track || !fill) { say('the gauge painted no arc'); return problems; }
    const svgBox = rect(svg);
    if (svgBox.width <= 0 || svgBox.height <= 0) {
      say(`the chart renders at ${svgBox.width}x${svgBox.height}`);
      return problems;
    }

    // ── The painted fraction of the arc, from the browser's own geometry ────
    const total = fill.getTotalLength();
    if (!(total > 0)) {
      say(`the fill arc has no length (${total})`);
    } else {
      const offset = parseFloat(getComputedStyle(fill).strokeDashoffset) || 0;
      const painted = Math.max(0, Math.min(1, (total - offset) / total));
      if (Math.abs(painted - fraction) > 0.02) {
        say(`value=${combo.value} of ${combo.min}..${combo.max} painted`
          + ` ${(painted * 100).toFixed(1)}% of the arc, expected ${(fraction * 100).toFixed(1)}%`);
      }
      const trackLength = track.getTotalLength();
      if (Math.abs(trackLength - total) > 0.5) {
        say(`the fill arc (${total.toFixed(1)}) is not the same path as the track`
          + ` (${trackLength.toFixed(1)})`);
      }
    }

    // ── thickness, on both arcs ─────────────────────────────────────────────
    for (const [name, path] of [['track', track], ['fill', fill]] as const) {
      const width = parseFloat(path.getAttribute('stroke-width') ?? '');
      if (width !== combo.thickness) {
        say(`thickness=${combo.thickness} left the ${name} arc at stroke-width ${width}`);
      }
    }

    // ── variant: a fill that is distinguishable from its own track ──────────
    const fillStroke = getComputedStyle(fill).stroke;
    const trackStroke = getComputedStyle(track).stroke;
    if (fillStroke === 'none' || fillStroke === 'rgba(0, 0, 0, 0)') {
      say(`variant="${combo.variant}" paints the fill arc with stroke "${fillStroke}"`);
    }
    if (fillStroke === trackStroke) {
      say(`variant="${combo.variant}" paints the fill in the track's own colour (${fillStroke})`
        + ' — the reading cannot be seen against the groove it sits in');
    }

    // ── The value text and the label ────────────────────────────────────────
    const value = partsNamed('value')[0];
    if (combo.showValue) {
      if (!value) {
        say('showValue is on but no part="value" was painted');
      } else {
        const valueBox = rect(value);
        if (valueBox.width <= 0 || valueBox.height <= 0) {
          say(`part="value" renders at ${valueBox.width}x${valueBox.height}`);
        }
        if (valueBox.left < svgBox.left - EPS || valueBox.right > svgBox.right + EPS) {
          say('the value text spills outside the chart');
        }
        // The value is drawn ON TOP of the arc; an arc that covers it is the
        // failure no DOM test can see.
        const x = valueBox.left + valueBox.width / 2;
        const y = valueBox.top + valueBox.height / 2;
        const outer = document.elementFromPoint(x, y);
        if (outer !== host) {
          say(`the value's hit-test found <${outer?.tagName.toLowerCase() ?? 'nothing'}>,`
            + ' not the gauge');
        } else {
          const hit = (sr as any).elementFromPoint(x, y) as Element | null;
          if (hit !== value && !value.contains(hit as Node)) {
            say(`the value text is occluded by <${hit?.tagName.toLowerCase() ?? 'nothing'}`
              + `${hit ? `.${String((hit as any).getAttribute('class') ?? '').split(' ')[0]}` : ''}>`);
          }
        }
      }
    } else if (value) {
      say('showValue is off but a part="value" was painted anyway');
    }

    const label = partsNamed('label')[0];
    if (combo.label) {
      if (!label) {
        say('a label was given but no part="label" was painted');
      } else {
        const labelBox = rect(label);
        if (labelBox.width <= 0 || labelBox.height <= 0) {
          say(`part="label" renders at ${labelBox.width}x${labelBox.height}`);
        }
        // "label — Label text span BELOW the gauge".
        if (labelBox.top < svgBox.bottom - EPS) {
          say(`the label paints over the chart (${labelBox.top.toFixed(0)} <`
            + ` ${svgBox.bottom.toFixed(0)})`);
        }
      }
    } else if (label) {
      say('no label was given but a part="label" was painted');
    }

    return problems;
  }, { combo, fraction });
}

const combos = generateCombos();

test.describe('gauge visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      const mounted = await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      expect(mounted.mounted).toBe(true);
      expect(await visualProblems(combo, expectedFraction(combo)), `combo ${combo.id}`)
        .toEqual([]);
    });
  }
});

test.describe('gauge visual matrix: the documented size scale', () => {
  async function chartWidth(size?: Size): Promise<number> {
    await page.evaluate(c => (window as any).matrix.mount(c),
      (size ? { value: 60, size } : { value: 60 }) as any);
    return page.evaluate(() => {
      const svg = document.getElementById('subject')!.shadowRoot!.querySelector('svg')!;
      return svg.getBoundingClientRect().width;
    });
  }

  test('small < medium < large', async () => {
    const small = await chartWidth('small');
    const medium = await chartWidth('medium');
    const large = await chartWidth('large');
    expect(small, `small=${small} medium=${medium}`).toBeLessThan(medium);
    expect(medium, `medium=${medium} large=${large}`).toBeLessThan(large);
  });

  // The documented default is `size: 'medium'`, and an untouched default
  // reflects no attribute — so this is the check that the stylesheet has a
  // no-attribute fallback and the default gauge is not left unsized.
  test('a gauge with no size renders at the documented medium size', async () => {
    const fallback = await chartWidth();
    const medium = await chartWidth('medium');
    expect(fallback, `default=${fallback} medium=${medium}`).toBe(medium);
  });
});

test.describe('gauge visual matrix: the documented variants', () => {
  test('the six variants resolve to distinguishable fills', async () => {
    const strokes = new Map<Variant, string>();
    for (const variant of VARIANTS) {
      await page.evaluate(c => (window as any).matrix.mount(c), { value: 60, variant } as any);
      strokes.set(variant, await page.evaluate(() => {
        const fill = document.getElementById('subject')!.shadowRoot!
          .querySelector('.gauge__fill')!;
        return getComputedStyle(fill).stroke;
      }));
    }
    // `primary` and `info` are documented as separate names, not separate
    // hues; the meaningful claim is that the SEMANTIC set is distinguishable.
    for (const [a, b] of [
      ['default', 'success'], ['default', 'warning'], ['default', 'error'],
      ['success', 'warning'], ['success', 'error'], ['warning', 'error'],
      ['default', 'primary'],
    ] as Array<[Variant, Variant]>) {
      expect(strokes.get(a), `variant "${a}" and "${b}" paint the same stroke`)
        .not.toBe(strokes.get(b));
    }
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────
//
// Small on purpose. A screenshot is two orders of magnitude more expensive than
// an evaluate, and layer 1 already measured the model the browser built. These
// exist because "the fill has a stroke and a dash offset" and "the arc is on
// the screen" are different claims, and only pixels can tell them apart.

test.describe('gauge visual matrix: marquee pixels', () => {
  /**
   * Probe points along the gauge's own semicircle, as a fraction of the arc
   * from its left end. The arc is drawn in a 120x70 viewBox with radius 45
   * around (60, 60), so a point at `t` of the sweep maps to a real viewport
   * position through the svg's box.
   */
  const arcProbe = (fractions: number[]) => `(host) => {
    const svg = host.shadowRoot.querySelector('svg');
    const box = svg.getBoundingClientRect();
    const sx = box.width / 120;
    const sy = box.height / 70;
    return ${JSON.stringify(fractions)}.map(t => {
      const angle = Math.PI * (1 - t);
      return {
        x: box.x + (60 + 45 * Math.cos(angle)) * sx,
        y: box.y + (60 - 45 * Math.sin(angle)) * sy,
      };
    });
  }`;

  test('a part-filled gauge paints its variant colour over the filled arc only', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      value: 50, variant: 'error', size: 'large', thickness: 12,
    }));
    // 25% of the sweep is inside the fill, 85% is past it. The first must carry
    // the error colour; the second must not.
    const [filled, unfilled] = await capture(
      page, '#subject', 'gauge-error-half', arcProbe([0.25, 0.85]),
    );
    const [fr, fg, fb] = filled;
    expect(fr > fg + 40 && fr > fb + 40,
      `variant="error" painted rgb(${filled.join(',')}) on the filled arc`).toBe(true);
    expect(sameColor(filled, unfilled),
      'the unfilled arc paints the same colour as the filled one').toBe(false);
    const [ur, ug, ub] = unfilled;
    expect(ur > ug + 40 && ur > ub + 40,
      `the unfilled arc painted the error colour rgb(${unfilled.join(',')})`).toBe(false);
  });

  test('an empty gauge paints no fill at all', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      value: 0, variant: 'success', size: 'large', thickness: 12,
    }));
    const [start, middle] = await capture(
      page, '#subject', 'gauge-empty', arcProbe([0.15, 0.5]),
    );
    for (const [name, pixel] of [['start', start], ['middle', middle]] as const) {
      const [r, g, b] = pixel;
      expect(g > r + 30 && g > b + 30,
        `value=0 painted the success colour at the ${name} of the arc (rgb(${pixel.join(',')}))`)
        .toBe(false);
    }
  });

  test('the value text is legible against the gauge', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      value: 75, variant: 'primary', size: 'large', label: 'CPU Usage',
    }));
    // Sampled as a strip: the centre of a text box regularly lands between two
    // digits, and one probe there would measure the surface and call the value
    // invisible.
    const pixels = await capture(
      page, '#subject', 'gauge-value',
      `(host) => {
        const sr = host.shadowRoot;
        const box = sr.querySelector('[part~="value"]').getBoundingClientRect();
        const svg = sr.querySelector('svg').getBoundingClientRect();
        const points = [];
        for (let i = 0; i < 20; i++) {
          points.push({
            x: box.x + box.width * ((i + 0.5) / 20),
            y: box.y + box.height * 0.55,
          });
        }
        points.push({ x: svg.x + 2, y: svg.y + 2 });
        return points;
      }`,
    );
    const surface = pixels[pixels.length - 1];
    const best = Math.max(...pixels.slice(0, 20).map(p => contrast(p, surface)));
    expect(best, `value contrast against the gauge is ${best.toFixed(2)}:1`).toBeGreaterThan(3);
  });
});
