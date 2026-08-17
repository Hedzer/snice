/**
 * Matrix slice TIME-PICKER / FORM PARTICIPATION — the live/default lifecycle
 * and the form contract.
 *
 * Contract (docs/ai/components/time-picker.md § Live/default lifecycle and
 * § Form behavior):
 *   "Pristine `defaultValue`/`value`-attribute changes update live `value`."
 *   "After property input/selection/clear/restore makes the control dirty,
 *    attribute changes update only `defaultValue`."
 *   "`form.reset()` restores `defaultValue` with no user-change events."
 *   "`formStateRestoreCallback` accepts string state only. Valid display or
 *    canonical text restores canonical `value`; partial text stays
 *    visible/invalid. Non-string state is ignored atomically."
 *   "Exact visible text is stored as browser restoration state; canonical time
 *    is stored as the successful control value."
 *   "Pre-upgrade own `value` assignments are adopted without leaving a
 *    shadowing own property."
 *   "`format` and `showSeconds` update presentation/submission precision
 *    without rewriting the reset default."
 *   "Authored/inherited `disabled`: all user paths blocked, omitted from
 *    `FormData`, barred from validation. Inherited disabledness does not mutate
 *    `disabled` or its attribute."
 *   "`readonly` / `loading`: all user editing blocked and barred from
 *    validation; current value remains in `FormData`."
 *   "Reconnect preserves live/default state, form association, and
 *    outside-click behavior."
 *   "Internal text input has no `name`; ElementInternals is the only form
 *    entry, preventing duplicates."
 *
 * Dimensions: the dirtying cross (source 4 x attribute change 2 = 8), the
 * restore sweep (8), the blocked-state submission cross (4), plus reset
 * repetition, reconnection and the pre-upgrade case.
 *
 * The REAL `FormData`/`form.reset()`/`<fieldset disabled>` algorithms — which
 * happy-dom does not implement for a form-associated custom element — are
 * asserted in a real engine by
 * `tests/live/matrix/time-picker/time-picker-visual.spec.ts`.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { unmountAll, product, captureEvents } from '../matrix-utils';
import {
  picker, mountPicker, pickerProblems, read, typeInto, clickOption, part,
  installInternalsMock, restoreInternalsMock, internalsFor, activeFlags,
  type TimeCombo,
} from './time-picker-support';

describe('time-picker matrix: the live/default lifecycle', () => {
  beforeEach(() => { installInternalsMock(); });
  afterEach(() => { restoreInternalsMock(); unmountAll(); });

  it('a pristine control follows its default through the value attribute', async () => {
    const c = picker({ defaultValue: '09:00', step: 5, name: 'when' });
    const el = await mountPicker(c);
    expect(el.value).toBe('09:00');

    el.setAttribute('value', '10:30');
    await (el as any).rendered;
    expect(el.value, 'a pristine control ignored its new default').toBe('10:30');
    expect(el.defaultValue).toBe('10:30');
    expect(read(el).inputValue).toBe('10:30');
  });

  for (const source of ['assignment', 'typing', 'selection', 'clear', 'restore'] as const) {
    it(`${source} dirties the control, and the default stops moving it`, async () => {
      const c = picker({ defaultValue: '09:00', step: 15, clearable: true, name: 'when' });
      const el = await mountPicker(c);

      switch (source) {
        case 'assignment': el.value = '11:45'; await (el as any).rendered; break;
        case 'typing': await typeInto(el, '11:45'); break;
        case 'selection': await clickOption(el, 'hours', '11'); await clickOption(el, 'minutes', '45'); break;
        case 'clear': el.clear(); await (el as any).rendered; break;
        case 'restore': el.formStateRestoreCallback('11:45'); await (el as any).rendered; break;
      }
      const dirtied = el.value;

      el.setAttribute('value', '06:15');
      await (el as any).rendered;

      expect(el.value, `${source} did not dirty the control`).toBe(dirtied);
      expect(el.defaultValue, 'the new default was not recorded').toBe('06:15');
    });
  }

  it('form reset restores the latest default and emits no user-change event', async () => {
    const c = picker({ defaultValue: '09:00', step: 5, name: 'when' });
    const el = await mountPicker(c);
    const events = captureEvents(el, ['time-change', 'timepicker-clear']);

    await typeInto(el, '11:45');
    events.events.length = 0;

    el.setAttribute('value', '10:30');       // the LATEST default
    await (el as any).rendered;
    el.formResetCallback();
    await (el as any).rendered;

    expect(el.value, 'reset did not restore the latest default').toBe('10:30');
    expect(events.types(), 'reset emitted a user-change event').toEqual([]);
    expect(pickerProblems(el, picker({ ...c, defaultValue: '10:30' }))).toEqual([]);
  });

  it('repeated reset is idempotent', async () => {
    const c = picker({ defaultValue: '09:00', step: 5, name: 'when' });
    const el = await mountPicker(c);
    await typeInto(el, '11:45');
    for (let i = 0; i < 3; i++) { el.formResetCallback(); await (el as any).rendered; }
    expect(el.value).toBe('09:00');
    expect(read(el).inputValue).toBe('09:00');
  });

  it('reset after a clear brings the default back', async () => {
    const c = picker({ defaultValue: '09:00', clearable: true, step: 5, name: 'when' });
    const el = await mountPicker(c);
    el.clear();
    await (el as any).rendered;
    expect(internalsFor(el).formValue).toBe('');

    el.formResetCallback();
    await (el as any).rendered;
    expect(internalsFor(el).formValue).toBe('09:00');
  });

  // ── Browser restore ─────────────────────────────────────────────────────

  for (const [state, visible, canonicalValue] of [
    ['14:05', '14:05', '14:05'],           // canonical text
    ['2:05 PM', '14:05', '14:05'],         // valid DISPLAY text in 24h? no — see below
    ['14:', '14:', ''],                    // partial text stays visible/invalid
    ['lunchtime', 'lunchtime', ''],        // malformed text stays visible/invalid
  ] as Array<[string, string, string]>) {
    it(`restoring "${state}" keeps the control honest`, async () => {
      const c = picker({ format: '24h', step: 5, name: 'when' });
      const el = await mountPicker(c);
      el.formStateRestoreCallback(state);
      await (el as any).rendered;

      // "Valid display or canonical text restores canonical `value`; partial
      // text stays visible/invalid." In a 24-hour display, `2:05 PM` is neither
      // canonical nor valid display text, so it is preserved like any other
      // malformed string.
      const expectedVisible = state === '2:05 PM' ? '2:05 PM' : visible;
      const expectedCanonical = state === '2:05 PM' ? '' : canonicalValue;
      expect(read(el).inputValue, `restore("${state}") visible text`).toBe(expectedVisible);
      expect(internalsFor(el).formValue, `restore("${state}") submitted value`)
        .toBe(expectedCanonical);
      expect(pickerProblems(el, c, { visible: expectedVisible, canonical: expectedCanonical }))
        .toEqual([]);
    });
  }

  it('a 12-hour display restores its own display text', async () => {
    const c = picker({ format: '12h', step: 5, name: 'when' });
    const el = await mountPicker(c);
    el.formStateRestoreCallback('2:05 PM');
    await (el as any).rendered;

    expect(read(el).inputValue).toBe('2:05 PM');
    expect(internalsFor(el).formValue).toBe('14:05');
  });

  for (const state of [null, 42, {}, new FormData()] as unknown[]) {
    it(`a non-string restore state (${typeof state}) is ignored atomically`, async () => {
      const c = picker({ defaultValue: '09:00', step: 5, name: 'when' });
      const el = await mountPicker(c);
      el.formStateRestoreCallback(state as any);
      await (el as any).rendered;

      expect(el.value, 'a non-string restore changed the value').toBe('09:00');
      expect(pickerProblems(el, c)).toEqual([]);
    });
  }

  it('the restoration state is the exact visible text, not the canonical value', async () => {
    const c = picker({ format: '12h', defaultValue: '14:05', step: 5, name: 'when' });
    const el = await mountPicker(c);
    const internals = internalsFor(el);
    expect(internals.formValue, 'the successful value is not canonical').toBe('14:05');
    expect(internals.state, 'the restoration state is not the visible text').toBe('2:05 PM');
  });

  // ── Pre-upgrade assignment ──────────────────────────────────────────────

  it('a value assigned before upgrade is adopted, leaving no own property', async () => {
    const el = document.createElement('snice-time-picker') as any;
    el.value = '16:20';                       // before the definition applies
    el.setAttribute('step', '5');
    el.setAttribute('name', 'when');
    document.body.append(el);
    await el.ready;
    await (el as any).rendered;

    expect(el.value, 'the pre-upgrade assignment was dropped').toBe('16:20');
    expect(Object.prototype.hasOwnProperty.call(el, 'value'),
      'an own property is shadowing the live-value accessor').toBe(false);
    expect(read(el).inputValue).toBe('16:20');
  });

  // ── Reconnection ────────────────────────────────────────────────────────

  it('reconnecting preserves the live value and the default', async () => {
    const c = picker({ defaultValue: '09:00', step: 5, name: 'when' });
    const el = await mountPicker(c);
    await typeInto(el, '11:45');

    const parent = el.parentElement!;
    el.remove();
    parent.append(el);
    await (el as any).rendered;

    expect(el.value).toBe('11:45');
    expect(el.defaultValue).toBe('09:00');
    expect(read(el).inputValue).toBe('11:45');
  });
});

describe('time-picker matrix: submission and blocked states', () => {
  beforeEach(() => { installInternalsMock(); });
  afterEach(() => { restoreInternalsMock(); unmountAll(); });

  for (const point of product({ state: ['none', 'disabled', 'readonly', 'loading'] as const })) {
    const state = point.state as 'none' | 'disabled' | 'readonly' | 'loading';
    const c: TimeCombo = picker({
      defaultValue: '14:05', step: 5, name: 'when', clearable: true,
      ...(state === 'none' ? {} : { [state]: true }),
    });

    it(`${state}: what reaches the form`, async () => {
      const el = await mountPicker(c);

      // The component's own half of the contract: it always publishes the
      // canonical value; `disabled` omission is the PLATFORM's half and is
      // asserted in a real engine by the visual tier.
      expect(internalsFor(el).formValue, `${state} published the wrong value`).toBe('14:05');
      expect(el.willValidate, `${state} validation participation`).toBe(state === 'none');
      expect(activeFlags(el), `${state} flags`).toEqual([]);
      expect(pickerProblems(el, c)).toEqual([]);
    });
  }

  for (const state of ['disabled', 'readonly', 'loading'] as const) {
    it(`${state} blocks every documented user path`, async () => {
      const c = picker({
        defaultValue: '14:05', step: 15, clearable: true, name: 'when',
        [state]: true,
      } as Partial<TimeCombo>);
      const el = await mountPicker(c);
      const events = captureEvents(el, ['time-change', 'timepicker-clear', 'timepicker-open']);

      await typeInto(el, '11:45');
      // The selector options are disabled; clicking one must change nothing.
      const option = el.shadowRoot.querySelector('[part="hours"] .selector-item') as HTMLButtonElement;
      option.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      part<HTMLElement>(el, 'toggle')?.dispatchEvent(
        new MouseEvent('click', { bubbles: true, composed: true }));
      part<HTMLElement>(el, 'clear')?.dispatchEvent(
        new MouseEvent('click', { bubbles: true, composed: true }));
      await (el as any).rendered;

      expect(el.value, `${state} let a user path through`).toBe('14:05');
      expect(events.types(), `${state} emitted a user event`).toEqual([]);
      expect(pickerProblems(el, c)).toEqual([]);
    });
  }

  it('inherited disabledness does not mutate the disabled property or attribute', async () => {
    const c = picker({ defaultValue: '14:05', step: 5, name: 'when' });
    const el = await mountPicker(c);

    el.formDisabledCallback(true);
    await (el as any).rendered;

    expect(el.disabled, 'inherited disabledness mutated the property').toBe(false);
    expect(el.hasAttribute('disabled'), 'inherited disabledness wrote the attribute').toBe(false);
    expect(el.willValidate, 'an inherited-disabled control still validates').toBe(false);

    el.formDisabledCallback(false);
    await (el as any).rendered;
    expect(el.willValidate).toBe(true);
    expect(el.value, 'the barred state rewrote the value').toBe('14:05');
    expect(pickerProblems(el, c)).toEqual([]);
  });

  it('the internal text input carries no name, so it cannot submit twice', async () => {
    const c = picker({ defaultValue: '14:05', step: 5, name: 'when' });
    const el = await mountPicker(c);
    const input = part<HTMLInputElement>(el, 'input')!;
    expect(input.hasAttribute('name'), 'the internal input would submit a second entry')
      .toBe(false);
    expect(input.name).toBe('');
  });
});
