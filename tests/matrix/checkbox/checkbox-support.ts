/**
 * snice-checkbox matrix oracle.
 *
 * Every expectation cites the line of `docs/ai/components/checkbox.md` it
 * encodes. The checkbox is the most contract-heavy component in this batch — a
 * form-associated control with a native checked/default (dirty) model, a
 * submission contract, constraint validation, and a strictly ordered event
 * triple — so the oracle is split into four documented views over one combo:
 *
 *   · `expectedShape`     — the rendered shadow contract ("CSS Parts",
 *                           "Keyboard/accessibility");
 *   · `expectedEntry`     — the FormData contribution ("Form contract");
 *   · `expectedFlags`     — the constraint-validation flags ("Form contract");
 *   · `EVENT_ORDER`       — the user-event triple ("User events").
 *
 * happy-dom implements no fieldset ancestry and no FormData for form-associated
 * custom elements, so those two are observed one level down through
 * `internals-mock.ts` — see that file for why the substitution is faithful.
 */
import { expect } from 'vitest';
import { mount, settle, shadow, text, type Shape } from '../matrix-utils';
import { internalsFor, submittedEntry, activeFlags } from '../internals-mock';
import '../../../packages/components/src/checkbox/snice-checkbox';

export const SIZES = ['small', 'medium', 'large'] as const;
export type Size = typeof SIZES[number];

/**
 * The four documented checkedness states. `indeterminate` is orthogonal to
 * `checked` in the docs (`setIndeterminate()` "does not uncheck"), so
 * checked+indeterminate is a real, reachable state and not a nonsense cell.
 */
export const STATES = ['off', 'on', 'mixed', 'on-mixed'] as const;
export type State = typeof STATES[number];

/**
 * The documented ways a checkbox stops responding. `disabled` and `fieldset`
 * are the two halves of effective disabledness; `loading` "blocks
 * pointer/programmatic activation but does not change form submission or
 * validation participation" — a distinction the form slice depends on.
 */
export const GATES = ['none', 'disabled', 'loading', 'fieldset'] as const;
export type Gate = typeof GATES[number];

/** The documented activation entry points from "User events". */
export const ENTRIES = ['input', 'host-label', 'click()', 'toggle()'] as const;
export type Entry = typeof ENTRIES[number];

/** DOCUMENTED ("User events"): the exact order of the user-event triple. */
export const EVENT_ORDER = ['input', 'change', 'checkbox-change'] as const;

export const LABEL = 'Weekly digest';

export interface CheckboxCombo {
  size: Size;
  state: State;
  gate: Gate;
  required: boolean;
  invalid: boolean;
}

export const stateChecked = (state: State) => state === 'on' || state === 'on-mixed';
export const stateMixed = (state: State) => state === 'mixed' || state === 'on-mixed';

/** `disabled` and a disabled fieldset are the two halves of "barred". */
export const isBarred = (gate: Gate) => gate === 'disabled' || gate === 'fieldset';
/** Everything that blocks activation, per "loading blocks … activation". */
export const blocksActivation = (gate: Gate) => gate !== 'none';

export interface MountOptions {
  state?: State;
  gate?: Gate;
  size?: Size;
  required?: boolean;
  invalid?: boolean;
  name?: string;
  value?: string;
  label?: string;
  /** Authored `checked` content attribute — the RESET DEFAULT, not live state. */
  defaultChecked?: boolean;
}

/**
 * Mount a checkbox for a combo.
 *
 * `checked` is assigned through the PROPERTY channel because the docs are
 * explicit that the two are different things: "`checked` is current
 * checkedness … `defaultChecked` and the `checked` attribute are the
 * authored/reset default". Authoring live state through the attribute would
 * test the default, not the state.
 */
