/**
 * snice-color-picker matrix — the oracle.
 *
 * Source of every expectation: docs/ai/components/color-picker.md and
 * packages/components/src/color-picker/snice-color-picker.types.ts. Nothing
 * here is read off the component's output — the colour-space conversions below
 * are written from the CSS Color definitions the doc names, not from the
 * component's arithmetic.
 *
 * The documented surface:
 *
 *   · `size`, `value` ("live property only"), `defaultValue` (attr `value`,
 *     "authored/reset default"), `format: 'hex'|'rgb'|'hsl'`, `label`,
 *     `helperText`, `errorText`, `disabled`, `required`, `invalid`, `name`,
 *     `showInput = true`, `showPresets = false`, `presets`, `loading`
 *   · methods `focus()`, `blur()`, `checkValidity()`, `reportValidity()`,
 *     `setCustomValidity(message)`
 *   · events `color-picker-input`, `color-picker-change`, `color-picker-focus`,
 *     `color-picker-blur`, each `-> { value?, colorPicker }`
 *   · CSS parts `base`, `spinner`, `error-text`, `helper-text`
 *   · the value contract, quoted verbatim where it is asserted:
 *       "Valid six-digit hex, `rgb(r, g, b)`, and `hsl(h, s%, l%)` text
 *        canonicalizes to six-digit hex. RGB channels must be `0..255`;
 *        saturation/lightness must be `0..100`; hue wraps modulo 360."
 *       "Malformed editable text remains visible/live and reports `badInput`;
 *        it is never silently replaced with black."
 *       "Empty `required` reports `valueMissing`; the default `#000000` already
 *        satisfies required."
 *       "Disabled controls are omitted and barred. Loading controls remain
 *        successful but are inert and barred."
 *       "`setCustomValidity()` supplies `customError`; `invalid`/`errorText`
 *        are presentation only."
 *
 * SIMULATION BOUNDARY. happy-dom implements no `ElementInternals`, so the FACE
 * half — `FormData` contribution, form reset, state restoration, disabled
 * fieldsets — is unobservable here and belongs to
 * tests/live/matrix/color-picker/color-picker-visual.spec.ts, along with the
 * swatch's painted colour and the native chooser's behaviour.
 */
import { Problems, SETTLE, all, captureEvents, click, mount, press, sr, text, wait } from '../matrix-kit';
import { exactPart, exactParts } from '../part-exact';
import '../../../packages/components/src/color-picker/snice-color-picker';

export { Problems, all, captureEvents, click, mount, press, sr, text, wait, SETTLE };

/** `error-text` / `helper-text` share a suffix; part lookups read tokens exactly. */
export const part = exactPart;
export const parts = exactParts;

/** The documented defaults, from the properties block of the doc. */
export const DEFAULTS = {
  size: 'medium' as const,
  value: '#000000',
  defaultValue: '#000000',
  format: 'hex' as const,
  label: '',
  helperText: '',
  errorText: '',
  disabled: false,
  loading: false,
  required: false,
  invalid: false,
  name: '',
  showInput: true,
  showPresets: false,
};

export type Size = 'small' | 'medium' | 'large';
export type Format = 'hex' | 'rgb' | 'hsl';

export interface Vector {
  size: Size;
  format: Format;
  label: string;
  helperText: string;
  errorText: string;
  disabled: boolean;
  loading: boolean;
  required: boolean;
  invalid: boolean;
  name: string;
  showInput: boolean;
  showPresets: boolean;
}

// ── Independent colour oracles ──────────────────────────────────────────────
//
// Written from the CSS Color definitions the doc names, so a component that
// converted wrongly would disagree with them rather than with a copy of itself.

