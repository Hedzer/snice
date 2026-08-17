/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-slider TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/slider, `npm run test:matrix`) owns the value
 * truth: the lattice, the dirty-value lifecycle, the form contract, which
 * parts exist, the ARIA. Its own header says why it cannot own this
 * component's actual subject: "The fill width, the thumb offset and the tick
 * spacing are all percentages of a real box: visual tier." A slider IS a
 * position — the thumb's place along the track is the value, made visible —
 * and only a layout engine can measure it.
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   · THE CONTRACT: the thumb's centre sits at (value − min) / (max − min)
 *     of the track, and the fill spans exactly that far from the track's
 *     min end. The numerator is the DOCUMENTED sanitised value — "value is
 *     live clamped/stepped state … The step lattice starts at min, matching
 *     native range" — so an off-lattice authored value must PAINT at its
 *     snapped lattice point;
 *   · `vertical` swaps the axis everywhere: the track becomes taller than
 *     wide, the fill anchors to the BOTTOM and grows upward, the thumb
 *     rides the vertical centre line;
 *   · `variant` "change[s] the slider color": each semantic variant paints
 *     its OWN semantic theme token on the fill and the thumb ring
 *     (default/primary share the primary semantic, the way the theme
 *     publishes exactly one per semantic);
 *   · `invalid` is "visual/ARIA presentation only" — and the human doc
 *     promises the error "updates … track/thumb styling": the thumb ring
 *     takes the danger semantic;
 *   · `show-value` lays the read-out out as a sibling of the track (right
 *     of it horizontally, below it vertically), never overlapping;
 *   · `show-ticks` "display[s] additional visual information": the marks
 *     spread across the track's span, on the far side of it from the value;
 *   · nothing occludes the thumb — it is the one part a pointer grabs.
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   A fill can "have a background-color" and still paint a wash invisible
 *   against the track; a thumb can compute at 18px and still be lost on the
 *   fill it sits on. Three captures: the filled half is visibly distinct
 *   from the unfilled half, the knob is visibly distinct from the fill it
 *   rides, and a vertical slider visibly fills FROM THE BOTTOM.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, contrast, sameColor } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/slider/matrix.html';

type Variant = 'default' | 'primary' | 'success' | 'warning' | 'danger';
type Size = 'small' | 'medium' | 'large';

const VARIANTS: Variant[] = ['default', 'primary', 'success', 'warning', 'danger'];
const SIZES: Size[] = ['small', 'medium', 'large'];

/**
 * The documented semantic token each variant paints.
 *
 * The docs say only "Use `variant` to change the slider color", but the
 * variants are named SEMANTICS ("success", "danger") and the theme publishes
 * exactly one base colour per semantic. So the expectation is "this variant
 * paints ITS OWN semantic token" — the claim a variant exists to make, and
 * the one a copy-pasted rule pointing at the wrong semantic would break.
 * `default` names no semantic of its own, so it wears the primary one.
 */
const VARIANT_TOKEN: Record<Variant, string> = {
  default: '--snice-color-primary',
  primary: '--snice-color-primary',
  success: '--snice-color-success',
  warning: '--snice-color-warning',
  danger: '--snice-color-danger',
};

/**
 * The documented sanitisation, transcribed from the doc's own sentence
 * ("clamped/stepped … the step lattice starts at min, matching native
 * range; zero, negative, or non-finite steps fall back to 1") — the same
 * oracle the DOM matrix carries, kept here because every geometry
 * expectation below needs the PAINTED value, not the authored one.
 */
function effectiveStep(step: number): number {
  return Number.isFinite(step) && step > 0 ? step : 1;
}
function expectedValue(raw: number, min: number, max: number, step: number): number {
  const lower = Number.isFinite(min) ? min : -Infinity;
  const upper = Number.isFinite(max) ? Math.max(max, lower) : Infinity;
  const unit = effectiveStep(step);
  const clamped = Math.max(lower, Math.min(upper, raw));
  let snapped = lower + Math.round((clamped - lower) / unit) * unit;
  if (snapped > upper) snapped = lower + Math.floor((upper - lower) / unit) * unit;
  snapped = Math.max(lower, Math.min(upper, snapped));
  if (!Number.isFinite(snapped)) return clamped;
  return Number(snapped.toPrecision(15));
}

