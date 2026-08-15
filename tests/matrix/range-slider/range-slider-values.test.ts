/**
 * Matrix slice RANGE-SLIDER / VALUES — the documented lattice and the
 * documented presentation switches.
 *
 * Contract (docs/ai/components/range-slider.md § Value and form lifecycle):
 *   "Live endpoints are independent from authored `value-low`/`value-high`
 *    defaults. They are ordered, clamped, and snapped to a `min`-based step
 *    lattice; invalid steps fall back to `1`."
 *
 * Dimensions: (min, max, step) configuration (7) x authored endpoint pair (8)
 * = 56 lattice combos, plus a presentation cross (orientation x showTooltip x
 * showLabels x disabled = 16) and the invalid-step cases.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { mount, unmountAll, product } from '../matrix-utils';
import {
  ORIENTATIONS, range, attrsOf, comboId, rangeProblems, read, normalize,
  normalizePair, effectiveStep, expectedInitial, assignLowThenHigh, type RangeCombo,
} from './range-slider-support';

const mountRange = (c: RangeCombo) => mount<HTMLElement>('snice-range-slider', attrsOf(c));

/** The (min, max, step) shapes the lattice rule distinguishes. */
const SCALES: Array<[number, number, number]> = [
  [0, 100, 1],
  [0, 100, 5],
  [0, 100, 7],      // a step that does not divide the span
  [0, 1000, 25],
  [-50, 50, 10],    // a negative min, so "min-based" has teeth
  [10, 20, 2],      // a min that is not zero
  [0, 1, 0.25],     // a fractional step
];

/** Authored endpoint pairs, including inverted and out-of-range ones. */
const PAIRS: Array<[number, number]> = [
  [0, 100],
  [20, 80],
  [33, 67],
  [80, 20],         // inverted: "ordered" must fix it
  [-999, 999],      // both out of range: "clamped"
  [50, 50],         // degenerate: a single point
  [3, 4],           // adjacent, likely off-lattice
  [0, 0],
];

