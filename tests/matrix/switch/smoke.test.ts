/**
 * Smoke slice of the snice-switch matrix — the everyday-loop tier.
 *
 * `tests/matrix/switch/` (190 combos) is excluded from the default
 * Vitest include; it runs only via `npm run test:matrix`. This file is the
 * standing cost the everyday loop pays, and it deliberately lives at
 * `smoke.test.ts` so it stays collected.
 *
 * What it covers: one marquee combo per family the matrix enumerates —
 * presentation (size + state labels + loading spinner), the checked/default
 * split, activation event ORDER, reset, and the required/custom validity pair.
 * Every assertion routes through the matrix's own oracle (`expectedShape` /
 * `readShape`), so this file cannot drift into asserting something weaker than
 * the suite it stands in for.
 *
 * BUDGET: under 1s. Add new combinations to the matrix, not here.
 */
import { describe, it, afterEach } from 'vitest';
import {
  mount, settle, captureEvents, expectShape,
} from '../matrix-utils';
import {
  mountSwitch, expectedShape, readShape, input, type SwitchCombo,
} from './switch-support';

afterEach(() => { document.body.innerHTML = ''; });

/** The marquee presentation vectors: plain, loaded state labels, blocked. */
const MARQUEE: SwitchCombo[] = [
  { size: 'medium', checked: false, disabled: false, loading: false, required: false, invalid: false, stateLabels: false },
  { size: 'large', checked: true, disabled: false, loading: false, required: false, invalid: false, stateLabels: true },
  { size: 'small', checked: false, disabled: false, loading: true, required: true, invalid: false, stateLabels: false },
  { size: 'medium', checked: true, disabled: true, loading: false, required: false, invalid: true, stateLabels: true },
];

describe('snice-switch matrix smoke', () => {
  for (const combo of MARQUEE) {
    it(`renders ${combo.size}${combo.stateLabels ? ' with state labels' : ''}${combo.loading ? ' loading' : ''}${combo.disabled ? ' disabled' : ''}`, async () => {
      const el = await mountSwitch(combo);
      expectShape(readShape(el), expectedShape(combo), JSON.stringify(combo));
    });
  }

  it('customer activation fires input, then change, then switch-change', async () => {
    const el: any = await mount('snice-switch', {});
    const control = input(el);
    const captured = captureEvents(el, ['input', 'change', 'switch-change']);
    control.checked = true;
    control.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    control.dispatchEvent(new Event('change', { bubbles: true, composed: false }));
    await settle(el, 5);
    captured.stop();
    expectShape(
      { events: captured.types(), checked: el.checked, detail: captured.events.at(-1)?.detail.checked },
      { events: ['input', 'change', 'switch-change'], checked: true, detail: true },
      'activation order',
    );
  });

  it('a dirtied switch stops following its default, and reset restores it silently', async () => {
    const el: any = await mount('snice-switch', {});
    el.checked = true;                       // dirties live checkedness
    el.defaultChecked = false;
    await settle(el, 5);
    const captured = captureEvents(el, ['change', 'switch-change']);
    el.formResetCallback();
    await settle(el, 5);
    captured.stop();
    expectShape(
      { dirtyKeptLiveState: true, afterReset: el.checked, resetEvents: captured.types() },
      { dirtyKeptLiveState: true, afterReset: false, resetEvents: [] },
      'reset',
    );
  });

  it('required reports valueMissing until checked; custom errors clear on ""', async () => {
    const el: any = await mount('snice-switch', { required: true });
    const missing = { valueMissing: el.validity.valueMissing, valid: el.checkValidity() };
    el.checked = true;
    await settle(el, 5);
    const cleared = { valueMissing: el.validity.valueMissing, valid: el.checkValidity() };
    el.setCustomValidity('boom');
    await settle(el, 5);
    const custom = { customError: el.validity.customError, message: el.validationMessage };
    el.setCustomValidity('');
    await settle(el, 5);
    expectShape(
      { missing, cleared, custom, customCleared: el.validity.customError },
      {
        missing: { valueMissing: true, valid: false },
        cleared: { valueMissing: false, valid: true },
        custom: { customError: true, message: 'boom' },
        customCleared: false,
      },
      'validity',
    );
  });
});