interface Combo {
  id: string;
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  variant?: Variant;
  size?: Size;
  vertical?: boolean;
  showValue?: boolean;
  showTicks?: boolean;
  label?: string;
  helperText?: string;
  errorText?: string;
  disabled?: boolean;
  readonly?: boolean;
  loading?: boolean;
  invalid?: boolean;
  /** Assert the variant token paint (the colour cross sets this). */
  checkColor?: boolean;
  /** A combo pinned as a known component divergence from the docs. */
  finding?: string;
}

const base = (over: Partial<Combo>): Combo => ({
  id: '', min: 0, max: 100, step: 1, value: 0,
  variant: 'default', size: 'medium', ...over,
});

/**
 * ── POSITION: the value, made visible ──────────────────────────────────────
 * Two ranges x four fractions x two orientations = 16. The second range is
 * deliberately asymmetric (−50…50) so a thumb parked at 0 CANNOT pass by
 * resting on the track's left end — 0 is its middle. Every authored value is
 * ON the lattice, so these combos measure pure geometry; the snapping has
 * its own group.
 */
function positionCombos(): Combo[] {
  const combos: Combo[] = [];
  const ranges = [
    { min: 0, max: 100, step: 1, values: [0, 25, 50, 100] },
    { min: -50, max: 50, step: 5, values: [-50, -25, 0, 50] },
  ];
  for (const range of ranges) {
    for (const value of range.values) {
      for (const vertical of [false, true]) {
        const pct = ((value - range.min) / (range.max - range.min)).toFixed(3);
        combos.push(base({
          id: `position/${vertical ? 'vertical' : 'horizontal'}`
            + `/${range.min}..${range.max}@${value}/${pct}`,
          ...range, value, vertical,
        }));
      }
    }
  }
  return combos;
}

/**
 * ── LATTICE: an off-lattice authored value paints at its snapped point ─────
 * Five combos whose authored `value` is NOT on the step lattice; the painted
 * position must be the documented nearest-lattice-point, computed by the
 * oracle above rather than read back from the component.
 */
const LATTICE_COMBOS: Combo[] = [
  base({ id: 'lattice/0..100@10/authored-33→30', min: 0, max: 100, step: 10, value: 33 }),
  base({ id: 'lattice/0..100@25/authored-60→50', min: 0, max: 100, step: 25, value: 60 }),
  base({ id: 'lattice/1..9@2/authored-2→3', min: 1, max: 9, step: 2, value: 2 }),
  base({ id: 'lattice/0..1@0.1/authored-0.46→0.5', min: 0, max: 1, step: 0.1, value: 0.46 }),
  base({ id: 'lattice/vertical/0..100@10/authored-74→70', min: 0, max: 100, step: 10, value: 74, vertical: true }),
];

/**
 * ── COLOUR: variant (5) x size (3) = 15 ────────────────────────────────────
 * Every variant is judged at every size because the size changes the box the
 * colour is painted into (the ring is a fixed 2px on a growing knob).
 */
function colourCombos(): Combo[] {
  const combos: Combo[] = [];
  for (const variant of VARIANTS) {
    for (const size of SIZES) {
      combos.push(base({
        id: `colour/${variant}/${size}`,
        variant, size, value: 40, checkColor: true,
      }));
    }
  }
  return combos;
}

/**
 * ── FEATURES: show-value (2) x show-ticks (2) x vertical (2) = 8 ───────────
 * The axes that add BOXES around the track. Which colour is in them is
 * irrelevant, so they are not multiplied by the variants.
 */
function featureCombos(): Combo[] {
  const combos: Combo[] = [];
  for (const showValue of [false, true]) {
    for (const showTicks of [false, true]) {
      for (const vertical of [false, true]) {
        combos.push(base({
          id: `features/${showValue ? 'value' : 'no-value'}`
            + `/${showTicks ? 'ticks' : 'no-ticks'}/${vertical ? 'vertical' : 'horizontal'}`,
          showValue, showTicks, vertical, value: 60, step: 20, label: 'Volume',
        }));
      }
    }
  }
  return combos;
}

