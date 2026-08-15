/**
 * Smoke slice of the snice-sparkline matrix — the everyday-loop tier.
 *
 * The full matrix (tests/matrix/sparkline, 308 combos across marks
 * and scale) is excluded from the default Vitest include and runs via
 * `npm run test:matrix`. This file lives at `smoke.test.ts` so it stays
 * collected, and it is the standing cost the everyday loop pays for this
 * component.
 *
 * Marquee combos only — one per branch of the SVG builder:
 *   · a line, the default;
 *   · a bar chart, which shares NO code with the line branch;
 *   · an area with dots and a smooth spline, the three switches at once;
 *   · a custom colour, the documented override;
 *   · an explicit min/max window, the only property that moves the marks
 *     without changing the data;
 *   · the empty series, the state with no `data[0]` to normalise against;
 *   · the three pinned findings.
 *
 * Every assertion routes through the matrix's own oracle, so this file cannot
 * drift into something weaker than the suite it stands in for.
 * BUDGET: well under 1s. New combinations belong in the matrix, not here.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { expectClean, removeComponent } from '../matrix-kit';
import {
  DATASETS, checkSparkline, markTops, mountSparkline, sparklineComboId,
  type SparklineCombo, type SparklineElement,
} from './sparkline-utils';

let el: SparklineElement | null = null;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

async function check(combo: SparklineCombo) {
  el = await mountSparkline(combo);
  expectClean(checkSparkline(el, combo), sparklineComboId(combo));
}

describe('sparkline matrix smoke', () => {
  it('a default line chart draws one polyline that ranks the series', async () => {
    await check({ type: 'line', data: DATASETS.rising });
  });

  it('a bar chart draws one non-overlapping rect per point', async () => {
    await check({ type: 'bar', data: DATASETS.rising, color: 'success' });
  });

  it('smooth + show-dots + area draw a path, an area path and one dot per point', async () => {
    await check({
      type: 'area', data: DATASETS.rising, smooth: true, showDots: true, showArea: true,
      strokeWidth: 3, width: 150, height: 40,
    });
  });

  it('custom-color overrides the palette class and sets the CSS variable', async () => {
    await check({ type: 'line', color: 'danger', customColor: '#9333ea', data: DATASETS.rising });
  });

  it('an explicit min/max window re-ranks nothing but moves every mark', async () => {
    await check({ type: 'line', data: DATASETS.rising, min: 0, max: 100, showDots: true });
  });

  it('an empty series draws no marks and announces itself as empty', async () => {
    await check({ type: 'line', data: [], showDots: true, showArea: true });
  });

  it('an all-equal series survives the zero-width normalisation window', async () => {
    await check({ type: 'bar', data: DATASETS.flat });
    expect(markTops(el!, 'bar').every(Number.isFinite)).toBe(true);
  });

  // MATRIX-sparkline-1: a one-point series with `smooth` renders an empty `d`.
  it.fails('MATRIX-sparkline-1: a smooth one-point line still draws its line', async () => {
    await check({ type: 'line', data: [42], smooth: true });
  });

  // MATRIX-sparkline-2: a one-point series without `smooth` puts NaN in x.
  it.fails('MATRIX-sparkline-2: a one-point line places its point', async () => {
    await check({ type: 'line', data: [42], showDots: true });
  });

  // MATRIX-sparkline-3: a datum below an explicit `min` gives a bar a negative
  // height, which is an error in SVG — the bar paints nothing.
  it.fails('MATRIX-sparkline-3: an under-range bar still draws', async () => {
    await check({ type: 'bar', data: [10, 20, 30], min: 15 });
  });

  it('the three findings reproduce exactly as recorded', async () => {
    const smoothSingle = await mountSparkline({ type: 'line', data: [42], smooth: true });
    expect(smoothSingle.shadowRoot!.querySelector('[part~="line"]')!.getAttribute('d')).toBe('');
    removeComponent(smoothSingle);

    const flatSingle = await mountSparkline({ type: 'line', data: [42] });
    expect(flatSingle.shadowRoot!.querySelector('[part~="line"]')!.getAttribute('points'))
      .toContain('NaN');
    removeComponent(flatSingle);

    el = await mountSparkline({ type: 'bar', data: [10, 20, 30], min: 15 });
    const first = el.shadowRoot!.querySelector('[part~="bar"]')!;
    expect(parseFloat(first.getAttribute('height')!)).toBeLessThan(0);
  });
});
