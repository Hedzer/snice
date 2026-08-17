/**
 * Smoke slice of the snice-range-slider matrix — the everyday-loop tier.
 *
 * The full cross lives in `tests/matrix/range-slider/`, excluded from the
 * default Vitest include. This file stays collected and buys the marquee only:
 *
 *   · the pristine slider, where every documented part is rendered at once;
 *   · one authored pair per lattice rule — ordered, clamped, snapped — because
 *     that one sentence is where this component's arithmetic lives;
 *   · both presentation switches that add DOM (tooltip, labels) and the
 *     orientation that changes it;
 *   · one keyboard move and one track press, the two documented ways a user
 *     moves an endpoint, with the event each of them owes;
 *   · the form value and reset, the two halves of the documented lifecycle.
 *
 * Structural assertions route through the matrix's own `rangeProblems` oracle.
 * BUDGET: well under 1s — the full keyboard, form and lattice crosses live in
 * the fuzz tier, not here.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mount, unmountAll, captureEvents, key, settle } from '../matrix-utils';
import {
  installInternalsMock, restoreInternalsMock, submittedEntry,
} from '../internals-mock';
import {
  range, attrsOf, comboId, rangeProblems, read, normalizePair, expectedFormValue,
  stubTrackGeometry, type RangeCombo,
} from './range-slider-support';

const mountRange = (c: RangeCombo) => mount<any>('snice-range-slider', attrsOf(c));

describe('range-slider matrix smoke', () => {
  beforeEach(() => { installInternalsMock(); });
  afterEach(() => { restoreInternalsMock(); unmountAll(); });

  const marquee: RangeCombo[] = [
    range({ defaultValueLow: 20, defaultValueHigh: 80 }),
    range({ defaultValueLow: 80, defaultValueHigh: 20 }),                     // ordered
    range({ defaultValueLow: -999, defaultValueHigh: 999 }),                  // clamped
    range({ min: 0, max: 100, step: 7, defaultValueLow: 33, defaultValueHigh: 67 }), // snapped
    range({ showTooltip: true, showLabels: true, defaultValueLow: 20, defaultValueHigh: 80 }),
    range({ orientation: 'vertical', disabled: true, defaultValueLow: 30, defaultValueHigh: 70 }),
  ];

  for (const c of marquee) {
    it(comboId(c), async () => {
      const el = await mountRange(c);
      expect(rangeProblems(el, c), `combo ${comboId(c)}`).toEqual([]);
    });
  }

  it('a keyboard move adjusts by step and reports it once', async () => {
    const c = range({ step: 5, defaultValueLow: 20, defaultValueHigh: 80 });
    const el = await mountRange(c);
    const events = captureEvents(el, ['range-change']);

    key(read(el).low.node, 'ArrowRight');
    await settle(el);

    expect(events.types()).toEqual(['range-change']);
    expect(events.events[0].detail).toEqual({ valueLow: 25, valueHigh: 80, component: el });
    expect(rangeProblems(el, c, { low: 25, high: 80 })).toEqual([]);
  });

  it('a track press moves the nearer thumb', async () => {
    const c = range({ defaultValueLow: 40, defaultValueHigh: 60 });
    const el = await mountRange(c);
    stubTrackGeometry(el, { left: 0, width: 200, top: 0, height: 20 });

    read(el).track?.dispatchEvent(new MouseEvent('mousedown', {
      bubbles: true, composed: true, cancelable: true, clientX: 180, clientY: 10,
    }));
    await settle(el);

    expect(rangeProblems(el, c, { low: 40, high: 90 })).toEqual([]);
  });

  it('the form value is one ordered "low,high" string, and reset restores the defaults', async () => {
    const c = range({ name: 'span', step: 5, defaultValueLow: 20, defaultValueHigh: 80 });
    const el = await mountRange(c);
    expect(submittedEntry(el)).toEqual(['span', expectedFormValue(20, 80)]);

    el.valueLow = 45;
    await settle(el);
    expect(submittedEntry(el)).toEqual(['span', expectedFormValue(45, 80)]);

    el.formResetCallback();
    await settle(el);
    expect(submittedEntry(el))
      .toEqual(['span', expectedFormValue(...Object.values(normalizePair(20, 80, 0, 100, 5)) as [number, number])]);
    expect(rangeProblems(el, c)).toEqual([]);
  });
});
