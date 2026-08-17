/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-slider matrix — the oracle
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Transcribed from `docs/ai/components/slider.md` and `snice-slider.types.ts`.
 * The slider is a FORM-ASSOCIATED control with a documented value lattice, a
 * dirty-value lifecycle and a constraint-validation contract, which puts it in
 * the "low hundreds of combos" band of `.ai/fuzzing.md` — the same band as the
 * textarea, nowhere near the table.
 *
 *   value        number = 0     "live property only"
 *   defaultValue number = 0     attr `value`; "authored/reset default"
 *   min 0, max 100, step 1
 *   variant      default|primary|success|warning|danger = default
 *   size         small|medium|large = medium
 *   disabled / required / invalid / readonly / loading  boolean = false
 *   label, helperText (`helper-text`), errorText (`error-text`), name
 *   showValue (`show-value`), showTicks (`show-ticks`), vertical  boolean = false
 *   readonly type 'range'; form; validity; validationMessage; willValidate; labels
 *   methods      focus() blur() checkValidity() reportValidity()
 *                setCustomValidity(message)
 *   events       slider-input  { value, slider }  "During drag"
 *                slider-change { value, slider }  "After commit"
 *   parts        track, fill, thumb, spinner, error-text, helper-text
 *   a11y         role="slider" with aria-valuenow/min/max
 *
 * ── The value lattice ──────────────────────────────────────────────────────
 *
 * Documented in one line: "`value` is live clamped/stepped state … The step
 * lattice starts at `min`, matching native range. Zero, negative, or
 * non-finite steps fall back to `1`."
 *
 * `expectedValue()` below is that sentence, written out. It is the native
 * `input[type=range]` sanitisation algorithm the doc points at: clamp into
 * [min, max], snap to the nearest `min + k*step`, and if that lands past `max`,
 * fall back to the largest lattice point that does not. It is derived from the
 * documented rule rather than copied from the component, which is what lets a
 * divergence be a finding instead of a tautology.
 *
 * ── What the visual tier owns ──────────────────────────────────────────────
 *
 * Dragging. `updateValueFromEvent` reads `track.getBoundingClientRect()`, which
 * is a zero-sized box without layout, so a pointer drag in this tier would be
 * measuring happy-dom. Everything a drag produces that ISN'T geometry —
 * `slider-input` during, `slider-change` after, the readonly/disabled veto —
 * is reachable through the keyboard path, which the doc gives equal standing
 * ("Arrow keys: adjust by step; Home/End: min/max"), and that is what this
 * tier drives. The fill width, the thumb offset and the tick spacing are all
 * percentages of a real box: visual tier.
 */
import { expect } from 'vitest';
import { mount, unmountAll, wait } from '../matrix-utils';
import { exactPart, exactParts } from '../part-exact';
import {
  activeFlags, installInternalsMock, internalsFor, restoreInternalsMock,
} from '../internals-mock';

import '../../../packages/components/src/slider/snice-slider';

export {
  activeFlags, exactPart, exactParts, expect, installInternalsMock, internalsFor,
  mount, restoreInternalsMock, unmountAll, wait,
};

export const SETTLE = 30;

// ── Documented dimensions ───────────────────────────────────────────────────

export const VARIANTS = ['default', 'primary', 'success', 'warning', 'danger'] as const;
export type Variant = typeof VARIANTS[number];

export const SIZES = ['small', 'medium', 'large'] as const;
export type Size = typeof SIZES[number];

/** The five documented state switches, each independently settable. */
export const STATE_FLAGS = ['disabled', 'readonly', 'loading', 'required', 'invalid'] as const;
export type StateFlag = typeof STATE_FLAGS[number];

/** Every part the slider documents. */
export const PARTS = ['track', 'fill', 'thumb', 'spinner', 'error-text', 'helper-text'] as const;

export const DEFAULTS = {
  value: 0,
  defaultValue: 0,
  min: 0,
  max: 100,
  step: 1,
  variant: 'default' as Variant,
  size: 'medium' as Size,
  disabled: false,
  required: false,
  invalid: false,
  readonly: false,
  loading: false,
  label: '',
  helperText: '',
  errorText: '',
  name: '',
  showValue: false,
  showTicks: false,
  vertical: false,
};

/** The documented kebab attribute of each camelCase property. */
export const ATTRS: Record<string, string> = {
  defaultValue: 'value',
  helperText: 'helper-text',
  errorText: 'error-text',
  showValue: 'show-value',
  showTicks: 'show-ticks',
};

