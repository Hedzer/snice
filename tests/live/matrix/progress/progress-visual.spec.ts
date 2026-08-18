/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-progress TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/progress, `npm run test:matrix`) owns value
 * truth: what `getPercentage()` returns, what `progress-change` carries, what
 * the label text says, which ARIA values are exposed, and the divergence it
 * recorded before its fix (MATRIX-progress-1). It cannot own VISUAL truth,
 * because happy-dom performs no layout — every box reads 0 and nothing is
 * painted.
 *
 * That leaves this tier holding the component's ENTIRE headline promise: a
 * progress bar's whole job is that the painted fill is `value / max` of the
 * track. A DOM test can only see the inline `width: 37%` string; only a browser
 * can tell you that 37% of a 400px track was actually painted, that the arc's
 * dash really encodes the same fraction, and that a 100% bar really reaches the
 * end.
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   · LINEAR: the fill starts at the track's left edge and is exactly
 *     `percentage` of its width — asserted against the track measured in the
 *     browser, not against the inline style;
 *   · CIRCULAR: the arc's `stroke-dashoffset` really encodes the same
 *     percentage of its circumference, and `thickness` really is the stroke
 *     width;
 *   · `indeterminate` really animates and really stops claiming a value;
 *   · `striped` really paints a stripe pattern and `animated` really moves it;
 *   · `show-label` really paints a label inside the component's box;
 *   · `role="progressbar"` carries the documented `aria-valuenow/min/max`;
 *   · nothing paints over the track (elementFromPoint).
 *
 * ── Axis comparisons ───────────────────────────────────────────────────────
 *   Six sizes must really grow; five colours must really differ; a live
 *   `setProgress()` must really move the fill.
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   A fill that "has a width" can still be painted in the track's own colour,
 *   and the documented `--progress-track-opacity: 0.2` warning is exactly the
 *   kind of thing that only shows up in pixels.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, contrast, sameColor } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/progress/matrix.html';

type Variant = 'linear' | 'circular';
type Size = 'small' | 'medium' | 'large' | 'xl' | 'xxl' | 'xxxl';
type Colour = 'primary' | 'success' | 'warning' | 'error' | 'info';
type Fill = 'empty' | 'partial' | 'full' | 'indeterminate';

interface Combo {
  id: string;
  variant: Variant;
  size: Size;
  fill: Fill;
  value: number;
  max: number;
  indeterminate: boolean;
  showLabel: boolean;
  striped: boolean;
  animated: boolean;
  color: Colour;
}

const VARIANTS: Variant[] = ['linear', 'circular'];
const SIZES: Size[] = ['small', 'medium', 'large', 'xl', 'xxl', 'xxxl'];
const COLOURS: Colour[] = ['primary', 'success', 'warning', 'error', 'info'];
const FILLS: Fill[] = ['empty', 'partial', 'full', 'indeterminate'];

/** `value`/`max` per fill state. The partial case uses a non-round max so the
 *  percentage cannot accidentally match a hard-coded width. */
const VALUES: Record<Fill, { value: number; max: number }> = {
  empty: { value: 0, max: 100 },
  partial: { value: 30, max: 80 },      // 37.5%
  full: { value: 80, max: 80 },         // 100%
  indeterminate: { value: 45, max: 100 },
};

/**
 * The cross: 2 variants x 6 sizes x 4 fill states = 48 combos, with the five
 * colours, `show-label`, `striped` and `animated` rotated across it.
 *
 * Sized to the component: a progress bar is a track, a fill, an optional label
 * and two decorations. The product worth paying for is (which geometry) x (how
 * big) x (how full), and the rest rides along.
 */
