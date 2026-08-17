/**
 * ════════════════════════════════════════════════════════════════════════════
 *  Shared oracle for the snice-date-picker feature-combination matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Same shape as `tests/matrix/table/matrix-utils.ts` and its nearest sibling
 * `tests/matrix/date-time-picker/date-time-picker-support.ts`: expectations are
 * DERIVED from the documented contract (docs/ai/components/date-picker.md plus
 * snice-date-picker.types.ts), a reader pulls the ACTUAL facts out of the
 * rendered control, and a combo collects EVERY violation before asserting so
 * one run tells the whole story instead of dying on the first mismatch.
 *
 * The documented contract this file encodes, clause by clause:
 *
 *   · "`value` is live canonical `YYYY-MM-DD` data or `''`; it is also the
 *     submitted value."
 *   · "`defaultValue` and the `value` attribute are the authored/reset
 *     default." — and the attribute does NOT follow the live value.
 *   · "`format` controls visible/manual text only."
 *   · "Assigning canonical text always works. A valid string in the configured
 *     format also works; numeric `/` and `-` separators remain accepted for
 *     compatibility."
 *   · "Programmatic impossible/malformed dates sanitize to `''`."
 *   · "Manual partial/impossible text stays visible, but live `value` is `''`
 *     and `validity.badInput` is true."
 *   · "Dates are strict: month length and leap-year failures do not roll into
 *     another month."
 *   · "Assigning `value`, typing, selecting, clearing, or browser restoration
 *     dirties live state. Later default changes do not overwrite it."
 *   · "A form reset clears dirtiness and restores `value = defaultValue`.
 *     Reset/default changes/restoration emit no component events."
 *   · Form: "Enabled + non-empty `name`: contributes `[name, canonicalValue]`";
 *     "A named empty/invalid picker contributes `''`"; "Disabled or effectively
 *     disabled by a fieldset: omitted and barred from validation";
 *     "`readonly`: successful in `FormData`, but barred from constraint
 *     validation"; "`loading`: blocks interaction but remains successful and
 *     participates in validation".
 *   · Validity: `required` → `valueMissing`; invalid/partial manual text →
 *     `badInput`; `min`/`max` → `rangeUnderflow`/`rangeOverflow` with
 *     INCLUSIVE boundaries; "malformed constraints are ignored";
 *     `setCustomValidity` → `customError`; "`invalid`/`errorText` are visual
 *     presentation only".
 *   · Events: the eight `datepicker-*` events, all bubbling and composed, and
 *     "Direct property/default changes, reset, and state restoration are
 *     silent."
 *   · CSS parts: `input`, `calendar-toggle`, `clear`, `spinner`, `calendar`,
 *     `helper-text`, `error-text`.
 *   · Accessibility: "`helperText` or `errorText` is referenced exactly once
 *     with `aria-describedby`. Error replaces helper, has `role=\"alert\"`, and
 *     `invalid` mirrors to `aria-invalid`"; "External labels override the
 *     naming fallback: `label`, then `Date`"; "The popup is separately named
 *     `<accessible name> calendar`"; "out-of-range calendar days are disabled".
 *   · `firstDayOfWeek: number = 0; // 0=Sunday`.
 *
 * Deliberately NOT encoded: pixel geometry, the popup's top-layer paint, and
 * anything about how the calendar LOOKS — those belong to
 * `tests/live/matrix/date-picker`, where a real engine runs them.
 */
import { expect } from 'vitest';
import { createComponent, wait } from '../../components/test-utils';
import { exactPart } from '../part-exact';
import {
  installInternalsMock, restoreInternalsMock, internalsFor, activeFlags, submittedEntry,
} from '../internals-mock';
import '../../../packages/components/src/date-picker/snice-date-picker';
import type {
  SniceDatePickerElement, DateFormat, DatePickerSize, DatePickerVariant,
} from '../../../packages/components/src/date-picker/snice-date-picker.types';

