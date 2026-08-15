/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-progress-ring TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/progress-ring, `npm run test:matrix`)
 * owns the ring's ARITHMETIC: aria-valuenow/min/max, the dash geometry, which
 * centre parts exist, when `progress-complete` fires. What it cannot see is that
 * any of it is drawn — happy-dom lays out nothing and paints nothing, so a ring
 * whose stroke never renders, whose centre text spills over the band, or whose
 * three sizes are all the same size passes every DOM assertion.
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   · the ring is square, has a real box, and the SVG fills it;
 *   · `size` really changes the drawn diameter, and the three sizes order
 *     small < medium < large;
 *   · the centre text sits ON the ring's centre and INSIDE the ring's hole —
 *     text that spills over the band is unreadable, and only a layout engine
 *     knows where the band is;
 *   · the track and the fill are the same circle, drawn in the same place;
 *   · nothing occludes the centre text.
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   Determinate progress is a claim about COVERAGE: more value, more arc. The
 *   marquee walks a circle of probes around the band and counts painted ones,
 *   which is the only way to tell "the ring reports 75%" from "the ring shows
 *   75%". It also checks the ring is hollow and that `color` reaches the paint.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, sameColor, type RGB } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/progress-ring/matrix.html';

type Size = 'small' | 'medium' | 'large';
type Centre = 'none' | 'value' | 'label' | 'label+value';

const SIZES: Size[] = ['small', 'medium', 'large'];
const VALUES = [0, 25, 75, 100];
const CENTRES: Centre[] = ['none', 'value', 'label+value'];

interface Combo { id: string; size: Size; value: number; centre: Centre }

/**
 * 3 sizes x 4 values x 3 centre configurations — 36 combos. Sized to a
 * component that is two circles and a caption; the point of this tier is that
 * the circle, the caption box and the three sizes meet a real layout engine.
 */
function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  for (const size of SIZES) {
    for (const value of VALUES) {
      for (const centre of CENTRES) {
        combos.push({ id: `${size}/value=${value}/centre=${centre}`, size, value, centre });
      }
    }
  }
  return combos;
}

function mountArgs(combo: Combo) {
  return {
    size: combo.size,
    value: combo.value,
    max: 100,
    showValue: combo.centre === 'value' || combo.centre === 'label+value',
    label: combo.centre === 'label' || combo.centre === 'label+value' ? 'CPU' : '',
  };
}

let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(FIXTURE);
  await page.waitForFunction(() => document.documentElement.dataset.matrixReady === 'true');
});
test.afterAll(async () => { await page?.close(); });

