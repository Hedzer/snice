/**
 * snice-kpi matrix — the generated cross.
 *
 * sentiment (including none) x size x trend-value x trend-data — 48 combos —
 * with showSparkline, colorValue and the two documented slots rotated across
 * them. Every combo is judged by the shared oracle in kpi-support.ts, which
 * encodes docs/ai/components/kpi.md and the documented reflection rules — never
 * observed output.
 */
import { describe, it, afterEach, expect } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import {
  generateCombos, mountKpi, expectKpi, kpiProblems, kpiAttributeProblems, combo,
  SENTIMENTS, SIZES, SERIES,
} from './kpi-support';

let el: any;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

const combos = generateCombos();

describe('kpi matrix: generated cross', () => {
  for (const c of combos) {
    it(c.id, async () => {
      el = await mountKpi(c);
      expectKpi(el, c);
    });
  }
});

describe('kpi matrix: the cross is what it claims to be', () => {
  it('covers every sentiment and size against both trend inputs', () => {
    const seen = new Set(combos.map(c =>
      `${c.sentiment}/${c.size}/${c.trendValue !== undefined}/${!!c.trendData}`));
    const want = SENTIMENTS.length * SIZES.length * 2 * 2;
    expect(combos.length).toBe(want);
    expect(seen.size).toBe(want);
  });

  it('rotates every presentational switch and both slots in', () => {
    expect(combos.some(c => !c.showSparkline), 'showSparkline is never disabled').toBe(true);
    expect(combos.some(c => c.colorValue), 'colorValue is never enabled').toBe(true);
    expect(combos.some(c => c.slots.before), 'the before slot is never filled').toBe(true);
    expect(combos.some(c => c.slots.after), 'the after slot is never filled').toBe(true);
    expect(combos.some(c => typeof c.value === 'number'), 'a numeric value is never used').toBe(true);
    expect(combos.some(c => typeof c.trendValue === 'number'),
      'a numeric trend value is never used').toBe(true);
  });
});

describe('kpi matrix: the documented sentiment icons differ', () => {
  // "up — Green, arrow up", "down — Red, arrow down", "neutral — Gray, arrow
  // right". Three sentiments that painted the same glyph would be three
  // sentiments a colour-blind reader cannot tell apart, which is exactly what
  // the accessibility section forbids ("color + icon differentiation").
  it('each sentiment renders a distinct arrow', async () => {
    const glyphs = new Map<string, string>();
    for (const sentiment of ['up', 'down', 'neutral'] as const) {
      const subject = await mountKpi(combo(sentiment, { label: 'L', value: '1', sentiment }));
      const icon = subject.shadowRoot.querySelector('[part~="trend-icon"]');
      glyphs.set(sentiment, icon?.innerHTML ?? '');
      removeComponent(subject);
    }
    expect(new Set(glyphs.values()).size,
      `sentiments share an arrow: ${[...glyphs.keys()].join(', ')}`).toBe(3);
    for (const [sentiment, markup] of glyphs) {
      expect(markup.includes('<svg'), `sentiment="${sentiment}" rendered no svg`).toBe(true);
    }
  });
});

