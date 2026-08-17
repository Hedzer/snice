/**
 * Matrix slice TIME-PICKER / CHROME — the parts, the naming, and the two
 * variants.
 *
 * Contract (docs/ai/components/time-picker.md):
 *   § CSS parts — `base`, `label`, `input`, `toggle`, `clear`, `spinner`,
 *     `dropdown`, `hours`, `minutes`, `seconds`, `period`, `helper-text`,
 *     `error-text`.
 *   § Interaction — "Inline: selectors stay visible and interactive; it does
 *     not retain a popover attribute and is the external-label focus target."
 *   § Labels and accessible names — "Base name precedence: associated labels,
 *     then `label`, then fallback `Time`" and "Related names:
 *     `<name>: open time picker`, `Clear <name>`, `<name> controls`, and
 *     `<name> hours|minutes|seconds|period`".
 *   "One stable `aria-describedby` targets helper/error text; error replaces
 *    helper, uses `role=\"alert\"`, and invalid state uses `aria-invalid`."
 *   § Properties — `variant`, `size`, `clearable`, `loading`, `placeholder`.
 *
 * Dimensions: variant (2) x size (3) x decoration (4) = 24 combos, plus the
 * blocked-state cross (4 states x 2 variants = 8) and the naming sweep.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { unmountAll, product } from '../matrix-utils';
import {
  picker, comboId, mountPicker, pickerProblems, read, defaultPlaceholder,
  installInternalsMock, restoreInternalsMock,
  VARIANTS, SIZES, FORMATS, PARTS, type TimeCombo, type TimePickerVariant,
  type TimePickerSize, type TimePickerFormat,
} from './time-picker-support';

type Decoration = 'bare' | 'label' | 'helper' | 'error';

const decorate = (decoration: Decoration): Partial<TimeCombo> => ({
  bare: {},
  label: { label: 'Appointment' },
  helper: { label: 'Appointment', helperText: 'Office hours only.' },
  error: { label: 'Appointment', helperText: 'Office hours only.', errorText: 'Pick a time.' },
}[decoration]);

describe('time-picker matrix: chrome', () => {
  beforeEach(() => { installInternalsMock(); });
  afterEach(() => { restoreInternalsMock(); unmountAll(); });

  for (const point of product({
    variant: VARIANTS,
    size: SIZES,
    decoration: ['bare', 'label', 'helper', 'error'] as Decoration[],
  })) {
    const c: TimeCombo = picker({
      variant: point.variant as TimePickerVariant,
      size: point.size as TimePickerSize,
      defaultValue: '14:05',
      step: 5,
      clearable: true,
      name: 'when',
      ...decorate(point.decoration as Decoration),
    });

    it(`${point.decoration}: ${comboId(c)} size=${c.size}`, async () => {
      const el = await mountPicker(c);
      expect(pickerProblems(el, c), comboId(c)).toEqual([]);
    });
  }

  // ── The blocked states ──────────────────────────────────────────────────

  for (const point of product({
    variant: VARIANTS,
    state: ['none', 'disabled', 'readonly', 'loading'] as const,
  })) {
    const state = point.state as 'none' | 'disabled' | 'readonly' | 'loading';
    const c: TimeCombo = picker({
      variant: point.variant as TimePickerVariant,
      defaultValue: '14:05', step: 5, clearable: true, name: 'when',
      ...(state === 'none' ? {} : { [state]: true }),
    });

    it(`${state}: ${comboId(c)}`, async () => {
      const el = await mountPicker(c);
      expect(pickerProblems(el, c), comboId(c)).toEqual([]);

      // Every selector option is inert in a blocked state, whichever variant.
      const options = [...el.shadowRoot.querySelectorAll('.selector-item')] as HTMLButtonElement[];
      const blocked = state === 'disabled' || state === 'readonly' || state === 'loading';
      if (blocked) {
        expect(options.every(o => o.disabled), `${state} left an option live`).toBe(true);
      } else {
        expect(options.some(o => !o.disabled), 'every option is inert with nothing blocking')
          .toBe(true);
      }
    });
  }

  // ── The documented part list, in one render ─────────────────────────────

  it('a fully-dressed dropdown renders every documented part', async () => {
    const c = picker({
      variant: 'dropdown', format: '12h', showSeconds: true, loading: true,
      clearable: true, label: 'Appointment', helperText: 'Office hours only.',
      defaultValue: '14:05:10', step: 5, name: 'when',
    });
    const el = await mountPicker(c);
    // Everything except error-text, which is documented to REPLACE the helper.
    expect(read(el).parts.sort())
      .toEqual(PARTS.filter(name => name !== 'error-text').slice().sort());
  });

  it('the error text replaces the helper text and announces itself', async () => {
    const c = picker({
      label: 'Appointment', helperText: 'Office hours only.', errorText: 'Pick a time.',
      defaultValue: '14:05', step: 5, name: 'when',
    });
    const el = await mountPicker(c);
    const r = read(el);
    expect(r.helperText, 'the helper text survived alongside the error').toBeNull();
    expect(r.errorText).toBe('Pick a time.');
    expect(r.describedNodeRole).toBe('alert');
    expect(r.describedNodeText).toBe('Pick a time.');
    expect(pickerProblems(el, c)).toEqual([]);
  });

  it('the describedby id is stable across a helper/error swap', async () => {
    const c = picker({ label: 'Appointment', helperText: 'Office hours only.', step: 5, name: 'when' });
    const el = await mountPicker(c);
    const first = read(el).describedBy;
    expect(first, 'no aria-describedby with helper text').toBeTruthy();

    el.setAttribute('error-text', 'Pick a time.');
    await (el as any).rendered;
    expect(read(el).describedBy, 'the describedby target changed identity').toBe(first);

    el.removeAttribute('error-text');
    await (el as any).rendered;
    expect(read(el).describedBy).toBe(first);
  });

  // ── Naming ──────────────────────────────────────────────────────────────

  for (const point of product({ label: ['', 'Appointment'], variant: VARIANTS })) {
    const label = point.label as string;
    const c: TimeCombo = picker({
      label, variant: point.variant as TimePickerVariant, format: '12h',
      showSeconds: true, step: 5, name: 'when',
    });

    it(`naming: label="${label}" ${c.variant}`, async () => {
      const el = await mountPicker(c);
      const name = label || 'Time';           // documented fallback
      const r = read(el);
      expect(r.dropdownLabel).toBe(`${name} controls`);
      for (const unit of ['hours', 'minutes', 'seconds', 'period'] as const) {
        expect(el.shadowRoot.querySelector(`[part="${unit}"]`)?.getAttribute('aria-label'),
          `${unit} group`).toBe(`${name} ${unit}`);
      }
      if (c.variant === 'dropdown') {
        expect(r.ariaLabel).toBe(name);
        expect(r.toggleLabel).toBe(`${name}: open time picker`);
        expect(r.clearLabel).toBe(`Clear ${name}`);
      }
      expect(pickerProblems(el, c), comboId(c)).toEqual([]);
    });
  }

  it('an associated label outranks the label property', async () => {
    const external = document.createElement('label');
    external.setAttribute('for', 'when');
    external.textContent = 'Start time';
    document.body.append(external);

    const c = picker({ label: 'Appointment', step: 5, name: 'when' });
    const el = await mountPicker(c);
    el.id = 'when';
    el.remove();
    document.body.append(el);
    await (el as any).rendered;

    expect(read(el).ariaLabel, 'the label property outranked an associated label')
      .toBe('Start time');
    expect(el.labels?.length, 'the associated label is not listed').toBe(1);
  });

  // ── Placeholders ────────────────────────────────────────────────────────

  for (const point of product({ format: FORMATS, showSeconds: [false, true] })) {
    const c: TimeCombo = picker({
      format: point.format as TimePickerFormat,
      showSeconds: point.showSeconds as boolean, step: 5, name: 'when',
    });
    it(`placeholder: ${c.format}${c.showSeconds ? '/seconds' : ''}`, async () => {
      const el = await mountPicker(c);
      expect(read(el).placeholder).toBe(defaultPlaceholder(c.format, c.showSeconds));
      expect(pickerProblems(el, c)).toEqual([]);
    });
  }

  it('an authored placeholder wins over the documented default', async () => {
    const c = picker({ placeholder: 'When?', step: 5, name: 'when' });
    const el = await mountPicker(c);
    expect(read(el).placeholder).toBe('When?');
    expect(pickerProblems(el, c)).toEqual([]);
  });

  // ── The clear button's own contract ─────────────────────────────────────

  it('the clear button appears only when there is something to clear', async () => {
    const empty = picker({ clearable: true, step: 5, name: 'when' });
    const el = await mountPicker(empty);
    expect(read(el).clearVisible, 'an empty control offered a clear button').toBe(false);
    unmountAll();

    const filled = picker({ clearable: true, defaultValue: '14:05', step: 5, name: 'when' });
    const el2 = await mountPicker(filled);
    expect(read(el2).clearVisible, 'a filled control hid its clear button').toBe(true);
    expect(pickerProblems(el2, filled)).toEqual([]);
  });

  // ── The two variants ────────────────────────────────────────────────────

  it('the inline variant keeps its selectors visible and takes no popover', async () => {
    const c = picker({ variant: 'inline', defaultValue: '14:05', step: 5, name: 'when' });
    const el = await mountPicker(c);
    const dropdown = el.shadowRoot.querySelector('[part="dropdown"]') as HTMLElement;

    expect(dropdown.hasAttribute('hidden'), 'the inline selectors are hidden').toBe(false);
    expect(dropdown.getAttribute('popover'), 'the inline variant kept a popover attribute')
      .toBeNull();
    expect(read(el).parts.includes('input'), 'the inline variant rendered a text input')
      .toBe(false);
    expect(pickerProblems(el, c)).toEqual([]);
  });

  it('the dropdown variant starts closed and is a popover', async () => {
    const c = picker({ variant: 'dropdown', defaultValue: '14:05', step: 5, name: 'when' });
    const el = await mountPicker(c);
    const dropdown = el.shadowRoot.querySelector('[part="dropdown"]') as HTMLElement;
    expect(dropdown.hasAttribute('hidden'), 'the dropdown started open').toBe(true);
    expect((dropdown as any).popover, 'the dropdown is not a popover').toBe('manual');
    expect(pickerProblems(el, c)).toEqual([]);
  });
});
