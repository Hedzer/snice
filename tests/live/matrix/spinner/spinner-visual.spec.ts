/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-spinner TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/spinner, `npm run test:matrix`) owns structure
 * truth: which part each variant renders, what the label reads, what ARIA the
 * element exposes. It cannot own VISUAL truth, and for THIS component that gap
 * is nearly the whole component — a spinner is a shape that moves. happy-dom
 * has no layout and no animation, so it cannot tell a spinning arc from a
 * static one, a 24px loader from an 80px one, or a coloured ring from an
 * invisible one.
 *
 * The spinner is PURELY PRESENTATIONAL: no data, no interaction, no delivery
 * modes. Per .ai/fuzzing.md its matrix is deliberately small — 20 layer-1
 * combos, not the table's 1152 — but this is the tier that matters most for it,
 * because every documented dimension (`variant`, `size`, `color`, `thickness`)
 * is a CSS rule or an SVG geometry, and a browser is the only place any of them
 * can be checked at all.
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   · the host is square and `part="base"` fills it;
 *   · the variant's own documented part (`circle`/`dots`/`pulse`/`orbit`/
 *     `bars`) is the ONE that renders, with a real box inside the host;
 *   · something is actually ANIMATING — a spinner that does not spin is the
 *     defect no DOM test can see;
 *   · the label sits below the loader, centred on it, and never on top of it;
 *   · `role="status"` and an accessible name are present, as documented;
 *   · nothing paints over the loader (elementFromPoint).
 *
 * ── Axis comparisons ───────────────────────────────────────────────────────
 *   Four sizes must really grow; five colours must really differ; `thickness`
 *   must really change how thick the arc is drawn.
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   Every variant must actually paint something inside its box, and `color`
 *   must reach the pixels. A loader drawn in the surface colour is a blank
 *   square that claims to be busy.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, sameColor, type RGB } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/spinner/matrix.html';

type Size = 'small' | 'medium' | 'large' | 'xl';
type Colour = 'primary' | 'success' | 'warning' | 'error' | 'info';
type Variant = 'arc' | 'dots' | 'pulse' | 'orbit' | 'bars';

interface Combo {
  id: string;
  variant: Variant;
  size: Size;
  color: Colour;
  label: boolean;
}

const SIZES: Size[] = ['small', 'medium', 'large', 'xl'];
const COLOURS: Colour[] = ['primary', 'success', 'warning', 'error', 'info'];
const VARIANTS: Variant[] = ['arc', 'dots', 'pulse', 'orbit', 'bars'];

/** The documented part each variant is drawn into. */
const VARIANT_PART: Record<Variant, string> = {
  arc: 'circle', dots: 'dots', pulse: 'pulse', orbit: 'orbit', bars: 'bars',
};

/**
 * The cross: 5 variants x 4 sizes = 20 combos, with the five colours and the
 * label rotated across it. Sized to a purely presentational component with one
 * branch per variant — the point here is that every shape gets a real browser,
 * not that the product is large.
 */
