/**
 * snice-radio matrix — form contract, activation events, and the dirty model.
 *
 * SIZING. Three crosses, each taken from one documented section:
 *   · SUBMISSION — checked x name x value (2 x 2 x 3 = 12), the whole of "A
 *     selected, enabled, named radio contributes one FormData entry. Default
 *     `value` is `'on'`; explicit `value=""` is preserved."
 *   · GROUP VALIDITY — requiredMember x anyChecked x checkedMemberGate
 *     (2 x 2 x 2 = 8) x every member of the group, which is the whole of "If any
 *     member has `required`, every member has `valueMissing` until any member is
 *     checked… A checked disabled member satisfies requiredness".
 *   · ACTIVATION — entry x gate x alreadySelected (4 x 4 x 2 = 32), which is
 *     "click() and select() run activation… `click()` activates unless
 *     authored-, fieldset-, or loading-disabled" and "`select()` — activate only
 *     when not selected".
 */
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { unmountAll, product, comboId, settle, wait } from '../matrix-utils';
import { installInternalsMock, restoreInternalsMock } from '../internals-mock';
import {
  ENTRIES, GATES, EVENT_ORDER, mountGroup, mountRadio, expectedEntry, readEntry,
  expectedGroupFlags, readFlags, recordEvents, activate, expectDetail, isBarred,
  selection, type Gate,
} from './radio-support';

beforeEach(installInternalsMock);
afterEach(() => { restoreInternalsMock(); unmountAll(); });

const VALUES = [undefined, 'pro', ''] as const;

describe('radio matrix: submission (checked x name x value)', () => {
  for (const combo of product({ checked: [false, true], name: ['', 'plan'], value: VALUES })) {
    const label = comboId({ ...combo, value: combo.value ?? 'default' });
    it(label, async () => {
      const radio = await mountRadio({
        name: combo.name,
        value: combo.value,
        defaultChecked: combo.checked,
      });
      expect(readEntry(radio), label).toEqual(expectedEntry(combo));
    });
  }

  it('an explicit empty value is preserved', async () => {
    const radio = await mountRadio({ value: '', defaultChecked: true });
    expect(readEntry(radio)).toEqual(['plan', '']);
  });
});

describe('radio matrix: group requiredness', () => {
  for (const combo of product({
    requiredIndex: [0, 1], checkedIndex: [-1, 0, 1], checkedGate: ['none', 'disabled'] as Gate[],
  })) {
    const label = comboId(combo);
    it(label, async () => {
      const specs = [0, 1, 2].map(i => ({
        value: `v${i}`,
        required: i === combo.requiredIndex,
        gate: i === combo.checkedIndex ? combo.checkedGate : ('none' as Gate),
        defaultChecked: i === combo.checkedIndex,
      }));
      const group = await mountGroup(specs);
      await settle(group[0], 10);

      const expected = expectedGroupFlags(specs.map(spec => ({
        required: spec.required, checked: spec.defaultChecked,
      })));
      expect(group.map(readFlags), label).toEqual(expected);
    });
  }

  it('a disabled required member still establishes the group requirement', async () => {
    // DOCUMENTED: "A disabled `required` member still establishes that group
    // requirement."
    const specs = [
      { value: 'a', required: true, gate: 'disabled' as Gate },
      { value: 'b' },
    ];
    const group = await mountGroup(specs);
    expect(group.map(readFlags)).toEqual(
      expectedGroupFlags(specs.map(s => ({ required: !!s.required, checked: false }))));
  });

  it('setCustomValidity is per member, requiredness is group-wide', async () => {
    const specs = [{ value: 'a', required: true }, { value: 'b' }];
    const group = await mountGroup(specs);
    group[1].setCustomValidity('Not this one');
    await wait(20);

    expect(group.map(readFlags)).toEqual(expectedGroupFlags([
      { required: true, checked: false },
      { required: false, checked: false, custom: 'Not this one' },
    ]));
  });

  it('invalid is presentation only and creates no validation error', async () => {
    // DOCUMENTED: "`invalid` is presentation only and does not create
    // `customError` or `valueMissing`."
    const [radio] = await mountGroup([{ invalid: true }]);
    expect(readFlags(radio)).toEqual([]);
  });

  it('willValidate is false exactly for the barred gates', async () => {
    for (const gate of GATES) {
      const [radio] = await mountGroup([{ gate }]);
      expect(radio.willValidate, `gate=${gate}`).toBe(!isBarred(gate));
    }
  });
});