/** LAYER 1. One evaluate per combo, returning EVERY violation at once. */
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
    const tokens = (node: Element) => (node.getAttribute('part') ?? '').split(/\s+/).filter(Boolean);
    const partOf = (name: string) =>
      ([...sr.querySelectorAll('[part]')].find(node => tokens(node).includes(name)) ?? null) as HTMLElement | null;

    const hostBox = rect(host);
    if (hostBox.width <= 0 || hostBox.height <= 0) {
      say(`the ring renders at ${hostBox.width}x${hostBox.height}`);
      return problems;
    }
    if (Math.abs(hostBox.width - hostBox.height) > 2) {
      say(`the ring is ${hostBox.width.toFixed(0)}x${hostBox.height.toFixed(0)} — not square`);
    }

    const svg = sr.querySelector('svg');
    if (!svg) { say('no svg drawn'); return problems; }
    const svgBox = rect(svg);
    if (svgBox.width <= 0 || svgBox.height <= 0) {
      say(`the svg renders at ${svgBox.width}x${svgBox.height}`);
      return problems;
    }
    if (Math.abs(svgBox.width - hostBox.width) > 2) {
      say(`the svg (${svgBox.width.toFixed(0)}px) does not fill the host`
        + ` (${hostBox.width.toFixed(0)}px)`);
    }

    const track = partOf('track');
    const fill = partOf('fill');
    if (!track || !fill) { say('the ring is missing its track or fill circle'); return problems; }
    const trackBox = rect(track);
    const fillBox = rect(fill);
    if (trackBox.width <= 0 || trackBox.height <= 0) {
      say(`the track renders at ${trackBox.width}x${trackBox.height}`);
    }
    // The fill is the same circle as the track. At value 0 it draws nothing, so
    // only a non-empty arc is required to line up with the track.
    if (combo.value > 0) {
      if (Math.abs(fillBox.width - trackBox.width) > 2 || Math.abs(fillBox.height - trackBox.height) > 2) {
        say(`the fill (${fillBox.width.toFixed(0)}x${fillBox.height.toFixed(0)}) is not the same`
          + ` circle as the track (${trackBox.width.toFixed(0)}x${trackBox.height.toFixed(0)})`);
      }
    }
    if (getComputedStyle(track).stroke === 'none') say('the track has no stroke to paint');
    if (getComputedStyle(fill).stroke === 'none') say('the fill has no stroke to paint');

    // ── The centre ───────────────────────────────────────────────────────────
    const centre = partOf('center');
    if (combo.centre === 'none') {
      if (centre) say('a ring with neither showValue nor label still paints a centre');
    } else if (!centre) {
      say(`centre="${combo.centre}" paints no [part="center"]`);
    } else {
      const centreBox = rect(centre);
      if (centreBox.width <= 0 || centreBox.height <= 0) {
        say(`the centre text renders at ${centreBox.width}x${centreBox.height}`);
      } else {
        const ringCentre = {
          x: svgBox.left + svgBox.width / 2,
          y: svgBox.top + svgBox.height / 2,
        };
        const textCentre = {
          x: centreBox.left + centreBox.width / 2,
          y: centreBox.top + centreBox.height / 2,
        };
        if (Math.abs(textCentre.x - ringCentre.x) > 1 || Math.abs(textCentre.y - ringCentre.y) > 1) {
          say(`the centre text is off the ring's centre by`
            + ` ${Math.abs(textCentre.x - ringCentre.x).toFixed(1)}x`
            + `${Math.abs(textCentre.y - ringCentre.y).toFixed(1)}px`);
        }
        // The hole: the viewBox is 36 units across and the stroke is centred on
        // the radius, so the unpainted middle is (36 - 2 * thickness) units.
        // Text wider than that is painted over the band it is supposed to sit
        // inside — the one thing a layout engine can see and a DOM test cannot.
        const thickness = Number((host as any).thickness ?? 4);
        const hole = svgBox.width * ((36 - 2 * thickness) / 36);
        if (centreBox.width > hole + EPS) {
          say(`the centre text is ${centreBox.width.toFixed(1)}px wide inside a`
            + ` ${hole.toFixed(1)}px hole — it spills over the ring`);
        }
        if (centreBox.height > hole + EPS) {
          say(`the centre text is ${centreBox.height.toFixed(1)}px tall inside a`
            + ` ${hole.toFixed(1)}px hole`);
        }

        // Occlusion: nothing may paint over the centre text.
        const hit = (sr as any).elementFromPoint(textCentre.x, textCentre.y) as Element | null;
        if (hit && hit !== centre && !centre.contains(hit) && !hit.contains(centre)) {
          say(`the centre text is occluded by <${hit.tagName.toLowerCase()}>`);
        }
      }

      const valuePart = partOf('value');
      const labelPart = partOf('label');
      const wantValue = combo.centre === 'value' || combo.centre === 'label+value';
      const wantLabel = combo.centre === 'label' || combo.centre === 'label+value';
      if (wantValue && (!valuePart || rect(valuePart).height <= 0)) say('the percentage has no box');
      if (wantLabel && (!labelPart || rect(labelPart).height <= 0)) say('the label has no box');
      if (wantValue && wantLabel && valuePart && labelPart) {
        const v = rect(valuePart);
        const l = rect(labelPart);
        const overlapY = Math.min(v.bottom, l.bottom) - Math.max(v.top, l.top);
        if (overlapY > EPS) say('the label and the percentage are painted on top of each other');
      }
    }

    return problems;
  }, combo as any);
}

const combos = generateCombos();

