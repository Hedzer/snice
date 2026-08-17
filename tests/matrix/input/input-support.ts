/**
 * ════════════════════════════════════════════════════════════════════════════
 *  Shared oracle for the snice-input feature-combination matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Same shape as `tests/matrix/table/matrix-utils.ts` and its closest sibling
 * `tests/matrix/textarea/textarea-support.ts`: ONE function derives the
 * expected rendered facts from the documented contract
 * (docs/ai/components/input.md + snice-input.types.ts) and ONE reads the actual
 * facts out of the shadow tree. Every matrix test compares the two objects
 * wholesale, so a failing combo reports every divergence at once.
 *
 * `.ai/fuzzing.md` is binding: expectations come from the DOCS, never from
 * observed output, and a divergence is a FINDING (`it.fails` under a
 * `MATRIX-input-N` id) rather than a weakened assertion.
 *
 * ── Sizing ──────────────────────────────────────────────────────────────────
 *
 * The input is a FORM-ASSOCIATED control with ten types, three appearance
 * axes, seven state switches, a documented dirty-value lifecycle, a full
 * constraint-validation contract, two icon channels and a password reveal.
 * Per `.ai/fuzzing.md` that is the "low hundreds" band — not the table's
 * thousand, not a divider's dozen. The suite crosses:
 *
 *   presentation   variant x size x label x support text        (36)
 *   types          10 documented types x the icon channels      (22)
 *   states         the documented switches, curated vectors     (24)
 *   value          pristine/dirty/reset/restore lifecycle       (16)
 *   validation     required / pattern / range / length / custom (30)
 *   events         input / change / focus / blur / clear        (14)
 *
 * ── What this tier CANNOT judge ─────────────────────────────────────────────
 *
 * happy-dom implements no `attachInternals()`, so a form-associated custom
 * element is invisible to `form.elements` and to `FormData` here no matter what
 * the component does. Validity is still fully judgeable, because the component
 * falls back to the inner native input for it. Form ownership (`element.form`)
 * and the live `labels` collection are component-owned and asserted here; the
 * `FormData` claims belong to a real browser.
 */
import { expect } from 'vitest';
import { wait, removeComponent } from '../../components/test-utils';
import '../../../packages/components/src/input/snice-input';

export { wait, removeComponent };

// ── Dimensions (docs/ai/components/input.md "Properties") ───────────────────

export const TYPES = [
  'text', 'password', 'email', 'number', 'tel', 'url', 'search',
  'date', 'time', 'datetime-local',
] as const;
export const VARIANTS = ['outlined', 'filled', 'underlined'] as const;
export const SIZES = ['small', 'medium', 'large'] as const;

export type InputType = typeof TYPES[number];
export type InputVariant = typeof VARIANTS[number];
export type InputSize = typeof SIZES[number];

/** The documented state switches, each independently settable. */
export const STATE_FLAGS = [
  'disabled', 'readonly', 'loading', 'required', 'invalid', 'clearable',
] as const;
export type StateFlag = typeof STATE_FLAGS[number];

/** How the control gets its supporting text — the documented precedence axis. */
export const SUPPORT_TEXTS = ['none', 'helper', 'error', 'both'] as const;
export type SupportText = typeof SUPPORT_TEXTS[number];

/**
 * The documented ways to give the control an icon.
 *
 *   none      — neither channel
 *   prefix    — `prefix-icon="…"` (the ATTRIBUTE channel: emoji/URL)
 *   suffix    — `suffix-icon="…"`
 *   both      — both attributes
 *   slotted   — `slot="prefix-icon"` / `slot="suffix-icon"` children, which the
 *               doc says OVERRIDE the properties
 */
export const ICON_MODES = ['none', 'prefix', 'suffix', 'both', 'slotted'] as const;
export type IconMode = typeof ICON_MODES[number];

export interface InputCombo {
  type: InputType;
  variant: InputVariant;
  size: InputSize;
  labelled: boolean;
  placeholder: boolean;
  support: SupportText;
  icons: IconMode;
  disabled: boolean;
  readonly: boolean;
  loading: boolean;
  required: boolean;
  invalid: boolean;
  clearable: boolean;
  password: boolean;
  maxlength: number;
  minlength: number;
  pattern: string;
  min: string;
  max: string;
  step: string;
  name: string;
}