export {
  wait, createComponent,
  installInternalsMock, restoreInternalsMock, internalsFor, activeFlags, submittedEntry,
};
export type { SniceDatePickerElement, DateFormat };

/** A Snice render is a microtask plus a queued task. */
export const SETTLE = 30;

// ── Dimensions (docs "API") ─────────────────────────────────────────────────

export const FORMATS: readonly DateFormat[] = [
  'mm/dd/yyyy', 'dd/mm/yyyy', 'yyyy-mm-dd', 'yyyy/mm/dd',
  'dd-mm-yyyy', 'mm-dd-yyyy', 'mmmm dd, yyyy',
];
export const SIZES: readonly DatePickerSize[] = ['small', 'medium', 'large'];
export const VARIANTS: readonly DatePickerVariant[] = ['outlined', 'filled', 'underlined'];

/** The documented CSS parts, in the order the docs list them. */
export const PARTS = [
  'input', 'calendar-toggle', 'clear', 'spinner', 'calendar',
  'helper-text', 'error-text',
] as const;

/** The documented events. */
export const EVENTS = [
  'datepicker-input', 'datepicker-change', 'datepicker-select', 'datepicker-clear',
  'datepicker-focus', 'datepicker-blur', 'datepicker-open', 'datepicker-close',
] as const;

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** The weekday abbreviations, Sunday first — the `firstDayOfWeek = 0` origin. */
export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const pad = (n: number, width = 2) => String(n).padStart(width, '0');

// ── The value dimension ─────────────────────────────────────────────────────

export interface ValueSample {
  /** Id fragment. */
  name: string;
  /** The string assigned to `value` / the `value` attribute. */
  input: string;
  /**
   * The documented parse: the calendar parts, or `null` when the string is
   * "impossible/malformed" and therefore sanitizes to `''`.
   */
  parts: { year: number; month: number; day: number } | null;
  /** Why the sample exists — quoted from the docs where it is a documented rule. */
  why: string;
}

export const VALUES: readonly ValueSample[] = [
  {
    name: 'empty', input: '', parts: null,
    why: 'the documented default; an empty control is optional-valid and submits ""',
  },
  {
    name: 'canonical', input: '2026-03-15', parts: { year: 2026, month: 3, day: 15 },
    why: '"Assigning canonical text always works" — the doc\'s own example value',
  },
  {
    name: 'first-of-month', input: '2026-01-01', parts: { year: 2026, month: 1, day: 1 },
    why: 'the low edge of a month, where a zero-based month slip shows up',
  },
  {
    name: 'last-of-month', input: '2026-01-31', parts: { year: 2026, month: 1, day: 31 },
    why: 'the high edge of a 31-day month',
  },
  {
    name: 'short-month-end', input: '2026-04-30', parts: { year: 2026, month: 4, day: 30 },
    why: 'the last day of a 30-day month — the day before the strictness cliff',
  },
  {
    name: 'leap-day', input: '2024-02-29', parts: { year: 2024, month: 2, day: 29 },
    why: 'a real Gregorian leap day must be accepted',
  },
  {
    name: 'century-leap', input: '2000-02-29', parts: { year: 2000, month: 2, day: 29 },
    why: '2000 is a leap year under the 400-year rule',
  },
  {
    name: 'impossible-feb-30', input: '2026-02-30', parts: null,
    why: '"Dates are strict: month length ... failures do not roll into another month"',
  },
  {
    name: 'impossible-leap', input: '2026-02-29', parts: null,
    why: '"leap-year failures do not roll" — 2026 is not a leap year',
  },
  {
    name: 'impossible-century', input: '1900-02-29', parts: null,
    why: '1900 is NOT a leap year (the 100-year rule), so Feb 29 is impossible',
  },
  {
    name: 'impossible-day-31', input: '2026-04-31', parts: null,
    why: '"month length ... failures do not roll" — April has 30 days',
  },
  {
    name: 'impossible-month', input: '2026-13-01', parts: null,
    why: 'there is no thirteenth month; it must not roll into next January',
  },
  {
    name: 'malformed', input: 'not a date', parts: null,
    why: '"Programmatic impossible/malformed dates sanitize to \'\'"',
  },
  {
    name: 'partial', input: '2026-03', parts: null,
    why: 'a partial canonical string is not a date',
  },
];

