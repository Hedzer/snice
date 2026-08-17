/**
 * Matrix slice DATE-PICKER / FORM PARTICIPATION.
 *
 * Dimensions: state (5) x name (2) x value shape (3) = 30 combos, plus the
 * fieldset and restoration clauses.
 *
 * Documented contract:
 *   · "Enabled + non-empty `name`: contributes `[name, canonicalValue]` to
 *     `FormData`."
 *   · "A named empty/invalid picker contributes `''`; required/bad input still
 *     blocks actual submission."
 *   · "Disabled or effectively disabled by a fieldset: omitted and barred from
 *     validation. Authored `disabled` property/attribute is not rewritten by
 *     the fieldset."
 *   · "`readonly`: successful in `FormData`, but barred from constraint
 *     validation."
 *   · "`loading`: blocks interaction but remains successful and participates in
 *     validation."
 *   · "Browser history/autofill restoration retains exact visible state;
 *     complete text derives a canonical value, partial text stays invalid."
 *
 * The four states are deliberately crossed against a name and a value, because
 * "successful" and "validated" are two independent switches and every state
 * sets them differently — `disabled` turns both off, `readonly` turns only the
 * second off, `loading` turns neither off.
 *
 * ── ENVIRONMENT limits, declared rather than worked around ─────────────────
 *
 * happy-dom's `new FormData(form)` collects nothing from a form-associated
 * custom element, so "contributes [name, value]" is observed one level down,
 * at the `setFormValue()` call the component makes — the same substitution
 * `tests/matrix/internals-mock.ts` documents and every sibling matrix uses.
 *
 * The other half — "Disabled ... omitted" — is performed by the BROWSER for
 * every disabled form-associated element, whatever the control last handed to
 * `setFormValue`; the entry-list algorithm skips it. happy-dom implements
 * neither that skip nor real fieldset disabledness, so asserting omission
 * through `setFormValue` here would be asserting a behaviour the component is
 * not responsible for. That clause is checked in
 * `tests/live/matrix/date-picker` against a real engine. What this file asserts
 * about `disabled` is the half it can see exactly: no interaction, and no
 * validity flags however empty or malformed the control is.
 *
 * it.fails policy: no finding is pinned in this file.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  mountPicker, cleanupPickers, installInternalsMock, restoreInternalsMock,
  readFacts, submittedEntry, typeInto,
  Problems, expectClean, wait, SETTLE,
} from './date-picker-support';

const STATES = [
  { name: 'plain', attrs: {}, disabled: false, validated: true },
  { name: 'disabled', attrs: { disabled: true }, disabled: true, validated: false },
  { name: 'readonly', attrs: { readonly: true }, disabled: false, validated: false },
  { name: 'loading', attrs: { loading: true }, disabled: false, validated: true },
  {
    name: 'disabled+readonly', attrs: { disabled: true, readonly: true },
    disabled: true, validated: false,
  },
] as const;

const SHAPES = [
  { name: 'valid', value: '2026-03-15', canonical: '2026-03-15' },
  { name: 'empty', value: '', canonical: '' },
  { name: 'impossible', value: '2026-02-30', canonical: '' },
] as const;

describe('date-picker matrix: form participation', () => {
  beforeEach(() => installInternalsMock());
  afterEach(() => { cleanupPickers(); restoreInternalsMock(); });

  for (const state of STATES) {
    for (const named of [true, false]) {
      for (const shape of SHAPES) {
        const id = `${state.name}/${named ? 'named' : 'anonymous'}/${shape.name}`;

        it(`${id}: ${state.disabled ? 'omitted' : 'successful'}`, async () => {
          const el = await mountPicker({
            attrs: { ...state.attrs, ...(named ? { name: 'arrival' } : {}) },
            liveValue: shape.value,
          });
          const facts = readFacts(el);
          const problems = new Problems();

          // "Enabled + non-empty name: contributes [name, canonicalValue]";
          // "A named empty/invalid picker contributes ''"; "`readonly`:
          // successful"; "`loading`: ... remains successful".
          //
          // For a DISABLED control the browser drops the entry on its own (see
          // the header), so what the component hands to `setFormValue` is not
          // the claim — the barring below is.
          if (!state.disabled) {
            problems.eq('submitted value', facts.formValue, shape.canonical);
            problems.eq('the FormData entry', submittedEntry(el),
              named ? ['arrival', shape.canonical] : null);
          }

          // "barred from validation" — a barred control raises no flags at all,
          // however empty or impossible its value is.
          if (!state.validated) {
            problems.eq('a barred control raises no validity flags', facts.flags, []);
          }

          // The interaction shell mirrors onto the field the user touches.
          // "`loading`: blocks interaction"; `readonly` is its own flag.
          problems.eq('the field is disabled for interaction',
            facts.inputDisabled,
            state.name === 'disabled' || state.name === 'loading'
            || state.name === 'disabled+readonly');
          problems.eq('the field is readonly', facts.inputReadonly,
            state.name === 'readonly' || state.name === 'disabled+readonly');

          expectClean(problems, id);
        });
      }
    }
  }

  it('a fieldset-disabled control is omitted without rewriting the authored flags',
    async () => {
      // "Disabled or effectively disabled by a fieldset: omitted and barred
      // from validation. Authored `disabled` property/attribute is not
      // rewritten by the fieldset."
      const el = await mountPicker({
        attrs: { name: 'arrival', required: true },
      });
      expect(readFacts(el).flags, 'an empty required control should complain')
        .toEqual(['valueMissing']);

      (el as any).formDisabledCallback(true);
      await wait(SETTLE);
      expect(readFacts(el).flags, 'a fieldset-disabled control was still validated')
        .toEqual([]);
      expect(readFacts(el).inputDisabled,
        'a fieldset-disabled control still accepts interaction').toBe(true);
      expect(el.disabled, 'the fieldset rewrote the authored disabled property').toBe(false);
      expect(el.hasAttribute('disabled'),
        'the fieldset rewrote the authored disabled attribute').toBe(false);

      (el as any).formDisabledCallback(false);
      await wait(SETTLE);
      expect(readFacts(el).flags, 'the control did not come back when re-enabled')
        .toEqual(['valueMissing']);
    });

  it('an authored disabled control stays disabled when a fieldset re-enables it',
    async () => {
      const el = await mountPicker({
        attrs: { name: 'arrival', disabled: true, required: true },
      });
      (el as any).formDisabledCallback(false);
      await wait(SETTLE);
      expect(el.disabled, 'the authored disabled flag was cleared').toBe(true);
      expect(readFacts(el).flags, 'an authored-disabled control started validating')
        .toEqual([]);
      expect(readFacts(el).inputDisabled,
        'an authored-disabled control became interactive').toBe(true);
    });

  // ── Restoration ───────────────────────────────────────────────────────────
  //
  // "Browser history/autofill restoration retains exact visible state; complete
  // text derives a canonical value, partial text stays invalid." Restoration is
  // the one channel that behaves like TYPING rather than like assignment — it
  // restores what the user could see, not a sanitized value.
  const RESTORED = [
    { name: 'complete', state: '03/15/2026', visible: '03/15/2026', value: '2026-03-15', flags: [] },
    { name: 'partial', state: '03/1', visible: '03/1', value: '', flags: ['badInput'] },
    { name: 'impossible', state: '02/30/2026', visible: '02/30/2026', value: '', flags: ['badInput'] },
    { name: 'empty', state: '', visible: '', value: '', flags: [] },
  ] as const;

  for (const sample of RESTORED) {
    it(`restoring "${sample.state}" keeps the exact visible state`, async () => {
      const el = await mountPicker({ attrs: { format: 'mm/dd/yyyy', name: 'arrival' } });
      (el as any).formStateRestoreCallback(sample.state, 'restore');
      await wait(SETTLE);
      const facts = readFacts(el);
      const problems = new Problems();
      problems.eq('visible text', facts.visible, sample.visible);
      problems.eq('derived value', facts.value, sample.value);
      problems.eq('validity flags', facts.flags, [...sample.flags]);
      expectClean(problems, `restore/${sample.name}`);
    });
  }

  it('restoration is silent — it emits no component events', async () => {
    // "Reset/default changes/restoration are silent." A restore that fired
    // `datepicker-change` would loop any binding fed from that event.
    const el = await mountPicker({ attrs: { format: 'mm/dd/yyyy' } });
    const seen: string[] = [];
    for (const type of ['datepicker-input', 'datepicker-change', 'datepicker-select']) {
      el.addEventListener(type, () => seen.push(type));
    }
    (el as any).formStateRestoreCallback('03/15/2026', 'restore');
    await wait(SETTLE);
    expect(el.value, 'restoration did not derive a value').toBe('2026-03-15');
    expect(seen, 'restoration was not silent').toEqual([]);
  });

  it('a reset is silent and restores the default', async () => {
    const el = await mountPicker({ attrs: { value: '2026-03-15' } });
    el.value = '2026-04-01';
    await wait(SETTLE);
    const seen: string[] = [];
    for (const type of ['datepicker-input', 'datepicker-change', 'datepicker-clear']) {
      el.addEventListener(type, () => seen.push(type));
    }
    (el as any).formResetCallback();
    await wait(SETTLE);
    expect(el.value, 'reset did not restore the default').toBe('2026-03-15');
    expect(seen, 'reset was not silent').toEqual([]);
  });

  it('typed bad input contributes an empty value while staying on screen', async () => {
    // "A named empty/invalid picker contributes ''; required/bad input still
    // blocks actual submission."
    const el = await mountPicker({ attrs: { format: 'mm/dd/yyyy', name: 'arrival' } });
    await typeInto(el, '02/30/2026');
    expect(submittedEntry(el), 'bad input was submitted as a date')
      .toEqual(['arrival', '']);
    expect(readFacts(el).visible, 'the bad text was erased from the field')
      .toBe('02/30/2026');
    expect(el.checkValidity(), 'bad input reported valid').toBe(false);
  });
});