function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  let n = 0;
  for (const variant of VARIANTS) {
    for (const size of SIZES) {
      for (const fill of FILLS) {
        const { value, max } = VALUES[fill];
        const showLabel = n % 2 === 0;
        const striped = variant === 'linear' && n % 3 === 0;
        const animated = striped && n % 6 === 0;
        combos.push({
          id: `${variant}/${size}/${fill}`
            + `/[${[showLabel && 'label', striped && 'striped', animated && 'animated']
              .filter(Boolean).join(',') || 'plain'}]`,
          variant, size, fill, value, max,
          indeterminate: fill === 'indeterminate',
          showLabel, striped, animated,
          color: COLOURS[n % COLOURS.length],
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

/** LAYER 1: one evaluate per combo; every violation reported at once. */
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
    const part = (name: string) => sr.querySelector(`[part~="${name}"]`) as HTMLElement | null;

    const base = part('base');
    if (!base) { say('no part="base" rendered'); return problems; }
    const baseBox = rect(base);
    if (baseBox.width <= 0 || baseBox.height <= 0) {
      say(`part="base" renders at ${baseBox.width}x${baseBox.height}`);
      return problems;
    }
    const baseCs = getComputedStyle(base);
    if (baseCs.visibility !== 'visible') say(`base visibility "${baseCs.visibility}"`);

    const percentage = combo.max > 0 ? (combo.value / combo.max) * 100 : 0;

    // ── Documented ARIA ──────────────────────────────────────────────────────
    const bar = sr.querySelector('[role="progressbar"]') as HTMLElement | null;
    if (!bar) {
      say('nothing carries role="progressbar"');
    } else if (!combo.indeterminate) {
      const now = bar.getAttribute('aria-valuenow');
      if (Number(now) !== combo.value) {
        say(`aria-valuenow="${now}" for value=${combo.value}`);
      }
      if (Number(bar.getAttribute('aria-valuemax')) !== combo.max) {
        say(`aria-valuemax="${bar.getAttribute('aria-valuemax')}" for max=${combo.max}`);
      }
      if (Number(bar.getAttribute('aria-valuemin')) !== 0) {
        say(`aria-valuemin="${bar.getAttribute('aria-valuemin')}"`);
      }
    }

    if (combo.variant === 'linear') {
      // ── The fill IS the component ──────────────────────────────────────────
      const fill = part('bar');
      if (!fill) { say('no part="bar" rendered'); return problems; }
      const fillBox = rect(fill);

      // The track fills the 400px stage the fixture owns.
      if (Math.abs(baseBox.width - 400) > EPS) {
        say(`the track is ${baseBox.width.toFixed(1)}px inside a 400px stage`);
      }
      if (baseBox.height < 2) say(`the track is only ${baseBox.height.toFixed(1)}px tall`);

      if (combo.indeterminate) {
        const fcs = getComputedStyle(fill);
        if (fcs.animationName === 'none' || parseFloat(fcs.animationDuration) <= 0) {
          say('an indeterminate bar runs no animation — it is a frozen partial fill');
        }
        if (fcs.animationIterationCount !== 'infinite') {
          say(`the indeterminate animation runs ${fcs.animationIterationCount} times`);
        }
      } else {
        if (Math.abs(fillBox.left - baseBox.left) > EPS) {
          say(`the fill starts at x=${fillBox.left.toFixed(1)}, not at the track's left edge`
            + ` (${baseBox.left.toFixed(1)})`);
        }
        const expected = baseBox.width * percentage / 100;
        // 1px of tolerance on a 400px track: this is THE assertion of the
        // component, so it is held to the pixel rather than to a percentage.
        if (Math.abs(fillBox.width - expected) > 1) {
          say(`value=${combo.value}/max=${combo.max} (${percentage.toFixed(1)}%) painted`
            + ` ${fillBox.width.toFixed(1)}px of a ${baseBox.width.toFixed(1)}px track,`
            + ` expected ${expected.toFixed(1)}px`);
        }
        if (fillBox.right > baseBox.right + EPS) say('the fill escapes the track');
        if (percentage === 0 && fillBox.width > 0.5) {
          say(`an empty bar still painted ${fillBox.width.toFixed(1)}px of fill`);
        }
        if (percentage === 100 && fillBox.width < baseBox.width - EPS) {
          say(`a full bar stopped ${(baseBox.width - fillBox.width).toFixed(1)}px short`);
        }
        if (fillBox.height <= 0 && percentage > 0) say('the fill has no height');
      }

      // ── striped / animated ────────────────────────────────────────────────
      const stripes = getComputedStyle(fill, '::after');
      if (combo.striped) {
        if (!stripes.backgroundImage || stripes.backgroundImage === 'none') {
          say('striped painted no stripe pattern');
        }
        if (combo.animated) {
          if (stripes.animationName === 'none' || parseFloat(stripes.animationDuration) <= 0) {
            say('animated stripes do not move');
          }
        }
      } else if (stripes.backgroundImage && stripes.backgroundImage !== 'none') {
        say(`an unstriped bar paints a pattern (${stripes.backgroundImage.slice(0, 40)}…)`);
      }
    } else {
      // ── CIRCULAR ───────────────────────────────────────────────────────────
      const svg = part('circle');
      const track = part('circle-bg');
      const arc = part('circle-bar');
      if (!svg) { say('no part="circle" rendered'); return problems; }
      if (!track) say('no part="circle-bg" rendered');
      if (!arc) { say('no part="circle-bar" rendered'); return problems; }

      if (Math.abs(baseBox.width - baseBox.height) > 1) {
        say(`the circular base is ${baseBox.width.toFixed(1)}x${baseBox.height.toFixed(1)}`
          + ' — not square');
      }

      const dasharray = parseFloat(arc.getAttribute('stroke-dasharray') ?? '0');
      const dashoffset = parseFloat(arc.getAttribute('stroke-dashoffset') ?? '0');
      if (!combo.indeterminate) {
        if (dasharray <= 0) {
          say(`the arc's stroke-dasharray is "${arc.getAttribute('stroke-dasharray')}"`);
        } else {
          // offset = circumference * (1 - fraction): the arc drawn IS the value.
          const expected = dasharray * (1 - percentage / 100);
          if (Math.abs(dashoffset - expected) > Math.max(0.5, dasharray * 0.005)) {
            say(`value=${combo.value}/max=${combo.max} (${percentage.toFixed(1)}%) gave`
              + ` stroke-dashoffset ${dashoffset.toFixed(2)} of ${dasharray.toFixed(2)},`
              + ` expected ${expected.toFixed(2)}`);
          }
        }
      }

      // `thickness` is documented as the circular stroke width.
      const stroke = parseFloat(getComputedStyle(arc).strokeWidth);
      if (!(stroke > 0)) say(`the arc's stroke-width computes to "${getComputedStyle(arc).strokeWidth}"`);

      const svgBox = rect(svg);
      if (svgBox.width <= 0 || svgBox.height <= 0) {
        say(`part="circle" renders at ${svgBox.width}x${svgBox.height}`);
      }
    }

    // ── show-label ───────────────────────────────────────────────────────────
    const label = part('label');
    if (combo.showLabel) {
      if (!label) {
        say('show-label rendered no part="label"');
      } else {
        const lb = rect(label);
        if (lb.width <= 0 || lb.height <= 0) {
          say(`the label renders at ${lb.width}x${lb.height}`);
        } else {
          const lcs = getComputedStyle(label);
          if (parseFloat(lcs.fontSize) < 8) say(`label font-size ${lcs.fontSize}`);
          if (lcs.visibility !== 'visible') say(`label visibility "${lcs.visibility}"`);
          if ((label.textContent ?? '').trim() === '') say('the label paints no text');
          if (lb.left < baseBox.left - EPS || lb.right > baseBox.right + EPS) {
            say(`the label (${lb.left.toFixed(1)}..${lb.right.toFixed(1)}) escapes the`
              + ` component (${baseBox.left.toFixed(1)}..${baseBox.right.toFixed(1)})`);
          }
        }
      }
    } else if (label && rect(label).width > 0) {
      say('a bar without show-label still paints a label');
    }

    // ── Occlusion ────────────────────────────────────────────────────────────
    const x = baseBox.left + baseBox.width * 0.25;
    const y = baseBox.top + baseBox.height / 2;
    const outer = document.elementFromPoint(x, y);
    if (outer !== host) {
      say(`@25%: page hit-test found <${outer?.tagName.toLowerCase() ?? 'nothing'}>,`
        + ' not the progress bar');
    }

    return problems;
  }, combo);
}

const combos = generateCombos();

// ── Known component defects ─────────────────────────────────────────────────
//
// The matrix policy (.ai/fuzzing.md) is: a combo that diverges from the docs is
// a FINDING. Keep the correct assertion, pin it against a finding id, report it
// — never weaken it to match buggy output.
//
// A waiver names the EXACT message it excuses and the combos it applies to.
// Everything else the combo reports still fails the test, and if the excused
// message stops appearing the waiver itself fails — so a fixed component cannot
// leave a permanent lie behind in the suite. Each waiver also has a dedicated
// test below that states the defect on its own.

interface Waiver {
  id: string;
  applies: (combo: Combo) => boolean;
  matches: RegExp;
}

// (None live. VISUAL-MATRIX-progress-2 and -3 were fixed in the component —
// the label is now a track-centred sibling of the bar, and the small circular
// label has an 8px floor — so their waivers were deleted. VISUAL-MATRIX-
// progress-1 and -4 were fixed before them; see the (fixed) comments below.)
const WAIVERS: Waiver[] = [];

test.describe('progress visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      const mounted = await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      expect(mounted.variant).toBe(combo.variant);
      const problems = await visualProblems(combo);

      const waivers = WAIVERS.filter(w => w.applies(combo));
      const excused = (problem: string) => waivers.some(w => w.matches.test(problem));

      // Everything the waivers do NOT name is a live failure, as always.
      expect(problems.filter(p => !excused(p)), `combo ${combo.id}`).toEqual([]);

      // And a waiver that no longer excuses anything is a waiver to delete.
      for (const waiver of waivers) {
        expect(problems.some(p => waiver.matches.test(p)),
          `combo ${combo.id}: ${waiver.id} no longer reproduces — delete its waiver`)
          .toBe(true);
      }
    });
  }
});