export const valueByName = (name: string): ValueSample => {
  const sample = VALUES.find(v => v.name === name);
  if (!sample) throw new Error(`no value sample named "${name}"`);
  return sample;
};

/** "`value` is live canonical `YYYY-MM-DD` data or `''`". */
export function canonical(parts: ValueSample['parts']): string {
  if (!parts) return '';
  return `${pad(parts.year, 4)}-${pad(parts.month)}-${pad(parts.day)}`;
}

/**
 * The visible text, read straight off the format NAME: each format is its own
 * pattern (`dd/mm/yyyy` means two-digit day, slash, two-digit month, slash,
 * four-digit year), except `mmmm dd, yyyy`, whose `mmmm` is the month's name.
 */
export function display(parts: NonNullable<ValueSample['parts']>, format: DateFormat): string {
  const yyyy = pad(parts.year, 4);
  const mm = pad(parts.month);
  const dd = pad(parts.day);
  switch (format) {
    case 'dd/mm/yyyy': return `${dd}/${mm}/${yyyy}`;
    case 'yyyy-mm-dd': return `${yyyy}-${mm}-${dd}`;
    case 'yyyy/mm/dd': return `${yyyy}/${mm}/${dd}`;
    case 'dd-mm-yyyy': return `${dd}-${mm}-${yyyy}`;
    case 'mm-dd-yyyy': return `${mm}-${dd}-${yyyy}`;
    case 'mmmm dd, yyyy': return `${MONTH_NAMES[parts.month - 1]} ${dd}, ${yyyy}`;
    case 'mm/dd/yyyy':
    default: return `${mm}/${dd}/${yyyy}`;
  }
}

/**
 * The "numeric `/` and `-` separators remain accepted for compatibility"
 * clause: the same field order the format names, written with the other
 * separator. Returns `null` for `mmmm dd, yyyy`, which has no numeric form.
 */
