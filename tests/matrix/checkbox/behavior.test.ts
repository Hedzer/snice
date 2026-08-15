/**
 * snice-checkbox matrix — behaviour slice: user events and the checked/default
 * (dirty) model.
 *
 * SIZING. Two crosses, both taken from the docs verbatim:
 *
 *   · EVENTS — entry x gate x starting state (4 x 4 x 2 = 32). "An actual
 *     pointer, keyboard, label, `click()`, or `toggle()` state transition
 *     emits, in order: input, change, checkbox-change" and "Disabled/loading/
 *     effectively-disabled activation … neither change state nor emit these
 *     events". Every entry point must obey every gate, so the cross is real.
 *   · DIRTY MODEL — authored default x how the state was dirtied x new default
 *     (2 x 3 x 2 = 12), which is exactly "A default change updates `checked`
 *     only while checkedness is clean", plus reset and restoration.
 */
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { unmountAll, product, comboId, settle } from '../matrix-utils';
import { installInternalsMock, restoreInternalsMock } from '../internals-mock';
import {
  ENTRIES, GATES, EVENT_ORDER, mountCheckbox, recordEvents, activate, expectDetail,
  readShape, input,
} from './checkbox-support';

beforeEach(installInternalsMock);
afterEach(() => { restoreInternalsMock(); unmountAll(); });

describe('checkbox matrix: activation entry x gate x state', () => {
  for (const combo of product({ entry: ENTRIES, gate: GATES, checked: [false, true] })) {
    const label = comboId(combo);
    it(label, async () => {
      const el = await mountCheckbox({
        state: combo.checked ? 'on' : 'off', gate: combo.gate, name: 'digest',
      });
      const recorder = recordEvents(el);

      await activate(el, combo.entry);

      const allowed = combo.gate === 'none';
      expect(recorder.seen, `${label}: event sequence`)
        .toEqual(allowed ? [...EVENT_ORDER] : []);
      expect(el.checked, `${label}: checkedness`)
        .toBe(allowed ? !combo.checked : combo.checked);

      if (allowed) expectDetail(recorder.details[0], el, label);
      // The rendered control must agree with the host after an activation —
      // a state change that never reached the native input is a half-toggle.
      expect(readShape(el).inputChecked, `${label}: native input`).toBe(el.checked);
    });
  }
});

describe('checkbox matrix: the silent channels', () => {
  // DOCUMENTED: "Direct property changes, `setIndeterminate()`, reset, and state
  // restoration are silent."
  it('a direct `checked` assignment emits nothing', async () => {
    const el = await mountCheckbox({ name: 'digest' });
    const recorder = recordEvents(el);
    el.checked = true;
    await settle(el, 20);
    expect(recorder.seen).toEqual([]);
    expect(el.checked).toBe(true);
  });

  it('setIndeterminate() emits nothing and does not uncheck', async () => {
    const el = await mountCheckbox({ state: 'on', name: 'digest' });
    const recorder = recordEvents(el);
    el.setIndeterminate();
    await settle(el, 20);
    expect(recorder.seen).toEqual([]);
    expect({ checked: el.checked, indeterminate: el.indeterminate })
      .toEqual({ checked: true, indeterminate: true });
  });

  it('a form reset emits nothing', async () => {
    const el = await mountCheckbox({ defaultChecked: true, name: 'digest' });
    el.checked = false;
    const recorder = recordEvents(el);
    el.formResetCallback();
    await settle(el, 20);
    expect(recorder.seen).toEqual([]);
    expect(el.checked).toBe(true);
  });

  it('state restoration emits nothing', async () => {
    const el = await mountCheckbox({ name: 'digest' });
    const recorder = recordEvents(el);
    el.formStateRestoreCallback('checked');
    await settle(el, 20);
    expect(recorder.seen).toEqual([]);
    expect(el.checked).toBe(true);
  });
});

describe('checkbox matrix: default x dirtying x new default', () => {
  /** The documented ways checkedness becomes dirty — and the one that does not. */
  const DIRTIERS = ['none', 'assign', 'activate'] as const;

  for (const combo of product({
    authored: [false, true], dirtyBy: DIRTIERS, newDefault: [false, true],
  })) {
    const label = comboId(combo);
    it(label, async () => {
      const el = await mountCheckbox({ defaultChecked: combo.authored, name: 'digest' });
      expect(el.checked, `${label}: the authored default is the initial state`)
        .toBe(combo.authored);

      let checkedBefore = combo.authored;
      if (combo.dirtyBy === 'assign') {
        // DOCUMENTED: "Every assignment makes it dirty, even an assignment of
        // the existing value" — so this assigns the SAME value on purpose.
        el.checked = combo.authored;
        checkedBefore = combo.authored;
      } else if (combo.dirtyBy === 'activate') {
        input(el).click();
        await settle(el, 20);
        checkedBefore = !combo.authored;
      }
      await settle(el, 10);

      el.defaultChecked = combo.newDefault;
      await settle(el, 20);

      // DOCUMENTED: "A default change updates `checked` only while checkedness
      // is clean."
      const expected = combo.dirtyBy === 'none' ? combo.newDefault : checkedBefore;
      expect(el.checked, `${label}: checkedness after the default changed`).toBe(expected);
      expect(el.defaultChecked, `${label}: the default itself`).toBe(combo.newDefault);
    });
  }
});

describe('checkbox matrix: reset and restoration', () => {
  for (const combo of product({ authored: [false, true], indeterminate: [false, true] })) {
    const label = comboId(combo);
    it(`reset ${label}`, async () => {
      const el = await mountCheckbox({
        defaultChecked: combo.authored,
        state: combo.indeterminate ? 'mixed' : 'off',
        name: 'digest',
      });
      // Dirty it in the direction that is NOT the default, so a reset has work.
      el.checked = !combo.authored;
      await settle(el, 10);

      el.formResetCallback();
      await settle(el, 20);

      // DOCUMENTED: "Form reset clears dirty checkedness and restores
      // `checked = defaultChecked`" and "Reset and default changes preserve
      // `indeterminate`".
      expect({ checked: el.checked, indeterminate: el.indeterminate }, label)
        .toEqual({ checked: combo.authored, indeterminate: combo.indeterminate });

      // …and the dirty flag really was cleared: a later default change bites.
      el.defaultChecked = !combo.authored;
      await settle(el, 20);
      expect(el.checked, `${label}: the reset left the state clean`).toBe(!combo.authored);
    });
  }

  for (const state of ['checked', 'unchecked'] as const) {
    it(`restoration to "${state}" sets state and leaves it dirty`, async () => {
      const el = await mountCheckbox({ defaultChecked: state === 'unchecked', name: 'digest' });
      el.formStateRestoreCallback(state);
      await settle(el, 20);
      expect(el.checked).toBe(state === 'checked');

      // Restored checkedness is the user's, so a default change must not
      // overwrite it — the same dirty rule the assignment path follows.
      el.defaultChecked = state === 'unchecked';
      await settle(el, 20);
      expect(el.checked, 'a restored state was overwritten by a default change')
        .toBe(state === 'checked');
    });
  }
});
