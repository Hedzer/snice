/**
 * snice-color-picker matrix — the documented validation contract.
 *
 * Quoted from the doc, and asserted below:
 *   · "Empty `required` reports `valueMissing`; the default `#000000` already
 *      satisfies required."
 *   · "`setCustomValidity()` supplies `customError`; `invalid`/`errorText` are
 *      presentation only."
 *   · "Calculated errors drive styling, `aria-invalid`, form reporting, and
 *      submission blocking."
 *   · "Disabled controls are omitted and barred. Loading controls remain
 *      successful but are inert and barred."
 *
 * SIMULATION BOUNDARY: without `ElementInternals` the individual validity FLAGS
 * come from the native input the component renders, which it can only reach
 * through `setCustomValidity()`. So this tier asserts validity, the message,
 * and the presentation it drives; the flag names are asserted against a real
 * `ElementInternals` in the visual tier.
 */
import { describe, it, afterEach } from 'vitest';
import { cross, expectClean, removeComponent } from '../matrix-kit';
import {
  DEFAULTS, Problems, checkInvalidPresentation, checkValidity, mountPicker, typeValue, wait,
  SETTLE, type Vector,
} from './color-picker-support';

let el: HTMLElement | null = null;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

describe('color-picker matrix: required', () => {
  // The cross: `required` (2) x authored value (3) x barred state (3).
  const VALUES = [
    { name: 'default-black', value: undefined, empty: false },
    { name: 'authored', value: '#3b82f6', empty: false },
    { name: 'empty', value: '', empty: true },
  ];
  const BARRED = [
    { name: 'enabled', disabled: false, loading: false },
    { name: 'disabled', disabled: true, loading: false },
    { name: 'loading', disabled: false, loading: true },
  ];

  for (const combo of cross({ required: [false, true], value: VALUES, barred: BARRED })) {
    const entry = combo.value as typeof VALUES[number];
    const barred = combo.barred as typeof BARRED[number];
    const id = `required=${combo.required}/${entry.name}/${barred.name}`;

    it(id, async () => {
      const vector: Vector = {
        ...DEFAULTS, required: combo.required,
        disabled: barred.disabled, loading: barred.loading, name: 'colour',
      };
      el = await mountPicker(vector, { value: entry.value });
      const problems = new Problems();

      // "Disabled controls are omitted and barred. Loading controls remain
      // successful but are inert and barred." Both are barred, so neither ever
      // reports a constraint failure.
      const isBarred = barred.disabled || barred.loading;
      const missing = combo.required && entry.empty && !isBarred;

      problems.equal((el as any).willValidate, !isBarred,
        `willValidate for a ${barred.name} control`);
      checkValidity(problems, el, { valid: !missing });
      checkInvalidPresentation(problems, el, vector, missing);

      expectClean(problems, id);
    });
  }

  it('the documented default #000000 already satisfies required', async () => {
    // Quoted directly: "the default `#000000` already satisfies required".
    const vector: Vector = { ...DEFAULTS, required: true, name: 'colour' };
    el = await mountPicker(vector);
    const problems = new Problems();
    problems.equal((el as any).value, '#000000', 'the default value');
    checkValidity(problems, el, { valid: true, valueMissing: false });
    expectClean(problems, 'required/default-black');
  });
});