describe('kpi matrix: the documented markup channel', () => {
  it('<snice-kpi label value sentiment size> renders the documented tile', async () => {
    const c = combo('markup', {
      label: 'Monthly Revenue', value: '$54,239', sentiment: 'up', size: 'large',
    });
    el = document.createElement('snice-kpi');
    el.setAttribute('label', c.label);
    el.setAttribute('value', String(c.value));
    el.setAttribute('sentiment', 'up');
    el.setAttribute('size', 'large');
    document.body.appendChild(el);
    await el.ready;
    await new Promise(r => setTimeout(r, 30));
    expect(kpiProblems(el, c, { fresh: false })).toEqual([]);
  });

  // ── FINDINGS ──────────────────────────────────────────────────────────────
  //
  // MATRIX-kpi-1..3 (fixed): the three multi-word properties used to be
  // declared without an explicit `attribute:` name, so the element observed
  // and reflected the SQUASHED forms (`trendvalue`, `showsparkline`,
  // `colorvalue`) and every documented markup example using the kebab names
  // was inert. The decorators now name the documented attributes, and the
  // assertions below run unpinned as regression guards.

  // MATRIX-kpi-1
  it('MATRIX-kpi-1 (fixed): trendValue observes and reflects [trend-value]', async () => {
    el = await mountKpi(combo('finding', { label: 'L', value: '1', trendValue: '+12.5%' }));
    expect(kpiAttributeProblems(el, 'trendValue')).toEqual([]);
  });

  it('MATRIX-kpi-1 (fixed): <snice-kpi trend-value="+12.5%"> shows the trend', async () => {
    el = document.createElement('snice-kpi');
    el.setAttribute('label', 'Monthly Revenue');
    el.setAttribute('value', '$54,239');
    el.setAttribute('trend-value', '+12.5%');
    document.body.appendChild(el);
    await el.ready;
    await new Promise(r => setTimeout(r, 30));
    expect(el.trendValue).toBe('+12.5%');
    expect(el.shadowRoot.querySelectorAll('[part~="trend-value"]').length).toBe(1);
  });

  // MATRIX-kpi-2
  it('MATRIX-kpi-2 (fixed): showSparkline observes and reflects [show-sparkline]', async () => {
    el = await mountKpi(combo('finding', { label: 'L', value: '1', showSparkline: true }));
    el.showSparkline = false;
    el.showSparkline = true;
    await new Promise(r => setTimeout(r, 30));
    expect(kpiAttributeProblems(el, 'showSparkline')).toEqual([]);
  });

  // docs/ai/properties.md: `<element enabled="false">` -> false. The KPI docs
  // use exactly that form: `<snice-kpi show-sparkline="false">`.
  it('MATRIX-kpi-2 (fixed): <snice-kpi show-sparkline="false"> draws no sparkline', async () => {
    el = document.createElement('snice-kpi');
    el.setAttribute('label', 'Revenue');
    el.setAttribute('value', '$45,231');
    el.setAttribute('show-sparkline', 'false');
    document.body.appendChild(el);
    await el.ready;
    el.trendData = SERIES;
    await new Promise(r => setTimeout(r, 30));
    expect(el.showSparkline).toBe(false);
    expect(el.shadowRoot.querySelectorAll('[part~="sparkline"]').length).toBe(0);
  });

  // MATRIX-kpi-3
  it('MATRIX-kpi-3 (fixed): colorValue observes and reflects [color-value]', async () => {
    el = await mountKpi(combo('finding', {
      label: 'L', value: '1', sentiment: 'up', colorValue: true,
    }));
    expect(kpiAttributeProblems(el, 'colorValue')).toEqual([]);
  });

  it('MATRIX-kpi-3 (fixed): <snice-kpi color-value> colours the value', async () => {
    el = document.createElement('snice-kpi');
    el.setAttribute('label', 'Revenue');
    el.setAttribute('value', '$45,231');
    el.setAttribute('sentiment', 'up');
    el.setAttribute('color-value', '');
    document.body.appendChild(el);
    await el.ready;
    await new Promise(r => setTimeout(r, 30));
    expect(el.colorValue).toBe(true);
    const value = el.shadowRoot.querySelector('[part~="value"]');
    expect(value?.getAttribute('class') ?? '').toContain('up');
  });
});

describe('kpi matrix: the oracle is not vacuous', () => {
  it('rejects a kpi with no trend block where one was documented', async () => {
    el = await mountKpi(combo('probe', { label: 'L', value: '1' }));
    const problems = kpiProblems(el, combo('probe', { label: 'L', value: '1', sentiment: 'up' }));
    expect(problems.length, 'oracle accepted a missing documented trend').toBeGreaterThan(0);
  });

  it('rejects a kpi whose sparkline never drew its documented series', async () => {
    el = await mountKpi(combo('probe', { label: 'L', value: '1' }));
    const problems = kpiProblems(el, combo('probe', { label: 'L', value: '1', trendData: SERIES }));
    expect(problems.length, 'oracle accepted a missing documented sparkline').toBeGreaterThan(0);
  });
});
