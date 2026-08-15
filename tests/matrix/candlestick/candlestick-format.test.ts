/**
 * snice-candlestick matrix — the AXIS FORMATTING slice.
 *
 * `timeFormat` (6 documented values) x `yAxisFormat` (3) x four price/date
 * shapes = 72 combos. Each asserts the whole documented contract through the
 * shared oracle, which checks the axis labels are well-formed for the chosen
 * format AND that the candles still line up with the axis those labels describe
 * — a formatter that changes the numbers a reader sees without moving the
 * candles is the failure this slice exists to catch.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  DATASET, TIME_FORMATS, Y_AXIS_FORMATS, combo, mountChart, chartProblems,
  readAxis, xLabels, removeComponent, type CandleCombo,
} from './candlestick-support';

/** The price/date shapes the formatters have to survive. */
const SHAPES = ['single', 'five-mixed', 'negative-prices', 'sixty'] as const;

function formatCombos(): CandleCombo[] {
  const combos: CandleCombo[] = [];
  for (const shape of SHAPES) {
    for (const timeFormat of TIME_FORMATS) {
      for (const yAxisFormat of Y_AXIS_FORMATS) {
        combos.push(combo(
          `${shape}/time:${timeFormat}/y:${yAxisFormat}`,
          DATASET[shape], { timeFormat, yAxisFormat, showVolume: true },
        ));
      }
    }
  }
  return combos;
}

let chart: any;
afterEach(() => { if (chart) { removeComponent(chart); chart = null; } });

describe('candlestick matrix: timeFormat x yAxisFormat', () => {
  const combos = formatCombos();

  it('enumerates the full cross', () => {
    expect(combos).toHaveLength(SHAPES.length * TIME_FORMATS.length * Y_AXIS_FORMATS.length);
    expect(new Set(combos.map(c => c.id)).size).toBe(combos.length);
  });

  for (const c of combos) {
    it(c.id, async () => {
      chart = await mountChart(c);
      expect(chartProblems(chart, c), `combo ${c.id}`).toEqual([]);
    });
  }
});

describe('candlestick matrix: the formatters are live', () => {
  // Both formats are documented as plain properties, so changing one must
  // reformat the axis in place. A chart that keeps its first formatting is
  // showing currency labels on a percent axis.
  it('reformats the price axis when yAxisFormat changes', async () => {
    const base = combo('y-walk', DATASET['five-mixed'], { animation: false });
    chart = await mountChart(base);

    const problems: string[] = [];
    for (const yAxisFormat of ['percent', 'currency', 'number', 'percent'] as const) {
      chart.yAxisFormat = yAxisFormat;
      await new Promise(resolve => setTimeout(resolve, 60));
      const next = { ...base, yAxisFormat, id: `y-walk -> ${yAxisFormat}` };
      problems.push(...chartProblems(chart, next).map(p => `${next.id}: ${p}`));

      const texts = readAxis(chart, yAxisFormat).map(tick => tick.text);
      const percentish = texts.every(text => text.endsWith('%'));
      if (yAxisFormat === 'percent' && !percentish) {
        problems.push(`yAxisFormat="percent" produced ${JSON.stringify(texts)}`);
      }
      if (yAxisFormat !== 'percent' && texts.some(text => text.endsWith('%'))) {
        problems.push(`yAxisFormat="${yAxisFormat}" still prints percentages: ${JSON.stringify(texts)}`);
      }
    }
    expect(problems).toEqual([]);
  });

  it('reformats the time axis when timeFormat changes', async () => {
    const base = combo('t-walk', DATASET['five-mixed'], { animation: false });
    chart = await mountChart(base);

    const problems: string[] = [];
    for (const timeFormat of TIME_FORMATS) {
      chart.timeFormat = timeFormat;
      await new Promise(resolve => setTimeout(resolve, 60));
      const next = { ...base, timeFormat, id: `t-walk -> ${timeFormat}` };
      problems.push(...chartProblems(chart, next).map(p => `${next.id}: ${p}`));
    }

    // `year` is the coarsest documented format; on a five-day series every
    // label collapses to the same year, which is exactly what makes it a
    // different rendering from `date`.
    chart.timeFormat = 'year';
    await new Promise(resolve => setTimeout(resolve, 60));
    const yearLabels = new Set(xLabels(chart).map(label => label.text));
    if (yearLabels.size !== 1 || ![...yearLabels][0].match(/^\d{4}$/)) {
      problems.push(`timeFormat="year" produced ${JSON.stringify([...yearLabels])}`);
    }
    expect(problems).toEqual([]);
  });
});