export const BASE: InputCombo = {
  type: 'text',
  variant: 'outlined',
  size: 'medium',
  labelled: false,
  placeholder: false,
  support: 'none',
  icons: 'none',
  disabled: false,
  readonly: false,
  loading: false,
  required: false,
  invalid: false,
  clearable: false,
  password: false,
  maxlength: -1,
  minlength: -1,
  pattern: '',
  min: '',
  max: '',
  step: '',
  name: '',
};

export const combo = (patch: Partial<InputCombo> = {}): InputCombo => ({ ...BASE, ...patch });

export const comboId = (c: InputCombo): string =>
  [
    c.type, c.variant, c.size,
    c.icons !== 'none' ? `icons:${c.icons}` : '',
    c.support !== 'none' ? `support:${c.support}` : '',
    c.labelled ? 'labelled' : '',
    c.placeholder ? 'placeholder' : '',
    ...STATE_FLAGS.filter(flag => c[flag]),
    c.password ? 'password-toggle' : '',
    c.maxlength > 0 ? `max:${c.maxlength}` : '',
    c.minlength > 0 ? `min:${c.minlength}` : '',
    c.pattern ? `pattern:${c.pattern}` : '',
  ].filter(Boolean).join('/');

// ── Fixtures ────────────────────────────────────────────────────────────────

export const LABEL = 'Email address';
export const PLACEHOLDER = 'you@example.com';
export const HELPER = 'We never share it.';
export const ERROR = 'That address is not valid';
export const PREFIX_ICON = '🔍';
export const SUFFIX_ICON = '✔';
export const SLOTTED_PREFIX = '★';
export const SLOTTED_SUFFIX = '☆';

/** Attributes for one combo — the documented authored form. */
export function attrsFor(c: InputCombo): Record<string, string> {
  const attrs: Record<string, string> = {
    type: c.type,
    variant: c.variant,
    size: c.size,
  };
  if (c.labelled) attrs.label = LABEL;
  if (c.placeholder) attrs.placeholder = PLACEHOLDER;
  if (c.support === 'helper' || c.support === 'both') attrs['helper-text'] = HELPER;
  if (c.support === 'error' || c.support === 'both') attrs['error-text'] = ERROR;
  if (c.icons === 'prefix' || c.icons === 'both') attrs['prefix-icon'] = PREFIX_ICON;
  if (c.icons === 'suffix' || c.icons === 'both') attrs['suffix-icon'] = SUFFIX_ICON;
  for (const flag of STATE_FLAGS) if (c[flag]) attrs[flag] = '';
  if (c.password) attrs.password = '';
  if (c.maxlength > 0) attrs.maxlength = String(c.maxlength);
  if (c.minlength > 0) attrs.minlength = String(c.minlength);
  if (c.pattern) attrs.pattern = c.pattern;
  if (c.min) attrs.min = c.min;
  if (c.max) attrs.max = c.max;
  if (c.step) attrs.step = c.step;
  if (c.name) attrs.name = c.name;
  return attrs;
}

/** The light DOM a combo authors — only the `slotted` icon mode needs any. */
export function lightDomFor(c: InputCombo): string {
  if (c.icons !== 'slotted') return '';
  return `<span slot="prefix-icon">${SLOTTED_PREFIX}</span>`
    + `<span slot="suffix-icon">${SLOTTED_SUFFIX}</span>`;
}

/**
 * Mount one combo the way authored markup delivers it: every documented
 * attribute and slotted child in place BEFORE connection, so the control's
 * `@ready` pass sees the same element a page would give it.
 */
export async function makeInput(
  c: InputCombo,
  extra: Record<string, string> = {},
): Promise<any> {
  const el = document.createElement('snice-input') as any;
  for (const [name, value] of Object.entries({ ...attrsFor(c), ...extra })) {
    el.setAttribute(name, value);
  }
  const html = lightDomFor(c);
  if (html) el.innerHTML = html;
  document.body.appendChild(el);
  await el.ready;
  await wait(30);
  return el;
}

/** The inner native control — the thing every documented behaviour ends at. */
export function nativeInput(el: any): HTMLInputElement {
  const node = el.shadowRoot?.querySelector('input') as HTMLInputElement | null;
  if (!node) throw new Error('snice-input rendered no native input');
  return node;
}

