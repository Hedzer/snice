/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-range-slider TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/range-slider, `npm run test:matrix`) owns the
 * arithmetic: the min-based step lattice, ordering, clamping, the keyboard
 * table, the nearest-thumb rule, and the component's own half of the form
 * contract. Two whole categories of this component's documentation are
 * nevertheless invisible to it:
 *
 *  1. WHERE THE THUMBS ARE. A range slider is a picture of two numbers. The
 *     component paints that picture with `left: <pct>%` / `bottom: <pct>%` and
 *     a `[part="range"]` bar spanning the gap; happy-dom resolves no
 *     percentage and lays out no box, so a slider that draws both thumbs on
 *     top of each other passes every DOM assertion ever written.
 *
 *  2. THE FORM PLATFORM. `new FormData(form)`, `form.reset()` and
 *     `<fieldset disabled>` are the browser's algorithms, and happy-dom
 *     implements none of them for a form-associated custom element — which is
 *     why the DOM tier records `setFormValue` calls through
 *     `tests/matrix/internals-mock.ts` and why that file's own header sends
 *     the real thing here. This spec runs it in a real engine: a real form, a
 *     real submit button, a real fieldset.
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   · both thumbs and the track have real, visible boxes inside the host;
 *   · each thumb's CENTRE sits at its value's fraction of the track, in the
 *     axis the orientation names — the picture agrees with the number;
 *   · the range bar spans exactly from the low thumb to the high thumb;
 *   · the thumbs never cross, and the low thumb is never past the high one;
 *   · the min/max labels are painted only when `show-labels` says so, at the
 *     two ends, and the tooltips only when `show-tooltip` says so;
 *   · both thumbs survive a hit test through the shadow boundary.
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   The selected range has to LOOK selected: the bar between the thumbs must
 *   paint a colour the unselected track does not, and a disabled slider must
 *   look disabled. Decoded in-browser.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, contrast, sameColor } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/range-slider/matrix.html';

type Orientation = 'horizontal' | 'vertical';

interface Box {
  x: number; y: number; width: number; height: number;
  top: number; left: number; right: number; bottom: number;
}

interface Geometry {
  mounted: boolean;
  host: Box;
  track: Box | null;
  rangeBar: Box | null;
  low: Box | null;
  high: Box | null;
  labelMin: Box | null;
  labelMax: Box | null;
  lowTooltip: string | null;
  highTooltip: string | null;
  valueLow: number;
  valueHigh: number;
}

interface Combo {
  id: string;
  min: number; max: number; step: number;
  valueLow: number; valueHigh: number;
  orientation: Orientation;
  showTooltip: boolean;
  showLabels: boolean;
  disabled: boolean;
}

/** The scales whose geometry differs: a plain span, a negative min, a coarse step. */
const SCALES: Array<[number, number, number]> = [
  [0, 100, 1],
  [-50, 50, 10],
  [0, 1000, 25],
];

/** Endpoint pairs that put the thumbs in materially different places. */
const PAIRS: Array<[number, number]> = [
  [0, 100],     // both ends
  [25, 75],     // symmetric
  [0, 25],      // both left
  [75, 100],    // both right
  [50, 50],     // coincident: the hardest picture to draw
];

/**
 * scale (3) x endpoint pair (5) x orientation (2) x presentation (2: bare and
 * tooltip+labels) = 60 combos.
 *
 * The pair axis is the point of the tier — it is what moves the thumbs — and
 * the scale axis exists because a percentage computed from the wrong origin
 * (a negative `min`, a span of 1000) lands in exactly the right place for
 * `[0..100]` and nowhere else.
 */