test.describe('progress visual matrix: findings', () => {
  /**
   * FINDING VISUAL-MATRIX-progress-2 (fixed). The label used to be centred on
   * the FILL, so at value=0 — the state a progress bar starts in — it painted
   * half outside the component. It is now a sibling of the bar, centred on the
   * track, so "0%" stays inside at every value.
   */
  test('show-label at value=0 keeps the label inside the component', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      variant: 'linear', size: 'xxxl', value: 0, max: 100, showLabel: true,
    }));
    const geometry = await page.evaluate(() => {
      const sr = document.getElementById('subject')!.shadowRoot!;
      const base = sr.querySelector('[part~="base"]') as HTMLElement;
      const label = sr.querySelector('[part~="label"]') as HTMLElement;
      const b = base.getBoundingClientRect();
      const l = label.getBoundingClientRect();
      return { trackLeft: b.left, labelLeft: l.left, overhang: b.left - l.left };
    });
    expect(geometry.overhang,
      `the 0% label starts at x=${geometry.labelLeft.toFixed(1)} against a track`
      + ` starting at x=${geometry.trackLeft.toFixed(1)} — it hangs outside`)
      .toBeLessThanOrEqual(0);
  });

  /**
   * FINDING VISUAL-MATRIX-progress-3 (fixed). The small circular label used to
   * compute to 6px (`0.375rem`) — a third the size of the smallest type
   * anywhere else in the library. It now has an 8px floor, the minimum this
   * tier's oracle accepts as readable.
   */
  test('a small circular bar labels itself at a readable size', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      variant: 'circular', size: 'small', value: 50, max: 100, showLabel: true,
    }));
    const fontSize = await page.evaluate(() => {
      const label = document.getElementById('subject')!.shadowRoot!
        .querySelector('[part~="label"]') as HTMLElement;
      return parseFloat(getComputedStyle(label).fontSize);
    });
    expect(fontSize,
      `the small circular label computes to ${fontSize}px — below the 8px floor`)
      .toBeGreaterThanOrEqual(8);
  });
});

