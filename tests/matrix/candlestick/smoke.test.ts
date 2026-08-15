/**
 * Smoke slice of the snice-candlestick matrix — the everyday-loop tier.
 *
 * `tests/matrix` is excluded from the default Vitest include
 * (vitest.config.ts); the full candlestick cross (~275 combos across the plot,
 * format, zoom, and pointer slices) runs only via `npm run test:matrix`. This
 * file lives at `smoke.test.ts` so it stays collected, and pays for the
 * marquee combos only:
 *
 *   · one mixed-direction series with grid and volume on — the whole plot
 *     pipeline in a single assertion, including "every candle sits on the axis
 *     the chart is showing";
 *   · a doji series — the zero-height body that must still be drawn;
 *   · a zero-volume series — the bar scale's divide-by-zero guard;
 *   · empty data — the branch that must plot nothing at all;
 *   · both draw switches off — the two `if` branches in the SVG builder;
 *   · a currency axis — the formatter that most changes what a reader sees;
 *   · one zoomTo window and one resetZoom — the two documented methods.
 *
 * Every assertion routes through the matrix's own oracle (`chartProblems`), so
 * this file cannot drift into asserting something weaker than the suite it
 * stands in for. BUDGET: well under 1s.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  DATASET, combo, mountChart, chartProblems, readCandles, removeComponent,
} from './candlestick-support';

const MARQUEE = [
  combo('mixed series with grid + volume', DATASET['five-mixed'], { showVolume: true }),
  combo('doji bodies still render', DATASET['doji'], { animation: false }),
  combo('zero volume does not divide by zero', DATASET['zero-volume'], { showVolume: true }),
  combo('empty data plots nothing', DATASET['empty']),
  combo('both draw switches off', DATASET['five-mixed'], {
    showGrid: false, showVolume: false, animation: false,
  }),
  combo('currency axis', DATASET['five-mixed'], { yAxisFormat: 'currency' }),
  combo('colour overrides', DATASET['five-mixed'], {
    bullishColor: 'rgb(0, 200, 0)', bearishColor: 'rgb(200, 0, 0)',
  }),
];

let chart: any;
afterEach(() => { if (chart) { removeComponent(chart); chart = null; } });

describe('candlestick matrix smoke', () => {
  for (const c of MARQUEE) {
    it(c.id, async () => {
      chart = await mountChart(c);
      expect(chartProblems(chart, c), `combo ${c.id}`).toEqual([]);
    });
  }

  it('zoomTo shows exactly the requested index range', async () => {
    const c = combo('zoomTo(10, 20)', DATASET['sixty'], { animation: false });
    chart = await mountChart(c);
    chart.zoomTo(10, 20);
    await new Promise(resolve => setTimeout(resolve, 60));
    expect(chartProblems(chart, c, DATASET['sixty'].data.slice(10, 20))).toEqual([]);
  });

  it('resetZoom shows all data again', async () => {
    const c = combo('resetZoom', DATASET['sixty'], { animation: false });
    chart = await mountChart(c);
    chart.zoomTo(30, 35);
    await new Promise(resolve => setTimeout(resolve, 40));
    chart.resetZoom();
    await new Promise(resolve => setTimeout(resolve, 40));
    expect(readCandles(chart)).toHaveLength(DATASET['sixty'].data.length);
    expect(chartProblems(chart, c, DATASET['sixty'].data)).toEqual([]);
  });
});
