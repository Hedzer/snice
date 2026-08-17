/**
 * snice-kpi matrix — property transitions.
 *
 * A dashboard KPI is a live tile: its value, its trend and its series are
 * replaced while it is on screen. The generated cross only ever builds a KPI
 * once, so this file asserts the documented contract still holds after each
 * documented input changes — where a trend block that never clears, a stale
 * series, or an attribute left behind by an earlier sentiment would show up.
 */
import { describe, it, afterEach, expect } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import { mountKpi, kpiProblems, combo, wait, SERIES, SENTIMENTS } from './kpi-support';

let el: any;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

const base = { label: 'Monthly Revenue', value: '$54,239' };

describe('kpi matrix: value and label transitions', () => {
  it('a new value replaces the old one, with no residue', async () => {
    el = await mountKpi(combo('t', base));
    el.value = '$61,004';
    el.label = 'Quarterly Revenue';
    await wait(30);
    expect(kpiProblems(el, combo('updated', {
      label: 'Quarterly Revenue', value: '$61,004',
    }), { fresh: false })).toEqual([]);
  });

  it('a numeric value renders as its own string form', async () => {
    el = await mountKpi(combo('t', base));
    el.value = 54239;
    await wait(30);
    expect(kpiProblems(el, combo('numeric', { ...base, value: 54239 }), { fresh: false }))
      .toEqual([]);
  });
});

describe('kpi matrix: trend transitions', () => {
  for (const sentiment of SENTIMENTS.filter(Boolean)) {
    it(`sentiment -> ${sentiment} swaps the documented arrow in`, async () => {
      el = await mountKpi(combo('t', base));
      el.sentiment = sentiment;
      await wait(30);
      expect(kpiProblems(el, combo(`sentiment->${sentiment}`, { ...base, sentiment }),
        { fresh: false })).toEqual([]);
    });
  }

  it('gaining a trend value opens the trend block', async () => {
    el = await mountKpi(combo('t', base));
    el.trendValue = '+12.5%';
    await wait(30);
    expect(kpiProblems(el, combo('gained', { ...base, trendValue: '+12.5%' }), { fresh: false }))
      .toEqual([]);
  });

  it('a sentiment change repaints the arrow rather than stacking a second one', async () => {
    el = await mountKpi(combo('t', { ...base, sentiment: 'up', trendValue: '+12.5%' }));
    el.sentiment = 'down';
    el.trendValue = '-3.1%';
    await wait(30);
    expect(kpiProblems(el, combo('up->down', {
      ...base, sentiment: 'down', trendValue: '-3.1%',
    }), { fresh: false })).toEqual([]);
  });
});

describe('kpi matrix: sparkline transitions', () => {
  it('gaining a series draws the sparkline', async () => {
    el = await mountKpi(combo('t', base));
    el.trendData = SERIES;
    await wait(30);
    expect(kpiProblems(el, combo('gained', { ...base, trendData: SERIES }), { fresh: false }))
      .toEqual([]);
  });

  it('a replaced series is the one that gets plotted', async () => {
    el = await mountKpi(combo('t', { ...base, trendData: SERIES }));
    const next = [1, 9, 4, 7, 2];
    el.trendData = next;
    await wait(30);
    expect(kpiProblems(el, combo('replaced', { ...base, trendData: next }), { fresh: false }))
      .toEqual([]);
  });

  it('an emptied series removes the sparkline', async () => {
    el = await mountKpi(combo('t', { ...base, trendData: SERIES }));
    el.trendData = [];
    await wait(30);
    expect(kpiProblems(el, combo('emptied', { ...base, trendData: [] }), { fresh: false }))
      .toEqual([]);
  });

  it('turning showSparkline off removes an already-drawn sparkline', async () => {
    el = await mountKpi(combo('t', { ...base, trendData: SERIES }));
    el.showSparkline = false;
    await wait(30);
    expect(kpiProblems(el, combo('off', {
      ...base, trendData: SERIES, showSparkline: false,
    }), { fresh: false })).toEqual([]);
  });
});

describe('kpi matrix: colorValue transitions', () => {
  it('enabling colorValue marks the value with the current sentiment', async () => {
    el = await mountKpi(combo('t', { ...base, sentiment: 'up' }));
    el.colorValue = true;
    await wait(30);
    expect(kpiProblems(el, combo('on', { ...base, sentiment: 'up', colorValue: true }),
      { fresh: false })).toEqual([]);
  });

  it('disabling colorValue releases the value again', async () => {
    el = await mountKpi(combo('t', { ...base, sentiment: 'down', colorValue: true }));
    el.colorValue = false;
    await wait(30);
    expect(kpiProblems(el, combo('off', { ...base, sentiment: 'down' }), { fresh: false }))
      .toEqual([]);
  });
});
