/**
 * ════════════════════════════════════════════════════════════════════════════
 *  Per-component oracle for the snice-step-input matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * snice-step-input is a FORM-ASSOCIATED numeric control, so unlike the display
 * components in this tree it has real state: a live value, an authored default,
 * a dirty flag, a constraint set, and a form. Everything encoded here is read
 * off docs/ai/components/step-input.md, docs/components/step-input.md and
 * snice-step-input.types.ts — never off the component:
 *
 *   VALUE
 *   · "`value` is live normalized state; `defaultValue` reflects the `value`
 *     attribute."  So `<snice-step-input value="5">` authors the DEFAULT, and
 *     a pristine control shows it.
 *   · "Values clamp and snap to a `min`-based step lattice; zero, negative, or
 *     non-finite steps fall back to `1`."  That sentence is the whole
 *     normalization contract, and `normalize()` below is its transcription:
 *     clamp into [min, max], then snap to the lattice `min + k·step`, then make
 *     sure the snap did not leave the range.
 *   · "Pristine state follows default mutations. Input, increment/decrement,
 *     restore, or any live assignment dirties it."
 *   · "Reset silently restores the latest default under current min/max/step
 *     constraints."  Silently = no `value-change`.
 *
 *   STEPPING
 *   · "`increment()` - Increase value by step" / "`decrement()` - Decrease
 *     value by step", against
 *   · "`wrap: boolean = false  // wrap around at min/max boundaries`", and
 *   · "Buttons disabled at min/max (unless `wrap` is set)".
 *     Together: a bounded control at its maximum either wraps to the minimum
 *     (wrap) or has nothing to do and says so by disabling the button.
 *   · "ArrowUp: increment by step / ArrowDown: decrement by step".
 *
 *   SHAPE
 *   · CSS parts `base`, `decrement-button`, `increment-button`, `input` — all
 *     four listed unconditionally, and no property removes one.
 *   · `size: 'small'|'medium'|'large'` is a pure style axis; in a layout-free
 *     DOM its observable contract is the attribute plus the base's size class.
 *
 *   EVENTS
 *   · "`value-change` -> `{ value, oldValue, component }`" — and only for the
 *     changes the docs call user changes. Property assignment is a live
 *     assignment, and reset is explicitly silent.
 */
import { mount, part, shadow, settle, wait, type Shape } from '../matrix-utils';

export const SIZES = ['small', 'medium', 'large'] as const;
export type Size = typeof SIZES[number];

/** Documented defaults, from the property block in both doc versions. */
export const DEFAULTS = {
  value: 0,
  defaultValue: 0,
  min: -Infinity,
  max: Infinity,
  step: 1,
  disabled: false,
  readonly: false,
  size: 'medium' as Size,
  wrap: false,
  name: '',
};

// ── The documented normalization ────────────────────────────────────────────

/**
 * "zero, negative, or non-finite steps fall back to `1`".
 *
 * Written as a predicate on the documented sentence rather than as a copy of
 * any implementation: a step is usable only if it is finite AND positive.
 */
export function effectiveStep(step: number): number {
  return Number.isFinite(step) && step > 0 ? step : 1;
}

/**
 * "Values clamp and snap to a `min`-based step lattice."
 *
 * The lattice is anchored at `min` when there is one (that is what "min-based"
 * means) and at zero when the control is unbounded below — an unbounded lattice
 * has to be anchored somewhere, and zero is the only anchor the docs give a
 * value to (`value: number = 0`).
 *
 * Order matters and is the documented order: clamp first, then snap. Snapping
 * can push a value back out of range at either end, so the result is re-seated
 * on the last lattice point that is still inside.
 */
export function normalize(value: number, min: number, max: number, step: number): number {
  const lower = Number.isFinite(min) ? min : -Infinity;
  const upper = Number.isFinite(max) ? Math.max(max, lower) : Infinity;
  const unit = effectiveStep(step);
  const base = Number.isFinite(lower) ? lower : 0;

  const clamped = Math.max(lower, Math.min(upper, value));
  let snapped = base + Math.round((clamped - base) / unit) * unit;
  if (snapped > upper) snapped = base + Math.floor((upper - base) / unit) * unit;
  if (snapped < lower) snapped = base + Math.ceil((lower - base) / unit) * unit;
  snapped = Math.max(lower, Math.min(upper, snapped));
  if (!Number.isFinite(snapped)) return clamped;
  // Binary floating point turns `0.1 + 0.2` into a number no user typed. The
  // control's value is the number a person reads back, so the lattice point is
  // reported at the precision a double can actually name.
  return Number(snapped.toPrecision(15));
}

/**
 * "`increment()` — Increase value by step", with the documented boundary rule:
 * past the maximum, `wrap` sends the value to the minimum and its absence
 * parks it on the maximum. A wrap with no minimum has nowhere to go.
 *
 * The boundary rule CHOOSES a target; the lattice rule then seats it, because
 * "Values clamp and snap to a `min`-based step lattice" is a statement about
 * every value the control holds, not only about assigned ones. In a range whose
 * width is not a whole number of steps (`min=1 max=12 step=5`) the maximum is
 * not a value this control can hold at all, so stepping to it means stepping to
 * the last lattice point below it.
 */
