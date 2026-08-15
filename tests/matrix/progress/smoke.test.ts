/**
 * Smoke slice of the snice-progress matrix — the everyday-loop tier.
 *
 * `tests/matrix` is excluded from the default Vitest include
 * (vitest.config.ts); the full progress matrix (70 combos) runs only via
 * `npm run test:matrix`. This file deliberately lives at `smoke.test.ts` so
 * it stays collected.
 *
 * What it covers — one marquee combo per family:
 *   · linear fill      — the percentage reaches the bar's width;
 *   · circular fill    — the same percentage as a stroke offset;
 *   · clamping         — a value past `max` is 100, not more;
 *   · indeterminate    — the number is suspended;
 *   · label            — `show-label` renders the percentage as text;
 *   · events           — `progress-change` carries the documented detail.
 *
 * Every assertion routes through the matrix's own oracles (`expectedShape`,
 * `expectedPercentage`, `expectedChangeDetail`).
 *
 * BUDGET: under 1s.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { mount, unmountAll, expectShape, settle } from '../matrix-utils';
import {
  VALUE_CASES, expectedShape, readShape, expectedPercentage, readFillPercentage,
  expectedLabelText, labelText, recordChanges, expectedChangeDetail, readChangeDetail,
  type ProgressCombo,
} from './progress-support';

afterEach(unmountAll);

const half = VALUE_CASES.find(c => c.id === 'half')!;
const over = VALUE_CASES.find(c => c.id === 'over')!;

async function mountProgress(combo: ProgressCombo) {
  return mount<any>('snice-progress', {
    variant: combo.variant,
    value: combo.useCase.value,
    max: combo.useCase.max,
    ...(combo.indeterminate ? { indeterminate: true } : {}),
    ...(combo.showLabel ? { 'show-label': true } : {}),
  });
}

describe('snice-progress matrix smoke', () => {
  it('linear: the percentage reaches the bar width', async () => {
    const combo: ProgressCombo = { variant: 'linear', useCase: half, indeterminate: false };
    const el = await mountProgress(combo);
    expectShape(readShape(el), expectedShape(combo), 'linear/half');
    expect(readFillPercentage(el, 'linear')).toBeCloseTo(expectedPercentage(combo), 4);
  });

  it('circular: the same percentage as a stroke offset', async () => {
    const combo: ProgressCombo = { variant: 'circular', useCase: half, indeterminate: false };
    const el = await mountProgress(combo);
    expectShape(readShape(el), expectedShape(combo), 'circular/half');
    expect(readFillPercentage(el, 'circular')).toBeCloseTo(expectedPercentage(combo), 4);
  });

  it('clamping: a value past max reports 100, not more', async () => {
    const combo: ProgressCombo = { variant: 'linear', useCase: over, indeterminate: false };
    const el = await mountProgress(combo);
    expect(el.getPercentage()).toBe(100);
    expect(readFillPercentage(el, 'linear')).toBeCloseTo(100, 4);
  });

  it('indeterminate: the number is suspended', async () => {
    const combo: ProgressCombo = { variant: 'linear', useCase: half, indeterminate: true };
    const el = await mountProgress(combo);
    expect(el.getPercentage()).toBe(expectedPercentage(combo));
    expect(readFillPercentage(el, 'linear'), 'an indeterminate bar painted a width').toBe(null);
  });

  it('label: show-label renders the percentage as text', async () => {
    const combo: ProgressCombo = {
      variant: 'linear', useCase: half, indeterminate: false, showLabel: true,
    };
    const el = await mountProgress(combo);
    expect(labelText(el)).toBe(expectedLabelText(combo));
  });

  it('events: setProgress emits the documented detail', async () => {
    const el = await mount<any>('snice-progress', { value: 20, max: 100 });
    const details = recordChanges(el);

    el.setProgress(75, 150);
    await settle(el, 20);

    expectShape(readChangeDetail(details[details.length - 1]), expectedChangeDetail({
      variant: 'linear',
      useCase: { id: 'x', value: 75, max: 150, percentage: 50 },
      indeterminate: false,
    }), 'setProgress');
  });
});