export function withSwappedSeparator(
  parts: NonNullable<ValueSample['parts']>,
  format: DateFormat,
): string | null {
  const text = display(parts, format);
  if (format === 'mmmm dd, yyyy') return null;
  return text.includes('/') ? text.replace(/\//g, '-') : text.replace(/-/g, '/');
}

// ── Mounting ────────────────────────────────────────────────────────────────

export interface MountSpec {
  attrs?: Record<string, string | number | boolean>;
  props?: Record<string, unknown>;
  /** Assigned AFTER connection, through the live `value` property. */
  liveValue?: string;
  /** Light-DOM markup wrapped around the picker (labels, forms, fieldsets). */
  wrapper?: (picker: HTMLElement) => HTMLElement;
}

const mounted: HTMLElement[] = [];

export async function mountPicker(spec: MountSpec = {}): Promise<SniceDatePickerElement> {
  let el: SniceDatePickerElement;
  if (spec.wrapper) {
    el = document.createElement('snice-date-picker') as SniceDatePickerElement;
    for (const [key, value] of Object.entries(spec.attrs ?? {})) {
      if (value === false || value == null) continue;
      el.setAttribute(key, value === true ? '' : String(value));
    }
    const root = spec.wrapper(el);
    document.body.appendChild(root);
    mounted.push(root);
    await (el as any).ready;
  } else {
    el = await createComponent<SniceDatePickerElement>('snice-date-picker', spec.attrs ?? {});
    mounted.push(el);
  }
  for (const [key, value] of Object.entries(spec.props ?? {})) {
    (el as any)[key] = value;
  }
  if (spec.liveValue !== undefined) el.value = spec.liveValue;
  await wait(SETTLE);
  return el;
}

/** Tear down everything `mountPicker` created. Call from `afterEach`. */
export function cleanupPickers(): void {
  while (mounted.length) mounted.pop()!.remove();
  document.body.innerHTML = '';
}

// ── Reading the rendered control ────────────────────────────────────────────

export function shadow(el: HTMLElement): ShadowRoot {
  const root = el.shadowRoot;
  if (!root) throw new Error('snice-date-picker has no shadow root');
  return root;
}

/**
 * EXACT part lookup. `[part~="calendar"]` also matches the hyphen-prefixed
 * `calendar-toggle` in happy-dom (see ../part-exact.ts), and the toggle comes
 * FIRST in the shadow tree — so the `~=` selector answered "calendar" with the
 * toggle button, which never carries `hidden`. Every part read here is
 * token-exact.
 */
export const part = exactPart;

export const textOf = (node: Element | null | undefined): string =>
  (node?.textContent ?? '').replace(/\s+/g, ' ').trim();

export const inputOf = (el: HTMLElement): HTMLInputElement | null =>
  part<HTMLInputElement>(el, 'input');

/** Every rendered calendar day button, in grid order. */
export const dayButtons = (el: HTMLElement): HTMLButtonElement[] =>
  [...shadow(el).querySelectorAll<HTMLButtonElement>('[data-date]')];

/** The weekday column headers, left to right. */
export const weekdayHeaders = (el: HTMLElement): string[] =>
  [...shadow(el).querySelectorAll('.weekday')].map(node => textOf(node));

export interface PickerFacts {
  /** The text the user sees in the editable field. */
  visible: string;
  placeholder: string;
  /** The live `value` property. */
  value: string;
  /** The reset default. */
  defaultValue: string;
  /** The `value` content attribute — documented NOT to follow the live value. */
  valueAttribute: string | null;
  /** What the control contributes to a submission. */
  formValue: File | string | FormData | null;
  /** Which validity flags are set, sorted. */
  flags: string[];
  validationMessage: string;
  /** Which documented parts are present. */
  presentParts: string[];
  ariaInvalid: string | null;
  ariaDescribedby: string | null;
  /** The ids in aria-describedby that actually resolve inside the shadow root. */
  describedNodeIds: string[];
  helperRole: string | null;
  errorRole: string | null;
  helperText: string;
  errorText: string;
  inputDisabled: boolean;
  inputReadonly: boolean;
  inputRequired: boolean;
  /** The accessible name of the editable field. */
  inputName: string | null;
  /** The popup's own accessible name — documented as "<name> calendar". */
  calendarName: string | null;
  /**
   * Whether the calendar popup is SHOWN. The element is always in the shadow
   * tree; `hidden` is what opens and closes it, so mere presence of the
   * `calendar` part answers nothing.
   */
  calendarOpen: boolean;
  /**
   * Whether the clear affordance is SHOWN. Same story: the button is always
   * rendered and `display` is what reveals it.
   */
  clearVisible: boolean;
}

export function readFacts(el: SniceDatePickerElement): PickerFacts {
  const root = shadow(el);
  const input = inputOf(el);
  const internals = internalsFor(el);
  const helper = part(el, 'helper-text');
  const error = part(el, 'error-text');
  const calendar = part(el, 'calendar');
  const described = (input?.getAttribute('aria-describedby') ?? '').trim();

  return {
    visible: input?.value ?? '',
    placeholder: input?.placeholder ?? '',
    value: el.value,
    defaultValue: el.defaultValue,
    valueAttribute: el.getAttribute('value'),
    formValue: internals.formValue,
    flags: activeFlags(el),
    validationMessage: internals.validationMessage,
    presentParts: PARTS.filter(name => !!part(el, name)),
    ariaInvalid: input?.getAttribute('aria-invalid') ?? null,
    ariaDescribedby: described || null,
    describedNodeIds: described
      ? described.split(/\s+/).filter(id => !!root.getElementById(id))
      : [],
    helperRole: helper?.getAttribute('role') ?? null,
    errorRole: error?.getAttribute('role') ?? null,
    helperText: textOf(helper),
    errorText: textOf(error),
    inputDisabled: !!input?.disabled,
    inputReadonly: !!input?.readOnly,
    inputRequired: !!input?.required,
    inputName: input?.getAttribute('aria-label') ?? null,
    calendarName: calendar?.getAttribute('aria-label') ?? null,
    calendarOpen: !!calendar && !calendar.hasAttribute('hidden'),
    clearVisible: (() => {
      const clear = part<HTMLElement>(el, 'clear');
      return !!clear && clear.style.display !== 'none';
    })(),
  };
}

// ── Problem collection ──────────────────────────────────────────────────────

export class Problems {
  readonly list: string[] = [];
  say(message: string): void { this.list.push(message); }
  ok(condition: boolean, message: string): boolean {
    if (!condition) this.say(message);
    return condition;
  }
  eq(what: string, actual: unknown, expected: unknown): boolean {
    const same = Object.is(actual, expected)
      || JSON.stringify(actual) === JSON.stringify(expected);
    if (!same) this.say(`${what}: ${JSON.stringify(actual)} != expected ${JSON.stringify(expected)}`);
    return same;
  }
}

export function expectClean(problems: Problems, comboId: string): void {
  expect(problems.list, `combo ${comboId}`).toEqual([]);
}

/** Name a recorded divergence in the test title, the way the policy asks. */
export const finding = (id: string, what: string): string => `${id}: ${what}`;

// ── Oracles ─────────────────────────────────────────────────────────────────

/**
 * The DISPLAY oracle. "`format` controls visible/manual text only" — so a
 * parsed value shows in the configured format while the live `value` and the
 * submitted value stay canonical.
 */
export function displayProblems(
  el: SniceDatePickerElement,
  sample: ValueSample,
  format: DateFormat,
): Problems {
  const problems = new Problems();
  const facts = readFacts(el);

  if (!sample.parts) {
    // "Programmatic impossible/malformed dates sanitize to ''" — assignment
    // through the property/attribute channel leaves nothing behind at all.
    problems.eq('sanitized live value', facts.value, '');
    problems.eq('sanitized visible text', facts.visible, '');
    return problems;
  }

  problems.eq(`visible text under "${format}"`, facts.visible, display(sample.parts, format));
  problems.eq('live value stays canonical', facts.value, canonical(sample.parts));
  return problems;
}

/**
 * The VALIDITY oracle, straight off the docs' mapping.
 *
 *   required with no valid date  -> valueMissing
 *   invalid/partial MANUAL text  -> badInput
 *   before min                   -> rangeUnderflow
 *   after max                    -> rangeOverflow
 *   setCustomValidity(message)   -> customError
 *
 * "`disabled`, effective fieldset disabledness, and `readonly` are barred;
 * `loading` is not." A barred control reports no flags at all.
 */
export interface ValidityContext {
  required: boolean;
  min: string;
  max: string;
  barred: boolean;
  customMessage?: string;
  /**
   * The control holds MANUAL text that could not be parsed. Only manual entry
   * produces `badInput`; a programmatic assignment sanitizes to `''` instead
   * and is merely empty.
   */
  badInput?: boolean;
}

/** A canonical date as a comparable ordinal. Non-canonical text has none. */
function keyOf(text: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!match) return null;
  const [y, m, d] = match.slice(1).map(Number);
  if (m < 1 || m > 12) return null;
  if (d < 1 || d > new Date(y, m, 0).getDate()) return null;
  return (y * 13 + m) * 32 + d;
}