const collapse = (s: string | null | undefined) => (s ?? '').replace(/\s+/g, ' ').trim();

/** Is a shadow node actually on screen, rather than merely present? */
export function shown(node: Element | null | undefined): boolean {
  if (!node) return false;
  return getComputedStyle(node as HTMLElement).display !== 'none';
}

const partIn = (sr: ShadowRoot, name: string): HTMLElement | null =>
  ([...sr.querySelectorAll('[part]')]
    .find(node => (node.getAttribute('part') ?? '').split(/\s+/).includes(name)) ?? null) as HTMLElement | null;

/** What an icon region actually presents — slotted content wins, per the doc. */
function iconContent(sr: ShadowRoot, name: 'prefix-icon' | 'suffix-icon'): string {
  const region = partIn(sr, name);
  if (!region) return '';
  const slot = region.querySelector('slot') as HTMLSlotElement | null;
  const assigned = slot?.assignedNodes({ flatten: false }) ?? [];
  const slotted = assigned
    .filter(node => !(node instanceof Element) || node.getAttribute('slot') === name)
    .map(node => node.textContent ?? '').join('');
  if (collapse(slotted)) return collapse(slotted);
  return collapse(region.textContent);
}

// ── The oracle ──────────────────────────────────────────────────────────────

export interface InputFacts {
  /** CSS part `input` — "The native input element". */
  hasInputPart: boolean;
  /** CSS part `wrapper` / `container` — the documented styling scaffold. */
  hasWrapper: boolean;
  hasContainer: boolean;
  /** The documented appearance axes, as the classes the stylesheet keys on. */
  sizeClass: boolean;
  variantClass: boolean;
  /** `type` reaches the native control (a revealed password is the exception). */
  nativeType: string;
  /** `label: string` renders a <label> bound to the control by `for`/`id`. */
  labelText: string | null;
  labelBound: boolean;
  /** `placeholder: string`. */
  placeholder: string;
  /**
   * "Disabled controls are omitted… `loading` is inert and barred" — both land
   * on the native control's `disabled`.
   */
  nativeDisabled: boolean;
  /** `readonly` stays successful but is barred from editing. */
  nativeReadonly: boolean;
  /** `required` maps to `valueMissing`, and reaches the native control. */
  nativeRequired: boolean;
  /** Only positive values reach the native proxy (`-1` is the "unset" default). */
  maxlength: number | null;
  minlength: number | null;
  pattern: string | null;
  min: string | null;
  max: string | null;
  step: string | null;
  /** CSS part `spinner` — present exactly when `loading`. */
  hasSpinner: boolean;
  /** CSS part `password-toggle` — `type="password"` AND `password`. */
  hasPasswordToggle: boolean;
  /** "Clear button and password toggle have aria-label". */
  passwordToggleLabelled: boolean;
  clearLabelled: boolean;
  /** CSS part `clear` — `clearable`, with a value, and not barred from editing. */
  clearShown: boolean;
  /** The two documented icon channels, and what each presents. */
  prefixIcon: string;
  suffixIcon: string;
  /** CSS part `error-text` / `helper-text`. */
  supportKind: 'error' | 'helper' | 'none';
  supportText: string;
  /** Helper/error text is the control's one `aria-describedby` target. */
  describedByResolves: boolean;
  /** "`aria-invalid` reflects authored or calculated invalid state". */
  ariaInvalid: string;
  /** `name` and `autocomplete` reach the native proxy. */
  name: string;
}

/**
 * Sentinel for "the docs pin the EXISTENCE of an id, not its spelling".
 */
export const ANY_ID = ' any-id';

/**
 * Is the control BARRED from constraint validation?
 *
 * Documented: "Disabled controls are omitted. `readonly` remains successful but
 * is barred from validation. `loading` is inert and barred while preserving its
 * successful value."
 */
export function barred(c: Pick<InputCombo, 'disabled' | 'readonly' | 'loading'>): boolean {
  return c.disabled || c.readonly || c.loading;
}

/** Documented: `disabled` and `loading` both make the control inert. */
export const interactionDisabled = (c: Pick<InputCombo, 'disabled' | 'loading'>): boolean =>
  c.disabled || c.loading;