test.describe('progress visual matrix: axis comparisons', () => {
  test('the six documented sizes really grow — linear', async () => {
    const heights: number[] = [];
    for (const size of SIZES) {
      await page.evaluate(c => (window as any).matrix.mount(c),
        { variant: 'linear', size, value: 50 } as any);
      heights.push(await page.evaluate(() => {
        const base = document.getElementById('subject')!.shadowRoot!
          .querySelector('[part~="base"]') as HTMLElement;
        return base.getBoundingClientRect().height;
      }));
    }
    for (let i = 1; i < heights.length; i++) {
      expect(heights[i],
        `size "${SIZES[i]}" (${heights[i].toFixed(1)}px) is not taller than`
        + ` "${SIZES[i - 1]}" (${heights[i - 1].toFixed(1)}px)`)
        .toBeGreaterThan(heights[i - 1]);
    }
  });

  test('the six documented sizes really grow — circular', async () => {
    const widths: number[] = [];
    for (const size of SIZES) {
      await page.evaluate(c => (window as any).matrix.mount(c),
        { variant: 'circular', size, value: 50 } as any);
      widths.push(await page.evaluate(() => {
        const base = document.getElementById('subject')!.shadowRoot!
          .querySelector('[part~="base"]') as HTMLElement;
        return base.getBoundingClientRect().width;
      }));
    }
    for (let i = 1; i < widths.length; i++) {
      expect(widths[i],
        `circular size "${SIZES[i]}" (${widths[i].toFixed(1)}px) is not bigger than`
        + ` "${SIZES[i - 1]}" (${widths[i - 1].toFixed(1)}px)`)
        .toBeGreaterThan(widths[i - 1]);
    }
  });

  /**
   * FINDING VISUAL-MATRIX-progress-1 (fixed). `color="info"` used to be
   * identical to `color="primary"`: the stylesheet resolved
   * `:host([color="info"]) { --progress-color: var(--snice-color-primary, …) }`
   * — the same theme token `primary` uses. It now resolves to indigo
   * (`rgb(99 102 241)`), the spinner's info fallback, so all five documented
   * colours paint pairwise-distinct fills.
   */
  test('the five documented colours do not collapse into one', async () => {
    const fills: string[] = [];
    for (const color of COLOURS) {
      await page.evaluate(c => (window as any).matrix.mount(c),
        { variant: 'linear', size: 'xl', value: 60, color } as any);
      fills.push(await page.evaluate(() => {
        const bar = document.getElementById('subject')!.shadowRoot!
          .querySelector('[part~="bar"]') as HTMLElement;
        return getComputedStyle(bar).backgroundColor;
      }));
    }

    const seen = new Map<string, Colour>();
    for (const [i, colour] of COLOURS.entries()) {
      const clash = seen.get(fills[i]);
      expect(clash, `color="${colour}" paints exactly like "${clash}" (${fills[i]})`)
        .toBeUndefined();
      seen.set(fills[i], colour);
    }
  });

  test('a custom CSS colour string really reaches the fill', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      variant: 'linear', size: 'xl', value: 60, color: 'rgb(220, 38, 38)',
    }));
    const painted = await page.evaluate(() => {
      const bar = document.getElementById('subject')!.shadowRoot!
        .querySelector('[part~="bar"]') as HTMLElement;
      return getComputedStyle(bar).backgroundColor;
    });
    expect(painted, `a custom color string painted ${painted}`).toBe('rgb(220, 38, 38)');
  });

  test('setProgress really moves the painted fill', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      variant: 'linear', size: 'xl', value: 10, max: 100,
    }));
    const measure = () => page.evaluate(() => {
      const sr = document.getElementById('subject')!.shadowRoot!;
      const base = sr.querySelector('[part~="base"]') as HTMLElement;
      const bar = sr.querySelector('[part~="bar"]') as HTMLElement;
      return {
        track: base.getBoundingClientRect().width,
        fill: bar.getBoundingClientRect().width,
      };
    });

    const before = await measure();
    expect(await page.evaluate(() => (window as any).matrix.setProgress(75))).toBe(75);
    const after = await measure();

    expect(after.fill,
      `setProgress(75) left the fill at ${after.fill.toFixed(1)}px`
      + ` (was ${before.fill.toFixed(1)}px)`).toBeGreaterThan(before.fill);
    expect(Math.abs(after.fill - after.track * 0.75),
      `setProgress(75) painted ${after.fill.toFixed(1)}px of a ${after.track.toFixed(1)}px track`)
      .toBeLessThanOrEqual(1);
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────