describe('range-slider matrix: values', () => {
  afterEach(() => unmountAll());

  // ── The lattice ──────────────────────────────────────────────────────────

  for (const point of product({ scale: SCALES, pair: PAIRS })) {
    const [min, max, step] = point.scale;
    const [low, high] = point.pair;
    const c = range({ min, max, step, defaultValueLow: low, defaultValueHigh: high });

    it(comboId(c), async () => {
      const el = await mountRange(c);
      expect(rangeProblems(el, c), `combo ${comboId(c)}`).toEqual([]);

      // Spelled out again, so a wrong oracle cannot hide behind itself.
      const want = normalizePair(low, high, min, max, step);
      expect((el as any).valueLow, comboId(c)).toBe(want.low);
      expect((el as any).valueHigh, comboId(c)).toBe(want.high);
      expect(want.low, 'the documented pair is ordered').toBeLessThanOrEqual(want.high);
    });
  }

  // ── "invalid steps fall back to 1" ───────────────────────────────────────

  for (const step of [0, -1, -5, NaN, Infinity]) {
    it(`step=${step} falls back to a step of 1`, async () => {
      const c = range({ min: 0, max: 10, step, defaultValueLow: 3.4, defaultValueHigh: 7.6 });
      const el = await mountRange(c);

      expect(effectiveStep(step)).toBe(1);
      expect((el as any).valueLow, `step=${step}`).toBe(normalize(3.4, 0, 10, 1));
      expect((el as any).valueHigh, `step=${step}`).toBe(normalize(7.6, 0, 10, 1));
      expect(rangeProblems(el, c), `step=${step}`).toEqual([]);
    });
  }

  // ── Assignment goes through the same lattice ─────────────────────────────

  for (const point of product({
    scale: [SCALES[1], SCALES[4]],
    assign: [[10, 90], [90, 10], [-5, 500], [3, 4]] as Array<[number, number]>,
  })) {
    const [min, max, step] = point.scale;
    const [low, high] = point.assign;
    const id = `assigning ${low},${high} on [${min}..${max}/${step}]`;

    it(id, async () => {
      const c = range({ min, max, step });
      const el = await mountRange(c);

      (el as any).valueLow = low;
      (el as any).valueHigh = high;
      await (el as any).rendered;

      // Two assignments are two operations: each endpoint is ordered against
      // the other AS IT LANDS.
      const want = assignLowThenHigh(expectedInitial(c), low, high, min, max, step);
      expect((el as any).valueLow, id).toBe(want.low);
      expect((el as any).valueHigh, id).toBe(want.high);
      expect(rangeProblems(el, c, want), id).toEqual([]);
    });
  }

  it('a non-finite assignment is ignored', async () => {
    const c = range({ defaultValueLow: 20, defaultValueHigh: 80 });
    const el = await mountRange(c);

    (el as any).valueLow = NaN;
    (el as any).valueHigh = Infinity;
    await (el as any).rendered;

    expect(rangeProblems(el, c, { low: 20, high: 80 })).toEqual([]);
  });

  it('the live endpoints are independent of the authored defaults', async () => {
    // The doc's first sentence: assigning does not rewrite `value-low`/`value-high`.
    const c = range({ defaultValueLow: 20, defaultValueHigh: 80 });
    const el = await mountRange(c);

    (el as any).valueLow = 40;
    (el as any).valueHigh = 60;
    await (el as any).rendered;

    expect((el as any).defaultValueLow, 'the authored default was rewritten').toBe(20);
    expect((el as any).defaultValueHigh, 'the authored default was rewritten').toBe(80);
    expect(el.getAttribute('value-low')).toBe('20');
    expect(el.getAttribute('value-high')).toBe('80');
  });

  // ── Presentation ─────────────────────────────────────────────────────────

  for (const point of product({
    orientation: ORIENTATIONS,
    showTooltip: [false, true],
    showLabels: [false, true],
    disabled: [false, true],
  })) {
    const c = range({ ...point, defaultValueLow: 20, defaultValueHigh: 80 });

    it(comboId(c), async () => {
      const el = await mountRange(c);
      expect(rangeProblems(el, c), `combo ${comboId(c)}`).toEqual([]);
    });
  }

  it('the label parts report the documented bounds, not the values', async () => {
    const c = range({ min: -20, max: 250, showLabels: true, defaultValueLow: 0, defaultValueHigh: 100 });
    const el = await mountRange(c);
    expect(read(el).labelMin).toBe('-20');
    expect(read(el).labelMax).toBe('250');
    expect(rangeProblems(el, c)).toEqual([]);
  });

  it('the tooltips follow the live endpoints', async () => {
    const c = range({ showTooltip: true, step: 5, defaultValueLow: 20, defaultValueHigh: 80 });
    const el = await mountRange(c);
    expect(read(el).low.tooltip).toBe('20');

    (el as any).valueLow = 35;
    await (el as any).rendered;

    expect(read(el).low.tooltip).toBe('35');
    expect(rangeProblems(el, c, { low: 35, high: 80 })).toEqual([]);
  });

  // ── Degenerate scales ────────────────────────────────────────────────────

  it('a zero-width scale collapses both endpoints onto it', async () => {
    const c = range({ min: 50, max: 50, defaultValueLow: 0, defaultValueHigh: 100 });
    const el = await mountRange(c);
    expect(rangeProblems(el, c, { low: 50, high: 50 })).toEqual([]);
  });

  it('an inverted scale is not a scale a value can sit outside of', async () => {
    const c = range({ min: 80, max: 20, defaultValueLow: 0, defaultValueHigh: 100 });
    const el = await mountRange(c);
    const want = expectedInitial(c);
    expect((el as any).valueLow).toBe(want.low);
    expect((el as any).valueHigh).toBe(want.high);
  });
});