/**
 * ── STATES: invalid / disabled / readonly / loading = 4 ────────────────────
 * `invalid` (+ `error-text`, the documented pairing) must paint the danger
 * ring; the barred states keep their plain geometry (their INERTNESS is
 * asserted with the real keyboard/drag paths in the interaction describe).
 */
const STATE_COMBOS: Combo[] = [
  /**
   * ── FINDING VISUAL-MATRIX-slider-1 ──────────────────────────────────────
   *
   * The documented error "updates … track/thumb styling" (docs/ai/components/
   * slider.md, "Form and validation contract"), and the component's own
   * `.slider-thumb--invalid` rule intends exactly that — border-color: the
   * danger semantic. But the rule is cascade-defeated: every
   * `.slider-thumb--<variant>` rule in snice-slider.css carries the same
   * single-class specificity and appears LATER in the stylesheet, so the
   * variant's border wins and an invalid slider keeps its variant ring
   * (rgb(36, 112, 235) here, primary) instead of the danger one. Only the
   * box-shadow half of the invalid rule survives. The assertion below stays
   * exactly as documented; the combo is pinned `test.fail` until the
   * invalid rule outranks the variant ones.
   */
  base({
    id: 'VISUAL-MATRIX-slider-1: state/invalid',
    invalid: true, errorText: 'Value out of range', value: 40, variant: 'primary',
    finding: 'VISUAL-MATRIX-slider-1',
  }),
  base({ id: 'state/disabled', disabled: true, value: 40, variant: 'primary' }),
  base({ id: 'state/readonly', readonly: true, value: 40, variant: 'primary' }),
  base({ id: 'state/loading', loading: true, value: 40, variant: 'primary' }),
];

const ALL_COMBOS = [
  ...positionCombos(),
  ...LATTICE_COMBOS,
  ...colourCombos(),
  ...featureCombos(),
  ...STATE_COMBOS,
];

let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(FIXTURE);
  await page.waitForFunction(() => document.documentElement.dataset.matrixReady === 'true');
});
test.afterAll(async () => { await page?.close(); });

/**
 * LAYER 1. One evaluate per combo, returning EVERY violation at once so a
 * failing combo reports its whole story rather than one problem per re-run.
 */
