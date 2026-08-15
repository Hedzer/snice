/**
 * ════════════════════════════════════════════════════════════════════════════
 *  Shared oracle for the snice-textarea feature-combination matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Same shape as `tests/matrix/table/matrix-utils.ts`: ONE function
 * derives the expected rendered facts from the documented contract
 * (docs/ai/components/textarea.md + snice-textarea.types.ts) and ONE reads the
 * actual facts out of the shadow tree. Every matrix test compares the two
 * objects wholesale, so a failing combo reports every divergence at once.
 *
 * `.ai/fuzzing.md` is binding: expectations come from the DOCS, never from
 * observed output, and a divergence is a FINDING (`it.fails` under a
 * `MATRIX-textarea-N` id) rather than a weakened assertion.
 *
 * ── Sizing ──────────────────────────────────────────────────────────────────
 *
 * The textarea is a FORM-ASSOCIATED control with a documented dirty-value
 * lifecycle, a constraint-validation contract, and a label-association
 * contract. Per `.ai/fuzzing.md` that puts it in the "low hundreds" band, not
 * the table's thousand and not a badge's dozen. The suite crosses:
 *
 *   presentation   variant x size x resize                    (36)
 *   states         the five state switches, all 2^5 vectors    (32)
 *   value          pristine/dirty/reset/restore lifecycle      (~24)
 *   validation     required / min / max / customError          (~30)
 *   form           FormData, ownership, fieldsets, labels      (~20)
 *   events         input / change / focus / blur               (~12)
 */
import { expect } from 'vitest';
import { wait, removeComponent } from '../../components/test-utils';
import '../../../packages/components/src/textarea/snice-textarea';

export { wait, removeComponent };

// ── Dimensions (docs/ai/components/textarea.md "Properties") ────────────────

export const VARIANTS = ['outlined', 'filled', 'underlined'] as const;
export const SIZES = ['small', 'medium', 'large'] as const;
export const RESIZES = ['none', 'vertical', 'horizontal', 'both'] as const;

export type TextareaVariant = typeof VARIANTS[number];
export type TextareaSize = typeof SIZES[number];
export type TextareaResize = typeof RESIZES[number];

/** The five documented state switches, each independently settable. */
export const STATE_FLAGS = ['disabled', 'readonly', 'loading', 'required', 'invalid'] as const;
export type StateFlag = typeof STATE_FLAGS[number];

/** How the control gets its supporting text — the documented precedence axis. */
export const SUPPORT_TEXTS = ['none', 'helper', 'error', 'both'] as const;
export type SupportText = typeof SUPPORT_TEXTS[number];

export interface TextareaCombo {
  variant: TextareaVariant;
  size: TextareaSize;
  resize: TextareaResize;
  labelled: boolean;
  placeholder: boolean;
  support: SupportText;
  disabled: boolean;
  readonly: boolean;
  loading: boolean;
  required: boolean;
  invalid: boolean;
  rows: number;
  maxlength: number;
}

export const BASE: TextareaCombo = {
  variant: 'outlined',
  size: 'medium',
  resize: 'vertical',
  labelled: false,
  placeholder: false,
  support: 'none',
  disabled: false,
  readonly: false,
  loading: false,
  required: false,
  invalid: false,
  rows: 3,
  maxlength: -1,
};

export const combo = (patch: Partial<TextareaCombo> = {}): TextareaCombo => ({ ...BASE, ...patch });

export const comboId = (c: TextareaCombo): string =>
  [
    c.variant, c.size, `resize:${c.resize}`, `support:${c.support}`,
    c.labelled ? 'labelled' : '',
    c.placeholder ? 'placeholder' : '',
    ...STATE_FLAGS.filter(flag => c[flag]),
    c.maxlength > 0 ? `max:${c.maxlength}` : '',
    c.rows !== 3 ? `rows:${c.rows}` : '',
  ].filter(Boolean).join('/');

// ── Fixtures ────────────────────────────────────────────────────────────────

