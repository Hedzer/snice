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
 * Two findings own the single-point line/area combos (see below); every other
 * vector is asserted outright.
 */
const isLineLike = (combo: SparklineCombo) => combo.type !== 'bar';
const isSmoothSinglePoint = (combo: SparklineCombo) =>
  combo.smooth === true && isLineLike(combo) && combo.data.length === 1;
const isFlatSinglePoint = (combo: SparklineCombo) =>
  combo.smooth !== true && isLineLike(combo) && combo.data.length === 1;

describe('sparkline matrix: mark vectors', () => {
  for (const combo of COMBOS.filter(c => !isSmoothSinglePoint(c) && !isFlatSinglePoint(c))) {
    it(`renders ${sparklineComboId(combo)}`, async () => {
      el = await mountSparkline(combo);
      expectClean(checkSparkline(el, combo), sparklineComboId(combo));
    });
  }
});

describe('sparkline matrix: defects', () => {
  // MATRIX-sparkline-1 — a ONE-POINT series with `smooth` renders a
  // `part="line"` whose `d` attribute is the empty string, so the chart draws
  // nothing at all.
  //
  //   <snice-sparkline smooth></snice-sparkline>   with data = [42]
  //     -> <path class="sparkline__line" d="" pathLength="1" part="line"/>
  //
  // `smooth` is documented as a rendering style, not as a minimum series
  // length, and the same series without `smooth` renders a `<polyline>`
  // carrying its one real vertex. Expected: the line part carries geometry for
  // every non-empty series. Actual: `d=""` whenever `data.length < 2`.
  for (const combo of COMBOS.filter(isSmoothSinglePoint)) {
    it.fails(`MATRIX-sparkline-1: ${sparklineComboId(combo)} still draws its line`, async () => {
      el = await mountSparkline(combo);
      expectClean(checkSparkline(el, combo), sparklineComboId(combo));
    });
  }

  it('MATRIX-sparkline-1 reproduces: the smooth one-point line has an empty d', async () => {
    // The counterpart assertion that documents what actually happens, so the
    // finding cannot be closed by accident without this file noticing.
    el = await mountSparkline({ type: 'line', data: [42], smooth: true });
    const line = el.shadowRoot!.querySelector('[part~="line"]')!;
    expect(line.tagName.toLowerCase()).toBe('path');
    expect(line.getAttribute('d')).toBe('');
  });

  // MATRIX-sparkline-2 — a ONE-POINT series WITHOUT `smooth` puts `NaN` in
  // every x coordinate, so the polyline, the area and the dot all paint
  // nothing.
  //
  //   <snice-sparkline></snice-sparkline>   with data = [42]
  //     -> <polyline points="NaN,15" …/>   and, with show-dots, <circle cx="NaN"/>
  //
  // The x of point i is `padding + (i / (data.length - 1)) * drawWidth`, which
  // is `0 / 0` for the only point of a one-point series. Expected: a single
  // datum lands at a real coordinate inside the viewBox. Actual: NaN.
  for (const combo of COMBOS.filter(isFlatSinglePoint)) {
    it.fails(`MATRIX-sparkline-2: ${sparklineComboId(combo)} places its point`, async () => {
      el = await mountSparkline(combo);
      expectClean(checkSparkline(el, combo), sparklineComboId(combo));
    });
  }

  it('MATRIX-sparkline-2 reproduces: the one-point series has a NaN x', async () => {
    el = await mountSparkline({ type: 'line', data: [42], showDots: true, showArea: true });
    const root = el.shadowRoot!;
    expect(root.querySelector('[part~="line"]')!.getAttribute('points')).toBe('NaN,15');
    expect(root.querySelector('[part~="dot"]')!.getAttribute('cx')).toBe('NaN');
    expect(root.querySelector('[part~="area"]')!.getAttribute('points')).toContain('NaN');
  });

  it('a bar chart of the same one-point series places its bar correctly', async () => {
    // The bar branch computes x from `index * (drawWidth / data.length)`, which
    // has no division by zero — the same series renders fine. That is what
    // makes MATRIX-sparkline-2 a defect in one branch rather than an
    // undocumented limit on one-point series.
    el = await mountSparkline({ type: 'bar', data: [42] });
    const bar = el.shadowRoot!.querySelector('[part~="bar"]')!;
    expect(Number.isFinite(parseFloat(bar.getAttribute('x')!))).toBe(true);
    expect(Number.isFinite(parseFloat(bar.getAttribute('width')!))).toBe(true);
  });
});
