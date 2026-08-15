/**
 * snice-chart matrix — the DATASET-SHAPE cross.
 *
 * Two documented shapes are crossed here.
 *
 * 1. COLOUR PRECEDENCE. `ChartDataset` offers `backgroundColor` (a single
 *    colour OR a per-slice array) and `borderColor`, and the component falls
 *    back to the theme accent palette. The full product of the ways a dataset
 *    can declare its colour:
 *
 *      backgroundColor {absent, single, array}                            (3)
 *        x borderColor {absent, present}                                  (2)
 *        x type {line, bar, pie, radar}                                   (4)
 *      = 24 combos.
 *
 *    Worth enumerating because the array form is per-SLICE colouring for
 *    pie/donut and is explicitly not the dataset's own colour — "an array
 *    behaves like a colour" is the regression this cross exists for.
 *
 * 2. DATA SHAPE. `data: (number | ChartDataPoint)[]` — a raw number list, an
 *    {x,y} list, a bubble {x,y,r} list, and the degenerate lists (empty, one
 *    point, negatives, all zero) that the axis arithmetic divides by.
 *
 *      shape {numbers, xy, bubble, empty, single, negative, zeros}        (7)
 *        x type {line, bar, area, scatter, bubble, pie, radar}            (7)
 *      = 49 combos.
 *
 *    Nothing here inspects painted marks — happy-dom has no canvas context —
 *    but the documented SHELL must survive every one of these, including the
 *    lists that make `Math.max()` return -Infinity and `length - 1` return -1.
 */
import { describe, it, afterEach, expect } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import {
  makeChart, expectChartMatches, legendSwatchColors, canvasEl,
  type ChartDataset, type ChartType, type SniceChartElement,
} from './matrix-utils';

const COLOUR_TYPES: ChartType[] = ['line', 'bar', 'pie', 'radar'];
const BACKGROUNDS = ['absent', 'single', 'array'] as const;

describe('snice-chart matrix: colour precedence cross', () => {
  let el: SniceChartElement | undefined;
  afterEach(() => { if (el) removeComponent(el); el = undefined; });

  for (const type of COLOUR_TYPES) {
    for (const background of BACKGROUNDS) {
      for (const border of [false, true]) {
        const id = `${type}/background=${background}/border=${border}`;

        it(`resolves the documented swatch colour: ${id}`, async () => {
          const dataset: ChartDataset = { label: 'Series', data: [3, 6, 9] };
          if (background === 'single') dataset.backgroundColor = 'rgb(1, 2, 3)';
          if (background === 'array') dataset.backgroundColor = ['#111', '#222', '#333'];
          if (border) dataset.borderColor = '#abcdef';

          const datasets = [dataset];
          const options = { legend: { position: 'top' as const, clickable: true } };
          el = await makeChart({ type, datasets, labels: ['a', 'b', 'c'], options });
          expectChartMatches(el, { type, datasets, options });

          // The array form is per-slice colouring, so it must NOT become the
          // dataset's own swatch colour — the swatch falls through to
          // borderColor, or to the palette when there is none.
          if (background === 'array') {
            const swatch = legendSwatchColors(el)[0];
            expect(swatch.includes('#111'),
              `an array backgroundColor leaked into the legend swatch: "${swatch}"`).toBe(false);
          }
        });
      }
    }
  }
});

/** Each data shape, with the point count the documented a11y summary must state. */
const SHAPES: Array<{ id: string; data: ChartDataset['data'] }> = [
  { id: 'numbers', data: [12, 19, 15, 25] },
  { id: 'xy', data: [{ x: 0, y: 12 }, { x: 1, y: 19 }, { x: 2, y: 15 }] },
  { id: 'bubble', data: [{ x: 0, y: 12, r: 4 }, { x: 1, y: 19, r: 9 }] },
  { id: 'empty', data: [] },
  { id: 'single', data: [42] },
  { id: 'negative', data: [-5, -1, -9, 3] },
  { id: 'zeros', data: [0, 0, 0] },
];

const SHAPE_TYPES: ChartType[] = ['line', 'bar', 'area', 'scatter', 'bubble', 'pie', 'radar'];

describe('snice-chart matrix: data shape cross', () => {
  let el: SniceChartElement | undefined;
  afterEach(() => { if (el) removeComponent(el); el = undefined; });

  for (const type of SHAPE_TYPES) {
    for (const shape of SHAPES) {
      it(`survives the documented data shape: ${type}/${shape.id}`, async () => {
        const datasets: ChartDataset[] = [{ label: 'Series', data: shape.data }];
        const options = { legend: { position: 'bottom' as const, clickable: true } };
        el = await makeChart({
          type, datasets, labels: ['a', 'b', 'c', 'd'], options,
        });
        expectChartMatches(el, { type, datasets, options });

        // Doc CSS parts: `canvas` is the "Chart canvas rendering area". It is
        // the chart itself, so it exists for every data shape — an empty series
        // is an empty chart, not a missing one.
        expect(canvasEl(el), `${type}/${shape.id} rendered no canvas`).not.toBeNull();
      });
    }
  }
});

describe('snice-chart matrix: mixed-type datasets', () => {
  let el: SniceChartElement | undefined;
  afterEach(() => { if (el) removeComponent(el); el = undefined; });

  // Doc `ChartDataset.type?: ChartType` — "for mixed charts". A `mixed` chart
  // draws each dataset with its OWN type, and the shell contract (legend entry
  // per dataset, a11y summary) is unchanged by that.
  it('renders one legend entry per dataset in a mixed chart', async () => {
    const datasets: ChartDataset[] = [
      { label: 'Revenue', data: [10, 20, 30], type: 'bar' },
      { label: 'Trend', data: [12, 18, 28], type: 'line' },
      { label: 'Spread', data: [8, 22, 26], type: 'scatter' },
    ];
    const options = { legend: { position: 'right' as const, clickable: true } };
    el = await makeChart({ type: 'mixed', datasets, labels: ['a', 'b', 'c'], options });
    expectChartMatches(el, { type: 'mixed', datasets, options });
  });

  // Doc `labels: string[] = []`. The label list and the data list can disagree
  // in length; neither is documented to truncate the other, and the shell must
  // survive both directions.
  it('survives labels shorter and longer than the data', async () => {
    for (const labels of [['a'], ['a', 'b', 'c', 'd', 'e', 'f', 'g']]) {
      const datasets: ChartDataset[] = [{ label: 'Series', data: [1, 2, 3, 4] }];
      const options = { legend: { position: 'top' as const, clickable: true } };
      el = await makeChart({ type: 'line', datasets, labels, options });
      expectChartMatches(el, { type: 'line', datasets, options });
      removeComponent(el);
      el = undefined;
    }
  });
});