export const LABEL = 'Comments';
export const PLACEHOLDER = 'Enter comments';
export const HELPER = 'Keep it short.';
export const ERROR = 'Required field';

/** Attributes for one combo — the documented authored form. */
export function attrsFor(c: TextareaCombo): Record<string, string> {
  const attrs: Record<string, string> = {
    variant: c.variant,
    size: c.size,
    resize: c.resize,
    rows: String(c.rows),
  };
  if (c.labelled) attrs.label = LABEL;
  if (c.placeholder) attrs.placeholder = PLACEHOLDER;
  if (c.support === 'helper' || c.support === 'both') attrs['helper-text'] = HELPER;
  if (c.support === 'error' || c.support === 'both') attrs['error-text'] = ERROR;
  for (const flag of STATE_FLAGS) if (c[flag]) attrs[flag] = '';
  if (c.maxlength > 0) attrs.maxlength = String(c.maxlength);
  return attrs;
}

/**
 * Mount one combo the way authored markup delivers it: every documented
 * attribute in place BEFORE connection, so the control's `@ready` pass sees the
 * same element a page would give it.
 */
export async function makeTextarea(
  c: TextareaCombo,
  extra: Record<string, string> = {},
): Promise<any> {
  const el = document.createElement('snice-textarea') as any;
  for (const [name, value] of Object.entries({ ...attrsFor(c), ...extra })) {
    el.setAttribute(name, value);
  }
  document.body.appendChild(el);
  await el.ready;
  await wait(30);
  return el;
}

/** The inner native control — the thing every documented behaviour ends at. */
export function nativeTextarea(el: any): HTMLTextAreaElement {
  const node = el.shadowRoot?.querySelector('textarea') as HTMLTextAreaElement | null;
  if (!node) throw new Error('snice-textarea rendered no native textarea');
  return node;
}

// ── The oracle ──────────────────────────────────────────────────────────────

export interface TextareaFacts {
  /** CSS part `textarea` — "The native textarea element". */
  hasTextareaPart: boolean;
  /** The classes the stylesheet keys on for the three appearance axes. */
  classes: string[];
  /** `label: string` renders a <label> bound to the control by `for`/`id`. */
  labelText: string | null;
  labelBound: boolean;
  /** `placeholder: string`. */
  placeholder: string;
  /** `rows: number = 3`. */
  rows: number;
  /** `maxlength: number = -1` — only a positive value reaches the control. */
  maxlength: number | null;
  /**
   * "Disabled controls are omitted… `loading` is inert and barred" — both, plus
   * a form-disabled fieldset, land on the native control's `disabled`.
   */
  nativeDisabled: boolean;
  /** `readonly` stays successful but is barred from editing. */
  nativeReadonly: boolean;
  /** `required` maps to `valueMissing`, and reaches the native control. */
  nativeRequired: boolean;
  /** CSS part `spinner` — "Loading spinner", present exactly when `loading`. */
  hasSpinner: boolean;
  /** CSS part `error-text` / `helper-text` — "error replaces helper". */
  supportKind: 'error' | 'helper' | 'none';
  supportText: string;
  /** "Helper/error text has ONE stable aria-describedby target". */
  describedBy: string | null;
  describedByResolves: boolean;
  /** "`aria-invalid` reflects authored or calculated invalid state". */
  ariaInvalid: string;
  /** The character count, shown only when a positive `maxlength` is set. */
  charCount: string | null;
  /** `type` is a native-compatible readonly. */
  type: string;
}

/**
 * EXPECTED facts, derived from docs/ai/components/textarea.md only.
 *
 *  · variant/size/resize — documented properties; the stylesheet selects on the
 *    generated `textarea--*` classes, so a documented value must appear there.
 *  · label — "External and wrapping labels name/focus the real textarea";
 *    an internal label must therefore point AT the control, not sit beside it.
 *  · helper/error — "error replaces helper and is announced once", on "one
 *    stable aria-describedby target".
 *  · disabled/loading — "Disabled controls are omitted. … `loading` is inert
 *    and barred", i.e. both bar interaction.
 *  · readonly — "remains successful but is barred".
 *  · aria-invalid — "reflects authored or calculated invalid state".
 *  · maxlength — the documented character count appears with it.
 */
