/**
 * Matrix slice DATE-PICKER / VALIDITY.
 *
 * Dimensions: value position relative to the range (5) x constraint pair (5)
 * x required (2) = 50 combos, plus the barring cross (4 states x 3 value
 * shapes = 12) and the custom-error clauses.
 *
 * Documented contract:
 *   · "`required` → `validity.valueMissing` when no valid date exists."
 *   · "invalid/partial manual text → `validity.badInput`."
 *   · "`min`/`max` → `rangeUnderflow`/`rangeOverflow`; boundaries are
 *     INCLUSIVE and out-of-range calendar days are disabled."
 *   · "Impossible constraints are ignored rather than rolled." /
 *     "malformed constraints are ignored."
 *   · "Configured display-format constraints remain accepted."
 *   · "`setCustomValidity(message)` sets `customError`; `setCustomValidity('')`
 *     clears it."
 *   · "`invalid`/`errorText` are visual presentation only." — the one clause
 *     most likely to be implemented as real invalidity by accident, which is
 *     why it gets its own regression rather than a line in the loop.
 *   · "`disabled`, effective fieldset disabledness, and `readonly` are barred;
 *     `loading` is not."
 *
 * The five value positions exist because an inclusive boundary has exactly two
 * ways to be wrong, and only a value ON the boundary can tell them apart.
 *
 * ── An ENVIRONMENT limit, declared rather than worked around ────────────────
 *
 * The component derives `rangeUnderflow` / `rangeOverflow` from a native
 * `<input type="date">` used as a validation proxy — the standard technique,
 * and the right one. happy-dom's `<input type="date">` does not implement it:
 * assigning a value outside `min`/`max` CLEARS the value, and the range flags
 * are never set at all (probed directly; `input.value` comes back `""` and
 * `validity.rangeUnderflow` stays `false`).
 *
 * That is an environment limit, not a component defect, so this file does not
 * assert through it — a failure there would say nothing about the component
 * and a pass would say even less. The range CLAIM is not dropped: it is
 * asserted in `tests/live/matrix/date-picker`, where a real engine runs the
 * proxy. What this file does assert about `min`/`max` is everything the
 * component computes for itself — that an out-of-range value is kept rather
 * than silently discarded, that the constraints reach the control's own
 * properties, and (in calendar.test.ts) that out-of-range days are disabled.
 *
 * it.fails policy: no finding is pinned in this file.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  mountPicker, cleanupPickers, installInternalsMock, restoreInternalsMock,
  readFacts, expectedFlags, typeInto, dayButtons, Problems, expectClean, wait, SETTLE,
} from './date-picker-support';

/** A window with a real inside, both boundaries, and both outsides. */
const MIN = '2026-03-10';
const MAX = '2026-03-20';

const POSITIONS = [
  { name: 'empty', value: '', why: 'no date at all' },
  { name: 'below-min', value: '2026-03-09', why: 'one day under an inclusive minimum' },
  { name: 'on-min', value: MIN, why: 'ON the minimum — inclusive means valid' },
  { name: 'inside', value: '2026-03-15', why: 'comfortably inside the window' },
  { name: 'on-max', value: MAX, why: 'ON the maximum — inclusive means valid' },
  { name: 'above-max', value: '2026-03-21', why: 'one day over an inclusive maximum' },
] as const;

const CONSTRAINTS = [
  { name: 'none', min: '', max: '', why: 'an unconstrained control bounds nothing' },
  { name: 'min-only', min: MIN, max: '', why: 'a lower bound alone' },
  { name: 'max-only', min: '', max: MAX, why: 'an upper bound alone' },
  { name: 'both', min: MIN, max: MAX, why: 'a closed window' },
  {
    name: 'malformed', min: 'yesterday', max: '2026-02-30',
    why: '"malformed constraints are ignored" — and "2026-02-30" is impossible, '
      + 'so it must be ignored rather than rolled to March 2nd',
  },
] as const;