/** `#rrggbb` -> the three 0..255 channels. */
export function hexChannels(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

/** The documented `rgb(r, g, b)` rendering of a canonical hex. */
export function hexToRgbText(hex: string): string {
  const [r, g, b] = hexChannels(hex);
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * The documented `hsl(h, s%, l%)` rendering of a canonical hex.
 *
 * Straight from the CSS Color 3 RGB->HSL conversion, rounded to whole degrees
 * and whole percent — the precision the documented `hsl(h, s%, l%)` spelling
 * has room for.
 */
export function hexToHslText(hex: string): string {
  const [r, g, b] = hexChannels(hex).map(channel => channel / 255) as [number, number, number];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  let hue = 0;
  let saturation = 0;
  if (max !== min) {
    const delta = max - min;
    saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    if (max === r) hue = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
    else if (max === g) hue = ((b - r) / delta + 2) / 6;
    else hue = ((r - g) / delta + 4) / 6;
  }
  return `hsl(${Math.round(hue * 360)}, ${Math.round(saturation * 100)}%, `
    + `${Math.round(lightness * 100)}%)`;
}

/** The documented HSL -> hex conversion, for building expected canonical values. */
export function hslToHex(hue: number, saturationPercent: number, lightnessPercent: number): string {
  // "hue wraps modulo 360"
  const h = (((hue % 360) + 360) % 360) / 360;
  const s = saturationPercent / 100;
  const l = lightnessPercent / 100;
  const channel = (p: number, q: number, t0: number) => {
    let t = t0;
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  let r: number; let g: number; let b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = channel(p, q, h + 1 / 3);
    g = channel(p, q, h);
    b = channel(p, q, h - 1 / 3);
  }
  const byte = (x: number) => Math.round(x * 255).toString(16).padStart(2, '0');
  return `#${byte(r)}${byte(g)}${byte(b)}`;
}

/** The documented `rgb(r, g, b)` -> hex canonicalization, bounds included. */
export function rgbToHex(r: number, g: number, b: number): string | null {
  // "RGB channels must be `0..255`"
  if ([r, g, b].some(channel => channel < 0 || channel > 255)) return null;
  return `#${[r, g, b].map(c => c.toString(16).padStart(2, '0')).join('')}`;
}

/** The rendering the documented `format` asks for, from a canonical hex. */
export function formatted(hex: string, format: Format): string {
  if (format === 'rgb') return hexToRgbText(hex);
  if (format === 'hsl') return hexToHslText(hex);
  return hex;
}

// ── Mounting ────────────────────────────────────────────────────────────────

/**
 * Mount one combo.
 *
 * The `value` ATTRIBUTE is the documented `defaultValue`, not the live value —
 * "`value` is live; `defaultValue` reflects the `value` attribute" — so an
 * authored colour is written as the attribute and read back through both.
 */
export async function mountPicker(
  vector: Partial<Vector> = {}, options: { value?: string; presets?: string[] } = {},
): Promise<HTMLElement> {
  const v = { ...DEFAULTS, ...vector };
  const attrs: Record<string, string | boolean> = {
    size: v.size,
    format: v.format,
  };
  if (options.value !== undefined) attrs.value = options.value;
  if (v.label) attrs.label = v.label;
  if (v.helperText) attrs['helper-text'] = v.helperText;
  if (v.errorText) attrs['error-text'] = v.errorText;
  if (v.name) attrs.name = v.name;
  if (v.disabled) attrs.disabled = true;
  if (v.loading) attrs.loading = true;
  if (v.required) attrs.required = true;
  if (v.invalid) attrs.invalid = true;
  if (v.showPresets) attrs['show-presets'] = true;

  const props: Record<string, unknown> = {};
  // `showInput` defaults to TRUE, so only the off state needs the property
  // channel — an absent attribute already means "leave the default".
  if (!v.showInput) props.showInput = false;
  if (options.presets) props.presets = options.presets;

  return mount('snice-color-picker', attrs as Record<string, string>, props);
}

// ── Reading the rendered picker ─────────────────────────────────────────────

export const swatch = (el: HTMLElement): HTMLElement | null =>
  sr(el).querySelector('.color-swatch');

export const textInput = (el: HTMLElement): HTMLInputElement | null =>
  sr(el).querySelector('.color-input');

export const nativeInput = (el: HTMLElement): HTMLInputElement | null =>
  sr(el).querySelector('.native-input');

export const presetSwatches = (el: HTMLElement): HTMLElement[] =>
  all<HTMLElement>(el, '.preset');

/** The text the editable input is showing — the string the customer sees. */
export const shownValue = (el: HTMLElement): string => textInput(el)?.value ?? '';

// ── The oracle ──────────────────────────────────────────────────────────────

/** The documented container, swatch, and the two inputs behind it. */
export function checkStructure(problems: Problems, el: HTMLElement, vector: Vector): void {
  const base = part(el, 'base');
  if (!problems.check(!!base, 'no [part="base"] container')) return;

  const sw = swatch(el);
  if (!problems.check(!!sw, 'no colour swatch')) return;
  problems.check(base!.contains(sw!), 'the swatch is not inside the base container');
  problems.check(sw!.classList.contains(`color-swatch--${vector.size}`),
    `the swatch does not carry size "${vector.size}" (${sw!.className})`);

  // "Swatch and presets accept Enter and Space" — so the swatch is a button,
  // and it leaves the tab order only when it cannot be operated.
  problems.equal(sw!.getAttribute('role'), 'button', 'swatch role');
  const barred = vector.disabled || vector.loading;
  problems.equal(sw!.getAttribute('tabindex'), barred ? '-1' : '0', 'swatch tabindex');
  problems.equal(sw!.getAttribute('aria-disabled'), String(barred), 'swatch aria-disabled');

  // "The hidden native color input has no `name`, is `aria-hidden`, and has
  // `tabindex="-1"`."
  const native = nativeInput(el);
  if (!problems.check(!!native, 'no native colour input')) return;
  problems.equal(native!.type, 'color', 'native input type');
  problems.equal(native!.getAttribute('name'), null, 'the native input carries a name');
  problems.equal(native!.getAttribute('aria-hidden'), 'true', 'native input aria-hidden');
  problems.equal(native!.getAttribute('tabindex'), '-1', 'native input tabindex');

  // `showInput` decides whether there is editable text at all.
  const input = textInput(el);
  problems.equal(!!input, vector.showInput, `editable input for showInput=${vector.showInput}`);
  if (input) {
    problems.equal(input.type, 'text', 'editable input type');
    problems.equal(input.disabled, barred, 'editable input disabled');
    problems.equal(input.required, vector.required, 'editable input required');
  }
}

/** `loading`: documented as a spinner part, and as an inert state. */
export function checkLoading(problems: Problems, el: HTMLElement, vector: Vector): void {
  const spinner = part(el, 'spinner');
  problems.equal(!!spinner, vector.loading, `[part="spinner"] for loading=${vector.loading}`);
  problems.equal(swatch(el)?.classList.contains('color-swatch--loading'), vector.loading,
    'swatch loading modifier');
}

/** `label`: rendered only when set, and marked when the control is required. */
export function checkLabel(problems: Problems, el: HTMLElement, vector: Vector): void {
  const label = sr(el).querySelector('.label');
  if (!vector.label) {
    problems.check(!label, 'a label was rendered for label=""');
    return;
  }
  if (!problems.check(!!label, 'no label rendered')) return;
  problems.equal(text(label), vector.label, 'label text');
  problems.equal(label!.classList.contains('label--required'), vector.required,
    'the label does not mark a required control');
}

/**
 * The description: "One stable `aria-describedby` targets helper/error text;
 * error replaces helper, uses `role="alert"`".
 */
export function checkDescription(problems: Problems, el: HTMLElement, vector: Vector): void {
  const error = part(el, 'error-text');
  const helper = part(el, 'helper-text');
  // "With text input, the swatch is `<name> color chooser`; without it, the
  // swatch owns the base name" — and with it, the describedby rides the input.
  const anchor = vector.showInput ? textInput(el) : swatch(el);

  if (vector.errorText) {
    if (!problems.check(!!error, 'no [part="error-text"] for a non-empty errorText')) return;
    problems.equal(text(error), vector.errorText, 'error text');
    problems.equal(error!.getAttribute('role'), 'alert', 'the error text is not an alert');
    problems.check(!helper, 'both the error text and the helper text are shown');
    problems.equal(anchor?.getAttribute('aria-describedby'), error!.id,
      'the control does not describe itself with the error text');
    return;
  }

  problems.check(!error, 'an [part="error-text"] was rendered with no errorText');
  if (!problems.check(!!helper, 'no [part="helper-text"]')) return;
  if (vector.helperText) {
    problems.equal(text(helper), vector.helperText, 'helper text');
    problems.equal(anchor?.getAttribute('aria-describedby'), helper!.id,
      'the control does not describe itself with the helper text');
  }
}

/** `invalid` and calculated errors both reach `aria-invalid` and the styling. */
export function checkInvalidPresentation(
  problems: Problems, el: HTMLElement, vector: Vector, calculatedError = false,
): void {
  const shown = vector.invalid || calculatedError;
  problems.equal(swatch(el)?.getAttribute('aria-invalid'), String(shown), 'swatch aria-invalid');
  problems.equal(swatch(el)?.classList.contains('color-swatch--invalid'), shown,
    'swatch invalid modifier');
  if (vector.showInput) {
    problems.equal(textInput(el)?.getAttribute('aria-invalid'), String(shown),
      'editable input aria-invalid');
  }
}

/**
 * The value, in all three of its documented views: the live property, the text
 * the customer sees, and the colour the hidden native chooser is primed with.
 */
export function checkValue(
  problems: Problems, el: HTMLElement, vector: Vector,
  expected: { value: string; canonical: string | null },
): void {
  problems.equal((el as any).value, expected.value, 'the live `value`');

  if (vector.showInput) {
    // A canonical colour is shown in the documented `format`; malformed text
    // "remains visible/live and … is never silently replaced with black".
    problems.equal(shownValue(el),
      expected.canonical ? formatted(expected.canonical, vector.format) : expected.value,
      `the text shown for format="${vector.format}"`);
  }

  // The native chooser only speaks hex, and cannot be primed with nonsense.
  // Compared case-insensitively because `input[type="color"]` is defined to
  // normalise its value to lowercase — that is the platform's doing, not the
  // component's, and `#3B82F6` is a documented-valid six-digit hex.
  problems.equal(nativeInput(el)?.value?.toLowerCase(),
    (expected.canonical ?? '#000000').toLowerCase(),
    'the hidden native chooser value');
}

/** `presets`: documented as a string list, shown only under `show-presets`. */
export function checkPresets(
  problems: Problems, el: HTMLElement, vector: Vector, expected: string[], selected: string | null,
): void {
  const swatches = presetSwatches(el);
  if (!vector.showPresets) {
    problems.equal(swatches.length, 0, 'presets rendered without show-presets');
    return;
  }
  if (!problems.equal(swatches.length, expected.length, 'preset count')) return;
  swatches.forEach((preset, i) => {
    // "Presets are `Set <name> to <color>`."
    problems.check(!!preset.getAttribute('aria-label'), `preset ${i} has no accessible name`);
    problems.check(preset.getAttribute('aria-label')!.includes(expected[i]),
      `preset ${i} is labelled "${preset.getAttribute('aria-label')}" but is ${expected[i]}`);
    const isSelected = !!selected && expected[i].toLowerCase() === selected.toLowerCase();
    problems.equal(preset.classList.contains('preset--selected'), isSelected,
      `preset ${i} (${expected[i]}) selected marking`);
    problems.equal(preset.classList.contains('preset--disabled'),
      vector.disabled || vector.loading, `preset ${i} disabled marking`);
  });
}

/**
 * The validity the documented contract predicts.
 *
 * SIMULATION BOUNDARY on ONE flag. Without `ElementInternals` the component's
 * `validity` getter falls back to the native input it renders, and the only
 * channel it has to that input is `setCustomValidity()` — which produces
 * `customError` whatever the real reason was. So `badInput`, the flag the doc
 * names for malformed text, is unreachable in this tier: what IS observable is
 * that the control is invalid and says why in `validationMessage`, and both are
 * asserted at every combo. The flag itself is asserted against a real
 * `ElementInternals` in
 * tests/live/matrix/color-picker/color-picker-visual.spec.ts.
 */
export function checkValidity(
  problems: Problems, el: HTMLElement,
  expected: { valid: boolean; badInput?: boolean; valueMissing?: boolean; customError?: boolean },
): void {
  const picker = el as any;
  const validity = picker.validity as ValidityState;
  problems.equal(picker.checkValidity(), expected.valid, 'checkValidity()');
  problems.equal(validity.valid, expected.valid, 'validity.valid');
  if (expected.badInput !== undefined) {
    problems.equal(validity.badInput, expected.badInput, 'validity.badInput');
  }
  if (expected.valueMissing !== undefined) {
    problems.equal(validity.valueMissing, expected.valueMissing, 'validity.valueMissing');
  }
  if (expected.customError !== undefined) {
    problems.equal(validity.customError, expected.customError, 'validity.customError');
  }
  if (!expected.valid) {
    problems.check(!!picker.validationMessage,
      'an invalid control reports no validationMessage to show the user');
  }
}

/** Type `text` into the editable input, the way a customer would. */
export async function typeValue(el: HTMLElement, value: string): Promise<void> {
  const input = textInput(el);
  if (!input) throw new Error('the picker rendered no editable input');
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
  await wait(SETTLE);
}
