/**
 * Matrix slice DATE-TIME-PICKER / FORM PARTICIPATION — the four states that
 * change what a form sees.
 *
 * Dimensions: state (5) x value (3) = 15 combos, plus the interaction-blocking
 * cross below.
 *
 * Documented contract:
 *   · "`disabled`/disabled fieldset: no interaction, omitted from FormData,
 *     barred validation."
 *   · "`readonly`: submitted but barred."
 *   · "`loading`: submitted but interaction/validation blocked."
 *
 * "Barred from validation" is the shared half, and it is the half a DOM test can
 * see exactly: a barred control raises NO validity flags, however empty,
 * required or malformed it is. That is asserted for all five states here.
 *
 * The other half — "omitted from FormData" — is performed by the browser for
 * every disabled form-associated element, whatever the control hands to
 * `setFormValue`. happy-dom implements neither `new FormData(form)` for custom
 * elements nor fieldset disabledness, so that clause is asserted in the visual
 * tier (tests/live/matrix/date-time-picker), against a real engine, and this
 * file deliberately does not pretend to check it. Fieldset disabledness is
 * reached the way the browser reaches it, by invoking `formDisabledCallback`.
 *
 * it.fails policy: no finding is pinned in this file.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  mountPicker, cleanupPickers, installInternalsMock, restoreInternalsMock,
  readFacts, valueByName, canonical, Problems, expectClean,
  collectEvents, sequence, part, click, wait, SETTLE,
  type SniceDateTimePickerElement,
} from './date-time-picker-support';

interface State {
  name: string;
  attrs: Record<string, any>;
  /** Applied after mount — the browser's own path into fieldset disabledness. */
  after?: (el: SniceDateTimePickerElement) => void;
  /** Documented as blocking interaction and barring validation. */
  barred: boolean;
}

const STATES: State[] = [
  { name: 'enabled', attrs: {}, barred: false },
  { name: 'disabled', attrs: { disabled: true }, barred: true },
  { name: 'readonly', attrs: { readonly: true }, barred: true },
  { name: 'loading', attrs: { loading: true }, barred: true },
  {
    name: 'fieldset-disabled',
    attrs: {},
    after: el => (el as any).formDisabledCallback(true),
    barred: true,
  },
];

const SAMPLES = ['empty', 'canonical', 'malformed'];

describe('date-time-picker matrix: form participation', () => {
  beforeEach(() => installInternalsMock());
  afterEach(() => { cleanupPickers(); restoreInternalsMock(); });

  for (const state of STATES) {
    for (const sampleName of SAMPLES) {
      const sample = valueByName(sampleName);
      const id = `${state.name}/${sampleName}`;

      it(`${id}: ${state.barred ? 'is barred from validation' : 'validates normally'}`, async () => {
        const el = await mountPicker({
          attrs: { ...state.attrs, name: 'appointment', required: true },
          liveValue: sample.input,
        });
        state.after?.(el);
        await wait(SETTLE);

        const facts = readFacts(el);
        const problems = new Problems();

        if (state.barred) {
          problems.eq('a barred control raises no flags', facts.flags, []);
        } else {
          // required + this sample: empty and malformed are both "missing" a
          // usable value, and a non-empty unparseable one is also badInput.
          const wanted = sample.parts
            ? []
            : (sample.input === '' ? ['valueMissing'] : ['badInput', 'valueMissing']);
          problems.eq('validity flags', facts.flags, wanted);
        }

        // "readonly: submitted", "loading: submitted" — and an enabled control
        // submits too. `disabled` is the browser's business (see the header).
        problems.eq('value handed to the form', facts.formValue, canonical(sample.parts, false));

        expectClean(problems, id);
      });
    }
  }

  // ── "no interaction" / "interaction blocked" ──────────────────────────────
  // Three of the four states are documented as blocking interaction. The
  // dropdown is the interaction, so it must not open — by method OR by toggle.

  for (const state of STATES.filter(s => s.barred)) {
    it(`${state.name}: open() cannot open the dropdown`, async () => {
      const el = await mountPicker({ attrs: state.attrs });
      state.after?.(el);
      await wait(SETTLE);

      const seen = collectEvents(el, ['datetimepicker-open']);
      el.open();
      await wait(SETTLE);

      expect(readFacts(el).panelOpen, `${state.name} opened its dropdown`).toBe(false);
      expect(sequence(seen), `${state.name} announced an open it did not perform`).toEqual([]);
    });

    it(`${state.name}: the toggle button cannot open the dropdown`, async () => {
      const el = await mountPicker({ attrs: state.attrs });
      state.after?.(el);
      await wait(SETTLE);

      const seen = collectEvents(el, ['datetimepicker-open']);
      click(part(el, 'toggle'));
      await wait(SETTLE);

      expect(readFacts(el).panelOpen, `${state.name} opened via its toggle`).toBe(false);
      expect(sequence(seen)).toEqual([]);
    });
  }

  it('an enabled control does open, so the blocked cases mean something', async () => {
    const el = await mountPicker({});
    el.open();
    await wait(SETTLE);
    expect(readFacts(el).panelOpen).toBe(true);
  });

  // ── The native form surface the docs promise ──────────────────────────────

  it('exposes the documented native form API', async () => {
    const el = await mountPicker({ attrs: { name: 'appointment' } });
    expect((el as any).type).toBe('datetime-local');
    expect(el.willValidate).toBe(true);
    expect(typeof el.checkValidity).toBe('function');
    expect(typeof el.reportValidity).toBe('function');
    expect(typeof el.setCustomValidity).toBe('function');
    expect(el.labels).not.toBeUndefined();
  });
});
