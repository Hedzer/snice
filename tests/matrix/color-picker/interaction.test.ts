/**
 * snice-color-picker matrix — choosing a colour, and the events that report it.
 *
 * Documented:
 *   · `color-picker-input` -> `{ value, colorPicker }` — "During color adjustment"
 *   · `color-picker-change` -> `{ value, colorPicker }` — "Color committed"
 *   · `color-picker-focus` / `color-picker-blur` -> `{ colorPicker }`
 *   · "Typing, native/preset choice, restore, or any `value` assignment
 *      dirties it."
 *   · "Disabled, disabled-fieldset, and loading controls are inert to label,
 *      swatch, native-input, preset, and keyboard activation."
 *   · "Swatch and presets accept Enter and Space."
 */
import { describe, it, afterEach } from 'vitest';
import { cross, expectClean, removeComponent } from '../matrix-kit';
import {
  DEFAULTS, Problems, captureEvents, checkValue, click, hslToHex, mountPicker, nativeInput,
  presetSwatches, rgbToHex,
  press, swatch, textInput, typeValue, wait, SETTLE, type Vector,
} from './color-picker-support';

let el: HTMLElement | null = null;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

const PRESETS = ['#000000', '#ffffff', '#f87171', '#3b82f6'];

interface Detail { value: string; colorPicker: HTMLElement }

/** Choose a colour the way the hidden native chooser does. */
async function chooseNative(el: HTMLElement, hex: string): Promise<void> {
  const native = nativeInput(el);
  if (!native) throw new Error('no native chooser rendered');
  native.value = hex;
  native.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
  await wait(SETTLE);
}

describe('color-picker matrix: the three ways to choose a colour', () => {
  // The cross: entry point (3) x barred state (3) x format (3) = 27 combos.
  // Every entry point is documented, and every one of them is documented to be
  // inert while the control is barred.
  const ENTRIES = ['typing', 'native', 'preset'] as const;
  const BARRED = [
    { name: 'enabled', disabled: false, loading: false },
    { name: 'disabled', disabled: true, loading: false },
    { name: 'loading', disabled: false, loading: true },
  ];

  for (const combo of cross({
    entry: ENTRIES, barred: BARRED, format: ['hex', 'rgb', 'hsl'] as const,
  })) {
    const entry = combo.entry as typeof ENTRIES[number];
    const barred = combo.barred as typeof BARRED[number];
    const id = `${entry}/${barred.name}/format=${combo.format}`;

    it(id, async () => {
      const vector: Vector = {
        ...DEFAULTS,
        format: combo.format,
        disabled: barred.disabled,
        loading: barred.loading,
        showPresets: true,
        name: 'colour',
      };
      el = await mountPicker(vector, { value: '#000000', presets: PRESETS });
      const inputs = captureEvents<Detail>(el, 'color-picker-input');
      const changes = captureEvents<Detail>(el, 'color-picker-change');
      const problems = new Problems();

      const inert = barred.disabled || barred.loading;

      if (entry === 'typing') {
        // A barred control's text input is `disabled`, so a customer cannot
        // type into it at all — the event is dispatched here anyway to prove
        // the handler itself refuses.
        await typeValue(el, '#f87171');
      } else if (entry === 'native') {
        await chooseNative(el, '#f87171');
      } else {
        click(presetSwatches(el)[2]);
        await wait(SETTLE);
      }

      if (inert) {
        // Only the LIVE value is asserted for a barred control. The rendered
        // text and the hidden chooser's value are whatever this test just wrote
        // into them to simulate the attempt: the component refused the input,
        // so it never re-rendered, and reading those back would be reading the
        // harness's own keystrokes rather than the component's answer.
        problems.equal((el as any).value, '#000000',
          `a ${barred.name} control accepted a colour through the ${entry} path`);
      } else {
        checkValue(problems, el, vector, { value: '#f87171', canonical: '#f87171' });
      }

      // "During color adjustment" and "Color committed" both fire for a
      // completed choice; neither fires for a control that refused it.
      problems.equal(inputs.length, inert ? 0 : 1, 'color-picker-input events');
      problems.equal(changes.length, inert ? 0 : 1, 'color-picker-change events');
      if (!inert) {
        problems.equal(inputs[0]?.value, '#f87171', 'color-picker-input detail.value');
        problems.equal(changes[0]?.value, '#f87171', 'color-picker-change detail.value');
        problems.check(changes[0]?.colorPicker === el, 'detail.colorPicker');
      }

      expectClean(problems, id);
    });
  }
});

