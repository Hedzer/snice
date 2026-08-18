/**
 * <snice-sparkline> mark matrix: type x series x the three render switches.
 *
 * 3 types x 8 documented series shapes x smooth x showDots x showArea = 192
 * combos, each judged by the single oracle in `sparkline-utils.ts`. The size is
 * earned rather than decorative: `smooth`, `showDots` and `showArea` each pick
 * a DIFFERENT branch of the SVG builder for line and area charts, and the bar
 * branch shares none of that code — so the interesting failures are exactly the
 * ones where two switches meet on a series that has an edge (one point, two
 * points, an all-equal series whose normalisation divides by zero).
 */
import { describe, it, expect, afterEach } from 'vitest';
import { expectClean, removeComponent } from '../matrix-kit';
import {
  DATASETS, DATASET_NAMES, TYPES,
  checkSparkline, mountSparkline, sparklineComboId,
  type SparklineCombo, type SparklineElement,
} from './sparkline-utils';
let el: SparklineElement | null = null;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

const COMBOS: SparklineCombo[] = TYPES.flatMap(type =>
  DATASET_NAMES.flatMap(dataset =>
    [false, true].flatMap(smooth =>
      [false, true].flatMap(showDots =>
        [false, true].map(showArea => ({
          type, data: DATASETS[dataset], smooth, showDots, showArea,
        } as SparklineCombo)),
      ),
    ),
  ),
);

/**
 * MATRIX-sparkline-1/-2 (fixed) used to own the single-point line/area combos;
 * they now run in the shared loop below like every other vector.
 */

describe('sparkline matrix: mark vectors', () => {
  // MATRIX-sparkline-1 (fixed) and MATRIX-sparkline-2 (fixed) used to own the
  // single-point line/area combos; they are asserted outright now.
  for (const combo of COMBOS) {
    it(`renders ${sparklineComboId(combo)}`, async () => {
      el = await mountSparkline(combo);
      expectClean(checkSparkline(el, combo), sparklineComboId(combo));
    });
  }
});

describe('sparkline matrix: single-point findings', () => {
  // MATRIX-sparkline-1 (fixed): a ONE-POINT series with `smooth` renders a
  // `part="line"` path carrying its single vertex (`M x,y`) instead of the
  // empty `d` that paints nothing.
  it('MATRIX-sparkline-1 (fixed): the smooth one-point line carries its vertex', async () => {
    el = await mountSparkline({ type: 'line', data: [42], smooth: true });
    const line = el.shadowRoot!.querySelector('[part~="line"]')!;
    expect(line.tagName.toLowerCase()).toBe('path');
    const d = line.getAttribute('d')!;
    expect(d.startsWith('M ')).toBe(true);
    expect(d).not.toMatch(/NaN|Infinity/);
    removeComponent(el);
    el = null;

    // The area variant composes the same degenerate path into a closed shape.
    el = await mountSparkline({ type: 'area', data: [42], smooth: true, showArea: true });
    const areaPath = el.shadowRoot!.querySelector('[part~="area"]')!.getAttribute('d')!;
    expect(areaPath).not.toMatch(/NaN|Infinity/);
  });

  // MATRIX-sparkline-2 (fixed): a ONE-POINT series WITHOUT `smooth` centres
  // its vertex on the canvas instead of putting `NaN` (0/0) in every x
  // coordinate of the polyline, the area and the dot.
  it('MATRIX-sparkline-2 (fixed): the one-point series places its point', async () => {
    el = await mountSparkline({ type: 'line', data: [42], showDots: true, showArea: true });
    const root = el.shadowRoot!;
    expect(root.querySelector('[part~="line"]')!.getAttribute('points')).not.toMatch(/NaN/);
    const cx = root.querySelector('[part~="dot"]')!.getAttribute('cx')!;
    expect(Number.isFinite(parseFloat(cx))).toBe(true);
    expect(root.querySelector('[part~="area"]')!.getAttribute('points')!).not.toMatch(/NaN/);
  });

  it('a bar chart of the same one-point series places its bar correctly', async () => {
    // The bar branch computes x from `index * (drawWidth / data.length)`, which
    // has no division by zero — the same series renders fine. That is what
    // made MATRIX-sparkline-2 a defect in one branch rather than an
    // undocumented limit on one-point series.
    el = await mountSparkline({ type: 'bar', data: [42] });
    const bar = el.shadowRoot!.querySelector('[part~="bar"]')!;
    expect(Number.isFinite(parseFloat(bar.getAttribute('x')!))).toBe(true);
    expect(Number.isFinite(parseFloat(bar.getAttribute('width')!))).toBe(true);
  });
});
