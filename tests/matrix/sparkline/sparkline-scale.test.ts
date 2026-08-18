/**
 * <snice-sparkline> scale and palette matrix.
 *
 * `sparkline-marks.test.ts` crosses the switches that decide WHICH marks exist.
 * This file crosses the ones that decide WHERE and IN WHAT COLOUR they land:
 *
 *   · `color` (five documented values) and `customColor`, which "overrides
 *     color" — a claim about class precedence that decides which `stroke` rule
 *     of equal specificity wins;
 *   · `width` / `height`, which are the SVG canvas AND its viewBox;
 *   · `strokeWidth`, which is the line's stroke and the dots' radius;
 *   · `min` / `max`, "auto-calculated if unset" — the normalisation window, and
 *     the only property that can change the RANKING of the rendered marks
 *     without changing the data.
 */
import { describe, it, afterEach, expect } from 'vitest';
import { expectClean, removeComponent } from '../matrix-kit';
import {
  COLORS, DATASETS, TYPES,
  checkSparkline, dotEls, markTops, mountSparkline, sparklineComboId,
  type SparklineCombo, type SparklineElement,
} from './sparkline-utils';

let el: SparklineElement | null = null;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

describe('sparkline matrix: palette vectors', () => {
  // Every documented colour against every type — the CSS has a separate
  // stroke/fill rule per (colour, mark) pair, so a missing one is invisible
  // until exactly that combination is asked for.
  for (const type of TYPES) {
    for (const color of COLORS) {
      const combo: SparklineCombo = {
        type, color, data: DATASETS.rising, showDots: true, showArea: true,
      };
      it(`renders ${sparklineComboId(combo)}`, async () => {
        el = await mountSparkline(combo);
        expectClean(checkSparkline(el, combo), sparklineComboId(combo));
      });
    }
  }

  // "customColor — overrides color". Crossed against a NON-default `color` in
  // every type, because "overrides" is only observable when there is something
  // to override.
  for (const type of TYPES) {
    for (const customColor of ['#9333ea', 'rgb(147, 51, 234)', 'var(--brand)']) {
      const combo: SparklineCombo = {
        type, color: 'danger', customColor, data: DATASETS.rising, showDots: true,
      };
      it(`renders ${sparklineComboId(combo)}`, async () => {
        el = await mountSparkline(combo);
        expectClean(checkSparkline(el, combo), sparklineComboId(combo));
      });
    }
  }

  it('clearing customColor returns the chart to its palette colour', async () => {
    el = await mountSparkline({ type: 'line', color: 'success', customColor: '#9333ea', data: DATASETS.rising });
    el.customColor = undefined;
    await new Promise(resolve => setTimeout(resolve, 30));
    expectClean(
      checkSparkline(el, { type: 'line', color: 'success', data: DATASETS.rising }),
      'custom-color/cleared',
    );
  });
});

describe('sparkline matrix: canvas size', () => {
  // The documented defaults are 100x30; the doc's own examples use 150x40.
  const SIZES: Array<[number | undefined, number | undefined]> = [
    [undefined, undefined], [150, 40], [40, 12], [400, 120], [100, 100],
  ];
  for (const type of TYPES) {
    for (const [width, height] of SIZES) {
      const combo: SparklineCombo = { type, width, height, data: DATASETS.rising, showDots: true };
      it(`renders ${sparklineComboId(combo)} at ${width ?? 100}x${height ?? 30}`, async () => {
        el = await mountSparkline(combo);
        expectClean(checkSparkline(el, combo), sparklineComboId(combo));
      });
    }
  }

  it('every mark stays inside the documented viewBox', async () => {
    // The canvas IS the viewBox, so a mark outside it is clipped away — which
    // is the failure a census-only oracle cannot see.
    for (const type of TYPES) {
      const width = 150;
      const height = 40;
      const chart = await mountSparkline({
        type, width, height, data: DATASETS.rising, showDots: true, showArea: true,
      });
      const tops = markTops(chart, type);
      for (const [i, top] of tops.entries()) {
        expect(top, `${type} mark[${i}] y=${top} is outside 0..${height}`)
          .toBeGreaterThanOrEqual(0);
        expect(top, `${type} mark[${i}] y=${top} is outside 0..${height}`)
          .toBeLessThanOrEqual(height);
      }
      removeComponent(chart);
    }
  });
});