describe('date-picker matrix: validity', () => {
  beforeEach(() => installInternalsMock());
  afterEach(() => { cleanupPickers(); restoreInternalsMock(); });

  for (const position of POSITIONS) {
    for (const constraint of CONSTRAINTS) {
      for (const required of [false, true]) {
        const id = `${position.name}/${constraint.name}/${required ? 'required' : 'optional'}`;

        it(`${id}: ${position.why}, ${constraint.why}`, async () => {
          const attrs: Record<string, any> = {};
          if (constraint.min) attrs.min = constraint.min;
          if (constraint.max) attrs.max = constraint.max;
          if (required) attrs.required = true;

          const el = await mountPicker({ attrs, liveValue: position.value });
          const facts = readFacts(el);
          const problems = new Problems();

          // The component keeps the date it was given, in range or not. A
          // control that discarded an out-of-range value could never report
          // `rangeUnderflow` for it, and would submit the wrong thing besides.
          problems.eq('the assigned value survives the constraints',
            facts.value, position.value);
          // The constraints are on the control where the docs put them.
          problems.eq('min', el.min, constraint.min);
          problems.eq('max', el.max, constraint.max);

          // Flags: asserted only where this environment can produce them. See
          // the header — a value outside `min`/`max` is cleared by happy-dom's
          // proxy input, so both the range flags and any `valueMissing` derived
          // alongside them would be the environment's answer, not the
          // component's.
          const key = (text: string) => /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
          const minKey = key(constraint.min);
          const maxKey = key(constraint.max);
          const valueKey = key(facts.value);
          const outOfRange = valueKey !== null
            && ((minKey !== null && valueKey < minKey) || (maxKey !== null && valueKey > maxKey));
          if (!outOfRange) {
            problems.eq('validity flags', facts.flags, expectedFlags(facts.value, {
              required, min: constraint.min, max: constraint.max, barred: false,
            }));
          }
          // A control that reports a flag must also say something about it, and
          // a valid one must say nothing.
          problems.eq('a valid control has no message',
            facts.flags.length === 0 ? facts.validationMessage : '(skipped)',
            facts.flags.length === 0 ? '' : '(skipped)');
          if (facts.flags.length) {
            problems.ok(facts.validationMessage !== '',
              `flags ${facts.flags.join(',')} were set with an empty message`);
          }

          expectClean(problems, id);
        });
      }
    }
  }

  // ── "Configured display-format constraints remain accepted" ───────────────
  //
  // Asserted through the calendar rather than through the validity flags,
  // because the calendar's disabled days are the component's OWN reading of
  // `min`/`max` — the one this environment can observe. "out-of-range calendar
  // days are disabled" is the same clause, checked on the same constraints.
  it('a min/max written in the configured display format still bounds the calendar',
    async () => {
      const el = await mountPicker({
        attrs: { format: 'dd/mm/yyyy', min: '10/03/2026', max: '20/03/2026', open: true },
        liveValue: '2026-03-15',
      });
      await wait(SETTLE);
      const disabled = dayButtons(el)
        .filter(button => button.disabled)
        .map(button => button.getAttribute('data-date'));
      expect(disabled, 'a display-format min/max disabled nothing').not.toEqual([]);
      expect(disabled, 'a day inside the display-format window was disabled')
        .not.toContain('2026-03-15');
      expect(disabled, 'the inclusive minimum was disabled').not.toContain('2026-03-10');
      expect(disabled, 'the inclusive maximum was disabled').not.toContain('2026-03-20');
      expect(disabled, 'the day below the minimum stayed enabled').toContain('2026-03-09');
      expect(disabled, 'the day above the maximum stayed enabled').toContain('2026-03-21');
    });

  it('an impossible or malformed constraint is ignored rather than rolled', async () => {
    // "Impossible constraints are ignored rather than rolled." A min of
    // "2026-02-30" must not become March 2nd and start disabling real days.
    const el = await mountPicker({
      attrs: { min: '2026-02-30', max: 'yesterday', open: true },
      liveValue: '2026-03-15',
    });
    await wait(SETTLE);
    expect(dayButtons(el).filter(button => button.disabled).map(b => b.getAttribute('data-date')),
      'a malformed constraint disabled real days').toEqual([]);
    expect(el.value, 'a malformed constraint rejected a valid value').toBe('2026-03-15');
  });

  // ── The barring cross ─────────────────────────────────────────────────────
  //
  // "`disabled`, effective fieldset disabledness, and `readonly` are barred;
  // `loading` is not." The three value shapes are the three ways a control can
  // be invalid, so a state that bars validation must silence all of them and
  // `loading` must silence none.
  const BARRING = [
    { name: 'plain', attrs: {}, barred: false },
    { name: 'disabled', attrs: { disabled: true }, barred: true },
    { name: 'readonly', attrs: { readonly: true }, barred: true },
    { name: 'loading', attrs: { loading: true }, barred: false },
  ] as const;

  // The three invalid shapes this environment CAN produce: an empty required
  // control, unparseable manual text, and a custom message. Each is a different
  // path into `setValidity`, so a barring state that silenced only one of them
  // would still pass a single-shape test.
  const SHAPES = [
    { name: 'required-empty', required: true, typed: '', custom: '' },
    { name: 'bad-input', required: false, typed: '03/1', custom: '' },
    { name: 'custom-error', required: false, typed: '', custom: 'Unavailable' },
  ] as const;

  for (const state of BARRING) {
    for (const shape of SHAPES) {
      const id = `${state.name}/${shape.name}`;
      it(`${id}: ${state.barred ? 'barred from validation' : 'still validated'}`,
        async () => {
          const el = await mountPicker({
            attrs: {
              ...state.attrs, format: 'mm/dd/yyyy',
              ...(shape.required ? { required: true } : {}),
            },
          });
          if (shape.custom) el.setCustomValidity(shape.custom);
          if (shape.typed) await typeInto(el, shape.typed);
          await wait(SETTLE);

          const problems = new Problems();
          problems.eq('validity flags', readFacts(el).flags, expectedFlags(el.value, {
            required: shape.required, min: '', max: '', barred: state.barred,
            customMessage: shape.custom || undefined,
            // `readonly` and `disabled` also block typing, so text that never
            // landed cannot be bad input either.
            badInput: !!shape.typed && !state.barred,
          }));
          expectClean(problems, id);
        });
    }
  }

  it('a fieldset-disabled control is barred exactly like a disabled one', async () => {
    // Driven through `formDisabledCallback()`, which is how a browser tells a
    // form-associated element that an ancestor fieldset turned it off.
    const el = await mountPicker({ attrs: { required: true } });
    expect(readFacts(el).flags).toEqual(['valueMissing']);
    (el as any).formDisabledCallback(true);
    await wait(SETTLE);
    expect(readFacts(el).flags, 'fieldset disabledness did not bar validation').toEqual([]);
    // "Authored `disabled` property/attribute is not rewritten by the fieldset."
    expect(el.disabled, 'the fieldset rewrote the authored disabled property').toBe(false);
    expect(el.hasAttribute('disabled'),
      'the fieldset rewrote the authored disabled attribute').toBe(false);
    (el as any).formDisabledCallback(false);
    await wait(SETTLE);
    expect(readFacts(el).flags, 're-enabling did not restore validation')
      .toEqual(['valueMissing']);
  });

  // ── setCustomValidity ─────────────────────────────────────────────────────
  it('setCustomValidity sets customError and an empty string clears it', async () => {
    const el = await mountPicker({ liveValue: '2026-03-15' });
    expect(readFacts(el).flags).toEqual([]);

    el.setCustomValidity('Unavailable');
    await wait(SETTLE);
    let facts = readFacts(el);
    expect(facts.flags, 'setCustomValidity did not set customError').toEqual(['customError']);
    expect(facts.validationMessage, 'the custom message was not carried').toBe('Unavailable');

    el.setCustomValidity('');
    await wait(SETTLE);
    facts = readFacts(el);
    expect(facts.flags, 'an empty custom message did not clear customError').toEqual([]);
    expect(facts.validationMessage).toBe('');
  });

  it('a custom error coexists with a calculated one', async () => {
    // `valueMissing` stands in for the calculated flag here; the range flags
    // are the visual tier's, for the reason the header gives.
    const el = await mountPicker({ attrs: { required: true } });
    el.setCustomValidity('Unavailable');
    await wait(SETTLE);
    expect(readFacts(el).flags, 'the calculated flag was replaced by the custom one')
      .toEqual(['customError', 'valueMissing']);
  });

  it('a custom error survives being combined with bad input', async () => {
    const el = await mountPicker({ attrs: { format: 'mm/dd/yyyy' } });
    el.setCustomValidity('Unavailable');
    await typeInto(el, '03/1');
    expect(readFacts(el).flags).toEqual(['badInput', 'customError']);
  });

  // ── "`invalid`/`errorText` are visual presentation only" ──────────────────
  it('the invalid flag and errorText change presentation, not validity', async () => {
    const el = await mountPicker({
      attrs: { invalid: true, 'error-text': 'Pick another day' },
      liveValue: '2026-03-15',
    });
    const facts = readFacts(el);
    expect(facts.flags, '`invalid` established native invalidity').toEqual([]);
    expect(facts.validationMessage, '`errorText` became a validation message').toBe('');
    // ...but it IS mirrored to the accessibility layer, which is the whole
    // point of "presentation only".
    expect(facts.ariaInvalid, '`invalid` was not mirrored to aria-invalid').toBe('true');
  });

  it('a calculated error mirrors to aria-invalid without `invalid` being set', async () => {
    const el = await mountPicker({ attrs: { required: true } });
    const facts = readFacts(el);
    expect(facts.flags).toEqual(['valueMissing']);
    expect(facts.ariaInvalid, 'a real constraint failure was not announced').toBe('true');
  });

  it('checkValidity agrees with the flags it reports', async () => {
    const el = await mountPicker({ attrs: { required: true } });
    expect(el.checkValidity(), 'an empty required control reported valid').toBe(false);
    el.value = '2026-03-15';
    await wait(SETTLE);
    expect(el.checkValidity(), 'a filled required control reported invalid').toBe(true);
  });
});