/** "malformed constraints are ignored" — an unparseable min/max is no bound. */
export function constraintKey(text: string): number | null {
  return text ? keyOf(text) : null;
}

export function expectedFlags(value: string, context: ValidityContext): string[] {
  if (context.barred) return [];

  const flags = new Set<string>();
  if (context.customMessage) flags.add('customError');
  if (context.badInput) flags.add('badInput');
  if (context.required && !value) flags.add('valueMissing');

  const key = keyOf(value);
  const min = constraintKey(context.min);
  const max = constraintKey(context.max);
  // "boundaries are inclusive"
  if (key !== null && min !== null && key < min) flags.add('rangeUnderflow');
  if (key !== null && max !== null && key > max) flags.add('rangeOverflow');

  return [...flags].sort();
}

/**
 * The FORM oracle.
 *
 *   "Enabled + non-empty `name`: contributes `[name, canonicalValue]`"
 *   "A named empty/invalid picker contributes `''`"
 *   "Disabled or effectively disabled by a fieldset: omitted"
 *   "`readonly`: successful in `FormData`"
 *   "`loading`: ... remains successful"
 */
export function expectedFormValue(
  value: string,
  context: { disabled: boolean },
): string | null {
  return context.disabled ? null : value;
}

// ── Calendar derivations ────────────────────────────────────────────────────

