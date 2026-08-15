/**
 * Oracle for the `snice-switch` matrix.
 *
 * Every expectation below cites the line of `docs/ai/components/switch.md` it
 * encodes. Nothing here is derived from what the component renders.
 */
import { mount, shadow, settle, text, type Shape } from '../matrix-utils';
import '../../../packages/components/src/switch/snice-switch';

/**
 * happy-dom's `[part~="label"]` also matches `part="label-on"` — its `~=`
 * implementation is not token-exact. The switch exposes `label`, `label-on`
 * and `label-off`, so the shared `part()` helper cannot be trusted here.
 * This one splits the attribute itself, which is what `~=` is defined to do.
 */
export function part<T extends Element = HTMLElement>(el: HTMLElement, name: string): T | null {
  for (const node of shadow(el).querySelectorAll('[part]')) {
    if ((node.getAttribute('part') ?? '').split(/\s+/).includes(name)) return node as unknown as T;
  }
  return null;
}

export const SIZES = ['small', 'medium', 'large'] as const;
export type Size = typeof SIZES[number];

export interface SwitchCombo {
  size: Size;
  checked: boolean;
  disabled: boolean;
  loading: boolean;
  required: boolean;
  invalid: boolean;
  stateLabels: boolean;
}

export const ON_LABEL = 'ON';
export const OFF_LABEL = 'OFF';

/** Mount a switch for a combo, using the authored-attribute channel. */
export async function mountSwitch(combo: SwitchCombo): Promise<any> {
  const attrs: Record<string, any> = { size: combo.size, label: 'Notify' };
  if (combo.checked) attrs.checked = true;
  if (combo.disabled) attrs.disabled = true;
  if (combo.loading) attrs.loading = true;
  if (combo.required) attrs.required = true;
  if (combo.invalid) attrs.invalid = true;
  if (combo.stateLabels) {
    attrs['label-on'] = ON_LABEL;
    attrs['label-off'] = OFF_LABEL;
  }
  return mount<any>('snice-switch', attrs);
}

/**
 * The documented shadow shape for a combo.
 *
 * docs/ai/components/switch.md:
 *  · "`checked` is live; `defaultChecked` reflects the `checked` content attribute."
 *  · "`role="switch"` with `aria-checked`"
 *  · "`readonly type: 'checkbox'`"
 *  · "`loading` blocks interaction and bars validation" — an interaction-blocked
 *    control is a disabled control; combined with the documented `disabled`.
 *  · Parts: "`spinner` - Loading spinner", "`label-on` / `label-off` - State text
 *    inside the track (render when set)", "`label` - Label text",
 *    "`track`", "`thumb`", "`input`".
 *  · "Calculated or authored errors set `aria-invalid`" — `invalid` is authored.
 */
export function expectedShape(combo: SwitchCombo): Shape {
  const blocked = combo.disabled || combo.loading;
  // An enabled, non-loading, unchecked required switch reports valueMissing;
  // that calculated error also drives aria-invalid. `invalid` is the authored
  // half of the same attribute.
  const calculatedInvalid = combo.required && !combo.checked && !blocked;
  return {
    type: 'checkbox',
    checked: combo.checked,
    defaultChecked: combo.checked,
    role: 'switch',
    ariaChecked: String(combo.checked),
    inputType: 'checkbox',
    inputChecked: combo.checked,
    inputDisabled: blocked,
    inputRequired: combo.required,
    ariaInvalid: String(combo.invalid || calculatedInvalid),
    hasTrack: true,
    hasThumb: true,
    hasSpinner: combo.loading,
    hasLabel: true,
    labelText: 'Notify',
    hasStateLabels: combo.stateLabels,
    labelOnText: combo.stateLabels ? ON_LABEL : '',
    labelOffText: combo.stateLabels ? OFF_LABEL : '',
  };
}

/** The same shape, read back off the rendered element. */
export function readShape(el: any): Shape {
  const input = part<HTMLInputElement>(el, 'input');
  const on = part(el, 'label-on');
  const off = part(el, 'label-off');
  return {
    type: el.type,
    checked: el.checked,
    defaultChecked: el.defaultChecked,
    role: input?.getAttribute('role') ?? null,
    ariaChecked: input?.getAttribute('aria-checked') ?? null,
    inputType: input?.getAttribute('type') ?? null,
    inputChecked: !!input?.checked,
    inputDisabled: !!input?.disabled,
    inputRequired: !!input?.required,
    ariaInvalid: input?.getAttribute('aria-invalid') ?? null,
    hasTrack: !!part(el, 'track'),
    hasThumb: !!part(el, 'thumb'),
    hasSpinner: !!part(el, 'spinner'),
    hasLabel: !!part(el, 'label'),
    labelText: text(part(el, 'label')),
    hasStateLabels: !!on && !!off,
    labelOnText: text(on),
    labelOffText: text(off),
  };
}

/** The shadow checkbox: "the interaction control, not a second form field". */
export function input(el: any): HTMLInputElement {
  return part<HTMLInputElement>(el, 'input')!;
}

/**
 * Simulate customer activation the way the shadow checkbox delivers it: the
 * native control flips its own checkedness and fires `change`. Everything the
 * host does downstream is the component's contract, which is what we assert.
 */
export async function activate(el: any): Promise<void> {
  const control = input(el);
  control.checked = !control.checked;
  control.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  await settle(el, 5);
}

export { shadow };
