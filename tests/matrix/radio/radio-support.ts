/**
 * snice-radio matrix oracle.
 *
 * Every expectation cites the line of `docs/ai/components/radio.md` it encodes.
 * The radio is the only component in this batch whose contract is about a SET
 * of elements rather than one: group identity ("Named radios coordinate only
 * when all are equal: non-empty `name`, form owner, document or shadow root"),
 * group-wide requiredness, and one roving tab stop per group. So the harness
 * mounts GROUPS, and the oracles take the group as their subject.
 */
import { expect } from 'vitest';
import { settle, shadow, text, wait, type Shape } from '../matrix-utils';
import { submittedEntry, activeFlags } from '../internals-mock';
import '../../../packages/components/src/radio/snice-radio';

export const SIZES = ['small', 'medium', 'large'] as const;
export type Size = typeof SIZES[number];

export const VARIANTS = ['default', 'block'] as const;
export type Variant = typeof VARIANTS[number];

/**
 * DOCUMENTED: `disabled` and fieldset ancestry are effective disabledness;
 * `loading` "blocks interaction; submission and validation still participate".
 */
export const GATES = ['none', 'disabled', 'loading', 'fieldset'] as const;
export type Gate = typeof GATES[number];

/** DOCUMENTED ("Activation and Events"): the entry points that run activation. */
export const ENTRIES = ['input', 'host-label', 'click()', 'select()'] as const;
export type Entry = typeof ENTRIES[number];

/** DOCUMENTED ("Activation and Events"): `input -> change -> radio-change`. */
export const EVENT_ORDER = ['input', 'change', 'radio-change'] as const;

export const LABEL = 'Pro plan';
export const DESCRIPTION = 'For growing teams';
export const SUFFIX_HTML = '<span slot="suffix">$29/mo</span>';

export interface RadioSpec {
  value?: string;
  name?: string;
  label?: string;
  description?: string;
  variant?: Variant;
  size?: Size;
  gate?: Gate;
  required?: boolean;
  invalid?: boolean;
  /** The authored `checked` content attribute — the reset default. */
  defaultChecked?: boolean;
  suffix?: boolean;
}

/**
 * `part()` with real `~=` token semantics — happy-dom's attribute selector is
 * not token-exact and this component exposes seven parts, several of which are
 * substrings of each other (`radio` / `radio-dot` class names, `label` /
 * `description`).
 */
export function part<T extends Element = HTMLElement>(el: HTMLElement, name: string): T | null {
  for (const node of shadow(el).querySelectorAll('[part]')) {
    if ((node.getAttribute('part') ?? '').split(/\s+/).includes(name)) return node as unknown as T;
  }
  return null;
}

export function input(el: any): HTMLInputElement {
  return part<HTMLInputElement>(el, 'input')!;
}

/** Build one radio element from a spec, unconnected. */
function createRadio(spec: RadioSpec): any {
  const el = document.createElement('snice-radio') as any;
  const attrs: Record<string, any> = {
    name: spec.name ?? 'plan',
    label: spec.label ?? LABEL,
  };
  if (spec.value !== undefined) attrs.value = spec.value;
  if (spec.description) attrs.description = spec.description;
  if (spec.variant) attrs.variant = spec.variant;
  if (spec.size) attrs.size = spec.size;
  if (spec.required) attrs.required = true;
  if (spec.invalid) attrs.invalid = true;
  if (spec.defaultChecked) attrs.checked = true;
  if (spec.gate === 'disabled') attrs.disabled = true;
  if (spec.gate === 'loading') attrs.loading = true;

  for (const [key, value] of Object.entries(attrs)) {
    if (value === true) { el.setAttribute(key, ''); continue; }
    if (value === '' && key !== 'value') continue;
    el.setAttribute(key, String(value));
  }
  if (spec.suffix) el.innerHTML = SUFFIX_HTML;
  return el;
}

/**
 * Mount a group of radios inside a container.
 *
 * The container is a `<form>` by default, because form ownership is one of the
 * three documented halves of group identity and the default case should be the
 * documented one. `container: 'div'` mounts a group with no form owner, which
 * is the other identity the docs name ("document or shadow root").
 */