export function expectedFacts(c: TextareaCombo, value = ''): TextareaFacts {
  const displayedInvalid = c.invalid || calculatedInvalid(c, value);
  const supportKind = c.support === 'error' || c.support === 'both' ? 'error'
    : c.support === 'helper' ? 'helper' : 'none';

  return {
    hasTextareaPart: true,
    classes: [
      'textarea',
      `textarea--${c.size}`,
      `textarea--${c.variant}`,
      `textarea--resize-${c.resize}`,
      ...(displayedInvalid ? ['textarea--invalid'] : []),
      ...(c.loading ? ['textarea--loading'] : []),
    ].sort(),
    labelText: c.labelled ? LABEL : null,
    labelBound: c.labelled,
    placeholder: c.placeholder ? PLACEHOLDER : '',
    rows: c.rows,
    maxlength: c.maxlength > 0 ? c.maxlength : null,
    nativeDisabled: c.disabled || c.loading,
    nativeReadonly: c.readonly,
    nativeRequired: c.required,
    hasSpinner: c.loading,
    supportKind,
    supportText: supportKind === 'error' ? ERROR : supportKind === 'helper' ? HELPER : '',
    describedBy: supportKind === 'none' ? '' : ANY_ID,
    describedByResolves: supportKind !== 'none',
    ariaInvalid: String(displayedInvalid),
    charCount: c.maxlength > 0 ? `${value.length} / ${c.maxlength}` : null,
    type: 'textarea',
  };
}

/**
 * Is the control BARRED from constraint validation?
 *
 * Documented: "Disabled controls are omitted. `readonly` remains successful but
 * is barred. `loading` is inert and barred while preserving the successful
 * value." So all three suppress calculated errors, and `willValidate` is false
 * for all three.
 */
export function barred(c: Pick<TextareaCombo, 'disabled' | 'readonly' | 'loading'>): boolean {
  return c.disabled || c.readonly || c.loading;
}

/**
 * The CALCULATED invalid state, from the documented constraint mapping:
 * "`required` maps to `valueMissing`", and "Calculated errors drive styling,
 * `aria-invalid`, form reporting, and submission blocking."
 *
 * `minlength`/`maxlength` are deliberately absent here: the docs say they "map
 * to `tooShort`/`tooLong` ONLY after customer editing", which is a history, not
 * a property vector — the validation slice drives those through real edits.
 */
export function calculatedInvalid(
  c: Pick<TextareaCombo, 'disabled' | 'readonly' | 'loading' | 'required'>,
  value: string,
): boolean {
  return !barred(c) && c.required && value === '';
}

/**
 * Sentinel for "the docs pin the EXISTENCE of an id, not its spelling".
 * `describedByResolves` carries the part that actually matters — that the id
 * resolves to the support element — so this never softens the assertion.
 */
export const ANY_ID = ' any-id';

/** ACTUAL facts, read from the rendered shadow tree. */
export function readFacts(el: any): TextareaFacts {
  const sr = el.shadowRoot as ShadowRoot;
  const native = sr.querySelector('textarea') as HTMLTextAreaElement | null;
  const label = sr.querySelector('label.label') as HTMLLabelElement | null;
  const error = sr.querySelector('[part~="error-text"]') as HTMLElement | null;
  const helper = sr.querySelector('[part~="helper-text"]') as HTMLElement | null;
  const support = error ?? helper;
  const count = sr.querySelector('.character-count') as HTMLElement | null;
  const describedBy = native?.getAttribute('aria-describedby') ?? '';

  return {
    hasTextareaPart: !!sr.querySelector('[part~="textarea"]'),
    classes: (native?.getAttribute('class') ?? '').split(/\s+/).filter(Boolean).sort(),
    labelText: label ? collapse(label.textContent) : null,
    labelBound: !!(label && native && label.getAttribute('for') === native.id && !!native.id),
    placeholder: native?.getAttribute('placeholder') ?? '',
    rows: Number(native?.getAttribute('rows') ?? -1),
    maxlength: native?.hasAttribute('maxlength') ? Number(native.getAttribute('maxlength')) : null,
    nativeDisabled: !!native?.disabled,
    nativeReadonly: !!native?.readOnly,
    nativeRequired: !!native?.required,
    hasSpinner: !!sr.querySelector('[part~="spinner"]'),
    supportKind: error ? 'error' : helper ? 'helper' : 'none',
    supportText: collapse(support?.textContent),
    describedBy,
    describedByResolves: !!describedBy && !!sr.getElementById?.(describedBy),
    ariaInvalid: native?.getAttribute('aria-invalid') ?? '',
    charCount: count ? collapse(count.textContent) : null,
    type: el.type,
  };
}

