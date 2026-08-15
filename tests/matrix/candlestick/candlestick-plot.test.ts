/**
 * snice-candlestick matrix — the PLOT slice.
 *
 * Crosses the ten OHLC dataset shapes a chart can be handed against the three
 * switches that decide what is drawn: `showVolume`, `showGrid`, and `animation`.
 * 10 x 2 x 2 x 2 = 80 combos, each asserting the WHOLE documented contract for
 * that state through `chartProblems` — one candle per data point, every price on
 * the axis the chart is showing, direction colours, aligned volume bars, and the
 * grid sitting on its own ticks.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  DATASETS, combo, mountChart, chartProblems, removeComponent, type CandleCombo,
} from './candlestick-support';

function plotCombos(): CandleCombo[] {
  const combos: CandleCombo[] = [];
  for (const dataset of DATASETS) {
    for (const showVolume of [false, true]) {
      for (const showGrid of [false, true]) {
        for (const animation of [false, true]) {
          combos.push(combo(
            `${dataset.id}/volume:${showVolume}/grid:${showGrid}/animation:${animation}`,
            dataset, { showVolume, showGrid, animation },
          ));
        }
      }
    }
  }
  return combos;
}

let chart: any;
afterEach(() => { if (chart) { removeComponent(chart); chart = null; } });

describe('candlestick matrix: datasets x draw switches', () => {
  const combos = plotCombos();

  it('enumerates the full cross', () => {
    expect(combos).toHaveLength(DATASETS.length * 8);
    expect(new Set(combos.map(c => c.id)).size).toBe(combos.length);
  });

  for (const c of combos) {
    it(c.id, async () => {
      chart = await mountChart(c);
      expect(chartProblems(chart, c), `combo ${c.id} — ${c.dataset.why}`).toEqual([]);
    });
  }
});

describe('candlestick matrix: colour overrides', () => {
  // `bullishColor` / `bearishColor` are documented as overrides of the
  // --snice-candlestick-* custom properties. Crossed against the datasets whose
  // directions differ, so both branches of the override are exercised.
  const COLOURS = [
    { id: 'bullish only', bullishColor: 'rgb(0, 200, 0)', bearishColor: '' },
    { id: 'bearish only', bullishColor: '', bearishColor: 'rgb(200, 0, 0)' },
    { id: 'both', bullishColor: '#00c800', bearishColor: '#c80000' },
  ];
  const SHAPES = ['five-mixed', 'all-bullish', 'all-bearish', 'doji'];

  for (const shape of SHAPES) {
    for (const colour of COLOURS) {
      const dataset = DATASETS.find(d => d.id === shape)!;
      const c = combo(`${shape}/${colour.id}`, dataset, {
        bullishColor: colour.bullishColor,
        bearishColor: colour.bearishColor,
        showVolume: true,
      });
      it(c.id, async () => {
        chart = await mountChart(c);
        expect(chartProblems(chart, c), `combo ${c.id}`).toEqual([]);
      });
    }
  }
});

describe('candlestick matrix: live data replacement', () => {
  // The documented `data` property is live: assigning a new array re-plots the
  // chart. A chart that keeps the candles it first mounted with is showing
  // yesterday's market.
  it('re-plots for every dataset it is walked through', async () => {
    const start = combo('walk', DATASETS[0], { showVolume: true });
    chart = await mountChart(start);

    const problems: string[] = [];
    for (const dataset of DATASETS) {
      const next = { ...start, dataset, id: `walk -> ${dataset.id}` };
      chart.data = dataset.data;
      await new Promise(resolve => setTimeout(resolve, 60));
      problems.push(...chartProblems(chart, next).map(p => `${next.id}: ${p}`));
    }
    expect(problems).toEqual([]);
  });

  it('re-plots when the draw switches are toggled under fixed data', async () => {
    const start = combo('toggle', DATASETS.find(d => d.id === 'five-mixed')!);
    chart = await mountChart(start);

    const problems: string[] = [];
    for (const showVolume of [true, false, true]) {
      for (const showGrid of [false, true]) {
        const next = { ...start, showVolume, showGrid, id: `toggle -> v:${showVolume}/g:${showGrid}` };
        chart.showVolume = showVolume;
        chart.showGrid = showGrid;
        await new Promise(resolve => setTimeout(resolve, 60));
        // `animation` only applies to an entry render, and this chart already
        // entered — the switches must not resurrect it.
        problems.push(...chartProblems(chart, { ...next, animation: false })
          .map(p => `${next.id}: ${p}`));
      }
    }
    expect(problems).toEqual([]);
  });
});