export function expectedIncrement(
  value: number, min: number, max: number, step: number, wrap: boolean,
): number {
  const candidate = value + effectiveStep(step);
  if (Number.isFinite(max) && candidate > max) {
    return normalize(wrap && Number.isFinite(min) ? min : max, min, max, step);
  }
  return normalize(candidate, min, max, step);
}

/** The mirror image of `expectedIncrement`, at the other boundary. */
export function expectedDecrement(
  value: number, min: number, max: number, step: number, wrap: boolean,
): number {
  const candidate = value - effectiveStep(step);
  if (Number.isFinite(min) && candidate < min) {
    return normalize(wrap && Number.isFinite(max) ? max : min, min, max, step);
  }
  return normalize(candidate, min, max, step);
}

/**
 * The highest value a range can actually hold — the last lattice point at or
 * below `max`. Equal to `max` whenever the range's width is a whole number of
 * steps, and strictly below it otherwise.
 */
export function reachableMax(min: number, max: number, step: number): number {
  return normalize(max, min, max, step);
}

/**
 * FINDING MATRIX-step-input-1 — the combos that announce a change they did not
 * make.
 *
 * In a range whose width is not a whole number of steps (`min=1 max=12
 * step=5`), the highest value the lattice admits is 11. Incrementing from 11
 * without `wrap` picks `max` (12) as its target, sees `12 !== 11`, commits it —
 * and the documented lattice immediately snaps it back to 11. The value never
 * moves, but a `value-change` is dispatched anyway, carrying
 * `{ value: 11, oldValue: 11 }`.
 *
 * The docs describe `value-change` as the event for a value CHANGE
 * (`{ value, oldValue, component }`), and every other no-op step in this matrix
 * is silent, so the assertion stays "no event" and these combos are `it.fails`.
 */
export function emitsPhantomChange(
  value: number, min: number, max: number, step: number, wrap: boolean,
  direction: 'up' | 'down',
): boolean {
  if (wrap) return false;
  if (direction === 'up') {
    if (!Number.isFinite(max)) return false;
    if (value + effectiveStep(step) <= max) return false;
    return max !== value && normalize(max, min, max, step) === value;
  }
  if (!Number.isFinite(min)) return false;
  if (value - effectiveStep(step) >= min) return false;
  return min !== value && normalize(min, min, max, step) === value;
}

/**
 * "Buttons disabled at min/max (unless `wrap` is set)", plus the ordinary rule
 * that a disabled control's buttons are disabled. `readonly` is deliberately
 * NOT part of this: the docs disable buttons for exactly two reasons, and a
 * readonly control's refusal to move is asserted on the VALUE instead.
 */
export function expectedButtonDisabled(
  value: number, min: number, max: number, wrap: boolean, disabled: boolean,
): { decrement: boolean; increment: boolean } {
  return {
    decrement: disabled || (!wrap && value <= min),
    increment: disabled || (!wrap && value >= max),
  };
}

// ── Mounting ────────────────────────────────────────────────────────────────

export interface StepInputVector {
  /** Authored `value` attribute — the documented `defaultValue`. */
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  readonly?: boolean;
  size?: Size;
  wrap?: boolean;
  name?: string;
}

/**
 * Mount a control the way a page author writes one.
 *
 * Attributes, before connection: that is the channel `value`, `min`, `max`,
 * `step`, `size`, `wrap`, `disabled` and `readonly` are all documented in, and
 * it is the channel that has to survive the Number converter. The infinite
 * bounds are the exception — `-Infinity` has no attribute spelling, so an
 * unbounded control is authored by leaving the attribute off, which is exactly
 * how a page author expresses "no minimum".
 */
export async function mountStepInput(vector: StepInputVector): Promise<any> {
  const attrs: Record<string, any> = {};
  if (vector.defaultValue !== undefined) attrs.value = vector.defaultValue;
  if (vector.min !== undefined && Number.isFinite(vector.min)) attrs.min = vector.min;
  if (vector.max !== undefined && Number.isFinite(vector.max)) attrs.max = vector.max;
  if (vector.step !== undefined) attrs.step = vector.step;
  if (vector.size !== undefined) attrs.size = vector.size;
  if (vector.name !== undefined && vector.name !== '') attrs.name = vector.name;
  if (vector.disabled) attrs.disabled = true;
  if (vector.readonly) attrs.readonly = true;
  if (vector.wrap) attrs.wrap = true;

  const el = await mount<HTMLElement>('snice-step-input', attrs);
  await settle(el, 5);
  return el;
}

/** Let a value assignment, a click, or a key settle into the rendered tree. */
export async function tick(el: any): Promise<void> {
  await settle(el, 5);
}

export { wait };

// ── Readers ─────────────────────────────────────────────────────────────────

export const basePart = (el: HTMLElement) => part<HTMLElement>(el, 'base');
export const inputPart = (el: HTMLElement) => part<HTMLInputElement>(el, 'input');
export const decrementButton = (el: HTMLElement) =>
  part<HTMLButtonElement>(el, 'decrement-button');