async function visualProblems(combo: Combo): Promise<string[]> {
  const min = combo.min ?? 0;
  const max = combo.max ?? 100;
  const step = combo.step ?? 1;
  const painted = expectedValue(combo.value ?? 0, min, max, step);
  const range = max - min;
  const pct = range > 0 ? (painted - min) / range : 0;
  const fillToken = VARIANT_TOKEN[combo.variant ?? 'default'];

  return page.evaluate(({ combo, pct, painted, fillToken, checkColor }) => {
    const problems: string[] = [];
    const say = (m: string) => problems.push(m);
    const EPS = 1.5;
    const round = (n: number) => n.toFixed(1);
    const matrix = (window as any).matrix;

    const host = document.getElementById('subject') as HTMLElement | null;
    if (!host) { say('nothing mounted'); return problems; }
    const sr = host.shadowRoot;
    if (!sr) { say('no shadow root'); return problems; }

    const rect = (el: Element) => el.getBoundingClientRect();
    const partNamed = (name: string) =>
      [...sr.querySelectorAll('[part]')].find(node =>
        (node.getAttribute('part') ?? '').split(' ').includes(name)) as HTMLElement | undefined;

    const track = partNamed('track');
    const fill = partNamed('fill');
    const thumb = partNamed('thumb');
    if (!track || !fill || !thumb) { say('track/fill/thumb parts missing'); return problems; }

    const t = rect(track);
    if (t.width <= 0 || t.height <= 0) {
      say(`track renders at ${t.width}x${t.height}`);
      return problems;
    }

    // ── orientation is an axis swap, and the track's shape says which ──────
    if (combo.vertical ? t.height <= t.width : t.width <= t.height) {
      say(`a ${combo.vertical ? 'vertical' : 'horizontal'} slider's track is ${round(t.width)}x${round(t.height)}`);
    }

    // ── THE CONTRACT: the fill spans (value-min)/(max-min) of the track ────
    const f = rect(fill);
    if (combo.vertical) {
      if (Math.abs(f.bottom - t.bottom) > EPS) {
        say(`the vertical fill's bottom is ${round(f.bottom)}, not the track's ${round(t.bottom)}`);
      }
      if (Math.abs(f.height - pct * t.height) > EPS) {
        say(`fill height ${round(f.height)}px is not the ${(pct * 100).toFixed(1)}%`
          + ` a value of ${painted} demands on a ${round(t.height)}px track`);
      }
    } else {
      if (Math.abs(f.left - t.left) > EPS) {
        say(`the fill's left edge is ${round(f.left)}, not the track's ${round(t.left)}`);
      }
      if (Math.abs(f.width - pct * t.width) > EPS) {
        say(`fill width ${round(f.width)}px is not the ${(pct * 100).toFixed(1)}%`
          + ` a value of ${painted} demands on a ${round(t.width)}px track`);
      }
    }

    // ── and the thumb's CENTRE rides exactly that far along ────────────────
    const h = rect(thumb);
    if (h.width <= 0 || h.height <= 0) { say(`thumb renders at ${h.width}x${h.height}`); return problems; }
    const cx = h.left + h.width / 2;
    const cy = h.top + h.height / 2;
    if (combo.vertical) {
      const want = t.bottom - pct * t.height;
      if (Math.abs(cy - want) > EPS) {
        say(`the vertical thumb's centre is at ${round(cy)}, expected ${round(want)}`
          + ` (${(pct * 100).toFixed(1)}% up a ${round(t.height)}px track for value ${painted})`);
      }
      if (Math.abs(cx - (t.left + t.width / 2)) > EPS) {
        say(`the vertical thumb's centre X ${round(cx)} is off the track's centre line`);
      }
    } else {
      const want = t.left + pct * t.width;
      if (Math.abs(cx - want) > EPS) {
        say(`the thumb's centre is at ${round(cx)}, expected ${round(want)}`
          + ` (${(pct * 100).toFixed(1)}% along a ${round(t.width)}px track for value ${painted})`);
      }
      if (Math.abs(cy - (t.top + t.height / 2)) > EPS) {
        say(`the thumb's centre Y ${round(cy)} is off the track's centre line`);
      }
    }

    // ── variant: "Use variant to change the slider color" ──────────────────
    if (checkColor) {
      const want = matrix.token(fillToken);
      const fillCs = getComputedStyle(fill);
      const thumbCs = getComputedStyle(thumb);
      if (fillCs.backgroundColor !== want) {
        say(`${combo.variant} fill paints "${fillCs.backgroundColor}",`
          + ` expected ${fillToken} "${want}"`);
      }
      if (thumbCs.borderTopColor !== want) {
        say(`${combo.variant} thumb ring paints "${thumbCs.borderTopColor}",`
          + ` expected ${fillToken} "${want}"`);
      }
    }

    // ── invalid: the documented visual error takes the danger semantic ─────
    if (combo.invalid) {
      const danger = matrix.token('--snice-color-danger');
      const ring = getComputedStyle(thumb).borderTopColor;
      if (ring !== danger) {
        say(`an invalid slider's thumb ring is "${ring}", expected the danger token "${danger}"`);
      }
    }

    // ── the label sits above the whole assembly, inside the host ───────────
    if (combo.label) {
      const label = sr.querySelector('label.label') as HTMLElement | null;
      if (!label) { say('a label was authored but none rendered'); }
      else {
        const l = rect(label);
        const hostBox = rect(host);
        if (l.width <= 0 || l.height <= 0) say(`label renders at ${l.width}x${l.height}`);
        if (l.bottom > t.top + EPS) say('the label is not above the track');
        if (l.left < hostBox.left - EPS || l.right > hostBox.right + EPS) {
          say('the label escapes the host');
        }
      }
    }

    // ── show-value: the read-out is a track sibling, never an overlap ──────
    if (combo.showValue) {
      const readout = sr.querySelector('.slider-value') as HTMLElement | null;
      if (!readout) { say('show-value painted no read-out'); }
      else {
        const v = rect(readout);
        if (v.width <= 0 || v.height <= 0) say(`the read-out renders at ${v.width}x${v.height}`);
        const overlaps = !(v.left >= t.right - EPS || v.right <= t.left + EPS
          || v.top >= t.bottom - EPS || v.bottom <= t.top + EPS);
        if (overlaps) say('the value read-out overlaps the track');
        else if (combo.vertical
          ? v.top < t.bottom - EPS   // below the track
          : v.left < t.right - EPS) {  // right of the track
          say(`the read-out is not ${combo.vertical ? 'below' : 'right of'} the track`);
        }
      }
    } else if (sr.querySelector('.slider-value')) {
      say('a read-out painted while show-value is off');
    }

    // ── show-ticks: the marks spread across the track's span ───────────────
    const ticks = [...sr.querySelectorAll('.tick')] as HTMLElement[];
    if (combo.showTicks) {
      if (ticks.length === 0) say('show-ticks painted no ticks');
      else {
        const boxes = ticks.map(tick => rect(tick));
        const first = boxes[0];
        const last = boxes[boxes.length - 1];
        // Horizontal marks lay out left→right in DOM order; vertical ones
        // live in a column-reverse flex (the min tick at the BOTTOM, the
        // low end of a vertical slider), so the span is measured between
        // the extreme marks without assuming which DOM node is which end.
        const span = combo.vertical
          ? Math.max(first.top, last.top) - Math.min(first.top, last.top)
          : last.right - first.left;
        const extent = combo.vertical ? t.height : t.width;
        if (span < 0.75 * extent) {
          say(`${ticks.length} ticks spread ${round(span)}px, less than three quarters`
            + ` of the ${round(extent)}px track`);
        }
        const offSide = combo.vertical
          ? first.left < t.right - EPS
          : first.top < t.bottom - EPS;
        if (offSide) {
          say(`the ticks are not on the ${combo.vertical ? 'right of' : 'below'} the track`);
        }
        for (const box of boxes) {
          if (box.width <= 0 || box.height <= 0) say('a tick renders at 0x0');
        }
      }
    } else if (ticks.length > 0) {
      say('ticks painted while show-ticks is off');
    }

    // ── occlusion: the thumb is the part a pointer grabs ────────────────────
    // A LOADING thumb is exempt: it is deliberately pointer-events:none
    // (the spinner owns it), so a hit-test there is MEANT to pass through.
    if (!combo.loading) {
      const hit = (sr as any).elementFromPoint(cx, cy) as Element | null;
      if (hit !== thumb && !thumb.contains(hit as Node)) {
        say(`the thumb is occluded by <${hit?.tagName.toLowerCase() ?? 'nothing'}>`);
      }
    }

    return problems;
  }, { combo, pct, painted, fillToken, checkColor: combo.checkColor === true } as any);
}