export async function mountGroup(
  specs: RadioSpec[],
  options: { container?: 'form' | 'div'; host?: ParentNode } = {},
): Promise<any[]> {
  const parent = document.createElement(options.container === 'div' ? 'div' : 'form');
  (options.host ?? document.body).appendChild(parent);

  const radios = specs.map(createRadio);
  for (const radio of radios) parent.appendChild(radio);
  for (const radio of radios) await radio.ready;
  // Fieldset ancestry is delivered the way the browser delivers it; happy-dom
  // implements none — see tests/matrix/internals-mock.ts.
  specs.forEach((spec, i) => {
    if (spec.gate === 'fieldset') radios[i].formDisabledCallback(true);
  });
  await wait(20);
  return radios;
}

/** One radio, in its own form — the single-member case. */
export async function mountRadio(spec: RadioSpec = {}): Promise<any> {
  const [radio] = await mountGroup([spec]);
  return radio;
}

export const isBarred = (gate: Gate) => gate === 'disabled' || gate === 'fieldset';
export const blocksActivation = (gate: Gate) => gate !== 'none';

export interface RadioCombo {
  variant: Variant;
  size: Size;
  gate: Gate;
  checked: boolean;
  required: boolean;
  invalid: boolean;
  description: boolean;
}

/**
 * DOCUMENTED ("Presentation" > CSS parts, "Accessibility"):
 *   · parts `input`, `radio`, `dot`, `spinner`, `content`, `label`,
 *     `description` — the spinner is the loading affordance and replaces the
 *     dot; `content` and `description` belong to the `block` presentation, and
 *     `description` needs a description to show;
 *   · "Native radio input drives keyboard and AT behavior";
 *   · "`aria-invalid` reflects explicit or calculated group invalidity", and
 *     `invalid` "is presentation only";
 *   · `loading` "blocks interaction", which on a native control is disabledness.
 *
 * The calculated half of `aria-invalid` is the group rule: a required group
 * with nothing checked is invalid, and a barred member reports no calculated
 * error of its own.
 */
export function expectedShape(combo: RadioCombo): Shape {
  const calculatedInvalid = !isBarred(combo.gate) && combo.required && !combo.checked;
  const isBlock = combo.variant === 'block';
  return {
    type: 'radio',
    checked: combo.checked,
    hasInput: true,
    hasRadio: true,
    hasDot: combo.gate !== 'loading',
    hasSpinner: combo.gate === 'loading',
    hasContent: isBlock,
    hasLabel: true,
    labelText: LABEL,
    hasDescription: isBlock && combo.description,
    inputType: 'radio',
    inputChecked: combo.checked,
    inputDisabled: blocksActivation(combo.gate),
    inputRequired: combo.required,
    ariaChecked: String(combo.checked),
    ariaInvalid: String(combo.invalid || calculatedInvalid),
    sizeHook: `radio--${combo.size}`,
  };
}

export function readShape(el: any): Shape {
  const control = part<HTMLInputElement>(el, 'input');
  const box = part(el, 'radio');
  const classes = (box?.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);
  return {
    type: el.type,
    checked: el.checked,
    hasInput: !!control,
    hasRadio: !!box,
    hasDot: !!part(el, 'dot'),
    hasSpinner: !!part(el, 'spinner'),
    hasContent: !!part(el, 'content'),
    hasLabel: !!part(el, 'label'),
    labelText: text(part(el, 'label')),
    hasDescription: !!part(el, 'description'),
    inputType: control?.getAttribute('type') ?? 'none',
    inputChecked: !!control?.checked,
    inputDisabled: !!control?.disabled,
    inputRequired: !!control?.required,
    ariaChecked: control?.getAttribute('aria-checked') ?? 'none',
    ariaInvalid: control?.getAttribute('aria-invalid') ?? 'none',
    sizeHook: classes.find(c => SIZES.some(s => c === `radio--${s}`)) ?? 'none',
  };
}

/**
 * DOCUMENTED ("Native Form Contract"): "A selected, enabled, named radio
 * contributes one `FormData` entry. Default `value` is `'on'`; explicit
 * `value=""` is preserved."
 *
 * SCOPE (same as the checkbox): omitting a DISABLED control from the entry list
 * is the platform's own submission algorithm, not something the component does
 * to its `setFormValue()`. The DOM tier judges the component's half; the
 * disabled omission is asserted against a real `FormData` in the browser tier.
 */
export function expectedEntry(opts: {
  checked: boolean; name: string; value?: string;
}): [string, string] | null {
  if (!opts.checked) return null;
  if (!opts.name) return null;
  return [opts.name, opts.value ?? 'on'];
}