describe('radio matrix: activation entry x gate x alreadySelected', () => {
  for (const combo of product({ entry: ENTRIES, gate: GATES, selected: [false, true] })) {
    const label = comboId(combo);
    it(label, async () => {
      const [radio] = await mountGroup([{ gate: combo.gate, defaultChecked: combo.selected }]);
      const recorder = recordEvents(radio);

      await activate(radio, combo.entry);

      // DOCUMENTED: activation runs unless the member is authored-, fieldset-,
      // or loading-disabled; and an already selected radio emits nothing.
      const shouldEmit = combo.gate === 'none' && !combo.selected;
      expect(recorder.seen.filter(t => t !== 'input'), `${label}: component events`)
        .toEqual(shouldEmit ? ['change', 'radio-change'] : []);
      expect(radio.checked, `${label}: checkedness`)
        .toBe(combo.selected || combo.gate === 'none');

      if (shouldEmit) {
        expect(recorder.seen, `${label}: full documented order`).toEqual([...EVENT_ORDER]);
        expectDetail(recorder.details[0], radio, label);
      }
    });
  }
});

describe('radio matrix: the silent channels', () => {
  // DOCUMENTED: "Direct assignment, default changes, group reconciliation,
  // reset, and restoration emit nothing."
  it('a direct `checked` assignment is silent', async () => {
    const group = await mountGroup([{ value: 'a' }, { value: 'b' }]);
    const recorder = recordEvents(group[0]);
    group[0].checked = true;
    await settle(group[0], 20);
    expect(recorder.seen).toEqual([]);
    expect(selection(group)).toEqual([true, false]);
  });

  it('a default change on a clean radio is silent', async () => {
    const group = await mountGroup([{ value: 'a' }, { value: 'b' }]);
    const recorder = recordEvents(group[1]);
    group[1].defaultChecked = true;
    await settle(group[1], 20);
    expect(recorder.seen).toEqual([]);
    expect(selection(group)).toEqual([false, true]);
  });

  it('a reset restores the authored default silently', async () => {
    // DOCUMENTED: "`form.reset()` restores group defaults silently; the last
    // authored checked member in tree order wins."
    const group = await mountGroup([
      { value: 'a' }, { value: 'b', defaultChecked: true },
    ]);
    await activate(group[0], 'input');
    const recorders = group.map(recordEvents);

    for (const radio of group) radio.formResetCallback();
    await wait(20);

    expect(recorders.map(r => r.seen.filter(t => t !== 'input'))).toEqual([[], []]);
    expect(selection(group), 'the authored default is restored').toEqual([false, true]);
  });

  it('restoration is silent', async () => {
    const [radio] = await mountGroup([{ value: 'a' }]);
    const recorder = recordEvents(radio);
    radio.formStateRestoreCallback('checked');
    await settle(radio, 20);
    expect(recorder.seen).toEqual([]);
    expect(radio.checked).toBe(true);
  });
});

describe('radio matrix: the dirty model', () => {
  for (const combo of product({ authored: [false, true], dirty: [false, true] })) {
    const label = comboId(combo);
    it(label, async () => {
      const [radio] = await mountGroup([{ defaultChecked: combo.authored }]);
      if (combo.dirty) {
        // DOCUMENTED: "Assigning `checked`, including the same value, makes
        // checkedness dirty."
        radio.checked = combo.authored;
        await settle(radio, 10);
      }

      radio.defaultChecked = !combo.authored;
      await settle(radio, 20);

      // DOCUMENTED: "Later default changes do not overwrite dirty state."
      expect(radio.checked, label).toBe(combo.dirty ? combo.authored : !combo.authored);
    });
  }
});
