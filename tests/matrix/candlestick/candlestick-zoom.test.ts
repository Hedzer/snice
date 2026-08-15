/**
 * snice-candlestick matrix — the ZOOM slice.
 *
 * The two documented methods:
 *
 *   resetZoom()                      "Reset zoom to show all data"
 *   zoomTo(startIndex, endIndex)     "Zoom to index range"
 *
 * A zoom is not a cosmetic change: the visible window decides which candles are
 * plotted, what the price axis spans, and which dates the time axis names. So
 * every window below is checked with the FULL oracle against the slice it
 * claims to show — a chart that zooms the candles but keeps the old axis is
 * mispricing every bar on screen.
 *
 * 12 windows x 2 (showVolume) x 2 (showGrid) = 48 combos, plus the boundary
 * arguments a caller can legally pass.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  DATASET, combo, mountChart, chartProblems, readCandles, removeComponent,
  type CandleCombo, type CandleData,
} from './candlestick-support';

const WIDE = DATASET['sixty'];

/** Index ranges a caller can ask for, including the ones that need clamping. */
const WINDOWS: Array<{ id: string; start: number; end: number; why: string }> = [
  { id: '0..60 (all)', start: 0, end: 60, why: 'the whole series' },
  { id: '0..1', start: 0, end: 1, why: 'a single candle' },
  { id: '0..2', start: 0, end: 2, why: 'the narrowest range with an x step' },
  { id: '10..20', start: 10, end: 20, why: 'an interior window' },
  { id: '50..60', start: 50, end: 60, why: 'the tail' },
  { id: '0..30', start: 0, end: 30, why: 'the head' },
  { id: '29..31', start: 29, end: 31, why: 'a two-candle interior window' },
  { id: '-5..10 (start below 0)', start: -5, end: 10, why: 'a negative start clamps to 0' },
  { id: '40..999 (end past the data)', start: 40, end: 999, why: 'an end past the data clamps' },
  { id: '-10..999 (both out of range)', start: -10, end: 999, why: 'both ends clamp' },
  { id: '5..6', start: 5, end: 6, why: 'a single interior candle' },
  { id: '0..60 after a narrow window', start: 0, end: 60, why: 'widening back out' },
];

const clampWindow = (start: number, end: number, length: number): CandleData[] =>
  WIDE.data.slice(Math.max(0, start), Math.min(length, end));

let chart: any;
afterEach(() => { if (chart) { removeComponent(chart); chart = null; } });

describe('candlestick matrix: zoomTo windows', () => {
  const combos: Array<CandleCombo & { start: number; end: number }> = [];
  for (const window of WINDOWS) {
    for (const showVolume of [false, true]) {
      for (const showGrid of [false, true]) {
        combos.push({
          ...combo(`${window.id}/volume:${showVolume}/grid:${showGrid}`, WIDE, {
            showVolume, showGrid, animation: false,
          }),
          start: window.start,
          end: window.end,
        });
      }
    }
  }

  it('enumerates the full cross', () => {
    expect(combos).toHaveLength(WINDOWS.length * 4);
  });

  for (const c of combos) {
    it(c.id, async () => {
      chart = await mountChart(c);
      // The window before the zoom, so a no-op zoom is still a real assertion.
      chart.zoomTo(c.start, c.end);
      await new Promise(resolve => setTimeout(resolve, 60));
      const visible = clampWindow(c.start, c.end, WIDE.data.length);
      expect(chartProblems(chart, c, visible), `combo ${c.id}`).toEqual([]);
    });
  }
});

describe('candlestick matrix: resetZoom', () => {
  it('shows all data again from every window', async () => {
    const c = combo('reset', WIDE, { showVolume: true, animation: false });
    chart = await mountChart(c);

    const problems: string[] = [];
    for (const window of WINDOWS) {
      chart.zoomTo(window.start, window.end);
      await new Promise(resolve => setTimeout(resolve, 40));
      chart.resetZoom();
      await new Promise(resolve => setTimeout(resolve, 40));
      problems.push(...chartProblems(chart, c, WIDE.data)
        .map(p => `reset from ${window.id}: ${p}`));
      const count = readCandles(chart).length;
      if (count !== WIDE.data.length) {
        problems.push(`reset from ${window.id} left ${count}/${WIDE.data.length} candles`);
      }
    }
    expect(problems).toEqual([]);
  });

  it('is a no-op on a chart that was never zoomed', async () => {
    const c = combo('reset-fresh', DATASET['five-mixed'], { animation: false });
    chart = await mountChart(c);
    chart.resetZoom();
    await new Promise(resolve => setTimeout(resolve, 60));
    expect(chartProblems(chart, c), 'resetZoom on an unzoomed chart').toEqual([]);
  });

  it('survives an empty chart', async () => {
    const c = combo('reset-empty', DATASET['empty']);
    chart = await mountChart(c);
    chart.zoomTo(0, 10);
    chart.resetZoom();
    await new Promise(resolve => setTimeout(resolve, 60));
    expect(chartProblems(chart, c), 'zoom methods on an empty chart').toEqual([]);
  });
});

describe('candlestick matrix: zoom composes with the other switches', () => {
  // Zooming re-derives the price axis, so it must compose with the formatters
  // and the colour overrides rather than resetting them.
  const OVERLAYS: Array<Partial<CandleCombo> & { id: string }> = [
    { id: 'currency + month', yAxisFormat: 'currency', timeFormat: 'month' },
    { id: 'percent + year', yAxisFormat: 'percent', timeFormat: 'year' },
    { id: 'colours', bullishColor: 'rgb(1, 2, 3)', bearishColor: 'rgb(9, 8, 7)' },
    { id: 'volume + no grid', showVolume: true, showGrid: false },
  ];

  for (const overlay of OVERLAYS) {
    it(`zoomTo(20, 30) with ${overlay.id}`, async () => {
      const c = combo(overlay.id, WIDE, { ...overlay, animation: false });
      chart = await mountChart(c);
      chart.zoomTo(20, 30);
      await new Promise(resolve => setTimeout(resolve, 60));
      expect(chartProblems(chart, c, WIDE.data.slice(20, 30)), `zoom + ${overlay.id}`)
        .toEqual([]);
    });
  }
});