// ── The documented value rule ───────────────────────────────────────────────

/** "Zero, negative, or non-finite steps fall back to `1`." */
export function effectiveStep(step: number): number {
  return Number.isFinite(step) && step > 0 ? step : 1;
}

/**
 * The documented sanitisation: clamp into range, then snap to the `min`-based
 * lattice, never leaving the range.
 */
export function expectedValue(raw: number, min: number, max: number, step: number): number {
  const lower = Number.isFinite(min) ? min : -Infinity;
  const upper = Number.isFinite(max) ? Math.max(max, lower) : Infinity;
  const unit = effectiveStep(step);
  const clamped = Math.max(lower, Math.min(upper, raw));

  let snapped = lower + Math.round((clamped - lower) / unit) * unit;
  if (snapped > upper) snapped = lower + Math.floor((upper - lower) / unit) * unit;
  if (snapped < lower) snapped = lower + Math.ceil((lower - lower) / unit) * unit;
  snapped = Math.max(lower, Math.min(upper, snapped));
  if (!Number.isFinite(snapped)) return clamped;
  return Number(snapped.toPrecision(15));
}

/**
 * "showTicks" draws one mark per lattice point across the range — the count a
 * reader can check by eye against `(max - min) / step + 1`.
 */
export function expectedTickCount(min: number, max: number, step: number): number {
  return Math.max(0, Math.floor((max - min) / effectiveStep(step)) + 1);
}

/**
 * The rendered value label. Decimal precision follows `step`, so a step of 1
 * shows an integer and a step of 0.1 shows one decimal — otherwise the lattice
 * arithmetic's floating-point tail would leak onto the screen.
 */
export function expectedDisplayValue(value: number, step: number): string {
  const text = String(effectiveStep(step));
  const dot = text.indexOf('.');
  const decimals = dot === -1 ? 0 : Math.min(3, text.length - dot - 1);
  return value.toFixed(decimals);
}

/**
 * "Error text is rendered/announced once only while authored or calculated
 * invalid presentation is active. Otherwise helper text remains visible."
 */
export function expectedSupport(
  c: { invalid: boolean; errorText: string; helperText: string; customError?: boolean },
): 'error' | 'helper' | 'none' {
  const displayedInvalid = c.invalid || !!c.customError;
  if (displayedInvalid && c.errorText) return 'error';
  if (c.helperText) return 'helper';
  return 'none';
}

// ── Mounting ────────────────────────────────────────────────────────────────

export interface SliderCombo {
  id: string;
  value: number | null;
  defaultValue: number;
  min: number;
  max: number;
  step: number;
  variant: Variant;
  size: Size;
  disabled: boolean;
  readonly: boolean;
  loading: boolean;
  required: boolean;
  invalid: boolean;
  label: string;
  helperText: string;
  errorText: string;
  name: string;
  showValue: boolean;
  showTicks: boolean;
  vertical: boolean;
}

export function combo(overrides: Partial<SliderCombo> = {}): SliderCombo {
  const base: SliderCombo = {
    id: '',
    value: null,
    defaultValue: 0,
    min: 0,
    max: 100,
    step: 1,
    variant: 'default',
    size: 'medium',
    disabled: false,
    readonly: false,
    loading: false,
    required: false,
    invalid: false,
    label: '',
    helperText: '',
    errorText: '',
    name: '',
    showValue: false,
    showTicks: false,
    vertical: false,
    ...overrides,
  };
  const flags = [...STATE_FLAGS, 'showValue', 'showTicks', 'vertical']
    .filter(key => (base as any)[key]);
  base.id = base.id || `${base.variant}/${base.size}`
    + `/${base.min}..${base.max}@${base.step}`
    + `/value=${base.value ?? base.defaultValue}`
    + `/[${flags.join(',') || 'plain'}]`;
  return base;
}

/**
 * Mount a combo the way the doc's own examples author one —
 * `<snice-slider label="Volume" min="0" max="100" value="50" show-value>` —
 * i.e. everything through its documented ATTRIBUTE, including `value`, which
 * the doc says is the `defaultValue` channel.
 *
 * `combo.value` is separate: it is the LIVE property, and assigning it is
 * documented to dirty the control. It crosses the property channel after the
 * element is ready, exactly as a page script would.
 */
