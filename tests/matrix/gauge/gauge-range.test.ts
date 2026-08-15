/**
 * snice-gauge matrix — the RANGE slice.
 *
 * Crosses the ten range shapes a meter can be handed (empty, mid, full, both
 * out-of-bounds directions, a non-default range, a negative floor, a
 * zero-width range, an inverted range, and a fractional value) against the two
 * switches that decide what text is on screen: `showValue` and `label`.
 *
 * 10 x 2 x 2 = 40 combos. Every one asserts the whole documented contract for
 * that state — ARIA, arc geometry, and both text parts — through the shared
 * oracle in gauge-support.ts.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import { combo, mountGauge, gaugeProblems, type GaugeCombo } from './gauge-support';

/** The range shapes. Each names the documented rule it is here to pin. */
const RANGES: Array<{ name: string; value: number; min: number; max: number }> = [
  { name: 'empty (value at min)', value: 0, min: 0, max: 100 },
  { name: 'half', value: 50, min: 0, max: 100 },
  { name: 'full (value at max)', value: 100, min: 0, max: 100 },
  { name: 'below min clamps to empty', value: -10, min: 0, max: 100 },
  { name: 'above max clamps to full', value: 110, min: 0, max: 100 },
  { name: 'custom max', value: 180, min: 0, max: 300 },
  { name: 'negative floor', value: 0, min: -50, max: 50 },
  { name: 'zero-width range', value: 50, min: 50, max: 50 },
  { name: 'inverted range', value: 50, min: 100, max: 0 },
  { name: 'fractional value', value: 33.6, min: 0, max: 100 },
];

const TEXT_SWITCHES: Array<{ name: string; showValue: boolean; label: string }> = [
  { name: 'value+label', showValue: true, label: 'CPU Usage' },
  { name: 'value only', showValue: true, label: '' },
  { name: 'label only', showValue: false, label: 'CPU Usage' },
  { name: 'neither', showValue: false, label: '' },
];

function rangeCombos(): GaugeCombo[] {
  const combos: GaugeCombo[] = [];
  for (const range of RANGES) {
    for (const text of TEXT_SWITCHES) {
      combos.push(combo(`${range.name} / ${text.name}`, {
        value: range.value,
        min: range.min,
        max: range.max,
        showValue: text.showValue,
        label: text.label,
      }));
    }
  }
  return combos;
}

let gauge: any;
afterEach(() => { if (gauge) { removeComponent(gauge); gauge = null; } });

describe('gauge matrix: range x text switches', () => {
  const combos = rangeCombos();

  it('enumerates the full cross', () => {
    expect(combos).toHaveLength(RANGES.length * TEXT_SWITCHES.length);
    expect(new Set(combos.map(c => c.id)).size).toBe(combos.length);
  });

  for (const c of combos) {
    it(c.id, async () => {
      gauge = await mountGauge(c);
      expect(gaugeProblems(gauge, c), `combo ${c.id}`).toEqual([]);
    });
  }
});

describe('gauge matrix: live range updates', () => {
  // A meter is a live control: the documented properties are re-read on every
  // change, so walking a gauge through a range must repaint the arc each time
  // rather than stick at the value it first mounted with.
  it('re-renders the arc for every value it is walked through', async () => {
    const start = combo('walk', { value: 0, label: 'Walk' });
    gauge = await mountGauge(start);

    const problems: string[] = [];
    for (const value of [0, 12.4, 50, 99, 100, 250, -5, 0]) {
      const next = { ...start, value, id: `walk → ${value}` };
      gauge.value = value;
      // Property assignment schedules a render; the oracle reads what landed.
      await new Promise(resolve => setTimeout(resolve, 20));
      problems.push(...gaugeProblems(gauge, next).map(p => `${next.id}: ${p}`));
    }
    expect(problems).toEqual([]);
  });

  it('re-renders when the range moves under a fixed value', async () => {
    const start = combo('range-walk', { value: 25, min: 0, max: 100 });
    gauge = await mountGauge(start);

    const problems: string[] = [];
    for (const [min, max] of [[0, 50], [0, 25], [25, 75], [-25, 25], [0, 100]]) {
      const next = { ...start, min, max, id: `range-walk → ${min}..${max}` };
      gauge.min = min;
      gauge.max = max;
      await new Promise(resolve => setTimeout(resolve, 20));
      problems.push(...gaugeProblems(gauge, next).map(p => `${next.id}: ${p}`));
    }
    expect(problems).toEqual([]);
  });
});