export const readEntry = (el: any) => submittedEntry(el);

/**
 * DOCUMENTED ("Native Form Contract"): "If any member has `required`, every
 * member has `valueMissing` until any member is checked. A disabled `required`
 * member still establishes that group requirement. A checked disabled member
 * satisfies requiredness … `setCustomValidity()` is per member; `required`
 * validity is group-wide. `invalid` is presentation only and does not create
 * `customError` or `valueMissing`."
 */
export function expectedGroupFlags(group: Array<{
  required: boolean; checked: boolean; custom?: string;
}>): string[][] {
  const groupRequired = group.some(member => member.required);
  const anyChecked = group.some(member => member.checked);
  return group.map(member => {
    const flags: string[] = [];
    if (member.custom) flags.push('customError');
    if (groupRequired && !anyChecked) flags.push('valueMissing');
    return flags.sort();
  });
}

export const readFlags = (el: any) => activeFlags(el);

/** The roving tab stop, read off a group in tree order. */
export function tabStops(group: any[]): number[] {
  return group.map(radio => input(radio).tabIndex);
}

/**
 * DOCUMENTED ("Keyboard"): "Checked enabled member is the tab stop; otherwise
 * first enabled member." Exactly one member of a group is tabbable.
 */
export function expectedTabStops(group: Array<{ gate?: Gate; checked?: boolean }>): number[] {
  const enabled = group.map((m, i) => ({ i, m })).filter(({ m }) => !blocksActivation(m.gate ?? 'none'));
  const selected = enabled.find(({ m }) => m.checked);
  const tabbable = (selected ?? enabled[0])?.i;
  return group.map((_, i) => (i === tabbable ? 0 : -1));
}

export interface Recorder { seen: string[]; details: any[] }

/**
 * Record the documented event triple in dispatch order.
 *
 * `input` is recorded on the SHADOW INPUT: happy-dom does not retarget a
 * composed native `input` across a shadow boundary, so a host listener never
 * sees it there. The ORDER — the part that can regress — is still one list.
 */
export function recordEvents(el: any): Recorder {
  const seen: string[] = [];
  const details: any[] = [];
  input(el).addEventListener('input', () => seen.push('input'));
  el.addEventListener('change', () => seen.push('change'));
  el.addEventListener('radio-change', (event: any) => {
    seen.push('radio-change');
    details.push(event.detail);
  });
  return { seen, details };
}

/** Record `radio-change` across a whole group — "Only the newly selected radio emits". */
export function recordGroup(group: any[]): Recorder[] {
  return group.map(recordEvents);
}

export async function activate(el: any, entry: Entry): Promise<void> {
  switch (entry) {
    case 'input':
      input(el).click();
      break;
    case 'host-label':
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true, cancelable: true }));
      break;
    case 'click()':
      el.click();
      break;
    case 'select()':
      el.select();
      break;
  }
  await settle(el, 20);
}

/** Press an arrow key on a radio, the way a focused native control receives it. */
export async function arrow(el: any, key: string): Promise<void> {
  input(el).dispatchEvent(new KeyboardEvent('keydown', {
    key, bubbles: true, composed: true, cancelable: true,
  }));
  await wait(20);
}

/** DOCUMENTED detail payload: `{ checked: true, value, radio }`. */
export function expectDetail(detail: any, el: any, label: string): void {
  expect({
    checked: detail?.checked,
    value: detail?.value,
    radio: detail?.radio === el,
  }, label).toEqual({ checked: true, value: el.value, radio: true });
}

/**
 * The text the `suffix` slot actually projects.
 *
 * `textContent` of a shadow subtree does not include slotted light DOM, so the
 * only way to assert "the suffix reached the rendered radio" is through the
 * slot's assigned nodes. An absent slot returns `[]` — a slot that does not
 * exist projects nothing, which is the failure this distinguishes from an empty
 * suffix.
 */
export function shadowSuffixAssigned(el: HTMLElement): string[] {
  const slot = shadow(el).querySelector<HTMLSlotElement>('slot[name="suffix"]');
  if (!slot) return [];
  return [...slot.assignedNodes({ flatten: true })]
    .map(node => (node.textContent ?? '').trim())
    .filter(Boolean);
}

/** Which member of a group is checked, as a boolean vector. */
export const selection = (group: any[]) => group.map(radio => radio.checked);