export async function makeSlider(c: SliderCombo): Promise<any> {
  const attrs: Record<string, any> = {
    min: c.min, max: c.max, step: c.step, variant: c.variant, size: c.size,
    value: c.defaultValue,
  };
  if (c.label) attrs.label = c.label;
  if (c.helperText) attrs['helper-text'] = c.helperText;
  if (c.errorText) attrs['error-text'] = c.errorText;
  if (c.name) attrs.name = c.name;
  for (const flag of [...STATE_FLAGS] as string[]) {
    if ((c as any)[flag]) attrs[flag] = true;
  }
  if (c.showValue) attrs['show-value'] = true;
  if (c.showTicks) attrs['show-ticks'] = true;
  if (c.vertical) attrs.vertical = true;

  const props: Record<string, unknown> = {};
  if (c.value !== null) props.value = c.value;

  const el = await mount<any>('snice-slider', attrs, '', props);
  await wait(SETTLE);
  return el;
}

// ── Reading ─────────────────────────────────────────────────────────────────

export function sr(el: HTMLElement): ShadowRoot {
  const root = el.shadowRoot;
  if (!root) throw new Error('snice-slider rendered no shadow root');
  return root;
}

export const thumbOf = (el: HTMLElement): HTMLElement => exactPart<HTMLElement>(el, 'thumb')!;
export const trackOf = (el: HTMLElement): HTMLElement => exactPart<HTMLElement>(el, 'track')!;
export const fillOf = (el: HTMLElement): HTMLElement => exactPart<HTMLElement>(el, 'fill')!;

/** The mirrored native `input[type=range]` the form plumbing writes through. */
export const inputOf = (el: HTMLElement): HTMLInputElement | null =>
  sr(el).querySelector('input.slider-input');

export const valueLabelOf = (el: HTMLElement): HTMLElement | null =>
  sr(el).querySelector('.slider-value');

export const ticksOf = (el: HTMLElement): HTMLElement[] => [...sr(el).querySelectorAll('.tick')];

export const labelOf = (el: HTMLElement): HTMLElement | null => sr(el).querySelector('label.label');

export function classesOf(node: Element | null | undefined): string[] {
  return (node?.getAttribute('class') ?? '').split(/\s+/).filter(Boolean).sort();
}