export const incrementButton = (el: HTMLElement) =>
  part<HTMLButtonElement>(el, 'increment-button');

export function partNames(el: HTMLElement): string[] {
  return [...shadow(el).querySelectorAll('[part]')]
    .flatMap(node => (node.getAttribute('part') ?? '').split(/\s+/))
    .filter(Boolean)
    .sort();
}

/** Every part the docs list, in the documented spelling. */
export const DOCUMENTED_PARTS = ['base', 'decrement-button', 'increment-button', 'input'];

// ── Oracles ─────────────────────────────────────────────────────────────────

/**
 * The DOCUMENTED shape of a control holding `value` under `vector`'s
 * constraints: the four parts, the buttons' bound states, and the input's own
 * native mirror of the same constraints.
 */
export function expectedShape(vector: StepInputVector, value: number): Shape {
  const min = vector.min ?? DEFAULTS.min;
  const max = vector.max ?? DEFAULTS.max;
  const step = vector.step ?? DEFAULTS.step;
  const disabled = vector.disabled ?? DEFAULTS.disabled;
  const readonly = vector.readonly ?? DEFAULTS.readonly;
  const wrap = vector.wrap ?? DEFAULTS.wrap;
  const buttons = expectedButtonDisabled(value, min, max, wrap, disabled);

  return {
    parts: DOCUMENTED_PARTS,
    'input.value': String(value),
    'input.disabled': disabled,
    'input.readOnly': readonly,
    'input.type': 'number',
    // The native constraint mirror. An unbounded end is spelled as the empty
    // string, because that is how HTML says "no bound".
    'input.min': Number.isFinite(min) ? String(min) : '',
    'input.max': Number.isFinite(max) ? String(max) : '',
    'input.step': String(effectiveStep(step)),
    'decrement.disabled': buttons.decrement,
    'increment.disabled': buttons.increment,
    // ARIA's own reading of the same numbers, for the spinbutton role the
    // control declares.
    'aria.valuenow': String(value),
    'aria.valuemin': Number.isFinite(min) ? String(min) : '',
    'aria.valuemax': Number.isFinite(max) ? String(max) : '',
    'aria.role': 'spinbutton',
  };
}

/** The same description, read back off the rendered element. */
export function readShape(el: HTMLElement): Shape {
  const input = inputPart(el);
  const decrement = decrementButton(el);
  const increment = incrementButton(el);
  return {
    parts: partNames(el),
    'input.value': input?.value ?? null,
    'input.disabled': input?.disabled ?? null,
    'input.readOnly': input?.readOnly ?? null,
    'input.type': input?.getAttribute('type') ?? null,
    'input.min': input?.getAttribute('min') ?? null,
    'input.max': input?.getAttribute('max') ?? null,
    'input.step': input?.getAttribute('step') ?? null,
    'decrement.disabled': decrement?.disabled ?? null,
    'increment.disabled': increment?.disabled ?? null,
    'aria.valuenow': input?.getAttribute('aria-valuenow') ?? null,
    'aria.valuemin': input?.getAttribute('aria-valuemin') ?? null,
    'aria.valuemax': input?.getAttribute('aria-valuemax') ?? null,
    'aria.role': input?.getAttribute('role') ?? null,
  };
}

/** The documented style axis: `size` reaches the attribute and the base class. */
export function expectedSize(vector: StepInputVector): Shape {
  const size = vector.size ?? DEFAULTS.size;
  return {
    'prop.size': size,
    // An AUTHORED attribute is always present, defaults included: the framework
    // only declines to reflect a default it was never told about.
    'attr.size': vector.size === undefined ? null : size,
    baseClass: `step-input--${size}`,
  };
}

export function readSize(el: HTMLElement): Shape {
  const base = basePart(el);
  const classes = (base?.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);
  return {
    'prop.size': (el as any).size,
    'attr.size': el.getAttribute('size'),
    baseClass: classes.find(name => name.startsWith('step-input--')) ?? '∅ no size class',
  };
}

// ── Interaction ─────────────────────────────────────────────────────────────

/** Record `value-change` details in dispatch order. */
export function recordValueChange(el: HTMLElement): Array<{
  value: number; oldValue: number; isComponent: boolean;
}> {
  const seen: Array<{ value: number; oldValue: number; isComponent: boolean }> = [];
  el.addEventListener('value-change', (event: Event) => {
    const detail = (event as CustomEvent).detail;
    seen.push({
      value: detail.value,
      oldValue: detail.oldValue,
      isComponent: detail.component === el,
    });
  });
  return seen;
}

/** A keydown on the input, as a real key event (composed, cancelable). */
export function pressKey(el: HTMLElement, key: string): void {
  inputPart(el)?.dispatchEvent(new KeyboardEvent('keydown', {
    key, bubbles: true, composed: true, cancelable: true,
  }));
}

/** Type into the input and commit it, the way a user's `change` does. */
export function typeValue(el: HTMLElement, typed: string): void {
  const input = inputPart(el);
  if (!input) return;
  input.value = typed;
  input.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
}