describe('sparkline matrix: stroke width', () => {
  // `strokeWidth` is documented as one property with two consumers: the line's
  // stroke and the dot's radius.
  for (const strokeWidth of [1, 2, 3, 6]) {
    for (const smooth of [false, true]) {
      const combo: SparklineCombo = {
        type: 'line', strokeWidth, smooth, showDots: true, data: DATASETS.rising,
      };
      it(`renders ${sparklineComboId(combo)} at stroke-width ${strokeWidth}`, async () => {
        el = await mountSparkline(combo);
        expectClean(checkSparkline(el, combo), sparklineComboId(combo));
        expect(dotEls(el).every(dot => dot.getAttribute('r') === String(strokeWidth))).toBe(true);
      });
    }
  }

  it('a bar chart ignores stroke-width — bars have no stroke', async () => {
    el = await mountSparkline({ type: 'bar', strokeWidth: 6, data: DATASETS.rising });
    const bars = el.shadowRoot!.querySelectorAll('[part~="bar"]');
    expect([...bars].every(bar => !bar.hasAttribute('stroke-width'))).toBe(true);
  });
});

describe('sparkline matrix: min / max', () => {
  // "auto-calculated if unset": each of the four settings is a different
  // normalisation window, crossed with the types that consume it.
  const RANGES: Array<{ min?: number; max?: number }> = [
    {}, { min: 0 }, { max: 100 }, { min: 0, max: 100 },
    { min: 15, max: 25 }, { min: -20, max: 20 },
  ];
  const RANGE_COMBOS: Array<{ dataset: string; combo: SparklineCombo }> = TYPES.flatMap(type =>
    RANGES.flatMap(range =>
      (['rising', 'falling', 'negative'] as const).map(dataset => ({
        dataset,
        combo: { type, data: DATASETS[dataset], showDots: true, ...range } as SparklineCombo,
      })),
    ),
  );

  /**
   * MATRIX-sparkline-3 (fixed): a datum below an explicit `min` no longer
   * produces a negative rect height; every combo is asserted outright.
   */
  for (const { dataset, combo } of RANGE_COMBOS) {
    it(`renders ${dataset} ${sparklineComboId(combo)}`, async () => {
      el = await mountSparkline(combo);
      expectClean(checkSparkline(el, combo), `${dataset}/${sparklineComboId(combo)}`);
    });
  }

  // MATRIX-sparkline-3 (fixed): an under-range bar keeps its unclamped `y` (so
  // out-of-window data still ranks) but its height is clamped to >= 0 — a
  // negative height is an SVG error that paints nothing.
  it('MATRIX-sparkline-3 (fixed): an under-range datum draws a non-negative bar', async () => {
    el = await mountSparkline({ type: 'bar', data: [10, 20, 30], min: 15, height: 30 });
    const bars = [...el.shadowRoot!.querySelectorAll('[part~="bar"]')];
    expect(parseFloat(bars[0].getAttribute('height')!)).toBeGreaterThanOrEqual(0);
    expect(parseFloat(bars[0].getAttribute('y')!)).toBeGreaterThan(30);
    // The other two are fine, which is what made the gap silent rather than
    // an obviously broken chart.
    expect(parseFloat(bars[1].getAttribute('height')!)).toBeGreaterThan(0);
  });

  it('the line branch clips an under-range datum instead of inverting it', async () => {
    // The same series on a line chart places the point BELOW the canvas and
    // lets the viewBox clip it — a defensible reading of an out-of-range value,
    // and the contrast that makes the bar branch's negative height a defect.
    el = await mountSparkline({ type: 'line', data: [10, 20, 30], min: 15, height: 30, showDots: true });
    const tops = markTops(el, 'line');
    expect(tops.every(Number.isFinite)).toBe(true);
    expect(tops[0], 'the under-range point was not pushed below the canvas').toBeGreaterThan(30);
  });

  it('an explicit min lifts the smallest datum off the floor', async () => {
    // With `min` unset the series minimum sits at the very bottom; with a lower
    // `min` it must move UP, because the window it is normalised into grew.
    const data = [10, 20, 30];
    const auto = await mountSparkline({ type: 'line', data, showDots: true });
    const autoBottom = Math.max(...markTops(auto, 'line'));
    removeComponent(auto);

    el = await mountSparkline({ type: 'line', data, min: 0, showDots: true });
    const explicitBottom = Math.max(...markTops(el, 'line'));
    expect(explicitBottom,
      `min=0 left the lowest point at ${explicitBottom}, no higher than the auto ${autoBottom}`)
      .toBeLessThan(autoBottom);
  });

  it('an explicit max pulls the largest datum down from the ceiling', async () => {
    const data = [10, 20, 30];
    const auto = await mountSparkline({ type: 'line', data, showDots: true });
    const autoTop = Math.min(...markTops(auto, 'line'));
    removeComponent(auto);

    el = await mountSparkline({ type: 'line', data, max: 100, showDots: true });
    const explicitTop = Math.min(...markTops(el, 'line'));
    expect(explicitTop,
      `max=100 left the highest point at ${explicitTop}, no lower than the auto ${autoTop}`)
      .toBeGreaterThan(autoTop);
  });

  it('a flat series survives max === min without dividing by zero', async () => {
    // Every value equal means the normalisation denominator is 0. The chart
    // must still render finite coordinates — a NaN here erases the whole chart.
    for (const type of TYPES) {
      const chart = await mountSparkline({ type, data: DATASETS.flat, showDots: true });
      expectClean(
        checkSparkline(chart, { type, data: DATASETS.flat, showDots: true }),
        `${type}/flat-series`,
      );
      expect(markTops(chart, type).every(Number.isFinite),
        `${type} produced a non-finite coordinate for an all-equal series`).toBe(true);
      removeComponent(chart);
    }
  });

  it('an explicit min === max is the same degenerate window', async () => {
    for (const type of TYPES) {
      const chart = await mountSparkline({
        type, data: DATASETS.rising, min: 20, max: 20, showDots: true,
      });
      expect(markTops(chart, type).every(Number.isFinite),
        `${type} produced a non-finite coordinate for min === max`).toBe(true);
      removeComponent(chart);
    }
  });
});

describe('sparkline matrix: reassignment', () => {
  it('assigning a new series replaces the marks rather than appending them', async () => {
    el = await mountSparkline({ type: 'bar', data: DATASETS.rising });
    expect(el.shadowRoot!.querySelectorAll('[part~="bar"]').length).toBe(5);
    el.data = DATASETS.pair;
    await new Promise(resolve => setTimeout(resolve, 30));
    expectClean(checkSparkline(el, { type: 'bar', data: DATASETS.pair }), 'bar/reassigned');
  });

  it('emptying the series clears the chart back to its empty state', async () => {
    el = await mountSparkline({ type: 'line', data: DATASETS.rising, showDots: true });
    el.data = [];
    await new Promise(resolve => setTimeout(resolve, 30));
    expectClean(
      checkSparkline(el, { type: 'line', data: [], showDots: true }),
      'line/emptied',
    );
  });

  it('switching type swaps the mark family entirely', async () => {
    el = await mountSparkline({ type: 'line', data: DATASETS.rising, showDots: true });
    el.type = 'bar';
    await new Promise(resolve => setTimeout(resolve, 30));
    expectClean(
      checkSparkline(el, { type: 'bar', data: DATASETS.rising, showDots: true }),
      'line->bar',
    );
  });
});
