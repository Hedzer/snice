/**
 * snice-color-picker matrix — the presentational surface and its a11y contract.
 *
 * The cross: `size` (3) x `show-input` (2) x `show-presets` (2) x description
 * state (3) x barred state (3: none / disabled / loading) = 108 combos, with
 * `label`, `required` and `invalid` rotated across them.
 *
 * The barred state is one dimension of three values rather than two booleans
 * because the doc gives `disabled` and `loading` DIFFERENT form meanings —
 * "Disabled controls are omitted and barred. Loading controls remain successful
 * but are inert and barred" — while giving them the same interaction meaning,
 * and a cross that treated them as independent flags would spend a quarter of
 * its combos on a state nobody can author meaningfully.
 */
import { describe, it, afterEach } from 'vitest';
import { cross, expectClean, removeComponent } from '../matrix-kit';
import {
  DEFAULTS, Problems, checkDescription, checkInvalidPresentation, checkLabel, checkLoading,
  checkPresets, checkStructure, checkValue, mountPicker, presetSwatches, swatch, textInput,
  type Format, type Size, type Vector,
} from './color-picker-support';

let el: HTMLElement | null = null;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

const DESCRIPTIONS = [
  { name: 'none', helperText: '', errorText: '' },
  { name: 'helper', helperText: 'Pick a brand colour', errorText: '' },
  { name: 'error+helper', helperText: 'Pick a brand colour', errorText: 'That is not a colour' },
];

const BARRED = [
  { name: 'enabled', disabled: false, loading: false },
  { name: 'disabled', disabled: true, loading: false },
  { name: 'loading', disabled: false, loading: true },
];

const combos = cross({
  size: ['small', 'medium', 'large'] as const,
  showInput: [true, false],
  showPresets: [false, true],
  description: DESCRIPTIONS,
  barred: BARRED,
}).map((combo, index) => {
  const description = combo.description as typeof DESCRIPTIONS[number];
  const barred = combo.barred as typeof BARRED[number];
  const label = index % 2 === 0 ? 'Brand colour' : '';
  const required = index % 3 === 0;
  const invalid = index % 5 === 0;
  return {
    ...combo, ...description, ...barred,
    label, required, invalid,
    id: `${combo.id}/[label=${label ? 'yes' : 'no'},required=${required},invalid=${invalid}]`,
  };
});

/** The documented preset list, from the doc's `presets: string[] = [...]`. */
const PRESETS = ['#000000', '#ffffff', '#f87171', '#3b82f6'];

describe('color-picker matrix: presentation', () => {
  for (const combo of combos) {
    const vector: Vector = {
      ...DEFAULTS,
      size: combo.size as Size,
      showInput: combo.showInput,
      showPresets: combo.showPresets,
      helperText: combo.helperText,
      errorText: combo.errorText,
      disabled: combo.disabled,
      loading: combo.loading,
      label: combo.label,
      required: combo.required,
      invalid: combo.invalid,
      name: 'colour',
    };

    it(combo.id, async () => {
      el = await mountPicker(vector, { value: '#3b82f6', presets: PRESETS });
      const problems = new Problems();

      checkStructure(problems, el, vector);
      checkLabel(problems, el, vector);
      checkDescription(problems, el, vector);
      checkLoading(problems, el, vector);
      checkPresets(problems, el, vector, PRESETS, '#3b82f6');
      checkValue(problems, el, vector, { value: '#3b82f6', canonical: '#3b82f6' });
      // Nothing is wrong with `#3b82f6`, so any invalid styling is `invalid`'s.
      checkInvalidPresentation(problems, el, vector, false);

      expectClean(problems, combo.id);
    });
  }
});

describe('color-picker matrix: the accessible name', () => {
  // "With text input, the swatch is `<name> color chooser`; without it, the
  // swatch owns the base name." / "Base name precedence: associated labels,
  // then `label`, then fallback `Color`."
  for (const showInput of [true, false]) {
    for (const label of ['', 'Brand colour']) {
      const id = `show-input=${showInput}/label="${label}"`;
      it(id, async () => {
        const vector: Vector = { ...DEFAULTS, showInput, label, name: 'colour' };
        el = await mountPicker(vector);
        const problems = new Problems();

        const base = label || 'Color';
        const swatchName = swatch(el)?.getAttribute('aria-label');
        problems.equal(swatchName, showInput ? `${base} color chooser` : base,
          'the swatch accessible name');

        if (showInput) {
          problems.equal(textInput(el)?.getAttribute('aria-label'), base,
            'the editable input accessible name');
        }

        expectClean(problems, id);
      });
    }
  }

  it('every preset says which colour it sets', async () => {
    // "Presets are `Set <name> to <color>`."
    const vector: Vector = { ...DEFAULTS, showPresets: true, label: 'Brand colour' };
    el = await mountPicker(vector, { presets: PRESETS });
    const problems = new Problems();

    const labels = presetSwatches(el).map(preset => preset.getAttribute('aria-label'));
    problems.equal(labels, PRESETS.map(colour => `Set Brand colour to ${colour}`),
      'preset accessible names');

    expectClean(problems, 'presets/names');
  });
});

describe('color-picker matrix: the documented defaults', () => {
  it('<snice-color-picker> is a medium hex picker showing black', async () => {
    el = await mountPicker();
    const problems = new Problems();
    const picker = el as any;

    problems.equal(picker.size, DEFAULTS.size, 'default size');
    problems.equal(picker.value, DEFAULTS.value, 'default value');
    problems.equal(picker.defaultValue, DEFAULTS.defaultValue, 'default defaultValue');
    problems.equal(picker.format, DEFAULTS.format, 'default format');
    problems.equal(picker.label, DEFAULTS.label, 'default label');
    problems.equal(picker.helperText, DEFAULTS.helperText, 'default helperText');
    problems.equal(picker.errorText, DEFAULTS.errorText, 'default errorText');
    problems.equal(picker.disabled, DEFAULTS.disabled, 'default disabled');
    problems.equal(picker.loading, DEFAULTS.loading, 'default loading');
    problems.equal(picker.required, DEFAULTS.required, 'default required');
    problems.equal(picker.invalid, DEFAULTS.invalid, 'default invalid');
    problems.equal(picker.name, DEFAULTS.name, 'default name');
    problems.equal(picker.showInput, DEFAULTS.showInput, 'default showInput');
    problems.equal(picker.showPresets, DEFAULTS.showPresets, 'default showPresets');
    problems.check(Array.isArray(picker.presets) && picker.presets.length > 0,
      'the documented default preset list is empty');
    problems.equal(picker.type, 'color', 'type');
    problems.equal(picker.form, null, 'form outside a <form>');

    const vector = { ...DEFAULTS } as Vector;
    checkStructure(problems, el, vector);
    checkLabel(problems, el, vector);
    checkDescription(problems, el, vector);
    checkLoading(problems, el, vector);
    checkValue(problems, el, vector, { value: '#000000', canonical: '#000000' });
    checkPresets(problems, el, vector, [], null);

    expectClean(problems, 'defaults');
  });

  it('the placeholder names the format the input expects', async () => {
    const placeholders: Record<Format, string> = {
      hex: '#000000', rgb: 'rgb(0,0,0)', hsl: 'hsl(0,0%,0%)',
    };
    const problems = new Problems();
    for (const format of ['hex', 'rgb', 'hsl'] as const) {
      el = await mountPicker({ format });
      problems.equal(textInput(el)?.getAttribute('placeholder'), placeholders[format],
        `placeholder for format="${format}"`);
      el.remove();
      el = null;
    }
    expectClean(problems, 'placeholders');
  });
});