export async function mountCheckbox(options: MountOptions = {}): Promise<any> {
  const {
    state = 'off', gate = 'none', size = 'medium',
    required = false, invalid = false, name = '', value, label = LABEL,
    defaultChecked = false,
  } = options;

  const attrs: Record<string, any> = { size, label };
  if (defaultChecked) attrs.checked = true;
  if (gate === 'disabled') attrs.disabled = true;
  if (gate === 'loading') attrs.loading = true;
  if (required) attrs.required = true;
  if (invalid) attrs.invalid = true;
  if (name) attrs.name = name;

  // `value` crosses the PROPERTY channel because the docs promise it is "exact,
  // including an empty string", and an empty attribute value is indistinguishable
  // from an absent attribute at the authoring layer.
  const props: Record<string, any> = {};
  if (value !== undefined) props.value = value;

  const el = await mount<any>('snice-checkbox', attrs, '', props);
  // Live state is only forced when the caller asked for one. Assigning
  // `checked` is documented to DIRTY the control ("Every assignment makes it
  // dirty, even an assignment of the existing value"), so a combo that only
  // authors a default must never be touched through this channel — that is the
  // very distinction the dirty-model slice measures.
  if (options.state !== undefined) {
    if (stateChecked(state) !== el.checked) el.checked = stateChecked(state);
    if (stateMixed(state)) el.setIndeterminate();
  }
  if (gate === 'fieldset') el.formDisabledCallback(true);
  await settle(el, 10);
  return el;
}

/**
 * DOCUMENTED shadow contract:
 *   · "CSS Parts: `input` (native checkbox input), `checkbox` (visual
 *     checkbox), `spinner` (loading spinner), `label` (label text)" — the
 *     spinner is the loading affordance, so it exists exactly while loading;
 *   · "Native input semantics, mixed `aria-checked`, associated labels,
 *     `aria-invalid`, and visible focus are preserved";
 *   · "`loading` blocks pointer/programmatic activation" — an activation-blocked
 *     native control is a disabled one;
 *   · "`invalid` is visual/ARIA state only; not constraint validity", and an
 *     unchecked `required` checkbox is genuinely invalid — both surface on the
 *     same `aria-invalid` attribute, and a barred control reports no
 *     constraint error at all ("Unchecked, disabled, effectively
 *     fieldset-disabled … omitted").
 */
export function expectedShape(combo: CheckboxCombo): Shape {
  const checked = stateChecked(combo.state);
  const mixed = stateMixed(combo.state);
  const constraintInvalid = !isBarred(combo.gate) && combo.required && !checked;
  return {
    type: 'checkbox',
    checked,
    indeterminate: mixed,
    hasInput: true,
    hasCheckbox: true,
    hasSpinner: combo.gate === 'loading',
    hasLabel: true,
    labelText: LABEL,
    inputType: 'checkbox',
    inputChecked: checked,
    inputIndeterminate: mixed,
    inputDisabled: blocksActivation(combo.gate),
    inputRequired: combo.required,
    ariaChecked: mixed ? 'mixed' : String(checked),
    ariaInvalid: String(combo.invalid || constraintInvalid),
    sizeHook: `checkbox--${combo.size}`,
  };
}

/** The same shape, read back off the rendered element. */
export function readShape(el: any): Shape {
  const input = part<HTMLInputElement>(el, 'input');
  const box = part(el, 'checkbox');
  const classes = (box?.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);
  return {
    type: el.type,
    checked: el.checked,
    indeterminate: el.indeterminate,
    hasInput: !!input,
    hasCheckbox: !!box,
    hasSpinner: !!part(el, 'spinner'),
    hasLabel: !!part(el, 'label'),
    labelText: text(part(el, 'label')),
    inputType: input?.getAttribute('type') ?? 'none',
    inputChecked: !!input?.checked,
    inputIndeterminate: !!input?.indeterminate,
    inputDisabled: !!input?.disabled,
    inputRequired: !!input?.required,
    ariaChecked: input?.getAttribute('aria-checked') ?? 'none',
    ariaInvalid: input?.getAttribute('aria-invalid') ?? 'none',
    sizeHook: classes.find(c => c.startsWith('checkbox--s')
      || c === 'checkbox--medium' || c === 'checkbox--large') ?? 'none',
  };
}

/**
 * `part()` that honours `~=` token semantics. happy-dom's attribute selector is
 * not token-exact, and this component exposes both `checkbox` and `input` parts
 * on nested nodes; the shared helper would match a superstring.
 */