/**
 * The CALCULATED invalid state, from the documented constraint mapping:
 * "`required` maps to `valueMissing`", and "Calculated validity drives styling
 * and `aria-invalid`".
 *
 * `minlength`/`maxlength` are deliberately absent: the docs gate `tooShort` and
 * `tooLong` on USER INPUT, which is a history rather than a property vector —
 * the validation slice drives those through real edits.
 */
export function calculatedInvalid(c: InputCombo, value: string): boolean {
  if (barred(c)) return false;
  if (c.required && value === '') return true;
  if (c.pattern && value !== '' && !new RegExp(`^(?:${c.pattern})$`, 'u').test(value)) return true;
  return false;
}

/**
 * Documented: the clear control belongs to a `clearable` control that HAS a
 * value and is still editable — clearing a disabled, loading or readonly field
 * is an edit it is barred from making.
 */
export function clearExpected(c: InputCombo, value: string): boolean {
  return c.clearable && value !== '' && !interactionDisabled(c) && !c.readonly;
}

/** EXPECTED facts, derived from docs/ai/components/input.md only. */
export function expectedFacts(c: InputCombo, value = ''): InputFacts {
  const displayedInvalid = c.invalid || calculatedInvalid(c, value);
  const supportKind = c.support === 'error' || c.support === 'both' ? 'error'
    : c.support === 'helper' ? 'helper' : 'none';
  const passwordToggle = c.type === 'password' && c.password;
  // The doc's own words: a slotted icon "overrides the prefixIcon property".
  const prefix = c.icons === 'slotted' ? SLOTTED_PREFIX
    : (c.icons === 'prefix' || c.icons === 'both') ? PREFIX_ICON : '';
  const suffix = c.icons === 'slotted' ? SLOTTED_SUFFIX
    : (c.icons === 'suffix' || c.icons === 'both') ? SUFFIX_ICON : '';

  return {
    hasInputPart: true,
    hasWrapper: true,
    hasContainer: true,
    sizeClass: true,
    variantClass: true,
    nativeType: c.type,
    labelText: c.labelled ? LABEL : null,
    labelBound: c.labelled,
    placeholder: c.placeholder ? PLACEHOLDER : '',
    nativeDisabled: interactionDisabled(c),
    nativeReadonly: c.readonly,
    nativeRequired: c.required,
    maxlength: c.maxlength > 0 ? c.maxlength : null,
    minlength: c.minlength > 0 ? c.minlength : null,
    pattern: c.pattern || null,
    min: c.min || null,
    max: c.max || null,
    step: c.step || null,
    hasSpinner: c.loading,
    hasPasswordToggle: passwordToggle,
    passwordToggleLabelled: passwordToggle,
    clearLabelled: true,
    clearShown: clearExpected(c, value),
    prefixIcon: prefix,
    suffixIcon: suffix,
    supportKind,
    supportText: supportKind === 'error' ? ERROR : supportKind === 'helper' ? HELPER : '',
    describedByResolves: supportKind !== 'none',
    ariaInvalid: String(displayedInvalid),
    name: c.name,
  };
}