/** The weekday headers for a `firstDayOfWeek`, in painted order. */
export function expectedWeekdays(firstDayOfWeek: number): string[] {
  const days = [...DAY_NAMES];
  for (let i = 0; i < firstDayOfWeek; i++) days.push(days.shift()!);
  return days;
}

/** Days in a month, honouring the Gregorian leap rules. */
export function daysInMonth(year: number, month1Based: number): number {
  return new Date(year, month1Based, 0).getDate();
}

/**
 * The canonical `data-date` strings a month's grid must render, in order —
 * every day of the month, once, and nothing outside it.
 */
export function expectedMonthDates(year: number, month1Based: number): string[] {
  return Array.from({ length: daysInMonth(year, month1Based) }, (_, i) =>
    `${pad(year, 4)}-${pad(month1Based)}-${pad(i + 1)}`);
}

/**
 * "out-of-range calendar days are disabled", with INCLUSIVE boundaries. A
 * malformed constraint is ignored, so it disables nothing.
 */
export function expectedDisabledDates(
  year: number,
  month1Based: number,
  min: string,
  max: string,
): string[] {
  const minKey = constraintKey(min);
  const maxKey = constraintKey(max);
  return expectedMonthDates(year, month1Based).filter(date => {
    const key = keyOf(date)!;
    return (minKey !== null && key < minKey) || (maxKey !== null && key > maxKey);
  });
}

// ── Interaction ─────────────────────────────────────────────────────────────

/** Type into the field the way a user does: set the text, then fire `input`. */
export async function typeInto(el: SniceDatePickerElement, text: string): Promise<void> {
  const input = inputOf(el);
  if (!input) throw new Error('no part="input" to type into');
  input.value = text;
  input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
  await wait(SETTLE);
}

/** Commit the typed text the way a blur or Enter does. */
export async function commit(el: SniceDatePickerElement): Promise<void> {
  inputOf(el)?.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  await wait(SETTLE);
}

export function press(node: Element | null | undefined, key: string): void {
  node?.dispatchEvent(new KeyboardEvent('keydown', {
    key, bubbles: true, composed: true, cancelable: true,
  }));
}

export function click(node: Element | null | undefined): void {
  node?.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
}

export interface Recorded { type: string; detail: any }

/** Record every documented event, in order. */
export function recordEvents(el: HTMLElement): Recorded[] {
  const seen: Recorded[] = [];
  for (const type of EVENTS) {
    el.addEventListener(type, (event: Event) => {
      seen.push({ type, detail: (event as CustomEvent).detail });
    });
  }
  return seen;
}

/** Just the event names, in order — the shape most assertions want. */
export const namesOf = (seen: Recorded[]): string[] => seen.map(entry => entry.type);