const collapse = (s: string | null | undefined) => (s ?? '').replace(/\s+/g, ' ').trim();

/**
 * Compare a whole combo against the oracle, reporting EVERY divergence.
 * `skip` exists only so a slice can hold out a key it asserts separately under
 * a finding id — never to weaken an assertion.
 */
export function expectTextareaMatches(
  el: any,
  c: TextareaCombo,
  options: { value?: string; skip?: ReadonlyArray<keyof TextareaFacts> } = {},
): void {
  const actual = readFacts(el);
  const expected = expectedFacts(c, options.value ?? '');
  const skip = options.skip ?? [];
  const problems = (Object.keys(expected) as Array<keyof TextareaFacts>)
    .filter(key => !skip.includes(key))
    .filter(key => {
      const want = expected[key];
      const got = actual[key];
      // ANY_ID means "some non-empty id"; `describedByResolves` proves it points
      // at the real support element, so nothing is lost by not pinning spelling.
      if (want === ANY_ID) return !(typeof got === 'string' && got.length > 0);
      return JSON.stringify(got) !== JSON.stringify(want);
    })
    .map(key => `${key}: ${JSON.stringify(actual[key])} != ${JSON.stringify(expected[key])}`);
  expect(problems, `combo ${comboId(c)}`).toEqual([]);
}

// ── Interaction ─────────────────────────────────────────────────────────────

export interface Seen { type: string; detail: any }

/** Record the documented events in dispatch order. */
export function collectEvents(
  el: HTMLElement,
  types = ['textarea-input', 'textarea-change', 'textarea-focus', 'textarea-blur'],
): Seen[] {
  const seen: Seen[] = [];
  for (const type of types) {
    el.addEventListener(type, (e: Event) => seen.push({ type, detail: (e as CustomEvent).detail }));
  }
  return seen;
}

/**
 * Type into the control the way a customer does: the native value changes and
 * the native `input` event fires. This is what the docs mean by "customer
 * editing", the condition `tooShort`/`tooLong` are gated on.
 */
export function typeInto(el: any, value: string): void {
  const native = nativeTextarea(el);
  native.value = value;
  native.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
}

/** Commit the current native value — the native `change` event. */
export function commit(el: any, value?: string): void {
  const native = nativeTextarea(el);
  if (value !== undefined) native.value = value;
  native.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
}

/** Focus / blur the inner control, driving the documented focus events. */
export function focusNative(el: any): void {
  nativeTextarea(el).dispatchEvent(new FocusEvent('focus', { bubbles: false, composed: true }));
}
export function blurNative(el: any): void {
  nativeTextarea(el).dispatchEvent(new FocusEvent('blur', { bubbles: false, composed: true }));
}

/** A `<form>` wrapping the given control, appended to the document. */
export function makeForm(...children: HTMLElement[]): HTMLFormElement {
  const form = document.createElement('form');
  for (const child of children) form.appendChild(child);
  document.body.appendChild(form);
  return form;
}

/** The values FormData collects for `name`. */
export function formValues(form: HTMLFormElement, name: string): string[] {
  return new FormData(form).getAll(name).map(String);
}

/** A finding title, per .ai/fuzzing.md. */
export const finding = (id: string, description: string): string => `${id}: ${description}`;