describe('color-picker matrix: setCustomValidity', () => {
  for (const message of ['That colour fails contrast', 'Reserved for the error state']) {
    it(`setCustomValidity("${message}")`, async () => {
      const vector: Vector = { ...DEFAULTS, name: 'colour' };
      el = await mountPicker(vector, { value: '#3b82f6' });
      const problems = new Problems();

      checkValidity(problems, el, { valid: true });

      (el as any).setCustomValidity(message);
      await wait(SETTLE);
      checkValidity(problems, el, { valid: false, customError: true });
      problems.equal((el as any).validationMessage, message, 'validationMessage');
      checkInvalidPresentation(problems, el, vector, true);

      // "pass `''` to clear it"
      (el as any).setCustomValidity('');
      await wait(SETTLE);
      checkValidity(problems, el, { valid: true, customError: false });
      problems.equal((el as any).validationMessage, '', 'validationMessage after clearing');
      checkInvalidPresentation(problems, el, vector, false);

      expectClean(problems, `setCustomValidity/${message}`);
    });
  }

  it('an application error outranks a malformed value in the message', async () => {
    // Both are real; the doc calls the custom one "an independent application
    // error", so it is the one the customer is told about.
    const vector: Vector = { ...DEFAULTS, name: 'colour' };
    el = await mountPicker(vector);
    const problems = new Problems();

    await typeValue(el, 'not a colour');
    (el as any).setCustomValidity('Server rejected that colour');
    await wait(SETTLE);

    checkValidity(problems, el, { valid: false });
    problems.equal((el as any).validationMessage, 'Server rejected that colour',
      'validationMessage with both a custom error and malformed text');

    expectClean(problems, 'setCustomValidity/precedence');
  });
});

describe('color-picker matrix: invalid and errorText are presentation only', () => {
  for (const combo of cross({
    invalid: [false, true],
    errorText: ['', 'Server said no'],
    value: ['#3b82f6', ''],
  })) {
    it(combo.id, async () => {
      const vector: Vector = {
        ...DEFAULTS, invalid: combo.invalid, errorText: combo.errorText, name: 'colour',
      };
      el = await mountPicker(vector, { value: combo.value });
      const problems = new Problems();

      // Neither is a constraint. The control is not `required`, so an empty
      // value is a valid one.
      checkValidity(problems, el, { valid: true, customError: false, valueMissing: false });
      checkInvalidPresentation(problems, el, vector, false);

      expectClean(problems, combo.id);
    });
  }
});

describe('color-picker matrix: correcting a malformed value', () => {
  // "Malformed editable text remains visible/live … it is never silently
  // replaced with black." Which means the correction path has to work: typing
  // something valid over it clears the error.
  const CORRECTIONS = [
    ['#3b82f6', '#3b82f6'],
    ['rgb(0, 0, 0)', '#000000'],
    ['hsl(120, 100%, 50%)', '#00ff00'],
  ] as const;

  for (const [typed, canonical] of CORRECTIONS) {
    it(`malformed then "${typed}"`, async () => {
      const vector: Vector = { ...DEFAULTS, name: 'colour' };
      el = await mountPicker(vector);
      const problems = new Problems();

      await typeValue(el, 'nonsense');
      problems.equal((el as any).value, 'nonsense',
        'malformed text was replaced instead of kept live');
      checkValidity(problems, el, { valid: false });
      checkInvalidPresentation(problems, el, vector, true);

      await typeValue(el, typed);
      problems.equal((el as any).value, canonical, 'the corrected value');
      checkValidity(problems, el, { valid: true });
      checkInvalidPresentation(problems, el, vector, false);

      expectClean(problems, `correct/${typed}`);
    });
  }

  it('an empty value clears a malformed one without becoming black', async () => {
    const vector: Vector = { ...DEFAULTS, name: 'colour' };
    el = await mountPicker(vector);
    const problems = new Problems();

    await typeValue(el, 'nonsense');
    await typeValue(el, '');

    problems.equal((el as any).value, '', 'clearing the field');
    // Not required, so an empty colour is simply no colour.
    checkValidity(problems, el, { valid: true });

    expectClean(problems, 'correct/empty');
  });
});

describe('color-picker matrix: reportValidity agrees with checkValidity', () => {
  for (const combo of cross({
    required: [false, true], value: ['#3b82f6', '', 'nonsense'],
  })) {
    it(combo.id, async () => {
      el = await mountPicker({ required: combo.required, name: 'colour' });
      const problems = new Problems();

      if (combo.value !== '#3b82f6') await typeValue(el, combo.value);
      else (el as any).value = combo.value;
      await wait(SETTLE);

      const picker = el as any;
      problems.equal(picker.reportValidity(), picker.checkValidity(),
        'reportValidity() disagreed with checkValidity()');

      expectClean(problems, combo.id);
    });
  }
});
