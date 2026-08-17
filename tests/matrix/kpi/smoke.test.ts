/**
 * Smoke slice of the snice-kpi matrix — the everyday-loop tier.
 *
 * One combo per documented feature family: the bare tile, the trend block's two
 * halves, the sparkline's two conditions, the sentiment colour on the value and
 * the slots. Every assertion routes through the matrix's own oracle, so this
 * file cannot drift into something weaker than the suite it stands in for.
 * Budget: well under 1s.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import { mountKpi, kpiProblems, kpiAttributeProblems, combo, wait, SERIES } from './kpi-support';

let el: any;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

const base = { label: 'Revenue', value: '$45,231' };

describe('kpi matrix smoke', () => {
  it('a bare kpi is a label and a value, with no trend and no sparkline', async () => {
    const c = combo('smoke', base);
    el = await mountKpi(c);
    expect(kpiProblems(el, c)).toEqual([]);
  });

  it('a trend value alone opens the trend block without an arrow', async () => {
    const c = combo('smoke', { ...base, trendValue: '+12.5%' });
    el = await mountKpi(c);
    expect(kpiProblems(el, c)).toEqual([]);
  });

  it('a sentiment alone opens the trend block with only its arrow', async () => {
    const c = combo('smoke', { ...base, sentiment: 'down' });
    el = await mountKpi(c);
    expect(kpiProblems(el, c)).toEqual([]);
  });

  it('a series draws the sparkline it was given', async () => {
    const c = combo('smoke', { ...base, trendValue: '+15.3%', sentiment: 'up', trendData: SERIES });
    el = await mountKpi(c);
    expect(kpiProblems(el, c)).toEqual([]);
  });

  it('showSparkline=false suppresses a sparkline that has data', async () => {
    const c = combo('smoke', { ...base, trendData: SERIES, showSparkline: false });
    el = await mountKpi(c);
    expect(kpiProblems(el, c)).toEqual([]);
  });

  it('colorValue marks the value with the sentiment', async () => {
    const c = combo('smoke', { ...base, sentiment: 'up', colorValue: true, size: 'large' });
    el = await mountKpi(c);
    expect(kpiProblems(el, c)).toEqual([]);
  });

  it('the before and after slots project their content', async () => {
    const c = combo('smoke', { ...base, slots: { before: true, after: true } });
    el = await mountKpi(c);
    expect(kpiProblems(el, c)).toEqual([]);
  });

  it('a replaced series is the one that gets plotted', async () => {
    el = await mountKpi(combo('smoke', { ...base, trendData: SERIES }));
    const next = [1, 9, 4, 7, 2];
    el.trendData = next;
    await wait(30);
    expect(kpiProblems(el, combo('smoke', { ...base, trendData: next }), { fresh: false }))
      .toEqual([]);
  });

  // MATRIX-kpi-1..3: the three documented multi-word attribute names
  // (trend-value, show-sparkline, color-value) are neither observed nor
  // reflected — the element uses the squashed forms, so every documented markup
  // example that sets one is inert.
  it.fails('MATRIX-kpi-1: trendValue observes and reflects [trend-value]', async () => {
    el = await mountKpi(combo('smoke', { ...base, trendValue: '+12.5%' }));
    expect(kpiAttributeProblems(el, 'trendValue')).toEqual([]);
  });

  it.fails('MATRIX-kpi-2: <snice-kpi show-sparkline="false"> draws no sparkline', async () => {
    el = document.createElement('snice-kpi');
    el.setAttribute('show-sparkline', 'false');
    document.body.appendChild(el);
    await el.ready;
    el.trendData = SERIES;
    await wait(30);
    expect(el.showSparkline).toBe(false);
    expect(el.shadowRoot.querySelectorAll('[part~="sparkline"]').length).toBe(0);
  });

  it.fails('MATRIX-kpi-3: colorValue observes and reflects [color-value]', async () => {
    el = await mountKpi(combo('smoke', { ...base, sentiment: 'up', colorValue: true }));
    expect(kpiAttributeProblems(el, 'colorValue')).toEqual([]);
  });
});