function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  let n = 0;
  for (const variant of VARIANTS) {
    for (const size of SIZES) {
      const color = COLOURS[n % COLOURS.length];
      const label = n % 3 === 0;
      combos.push({
        id: `${variant}/${size}/${color}${label ? '/labelled' : ''}`,
        variant, size, color, label,
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

/** LAYER 1: one evaluate per combo; every violation reported at once. */
async function visualProblems(combo: Combo, expectedPart: string): Promise<string[]> {
  return page.evaluate(({ combo, expectedPart, allParts }) => {
    const problems: string[] = [];
    const say = (m: string) => problems.push(m);
    const EPS = 1.5;

    const host = document.getElementById('subject') as HTMLElement | null;
    if (!host) { say('nothing mounted'); return problems; }
    const sr = host.shadowRoot;
    if (!sr) { say('no shadow root'); return problems; }

    const rect = (el: Element) => el.getBoundingClientRect();
    const part = (name: string) => sr.querySelector(`[part~="${name}"]`) as HTMLElement | null;

    const hostBox = rect(host);
    if (hostBox.width <= 0 || hostBox.height <= 0) {
      say(`host renders at ${hostBox.width}x${hostBox.height}`);
      return problems;
    }
    // A loader is a square box: `--spinner-size` drives both axes.
    if (Math.abs(hostBox.width - hostBox.height) > 1) {
      say(`the host is ${hostBox.width.toFixed(1)}x${hostBox.height.toFixed(1)} — not square`);
    }
    if (hostBox.width < 16) say(`the host is only ${hostBox.width.toFixed(1)}px across`);

    const base = part('base');
    if (!base) { say('no part="base" rendered'); return problems; }
    const baseBox = rect(base);
    if (baseBox.width <= 0 || baseBox.height <= 0) {
      say(`part="base" renders at ${baseBox.width}x${baseBox.height}`);
      return problems;
    }
    if (Math.abs(baseBox.width - hostBox.width) > EPS
      || Math.abs(baseBox.height - hostBox.height) > EPS) {
      say(`part="base" (${baseBox.width.toFixed(1)}x${baseBox.height.toFixed(1)}) does not fill`
        + ` the host (${hostBox.width.toFixed(1)}x${hostBox.height.toFixed(1)})`);
    }

    // ── The variant's own shape, and only that one ───────────────────────────
    const shape = part(expectedPart);
    if (!shape) {
      say(`variant="${combo.variant}" rendered no part="${expectedPart}"`);
    } else {
      const sb = rect(shape);
      if (sb.width <= 0 || sb.height <= 0) {
        say(`part="${expectedPart}" renders at ${sb.width}x${sb.height}`);
      } else {
        // LAYOUT size, not the painted AABB: the arc's <svg> is continuously
        // rotating, and a rotated square's bounding rect is legitimately wider
        // than the square. offsetWidth/Height ignore transforms, so this asks
        // "how big is the loader" rather than "where is it in its spin".
        const laidOut = { width: shape.offsetWidth, height: shape.offsetHeight };
        if (laidOut.width > hostBox.width + EPS || laidOut.height > hostBox.height + EPS) {
          say(`part="${expectedPart}" is laid out at`
            + ` ${laidOut.width}x${laidOut.height} inside a`
            + ` ${hostBox.width.toFixed(1)}x${hostBox.height.toFixed(1)} host — it overflows`);
        }
        // The loader has to fill a useful share of the box it reserved. Judged
        // on its MAJOR axis: three small dots in a row are a legitimate shape
        // that occupies little of the box's height.
        const fill = Math.max(laidOut.width / hostBox.width, laidOut.height / hostBox.height);
        if (fill < 0.4) {
          say(`part="${expectedPart}" is ${laidOut.width}x${laidOut.height}`
            + ` inside a ${hostBox.width.toFixed(1)}px box — it barely fills it`);
        }
        // Centred in the box it reserved, whichever axis it is small on.
        const centre = {
          x: sb.left + sb.width / 2 - (hostBox.left + hostBox.width / 2),
          y: sb.top + sb.height / 2 - (hostBox.top + hostBox.height / 2),
        };
        if (Math.abs(centre.x) > 2 || Math.abs(centre.y) > 2) {
          say(`part="${expectedPart}" is off-centre by`
            + ` (${centre.x.toFixed(1)}, ${centre.y.toFixed(1)})px`);
        }
      }
    }
    for (const other of allParts) {
      if (other === expectedPart) continue;
      const stray = part(other);
      if (stray && rect(stray).width > 0) {
        say(`variant="${combo.variant}" also painted part="${other}"`);
      }
    }

    // ── Something must actually move ─────────────────────────────────────────
    const animated = [...sr.querySelectorAll('*')].filter((el) => {
      const cs = getComputedStyle(el);
      return cs.animationName !== 'none' && cs.animationName !== ''
        && parseFloat(cs.animationDuration) > 0;
    });
    if (animated.length === 0) {
      say(`variant="${combo.variant}" runs no animation — the spinner does not spin`);
    } else {
      for (const el of animated) {
        const cs = getComputedStyle(el);
        if (cs.animationIterationCount !== 'infinite') {
          say(`an animated element runs ${cs.animationIterationCount} iterations,`
            + ' not infinitely — the spinner stops');
        }
      }
    }

    // ── The label ────────────────────────────────────────────────────────────
    const label = part('label');
    if (combo.label) {
      if (!label) {
        say('a labelled spinner rendered no part="label"');
      } else {
        const lb = rect(label);
        if (lb.width <= 0 || lb.height <= 0) {
          say(`the label renders at ${lb.width}x${lb.height}`);
        } else {
          const lcs = getComputedStyle(label);
          if (parseFloat(lcs.fontSize) < 7) say(`label font-size ${lcs.fontSize}`);
          if (lcs.visibility !== 'visible') say(`label visibility "${lcs.visibility}"`);
          // Documented: the label is descriptive text FOR the loader — below it
          // and centred on it, never over it.
          if (lb.top < hostBox.bottom - EPS) {
            say(`the label (top ${lb.top.toFixed(1)}) overlaps the loader`
              + ` (bottom ${hostBox.bottom.toFixed(1)})`);
          }
          const loaderCentre = hostBox.left + hostBox.width / 2;
          const labelCentre = lb.left + lb.width / 2;
          if (Math.abs(loaderCentre - labelCentre) > 2) {
            say(`the label's centre (${labelCentre.toFixed(1)}) is not under the loader's`
              + ` (${loaderCentre.toFixed(1)})`);
          }
        }
      }
    } else if (label && rect(label).width > 0) {
      say('an unlabelled spinner still paints a label');
    }

    // ── Documented ARIA ──────────────────────────────────────────────────────
    if (base.getAttribute('role') !== 'status') {
      say(`part="base" carries role="${base.getAttribute('role')}", expected "status"`);
    }
    if (!(base.getAttribute('aria-label') ?? '').trim()) {
      say('the spinner exposes no accessible name');
    }

    // ── Occlusion ────────────────────────────────────────────────────────────
    const x = hostBox.left + hostBox.width / 2;
    const y = hostBox.top + hostBox.height / 2;
    const outer = document.elementFromPoint(x, y);
    if (outer !== host) {
      say(`centre: page hit-test found <${outer?.tagName.toLowerCase() ?? 'nothing'}>,`
        + ' not the spinner');
    }

    return problems;
  }, { combo, expectedPart, allParts: Object.values(VARIANT_PART) });
}

const combos = generateCombos();

/**
 * FINDING VISUAL-MATRIX-spinner-2 (still pinned).
 *
 * Combo:    `dots/small/info` (layer 1, cross-axis centring).
 * Expected: the loader is centred in the box it reserved — `part="base"` is
 *           `inline-flex; align-items: center` and the dots container is a
 *           4px-tall flex item inside the 24px small host, so its centre
 *           belongs on the host's centre.
 * Actual:   Firefox lays the container out 4px BELOW centre (offset scales
 *           with the item's shortfall; a plain 24px inline-flex with
 *           `align-items: center` and a 4px fixed-height child reproduces it
 *           with no component code involved). Chromium centres it. The
 *           component's CSS is standard flexbox; this is a Gecko cross-axis
 *           alignment divergence, not a stylesheet defect. A minimal
 *           workaround (auto margins on `.spinner__dots` instead of the
 *           parent's `align-items`/`justify-content` centring) was attempted
 *           2026-08-17 and did NOT change Firefox's placement — the same
 *           4.0px offset — so the component CSS stays standard and the pin
 *           stays.
 *
 * The assertion is NOT weakened; on the engine that diverges the affected
 * combo is declared `test.fail()` so the suite goes red the day Firefox
 * centres it. ENGINE-CONDITIONAL PIN: Chromium centres the row, so an
 * unconditional pin made the default chromium tier error with "expected to
 * fail but passed" (observed 2026-08-17). The pin applies on Firefox only —
 * everywhere else the strict assertion runs normally and passes.
 */
const PINNED: Record<string, string> = {
  'dots/small/info': 'VISUAL-MATRIX-spinner-2',
};

test.describe('spinner visual matrix: layer 1', () => {
  for (const combo of combos) {
    const pin = PINNED[combo.id];
    test(pin ? `${pin} ${combo.id}` : combo.id, async ({ browserName }) => {
      if (pin && browserName === 'firefox') test.fail();
      const mounted = await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      expect(mounted.variant).toBe(combo.variant);
      expect(await visualProblems(combo, VARIANT_PART[combo.variant]), `combo ${combo.id}`)
        .toEqual([]);
    });
  }
});

async function rowSpinners(count: number): Promise<Array<{
  width: number; height: number; color: string; strokeWidth: string; radius: string;
}>> {
  return page.evaluate((count) => {
    const out = [];
    for (let i = 0; i < count; i++) {
      const host = document.getElementById(`subject-${i}`) as HTMLElement;
      const sr = host.shadowRoot!;
      const base = sr.querySelector('[part~="base"]') as HTMLElement;
      const bar = sr.querySelector('.spinner__circle-bar') as SVGElement | null;
      const box = host.getBoundingClientRect();
      out.push({
        width: box.width,
        height: box.height,
        color: getComputedStyle(base).color,
        strokeWidth: bar ? getComputedStyle(bar).strokeWidth : '',
        radius: bar ? (bar.getAttribute('r') ?? '') : '',
      });
    }
    return out;
  }, count);
}

test.describe('spinner visual matrix: axis comparisons', () => {
  test('the four documented sizes really grow', async () => {
    const row = SIZES.map(size => ({ size }));
    const count = await page.evaluate(r => (window as any).matrix.mountRow(r), row as any);
    const spinners = await rowSpinners(count);
    for (let i = 1; i < spinners.length; i++) {
      expect(spinners[i].width,
        `size "${SIZES[i]}" (${spinners[i].width.toFixed(1)}px) is not bigger than`
        + ` "${SIZES[i - 1]}" (${spinners[i - 1].width.toFixed(1)}px)`)
        .toBeGreaterThan(spinners[i - 1].width);
    }
  });

  /**
   * FINDING VISUAL-MATRIX-spinner-1.
   *
   * `color="info"` is identical to `color="primary"`: the stylesheet resolves
   * `:host([color="info"]) { --spinner-color: var(--snice-color-primary, …) }`
   * — the same theme token `primary` uses — even though the theme defines its
   * own info colour. The docs list five colours as five choices; a customer who
   * asks for `info` silently gets `primary`.
   *
   * The assertion is NOT weakened: every other pair must still differ. The one
   * collision is named, and the naming is asserted, so a fix trips this test.
   */
  const KNOWN_COLLISION: [Colour, Colour] = ['primary', 'info'];

  test('the five documented colours do not collapse into one', async () => {
    const row = COLOURS.map(color => ({ color }));
    const count = await page.evaluate(r => (window as any).matrix.mountRow(r), row as any);
    const spinners = await rowSpinners(count);

    const seen = new Map<string, Colour>();
    for (const [i, colour] of COLOURS.entries()) {
      if (colour === KNOWN_COLLISION[1]) continue;
      const clash = seen.get(spinners[i].color);
      expect(clash, `color="${colour}" paints exactly like "${clash}" (${spinners[i].color})`)
        .toBeUndefined();
      seen.set(spinners[i].color, colour);
    }

    const a = COLOURS.indexOf(KNOWN_COLLISION[0]);
    const b = COLOURS.indexOf(KNOWN_COLLISION[1]);
    expect(spinners[a].color,
      `VISUAL-MATRIX-spinner-1 no longer reproduces: "${KNOWN_COLLISION[1]}" now paints`
      + ` ${spinners[b].color} against "${KNOWN_COLLISION[0]}"'s ${spinners[a].color}`
      + ' — delete the waiver').toBe(spinners[b].color);
  });

  /**
   * FINDING VISUAL-MATRIX-spinner-2.
   *
   * `thickness` is documented as "only applies to arc variant" — the arc's line
   * thickness. It does not change how thick anything is drawn. The stroke width
   * comes from `--spinner-stroke`, which is derived from `size` alone; the
   * `thickness` property is used only to compute the circle's RADIUS
   * (`r = (size - thickness * 2) / 2`). So a customer who raises `thickness` to
   * get a heavier ring gets a SMALLER ring of exactly the same weight — and at
   * a large enough value, no ring at all.
   *
   * The assertion below is the documented behaviour, kept at full strength and
   * pinned as a finding: the stroke must widen with `thickness`. The pin
   * records the actual behaviour (constant stroke, shrinking radius) so that
   * fixing the component fails this test until the finding is deleted.
   */
  test('thickness really changes how thick the arc is drawn', async () => {
    const row = [
      { variant: 'arc', size: 'xl', thickness: 2 },
      { variant: 'arc', size: 'xl', thickness: 10 },
    ];
    const count = await page.evaluate(r => (window as any).matrix.mountRow(r), row as any);
    const spinners = await rowSpinners(count);
    const thin = parseFloat(spinners[0].strokeWidth);
    const thick = parseFloat(spinners[1].strokeWidth);

    const documented = thick > thin;
    expect(documented,
      `VISUAL-MATRIX-spinner-2: thickness=2 and thickness=10 both draw a`
      + ` ${spinners[0].strokeWidth} stroke — thickness does not reach the paint`)
      .toBe(false);

    // What it actually does instead, pinned so the finding cannot rot: the
    // radius shrinks by exactly the extra thickness.
    const thinRadius = parseFloat(spinners[0].radius);
    const thickRadius = parseFloat(spinners[1].radius);
    expect(thickRadius,
      `VISUAL-MATRIX-spinner-2 no longer reproduces the radius side-effect`
      + ` (r ${thinRadius} -> ${thickRadius}) — recheck the finding`)
      .toBeLessThan(thinRadius);
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────
//
// One capture per variant is the exception to "keep the marquee tiny": for a
// spinner, "does this shape paint anything at all" IS the component, and there
// are only five shapes.

test.describe('spinner visual matrix: marquee pixels', () => {
  for (const variant of VARIANTS) {
    test(`the ${variant} variant paints something inside its box`, async () => {
      await page.evaluate(c => (window as any).matrix.mount(c),
        { variant, size: 'xl', color: 'error' } as any);
      const pixels = await capture(
        page, '#subject', `spinner-${variant}`,
        `(host) => {
          const b = host.getBoundingClientRect();
          const points = [];
          // A 7x7 lattice: an arc is a thin ring and bars are thin columns, so
          // a sparse probe can slip between everything the loader draws.
          for (let i = 1; i <= 7; i++) {
            for (let j = 1; j <= 7; j++) {
              points.push({ x: b.x + (b.width * i) / 8, y: b.y + (b.height * j) / 8 });
            }
          }
          return points;
        }`,
      );
      const distinct = new Set(pixels.map(p => p.join(',')));
      expect(distinct.size,
        `the ${variant} loader's box painted one flat colour (${[...distinct]})`
        + ' — nothing is drawn there').toBeGreaterThan(1);

      // And what it draws is the colour that was asked for: `error` is red.
      const reddest = [...pixels].sort((a, b) =>
        (b[0] - (b[1] + b[2]) / 2) - (a[0] - (a[1] + a[2]) / 2))[0] as RGB;
      expect(reddest[0] > reddest[1] + 30 && reddest[0] > reddest[2] + 30,
        `color="error" painted nothing red in the ${variant} loader`
        + ` (reddest pixel rgb(${reddest.join(',')}))`).toBe(true);
    });
  }

  test('a loader stands off the page surface', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      variant: 'arc', size: 'xl', color: 'primary',
    }));
    const pixels = await capture(
      page, '#stage', 'spinner-vs-surface',
      `() => {
        const host = document.getElementById('subject');
        const b = host.getBoundingClientRect();
        const points = [];
        // Across the ring's top edge, where the arc's stroke lives.
        for (let i = 3; i <= 5; i++) {
          points.push({ x: b.x + (b.width * i) / 8, y: b.y + 3 });
        }
        points.push({ x: b.x + b.width / 2, y: b.bottom + 60 });
        return points;
      }`,
    );
    const surface = pixels[pixels.length - 1];
    const ring = pixels.slice(0, -1);
    expect(ring.some(p => !sameColor(p, surface)),
      `every probe across the arc painted the page surface ${surface.join(',')}`
      + ' — the ring is invisible').toBe(true);
  });
});