/** ACTUAL facts, read from the rendered shadow tree. */
export function readFacts(el: any): InputFacts {
  const sr = el.shadowRoot as ShadowRoot;
  const native = sr.querySelector('input') as HTMLInputElement | null;
  const label = sr.querySelector('label') as HTMLLabelElement | null;
  const error = partIn(sr, 'error-text');
  const helper = partIn(sr, 'helper-text');
  const support = error ?? helper;
  const clear = partIn(sr, 'clear');
  const toggle = partIn(sr, 'password-toggle');
  const describedBy = native?.getAttribute('aria-describedby') ?? '';
  const classes = (native?.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);

  return {
    hasInputPart: !!partIn(sr, 'input'),
    hasWrapper: !!partIn(sr, 'wrapper'),
    hasContainer: !!partIn(sr, 'container'),
    sizeClass: classes.includes(`input--${el.size}`),
    variantClass: classes.includes(`input--${el.variant}`),
    nativeType: native?.getAttribute('type') ?? '',
    labelText: label ? collapse(label.textContent) : null,
    labelBound: !!(label && native && label.getAttribute('for') === native.id && !!native.id),
    placeholder: native?.getAttribute('placeholder') ?? '',
    nativeDisabled: !!native?.disabled,
    nativeReadonly: !!native?.readOnly,
    nativeRequired: !!native?.required,
    maxlength: native?.hasAttribute('maxlength') ? Number(native.getAttribute('maxlength')) : null,
    minlength: native?.hasAttribute('minlength') ? Number(native.getAttribute('minlength')) : null,
    pattern: native?.getAttribute('pattern') ?? null,
    min: native?.getAttribute('min') ?? null,
    max: native?.getAttribute('max') ?? null,
    step: native?.getAttribute('step') ?? null,
    hasSpinner: !!partIn(sr, 'spinner'),
    hasPasswordToggle: !!toggle,
    passwordToggleLabelled: !!toggle && (toggle.getAttribute('aria-label') ?? '').length > 0,
    clearLabelled: !clear || (clear.getAttribute('aria-label') ?? '').length > 0,
    clearShown: shown(clear),
    prefixIcon: iconContent(sr, 'prefix-icon'),
    suffixIcon: iconContent(sr, 'suffix-icon'),
    supportKind: error ? 'error' : helper ? 'helper' : 'none',
    supportText: collapse(support?.textContent),
    describedByResolves: !!describedBy && !!sr.getElementById?.(describedBy),
    ariaInvalid: native?.getAttribute('aria-invalid') ?? '',
    name: native?.getAttribute('name') ?? '',
  };
}

/**
 * Compare a whole combo against the oracle, reporting EVERY divergence.
 * `skip` exists only so a slice can hold out a key it asserts separately under
 * a finding id — never to weaken an assertion.
 */
export function expectInputMatches(
  el: any,
  c: InputCombo,
  options: { value?: string; skip?: ReadonlyArray<keyof InputFacts> } = {},
): void {
  const actual = readFacts(el);
  const expected = expectedFacts(c, options.value ?? '');
  const skip = options.skip ?? [];
  const problems = (Object.keys(expected) as Array<keyof InputFacts>)
    .filter(key => !skip.includes(key))
    .filter(key => JSON.stringify(actual[key]) !== JSON.stringify(expected[key]))
    .map(key => `${key}: ${JSON.stringify(actual[key])} != ${JSON.stringify(expected[key])}`);
  expect(problems, `combo ${comboId(c)}`).toEqual([]);
}

// ── Interaction ─────────────────────────────────────────────────────────────

export interface Seen { type: string; detail: any }

/** Record the documented events in dispatch order. */
export function collectEvents(
  el: HTMLElement,
  types = ['input-input', 'input-change', 'input-focus', 'input-blur', 'input-clear'],
): Seen[] {
  const seen: Seen[] = [];
  for (const type of types) {
    el.addEventListener(type, (e: Event) => seen.push({ type, detail: (e as CustomEvent).detail }));
  }
  return seen;
}

/**
 * Type into the control the way a customer does: the native value changes and
 * the native `input` event fires. This is what the docs mean by "typing", the
 * thing that dirties the value and gates `tooShort`/`tooLong`.
 */
export function typeInto(el: any, value: string): void {
  const native = nativeInput(el);
  native.value = value;
  native.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
}

/** Commit the current native value — the native `change` event. */
export function commit(el: any, value?: string): void {
  const native = nativeInput(el);
  if (value !== undefined) native.value = value;
  native.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
}

export function focusNative(el: any): void {
  nativeInput(el).dispatchEvent(new FocusEvent('focus', { bubbles: false, composed: true }));
}
export function blurNative(el: any): void {
  nativeInput(el).dispatchEvent(new FocusEvent('blur', { bubbles: false, composed: true }));
}

/** Press a documented shadow control the way a pointer would. */
export function pressPart(el: any, name: string): void {
  const node = partIn(el.shadowRoot as ShadowRoot, name);
  node?.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
}

export const partOf = (el: any, name: string): HTMLElement | null =>
  partIn(el.shadowRoot as ShadowRoot, name);

/** A `<form>` wrapping the given controls, appended to the document. */
export function makeForm(...children: HTMLElement[]): HTMLFormElement {
  const form = document.createElement('form');
  for (const child of children) form.appendChild(child);
  document.body.appendChild(form);
  return form;
}

/** A finding title, per .ai/fuzzing.md. */
export const finding = (id: string, description: string): string => `${id}: ${description}`;
