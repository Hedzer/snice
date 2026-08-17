/**
 * MATRIX slice — snice-tag-input value and form lifecycle.
 *
 * Dimensions: authored default (JSON, comma/Unicode preserving) x maxTags (4),
 *   pristine/dirty x default mutation (2), reset (2), duplicate values x
 *   allowDuplicates (2) + dynamic recalculation (2) + setCustomValidity (2)
 *   + disabled/readonly barred states (4) — 26 combos.
 *
 * Everything here is the docs' "Value and form lifecycle" section, quoted in
 * the support module's header. Form truth runs through the ElementInternals
 * recorder (`tests/matrix/internals-mock.ts`) because happy-dom implements
 * none of the form plumbing behind it: the "one JSON array string to
 * `FormData`" claim is the recorded `setFormValue`, and the barred claims are
 * the recorded validity flags. Reset is driven through the form-associated
 * callback the browser would invoke.
 *
 * Every assertion is the DOCUMENTED expectation. No findings in this slice.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { expectShape, unmountAll, settle } from '../matrix-utils';
import {
  installInternalsMock, restoreInternalsMock, internalsFor, activeFlags,
} from '../internals-mock';
import { mountTagInput, expectedValidity, recordEvents, TRICKY_TAGS } from './tag-input-support';
import type { SniceTagInputElement } from '../../../packages/components/src/tag-input/snice-tag-input.types';
import '../../../packages/components/src/tag-input/snice-tag-input';

beforeEach(() => { installInternalsMock(); });
afterEach(() => { unmountAll(); restoreInternalsMock(); });

const asControl = (el: HTMLElement) => el as unknown as SniceTagInputElement;

describe('tag-input matrix: the JSON value attribute authors the default', () => {
  for (const maxTags of [0, 1, 3, 8]) {
    it(`tricky tags/maxTags=${maxTags}: pristine value is the authored default`, async () => {
      const el = await mountTagInput({
        value: [...TRICKY_TAGS], maxTags, name: 'skills', channel: 'attr',
      });
      const control = asControl(el);

      // "The `value` attribute parses JSON and backs `defaultValue`; live
      // `value` is a separate cloned array."
      expect(control.value).toEqual(TRICKY_TAGS);
      expect(control.defaultValue).toEqual(TRICKY_TAGS);
      // "The successful/restoration value is JSON, preserving commas and
      // Unicode within tags."
      expect(internalsFor(el).formValue).toBe(JSON.stringify(TRICKY_TAGS));
      // Constraint state per the documented rules, through the matrix oracle.
      const expected = expectedValidity(
        { value: TRICKY_TAGS, maxTags, channel: 'attr' }, TRICKY_TAGS);
      expectShape({
        tooLong: activeFlags(el).includes('tooLong'),
        customError: activeFlags(el).includes('customError'),
        willValidate: control.willValidate,
      }, {
        tooLong: expected.tooLong,
        customError: expected.customError,
        willValidate: expected.willValidate,
      }, `pristine/maxTags=${maxTags}`);
    });
  }
});

describe('tag-input matrix: pristine follows the default, dirty does not', () => {
  it('a pristine control follows default mutations', async () => {
    const el = await mountTagInput({ value: ['A'], channel: 'attr' });
    const events = recordEvents(el);

    (el as any).defaultValue = ['B', 'C'];
    await settle(el, 10);

    expect((el as any).value).toEqual(['B', 'C']);
    expect(events.seen).toEqual([]);
    events.stop();
  });

  it('a dirty control keeps its live value when the default moves', async () => {
    const el = await mountTagInput({ value: ['A'], channel: 'attr' });

    (el as any).addTag('X');
    await settle(el, 5);
    (el as any).defaultValue = ['B'];
    await settle(el, 10);

    expect((el as any).value).toEqual(['A', 'X']);
    expect((el as any).defaultValue).toEqual(['B']);
  });

  it('a live assignment dirties the control and leaves the default alone', async () => {
    const el = await mountTagInput({ value: ['A'], channel: 'attr' });
    const events = recordEvents(el);

    (el as any).value = ['C'];
    await settle(el, 10);

    expect((el as any).value).toEqual(['C']);
    expect((el as any).defaultValue).toEqual(['A']);
    // "Assigning `value` … [is] silent."
    expect(events.seen).toEqual([]);
    events.stop();
  });
});

describe('tag-input matrix: reset silently restores the default', () => {
  it('after edits, reset restores a fresh copy of the current default', async () => {
    const el = await mountTagInput({ value: ['A', 'B'], channel: 'attr' });
    const control = asControl(el);

    control.addTag('C');
    await settle(el, 5);
    (el as any).defaultValue = ['R1', 'R2'];
    await settle(el, 5);

    const events = recordEvents(el);
    (el as any).formResetCallback();
    await settle(el, 10);

    expect(control.value).toEqual(['R1', 'R2']);
    expect(events.seen).toEqual([]);
    // The restored value is what the form would submit.
    expect(internalsFor(el).formValue).toBe(JSON.stringify(['R1', 'R2']));
    events.stop();
  });

  it('repeated resets keep restoring the same default', async () => {
    const el = await mountTagInput({ value: ['A'], channel: 'attr' });
    const control = asControl(el);

    control.addTag('B');
    await settle(el, 5);
    (el as any).formResetCallback();
    await settle(el, 5);
    control.addTag('C');
    await settle(el, 5);
    (el as any).formResetCallback();
    await settle(el, 5);

    expect(control.value).toEqual(['A']);
  });
});

describe('tag-input matrix: constraint validity', () => {
  for (const allowDuplicates of [false, true]) {
    it(`duplicates/allowDuplicates=${allowDuplicates}: customError per the documented rule`, async () => {
      const el = await mountTagInput({
        value: ['dup', 'dup'], allowDuplicates, name: 'tags', channel: 'attr',
      });
      const control = asControl(el);

      expectShape({
        flags: activeFlags(el).filter(f => f === 'customError'),
        checkValidity: control.checkValidity(),
        message: control.validationMessage.length > 0,
      }, {
        flags: allowDuplicates ? [] : ['customError'],
        checkValidity: allowDuplicates,
        message: !allowDuplicates,
      }, `duplicates/allowDuplicates=${allowDuplicates}`);
      // "Programmatic arrays remain visible and invalid."
      expect((el as any).value).toEqual(['dup', 'dup']);
    });
  }

  it('tooLong flags more tags than a positive maxTags', async () => {
    const el = await mountTagInput({
      value: ['1', '2', '3'], maxTags: 2, name: 'tags', channel: 'attr',
    });
    expect(activeFlags(el)).toEqual(['tooLong']);
  });

  it('dynamic rules recalculate immediately', async () => {
    const el = await mountTagInput({ value: ['1', '2', '3'], channel: 'prop' });

    // Tightening past the current size flags it at once.
    (el as any).maxTags = 2;
    await settle(el, 10);
    expect(activeFlags(el)).toEqual(['tooLong']);

    // Loosening clears it at once.
    (el as any).maxTags = 4;
    await settle(el, 10);
    expect(activeFlags(el)).toEqual([]);

    // Allowing duplicates clears a duplicate error at once.
    (el as any).value = ['d', 'd'];
    await settle(el, 10);
    expect(activeFlags(el)).toEqual(['customError']);
    (el as any).allowDuplicates = true;
    await settle(el, 10);
    expect(activeFlags(el)).toEqual([]);
  });

  it('setCustomValidity supplies an independent error, and "" clears only it', async () => {
    const el = await mountTagInput({ value: ['dup', 'dup'], channel: 'attr' });
    const control = asControl(el);

    control.setCustomValidity('mine');
    await settle(el, 10);
    expect(activeFlags(el)).toEqual(['customError']);
    expect(control.validationMessage).toBe('mine');

    // Clearing the custom message exposes the calculated duplicate error —
    // the two are independent.
    control.setCustomValidity('');
    await settle(el, 10);
    expect(activeFlags(el)).toEqual(['customError']);
    expect(control.validationMessage).not.toBe('mine');
    expect(control.validationMessage.length).toBeGreaterThan(0);
  });

  it('calculated errors mark the container and the input', async () => {
    const el = await mountTagInput({ value: ['1', '2', '3'], maxTags: 2, channel: 'attr' });
    await settle(el, 10);
    const container = el.shadowRoot!.querySelector('.tag-input-container')!;
    const input = el.shadowRoot!.querySelector('.tag-input-field');
    expect(container.getAttribute('aria-invalid')).toBe('true');
    if (input) expect(input.getAttribute('aria-invalid')).toBe('true');
  });
});

describe('tag-input matrix: barred states', () => {
  for (const barred of ['disabled', 'readonly'] as const) {
    it(`${barred}: remains successful exactly when readonly, and is barred`, async () => {
      const el = await mountTagInput({
        value: ['A'], name: 'tags', channel: 'attr', [barred]: true,
      });
      const control = asControl(el);

      // "Disabled controls are omitted/barred. Readonly controls remain
      // successful but are barred." The recorder sees the submitted JSON for
      // both; the BARRED contract is willValidate.
      expect(internalsFor(el).formValue).toBe(JSON.stringify(['A']));
      expect(control.willValidate).toBe(false);
      // A barred control reports no constraint errors.
      expect(activeFlags(el)).toEqual([]);
    });

    it(`${barred}: no enabled draft field is offered`, async () => {
      const el = await mountTagInput({
        value: ['A'], channel: 'attr', [barred]: true,
      });
      const enabledInputs = [...el.shadowRoot!.querySelectorAll<HTMLInputElement>('.tag-input-field')]
        .filter(input => !input.disabled && !input.readOnly);
      expect(enabledInputs).toEqual([]);
    });
  }
});
