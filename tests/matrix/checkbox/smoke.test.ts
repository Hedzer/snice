/**
 * Smoke slice of the snice-checkbox matrix — the everyday-loop tier.
 *
 * `tests/matrix` is excluded from the default Vitest include
 * (vitest.config.ts), exactly as `tests/matrix/table` is; the full
 * checkbox matrix (176 combos) runs only via `npm run test:matrix`. This file
 * deliberately lives at `smoke.test.ts` so it stays collected.
 *
 * What it covers — one marquee combo per family the matrix enumerates:
 *   · presentation — the `mixed` aria-checked state, the one rendered value a
 *     boolean control can get wrong;
 *   · events       — the documented triple, in order, with its detail;
 *   · gating       — a disabled activation changes nothing and says nothing;
 *   · submission   — a checked, named box contributes its exact value;
 *   · validation   — an unchecked required box reports valueMissing;
 *   · dirty model  — a reset restores the default and preserves indeterminate.
 *
 * Every assertion routes through the matrix's own oracles (`expectedShape`,
 * `expectedEntry`, `expectedFlags`, `EVENT_ORDER`).
 *
 * BUDGET: under 1s. Add combos to the matrix, not here.
 */
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { unmountAll, expectShape, settle } from '../matrix-utils';
import { installInternalsMock, restoreInternalsMock } from '../internals-mock';
import {
  EVENT_ORDER, mountCheckbox, expectedShape, readShape, recordEvents, activate,
  expectDetail, expectedEntry, readEntry, expectedFlags, readFlags,
} from './checkbox-support';

beforeEach(installInternalsMock);
afterEach(() => { restoreInternalsMock(); unmountAll(); });

describe('snice-checkbox matrix smoke', () => {
  it('presentation: an indeterminate box reports aria-checked="mixed"', async () => {
    const combo = {
      size: 'medium', state: 'mixed', gate: 'none', required: false, invalid: false,
    } as const;
    const el = await mountCheckbox(combo);
    expectShape(readShape(el), expectedShape(combo), 'mixed');
  });

  it('events: a pointer activation emits input -> change -> checkbox-change', async () => {
    const el = await mountCheckbox({ name: 'digest' });
    const recorder = recordEvents(el);

    await activate(el, 'input');

    expect(recorder.seen).toEqual([...EVENT_ORDER]);
    expect(el.checked).toBe(true);
    expectDetail(recorder.details[0], el, 'pointer activation');
  });

  it('gating: a disabled activation neither toggles nor emits', async () => {
    const el = await mountCheckbox({ gate: 'disabled', name: 'digest' });
    const recorder = recordEvents(el);

    await activate(el, 'click()');

    expect(recorder.seen).toEqual([]);
    expect(el.checked).toBe(false);
  });

  it('submission: a checked, named box contributes its exact value', async () => {
    const el = await mountCheckbox({ state: 'on', name: 'digest', value: 'weekly' });
    expect(readEntry(el)).toEqual(expectedEntry({ checked: true, name: 'digest', value: 'weekly' }));
  });

  it('validation: an unchecked required box reports valueMissing', async () => {
    const el = await mountCheckbox({ required: true, name: 'digest' });
    expect(readFlags(el)).toEqual(expectedFlags({ checked: false, required: true, custom: '' }));
    expect(el.willValidate).toBe(true);
  });

  it('dirty model: a reset restores the default and preserves indeterminate', async () => {
    const el = await mountCheckbox({ defaultChecked: true, state: 'mixed', name: 'digest' });
    el.checked = false;
    await settle(el, 10);

    el.formResetCallback();
    await settle(el, 20);

    expect({ checked: el.checked, indeterminate: el.indeterminate })
      .toEqual({ checked: true, indeterminate: true });
  });
});