async function mount(combo: Combo): Promise<void> {
  await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
}

test.describe('slider visual matrix: layer 1', () => {
  for (const combo of ALL_COMBOS) {
    // A finding keeps its strict assertion and is declared expected-to-fail,
    // so the suite goes red the day the component meets the docs.
    const declare = combo.finding ? test.fail : test;
    declare(combo.id, async () => {
      await mount(combo);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

/**
 * The size axis is an ORDERING claim, and no single combo can make it.
 * "Use `size` to change the slider size" — measured once, across the three
 * documented sizes, in both of the quantities a size governs: the track's
 * thickness and the knob's diameter.
 */
test.describe('slider visual matrix: the size axis is an ordering', () => {
  test('small < medium < large in track thickness and thumb diameter', async () => {
    const measured: Record<string, { track: number; thumb: number }> = {};
    for (const size of SIZES) {
      await mount(base({ size, value: 50 }));
      measured[size] = await page.evaluate(() => {
        const sr = document.getElementById('subject')!.shadowRoot!;
        const track = sr.querySelector('[part~="track"]') as HTMLElement;
        const thumb = sr.querySelector('[part~="thumb"]') as HTMLElement;
        return {
          track: track.getBoundingClientRect().height,
          thumb: thumb.getBoundingClientRect().width,
        };
      });
    }
    expect(measured.small.track, 'small track < medium').toBeLessThan(measured.medium.track);
    expect(measured.medium.track, 'medium track < large').toBeLessThan(measured.large.track);
    expect(measured.small.thumb, 'small thumb < medium').toBeLessThan(measured.medium.thumb);
    expect(measured.medium.thumb, 'medium thumb < large').toBeLessThan(measured.large.thumb);
  });
});

/**
 * The documented input paths, judged by where they leave the thumb. The DOM
 * matrix drives the same keys for value truth; only a browser can confirm
 * the PAINT follows the value — which is the entire point of a slider.
 */
test.describe('slider visual matrix: the documented input paths move the paint', () => {
  const readPainted = () => page.evaluate(() => {
    const sr = document.getElementById('subject')!.shadowRoot!;
    const track = sr.querySelector('[part~="track"]') as HTMLElement;
    const thumb = sr.querySelector('[part~="thumb"]') as HTMLElement;
    const t = track.getBoundingClientRect();
    const h = thumb.getBoundingClientRect();
    const host = document.getElementById('subject') as any;
    return {
      value: host.value,
      pctAlong: (h.left + h.width / 2 - t.left) / t.width,
    };
  });

  test('ArrowRight walks the lattice; End and Home hit the ends', async () => {
    await mount(base({ min: 0, max: 100, step: 10, value: 0 }));

    await page.evaluate(() => (window as any).matrix.consumeKey('ArrowRight'));
    let painted = await readPainted();
    expect(painted.value, 'ArrowRight adjusts by one step').toBe(10);
    expect(painted.pctAlong).toBeCloseTo(0.10, 1);

    await page.evaluate(() => (window as any).matrix.consumeKey('ArrowRight'));
    painted = await readPainted();
    expect(painted.value).toBe(20);
    expect(painted.pctAlong).toBeCloseTo(0.20, 1);

    await page.evaluate(() => (window as any).matrix.consumeKey('End'));
    painted = await readPainted();
    expect(painted.value, 'End is max').toBe(100);
    expect(painted.pctAlong).toBeCloseTo(1, 1);

    await page.evaluate(() => (window as any).matrix.consumeKey('Home'));
    painted = await readPainted();
    expect(painted.value, 'Home is min').toBe(0);
    expect(painted.pctAlong).toBeCloseTo(0, 1);
  });

  test('ArrowUp walks a vertical slider upward', async () => {
    await mount(base({ min: 0, max: 100, step: 10, value: 20, vertical: true }));
    await page.evaluate(() => (window as any).matrix.consumeKey('ArrowUp'));
    const painted = await page.evaluate(() => {
      const sr = document.getElementById('subject')!.shadowRoot!;
      const track = sr.querySelector('[part~="track"]') as HTMLElement;
      const thumb = sr.querySelector('[part~="thumb"]') as HTMLElement;
      const t = track.getBoundingClientRect();
      const h = thumb.getBoundingClientRect();
      return {
        value: (document.getElementById('subject') as any).value,
        pctUp: (t.bottom - (h.top + h.height / 2)) / t.height,
      };
    });
    expect(painted.value, 'ArrowUp adjusts by one step').toBe(30);
    expect(painted.pctUp).toBeCloseTo(0.30, 1);
  });

  test('a real drag lands on the lattice, not on the pointer', async () => {
    await mount(base({ min: 0, max: 100, step: 10, value: 0 }));
    const dragged = await page.evaluate(() => (window as any).matrix.dragThumbTo(0.37));
    // 37% of the raw range snaps to the documented nearest lattice point: 40.
    expect(dragged.value, '37% of 0..100@10 snaps to 40').toBe(40);
    const painted = await readPainted();
    expect(painted.pctAlong).toBeCloseTo(0.40, 1);
  });

  test('disabled, readonly and loading thumbs ignore both input paths', async () => {
    // "Disabled controls are omitted and barred. Readonly/loading controls
    // retain their successful value but are barred." A barred slider must
    // keep its paint, whatever the pointer or the keyboard does.
    const barred: Array<[string, Partial<Combo>]> = [
      ['disabled', { disabled: true }],
      ['readonly', { readonly: true }],
      ['loading', { loading: true }],
    ];
    for (const [flag, over] of barred) {
      await mount(base({ value: 40, ...over }));
      const before = await page.evaluate(() => (document.getElementById('subject') as any).value);
      await page.evaluate(() => (window as any).matrix.consumeKey('End'));
      await page.evaluate(() => (window as any).matrix.dragThumbTo(1));
      const after = await page.evaluate(() => (document.getElementById('subject') as any).value);
      expect(after, `a ${flag} slider moved`).toBe(before);
    }
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────
//
// Small on purpose. Layer 1 measured the model the browser built; these
// exist because "the fill has a background-color" and "the two halves of the
// track are visibly different colours" are different claims, and only pixels
// can tell them apart.

test.describe('slider visual matrix: marquee pixels', () => {
  test('the filled half is visibly distinct from the unfilled half', async () => {
    await mount(base({ variant: 'primary', value: 50 }));
    const [filledSide, emptySide] = await capture(
      page, '#subject', 'slider-fill-halves',
      `(host) => {
        const sr = host.shadowRoot;
        const track = [...sr.querySelectorAll('[part]')]
          .find(n => (n.getAttribute('part') || '').split(' ').includes('track'));
        const t = track.getBoundingClientRect();
        return [
          { x: t.x + 4, y: t.y + t.height / 2 },
          { x: t.x + t.width - 4, y: t.y + t.height / 2 },
        ];
      }`,
    );
    expect(sameColor(filledSide, emptySide),
      `both halves of the track painted ${filledSide.join(',')}`).toBe(false);
    expect(contrast(filledSide, emptySide),
      `the two halves differ by only ${contrast(filledSide, emptySide).toFixed(2)}:1`).toBeGreaterThan(2);
  });

  test('the knob is visibly distinct from the fill it rides on', async () => {
    await mount(base({ variant: 'danger', value: 50 }));
    const [knobCentre, fillBeside] = await capture(
      page, '#subject', 'slider-knob-on-fill',
      `(host) => {
        const sr = host.shadowRoot;
        const parts = n => [...sr.querySelectorAll('[part]')]
          .find(p => (p.getAttribute('part') || '').split(' ').includes(n));
        const thumb = parts('thumb');
        const track = parts('track');
        const h = thumb.getBoundingClientRect();
        const t = track.getBoundingClientRect();
        return [
          { x: h.x + h.width / 2, y: h.y + h.height / 2 },
          { x: h.x - h.width / 2 - 6, y: t.y + t.height / 2 },
        ];
      }`,
    );
    expect(sameColor(knobCentre, fillBeside),
      `the knob and its fill both painted ${knobCentre.join(',')}`).toBe(false);
  });

  test('a vertical slider fills from the bottom, not the top', async () => {
    await mount(base({ variant: 'success', value: 30, vertical: true }));
    const [nearBottom, nearTop] = await capture(
      page, '#subject', 'slider-vertical-fill',
      `(host) => {
        const sr = host.shadowRoot;
        const track = [...sr.querySelectorAll('[part]')]
          .find(n => (n.getAttribute('part') || '').split(' ').includes('track'));
        const t = track.getBoundingClientRect();
        const x = t.x + t.width / 2;
        return [
          { x, y: t.y + t.height - 4 },
          { x, y: t.y + 4 },
        ];
      }`,
    );
    expect(sameColor(nearBottom, nearTop),
      `the top and bottom of the track both painted ${nearBottom.join(',')}`).toBe(false);
    // 30% of the track painted with the success semantic reads as that
    // colour at the bottom, and as the plain track near the top.
    expect(contrast(nearBottom, nearTop)).toBeGreaterThan(2);
  });
});