describe('color-picker matrix: presets', () => {
  for (const [index, colour] of PRESETS.entries()) {
    it(`clicking preset ${index} (${colour})`, async () => {
      const vector: Vector = { ...DEFAULTS, showPresets: true, name: 'colour' };
      el = await mountPicker(vector, { value: '#123456', presets: PRESETS });
      const changes = captureEvents<Detail>(el, 'color-picker-change');
      const problems = new Problems();

      click(presetSwatches(el)[index]);
      await wait(SETTLE);

      checkValue(problems, el, vector, { value: colour, canonical: colour });
      problems.equal(changes.length, 1, 'color-picker-change events');
      // The chosen preset is now the marked one, and it is the only one.
      const marked = presetSwatches(el)
        .map((preset, i) => (preset.classList.contains('preset--selected') ? i : -1))
        .filter(i => i >= 0);
      problems.equal(marked, [index], 'the marked preset');

      expectClean(problems, `preset/${index}`);
    });
  }

  for (const key of ['Enter', ' ']) {
    it(`a preset accepts "${key === ' ' ? 'Space' : key}"`, async () => {
      // "Swatch and presets accept Enter and Space."
      const vector: Vector = { ...DEFAULTS, showPresets: true, name: 'colour' };
      el = await mountPicker(vector, { value: '#123456', presets: PRESETS });
      const changes = captureEvents<Detail>(el, 'color-picker-change');
      const problems = new Problems();

      press(presetSwatches(el)[2], key);
      await wait(SETTLE);

      problems.equal((el as any).value, PRESETS[2], `the value after ${key}`);
      problems.equal(changes.length, 1, 'color-picker-change events');

      expectClean(problems, `preset/key/${key}`);
    });
  }

  it('a preset the value already matches is marked from the start', async () => {
    const vector: Vector = { ...DEFAULTS, showPresets: true };
    el = await mountPicker(vector, { value: '#f87171', presets: PRESETS });
    const problems = new Problems();

    const marked = presetSwatches(el)
      .map((preset, i) => (preset.classList.contains('preset--selected') ? i : -1))
      .filter(i => i >= 0);
    problems.equal(marked, [2], 'the marked preset for value="#f87171"');

    expectClean(problems, 'preset/preselected');
  });

  it('an equivalent colour in another notation still marks its preset', async () => {
    // The doc canonicalizes every accepted notation to six-digit hex, so
    // `rgb(248, 113, 113)` IS `#f87171` and the preset showing it is the one
    // the control is on.
    const vector: Vector = { ...DEFAULTS, showPresets: true };
    el = await mountPicker(vector, { value: 'rgb(248, 113, 113)', presets: PRESETS });
    const problems = new Problems();

    problems.equal((el as any).value, '#f87171', 'the canonicalized value');
    const marked = presetSwatches(el)
      .map((preset, i) => (preset.classList.contains('preset--selected') ? i : -1))
      .filter(i => i >= 0);
    problems.equal(marked, [2], 'the marked preset');

    expectClean(problems, 'preset/equivalent-notation');
  });
});

describe('color-picker matrix: the swatch', () => {
  for (const key of ['Enter', ' ']) {
    it(`the swatch accepts "${key === ' ' ? 'Space' : key}"`, async () => {
      // The swatch opens the native chooser, which a headless DOM cannot show —
      // what is observable is that the activation reaches the hidden input.
      el = await mountPicker({ name: 'colour' });
      const problems = new Problems();
      let clicked = 0;
      nativeInput(el)!.addEventListener('click', () => { clicked++; });

      press(swatch(el), key);
      await wait(SETTLE);

      problems.equal(clicked, 1, `the swatch did not open the chooser on ${key}`);
      expectClean(problems, `swatch/${key}`);
    });
  }

  for (const barred of ['disabled', 'loading'] as const) {
    it(`a ${barred} swatch does not open the chooser`, async () => {
      el = await mountPicker({ [barred]: true, name: 'colour' } as Partial<Vector>);
      const problems = new Problems();
      let clicked = 0;
      nativeInput(el)!.addEventListener('click', () => { clicked++; });

      click(swatch(el));
      press(swatch(el), 'Enter');
      await wait(SETTLE);

      problems.equal(clicked, 0, `a ${barred} swatch opened the native chooser`);
      expectClean(problems, `swatch/${barred}`);
    });
  }
});

describe('color-picker matrix: focus and blur', () => {
  for (const target of ['swatch', 'input'] as const) {
    it(`${target} focus and blur are reported`, async () => {
      el = await mountPicker({ name: 'colour' });
      const focuses = captureEvents<{ colorPicker: HTMLElement }>(el, 'color-picker-focus');
      const blurs = captureEvents<{ colorPicker: HTMLElement }>(el, 'color-picker-blur');
      const problems = new Problems();

      const node = target === 'swatch' ? swatch(el) : textInput(el);
      node?.dispatchEvent(new FocusEvent('focus', { bubbles: false, composed: true }));
      await wait(SETTLE);
      node?.dispatchEvent(new FocusEvent('blur', { bubbles: false, composed: true }));
      await wait(SETTLE);

      problems.equal(focuses.length, 1, 'color-picker-focus events');
      problems.equal(blurs.length, 1, 'color-picker-blur events');
      problems.check(focuses[0]?.colorPicker === el, 'focus detail.colorPicker');
      problems.check(blurs[0]?.colorPicker === el, 'blur detail.colorPicker');

      expectClean(problems, `focus/${target}`);
    });
  }
});

describe('color-picker matrix: value assignment', () => {
  // "…or any `value` assignment dirties it." The assignment path has to
  // canonicalize exactly like the typing path, or the same colour would mean
  // two things depending on how it arrived.
  // Every expected canonical value comes from the oracles in
  // color-picker-support.ts. Writing one by hand would be guessing at a
  // rounding: `hsl(217, 91%, 60%)` is NEAR `#3b82f6` and is not equal to it.
  for (const [assigned, canonical] of [
    ['#3b82f6', '#3b82f6'],
    ['rgb(59, 130, 246)', rgbToHex(59, 130, 246)!],
    ['hsl(217, 91%, 60%)', hslToHex(217, 91, 60)],
    ['  #3b82f6  ', '#3b82f6'],
  ] as const) {
    it(`value = "${assigned}"`, async () => {
      const vector: Vector = { ...DEFAULTS, name: 'colour' };
      el = await mountPicker(vector);
      const events = captureEvents(el, 'color-picker-change');
      const problems = new Problems();

      (el as any).value = assigned;
      await wait(SETTLE);

      checkValue(problems, el, vector, { value: canonical, canonical });
      // A programmatic assignment is the application's own doing; the two
      // documented events describe a CUSTOMER's adjustment.
      problems.equal(events.length, 0, 'assigning `value` emitted color-picker-change');

      expectClean(problems, `assign/${assigned}`);
    });
  }
});