function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  for (const [min, max, step] of SCALES) {
    for (const [lowPct, highPct] of PAIRS) {
      const valueLow = min + ((max - min) * lowPct) / 100;
      const valueHigh = min + ((max - min) * highPct) / 100;
      for (const orientation of ['horizontal', 'vertical'] as Orientation[]) {
        for (const decorated of [false, true]) {
          combos.push({
            id: `[${min}..${max}/${step}] ${lowPct}%-${highPct}% ${orientation}`
              + `${decorated ? ' +tooltip+labels' : ''}`,
            min, max, step, valueLow, valueHigh, orientation,
            showTooltip: decorated,
            showLabels: decorated,
            disabled: false,
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

/** Where a value sits on its scale, as a fraction. The oracle's own arithmetic. */
const fractionOf = (value: number, min: number, max: number) =>
  max > min ? (value - min) / (max - min) : 0;

/**
 * LAYER 1: every documented consequence of one combo's GEOMETRY.
 *
 * Run test-side on plain boxes rather than inside the page, so the expected
 * position is computed from the documented scale and never from anything the
 * component says about itself.
 */
function geometryProblems(combo: Combo, g: Geometry): string[] {
  const problems: string[] = [];
  const say = (m: string) => problems.push(m);

  if (!g.mounted) { say('nothing mounted'); return problems; }
  const { track, rangeBar, low, high } = g;
  if (!track) { say('no [part="track"]'); return problems; }
  if (!rangeBar) { say('no [part="range"]'); return problems; }
  if (!low || !high) { say('a thumb is missing'); return problems; }

  for (const [name, box] of [['track', track], ['thumb-low', low],
    ['thumb-high', high]] as [string, Box][]) {
    if (box.width <= 0 || box.height <= 0) {
      say(`[part="${name}"] renders at ${box.width.toFixed(1)}x${box.height.toFixed(1)}`);
    }
  }

  const vertical = combo.orientation === 'vertical';
  const trackLength = vertical ? track.height : track.width;
  if (trackLength < 50) {
    say(`the ${combo.orientation} track is only ${trackLength.toFixed(1)}px long`);
  }

  // ── Each thumb's centre sits at its value's fraction of the track ────────
  //
  // Tolerance is 2px: the thumb is centred on its percentage by a translate,
  // and sub-pixel rounding is the browser's business, not the component's.
  const centreOf = (box: Box) => (vertical
    ? track.bottom - (box.top + box.height / 2)
    : (box.left + box.width / 2) - track.left);
  for (const [name, box, value] of [['low', low, g.valueLow],
    ['high', high, g.valueHigh]] as [string, Box, number][]) {
    const want = fractionOf(value, combo.min, combo.max) * trackLength;
    const got = centreOf(box);
    if (Math.abs(got - want) > 2) {
      say(`the ${name} thumb (value ${value}) sits ${got.toFixed(1)}px along a`
        + ` ${trackLength.toFixed(1)}px track; its value is ${want.toFixed(1)}px`);
    }
  }

  // ── The thumbs never cross ──────────────────────────────────────────────
  if (vertical) {
    if (high.top > low.top + 1) say('the high thumb is painted below the low thumb');
  } else if (low.left > high.left + 1) {
    say('the low thumb is painted right of the high thumb');
  }

  // ── The range bar spans exactly the gap between the two thumbs ──────────
  const lowFraction = fractionOf(g.valueLow, combo.min, combo.max);
  const highFraction = fractionOf(g.valueHigh, combo.min, combo.max);
  const wantSpan = (highFraction - lowFraction) * trackLength;
  const gotSpan = vertical ? rangeBar.height : rangeBar.width;
  if (Math.abs(gotSpan - wantSpan) > 2) {
    say(`the range bar spans ${gotSpan.toFixed(1)}px; the selected range is`
      + ` ${wantSpan.toFixed(1)}px of the track`);
  }
  const barStart = vertical ? track.bottom - rangeBar.bottom : rangeBar.left - track.left;
  if (Math.abs(barStart - lowFraction * trackLength) > 2) {
    say(`the range bar starts ${barStart.toFixed(1)}px along the track; the low`
      + ` endpoint is at ${(lowFraction * trackLength).toFixed(1)}px`);
  }

  // ── Tooltips and labels appear exactly when they are asked for ──────────
  if (combo.showTooltip) {
    if (g.lowTooltip !== String(g.valueLow)) {
      say(`the low tooltip reads "${g.lowTooltip}", expected "${g.valueLow}"`);
    }
    if (g.highTooltip !== String(g.valueHigh)) {
      say(`the high tooltip reads "${g.highTooltip}", expected "${g.valueHigh}"`);
    }
  } else if (g.lowTooltip !== null || g.highTooltip !== null) {
    say('tooltips are painted without show-tooltip');
  }

  if (combo.showLabels) {
    if (!g.labelMin || !g.labelMax) say('show-labels is set but a label part is missing');
    else {
      for (const [name, box] of [['label-min', g.labelMin],
        ['label-max', g.labelMax]] as [string, Box][]) {
        if (box.width <= 0 || box.height <= 0) {
          say(`[part="${name}"] renders at ${box.width.toFixed(1)}x${box.height.toFixed(1)}`);
        }
      }
      // The two bounds are drawn at the two ends, not on top of each other.
      if (g.labelMin.right > g.labelMax.left + 1) {
        say(`[part="label-min"] (right ${g.labelMin.right.toFixed(1)}) overlaps`
          + ` [part="label-max"] (left ${g.labelMax.left.toFixed(1)})`);
      }
    }
  } else if (g.labelMin || g.labelMax) {
    say('a label part is painted without show-labels');
  }

  return problems;
}

const combos = generateCombos();

test.describe('range-slider visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      const g: Geometry = await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      expect(geometryProblems(combo, g), `combo ${combo.id}`).toEqual([]);

      // Both thumbs are reachable: whatever paints on top of a thumb would
      // take the pointer that is supposed to drag it.
      for (const which of ['low', 'high'] as const) {
        const box = g[which]!;
        const hit = await page.evaluate(({ x, y }) => {
          const node = document.elementFromPoint(x, y);
          return node ? node.tagName.toLowerCase() : 'nothing';
        }, { x: box.left + box.width / 2, y: box.top + box.height / 2 });
        expect(hit, `combo ${combo.id}: the ${which} thumb is covered`)
          .toBe('snice-range-slider');
      }
    });
  }
});

// ── The picture follows the interaction ─────────────────────────────────────

test.describe('range-slider visual matrix: the picture follows the value', () => {
  const base = { min: 0, max: 100, step: 5, valueLow: 20, valueHigh: 80 };

  test('an arrow key moves the thumb it is pressed on, and only that one', async () => {
    const before: Geometry = await page.evaluate(c => (window as any).matrix.mount(c),
      { ...base, orientation: 'horizontal' } as any);
    const after: Geometry = await page.evaluate(() =>
      (window as any).matrix.pressKey('low', 'ArrowRight'));

    expect(after.valueLow, 'the low endpoint did not move by one step').toBe(25);
    expect(after.low!.left, 'the low thumb did not move right')
      .toBeGreaterThan(before.low!.left);
    expect(Math.round(after.high!.left), 'the high thumb moved too')
      .toBe(Math.round(before.high!.left));
    expect(geometryProblems({ ...base, id: 'after key', orientation: 'horizontal',
      showTooltip: false, showLabels: false, disabled: false }, after)).toEqual([]);
  });

  test('a press on the track moves the nearer thumb to where the pointer landed', async () => {
    await page.evaluate(c => (window as any).matrix.mount(c),
      { ...base, orientation: 'horizontal' } as any);
    const after: Geometry = await page.evaluate(() => (window as any).matrix.pressTrack(0.9));

    expect(after.valueHigh, 'the high thumb did not follow the press').toBe(90);
    expect(after.valueLow, 'the low thumb moved instead').toBe(20);
    expect(geometryProblems({ ...base, id: 'after track press', orientation: 'horizontal',
      showTooltip: false, showLabels: false, disabled: false }, after)).toEqual([]);
  });

  test('the host focus() lands on the low thumb', async () => {
    await page.evaluate(c => (window as any).matrix.mount(c),
      { ...base, orientation: 'horizontal' } as any);
    expect(await page.evaluate(() => (window as any).matrix.focusHost())).toBe('thumb-low');
  });

  test('a disabled slider does not move under either input', async () => {
    const before: Geometry = await page.evaluate(c => (window as any).matrix.mount(c),
      { ...base, orientation: 'horizontal', disabled: true } as any);
    await page.evaluate(() => (window as any).matrix.pressKey('low', 'ArrowRight'));
    const after: Geometry = await page.evaluate(() => (window as any).matrix.pressTrack(0.9));
    expect({ low: after.valueLow, high: after.valueHigh })
      .toEqual({ low: before.valueLow, high: before.valueHigh });
  });
});

// ── The form platform, in a real engine ─────────────────────────────────────
//
// This is the half of `docs/ai/components/range-slider.md` § Value and form
// lifecycle that happy-dom cannot run at all.

test.describe('range-slider visual matrix: the real form platform', () => {
  const base = { min: 0, max: 100, step: 5, valueLow: 20, valueHigh: 80,
    orientation: 'horizontal' as Orientation };

  test('a named range contributes one "low,high" string to a real FormData', async () => {
    await page.evaluate(c => (window as any).matrix.mount(c), base as any);
    expect(await page.evaluate(() => (window as any).matrix.formEntries())).toEqual(['20,80']);
    expect(await page.evaluate(() => (window as any).matrix.formElementsHasSubject()),
      'the range is not listed in form.elements').toBe(true);

    await page.evaluate(() => (window as any).matrix.pressKey('low', 'ArrowRight'));
    expect(await page.evaluate(() => (window as any).matrix.formEntries()),
      'the submitted value did not follow the endpoint').toEqual(['25,80']);
  });

  test('form.reset() restores both defaults and repaints the thumbs', async () => {
    const start: Geometry = await page.evaluate(c => (window as any).matrix.mount(c), base as any);
    await page.evaluate(() => (window as any).matrix.pressTrack(0.9));
    const reset: Geometry = await page.evaluate(() => (window as any).matrix.reset());

    expect({ low: reset.valueLow, high: reset.valueHigh }).toEqual({ low: 20, high: 80 });
    expect(Math.round(reset.high!.left), 'the high thumb did not go back where it started')
      .toBe(Math.round(start.high!.left));
    expect(await page.evaluate(() => (window as any).matrix.formEntries())).toEqual(['20,80']);
  });

  test('a real <fieldset disabled> omits and bars the range, and gives it back', async () => {
    await page.evaluate(c => (window as any).matrix.mount(c), base as any);
    await page.evaluate(() => (window as any).matrix.setFieldsetDisabled(true));

    expect(await page.evaluate(() => (window as any).matrix.formEntries()),
      'a fieldset-disabled range was still submitted').toEqual([]);
    expect((await page.evaluate(() => (window as any).matrix.formValidity())).willValidate,
      'a fieldset-disabled range still validates').toBe(false);
    const frozen: Geometry = await page.evaluate(() =>
      (window as any).matrix.pressKey('low', 'ArrowRight'));
    expect(frozen.valueLow, 'a fieldset-disabled range moved on a key press').toBe(20);

    await page.evaluate(() => (window as any).matrix.setFieldsetDisabled(false));
    expect(await page.evaluate(() => (window as any).matrix.formEntries()),
      'the range did not come back when the fieldset was enabled').toEqual(['20,80']);
  });

  test('a custom error blocks real form validation and clears again', async () => {
    await page.evaluate(c => (window as any).matrix.mount(c), base as any);
    await page.evaluate(() => (window as any).matrix.setCustomValidity('pick a narrower span'));

    const invalid = await page.evaluate(() => (window as any).matrix.formValidity());
    expect(invalid.control, 'the range reported itself valid with a custom error').toBe(false);
    expect(invalid.form, 'the form validated with an invalid range in it').toBe(false);
    expect(invalid.message).toBe('pick a narrower span');

    await page.evaluate(() => (window as any).matrix.setCustomValidity(''));
    const valid = await page.evaluate(() => (window as any).matrix.formValidity());
    expect(valid.control).toBe(true);
    expect(valid.form).toBe(true);
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────

test.describe('range-slider visual matrix: marquee pixels', () => {
  const base = { min: 0, max: 100, step: 5, valueLow: 30, valueHigh: 70,
    orientation: 'horizontal' as Orientation };

  test('the selected range paints a colour the rest of the track does not', async () => {
    await page.evaluate(c => (window as any).matrix.mount(c), base as any);
    const [selected, unselected] = await capture(
      page, 'body', 'range-slider-range-bar',
      `() => {
        const sr = document.getElementById('subject').shadowRoot;
        const track = sr.querySelector('[part="track"]').getBoundingClientRect();
        const bar = sr.querySelector('[part="range"]').getBoundingClientRect();
        return [
          // Inside the selected span, clear of both thumbs…
          { x: bar.x + bar.width / 2, y: bar.y + bar.height / 2 },
          // …and on the track beyond the high thumb.
          { x: track.right - 4, y: track.y + track.height / 2 },
        ];
      }`,
    );
    expect(sameColor(selected, unselected),
      `the selected range painted ${selected.join(',')}, the same as the empty track`)
      .toBe(false);
    expect(contrast(selected, unselected),
      `selected-vs-empty contrast is ${contrast(selected, unselected).toFixed(2)}:1`)
      .toBeGreaterThan(1.1);
  });

  test('a disabled slider paints a quieter range than an enabled one', async () => {
    const probe = `() => {
      const sr = document.getElementById('subject').shadowRoot;
      const bar = sr.querySelector('[part="range"]').getBoundingClientRect();
      return [{ x: bar.x + bar.width / 2, y: bar.y + bar.height / 2 }];
    }`;
    await page.evaluate(c => (window as any).matrix.mount(c), base as any);
    const [enabled] = await capture(page, 'body', 'range-slider-enabled', probe);

    await page.evaluate(c => (window as any).matrix.mount(c), { ...base, disabled: true } as any);
    const [disabled] = await capture(page, 'body', 'range-slider-disabled', probe);

    expect(sameColor(enabled, disabled),
      `the disabled range painted ${disabled.join(',')}, identical to the enabled one`)
      .toBe(false);
  });
});