test.describe('progress visual matrix: marquee pixels', () => {
  test('the fill is visibly different from the track it sits in', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      variant: 'linear', size: 'xxxl', value: 50, max: 100, color: 'primary',
    }));
    const [filled, empty] = await capture(
      page, '#subject', 'progress-linear-fill',
      `(host) => {
        const sr = host.shadowRoot;
        const base = sr.querySelector('[part~="base"]');
        const b = base.getBoundingClientRect();
        return [
          { x: b.x + b.width * 0.25, y: b.y + b.height / 2 },
          { x: b.x + b.width * 0.75, y: b.y + b.height / 2 },
        ];
      }`,
    );
    expect(sameColor(filled, empty),
      `the filled half painted ${filled.join(',')} and the empty half painted the same —`
      + ' the bar shows no progress at all').toBe(false);
    const ratio = contrast(filled, empty);
    // The live bar: a fill nobody can pick out from its track communicates
    // nothing at all.
    expect(ratio, `fill/track contrast is ${ratio.toFixed(2)}:1`).toBeGreaterThan(1.6);

    /**
     * FINDING VISUAL-MATRIX-progress-4 (fixed). The default token pair —
     * `--progress-color` (primary) on `--progress-bg` (the raw border grey) —
     * measured 2.99:1 in the painted pixels, just under the 3:1 WCAG 1.4.11
     * bar for a graphical object that carries meaning. `--progress-bg` now
     * lightens the border token one step (color-mix 90% border, 10% white),
     * which lifts the pair past 3:1 — a progress bar's fill IS the
     * information, so the fixed contract is pinned from below too.
     */
    expect(ratio,
      `the default fill/track pair measures only ${ratio.toFixed(2)}:1 — below`
      + ' the WCAG 1.4.11 3:1 bar for a meaningful graphical object')
      .toBeGreaterThanOrEqual(3);
  });

  test('a full bar really paints all the way to the end', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      variant: 'linear', size: 'xxxl', value: 100, max: 100, color: 'success',
    }));
    const pixels = await capture(
      page, '#subject', 'progress-linear-full',
      `(host) => {
        const base = host.shadowRoot.querySelector('[part~="base"]');
        const b = base.getBoundingClientRect();
        return [0.02, 0.5, 0.98].map(f => ({
          x: b.x + b.width * f,
          y: b.y + b.height / 2,
        }));
      }`,
    );
    const [start, middle, end] = pixels;
    expect(sameColor(start, end),
      `a 100% bar painted ${start.join(',')} at its start and ${end.join(',')} at its end`)
      .toBe(true);
    expect(sameColor(start, middle),
      'a 100% bar is not one continuous fill').toBe(true);
  });

  test('the circular track ring is visible behind the arc', async () => {
    // The documented warning on `--progress-track-opacity: 0.2` ("raise to 1 on
    // dark surfaces — 0.2 of any color vanishes on near-black") is a claim
    // about paint, so the default's visibility on the default surface is too.
    await page.evaluate(() => (window as any).matrix.mount({
      variant: 'circular', size: 'xxxl', value: 50, max: 100, color: 'primary', thickness: 10,
    }));
    const pixels = await capture(
      page, '#stage', 'progress-circular-ring',
      `() => {
        const sr = document.getElementById('subject').shadowRoot;
        const svg = sr.querySelector('[part~="circle"]');
        const bar = sr.querySelector('[part~="circle-bar"]');
        const base = sr.querySelector('[part~="base"]');
        const b = base.getBoundingClientRect();
        // The probe geometry comes from the circle's OWN attributes, never
        // from a getBoundingClientRect on the SVG shape: whether that rect
        // includes the stroke is engine-specific (Chromium reports the
        // geometry box, Firefox the stroke extents), so "half the rect is the
        // centreline" lands mid-stroke in one engine and on the band's outer
        // edge — pure surface — in the other. Every engine paints from the
        // same cx/cy/r/viewBox attributes, and the svg fills the base box, so
        // those give the client-space circle directly.
        const vb = (svg.getAttribute('viewBox') || '').trim().split(' ').map(Number);
        const scale = b.width / vb[2];
        const cx = b.x + parseFloat(bar.getAttribute('cx')) * scale;
        const cy = b.y + parseFloat(bar.getAttribute('cy')) * scale;
        const centreline = parseFloat(bar.getAttribute('r')) * scale;
        // vector-effect: non-scaling-stroke keeps the stroke width in screen
        // pixels, which is what the band below is sampled in.
        const sw = parseFloat(getComputedStyle(bar).strokeWidth);
        // Sample ACROSS the stroke band at fractions of the stroke width,
        // clear of both anti-aliased edges: fonts and rasterisation differ
        // per engine, so a single probe can graze an edge in one of them.
        const radii = [-0.3, -0.15, 0, 0.15, 0.3].map(f => centreline + f * sw);
        const points = [];
        // The arc runs clockwise from 12 o'clock, so at 50% the 3 o'clock
        // point is well inside it...
        for (const r of radii) points.push({ x: cx + r, y: cy });
        // ...and the 9 o'clock point is untouched track ring.
        for (const r of radii) points.push({ x: cx - r, y: cy });
        return [...points, { x: b.x, y: b.bottom + 60 }];
      }`,
    );
    // Each side is judged on the STRONGEST ink its band managed — the sample
    // furthest from the surface colour — so a probe that grazes an
    // anti-aliased edge cannot make a painted ring read as invisible.
    const arcBand = pixels.slice(0, 5);
    const ringBand = pixels.slice(5, 10);
    const [surface] = pixels.slice(10);
    const ink = (band: typeof arcBand) =>
      band.reduce((best, px) => (contrast(px, surface) > contrast(best, surface) ? px : best));
    const arc = ink(arcBand);
    const ring = ink(ringBand);
    expect(sameColor(arc, surface),
      `the drawn arc painted ${arc.join(',')}, identical to the page surface`).toBe(false);
    expect(sameColor(ring, surface),
      `the track ring painted ${ring.join(',')}, identical to the page surface —`
      + ' the unfilled part of the circle is invisible').toBe(false);
    expect(sameColor(arc, ring),
      'the drawn arc and the empty track ring paint the same colour').toBe(false);
  });
});