export function part<T extends Element = HTMLElement>(el: HTMLElement, name: string): T | null {
  for (const node of shadow(el).querySelectorAll('[part]')) {
    if ((node.getAttribute('part') ?? '').split(/\s+/).includes(name)) return node as unknown as T;
  }
  return null;
}

/** The shadow input — the native control every documented activation reaches. */
export function input(el: any): HTMLInputElement {
  return part<HTMLInputElement>(el, 'input')!;
}

/**
 * DOCUMENTED ("Form contract"): "Checked + enabled + non-empty `name`:
 * contributes `[name, value]` to FormData. Unchecked … or empty-name: omitted.
 * `value` is exact, including an empty string; default value is `'on'`. …
 * `loading` … does not change form submission or validation participation."
 *
 * SCOPE. The rule also omits a DISABLED or fieldset-disabled control, but that
 * half is performed by the platform's own entry-list algorithm ("if the field
 * element is disabled, continue"), not by the component: a form-associated
 * custom element keeps its submission value and is skipped at submit time. The
 * DOM tier can only see the component's half — the `setFormValue()` call — so
 * the gate is deliberately NOT part of this oracle, and the disabled omission is
 * asserted where it is real, against a live `FormData` in the browser tier
 * (tests/live/matrix/checkbox). Keeping the gate as an AXIS still buys
 * something: it proves a gate never silently drops the value either.
 */
export function expectedEntry(opts: {
  checked: boolean; name: string; value?: string;
}): [string, string] | null {
  if (!opts.checked) return null;
  if (!opts.name) return null;
  return [opts.name, opts.value ?? 'on'];
}

export function readEntry(el: any): [string, string] | null {
  return submittedEntry(el);
}

/**
 * DOCUMENTED ("Form contract"): "Unchecked `required` sets
 * `validity.valueMissing`, invalidates the form, and blocks submission" and
 * "`setCustomValidity(message)` sets `customError`; pass `''` to clear it".
 *
 * SCOPE. Being barred from constraint validation is NOT the absence of these
 * flags: the platform models it as `willValidate === false`, which is what
 * stops a disabled control from blocking submission. So the flags are gate
 * independent and the barring is asserted through `willValidate`, exactly as
 * the docs list the two facts separately.
 */
export function expectedFlags(opts: {
  checked: boolean; required: boolean; custom: string;
}): string[] {
  const flags: string[] = [];
  if (opts.custom) flags.push('customError');
  if (opts.required && !opts.checked) flags.push('valueMissing');
  return flags.sort();
}

export function readFlags(el: any): string[] {
  return activeFlags(el);
}

export { internalsFor };

/**
 * An ordered recording of the documented event triple.
 *
 * The `input` event is recorded ON THE SHADOW INPUT, not the host. happy-dom
 * does not retarget a composed native `input` across a shadow boundary, so a
 * host-level listener never sees it there; a real browser does, which is what
 * the visual tier's fixture asserts. Order is still one list, so the documented
 * SEQUENCE — the part that could actually regress — is judged exactly.
 */
export function recordEvents(el: any): { seen: string[]; details: any[] } {
  const seen: string[] = [];
  const details: any[] = [];
  input(el).addEventListener('input', () => seen.push('input'));
  el.addEventListener('change', () => seen.push('change'));
  el.addEventListener('checkbox-change', (event: any) => {
    seen.push('checkbox-change');
    details.push(event.detail);
  });
  return { seen, details };
}

/** Drive one documented activation entry point. */
export async function activate(el: any, entry: Entry): Promise<void> {
  switch (entry) {
    case 'input':
      input(el).click();
      break;
    case 'host-label':
      // An associated external label delivers its activation as a click whose
      // original target is the HOST; the component forwards it once.
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true, cancelable: true }));
      break;
    case 'click()':
      el.click();
      break;
    case 'toggle()':
      el.toggle();
      break;
  }
  await settle(el, 20);
}

/** Assert a `checkbox-change` detail matches the documented payload. */
export function expectDetail(detail: any, el: any, label: string): void {
  expect({
    checked: detail?.checked,
    indeterminate: detail?.indeterminate,
    checkbox: detail?.checkbox === el,
  }, label).toEqual({
    checked: el.checked,
    indeterminate: el.indeterminate,
    checkbox: true,
  });
}