test.describe('progress-ring visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      const mounted = await page.evaluate(c => (window as any).matrix.mount(c), mountArgs(combo) as any);
      expect(mounted.value).toBe(combo.value);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

test.describe('progress-ring visual matrix: the size scale', () => {
  test('small, medium and large draw three different diameters, in that order', async () => {
    const drawn: Record<Size, number> = { small: 0, medium: 0, large: 0 };
    for (const size of SIZES) {
      await page.evaluate(c => (window as any).matrix.mount(c), {
        size, value: 50, max: 100, showValue: true,
      } as any);
      drawn[size] = await page.evaluate(() =>
        document.getElementById('subject')!.shadowRoot!.querySelector('svg')!
          .getBoundingClientRect().width);
    }
    expect(drawn.small, `sizes drew ${JSON.stringify(drawn)}`).toBeLessThan(drawn.medium);
    expect(drawn.medium, `sizes drew ${JSON.stringify(drawn)}`).toBeLessThan(drawn.large);
  });

  test('a thicker ring leaves a smaller hole', async () => {
    // `thickness` is documented as the ring's stroke width. A stroke width that
    // does not change the painted band is a property with no effect, and the
    // band is only measurable where there is a layout.
    const holes: Record<number, number> = {};
    for (const thickness of [2, 8]) {
      await page.evaluate(c => (window as any).matrix.mount(c), {
        size: 'large', value: 100, max: 100, thickness,
      } as any);
      holes[thickness] = await page.evaluate(() => {
        const host = document.getElementById('subject') as any;
        const svg = host.shadowRoot.querySelector('svg').getBoundingClientRect();
        return svg.width * ((36 - 2 * Number(host.thickness)) / 36);
      });
    }
    expect(holes[8], `thickness 2 → ${holes[2]}px hole, thickness 8 → ${holes[8]}px`)
      .toBeLessThan(holes[2]);
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────
//
// Small on purpose. Layer 1 measured the model the browser built; these exist
// because "stroke-dashoffset says 75%" and "three quarters of the ring is
// painted" are different claims, and only pixels can tell them apart.

/** Probe source: 24 points evenly spaced around the middle of the ring band. */
const BAND_PROBE = `(host) => {
  const svg = host.shadowRoot.querySelector('svg').getBoundingClientRect();
  const cx = svg.x + svg.width / 2;
  const cy = svg.y + svg.height / 2;
  const thickness = Number(host.thickness || 4);
  // The band's centreline: the circle the stroke is drawn on, in px.
  const radius = svg.width * ((36 - thickness) / 2 / 36);
  return Array.from({ length: 24 }, (_, i) => {
    const angle = (i / 24) * Math.PI * 2 - Math.PI / 2;
    return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
  });
}`;

test.describe('progress-ring visual matrix: marquee pixels', () => {
  test('the painted arc grows with the value', async () => {
    const coverage: Record<number, number> = {};
    let trackColour: RGB = [0, 0, 0];

    for (const value of [0, 25, 50, 100]) {
      await page.evaluate(c => (window as any).matrix.mount(c), {
        size: 'large', value, max: 100, thickness: 8, color: 'rgb(220, 38, 38)',
      } as any);
      const band = await capture(page, '#subject', `progress-ring-arc-${value}`, BAND_PROBE);
      if (value === 0) trackColour = band[0];
      // A probe is "filled" when it painted the fill's colour family (red here,
      // chosen so it cannot be confused with the neutral track).
      coverage[value] = band.filter(([r, g, b]) => r > g + 40 && r > b + 40).length;
    }

    expect(coverage[0], `an empty ring painted ${coverage[0]}/24 filled probes`).toBe(0);
    expect(trackColour, 'the track painted nothing at all').not.toEqual([255, 255, 255]);
    // Determinate progress: more value, strictly more arc.
    expect(coverage[25], `25% covered ${coverage[25]}/24`).toBeGreaterThan(0);
    expect(coverage[50], `50% covered ${coverage[50]}/24, 25% covered ${coverage[25]}/24`)
      .toBeGreaterThan(coverage[25]);
    expect(coverage[100], `100% covered ${coverage[100]}/24, 50% covered ${coverage[50]}/24`)
      .toBeGreaterThan(coverage[50]);
    // …and the coverage is the value, not merely monotonic. ±2 probes of 24
    // absorbs the round line cap and anti-aliasing at the arc's ends.
    for (const value of [25, 50, 100]) {
      const expected = (value / 100) * 24;
      expect(Math.abs(coverage[value] - expected),
        `value=${value} painted ${coverage[value]}/24 probes, expected about ${expected}`)
        .toBeLessThanOrEqual(2);
    }
  });

  test('the ring is hollow, and a custom colour reaches the paint', async () => {
    await page.evaluate(c => (window as any).matrix.mount(c), {
      size: 'large', value: 100, max: 100, thickness: 8, color: 'rgb(16, 185, 129)',
    } as any);
    const [centre, band] = await capture(
      page, '#subject', 'progress-ring-hollow',
      `(host) => {
        const svg = host.shadowRoot.querySelector('svg').getBoundingClientRect();
        const cx = svg.x + svg.width / 2;
        const cy = svg.y + svg.height / 2;
        const radius = svg.width * ((36 - 8) / 2 / 36);
        return [
          { x: cx, y: cy },
          { x: cx, y: cy - radius },
        ];
      }`,
    );
    const surface: RGB = [255, 255, 255];
    expect(sameColor(centre, band),
      `the ring's middle painted the same colour as its band (${band.join(',')}) — it is a disc`)
      .toBe(false);
    expect(sameColor(centre, surface),
      `the ring's middle painted ${centre.join(',')}, not the page behind it`).toBe(true);
    // color="rgb(16,185,129)" is a green; the band has to be green-dominant.
    const [r, g, b] = band;
    expect(g > r + 40 && g > b + 20,
      `color="rgb(16,185,129)" painted rgb(${r},${g},${b})`).toBe(true);
  });
});