export function textOf(node: Element | null | undefined): string {
  return (node?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

/** Which of the two support-text parts is on screen. */
export function renderedSupport(el: HTMLElement): 'error' | 'helper' | 'none' {
  if (exactParts(el, 'error-text').length) return 'error';
  if (exactParts(el, 'helper-text').length) return 'helper';
  return 'none';
}

// ── The oracle ──────────────────────────────────────────────────────────────

class Problems {
  readonly list: string[] = [];
  check(ok: boolean, message: string): void { if (!ok) this.list.push(message); }
  equal(actual: unknown, expected: unknown, what: string): void {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      this.list.push(`${what}: ${JSON.stringify(actual)} != ${JSON.stringify(expected)}`);
    }
  }
}

/** "Disabled controls are … barred. Readonly/loading controls … are barred." */
export const interactionDisabled = (c: SliderCombo): boolean => c.disabled || c.loading;

export function sliderProblems(el: any, c: SliderCombo): Problems {
  const problems = new Problems();

  const wanted = expectedValue(c.value ?? c.defaultValue, c.min, c.max, c.step);
  problems.equal(el.value, wanted, 'value');
  problems.equal(el.defaultValue, c.defaultValue, 'defaultValue');
  problems.equal(el.min, c.min, 'min');
  problems.equal(el.max, c.max, 'max');
  problems.equal(el.step, c.step, 'step');
  problems.equal(el.variant, c.variant, 'variant');
  problems.equal(el.size, c.size, 'size');
  problems.equal(el.type, 'range', 'type');
  for (const flag of STATE_FLAGS) problems.equal(el[flag], c[flag], flag);
  problems.equal(el.showValue, c.showValue, 'showValue');
  problems.equal(el.showTicks, c.showTicks, 'showTicks');
  problems.equal(el.vertical, c.vertical, 'vertical');

  // ── the always-present parts ─────────────────────────────────────────────
  for (const name of ['track', 'fill', 'thumb'] as const) {
    problems.equal(exactParts(el, name).length, 1, `part="${name}" count`);
  }
  // "spinner" belongs to the documented `loading` state only.
  problems.equal(exactParts(el, 'spinner').length, c.loading ? 1 : 0, 'part="spinner" count');

  const track = trackOf(el);
  const thumb = thumbOf(el);
  const fill = fillOf(el);
  if (!problems.check(!!track && !!thumb && !!fill, 'missing track/thumb/fill')) return problems;

  // ── size and variant reach the classes that paint them ───────────────────
  problems.check(classesOf(track).includes(`slider-track--${c.size}`), `track missing size ${c.size}`);
  problems.check(classesOf(thumb).includes(`slider-thumb--${c.size}`), `thumb missing size ${c.size}`);
  problems.check(classesOf(fill).includes(`slider-fill--${c.variant}`),
    `fill missing variant ${c.variant}`);
  problems.check(classesOf(thumb).includes(`slider-thumb--${c.variant}`),
    `thumb missing variant ${c.variant}`);

  // ── `vertical` is an axis switch across every layered element ────────────
  for (const [node, prefix] of [[track, 'slider-track'], [fill, 'slider-fill'], [thumb, 'slider-thumb']] as const) {
    problems.equal(classesOf(node).includes(`${prefix}--vertical`), c.vertical,
      `${prefix} vertical modifier`);
  }

  // ── a11y: 'role="slider" with aria-valuenow/min/max' ─────────────────────
  problems.equal(thumb.getAttribute('role'), 'slider', 'thumb role');
  problems.equal(thumb.getAttribute('aria-valuemin'), String(c.min), 'aria-valuemin');
  problems.equal(thumb.getAttribute('aria-valuemax'), String(c.max), 'aria-valuemax');
  problems.equal(thumb.getAttribute('aria-valuenow'), String(wanted), 'aria-valuenow');
  problems.equal(thumb.getAttribute('aria-disabled'), String(interactionDisabled(c)),
    'thumb aria-disabled');
  // A barred control must not be a tab stop; an interactive one must be.
  problems.equal(thumb.getAttribute('tabindex'), interactionDisabled(c) ? '-1' : '0',
    'thumb tabindex');
  // "`invalid` alone is visual/ARIA only" — but it IS an ARIA state.
  problems.equal(thumb.getAttribute('aria-invalid'), String(c.invalid), 'thumb aria-invalid');

  // ── the label ────────────────────────────────────────────────────────────
  const label = labelOf(el);
  problems.equal(!!label, !!c.label, 'label rendered');
  if (c.label) {
    problems.equal(textOf(label), c.label, 'label text');
    problems.equal(thumb.getAttribute('aria-label'), c.label, 'thumb aria-label');
  }

  // ── the documented support-text precedence ───────────────────────────────
  const support = expectedSupport(c);
  problems.equal(renderedSupport(el), support, 'support text');
  if (support === 'error') problems.equal(textOf(exactPart(el, 'error-text')), c.errorText, 'error text');
  if (support === 'helper') problems.equal(textOf(exactPart(el, 'helper-text')), c.helperText, 'helper text');

  // ── ticks ────────────────────────────────────────────────────────────────
  problems.equal(ticksOf(el).length, c.showTicks ? expectedTickCount(c.min, c.max, c.step) : 0,
    'tick count');

  // ── the value read-out ───────────────────────────────────────────────────
  const readout = valueLabelOf(el);
  problems.equal(!!readout, c.showValue, 'value read-out rendered');
  if (c.showValue) {
    problems.equal(textOf(readout), expectedDisplayValue(wanted, c.step), 'value read-out');
  }

  return problems;
}

export function expectSliderMatches(el: any, c: SliderCombo): void {
  expect(sliderProblems(el, c).list, `combo ${c.id}`).toEqual([]);
}

// ── Interaction ─────────────────────────────────────────────────────────────

export function recordEvents(el: HTMLElement): { log: string[]; details: any[] } {
  const log: string[] = [];
  const details: any[] = [];
  for (const type of ['slider-input', 'slider-change']) {
    el.addEventListener(type, (event: Event) => {
      log.push(type);
      details.push((event as CustomEvent).detail);
    });
  }
  return { log, details };
}

/** The keyboard is the documented, layout-free path into the value. */
export function pressThumb(el: HTMLElement, key: string): void {
  thumbOf(el).dispatchEvent(new KeyboardEvent('keydown', {
    key, bubbles: true, composed: true, cancelable: true,
  }));
}

export function teardown(): void {
  unmountAll();
}
